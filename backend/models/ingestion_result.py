"""Ingestion result model definition.

Lightweight dataclass container capturing the outcome of candidate record parsing.
"""

from dataclasses import dataclass, field
from typing import List, Optional

from models.candidate import Candidate


@dataclass
class IngestionResult:
    """Dataclass holding status outcomes for individual candidate parses."""

    record_number: int
    success: bool
    candidate: Optional[Candidate] = None
    error_message: Optional[str] = None
    validation_errors: List[str] = field(default_factory=list)
