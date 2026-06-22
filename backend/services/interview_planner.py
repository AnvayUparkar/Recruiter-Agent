"""Interview Planner — Phase 15: AI Recruiter Copilot.

Crates candidate-specific technical and behavioral interview guides.
"""

from typing import List, Dict, Any
from models.candidate import Candidate
from models.feature_vector import FeatureVector
from models.interview_plan import InterviewPlan
from utils.logger import get_logger

logger = get_logger(__name__)


class InterviewPlanner:
    """Auto-generates technical, behavioral, and verification interview questions for candidates."""

    @staticmethod
    def generate_plan(
        candidate: Candidate,
        feature_vector: FeatureVector,
        risk_report: Dict[str, Any],
    ) -> InterviewPlan:
        """Assembles a customized interview guide mapping questions to candidate details.

        Args:
            candidate: Candidate aggregate.
            feature_vector: Candidate feature representation.
            risk_report: Risk assessment report dictionary.

        Returns:
            InterviewPlan: The auto-generated interview guide.
        """
        technical_questions: List[str] = []
        behavioral_questions: List[str] = []
        leadership_questions: List[str] = []
        risk_validation_questions: List[str] = []
        focus_areas: List[str] = []

        # 1. Map technical features to questions
        # Check if candidate has retrieval/search skills
        skills_lower = {s.name.lower() for s in candidate.skills}
        is_retrieval_expert = "retrieval" in skills_lower or "faiss" in skills_lower or "elasticsearch" in skills_lower or "search" in skills_lower

        if is_retrieval_expert:
            technical_questions.append("Explain the architecture of a retrieval system you designed. How did you balance recall and precision?")
            focus_areas.append("Retrieval Architecture")
        else:
            technical_questions.append("Explain the architecture of a backend service you built recently. How did you design database integrations?")

        # Check Python / ML skills
        is_python_expert = "python" in skills_lower
        if is_python_expert:
            technical_questions.append("Discuss your approach to optimizing performance in a Python/Flask service. How do you handle concurrency?")
            focus_areas.append("Python Optimization")
        else:
            technical_questions.append("How do you manage dependency versions and testing environments in your project workflows?")

        # 2. Map leadership features to questions
        leadership_score = 0.5
        if hasattr(feature_vector, "leadership_features") and feature_vector.leadership_features:
            leadership_score = feature_vector.leadership_features.leadership_score

        if leadership_score >= 0.75:
            leadership_questions.append("Describe a technical decision where you influenced multiple teams. What trade-offs did you present?")
            leadership_questions.append("How do you mentor junior developers while maintaining high engineering speed?")
            focus_areas.append("Technical Leadership")
        else:
            leadership_questions.append("Describe a time when you had to take ownership of a failing feature. How did you coordinate resolution?")
            focus_areas.append("Ownership & Collaboration")

        # 3. Map behavioral signals to questions
        notice = candidate.redrob_signals.notice_period_days
        if notice <= 15:
            behavioral_questions.append("Since you have immediate availability, what is your transition schedule if offered this role?")
        elif notice >= 90:
            behavioral_questions.append("Your notice period is 90 days. Can this be negotiated down, or do you have accrued leaves to shorten it?")

        resp_rate = candidate.redrob_signals.recruiter_response_rate
        if resp_rate < 0.60:
            behavioral_questions.append("How do you typically manage communications when multiple recruiters contact you on the platform?")

        behavioral_questions.append("Describe a situation where a technical project scope changed mid-sprint. How did you adapt?")

        # 4. Map risk signals to questions
        risk_score = risk_report.get("risk_score", 0.0)
        detected_risks = risk_report.get("detected_risks", [])

        # If fraud or timeline anomalies exist
        has_timeline_issue = any("timeline" in r.lower() or "overlap" in r.lower() for r in detected_risks)
        has_fraud_issue = any("fraud" in r.lower() or "integrity" in r.lower() for r in detected_risks)

        if has_timeline_issue:
            risk_validation_questions.append("Could you walk through the exact start and end dates of your roles between 2020 and 2025?")
            focus_areas.append("Timeline Verification")
        if has_fraud_issue:
            risk_validation_questions.append("Walk through your specific hands-on role in the projects listed under Google and Stripe. What was your individual code contribution?")
            focus_areas.append("Profile Verification")

        if risk_score > 0.50:
            # Suggest more rounds for higher risk
            rounds = 3
            if not risk_validation_questions:
                risk_validation_questions.append("Please provide reference contacts for your two most recent engineering managers.")
        else:
            rounds = 2

        return InterviewPlan(
            technical_questions=technical_questions,
            behavioral_questions=behavioral_questions,
            leadership_questions=leadership_questions,
            risk_validation_questions=risk_validation_questions,
            focus_areas=list(set(focus_areas)),
            estimated_interview_rounds=rounds
        )
