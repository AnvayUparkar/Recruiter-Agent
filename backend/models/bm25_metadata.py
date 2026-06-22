"""BM25 Index Metadata model definition.

Defines the structure for tracking lexical index states, configurations, and parameters.
"""

from datetime import datetime, timezone
from pydantic import BaseModel, Field


class Bm25Metadata(BaseModel):
    """Pydantic model representing state configuration metadata for a BM25 index."""

    index_name: str = Field(
        ...,
        description="Name of the active BM25 index file.",
    )
    algorithm: str = Field(
        ...,
        description="The active BM25 variant algorithm used (e.g., BM25Okapi, BM25Plus).",
    )
    candidate_count: int = Field(
        ...,
        ge=0,
        description="Total candidates indexed in lexical space.",
    )
    token_count: int = Field(
        ...,
        ge=0,
        description="Total number of tokens in the corpus vocabulary.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the index was built.",
    )
    last_updated: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the index was last modified.",
    )
    average_document_length: float = Field(
        0.0,
        ge=0.0,
        description="Average word/token count per document in corpus.",
    )
    storage_size_mb: float = Field(
        0.0,
        ge=0.0,
        description="Storage footprint size in MB on disk.",
    )
    version: str = Field(
        "1.0.0",
        description="Schema version of the lexical indexing rules.",
    )

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": (),
    }
