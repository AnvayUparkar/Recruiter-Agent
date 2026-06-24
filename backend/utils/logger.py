"""Centralized logging system for the candidate ranking system.

Provides functions to initialize logging and fetch named loggers conforming to a consistent layout.
"""

import logging
import sys
from pathlib import Path
from typing import Optional

# Standardized log format
LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging(
    log_level: str = "INFO", log_dir: Optional[Path] = None
) -> None:
    """Sets up root logging with a stdout console handler and an optional file handler.

    Creates log directories if they do not exist and handles errors gracefully.

    Args:
        log_level: Logging severity level (e.g., 'DEBUG', 'INFO').
        log_dir: Directory where log files are stored.
    """
    # Parse log level
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Clear existing handlers to prevent duplicates
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    # Create formatter
    formatter = logging.Formatter(fmt=LOG_FORMAT, datefmt=DATE_FORMAT)

    # 1. Console Handler — force UTF-8 so ₹/emoji symbols don't crash on Windows (cp1252)
    import io
    try:
        is_testing = "pytest" in sys.modules or "unittest" in sys.modules
        if sys.stdout and not getattr(sys.stdout, "closed", False) and hasattr(sys.stdout, "buffer") and sys.stdout.buffer and not is_testing:
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)
            console_handler = logging.StreamHandler(sys.stdout)
        else:
            console_handler = logging.StreamHandler(sys.stdout)
    except Exception:
        console_handler = logging.StreamHandler(sys.stdout)

    console_handler.setFormatter(formatter)
    console_handler.setLevel(numeric_level)
    root_logger.addHandler(console_handler)



    # 2. File Handler (if log_dir is provided)
    if log_dir:
        try:
            log_path = Path(log_dir)
            log_path.mkdir(parents=True, exist_ok=True)
            log_file = log_path / "backend.log"

            # Create file handler with UTF-8 encoding
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setFormatter(formatter)
            file_handler.setLevel(numeric_level)
            root_logger.addHandler(file_handler)
        except Exception as e:
            # Output setup error to stderr but allow the app to continue running with console logs
            sys.stderr.write(f"Warning: Failed to initialize file logger: {e}\n")


def get_logger(name: str) -> logging.Logger:
    """Returns a logger instance with the specified name.

    Args:
        name: Name of the module requesting logging.

    Returns:
        A standard logging.Logger instance.
    """
    return logging.getLogger(name)
