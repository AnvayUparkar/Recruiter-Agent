"""Risk Analysis Engine — Phase 15: AI Recruiter Copilot.

Analyzes candidate profile indicators to surface behavioral and integrity risks.
"""

from typing import Dict, List, Any
from models.candidate import Candidate
from models.behavioral_intelligence import BehavioralIntelligence
from models.reliability_profile import ReliabilityProfile
from models.feature_vector import FeatureVector
from utils.logger import get_logger

logger = get_logger(__name__)


class RiskAnalysisEngine:
    """Analyzes candidate reliability and behavioral indicators to calculate risk scores and suggestions."""

    @staticmethod
    def analyze_risks(
        candidate: Candidate,
        behavioral_intel: BehavioralIntelligence,
        reliability_profile: ReliabilityProfile,
        feature_vector: FeatureVector,
    ) -> Dict[str, Any]:
        """Runs multi-dimensional risk audits on a candidate profile.

        Args:
            candidate: Candidate aggregate.
            behavioral_intel: Candidate behavioral intelligence.
            reliability_profile: Candidate reliability sub-profiles.
            feature_vector: Candidate feature representation.

        Returns:
            Dict[str, Any]: Risk report containing risk_score, risk_summary, and mitigation_suggestions.
        """
        detected_risks: List[str] = []
        mitigation_suggestions: List[str] = []
        risk_score_acc = 0.0
        checks_count = 6

        # 1. Low Availability Check
        notice = candidate.redrob_signals.notice_period_days
        if notice >= 60:
            detected_risks.append(f"Low Availability: Notice period is {notice} days.")
            mitigation_suggestions.append("Inquire if the candidate can negotiate an early release or buyout.")
            risk_score_acc += 0.5
        elif not candidate.is_open_to_work:
            detected_risks.append("Low Availability: Candidate is marked passive / not open to work.")
            mitigation_suggestions.append("Conduct exploratory calls to gauge active motivation levels.")
            risk_score_acc += 0.3

        # 2. Weak Leadership Check
        leadership_score = 0.5
        if hasattr(feature_vector, "leadership_features"):
            leadership_score = feature_vector.leadership_features.leadership_score
        if leadership_score < 0.40:
            detected_risks.append("Weak Leadership Signal: Low leadership history score.")
            mitigation_suggestions.append("Assess capability to lead and influence during technical design discussion.")
            risk_score_acc += 0.4

        # 3. Skill Gaps Check
        # Check if matching features indicate missing key skills
        matching_score = 0.5
        if hasattr(feature_vector, "matching_features"):
            matching_score = feature_vector.matching_features.matching_score
        if matching_score < 0.60:
            detected_risks.append("Skill Gaps: Low skill matches against the Job Description requirements.")
            mitigation_suggestions.append("Administer technical assessment to verify core competence gaps.")
            risk_score_acc += 0.6

        # 4. Fraud Risk Check
        fraud_risk = 0.0
        if reliability_profile.fraud_profile:
            fraud_risk = reliability_profile.fraud_profile.overall_fraud_risk
        if fraud_risk > 0.40:
            detected_risks.append(f"Elevated Fraud Risk: Profile integrity score indicates risk ({fraud_risk * 100:.0f}%).")
            mitigation_suggestions.append("Perform strict reference checks and verify current employment records.")
            risk_score_acc += 0.8

        # 5. Timeline Issues Check
        timeline_risk = 0.0
        if reliability_profile.fraud_profile:
            timeline_risk = reliability_profile.fraud_profile.timeline_risk
        if timeline_risk > 0.40:
            detected_risks.append("Timeline Inconsistencies: Overlapping roles or unexplained employment gaps identified.")
            mitigation_suggestions.append("Walk through career timeline dates in detail during initial phone screen.")
            risk_score_acc += 0.7

        # 6. Low Responsiveness Check
        resp_rate = candidate.redrob_signals.recruiter_response_rate
        if resp_rate < 0.60:
            detected_risks.append(f"Low Responsiveness: Historic platform response rate is {resp_rate * 100:.0f}%.")
            mitigation_suggestions.append("Set clear reply deadlines and establish SMS/Whatsapp channels for secondary contacts.")
            risk_score_acc += 0.5

        # Normalize risk score to [0.0, 1.0]
        final_risk_score = round(min(1.0, risk_score_acc / (checks_count * 0.5)), 2)

        # Assemble summary text
        if not detected_risks:
            risk_summary = "No significant risk signals identified. Profile appears highly stable and reliable."
        else:
            risk_summary = f"Identified {len(detected_risks)} recruiter concern(s), primarily regarding: {', '.join(detected_risks)}."

        return {
            "detected_risks": detected_risks,
            "risk_summary": risk_summary,
            "risk_score": final_risk_score,
            "mitigation_suggestions": list(set(mitigation_suggestions))
        }

    @staticmethod
    def generate_risk_report(
        candidate: Candidate,
        behavioral_intel: BehavioralIntelligence,
        reliability_profile: ReliabilityProfile,
        feature_vector: FeatureVector,
    ) -> Dict[str, Any]:
        """Alias for analyze_risks to match copilot service call patterns."""
        return RiskAnalysisEngine.analyze_risks(candidate, behavioral_intel, reliability_profile, feature_vector)
