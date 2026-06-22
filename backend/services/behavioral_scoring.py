"""Behavioral Scoring — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    Combines all five behavioral dimensions into a single, defensible
    ``behavioral_score`` with configurable weights.  Answers:
    "Given everything I know about this candidate's behavior, what is
    my overall confidence that engaging them will succeed?"

Formula (Default Weights):
    behavioral_score = (
        0.30 × trust_score
      + 0.25 × availability_score
      + 0.20 × responsiveness_score
      + 0.15 × engagement_score
      + 0.10 × join_probability
    )

Design:
    - Weights are fully configurable via ScoringConfig dataclass.
    - Formula validation ensures weights sum to 1.0.
    - Provides both single-candidate and batch scoring.

Phase 13 Ranking Usage:
    ``behavioral_score`` is one of the primary inputs to the Phase 13
    Final Ranking Engine alongside the FeatureVector technical score.
"""

import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from models.behavioral_intelligence import BehavioralIntelligence
from models.availability_profile import AvailabilityProfile
from models.engagement_profile import EngagementProfile
from models.responsiveness_profile import ResponsivenessProfile
from models.trust_profile import TrustProfile

logger = logging.getLogger(__name__)

# ── Default weight configuration ───────────────────────────────────────────────
DEFAULT_WEIGHTS: Dict[str, float] = {
    "trust":            0.30,
    "availability":     0.25,
    "responsiveness":   0.20,
    "engagement":       0.15,
    "join_probability": 0.10,
}


@dataclass
class ScoringConfig:
    """Configurable weight profile for behavioral scoring.

    Attributes:
        trust: Weight for trust_score (default 0.30).
        availability: Weight for availability_score (default 0.25).
        responsiveness: Weight for responsiveness_score (default 0.20).
        engagement: Weight for engagement_score (default 0.15).
        join_probability: Weight for join_probability (default 0.10).

    Raises:
        ValueError: If weights do not sum to 1.0 (±0.001 tolerance).
    """
    trust: float = 0.30
    availability: float = 0.25
    responsiveness: float = 0.20
    engagement: float = 0.15
    join_probability: float = 0.10

    def __post_init__(self) -> None:
        total = (
            self.trust
            + self.availability
            + self.responsiveness
            + self.engagement
            + self.join_probability
        )
        if abs(total - 1.0) > 0.001:
            raise ValueError(
                f"ScoringConfig weights must sum to 1.0, got {total:.4f}. "
                f"Adjust weights: trust={self.trust}, availability={self.availability}, "
                f"responsiveness={self.responsiveness}, engagement={self.engagement}, "
                f"join_probability={self.join_probability}."
            )

    def to_dict(self) -> Dict[str, float]:
        """Returns weights as a plain dictionary."""
        return {
            "trust":            self.trust,
            "availability":     self.availability,
            "responsiveness":   self.responsiveness,
            "engagement":       self.engagement,
            "join_probability": self.join_probability,
        }


class BehavioralScoring:
    """Combines behavioral sub-scores into a single behavioral_score.

    Usage:
        scorer = BehavioralScoring()
        intelligence = scorer.compute_behavioral_score(bi)

    Or with a custom weight profile:
        config = ScoringConfig(trust=0.35, availability=0.25, ...)
        scorer = BehavioralScoring(config=config)
    """

    def __init__(self, config: Optional[ScoringConfig] = None) -> None:
        """Initialises scorer with optional weight override.

        Args:
            config: Weight configuration. Uses DEFAULT_WEIGHTS if None.
        """
        self.config = config or ScoringConfig()
        logger.debug("BehavioralScoring initialized with weights: %s", self.config.to_dict())

    def _compute_recruiter_friendliness(
        self,
        responsiveness_score: float,
        availability_score: float,
        trust_score: float,
    ) -> float:
        """Computes recruiter-friendliness as a pipeline-friction predictor.

        Formula:
            recruiter_friendliness = 0.50 × responsiveness + 0.30 × availability + 0.20 × trust

        Args:
            responsiveness_score: From ResponsivenessProfile.
            availability_score: From AvailabilityProfile.
            trust_score: From TrustProfile.

        Returns:
            float: Recruiter friendliness score [0, 1].
        """
        score = (
            0.50 * responsiveness_score
            + 0.30 * availability_score
            + 0.20 * trust_score
        )
        return round(min(1.0, max(0.0, score)), 4)

    def _average_confidence(
        self,
        profiles: List[Optional[object]],
        attribute: str = "confidence",
    ) -> float:
        """Computes average confidence across available sub-profiles.

        Args:
            profiles: List of sub-profile objects (may contain None).
            attribute: Confidence attribute name to extract.

        Returns:
            float: Average confidence [0, 1].
        """
        valid_confidences = [
            getattr(p, attribute)
            for p in profiles
            if p is not None and hasattr(p, attribute)
        ]
        if not valid_confidences:
            return 0.0
        return round(sum(valid_confidences) / len(valid_confidences), 4)

    def compute_behavioral_score(
        self,
        bi: BehavioralIntelligence,
    ) -> BehavioralIntelligence:
        """Computes and injects behavioral_score into a BehavioralIntelligence object.

        Reads sub-profile scalar scores directly from the BehavioralIntelligence
        aggregate and applies the configured formula.  Also computes
        ``recruiter_friendliness`` and ``confidence``.

        Args:
            bi: BehavioralIntelligence object with sub-profile scalars populated.

        Returns:
            BehavioralIntelligence: Updated object with behavioral_score filled in.
        """
        w = self.config

        composite = (
            w.trust            * bi.trust_score
            + w.availability   * bi.availability_score
            + w.responsiveness * bi.responsiveness_score
            + w.engagement     * bi.engagement_score
            + w.join_probability * bi.join_probability
        )
        composite = round(min(1.0, max(0.0, composite)), 4)

        friendliness = self._compute_recruiter_friendliness(
            bi.responsiveness_score,
            bi.availability_score,
            bi.trust_score,
        )

        avg_confidence = self._average_confidence(
            [
                bi.availability_profile,
                bi.engagement_profile,
                bi.responsiveness_profile,
                bi.trust_profile,
            ]
        )

        evidence_entry = (
            f"📊 behavioral_score = {composite:.3f} | "
            f"trust×{w.trust} + avail×{w.availability} + "
            f"resp×{w.responsiveness} + engage×{w.engagement} + "
            f"join_prob×{w.join_probability}"
        )

        # Return updated object (Pydantic v2 model_copy)
        updated_evidence = bi.evidence + [evidence_entry]

        result = bi.model_copy(
            update={
                "behavioral_score":       composite,
                "recruiter_friendliness": friendliness,
                "confidence":             avg_confidence,
                "scoring_weights":        w.to_dict(),
                "evidence":               updated_evidence,
            }
        )

        logger.info(
            "Behavioral score for %s: %.3f (friendliness: %.3f, confidence: %.3f)",
            bi.candidate_id,
            composite,
            friendliness,
            avg_confidence,
        )

        return result

    def score_batch(
        self,
        batch: List[BehavioralIntelligence],
    ) -> List[BehavioralIntelligence]:
        """Applies behavioral scoring to a list of BehavioralIntelligence objects.

        Args:
            batch: List of BehavioralIntelligence objects to score.

        Returns:
            List[BehavioralIntelligence]: Scored objects, preserving input order.
        """
        logger.info("Scoring batch of %d candidates...", len(batch))
        results = [self.compute_behavioral_score(bi) for bi in batch]
        logger.info("Batch scoring complete.")
        return results

    def score_distribution(
        self,
        batch: List[BehavioralIntelligence],
    ) -> Dict[str, float]:
        """Computes behavioral score distribution statistics over a batch.

        Args:
            batch: Scored BehavioralIntelligence objects.

        Returns:
            Dict[str, float]: min, max, mean, p25, p50, p75 of behavioral_scores.
        """
        if not batch:
            return {}

        scores = sorted(b.behavioral_score for b in batch)
        n = len(scores)

        def percentile(p: float) -> float:
            idx = int(p / 100.0 * (n - 1))
            return round(scores[idx], 4)

        return {
            "count": float(n),
            "min":   round(scores[0], 4),
            "max":   round(scores[-1], 4),
            "mean":  round(sum(scores) / n, 4),
            "p25":   percentile(25),
            "p50":   percentile(50),
            "p75":   percentile(75),
        }
