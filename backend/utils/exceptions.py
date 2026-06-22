"""Custom system exceptions for the candidate ranking platform.

Defines core exception types to handle validation, file access, and parsing failures.
"""


class CandidateSystemError(Exception):
    """Base exception for all system-related errors in the candidate ranking backend."""

    pass


class DatasetNotFoundError(CandidateSystemError):
    """Raised when a candidate dataset (.jsonl, .jsonl.gz) or schema file is missing."""

    pass


class MalformedRecordError(CandidateSystemError):
    """Raised when a record has syntax or structural corruption (e.g., malformed JSON)."""

    pass


class CandidateValidationError(CandidateSystemError):
    """Raised when a candidate record fails Pydantic validation rules."""

    pass


class SchemaMismatchError(CandidateSystemError):
    """Raised when the schema definitions differ from the ingested candidate layout."""

    pass
