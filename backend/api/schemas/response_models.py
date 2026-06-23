"""Response Schemas — Phase 14: Production API & Recruiter Suite.

Defines Pydantic response models for standardizing API outputs.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RequirementMatch(BaseModel):
    """Specific skill requirement matching details."""

    name: str = Field(..., description="Name of the skill requirement.")
    matched: bool = Field(..., description="Whether the candidate possesses this skill.")
    importance: str = Field(..., description="Importance tier from parsed JD.")


class ExplanationResponse(BaseModel):
    """Detailed recruiter explanation payload for a candidate."""

    candidate_id: str = Field(..., description="Unique candidate identifier.")
    fit_verdict: str = Field(..., description="Categorical verdict (e.g. Strong Match).")
    summary: str = Field(..., description="Concise text explanation paragraph.")
    strengths: List[str] = Field(..., description="Highlights of candidate strengths.")
    weaknesses: List[str] = Field(..., description="Potential gaps and mismatches.")
    matched_requirements: List[RequirementMatch] = Field(
        ..., description="JD requirements met by the candidate."
    )
    missing_requirements: List[str] = Field(
        ..., description="JD requirements missing from the candidate's profile."
    )
    reasoning: str = Field(..., description="Detailed step-by-step logic text.")


class CandidateRankInfo(BaseModel):
    """Individual ranked candidate listing returned in batch rank response."""

    candidate_id: str = Field(..., description="Candidate ID.")
    rank: int = Field(..., description="1-indexed rank position.")
    final_score: float = Field(..., description="Calibrated final score.")
    confidence: float = Field(..., description="System score confidence.")
    verdict: str = Field(..., description="Short fit classification.")
    summary: str = Field(..., description="Brief recruiter summary.")
    score: float = Field(..., description="Calibrated score alias.")
    fit_verdict: str = Field(..., description="Short fit classification alias.")
    reasoning: str = Field(..., description="Brief recruiter reasoning alias.")
    profile: Dict[str, Any] = Field(default_factory=dict, description="Full candidate profile information.")
    redrob_signals: Dict[str, Any] = Field(default_factory=dict, description="Full candidate behavioral signals.")
    score_details: Dict[str, Any] = Field(default_factory=dict, description="Full breakdown of composite scores.")


class RankingResponse(BaseModel):
    """API wrapper for batch ranking endpoints."""

    job_title: str = Field(..., description="Parsed job title.")
    total_candidates_evaluated: int = Field(..., description="Input candidate count.")
    ranked_candidates: List[CandidateRankInfo] = Field(
        ..., description="Ordered list of evaluated candidates."
    )
    applied_weights: Dict[str, float] = Field(
        ..., description="Active weight mapping used during scoring."
    )
    processing_time_ms: float = Field(..., description="Pipeline processing duration.")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Execution and evaluation metadata."
    )
    status: str = Field("success", description="Status code indicator.")
    total_ranked: int = Field(..., description="Number of ranked candidates.")
    candidates: List[CandidateRankInfo] = Field(
        ..., description="Ordered list of evaluated candidates for compatibility."
    )


class MetricsResponse(BaseModel):
    """Response containing system performance and evaluation statistics."""

    generated_at: str = Field(..., description="Evaluation timestamp.")
    ndcg_at_5: float = Field(..., description="NDCG@5 quality score.")
    precision_at_5: float = Field(..., description="Precision@5 matching rate.")
    mrr: float = Field(..., description="Mean Reciprocal Rank.")
    system_latency_avg_ms: float = Field(..., description="Mean search latency.")
    total_queries_logged: int = Field(..., description="Total API queries logged.")


class HealthResponse(BaseModel):
    """Application health status indicators."""

    status: str = Field("healthy", description="Status code indicator.")
    model_loaded: bool = Field(True, description="Whether sentence transformer models are cached.")
    faiss_loaded: bool = Field(True, description="Whether FAISS vector stores are ready.")
    bm25_loaded: bool = Field(True, description="Whether BM25 tokenizers are loaded.")
    candidate_count: int = Field(..., description="Total database candidate count.")
