"""Health check route definition.

Exposes simple endpoints to verify server status and metadata.
"""

from flask import Blueprint, jsonify, Response
from utils.logger import get_logger

# Initialize Blueprint
health_bp = Blueprint("health", __name__)

# Fetch module logger
logger = get_logger(__name__)


@health_bp.route("/health", methods=["GET"])
def health_check() -> Response:
    """Checks the health of the Flask service.

    Returns:
        JSON response with the status, service name, and version, along with an HTTP 200 status.
    """
    logger.debug("Health check endpoint invoked.")
    
    response_data = {
        "status": "healthy",
        "service": "candidate-ranking-system",
        "version": "1.0.0",
    }
    
    return jsonify(response_data)
