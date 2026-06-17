import json
from typing import Any, List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Personalized Wealth Management & Goal Tracker"
    
    # Database
    DATABASE_URL: str = "postgresql://wealth_admin:secure_password_here@localhost/wealth_db"
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Market Data
    ALPHA_VANTAGE_API_KEY: str = ""
    YAHOO_ENABLED: bool = True
    
    # Security / JWT
    JWT_SECRET_KEY: str = "super_secret_jwt_signing_key_change_me_in_prod"
    JWT_REFRESH_SECRET_KEY: str = "super_secret_refresh_token_signing_key_change_me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SECURE_COOKIES: bool = False
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:5173",
        "https://localhost",
        "https://personalizedwealthmanagement.vercel.app",
        "https://personalizedwealthmanagement-vinuthna021.vercel.app"
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
