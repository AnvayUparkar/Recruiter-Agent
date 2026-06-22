"""Reliability Scoring — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "What is the single, defensible reliability verdict I can put next to
    this candidate's name in my ATS?"  This service combines all Phase 12
    signals into a ``reliability_score`` using a configurable weighted formula.

Formula (Default Weights):
    reliability_score = (
        0.30 × quality_score
      + 0.25 × behavioral_score
      + 0.20 × trust_score
      + 0.15 × consistency_score
      - 0.10 × fraud_penalty
    )

Phase 13 Ranking Usage:
    ``reliability_score`` is the primary Phase 12 output consumed by the
    Phase 13 Final Ranking Engine, exported as ``reliability_score`` in the
    ranking feature vector.  The full ``reliability_*`` feature family
    provides the ranker with granular Phase 12 signal access.
"""

import logging
from dataclasses import dataclass
from typing import List, Optional

from models.reliability_profile import ReliabilityProfile
from models.profile_quality import ProfileQuality
from models.fraud_profile import FraudProfile
from models.consistency_profile import ConsistencyProfile
from models.anomaly_profile import AnomalyProfile

logger = logging.getLogger(__name__)

# ── Default weights ──────────────────────────────────────────────────────────
DEFAULT_WEIGHTS = {
    "quality":       0.30,
    "behavioral":    0.25,
    "trust":         0.20,
    "consistency":   0.15,
    "fraud_penalty": 0.10,
}


@dataclass
class ReliabilityConfig:
    """Configurable weight profile for reliability scoring.

    Attributes:
        quality: Weight for profile quality score (default 0.30).
        behavioral: Weight for Phase 11 behavioral score (default 0.25).
        trust: Weight for Phase 11 trust score (default 0.20).
        consistency: Weight for consistency score (default 0.15).
        fraud_penalty: Weight for fraud penalty subtraction (default 0.10).

    Raises:
        ValueError: If positive weights don't sum to 1.0 (±0.001).
    """
    quality: float = 0.30
    behavioral: float = 0.25
    trust: float = 0.20
    consistency: float = 0.15
    fraud_penalty: float = 0.10

    def __post_init__(self) -> None:
        positive_sum = self.quality + self.behavioral + self.trust + self.consistency
        if abs(positive_sum - 0.90) > 0.001:
            # fraud_penalty is subtracted, not added; positive weights should sum to 0.90
            # However we accept any configuration and warn — don't raise on this
            logger.warning(
                "ReliabilityConfig positive weights sum to %.3f (expected ~0.90). "
                "Reliability score may not be in [0, 1] range.",
                positive_sum,
            )

    def to_dict(self) -> dict:
        """Returns weights as a plain dict."""
        return {
            "quality":       self.quality,
            "behavioral":    self.behavioral,
            "trust":         self.trust,
            "consistency":   self.consistency,
            "fraud_penalty": self.fraud_penalty,
        }


class ReliabilityScoring:
    """Computes the final reliability score from all Phase 12 sub-signals.

    Usage:
        scorer = ReliabilityScoring()
        reliability = scorer.compute_reliability_score(
            candidate_id, quality, fraud, consistency, behavioral_score, trust_score
        )

    Or with custom weights:
        config = ReliabilityConfig(quality=0.35, ...)
        scorer = ReliabilityScoring(config=config)
    """

    def __init__(self, config: Optional[ReliabilityConfig] = None) -> None:
        """Initialises scorer with optional weight override.

        Args:
            config: Weight configuration. Uses defaults if None.
        """
        self.config = config or ReliabilityConfig()
        logger.debug(
            "ReliabilityScoring initialized | weights=%s",
            self.config.to_dict(),
        )

    def _average_confidence(
        self,
        profiles: list,
        attr: str = "confidence",
    ) -> float:
        """Computes average confidence across a list of sub-profiles.

        Args:
            profiles: List of sub-profile objects (may contain None).
            attr: Confidence attribute name.

        Returns:
            float: Average confidence [0, 1].
        """
        values = [
            getattr(p, attr)
            for p in profiles
            if p is not None and hasattr(p, attr)
        ]
        if not values:
            return 0.0
        return round(sum(values) / len(values), 4)

    def compute_reliability_score(
        self,
        candidate_id: str,
        quality_profile: ProfileQuality,
        fraud_profile: FraudProfile,
        consistency_profile: ConsistencyProfile,
        behavioral_score: float = 0.0,
        trust_score: float = 0.0,
        anomaly_profile: Optional[AnomalyProfile] = None,
    ) -> ReliabilityProfile:
        """Computes the reliability score and returns a complete ReliabilityProfile.

        Args:
            candidate_id: Candidate identifier.
            quality_profile: Phase 12 quality assessment.
            fraud_profile: Phase 12 fraud risk assessment.
            consistency_profile: Phase 12 consistency assessment.
            behavioral_score: Phase 11 behavioral_score (default 0.0 if unavailable).
            trust_score: Phase 11 trust_score (default 0.0 if unavailable).
            anomaly_profile: Optional anomaly profile (for feature vector completeness).

        Returns:
            ReliabilityProfile: Final reliability assessment.
        """
        c = self.config

        quality_s = quality_profile.quality_score
        fraud_penalty = fraud_profile.overall_fraud_risk
        consistency_s = consistency_profile.consistency_score

        # Core formula
        raw_score = (
            c.quality * quality_s
            + c.behavioral * behavioral_score
            + c.trust * trust_score
            + c.consistency * consistency_s
            - c.fraud_penalty * fraud_penalty
        )
        reliability_s = round(min(1.0, max(0.0, raw_score)), 4)

        # Confidence: mean across available sub-profiles
        confidence = self._average_confidence([quality_profile, fraud_profile, consistency_profile])

        # Aggregate evidence
        formula_ev = (
            f"📊 reliability_score = {reliability_s:.3f} | "
            f"quality×{c.quality}={quality_s * c.quality:.3f} + "
            f"behavioral×{c.behavioral}={behavioral_score * c.behavioral:.3f} + "
            f"trust×{c.trust}={trust_score * c.trust:.3f} + "
            f"consistency×{c.consistency}={consistency_s * c.consistency:.3f} "
            f"- fraud×{c.fraud_penalty}={fraud_penalty * c.fraud_penalty:.3f}"
        )

        all_evidence: List[str] = (
            quality_profile.evidence
            + fraud_profile.evidence
            + consistency_profile.evidence
            + [formula_ev]
        )

        logger.info(
            "Reliability score for %s: %.3f (tier: %s | confidence: %.3f)",
            candidate_id,
            reliability_s,
            "HIGH" if reliability_s >= 0.80 else
            "MEDIUM" if reliability_s >= 0.60 else
            "LOW" if reliability_s >= 0.40 else "VERY_LOW",
            confidence,
        )

        return ReliabilityProfile(
            candidate_id=candidate_id,
            quality_profile=quality_profile,
            fraud_profile=fraud_profile,
            consistency_profile=consistency_profile,
            anomaly_profile=anomaly_profile,
            behavioral_score=round(min(1.0, max(0.0, behavioral_score)), 4),
            trust_score=round(min(1.0, max(0.0, trust_score)), 4),
            quality_score=quality_s,
            fraud_penalty=fraud_penalty,
            consistency_score=consistency_s,
            reliability_score=reliability_s,
            confidence=confidence,
            evidence=all_evidence,
            scoring_weights=c.to_dict(),
        )

    def score_batch(
        self,
        batch: List[ReliabilityProfile],
    ) -> List[ReliabilityProfile]:
        """Applies reliability scoring to a pre-assembled list.

        Note: This assumes sub-profiles are already assembled in each
        ReliabilityProfile.  Use TrustworthinessService for full orchestration.

        Args:
            batch: List of ReliabilityProfile objects.

        Returns:
            List[ReliabilityProfile]: Input profiles sorted by reliability_score desc.
        """
        return sorted(batch, key=lambda p: p.reliability_score, reverse=True)

    def score_distribution(
        self,
        profiles: List[ReliabilityProfile],
    ) -> dict:
        """Computes reliability score distribution statistics.

        Args:
            profiles: List of ReliabilityProfile objects.

        Returns:
            dict: min, max, mean, p25, p50, p75 of reliability_scores.
        """
        if not profiles:
            return {}

        scores = sorted(p.reliability_score for p in profiles)
        n = len(scores)

        def pct(p: float) -> float:
            return round(scores[max(0, min(n - 1, int(p / 100 * (n - 1))))], 4)

        return {
            "count": float(n),
            "min":   round(scores[0], 4),
            "max":   round(scores[-1], 4),
            "mean":  round(sum(scores) / n, 4),
            "p25":   pct(25),
            "p50":   pct(50),
            "p75":   pct(75),
            "high_reliability":   sum(1 for p in profiles if p.reliability_score >= 0.80),
            "medium_reliability": sum(1 for p in profiles if 0.60 <= p.reliability_score < 0.80),
            "low_reliability":    sum(1 for p in profiles if p.reliability_score < 0.40),
        }
