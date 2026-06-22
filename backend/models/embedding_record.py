"""Embedding Record model definition.

Defines the structure for stored vector embeddings.
"""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
from models.embedding_metadata import EmbeddingMetadata


class EmbeddingRecord(BaseModel):
    """Pydantic model representing a generated embedding and its auditing parameters."""

    candidate_id: str = Field(
        ...,
        description="The target identifier (e.g. CAND_XXXXXXX or job identity).",
    )
    embedding: List[float] = Field(
        ...,
        description="The high-dimensional floating-point vector list.",
    )
    embedding_dimension: int = Field(
        ...,
        ge=1,
        description="Dimensionality of the vector space matching model output size.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when this embedding record was created.",
    )
    model_name: str = Field(
        ...,
        description="Name of the model used to generate this embedding.",
    )
    text_hash: str = Field(
        ...,
        description="SHA-256 hash of the source text to detect contents changes and handle cache reuse.",
    )
    metadata: EmbeddingMetadata = Field(
        ...,
        description="Audit metadata detailing token count, compute time, and source classification.",
    )

    model_config = {
         "populate_by_name": True,
         "protected_namespaces": (),
    }
