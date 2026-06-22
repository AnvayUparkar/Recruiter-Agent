"""Dashboard Service — Phase 14: Production API & Recruiter Suite.

Processes candidate lists to generate pool-level statistical distributions.
"""

from typing import List, Dict, Any
from models.candidate import Candidate
from models.ranked_candidate import RankedCandidate
from models.dashboard_metrics import DashboardMetrics


class DashboardService:
    """Computes pool-level analytics and histogram bins for recruiter UIs."""

    @staticmethod
    def generate_dashboard_metrics(
        candidates: List[Candidate],
        ranked_candidates: List[RankedCandidate],
    ) -> DashboardMetrics:
        """Processes evaluations to build chart-ready metrics.

        Args:
            candidates: Input candidate aggregates.
            ranked_candidates: Evaluated and ranked shortlist candidates.

        Returns:
            DashboardMetrics: Aggregate statistics and bin counts.
        """
        total = len(ranked_candidates)
        if total == 0:
            return DashboardMetrics()

        # 1. Ranking score distribution (Histogram bins)
        bins = {"0.0-0.2": 0, "0.2-0.4": 0, "0.4-0.6": 0, "0.6-0.8": 0, "0.8-1.0": 0}
        scores_sum = 0.0
        min_score = 1.0
        max_score = 0.0

        for rc in ranked_candidates:
            score = rc.final_score
            scores_sum += score
            if score < min_score:
                min_score = score
            if score > max_score:
                max_score = score

            if score < 0.2:
                bins["0.0-0.2"] += 1
            elif score < 0.4:
                bins["0.2-0.4"] += 1
            elif score < 0.6:
                bins["0.4-0.6"] += 1
            elif score < 0.8:
                bins["0.6-0.8"] += 1
            else:
                bins["0.8-1.0"] += 1

        ranking_stats = {
            "mean_score": round(scores_sum / total, 4),
            "min_score": round(min_score, 4),
            "max_score": round(max_score, 4),
            "score_distribution_histogram": bins,
        }

        # 2. Trust & Reliability Stats
        tiers = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "VERY_LOW": 0}
        fraud_sum = 0.0
        quality_sum = 0.0

        for rc in ranked_candidates:
            details = rc.score_details
            rel = details.reliability_score

            # Group into tiers
            if rel >= 0.80:
                tiers["HIGH"] += 1
            elif rel >= 0.60:
                tiers["MEDIUM"] += 1
            elif rel >= 0.40:
                tiers["LOW"] += 1
            else:
                tiers["VERY_LOW"] += 1

            fraud_sum += (1.0 - rel)  # proxy for fraud risk
            quality_sum += details.trust_score

        trust_stats = {
            "reliability_tier_distribution": tiers,
            "average_fraud_risk": round(fraud_sum / total, 4),
            "average_profile_trust_score": round(quality_sum / total, 4),
        }

        # 3. Behavior Stats
        notice_periods = {"0-15 days": 0, "16-30 days": 0, "31-60 days": 0, "61+ days": 0}
        resp_sum = 0.0
        avail_sum = 0.0

        for c in candidates:
            notice = c.redrob_signals.notice_period_days
            if notice <= 15:
                notice_periods["0-15 days"] += 1
            elif notice <= 30:
                notice_periods["16-30 days"] += 1
            elif notice <= 60:
                notice_periods["31-60 days"] += 1
            else:
                notice_periods["61+ days"] += 1

            resp_sum += c.redrob_signals.recruiter_response_rate
            avail_sum += 1.0 if c.redrob_signals.open_to_work_flag else 0.0

        behavior_stats = {
            "notice_period_distribution": notice_periods,
            "average_responsiveness_rate": round(resp_sum / len(candidates), 4),
            "open_to_work_ratio": round(avail_sum / len(candidates), 4),
        }

        # 4. Profile Quality / Completeness Stats
        completeness_sum = 0.0
        github_count = 0

        for c in candidates:
            completeness_sum += c.redrob_signals.profile_completeness_score
            if c.has_github_activity:
                github_count += 1

        quality_stats = {
            "average_profile_completeness": round(completeness_sum / len(candidates), 2),
            "github_active_percentage": round(github_count / len(candidates) * 100.0, 2),
        }

        # 5. Retrieval Stats
        retrieval_stats = {
            "total_evaluated": total,
            "semantic_matching_percentage": 100.0,  # default active
        }

        return DashboardMetrics(
            retrieval_stats=retrieval_stats,
            ranking_stats=ranking_stats,
            trust_stats=trust_stats,
            behavior_stats=behavior_stats,
            quality_stats=quality_stats,
        )
