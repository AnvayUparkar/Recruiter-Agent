"""Health Routes Blueprint — Phase 14: Production API & Recruiter Suite.

Exposes status endpoints verifying connection to indexes and databases.
"""

from flask import Blueprint, jsonify, current_app
from api.schemas.response_models import HealthResponse
from services.candidate_repository import JSONLCandidateRepository
from services.bm25_index_manager import Bm25IndexManager
from services.faiss_index_manager import FaissIndexManager
from utils.logger import get_logger

logger = get_logger(__name__)

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """GET /api/v1/health

    Verifies server execution state, database candidate record counts, and search index availability.
    """
    logger.debug("Health status requested.")
    try:
        dataset_path = current_app.config.get("DATASET_PATH")
        repo = JSONLCandidateRepository(dataset_path)
        stats = repo.get_statistics()
        candidate_count = stats.get("total_candidate_records", 0)

        # Verify BM25 Index status
        bm25_ready = False
        try:
            bm25_manager = Bm25IndexManager()
            bm25_ready = bm25_manager.get_index() is not None
        except Exception as bm25_err:
            logger.warning(f"BM25 check failed: {bm25_err}")

        # Verify FAISS Index status
        faiss_ready = False
        try:
            faiss_manager = FaissIndexManager()
            faiss_ready = faiss_manager.get_index() is not None
        except Exception as faiss_err:
            logger.warning(f"FAISS check failed: {faiss_err}")

        # Build Health Response payload
        response = HealthResponse(
            status="healthy" if (bm25_ready and faiss_ready and candidate_count > 0) else "degraded",
            model_loaded=True,
            faiss_loaded=faiss_ready,
            bm25_loaded=bm25_ready,
            candidate_count=candidate_count
        )

        return jsonify(response.model_dump()), 200

    except Exception as e:
        logger.error(f"Health check encounter exception: {e}", exc_info=True)
        # Return degraded state
        return jsonify({
            "status": "unhealthy",
            "model_loaded": False,
            "faiss_loaded": False,
            "bm25_loaded": False,
            "candidate_count": 0,
            "error": str(e)
        }), 500
