"""Behavioral Metrics — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    Gives talent-acquisition leaders visibility into the behavioral
    quality of an entire candidate pool.  Answers: "What is the trust
    distribution of our pipeline?", "How many candidates are immediately
    available?", "What is our expected engagement conversion rate?"

Signal Modeled:
    Aggregate statistics over collections of BehavioralIntelligence
    objects: distribution histograms, percentile breakdowns, segment
    counts, and quality flags.

Phase 13 Ranking Usage:
    Metrics are used by:
      1. Evaluation dashboards to assess pipeline health.
      2. Ranking pre-processors to calibrate score normalization.
      3. Batch reports for recruiter team reporting.
"""

import logging
from collections import Counter
from typing import Dict, List, Optional

from models.behavioral_intelligence import BehavioralIntelligence

logger = logging.getLogger(__name__)


def _percentile(sorted_values: List[float], p: float) -> float:
    """Computes the p-th percentile of a pre-sorted list.

    Args:
        sorted_values: Pre-sorted list of floats.
        p: Percentile in [0, 100].

    Returns:
        float: Percentile value.
    """
    if not sorted_values:
        return 0.0
    n = len(sorted_values)
    idx = max(0, min(n - 1, int(p / 100.0 * (n - 1))))
    return round(sorted_values[idx], 4)


def _distribution_stats(values: List[float]) -> Dict[str, float]:
    """Computes summary statistics for a list of scores.

    Args:
        values: List of score floats.

    Returns:
        Dict with count, min, max, mean, std, p10, p25, p50, p75, p90.
    """
    if not values:
        return {"count": 0.0}

    sorted_v = sorted(values)
    n = len(sorted_v)
    mean = sum(sorted_v) / n
    variance = sum((x - mean) ** 2 for x in sorted_v) / n
    std = variance ** 0.5

    return {
        "count": float(n),
        "min":   round(sorted_v[0], 4),
        "max":   round(sorted_v[-1], 4),
        "mean":  round(mean, 4),
        "std":   round(std, 4),
        "p10":   _percentile(sorted_v, 10),
        "p25":   _percentile(sorted_v, 25),
        "p50":   _percentile(sorted_v, 50),
        "p75":   _percentile(sorted_v, 75),
        "p90":   _percentile(sorted_v, 90),
    }


def _bucket_distribution(values: List[float], buckets: int = 5) -> Dict[str, int]:
    """Segments scores into equal-width buckets and counts members.

    Args:
        values: List of score floats in [0, 1].
        buckets: Number of equal-width buckets.

    Returns:
        Dict mapping bucket label → count.
    """
    step = 1.0 / buckets
    labels = [
        f"{i * step:.1f}–{(i + 1) * step:.1f}"
        for i in range(buckets)
    ]
    counts = Counter({label: 0 for label in labels})

    for v in values:
        idx = min(buckets - 1, int(v / step))
        counts[labels[idx]] += 1

    return dict(counts)


class BehavioralMetrics:
    """Computes aggregate behavioral quality metrics over a candidate pool.

    Usage:
        metrics = BehavioralMetrics()
        report = metrics.generate_report(profiles)
    """

    def calculate_trust_distribution(
        self,
        profiles: List[BehavioralIntelligence],
    ) -> Dict[str, object]:
        """Computes trust score distribution across the pool.

        Args:
            profiles: List of BehavioralIntelligence objects.

        Returns:
            Dict with summary stats and bucket distribution.
        """
        scores = [p.trust_score for p in profiles]
        return {
            "stats":   _distribution_stats(scores),
            "buckets": _bucket_distribution(scores),
            "high_trust_count":   sum(1 for s in scores if s >= 0.75),
            "low_trust_count":    sum(1 for s in scores if s < 0.40),
        }

    def calculate_availability_distribution(
        self,
        profiles: List[BehavioralIntelligence],
    ) -> Dict[str, object]:
        """Computes availability score distribution across the pool.

        Args:
            profiles: List of BehavioralIntelligence objects.

        Returns:
            Dict with summary stats, bucket distribution, and segment counts.
        """
        scores = [p.availability_score for p in profiles]
        return {
            "stats":   _distribution_stats(scores),
            "buckets": _bucket_distribution(scores),
            "immediately_available": sum(1 for s in scores if s >= 0.75),
            "not_available":         sum(1 for s in scores if s < 0.30),
        }

    def calculate_engagement_distribution(
        self,
        profiles: List[BehavioralIntelligence],
    ) -> Dict[str, object]:
        """Computes engagement score distribution across the pool.

        Args:
            profiles: List of BehavioralIntelligence objects.

        Returns:
            Dict with summary stats and bucket distribution.
        """
        scores = [p.engagement_score for p in profiles]
        return {
            "stats":   _distribution_stats(scores),
            "buckets": _bucket_distribution(scores),
            "highly_engaged": sum(1 for s in scores if s >= 0.70),
            "disengaged":     sum(1 for s in scores if s < 0.25),
        }

    def calculate_responsiveness_distribution(
        self,
        profiles: List[BehavioralIntelligence],
    ) -> Dict[str, object]:
        """Computes responsiveness score distribution across the pool.

        Args:
            profiles: List of BehavioralIntelligence objects.

        Returns:
            Dict with summary stats and segment counts.
        """
        scores = [p.responsiveness_score for p in profiles]
        return {
            "stats":   _distribution_stats(scores),
            "buckets": _bucket_distribution(scores),
            "highly_responsive": sum(1 for s in scores if s >= 0.70),
            "unresponsive":      sum(1 for s in scores if s < 0.30),
        }

    def calculate_join_probability_distribution(
        self,
        profiles: List[BehavioralIntelligence],
    ) -> Dict[str, object]:
        """Computes join probability distribution across the pool.

        Args:
            profiles: List of BehavioralIntelligence objects.

        Returns:
            Dict with summary stats and conversion-tier counts.
        """
        scores = [p.join_probability for p in profiles]
        return {
            "stats":   _distribution_stats(scores),
            "buckets": _bucket_distribution(scores),
            "high_conversion":    sum(1 for s in scores if s >= 0.70),
            "medium_conversion":  sum(1 for s in scores if 0.40 <= s < 0.70),
            "low_conversion":     sum(1 for s in scores if s < 0.40),
        }

    def calculate_behavioral_distribution(
        self,
        profiles: List[BehavioralIntelligence],
    ) -> Dict[str, object]:
        """Computes master behavioral_score distribution.

        Args:
            profiles: List of BehavioralIntelligence objects.

        Returns:
            Dict with stats, buckets, and recruiter-ready count.
        """
        scores = [p.behavioral_score for p in profiles]
        return {
            "stats":   _distribution_stats(scores),
            "buckets": _bucket_distribution(scores),
            "recruiter_ready": sum(1 for p in profiles if p.is_recruiter_ready()),
            "not_ready":       sum(1 for p in profiles if not p.is_recruiter_ready()),
        }

    def calculate_metrics(
        self,
        profiles: List[BehavioralIntelligence],
    ) -> Dict[str, object]:
        """Computes all six distribution metrics in one call.

        Args:
            profiles: List of BehavioralIntelligence objects.

        Returns:
            Dict mapping dimension name → distribution metrics dict.
        """
        logger.info("Calculating behavioral metrics over %d profiles...", len(profiles))

        return {
            "behavioral":    self.calculate_behavioral_distribution(profiles),
            "trust":         self.calculate_trust_distribution(profiles),
            "availability":  self.calculate_availability_distribution(profiles),
            "engagement":    self.calculate_engagement_distribution(profiles),
            "responsiveness": self.calculate_responsiveness_distribution(profiles),
            "join_probability": self.calculate_join_probability_distribution(profiles),
        }

    def generate_report(
        self,
        profiles: List[BehavioralIntelligence],
        pool_name: Optional[str] = None,
    ) -> Dict[str, object]:
        """Generates a complete behavioral quality report for a candidate pool.

        Suitable for:
          - Evaluation dashboards
          - Recruiter team briefings
          - Pre-ranking pipeline health checks

        Args:
            profiles: List of BehavioralIntelligence objects.
            pool_name: Optional label for this candidate pool.

        Returns:
            Dict: Full report with pool metadata + all dimension metrics.
        """
        if not profiles:
            logger.warning("generate_report called with empty profile list.")
            return {"pool_name": pool_name, "total_candidates": 0, "metrics": {}}

        metrics = self.calculate_metrics(profiles)

        avg_behavioral = sum(p.behavioral_score for p in profiles) / len(profiles)
        avg_confidence = sum(p.confidence for p in profiles) / len(profiles)

        report = {
            "pool_name":              pool_name or "Unnamed Pool",
            "total_candidates":       len(profiles),
            "avg_behavioral_score":   round(avg_behavioral, 4),
            "avg_confidence":         round(avg_confidence, 4),
            "recruiter_ready_count":  sum(1 for p in profiles if p.is_recruiter_ready()),
            "recruiter_ready_pct":    round(
                sum(1 for p in profiles if p.is_recruiter_ready()) / len(profiles), 4
            ),
            "metrics": metrics,
        }

        logger.info(
            "Behavioral report generated | pool=%s | candidates=%d | avg_score=%.3f",
            pool_name,
            len(profiles),
            avg_behavioral,
        )

        return report
