from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 480

    database_url: str = "postgresql+psycopg://emergency:emergency@localhost:5433/emergency_db"
    redis_url: str = "redis://localhost:6380/0"

    llm_api_key: str = ""
    llm_base_url: str = "https://integrate.api.nvidia.com/v1"
    llm_model: str = "meta/llama-3.2-11b-vision-instruct"
    llm_max_tokens: int = 250
    llm_timeout_seconds: int = 20

    cors_origins: list[str] = ["http://localhost:5173"]

    enable_scheduler: bool = True
    alert_check_interval_minutes: int = 5

    enable_email_notifications: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "alerts@emergency-response.local"
    smtp_use_tls: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
