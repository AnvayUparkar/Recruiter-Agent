"""Embedding Metadata model definition.

Defines the structure for metadata associated with generated embeddings.
"""

from enum import Enum
from pydantic import BaseModel, Field


class EmbeddingSourceType(str, Enum):
    """Source classification types for generated embeddings to support multi-view structures."""

    JD = "JD"
    CANDIDATE = "Candidate"
    SKILL = "Skill"
    CAREER = "Career"
    BEHAVIORAL = "Behavioral"
    MARKET = "Market"
    SUMMARY = "Summary"


class EmbeddingMetadata(BaseModel):
    """Pydantic model representing auditing metadata for an embedding vector."""

    model_name: str = Field(
        ...,
        description="Name of the model used to generate the embedding (e.g., BAAI/bge-large-en-v1.5).",
    )
    embedding_dimension: int = Field(
        ...,
        ge=1,
        description="Dimensionality of the vector space.",
    )
    generation_time: float = Field(
        ...,
        ge=0.0,
        description="Compute duration in seconds to generate this embedding.",
    )
    token_count: int = Field(
        ...,
        ge=0,
        description="Total tokens processed in the source text.",
    )
    version: str = Field(
        "1.0.0",
        description="Schema version of the embedding generation rules.",
    )
    source_type: EmbeddingSourceType = Field(
        ...,
        description="Categorical source type indicating what this embedding represents.",
    )

    model_config = {
        "use_enum_values": True,
        "populate_by_name": True,
        "protected_namespaces": (),
    }
