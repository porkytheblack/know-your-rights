import os
from pydantic_settings import BaseSettings

from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "know-your-rights"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "labor_rights_db"
    
    # Auth & Security
    SECRET_KEY: str = "dev_secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    JWT_SECRET_KEY: str = "change_this_secret"
    ADMIN_MASTER_KEY: str = "admin_registration_key"

    # External APIs
    OPENAI_API_KEY: str
    TAVILY_API_KEY: Optional[str] = None
    SERPER_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore unknown fields in .env

settings = Settings()
