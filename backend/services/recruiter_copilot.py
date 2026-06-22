"""Recruiter Copilot — Phase 15: AI Recruiter Copilot.

Orchestrates summary, strengths, risks, recommendations, and interview plans into a unified report.
"""

from datetime import datetime
from typing import List, Dict
from models.candidate import Candidate
from models.feature_vector import FeatureVector
from models.behavioral_intelligence import BehavioralIntelligence
from models.reliability_profile import ReliabilityProfile
from models.parsed_jd import ParsedJD
from models.recruiter_report import RecruiterReport

from services.recruiter_summary_generator import RecruiterSummaryGenerator
from services.strengths_extractor import StrengthsExtractor
from services.risk_analysis_engine import RiskAnalysisEngine
from services.hire_recommendation_engine import HireRecommendationEngine
from services.interview_planner import InterviewPlanner
from services.recruiter_insights import RecruiterInsights
from utils.logger import get_logger

logger = get_logger(__name__)


class RecruiterCopilot:
    """The master intelligence layer coordinating individual analysis engines into a master RecruiterReport."""

    @staticmethod
    def generate_report(
        candidate: Candidate,
        final_score: float,
        confidence: float,
        feature_vector: FeatureVector,
        behavioral_intel: BehavioralIntelligence,
        reliability_profile: ReliabilityProfile,
        parsed_jd: ParsedJD,
    ) -> RecruiterReport:
        """Runs the complete recruiter review compilation pipeline for a single candidate.

        Args:
            candidate: Candidate aggregate.
            final_score: Calibrated final score from ranking service.
            confidence: Confidence score of ranking.
            feature_vector: Candidate feature representation.
            behavioral_intel: Candidate behavioral intelligence.
            reliability_profile: Candidate reliability status.
            parsed_jd: Job description specification.

        Returns:
            RecruiterReport: The master consolidated candidate report.
        """
        cid = candidate.candidate_id
        logger.debug(f"Generating Recruiter Copilot Report for candidate: {cid}")

        # 1. Summary Generation
        summary = RecruiterSummaryGenerator.generate_summary(candidate, reliability_profile, parsed_jd)

        # 2. Strengths and Weaknesses Extraction
        strengths = StrengthsExtractor.extract_strengths(candidate, feature_vector, parsed_jd)
        weaknesses = StrengthsExtractor.extract_weaknesses(candidate, feature_vector, parsed_jd)

        # 3. Risk Analysis
        risk_report = RiskAnalysisEngine.analyze_risks(candidate, behavioral_intel, reliability_profile, feature_vector)
        risks = risk_report.get("detected_risks", [])

        # 4. Recommendation Decision
        recommendation = HireRecommendationEngine.generate_recommendation(
            candidate=candidate,
            final_score=final_score,
            confidence=confidence,
            behavioral_intel=behavioral_intel,
            reliability_profile=reliability_profile,
            parsed_jd=parsed_jd
        )

        # 5. Interview Planning
        interview_plan = InterviewPlanner.generate_plan(candidate, feature_vector, risk_report)

        # 6. Overall Assessment
        overall_assessment = (
            f"Based on candidate evaluation, we advise {recommendation.recommendation}. "
            f"Primary strengths focus on {', '.join(strengths[:2])}. "
        )
        if risks:
            overall_assessment += f"Recruiters should address identified warning indicators ({len(risks)}) in follow-up loops."
        else:
            overall_assessment += "No critical risk items identified. Proceed with standard technical screenings."

        return RecruiterReport(
            candidate_id=cid,
            recruiter_summary=summary,
            hire_recommendation=recommendation,
            strengths=strengths,
            weaknesses=weaknesses,
            risks=risks,
            interview_focus=interview_plan.focus_areas,
            confidence=round(confidence, 2),
            evidence=recommendation.evidence,
            overall_assessment=overall_assessment,
            generated_at=datetime.utcnow().isoformat()
        )

    @staticmethod
    def generate_batch_reports(
        candidates: List[Candidate],
        final_scores: Dict[str, float],
        confidences: Dict[str, float],
        feature_vectors: Dict[str, FeatureVector],
        behavioral_intels: Dict[str, BehavioralIntelligence],
        reliability_profiles: Dict[str, ReliabilityProfile],
        parsed_jd: ParsedJD,
    ) -> Dict[str, RecruiterReport]:
        """Orchestrates candidate reports for a list of candidates.

        Args:
            candidates: List of Candidate aggregates.
            final_scores: Mapping of candidate_id to final scores.
            confidences: Mapping of candidate_id to confidences.
            feature_vectors: Mapping of candidate_id to feature vectors.
            behavioral_intels: Mapping of candidate_id to behavioral intelligence.
            reliability_profiles: Mapping of candidate_id to reliability profiles.
            parsed_jd: Job description specification.

        Returns:
            Dict[str, RecruiterReport]: Mapping of candidate_id to RecruiterReport.
        """
        logger.info(f"Generating recruiter copilot reports in batch for {len(candidates)} candidates.")
        reports = {}

        for c in candidates:
            cid = c.candidate_id
            score = final_scores.get(cid, 0.5)
            conf = confidences.get(cid, 0.5)
            fv = feature_vectors.get(cid)
            bi = behavioral_intels.get(cid)
            rp = reliability_profiles.get(cid)

            if not fv or not bi or not rp:
                logger.warning(f"Skipping report for candidate {cid} due to missing feature or profile data.")
                continue

            reports[cid] = RecruiterCopilot.generate_report(
                candidate=c,
                final_score=score,
                confidence=conf,
                feature_vector=fv,
                behavioral_intel=bi,
                reliability_profile=rp,
                parsed_jd=parsed_jd
            )

        return reports
