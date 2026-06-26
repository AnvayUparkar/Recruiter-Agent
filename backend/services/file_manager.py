"""File Manager service for dataset tracking and validation.

Handles verification of dataset files, supports compression formats, and
performs memory-efficient operations like line counting on large documents.
"""

import gzip
import os
from pathlib import Path
from typing import Optional

from utils.exceptions import DatasetNotFoundError
from utils.logger import get_logger

logger = get_logger(__name__)

# Search heuristic defaults for workspace datasets
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CHALLENGE_DIR = (
    PROJECT_ROOT.parent
    / "[PUB] India_runs_data_and_ai_challenge"
    / "India_runs_data_and_ai_challenge"
)


class FileManager:
    """Manages workspace dataset directories and file properties."""

    def __init__(self, data_dir: Optional[Path] = None, schema_path: Optional[Path] = None):
        """Initializes the FileManager with target directory paths.

        Args:
            data_dir: Root directory for datasets.
            schema_path: Specific location path of candidate_schema.json.
        """
        # Load from config or find relative to root
        self.data_dir = data_dir or PROJECT_ROOT / "data"
        self.schema_path = schema_path or DEFAULT_CHALLENGE_DIR / "candidate_schema.json"

    def get_candidate_file(self, filename: str = "sample_candidates.json") -> Path:
        """Resolves the candidate dataset file path.

        Looks in config data folders and search fallback locations.

        Args:
            filename: Target file name (e.g. candidates.jsonl, candidates.jsonl.gz).

        Returns:
            Path: Resolved absolute path.

        Raises:
            DatasetNotFoundError: If the file cannot be located.
        """
        # Check standard config folder first
        candidates_path = self.data_dir / "candidates" / filename
        if candidates_path.is_file():
            return candidates_path

        # Check raw config data directory
        candidates_path = self.data_dir / filename
        if candidates_path.is_file():
            return candidates_path

        # Check project sibling workspace folder
        sibling_path = DEFAULT_CHALLENGE_DIR / filename
        if sibling_path.is_file():
            logger.info(f"Resolved dataset file at sibling location: {sibling_path}")
            return sibling_path

        # Check project root directory
        root_path = PROJECT_ROOT / filename
        if root_path.is_file():
            return root_path

        err_msg = f"Candidate file '{filename}' could not be located in workspace."
        logger.error(err_msg)
        raise DatasetNotFoundError(err_msg)

    def get_schema_file(self) -> Path:
        """Resolves the schema file path.

        Returns:
            Path: Resolved schema path.

        Raises:
            DatasetNotFoundError: If the schema file does not exist.
        """
        if self.schema_path.is_file():
            return self.schema_path

        # Sibling search fallback
        sibling_schema = PROJECT_ROOT.parent / "candidate_schema.json"
        if sibling_schema.is_file():
            return sibling_schema

        err_msg = f"Schema file not found at {self.schema_path}"
        logger.error(err_msg)
        raise DatasetNotFoundError(err_msg)

    def file_exists(self, file_path: Path) -> bool:
        """Indicates if the target file exists.

        Args:
            file_path: The file path to verify.
        """
        return file_path.is_file()

    def get_file_size(self, file_path: Path) -> int:
        """Returns the size of the file in bytes.

        Args:
            file_path: Target path to evaluate.

        Returns:
            int: File size in bytes.

        Raises:
            DatasetNotFoundError: If the file does not exist.
        """
        if not self.file_exists(file_path):
            raise DatasetNotFoundError(f"File not found: {file_path}")
        return file_path.stat().st_size

    def count_lines(self, file_path: Path) -> int:
        """Counts the total lines in a text or gzipped file using constant O(1) memory.

        Args:
            file_path: Target path to scan.

        Returns:
            int: Number of lines.

        Raises:
            DatasetNotFoundError: If the file does not exist.
        """
        if not self.file_exists(file_path):
            raise DatasetNotFoundError(f"File not found for line count: {file_path}")

        logger.info(f"Counting lines in: {file_path}")
        is_gz = file_path.suffix == ".gz" or file_path.name.endswith(".jsonl.gz")

        line_count = 0
        chunk_size = 1024 * 1024  # 1MB buffer

        open_func = gzip.open if is_gz else open
        mode = "rb"  # read binary for fast parsing of character flags

        try:
            with open_func(file_path, mode) as f:
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    line_count += chunk.count(b"\n")
            logger.info(f"Line counting completed. Lines found: {line_count}")
            return line_count
        except Exception as e:
            logger.error(f"Error counting lines in {file_path}: {e}")
            raise

    def validate_file(self, file_path: Path) -> bool:
        """Checks if the file is supported and exists.

        Args:
            file_path: File path to validate.

        Returns:
            bool: True if valid.

        Raises:
            DatasetNotFoundError: If the file is missing.
            ValueError: If the extension is not supported.
        """
        if not self.file_exists(file_path):
            raise DatasetNotFoundError(f"Target file does not exist: {file_path}")

        valid_extensions = {".jsonl", ".json", ".gz"}
        if file_path.suffix not in valid_extensions and not file_path.name.endswith(".jsonl.gz"):
            raise ValueError(
                f"Unsupported file format: {file_path.suffix}. Must be .jsonl, .json, or .jsonl.gz"
            )

        return True
