from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    secret_key: str = "change-me"

    database_url: str = "postgresql+psycopg://emergency:emergency@localhost:5433/emergency_db"
    redis_url: str = "redis://localhost:6380/0"

    llm_api_key: str = ""

    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
