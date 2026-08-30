from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    gemini_api_key: str
    environment: str = "development"
    max_file_size_mb: int = 10
    upload_rate_limit: str = "5/hour"
    tesseract_cmd: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    return Settings()
