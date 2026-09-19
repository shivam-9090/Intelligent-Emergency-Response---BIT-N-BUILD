import logging
import math
import re
from dataclasses import dataclass

from app.models.incident import Incident

_DISTANCE_THRESHOLD_KM = 0.5
logger = logging.getLogger(__name__)

_CLOSE_DISTANCE_THRESHOLD_KM = 0.5
_EXTENDED_DISTANCE_THRESHOLD_KM = 1.5
_TIME_WINDOW_SECONDS = 3600
_SEMANTIC_SIMILARITY_THRESHOLD = 0.20
_AUTO_MERGE_SIMILARITY_THRESHOLD = 0.62


@dataclass(frozen=True)
class DuplicateMatch:
    incident: Incident
    score: float
    reason: str


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def compute_text_similarity(text1: str | None, text2: str | None) -> float:
    """Calculate semantic text similarity using token TF-IDF cosine and character n-gram overlap."""
    if not text1 or not text2:
        return 0.0

    t1 = text1.strip().lower()
    t2 = text2.strip().lower()
    if t1 == t2:
        return 1.0

    # Try Scikit-learn TF-IDF cosine similarity
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        vec_word = TfidfVectorizer(ngram_range=(1, 1), stop_words="english")
        try:
            m_word = vec_word.fit_transform([t1, t2])
            sim_word = float(cosine_similarity(m_word[0:1], m_word[1:2])[0][0])
        except Exception:
            sim_word = 0.0

        vec_char = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 4))
        m_char = vec_char.fit_transform([t1, t2])
        sim_char = float(cosine_similarity(m_char[0:1], m_char[1:2])[0][0])

        return round(max(sim_word, sim_char), 3)
    except Exception:
        pass

    # Jaccard token fallback
    tokens1 = set(re.findall(r"\w+", t1))
    tokens2 = set(re.findall(r"\w+", t2))
    if not tokens1 or not tokens2:
        return 0.0
    intersection = len(tokens1 & tokens2)
    union = len(tokens1 | tokens2)
    return round(intersection / union, 3) if union > 0 else 0.0


def find_duplicate_match(new_incident: Incident, candidates: list[Incident]) -> DuplicateMatch | None:
    """Identify duplicate or related reports using spatio-temporal and semantic text matching.

    Auto-merges only when both location/time and language support the match.
    This intentionally avoids treating two nearby same-type emergencies as one event.
    """
    if new_incident.latitude is None or new_incident.longitude is None:
        return None

    for candidate in candidates:
        if candidate.incident_type != new_incident.incident_type:
            continue
        if candidate.latitude is None or candidate.longitude is None:
            continue

        seconds_apart = abs((new_incident.reported_at - candidate.reported_at).total_seconds())
        if seconds_apart > _TIME_WINDOW_SECONDS:
            continue

        distance = _haversine_km(
            new_incident.latitude, new_incident.longitude, candidate.latitude, candidate.longitude
        )

        if distance > _EXTENDED_DISTANCE_THRESHOLD_KM:
            continue

        similarity = compute_text_similarity(new_incident.description, candidate.description)
        proximity_score = max(0.0, 1 - (distance / _EXTENDED_DISTANCE_THRESHOLD_KM))
        score = round((similarity * 0.75) + (proximity_score * 0.25), 3)
        if similarity >= _AUTO_MERGE_SIMILARITY_THRESHOLD:
            reason = f"same type within {distance:.2f} km; semantic similarity {similarity:.2f}"
            logger.info("Identified duplicate incident: %s", reason)
            return DuplicateMatch(candidate, score, reason)

    return None


def find_duplicate(new_incident: Incident, candidates: list[Incident]) -> Incident | None:
    """Backward-compatible duplicate lookup for existing callers."""
    match = find_duplicate_match(new_incident, candidates)
    return match.incident if match else None
