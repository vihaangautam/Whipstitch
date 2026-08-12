from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    API_KEY: str = "whipstitch-dev-key-12345"
    TENANT_DEFAULT_ID: str = "trifid_media"

    # Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "whipstitch_db"
    POSTGRES_USER: str = "whipstitch_user"
    POSTGRES_PASSWORD: str = "whipstitch_password"
    DATABASE_URL: str = (
        "postgresql+asyncpg://whipstitch_user:whipstitch_password@localhost:5432/whipstitch_db"
    )

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://localhost:6379/0"

    # Temporal
    TEMPORAL_HOST: str = "localhost:7233"
    TEMPORAL_NAMESPACE: str = "default"
    TEMPORAL_TASK_QUEUE: str = "whipstitch-inbound-queue"

    # External APIs
    GROQ_API_KEY: str = "mock-groq-key"
    GEMINI_API_KEY: str = "mock-gemini-key"
    HUBSPOT_SANDBOX_API_KEY: str = "mock-hubspot-key"
    APOLLO_API_KEY: str = "mock-apollo-key"
    MOCK_APOLLO: bool = True

    # Alerting
    SLACK_WEBHOOK_URL: str = "https://hooks.slack.com/services/mock/webhook/test"


settings = Settings()
