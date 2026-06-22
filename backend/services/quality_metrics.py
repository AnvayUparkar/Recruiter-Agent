"""Quality Metrics — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    Gives talent-acquisition leaders pool-level visibility into profile
    quality and reliability.  Answers: "What fraction of our pipeline
    has high-quality profiles?", "What is the average fraud risk?",
    "Are there concerning consistency patterns across our shortlist?"

Signal Modeled:
    Aggregate statistics over ReliabilityProfile collections.

Phase 13 Ranking Usage:
    Used by evaluation dashboards and pre-ranking health checks.
    The ``generate_report()`` method produces the input for TA team
    briefings and pipeline health monitors.
"""

import logging
from collections import Counter
from typing import Dict, List, Optional

from models.reliability_profile import ReliabilityProfile

logger = logging.getLogger(__name__)


def _stats(values: List[float]) -> Dict[str, float]:
    """Computes descriptive statistics for a list of float values.

    Args:
        values: List of scores.

    Returns:
        dict: count, min, max, mean, std, p10, p25, p50, p75, p90.
    """
    if not values:
        return {"count": 0.0}

    sv = sorted(values)
    n = len(sv)
    mean = sum(sv) / n
    variance = sum((x - mean) ** 2 for x in sv) / n
    std = variance ** 0.5

    def pct(p: float) -> float:
        return round(sv[max(0, min(n - 1, int(p / 100 * (n - 1))))], 4)

    return {
        "count": float(n),
        "min":   round(sv[0], 4),
        "max":   round(sv[-1], 4),
        "mean":  round(mean, 4),
        "std":   round(std, 4),
        "p10":   pct(10),
        "p25":   pct(25),
        "p50":   pct(50),
        "p75":   pct(75),
        "p90":   pct(90),
    }


def _bucket(values: List[float], n_buckets: int = 5) -> Dict[str, int]:
    """Counts scores in equal-width buckets over [0, 1].

    Args:
        values: Scores in [0, 1].
        n_buckets: Number of equal-width buckets.

    Returns:
        dict: bucket_label → count.
    """
    step = 1.0 / n_buckets
    labels = [f"{i*step:.1f}–{(i+1)*step:.1f}" for i in range(n_buckets)]
    counts = Counter({label: 0 for label in labels})
    for v in values:
        idx = min(n_buckets - 1, int(v / step))
        counts[labels[idx]] += 1
    return dict(counts)


class QualityMetrics:
    """Computes pool-level quality and reliability metrics.

    Usage:
        metrics = QualityMetrics()
        report = metrics.generate_report(profiles)
    """

    def calculate_quality_distribution(
        self,
        profiles: List[ReliabilityProfile],
    ) -> Dict[str, object]:
        """Computes profile quality score distribution.

        Args:
            profiles: List of ReliabilityProfile objects.

        Returns:
            dict: Summary stats + bucket histogram.
        """
        scores = [p.quality_score for p in profiles]
        return {
            "stats":        _stats(scores),
            "buckets":      _bucket(scores),
            "high_quality": sum(1 for s in scores if s >= 0.70),
            "low_quality":  sum(1 for s in scores if s < 0.40),
        }

    def calculate_fraud_distribution(
        self,
        profiles: List[ReliabilityProfile],
    ) -> Dict[str, object]:
        """Computes fraud risk distribution.

        Args:
            profiles: List of ReliabilityProfile objects.

        Returns:
            dict: Summary stats + segment counts.
        """
        scores = [p.fraud_penalty for p in profiles]
        return {
            "stats":      _stats(scores),
            "buckets":    _bucket(scores),
            "high_risk":  sum(1 for s in scores if s >= 0.60),
            "medium_risk": sum(1 for s in scores if 0.30 <= s < 0.60),
            "low_risk":   sum(1 for s in scores if s < 0.30),
        }

    def calculate_consistency_distribution(
        self,
        profiles: List[ReliabilityProfile],
    ) -> Dict[str, object]:
        """Computes consistency score distribution.

        Args:
            profiles: List of ReliabilityProfile objects.

        Returns:
            dict: Summary stats + bucket histogram.
        """
        scores = [p.consistency_score for p in profiles]
        return {
            "stats":           _stats(scores),
            "buckets":         _bucket(scores),
            "highly_consistent": sum(1 for s in scores if s >= 0.75),
            "inconsistent":    sum(1 for s in scores if s < 0.40),
        }

    def calculate_reliability_distribution(
        self,
        profiles: List[ReliabilityProfile],
    ) -> Dict[str, object]:
        """Computes reliability score distribution.

        Args:
            profiles: List of ReliabilityProfile objects.

        Returns:
            dict: Stats, buckets, tier counts.
        """
        scores = [p.reliability_score for p in profiles]
        return {
            "stats":            _stats(scores),
            "buckets":          _bucket(scores),
            "high_reliability": sum(1 for p in profiles if p.reliability_score >= 0.80),
            "medium_reliability": sum(1 for p in profiles if 0.60 <= p.reliability_score < 0.80),
            "low_reliability":  sum(1 for p in profiles if p.reliability_score < 0.40),
            "reliable_count":   sum(1 for p in profiles if p.is_reliable()),
        }

    def calculate_metrics(
        self,
        profiles: List[ReliabilityProfile],
    ) -> Dict[str, object]:
        """Computes all four distribution metrics in one call.

        Args:
            profiles: List of ReliabilityProfile objects.

        Returns:
            dict: All dimension metrics.
        """
        logger.info("Calculating quality metrics over %d profiles...", len(profiles))
        return {
            "quality":      self.calculate_quality_distribution(profiles),
            "fraud":        self.calculate_fraud_distribution(profiles),
            "consistency":  self.calculate_consistency_distribution(profiles),
            "reliability":  self.calculate_reliability_distribution(profiles),
        }

    def generate_report(
        self,
        profiles: List[ReliabilityProfile],
        pool_name: Optional[str] = None,
    ) -> Dict[str, object]:
        """Generates a complete quality health report for a candidate pool.

        Suitable for:
          - TA team dashboards
          - Pre-ranking pipeline health checks
          - Recruiter briefing documents

        Args:
            profiles: List of ReliabilityProfile objects.
            pool_name: Optional label for this candidate pool.

        Returns:
            dict: Full report with pool metadata + all dimension metrics.
        """
        if not profiles:
            logger.warning("generate_report called with empty profile list.")
            return {
                "pool_name":        pool_name,
                "total_candidates": 0,
                "metrics":          {},
            }

        avg_reliability = sum(p.reliability_score for p in profiles) / len(profiles)
        avg_quality = sum(p.quality_score for p in profiles) / len(profiles)
        avg_fraud = sum(p.fraud_penalty for p in profiles) / len(profiles)
        avg_confidence = sum(p.confidence for p in profiles) / len(profiles)

        tier_counts = Counter(p.reliability_tier() for p in profiles)

        report = {
            "pool_name":            pool_name or "Unnamed Pool",
            "total_candidates":     len(profiles),
            "avg_reliability_score": round(avg_reliability, 4),
            "avg_quality_score":    round(avg_quality, 4),
            "avg_fraud_risk":       round(avg_fraud, 4),
            "avg_confidence":       round(avg_confidence, 4),
            "reliable_count":       sum(1 for p in profiles if p.is_reliable()),
            "reliable_pct":         round(sum(1 for p in profiles if p.is_reliable()) / len(profiles), 4),
            "tier_distribution":    dict(tier_counts),
            "metrics":              self.calculate_metrics(profiles),
        }

        logger.info(
            "Quality report | pool=%s | candidates=%d | avg_reliability=%.3f | "
            "avg_fraud=%.3f",
            pool_name,
            len(profiles),
            avg_reliability,
            avg_fraud,
        )

        return report
