import logging

from openai import OpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

_SYSTEM_PROMPT = (
    "You are an expert AI operational assistant for emergency dispatchers and field commanders. "
    "Given structured incident data, provide: "
    "1) A concise 2-sentence Situational Summary. "
    "2) A Tactical Action Recommendation (suggested cordon perimeter in meters, required PPE/equipment, "
    "and immediate safety hazard protocols). Be direct, factual, and actionable."
)


def is_enabled() -> bool:
    return bool(settings.llm_api_key)


def _client() -> OpenAI:
    return OpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
        timeout=settings.llm_timeout_seconds,
    )


def generate_incident_summary(prompt: str) -> str | None:
    """Generate a short AI summary for an incident.

    Returns None when the LLM is disabled (no API key configured) or the
    request fails for any reason — callers fall back to a template summary
    rather than surfacing an error, since this is a "nice to have" feature
    that should never block incident handling.
    """
    if not is_enabled():
        return None

    try:
        response = _client().chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=settings.llm_max_tokens,
            temperature=0.3,
        )
    except Exception:
        logger.exception("LLM summary generation failed")
        return None

    choice = response.choices[0] if response.choices else None
    if choice is None or choice.message is None:
        return None
    return choice.message.content
