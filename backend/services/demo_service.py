"""Demo Service — Phase 14: Production API & Recruiter Suite.

Runs mock end-to-end recruitment scenarios to demonstrate scoring, bonuses, and penalties.
"""

from pathlib import Path
from typing import Dict, Any, List
from models.candidate import Candidate
from models.parsed_jd import ParsedJD
from models.jd_requirements import Requirement, RequirementImportance
from models.feature_vector import FeatureVector
from models.behavioral_intelligence import BehavioralIntelligence
from models.reliability_profile import ReliabilityProfile
from tests.test_ranking_engine import (
    _make_candidate,
    _make_feature_vector,
    _make_behavioral_intelligence,
    _make_reliability_profile,
    _make_parsed_jd,
)
from services.final_ranking_service import FinalRankingService
from services.submission_service import SubmissionService
from services.report_generator import ReportGenerator
from services.evaluation_service import EvaluationService
from utils.logger import get_logger

logger = get_logger(__name__)


class DemoService:
    """Manages demonstration scenarios and generates test candidates and shortlists."""

    @staticmethod
    def run_demo(output_path: Path) -> Dict[str, Any]:
        """Runs a complete end-to-end ranking demo for presentations.

        Creates mock candidates, scores them, calibrations, sorts them, generates recruiter
        explanations, exports a submission CSV, and builds a PDF/Markdown report.

        Args:
            output_path: Destination directory for demo outputs.

        Returns:
            Dict[str, Any]: Execution details and generated file paths.
        """
        logger.info("Executing Phase 14 recruiter pipeline demo scenario.")

        # 1. Setup mock candidate pool
        c1 = _make_candidate(
            "CAND_0000001",
            years_exp=7.0,
            notice_period_days=15,  # immediate joiner bonus (+0.05)
            average_tenure=3.0,     # stable tenure bonus (+0.05)
            location="Bengaluru",
        )
        c2 = _make_candidate(
            "CAND_0000002",
            years_exp=2.0,
            notice_period_days=90,  # long notice period penalty (-0.05)
            average_tenure=0.7,     # job hopper penalty (-0.10)
            location="Bengaluru",
        )
        c3 = _make_candidate(
            "CAND_0000003",
            years_exp=5.0,
            notice_period_days=30,
            average_tenure=1.8,
            location="Bengaluru",
        )

        candidates = [c1, c2, c3]

        # 2. Build corresponding signals
        fvs = {
            "CAND_0000001": _make_feature_vector(technical=0.85, matching=0.85),
            "CAND_0000002": _make_feature_vector(technical=0.45, matching=0.40),
            "CAND_0000003": _make_feature_vector(technical=0.75, matching=0.70),
        }
        bis = {
            "CAND_0000001": _make_behavioral_intelligence("CAND_0000001", score=0.85),
            "CAND_0000002": _make_behavioral_intelligence("CAND_0000002", score=0.40),
            "CAND_0000003": _make_behavioral_intelligence("CAND_0000003", score=0.70),
        }
        rps = {
            "CAND_0000001": _make_reliability_profile("CAND_0000001", reliability_score=0.95),
            # CAND 2 has elevated fraud risk penalty
            "CAND_0000002": _make_reliability_profile("CAND_0000002", reliability_score=0.45, fraud_risk=0.55),
            "CAND_0000003": _make_reliability_profile("CAND_0000003", reliability_score=0.80),
        }

        jd = _make_parsed_jd()

        # 3. Execute ranking service
        rank_service = FinalRankingService()
        response = rank_service.rank_candidates(
            candidates=candidates,
            feature_vectors=fvs,
            behavioral_intels=bis,
            reliability_profiles=rps,
            parsed_jd=jd,
        )

        # 4. Generate CSV Submission
        submission = SubmissionService.generate_submission(response.ranked_candidates, output_path)

        # 5. Evaluate the pool
        evaluation = EvaluationService.evaluate_pool(response.ranked_candidates)

        # 6. Generate report document (PDF/HTML fallback)
        report_file = ReportGenerator.generate_report(
            job_title=jd.job_title,
            ranked_candidates=response.ranked_candidates,
            evaluation_report=evaluation,
            output_dir=output_path,
        )

        logger.info("Demo scenario finished successfully.")
        return {
            "demo_job_title": jd.job_title,
            "candidates_ranked": len(response.ranked_candidates),
            "submission_csv_path": str(submission.file_path),
            "submission_validation_status": submission.validation_status,
            "report_path": str(report_file),
            "top_candidate_id": response.ranked_candidates[0].candidate_id,
            "top_candidate_score": response.ranked_candidates[0].final_score,
            "ndcg_score": evaluation.ndcg.get("ndcg_at_5", 0.0),
        }
