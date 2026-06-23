"""Ranking Routes Blueprint — Phase 14: Production API & Recruiter Suite.

Exposes endpoints for candidate pool ranking and individual fit explanation.
"""

from flask import Blueprint, request, jsonify, current_app
from pydantic import ValidationError

from api.schemas.request_models import RankingRequest, ExplanationRequest
from api.schemas.response_models import RankingResponse, CandidateRankInfo, ExplanationResponse, RequirementMatch
from services.jd_analyzer import JdAnalyzer
from services.hybrid_retrieval_service import HybridRetrievalService
from services.candidate_repository import JSONLCandidateRepository
from services.candidate_intelligence_service import CandidateIntelligenceService
from services.recruiter_trust_service import RecruiterTrustService
from services.trustworthiness_service import TrustworthinessService
from services.feature_service import FeatureService
from services.final_ranking_service import FinalRankingService
from services.ranking_strategy import RankingStrategyType
from services.recruiter_reasoning import RecruiterReasoning
from services.explainability_service import ExplainabilityService
from utils.logger import get_logger

logger = get_logger(__name__)

ranking_bp = Blueprint("ranking", __name__)

# Service initializations
_jd_analyzer = JdAnalyzer()
_retrieval_service = HybridRetrievalService()
_candidate_intel_service = CandidateIntelligenceService()
_behavioral_service = RecruiterTrustService()
_reliability_service = TrustworthinessService()
_feature_service = FeatureService()
_ranking_service = FinalRankingService()


@ranking_bp.route("/rank", methods=["POST"])
def rank_candidates():
    """POST /api/v1/rank

    Parses a job description, retrieves candidate pool, scores and ranks them.
    """
    logger.info("Received request to rank candidates.")
    try:
        # 1. Parse and validate request payload
        data = request.get_json() or {}
        req = RankingRequest(**data)

        # 2. Analyze job description text
        parsed_jd = _jd_analyzer.analyze_jd(req.job_description)

        # 3. Retrieve matching candidate pool of exactly 200 candidates
        pool = _retrieval_service.retrieve_candidate_pool(parsed_jd, pool_size=200)
        candidate_ids = [c.candidate_id for c in pool.candidates]

        if not candidate_ids:
            return jsonify({
                "job_title": parsed_jd.job_title,
                "total_candidates_evaluated": 0,
                "ranked_candidates": [],
                "applied_weights": {},
                "processing_time_ms": 0.0,
                "metadata": {"error": "No candidates matched the retrieval query."}
            }), 200

        # 4. Load full Candidate aggregates from repository
        dataset_path = current_app.config.get("DATASET_PATH")
        repo = JSONLCandidateRepository(dataset_path)
        candidates = repo.find_many(candidate_ids)

        # Preserving retrieval order
        cand_map = {c.candidate_id: c for c in candidates}
        ordered_candidates = [cand_map[cid] for cid in candidate_ids if cid in cand_map]

        if not ordered_candidates:
            return jsonify({
                "job_title": parsed_jd.job_title,
                "total_candidates_evaluated": 0,
                "ranked_candidates": [],
                "applied_weights": {},
                "processing_time_ms": 0.0,
                "metadata": {"error": "Matched candidates could not be loaded from database."}
            }), 200

        # 5. Build candidate intelligence profiles
        profiles = _candidate_intel_service.build_batch_profiles(ordered_candidates)

        # 6. Build behavioral intelligence profiles
        bi_list = _behavioral_service.build_batch_profiles(ordered_candidates)
        bi_map = {bi.candidate_id: bi for bi in bi_list}

        # 7. Build reliability profiles
        rp_list = _reliability_service.build_batch_profiles(ordered_candidates, behavioral_intels=bi_map)
        rp_map = {rp.candidate_id: rp for rp in rp_list}

        # 8. Build feature vectors
        fvs_list = _feature_service.build_feature_vectors(
            candidates=ordered_candidates,
            profiles=profiles,
            parsed_jd=parsed_jd,
            pool=pool
        )
        fv_map = {fv.candidate_id: fv for fv in fvs_list}

        # 9. Execute final ranking
        strategy_type = RankingStrategyType(req.strategy)
        result = _ranking_service.rank_candidates(
            candidates=ordered_candidates,
            feature_vectors=fv_map,
            behavioral_intels=bi_map,
            reliability_profiles=rp_map,
            parsed_jd=parsed_jd,
            strategy=strategy_type
        )

        # 10. Formulate final Response (limiting output to req.limit)
        ranked_list = []
        for rc in result.ranked_candidates[:req.limit]:
            verdict = "Backup"
            summary = ""
            if rc.explanation:
                verdict = rc.explanation.fit_verdict
                summary = rc.explanation.summary

            # Load inline profile and redrob signals
            cand = cand_map.get(rc.candidate_id)
            profile_dict = {}
            signals_dict = {}
            if cand:
                profile_dict = cand.profile.model_dump()
                profile_dict["name"] = cand.profile.anonymized_name
                profile_dict["skills"] = [s.model_dump() for s in cand.skills]
                signals_dict = cand.redrob_signals.model_dump()

            # Serialize score_details if present
            score_details_dict = {}
            if rc.score_details:
                score_details_dict = rc.score_details.model_dump()
                # Ensure it maps properly to snake_case dictionary
                score_details_dict["candidate_id"] = rc.candidate_id

            ranked_list.append(CandidateRankInfo(
                candidate_id=rc.candidate_id,
                rank=rc.rank,
                final_score=rc.final_score,
                confidence=rc.confidence,
                verdict=verdict,
                summary=summary,
                score=rc.final_score,
                fit_verdict=verdict,
                reasoning=summary,
                profile=profile_dict,
                redrob_signals=signals_dict,
                score_details=score_details_dict
            ))

        response_payload = RankingResponse(
            job_title=result.job_title,
            total_candidates_evaluated=result.total_candidates_evaluated,
            ranked_candidates=ranked_list,
            applied_weights=result.applied_weights,
            processing_time_ms=result.processing_time_ms,
            metadata=result.ranking_metadata,
            status="success",
            total_ranked=len(ranked_list),
            candidates=ranked_list
        )

        return jsonify(response_payload.model_dump()), 200

    except ValidationError as ve:
        logger.warning(f"Request validation failed: {ve}")
        return jsonify({"error": "Validation Error", "details": ve.errors()}), 400
    except Exception as e:
        logger.error(f"Error during candidate ranking: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500


@ranking_bp.route("/explain", methods=["POST"])
def explain_candidate():
    """POST /api/v1/explain

    Generates a structured, evidence-grounded fit justification report for a candidate.
    """
    logger.info("Received request to explain candidate fit.")
    try:
        # 1. Parse and validate payload
        data = request.get_json() or {}
        req = ExplanationRequest(**data)

        # 2. Retrieve Candidate
        dataset_path = current_app.config.get("DATASET_PATH")
        repo = JSONLCandidateRepository(dataset_path)
        candidate = repo.find_by_id(req.candidate_id)

        if not candidate:
            return jsonify({"error": f"Candidate {req.candidate_id} not found."}), 404

        # 3. Formulate job description context
        jd_text = req.job_description or "We are looking for a Senior Professional with strong experience and skills."
        parsed_jd = _jd_analyzer.analyze_jd(jd_text)

        # 4. Generate candidate profiles and vectors
        profile = _candidate_intel_service.build_candidate_intelligence(candidate)
        bi = _behavioral_service.build_behavioral_profile(candidate)
        rp = _reliability_service.build_reliability_profile(candidate, bi)
        fv = _feature_service.build_candidate_features(candidate, profile, parsed_jd)

        # 5. Score candidate
        base_weights = _ranking_service.weight_manager.get_weights_for_jd(parsed_jd)
        score = _ranking_service.score_aggregator.aggregate(
            candidate=candidate,
            feature_vector=fv,
            behavioral_intel=bi,
            reliability_profile=rp,
            weights=base_weights,
        )

        # 6. Capture Reasoning and Explainability
        trace = RecruiterReasoning.capture_trace(
            candidate=candidate,
            parsed_jd=parsed_jd,
            feature_vector=fv,
            behavioral_intel=bi,
            reliability_profile=rp,
            score=score,
        )

        report = ExplainabilityService.generate_report(
            candidate=candidate,
            parsed_jd=parsed_jd,
            score=score,
            trace=trace,
        )

        # 7. Map to schema response
        matched_reqs = [
            RequirementMatch(
                name=mr["name"],
                matched=mr["matched"],
                importance=mr["importance"]
            )
            for mr in report.matched_requirements
        ]

        reasoning_text = "\n".join(trace.decision_steps)

        response_payload = ExplanationResponse(
            candidate_id=report.candidate_id,
            fit_verdict=report.fit_verdict,
            summary=report.summary,
            strengths=report.strengths,
            weaknesses=report.weaknesses,
            matched_requirements=matched_reqs,
            missing_requirements=report.missing_requirements,
            reasoning=reasoning_text
        )

        return jsonify(response_payload.model_dump()), 200

    except ValidationError as ve:
        logger.warning(f"Request validation failed: {ve}")
        return jsonify({"error": "Validation Error", "details": ve.errors()}), 400
    except Exception as e:
        logger.error(f"Error during candidate explanation: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500
