"""Search Result model definition.

Defines the structure for representing a candidate vector matching outcome.
"""

from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    """Pydantic model representing a single candidate match returned from vector search."""

    candidate_id: str = Field(
        ...,
        description="Target candidate identifier.",
    )
    similarity_score: float = Field(
        ...,
        ge=-1.0,
        le=1.0,
        description="Calculated cosine similarity score between query and candidate.",
    )
    rank: int = Field(
        ...,
        ge=1,
        description="Rank position in the retrieval list.",
    )
    distance: float = Field(
        ...,
        description="Raw vector distance returned by FAISS index (usually inner product).",
    )
    search_time_ms: float = Field(
        ...,
        ge=0.0,
        description="Query search duration in milliseconds.",
    )

    model_config = {
        "populate_by_name": True,
    }
