import logging

from openai import APIError, OpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

_SYSTEM_PROMPT = (
    "You are an assistant for emergency dispatchers. Given structured incident data, "
    "write a concise 2-3 sentence situational summary and one practical recommendation "
    "for the response team. Be factual, do not invent details not present in the input."
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
    except (APIError, TimeoutError, ConnectionError):
        logger.exception("LLM summary generation failed")
        return None

    choice = response.choices[0] if response.choices else None
    if choice is None or choice.message is None:
        return None
    return choice.message.content
