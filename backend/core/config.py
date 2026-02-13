from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./shift.db"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    SECRET_KEY: str = "change-me-in-production"

    model_config = {"env_file": ".env"}


settings = Settings()
