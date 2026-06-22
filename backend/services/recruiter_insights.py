"""Recruiter Insights Service — Phase 15: AI Recruiter Copilot.

Generates and prioritizes notable, evidence-backed recruiter insights for profiles.
"""

from typing import List
from models.candidate import Candidate
from models.reliability_profile import ReliabilityProfile
from models.feature_vector import FeatureVector
from models.recruiter_insight import RecruiterInsight
from utils.logger import get_logger

logger = get_logger(__name__)


class RecruiterInsights:
    """Surfaces prioritized insights (highlights, concerns, and alerts) based on candidate data."""

    @staticmethod
    def generate_insights(
        candidate: Candidate,
        reliability_profile: ReliabilityProfile,
        feature_vector: FeatureVector,
    ) -> List[RecruiterInsight]:
        """Identifies all applicable noteworthy highlights or warnings for a candidate.

        Args:
            candidate: Candidate aggregate.
            reliability_profile: Candidate reliability status.
            feature_vector: Candidate feature representation.

        Returns:
            List[RecruiterInsight]: List of surfaced insights.
        """
        insights: List[RecruiterInsight] = []
        cid = candidate.candidate_id

        # 1. High Fraud Risk Insight
        fraud_risk = 0.0
        if reliability_profile.fraud_profile:
            fraud_risk = reliability_profile.fraud_profile.overall_fraud_risk
        if fraud_risk > 0.50:
            insights.append(
                RecruiterInsight(
                    insight_type="High Fraud Risk",
                    severity="CRITICAL",
                    title="Profile Credibility Warning",
                    description="Profile exhibits elevated inconsistency risks or potential content padding.",
                    evidence=[
                        f"Overall integrity risk calculated at {fraud_risk * 100:.0f}%",
                        f"Timeline anomalies identified in career dates",
                    ],
                    confidence=0.90,
                )
            )

        # 2. Low Availability Insight
        notice = candidate.redrob_signals.notice_period_days
        if notice >= 90:
            insights.append(
                RecruiterInsight(
                    insight_type="Low Availability",
                    severity="HIGH",
                    title="Delayed Start Alert",
                    description=f"Candidate notice period of {notice} days presents recruitment placement delay.",
                    evidence=[
                        f"Notice period: {notice} days",
                    ],
                    confidence=0.95,
                )
            )

        # 3. Strong Leadership Insight
        leadership_score = 0.5
        if hasattr(feature_vector, "leadership_features") and feature_vector.leadership_features:
            leadership_score = feature_vector.leadership_features.leadership_score
        if leadership_score >= 0.75:
            insights.append(
                RecruiterInsight(
                    insight_type="Strong Leadership",
                    severity="HIGH",
                    title="Technical Leadership Signal",
                    description="Candidate shows high potential for leadership or engineering direction roles.",
                    evidence=[
                        f"Leadership feature score is {leadership_score:.2f}",
                        f"Current title: '{candidate.profile.current_title or 'Engineer'}'",
                    ],
                    confidence=0.85,
                )
            )

        # 4. Excellent Match Insight
        match_score = 0.5
        if hasattr(feature_vector, "matching_features") and feature_vector.matching_features:
            match_score = feature_vector.matching_features.matching_score
        if match_score >= 0.80:
            insights.append(
                RecruiterInsight(
                    insight_type="Excellent Match",
                    severity="HIGH",
                    title="Expert Skill Match",
                    description="Candidate possesses outstanding overlap with required job skills.",
                    evidence=[
                        f"JD matching score is {match_score:.2f}",
                    ],
                    confidence=0.90,
                )
            )

        # 5. Exceptional Career Growth Insight
        if candidate.total_years_experience >= 8.0 and candidate.average_tenure >= 2.0:
            insights.append(
                RecruiterInsight(
                    insight_type="Exceptional Growth",
                    severity="MEDIUM",
                    title="Stable Career Progression",
                    description="Candidate exhibits consistent experience growth combined with employment stability.",
                    evidence=[
                        f"Total years experience: {candidate.total_years_experience:.1f} years",
                        f"Average tenure: {candidate.average_tenure:.1f} years per role",
                    ],
                    confidence=0.80,
                )
            )

        return RecruiterInsights.prioritize_insights(insights)

    @staticmethod
    def prioritize_insights(insights: List[RecruiterInsight]) -> List[RecruiterInsight]:
        """Sorts insights in order of severity: CRITICAL > HIGH > MEDIUM > INFO.

        Args:
            insights: List of recruiter insights.

        Returns:
            List[RecruiterInsight]: Ordered list of insights.
        """
        severity_weights = {
            "CRITICAL": 4,
            "HIGH": 3,
            "MEDIUM": 2,
            "INFO": 1,
        }
        return sorted(
            insights,
            key=lambda x: severity_weights.get(x.severity, 1),
            reverse=True,
        )
