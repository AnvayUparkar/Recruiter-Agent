"""Candidate Loader service for stream-based dataset parsing.

Main interface for streaming records from JSONL and Gzipped JSONL files,
performing inline validation, and returning validated Pydantic instances.
"""

import gzip
import json
from pathlib import Path
from typing import Generator, List, Optional, Tuple

from models.candidate import Candidate
from models.ingestion_result import IngestionResult
from services.schema_validator import validate_candidate
from utils.exceptions import DatasetNotFoundError, MalformedRecordError
from utils.logger import get_logger

logger = get_logger(__name__)


class CandidateLoader:
    """Handles stream loading, file unpacking, and JSON record deserialization."""

    def __init__(self, file_manager=None):
        """Initializes the loader with a FileManager instance.

        Args:
            file_manager: FileManager instance to check path sizes.
        """
        # Lazy import to avoid circular dependency
        from services.file_manager import FileManager
        self.file_manager = file_manager or FileManager()

    def iterate_raw_records(self, file_path: Path) -> Generator[Tuple[int, str], None, None]:
        """Iterates over raw string lines in a dataset file.

        Args:
            file_path: Dataset file path.

        Yields:
            Tuple[int, str]: (line_number, raw_string_line)

        Raises:
            DatasetNotFoundError: If the file is missing.
        """
        if not self.file_manager.file_exists(file_path):
            raise DatasetNotFoundError(f"Cannot stream missing file: {file_path}")

        is_gz = file_path.suffix == ".gz" or file_path.name.endswith(".jsonl.gz")
        open_func = gzip.open if is_gz else open
        mode = "rt" if is_gz else "r"
        encoding = "utf-8"

        try:
            with open_func(file_path, mode, encoding=encoding) as f:
                for line_number, line in enumerate(f, start=1):
                    yield line_number, line
        except FileNotFoundError:
            raise DatasetNotFoundError(f"File vanished during iteration: {file_path}")
        except Exception as e:
            logger.error(f"IO error iterating dataset at {file_path}: {e}")
            raise

    def iterate_candidates(self, file_path: Path) -> Generator[IngestionResult, None, None]:
        """Streams parsed and validated IngestionResult instances.

        Args:
            file_path: Dataset file path.

        Yields:
            IngestionResult: Parsing outcome details for each line or element.
        """
        if file_path.suffix == ".json":
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if not isinstance(data, list):
                    raise ValueError("JSON file must contain a list of candidates.")
                for idx, record in enumerate(data, start=1):
                    is_valid, errors = validate_candidate(record)
                    if not is_valid:
                        errors = errors or []
                        yield IngestionResult(
                            record_number=idx,
                            success=False,
                            error_message="Schema validation failed",
                            validation_errors=errors,
                        )
                        continue
                    try:
                        candidate_obj = Candidate.model_validate(record)
                        yield IngestionResult(
                            record_number=idx,
                            success=True,
                            candidate=candidate_obj,
                        )
                    except Exception as e:
                        yield IngestionResult(
                            record_number=idx,
                            success=False,
                            error_message=f"Model creation exception: {e}",
                            validation_errors=[str(e)],
                        )
            except Exception as e:
                logger.error(f"Error reading JSON dataset at {file_path}: {e}")
                yield IngestionResult(
                    record_number=1,
                    success=False,
                    error_message=f"JSON load exception: {e}",
                    validation_errors=[str(e)],
                )
            return

        for line_number, line in self.iterate_raw_records(file_path):
            stripped_line = line.strip()
            if not stripped_line:
                continue

            try:
                # 1. Deserialization
                data = json.loads(stripped_line)
            except json.JSONDecodeError as e:
                err_msg = f"Line {line_number} is not valid JSON: {e}"
                logger.warning(err_msg)
                yield IngestionResult(
                    record_number=line_number,
                    success=False,
                    error_message="Malformed JSON",
                    validation_errors=[str(e)],
                )
                continue

            # 2. Schema compliance validation
            is_valid, errors = validate_candidate(data)
            if not is_valid:
                errors = errors or []
                yield IngestionResult(
                    record_number=line_number,
                    success=False,
                    error_message="Schema validation failed",
                    validation_errors=errors,
                )
                continue

            # 3. Model construction
            try:
                candidate_obj = Candidate.model_validate(data)
                yield IngestionResult(
                    record_number=line_number,
                    success=True,
                    candidate=candidate_obj,
                )
            except Exception as e:
                yield IngestionResult(
                    record_number=line_number,
                    success=False,
                    error_message=f"Model creation exception: {e}",
                    validation_errors=[str(e)],
                )

    def load_candidate(self, candidate_id: str, file_path: Path) -> Optional[Candidate]:
        """Searches the dataset and extracts a specific candidate.

        Returns:
            Optional[Candidate]: Candidate instance if found, or None.
        """
        if file_path.suffix == ".json":
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, list):
                    for record in data:
                        if record.get("candidate_id") == candidate_id:
                            return Candidate.model_validate(record)
            except Exception as e:
                logger.warning(
                    f"Error matching record candidate {candidate_id} from JSON: {e}"
                )
            return None

        for line_number, line in self.iterate_raw_records(file_path):
            # Optimisation: Use substring search before calling expensive json loads
            if candidate_id in line:
                try:
                    data = json.loads(line.strip())
                    if data.get("candidate_id") == candidate_id:
                        return Candidate.model_validate(data)
                except Exception as e:
                    logger.warning(
                        f"Error matching record candidate {candidate_id} at line {line_number}: {e}"
                    )
        return None

    def load_batch(self, file_path: Path, batch_size: int = 500) -> List[Candidate]:
        """Loads a batch of valid candidates from the dataset.

        Args:
            file_path: Dataset path.
            batch_size: Number of records to return.

        Returns:
            List[Candidate]: List of parsed Candidate instances.
        """
        candidates = []
        for result in self.iterate_candidates(file_path):
            if result.success and result.candidate:
                candidates.append(result.candidate)
                if len(candidates) >= batch_size:
                    break
        return candidates

    def get_candidate_by_id(self, candidate_id: str, file_path: Path) -> Optional[Candidate]:
        """Retrieves a candidate by ID (delegates search to load_candidate).

        Args:
            candidate_id: Unique candidate ID string.
            file_path: Dataset path.
        """
        return self.load_candidate(candidate_id, file_path)

    def count_candidates(self, file_path: Path) -> int:
        """Determines total lines count or record count in the dataset file.

        Args:
            file_path: Dataset path.
        """
        if file_path.suffix == ".json":
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return len(data)
            except Exception as e:
                logger.error(f"Error counting candidates in JSON: {e}")
                return 0
        return self.file_manager.count_lines(file_path)

    def yield_valid_candidates(self, file_path: Path) -> Generator[Candidate, None, None]:
        """Yields only successfully parsed Candidate objects.

        Args:
            file_path: Dataset path.
        """
        for result in self.iterate_candidates(file_path):
            if result.success and result.candidate:
                yield result.candidate

    def yield_invalid_candidates(self, file_path: Path) -> Generator[Tuple[int, List[str]], None, None]:
        """Yields line indexes and error descriptions for invalid records.

        Args:
            file_path: Dataset path.
        """
        for result in self.iterate_candidates(file_path):
            if not result.success:
                yield result.record_number, result.validation_errors
