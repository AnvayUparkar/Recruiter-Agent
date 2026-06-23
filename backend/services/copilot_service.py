"""Copilot Service — Phase 15: AI Recruiter Copilot.

High-level interface for single candidate audits, finalist comparison, and hiring decisions.
"""

from pathlib import Path
from typing import List, Dict, Optional, Any
from models.candidate import Candidate
from models.parsed_jd import ParsedJD
from models.recruiter_report import RecruiterReport
from models.candidate_comparison_result import CandidateComparisonResult
from models.hiring_decision import HiringDecision

from services.candidate_repository import JSONLCandidateRepository
from services.candidate_intelligence_service import CandidateIntelligenceService
from services.recruiter_trust_service import RecruiterTrustService
from services.trustworthiness_service import TrustworthinessService
from services.feature_service import FeatureService
from services.final_ranking_service import FinalRankingService
from services.recruiter_copilot import RecruiterCopilot
from services.candidate_comparison import CandidateComparison
from utils.logger import get_logger

logger = get_logger(__name__)


class CopilotService:
    """The high-level entry orchestrator for the Recruiter Copilot and Hiring Intelligence Engine."""

    def __init__(self, dataset_path: Optional[Path] = None):
        """Initializes the CopilotService with optionally-overridden dataset paths.

        Args:
            dataset_path: Path to candidates.jsonl dataset (or loads dynamically).
        """
        self.dataset_path = dataset_path

        # Core subsystem initializations
        self.candidate_intel_service = CandidateIntelligenceService()
        self.behavioral_service = RecruiterTrustService()
        self.reliability_service = TrustworthinessService()
        self.feature_service = FeatureService()
        self.ranking_service = FinalRankingService()

    def _get_dataset_path(self) -> Path:
        """Dynamically resolves candidate database path from Flask config or default configurations."""
        if self.dataset_path:
            return self.dataset_path

        try:
            from flask import current_app
            path = current_app.config.get("DATASET_PATH")
            if path:
                return Path(path)
        except Exception:
            pass

        # Fallback to Config or dynamically resolved path
        from config import Config
        if hasattr(Config, "DATASET_PATH"):
            return Config.DATASET_PATH
        
        base_dir = Path(__file__).resolve().parent.parent
        return base_dir.parent / "[PUB] India_runs_data_and_ai_challenge" / "India_runs_data_and_ai_challenge" / "candidates.jsonl"

    def generate_candidate_report(self, candidate_id: str, parsed_jd: ParsedJD) -> Optional[RecruiterReport]:
        """Loads candidate details and generates the recruiter copilot report.

        Args:
            candidate_id: Unique candidate ID CAND_XXXXXXX.
            parsed_jd: Job Description specification.

        Returns:
            Optional[RecruiterReport]: Generated report, or None if candidate is missing.
        """
        repo = JSONLCandidateRepository(self._get_dataset_path())
        candidate = repo.find_by_id(candidate_id)
        if not candidate:
            logger.warning(f"Candidate {candidate_id} not found in database.")
            return None

        # 1. Process candidate intelligence
        profile = self.candidate_intel_service.build_candidate_intelligence(candidate)
        bi = self.behavioral_service.build_behavioral_profile(candidate)
        rp = self.reliability_service.build_reliability_profile(candidate, bi)
        fv = self.feature_service.build_candidate_features(candidate, profile, parsed_jd)

        # 2. Score candidate alignment
        base_weights = self.ranking_service.weight_manager.get_weights_for_jd(parsed_jd)
        score = self.ranking_service.score_aggregator.aggregate(
            candidate=candidate,
            feature_vector=fv,
            behavioral_intel=bi,
            reliability_profile=rp,
            weights=base_weights
        )

        # 3. Assemble and return Copilot Report
        return RecruiterCopilot.generate_report(
            candidate=candidate,
            final_score=score.final_score,
            confidence=score.confidence,
            feature_vector=fv,
            behavioral_intel=bi,
            reliability_profile=rp,
            parsed_jd=parsed_jd
        )

    def generate_batch_reports(
        self,
        candidate_ids: List[str],
        parsed_jd: ParsedJD,
    ) -> Dict[str, RecruiterReport]:
        """Generates copilot reports for a batch of candidate IDs.

        Supports streaming-like loop yielding under 30 seconds for 100 reports on CPU.

        Args:
            candidate_ids: List of candidate IDs to evaluate.
            parsed_jd: Job Description specification.

        Returns:
            Dict[str, RecruiterReport]: Mapping of candidate_id to RecruiterReport.
        """
        logger.info(f"Triggering batch copilot reports for {len(candidate_ids)} candidates.")
        repo = JSONLCandidateRepository(self._get_dataset_path())
        candidates = repo.find_many(candidate_ids)

        # Fetch and map records
        cand_map = {c.candidate_id: c for c in candidates}
        ordered_candidates = [cand_map[cid] for cid in candidate_ids if cid in cand_map]

        if not ordered_candidates:
            return {}

        # 1. Build profiles in batch chunks
        profiles = self.candidate_intel_service.build_batch_profiles(ordered_candidates)
        bi_list = self.behavioral_service.build_batch_profiles(ordered_candidates)
        bi_map = {bi.candidate_id: bi for bi in bi_list}

        rp_list = self.reliability_service.build_batch_profiles(ordered_candidates, behavioral_intels=bi_map)
        rp_map = {rp.candidate_id: rp for rp in rp_list}

        # 2. Build feature vectors
        fvs_list = self.feature_service.build_feature_vectors(
            candidates=ordered_candidates,
            profiles=profiles,
            parsed_jd=parsed_jd
        )
        fv_map = {fv.candidate_id: fv for fv in fvs_list}

        # 3. Score candidates using aggregator
        base_weights = self.ranking_service.weight_manager.get_weights_for_jd(parsed_jd)
        scores_map = {}
        for c in ordered_candidates:
            cid = c.candidate_id
            fv = fv_map[cid]
            bi = bi_map[cid]
            rp = rp_map[cid]
            scores_map[cid] = self.ranking_service.score_aggregator.aggregate(
                candidate=c,
                feature_vector=fv,
                behavioral_intel=bi,
                reliability_profile=rp,
                weights=base_weights
            )

        # 4. Package all reports
        reports = {}
        for c in ordered_candidates:
            cid = c.candidate_id
            score = scores_map[cid]
            fv = fv_map[cid]
            bi = bi_map[cid]
            rp = rp_map[cid]

            reports[cid] = RecruiterCopilot.generate_report(
                candidate=c,
                final_score=score.final_score,
                confidence=score.confidence,
                feature_vector=fv,
                behavioral_intel=bi,
                reliability_profile=rp,
                parsed_jd=parsed_jd
            )

        return reports

    def compare_candidates(
        self,
        candidate_id_a: str,
        candidate_id_b: str,
        parsed_jd: ParsedJD,
    ) -> Optional[CandidateComparisonResult]:
        """Loads two candidates and returns a side-by-side comparison.

        Args:
            candidate_id_a: First candidate.
            candidate_id_b: Second candidate.
            parsed_jd: Job Description specification.

        Returns:
            Optional[CandidateComparisonResult]: Structured comparison, or None if either is missing.
        """
        repo = JSONLCandidateRepository(self._get_dataset_path())
        candidate_a = repo.find_by_id(candidate_id_a)
        candidate_b = repo.find_by_id(candidate_id_b)

        if not candidate_a or not candidate_b:
            logger.warning("One or both candidates could not be loaded for comparison.")
            return None

        # Build structures for Candidate A
        profile_a = self.candidate_intel_service.build_candidate_intelligence(candidate_a)
        bi_a = self.behavioral_service.build_behavioral_profile(candidate_a)
        rp_a = self.reliability_service.build_reliability_profile(candidate_a, bi_a)
        fv_a = self.feature_service.build_candidate_features(candidate_a, profile_a, parsed_jd)

        # Build structures for Candidate B
        profile_b = self.candidate_intel_service.build_candidate_intelligence(candidate_b)
        bi_b = self.behavioral_service.build_behavioral_profile(candidate_b)
        rp_b = self.reliability_service.build_reliability_profile(candidate_b, bi_b)
        fv_b = self.feature_service.build_candidate_features(candidate_b, profile_b, parsed_jd)

        # Score both
        base_weights = self.ranking_service.weight_manager.get_weights_for_jd(parsed_jd)
        score_a = self.ranking_service.score_aggregator.aggregate(candidate_a, fv_a, bi_a, rp_a, base_weights)
        score_b = self.ranking_service.score_aggregator.aggregate(candidate_b, fv_b, bi_b, rp_b, base_weights)

        # Run comparison
        return CandidateComparison.compare_candidates(
            candidate_a=candidate_a,
            fv_a=fv_a,
            score_a=score_a,
            rp_a=rp_a,
            candidate_b=candidate_b,
            fv_b=fv_b,
            score_b=score_b,
            rp_b=rp_b
        )

    def generate_hiring_decision(self, candidate_id: str, parsed_jd: ParsedJD) -> Optional[HiringDecision]:
        """Runs the audit and determines a final submission decision proposal.

        Args:
            candidate_id: Unique candidate ID CAND_XXXXXXX.
            parsed_jd: Job Description specification.

        Returns:
            Optional[HiringDecision]: Packaged hiring decision.
        """
        report = self.generate_candidate_report(candidate_id, parsed_jd)
        if not report:
            return None

        rec = report.hire_recommendation
        verdict = rec.recommendation

        # Determine decision outcome string
        if verdict in ("Strong Hire", "Hire"):
            decision_str = "Submit to Hiring Manager"
        elif verdict in ("Interview", "Consider"):
            decision_str = "Hold / Backup Stage"
        else:
            decision_str = "Reject / Archive Profile"

        # Formulate risk summary text
        risk_summary = (
            f"The candidate is classified as a '{verdict}'. "
            f"Key profile risks include: {', '.join(report.risks) if report.risks else 'No critical warning flags.'}"
        )

        return HiringDecision(
            decision=decision_str,
            confidence=rec.confidence,
            rationale=f"Hiring proposal generated for candidate {candidate_id}. Rationale: {rec.reasoning}",
            supporting_evidence=report.evidence,
            risk_summary=risk_summary,
            recommendation=rec
        )
