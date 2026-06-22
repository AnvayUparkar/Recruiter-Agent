"""Ranking Score model — Phase 13: Final Recruiter Ranking Engine.

Recruiter Decision Modeled:
    "How do I translate eight different signal groups — technical depth,
    career trajectory, behavioral engagement, trust, JD alignment,
    retrieval relevance, leadership, and market fit — into a single
    defensible score I can present to a hiring manager?"

Signal Used:
    All eight ranking dimensions, plus bonuses, penalties, and a
    composite final_score that determines candidate rank.

Effect on Rank:
    final_score IS the ranking signal.  Higher final_score = higher rank.
    Candidates are ranked descending on final_score, with ties broken
    by confidence then by technical_score.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class RankingScore(BaseModel):
    """Structured scoring record for a single candidate.

    All dimension scores are in [0.0, 1.0].
    bonuses and penalties are additive/subtractive on final_score.
    final_score is clamped to [0.0, 1.0] after bonus/penalty application.
    """

    # ── Identity ───────────────────────────────────────────────────────────────
    candidate_id: str = Field(..., description="Unique candidate identifier.")

    # ── Dimension Scores (all in [0, 1]) ─────────────────────────────────────
    technical_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Technical proficiency score: retrieval, production ML, Python, "
            "distributed systems, LLM, vector DB, evaluation."
        ),
    )
    career_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Career trajectory score: years experience, growth rate, "
            "stability, startup experience, average tenure."
        ),
    )
    behavioral_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Behavioral intelligence score from Phase 11: availability, "
            "engagement, responsiveness, join probability."
        ),
    )
    trust_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Trust and reliability score from Phase 11 + Phase 12: "
            "profile verification, fraud risk, consistency."
        ),
    )
    matching_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "JD alignment score: skill coverage, keyword coverage, "
            "semantic alignment, experience alignment."
        ),
    )
    retrieval_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Retrieval relevance score from Phase 9 hybrid retrieval: "
            "normalised fusion score from FAISS + BM25."
        ),
    )
    leadership_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Leadership signal score: people management, technical leadership, "
            "mentorship, cross-functional influence."
        ),
    )
    market_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Market fitness score: availability, salary alignment, "
            "engagement signals, relocation willingness."
        ),
    )

    # ── Bonus / Penalty Adjustments ───────────────────────────────────────────
    total_bonus: float = Field(
        0.0, ge=0.0, le=0.30,
        description="Sum of all applied bonuses (capped at 0.30).",
    )
    total_penalty: float = Field(
        0.0, ge=0.0, le=0.50,
        description="Sum of all applied penalties (capped at 0.50).",
    )

    # ── Reliability Adjustment ────────────────────────────────────────────────
    reliability_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Phase 12 reliability score — used as a multiplier on "
            "the weighted score to penalise unreliable profiles."
        ),
    )

    # ── Weighted Composite (pre-bonus/penalty) ─────────────────────────────────
    weighted_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Weighted composite score before bonus/penalty adjustment.",
    )

    # ── Final Score ────────────────────────────────────────────────────────────
    final_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Final ranking score after weights, bonuses, penalties, and "
            "reliability multiplier. Determines candidate rank."
        ),
    )

    # ── Confidence ────────────────────────────────────────────────────────────
    confidence: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Signal-quality confidence: based on data completeness, "
            "evidence strength, and consistency across dimensions."
        ),
    )

    # ── Applied Weights Reference ─────────────────────────────────────────────
    applied_weights: Dict[str, float] = Field(
        default_factory=dict,
        description="Weights used to compute weighted_score (for audit trail).",
    )

    # ── Bonus / Penalty Trace ─────────────────────────────────────────────────
    bonuses_applied: List[str] = Field(
        default_factory=list,
        description="List of bonus reasons applied to this candidate.",
    )
    penalties_applied: List[str] = Field(
        default_factory=list,
        description="List of penalty reasons applied to this candidate.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "RankingScore":
        """Clamps all float score fields to [0.0, 1.0]."""
        for field in (
            "technical_score", "career_score", "behavioral_score",
            "trust_score", "matching_score", "retrieval_score",
            "leadership_score", "market_score", "reliability_score",
            "weighted_score", "final_score", "confidence",
        ):
            val = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, val)), 4))
        self.total_bonus = round(min(0.30, max(0.0, self.total_bonus)), 4)
        self.total_penalty = round(min(0.50, max(0.0, self.total_penalty)), 4)
        return self

    def to_feature_dict(self) -> Dict[str, float]:
        """Returns all dimension scores as a flat dict for downstream models.

        Returns:
            Dict[str, float]: {dimension_name: score}.
        """
        return {
            "rank_technical":   self.technical_score,
            "rank_career":      self.career_score,
            "rank_behavioral":  self.behavioral_score,
            "rank_trust":       self.trust_score,
            "rank_matching":    self.matching_score,
            "rank_retrieval":   self.retrieval_score,
            "rank_leadership":  self.leadership_score,
            "rank_market":      self.market_score,
            "rank_weighted":    self.weighted_score,
            "rank_final":       self.final_score,
            "rank_confidence":  self.confidence,
            "rank_bonus":       self.total_bonus,
            "rank_penalty":     self.total_penalty,
        }

    model_config = {"populate_by_name": True}
