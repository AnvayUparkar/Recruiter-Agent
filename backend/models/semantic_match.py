"""Semantic Match model definition.

Defines the structure for matching results between candidate profiles and job descriptions.
"""

from typing import List
from pydantic import BaseModel, Field


class SemanticMatch(BaseModel):
    """Pydantic model representing the outcome of a semantic matching calculation."""

    candidate_id: str = Field(
        ...,
        description="The candidate identifier compared.",
    )
    similarity_score: float = Field(
        ...,
        ge=-1.0,
        le=1.0,
        description="The calculated cosine similarity score between candidate and JD embeddings.",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score in the calculated match based on metadata quality.",
    )
    matching_dimensions: List[str] = Field(
        default_factory=list,
        description="List of capability dimensions (e.g. retrieval, ranking, LLM) that aligned.",
    )
    matching_reasons: List[str] = Field(
        default_factory=list,
        description="Natural language explanations/justifications for the similarity match.",
    )

    model_config = {
        "populate_by_name": True,
    }
