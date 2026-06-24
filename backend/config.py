"""Configuration management module for the candidate ranking system.

Loads settings from environment variables and exposes class-based configurations.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

# Project root directory resolved dynamically
BASE_DIR = Path(__file__).resolve().parent


class BaseConfig:
    """Base configuration settings shared across environments."""

    # Security
    SECRET_KEY: str = os.environ.get(
        "SECRET_KEY", "change_me_default_secret_key_38472948"
    )
    JWT_SECRET: str = os.environ.get(
        "JWT_SECRET", "change_me_jwt_secret_4892348"
    )
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")

    # Database
    MONGO_URI: str = os.environ.get("MONGO_URI", "mongodb://localhost:27017/recruiter_agent")

    # Server settings
    HOST: str = os.environ.get("HOST", "0.0.0.0")
    PORT: int = int(os.environ.get("PORT", 5000))
    DEBUG: bool = False
    TESTING: bool = False

    # Logging
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")

    # Application directories
    DATA_PATH: Path = Path(os.environ.get("DATA_PATH", BASE_DIR / "data"))
    OUTPUT_PATH: Path = Path(os.environ.get("OUTPUT_PATH", BASE_DIR / "outputs"))
    INDEX_PATH: Path = Path(
        os.environ.get("INDEX_PATH", BASE_DIR / "data" / "indexes")
    )


    # Main candidate dataset path
    DATASET_PATH: Path = Path(os.environ.get(
        "DATASET_PATH",
        BASE_DIR.parent / "[PUB] India_runs_data_and_ai_challenge" / "India_runs_data_and_ai_challenge" / "candidates.jsonl"
    ))


class DevelopmentConfig(BaseConfig):
    """Development configurations with verbose logging and debug mode."""

    DEBUG: bool = True
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "DEBUG")


class ProductionConfig(BaseConfig):
    """Production configurations enforcing strict security and standard logging."""

    DEBUG: bool = False
    TestingConfig = False
    # Ensure SECRET_KEY is set in environment or default to something secure
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "")


class TestingConfig(BaseConfig):
    """Testing configurations isolated from database/production storage."""

    DEBUG: bool = True
    TESTING: bool = True
    LOG_LEVEL: str = "DEBUG"
    # Use nested test subdirectories for sandbox execution
    DATA_PATH: Path = BASE_DIR / "tests" / "data"
    OUTPUT_PATH: Path = BASE_DIR / "tests" / "outputs"
    INDEX_PATH: Path = BASE_DIR / "tests" / "data" / "indexes"
    DATASET_PATH: Path = DATA_PATH / "candidates.jsonl"


# Map environment names to config objects
config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}

# Alias for backward compatibility with older imports
Config = BaseConfig

