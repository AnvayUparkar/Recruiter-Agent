"""Vector Index Metadata model definition.

Defines the structure for tracking vector index metrics, parameters, and parameters.
"""

from datetime import datetime, timezone
from pydantic import BaseModel, Field


class VectorIndexMetadata(BaseModel):
    """Pydantic model representing state configuration metadata for a FAISS index."""

    index_name: str = Field(
        ...,
        description="Name of the active index file.",
    )
    index_type: str = Field(
        ...,
        description="FAISS index type representation (e.g., IndexHNSWFlat, IndexFlatIP).",
    )
    embedding_dimension: int = Field(
        ...,
        ge=1,
        description="Vector space dimension size.",
    )
    candidate_count: int = Field(
        ...,
        ge=0,
        description="Total candidates indexed in vector space.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the index was built.",
    )
    last_updated: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the index was last modified.",
    )
    model_name: str = Field(
        ...,
        description="Underlying embedding model name (e.g., BAAI/bge-large-en-v1.5).",
    )
    faiss_version: str = Field(
        ...,
        description="Installed FAISS module version.",
    )
    storage_size_mb: float = Field(
        0.0,
        ge=0.0,
        description="Storage footprint size in MB on disk.",
    )

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": (),
    }
