"""Schema validation and parsing service.

Performs verification checks on candidate data and supports memory-efficient streaming.
"""

import json
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional, Tuple
from pydantic import ValidationError

from models.candidate import Candidate
from utils.logger import get_logger

logger = get_logger(__name__)

# Default location for the JSON schema in the project workspace
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SCHEMA_PATH = (
    PROJECT_ROOT.parent
    / "[PUB] India_runs_data_and_ai_challenge"
    / "India_runs_data_and_ai_challenge"
    / "candidate_schema.json"
)


def load_schema(schema_path: Optional[Path] = None) -> Dict[str, Any]:
    """Loads the candidate schema file.

    Args:
        schema_path: Path to the candidate_schema.json.

    Returns:
        Dict[str, Any]: Loaded JSON schema dictionary.
    """
    target_path = schema_path or DEFAULT_SCHEMA_PATH
    try:
        with open(target_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"Schema file not found at {target_path}. Using fallback schema.")
        return {}
    except Exception as e:
        logger.error(f"Failed to read schema file at {target_path}: {e}")
        raise


def validate_candidate(candidate_data: Dict[str, Any]) -> Tuple[bool, Optional[List[str]]]:
    """Validates candidate data against the Candidate Pydantic structure.

    Args:
        candidate_data: Dict payload representing a single candidate.

    Returns:
        Tuple[bool, Optional[List[str]]]: (is_valid, list of error messages if invalid)
    """
    try:
        # Pydantic v2 validation
        Candidate.model_validate(candidate_data)
        return True, None
    except ValidationError as e:
        error_messages = []
        for error in e.errors():
            loc_path = " -> ".join(str(loc) for loc in error["loc"])
            error_messages.append(f"[{loc_path}]: {error['msg']} (input: {error.get('input')})")
        return False, error_messages


def parse_candidate(candidate_data: Dict[str, Any]) -> Optional[Candidate]:
    """Parses a dictionary into a validated Candidate object.

    Logs errors and returns None if validation fails.

    Args:
        candidate_data: Dict payload representing a single candidate.

    Returns:
        Optional[Candidate]: Candidate instance, or None if validation fails.
    """
    is_valid, errors = validate_candidate(candidate_data)
    if not is_valid:
        logger.warning(
            f"Candidate validation failed for ID {candidate_data.get('candidate_id', 'UNKNOWN')}. "
            f"Errors: {errors}"
        )
        return None

    try:
        return Candidate.model_validate(candidate_data)
    except Exception as e:
        logger.error(f"Unexpected error constructing Candidate object: {e}")
        return None


def parse_batch(
    candidates_stream: Generator[Dict[str, Any], None, None]
) -> Generator[Tuple[Optional[Candidate], Optional[List[str]]], None, None]:
    """Yields parsed Candidates and error messages from a stream of dictionaries.

    Ensures constant O(1) memory usage during ingestion of large records.

    Args:
        candidates_stream: Generator yielding dictionaries.

    Yields:
        Tuple[Optional[Candidate], Optional[List[str]]]: (Candidate object or None, Error list or None)
    """
    for index, data in enumerate(candidates_stream):
        try:
            is_valid, errors = validate_candidate(data)
            if not is_valid:
                logger.warning(
                    f"Record at sequence index {index} failed schema verification: {errors}"
                )
                yield None, errors
            else:
                candidate_obj = Candidate.model_validate(data)
                yield candidate_obj, None
        except Exception as e:
            err_msg = f"Critical structure parsing exception at sequence index {index}: {e}"
            logger.error(err_msg)
            yield None, [err_msg]
