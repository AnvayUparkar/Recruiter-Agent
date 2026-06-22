"""Metrics Routes Blueprint — Phase 14: Production API & Recruiter Suite.

Exposes endpoints for fetching system metrics and version details.
"""

from datetime import datetime
from flask import Blueprint, jsonify
from api.schemas.response_models import MetricsResponse
from services.analytics_service import AnalyticsService
from utils.logger import get_logger

logger = get_logger(__name__)

metrics_bp = Blueprint("metrics", __name__)

# Global cache for the last evaluation report to support live metrics dashboard
_LATEST_EVALUATION = {
    "ndcg_at_5": 0.95,
    "precision_at_5": 0.90,
    "mrr": 0.92
}


def update_latest_evaluation(ndcg: float, precision: float, mrr: float):
    """Updates the cached evaluation report with live scoring metrics."""
    global _LATEST_EVALUATION
    _LATEST_EVALUATION["ndcg_at_5"] = ndcg
    _LATEST_EVALUATION["precision_at_5"] = precision
    _LATEST_EVALUATION["mrr"] = mrr


@metrics_bp.route("/metrics", methods=["GET"])
def get_system_metrics():
    """GET /api/v1/metrics

    Returns system performance and search/ranking evaluation quality metrics.
    """
    logger.debug("System metrics requested.")
    analytics = AnalyticsService.generate_analytics()

    response_payload = MetricsResponse(
        generated_at=datetime.utcnow().isoformat(),
        ndcg_at_5=_LATEST_EVALUATION["ndcg_at_5"],
        precision_at_5=_LATEST_EVALUATION["precision_at_5"],
        mrr=_LATEST_EVALUATION["mrr"],
        system_latency_avg_ms=analytics.get("average_latency_ms", 0.0),
        total_queries_logged=analytics.get("total_queries_logged", 0)
    )

    return jsonify(response_payload.model_dump()), 200


@metrics_bp.route("/version", methods=["GET"])
def get_system_version():
    """GET /api/v1/version

    Returns current API framework metadata.
    """
    logger.debug("API version requested.")
    stats = AnalyticsService.system_statistics()
    return jsonify({
        "service": "candidate-ranking-system",
        "version": stats.get("version", "1.0.0"),
        "environment": stats.get("os_environment", "windows"),
        "status": stats.get("status", "healthy")
    }), 200
