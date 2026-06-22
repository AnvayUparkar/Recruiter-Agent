"""Retrieval Routes Blueprint — Phase 14: Production API & Recruiter Suite.

Exposes endpoints for candidate discovery using lexical and semantic indexes.
"""

from flask import Blueprint, request, jsonify, current_app
from pydantic import ValidationError
from api.schemas.request_models import RetrievalRequest
from services.jd_analyzer import JdAnalyzer
from services.hybrid_retrieval_service import HybridRetrievalService
from services.candidate_repository import JSONLCandidateRepository
from utils.logger import get_logger

logger = get_logger(__name__)

retrieval_bp = Blueprint("retrieval", __name__)
_jd_analyzer = JdAnalyzer()
_retrieval_service = HybridRetrievalService()


@retrieval_bp.route("/candidates/<candidate_id>", methods=["GET"])
def get_candidate_details(candidate_id):
    """GET /api/v1/candidates/<candidate_id>

    Retrieves full profile details for a candidate.
    """
    logger.info(f"Received request to fetch details for candidate: {candidate_id}")
    try:
        dataset_path = current_app.config.get("DATASET_PATH")
        repo = JSONLCandidateRepository(dataset_path)
        candidate = repo.find_by_id(candidate_id)
        if not candidate:
            return jsonify({"error": f"Candidate {candidate_id} not found."}), 404
        return jsonify(candidate.model_dump()), 200
    except Exception as e:
        logger.error(f"Error retrieving candidate: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500



@retrieval_bp.route("/retrieve", methods=["POST"])
def retrieve_candidates():
    """POST /api/v1/retrieve

    Retrieves candidates matching a job description using hybrid channels.
    """
    logger.info("Received request to retrieve candidates.")
    try:
        # 1. Parse and validate
        data = request.get_json() or {}
        req = RetrievalRequest(**data)

        # 2. Analyze job description
        parsed_jd = _jd_analyzer.analyze_jd(req.job_description)

        # 3. Retrieve candidates
        response = _retrieval_service.retrieve_top_candidates(
            parsed_jd=parsed_jd,
            top_k=req.limit,
        )

        return jsonify(response.model_dump()), 200

    except ValidationError as ve:
        logger.warning(f"Request validation failed: {ve}")
        return jsonify({"error": "Validation Error", "details": ve.errors()}), 400
    except Exception as e:
        logger.error(f"Error during candidate retrieval: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500
