from functools import lru_cache
from pathlib import Path
from typing import Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    supabase_url: str = ""
    supabase_project_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    resend_api_key: str = ""
    frontend_url: str = "http://localhost:3000"

    @model_validator(mode="after")
    def merge_supabase_url(self) -> Self:
        # Accept either SUPABASE_URL or SUPABASE_PROJECT_URL in .env
        url = self.supabase_url or self.supabase_project_url
        if url != self.supabase_url:
            return self.model_copy(update={"supabase_url": url})
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
