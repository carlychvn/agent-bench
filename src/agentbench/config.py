from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AGENTBENCH_", env_file=".env", extra="ignore")

    api_url: str = "http://localhost:8000"
    cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = "postgresql+psycopg://agentbench:agentbench@localhost:5432/agentbench"


@lru_cache
def get_settings() -> Settings:
    return Settings()
