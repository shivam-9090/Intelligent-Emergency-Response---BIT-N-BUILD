import logging
import math
import re

from app.models.incident import Incident

_DISTANCE_THRESHOLD_KM = 0.5
logger = logging.getLogger(__name__)

_CLOSE_DISTANCE_THRESHOLD_KM = 0.5
_EXTENDED_DISTANCE_THRESHOLD_KM = 1.5
_TIME_WINDOW_SECONDS = 3600
_SEMANTIC_SIMILARITY_THRESHOLD = 0.20


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


def find_duplicate(new_incident: Incident, candidates: list[Incident]) -> Incident | None:
    """Identify duplicate or related reports using spatio-temporal and semantic text matching.

    - Matches if within 0.5km and 1 hour window of the same incident type.
    - Extended match: if within 1.5km and 1 hour with high text similarity (>= 0.20).
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

        # 1. Direct proximity duplicate (< 0.5km)
        if distance <= _CLOSE_DISTANCE_THRESHOLD_KM:
            return candidate

        # 2. Extended radius with semantic text confirmation (0.5km - 1.5km)
        if distance <= _EXTENDED_DISTANCE_THRESHOLD_KM:
            similarity = compute_text_similarity(new_incident.description, candidate.description)
            if similarity >= _SEMANTIC_SIMILARITY_THRESHOLD:
                logger.info(
                    "Identified duplicate incident across %0.2f km with text similarity %0.2f",
                    distance,
                    similarity,
                )
                return candidate

    return None
