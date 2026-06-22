"""Global Error Handling Middleware — Phase 14: Production API & Recruiter Suite.

Defines standardized JSON handlers for HTTP errors and exceptions.
"""

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException
from pydantic import ValidationError
from utils.logger import get_logger

logger = get_logger(__name__)


def register_error_handlers(app: Flask) -> None:
    """Registers unified JSON exception handlers on the Flask app.

    Args:
        app: The target Flask application instance.
    """

    @app.errorhandler(ValidationError)
    def handle_pydantic_validation_error(error: ValidationError):
        """Catches and formats Pydantic validation errors."""
        logger.warning(f"Pydantic validation failure: {error}")
        return jsonify({
            "error": "Validation Error",
            "details": error.errors()
        }), 400

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        """Catches and formats standard Werkzeug HTTP exceptions."""
        logger.warning(f"HTTP exception occurred: {error.code} - {error.description}")
        return jsonify({
            "error": error.name,
            "message": error.description
        }), error.code

    @app.errorhandler(404)
    def handle_not_found_error(error):
        """Catch-all for 404 Route Not Found errors."""
        logger.warning("Target resource not found.")
        return jsonify({
            "error": "Not Found",
            "message": "The requested API endpoint does not exist."
        }), 404

    @app.errorhandler(500)
    def handle_internal_server_error(error):
        """Catch-all for 500 server errors."""
        logger.error(f"Internal error triggered: {error}", exc_info=True)
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected server error occurred."
        }), 500

    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """Fallback handler for any other unhandled exceptions."""
        logger.exception("An unhandled exception escaped route controller logic.")
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred."
        }), 500
