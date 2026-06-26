"""Application factory module for the Candidate Ranking System.

Implements create_app, directory creation, global error handling, and CORS registration.
"""

import os
from pathlib import Path
from flask import Flask, jsonify, Response, Blueprint
from flask_cors import CORS

from config import config_by_name
from utils.logger import setup_logging, get_logger
from routes.health_routes import health_bp

# Get log helper (will resolve root logger configurations later)
logger = get_logger("app_factory")


def ensure_directories(config_obj) -> None:
    """Checks and creates all required directories on server startup.

    Does not crash if folders exist, and logs errors cleanly.

    Args:
        config_obj: The loaded Flask configuration instance.
    """
    required_directories = [
        config_obj.DATA_PATH,
        config_obj.DATA_PATH / "candidates",
        config_obj.DATA_PATH / "jobs",
        config_obj.INDEX_PATH,
        config_obj.OUTPUT_PATH,
        config_obj.OUTPUT_PATH / "logs",
        config_obj.OUTPUT_PATH / "submissions",
    ]

    for directory in required_directories:
        try:
            directory.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            # Output to stderr as fallback prior to logger setup completion
            import sys
            sys.stderr.write(f"Error initializing directory structure {directory}: {e}\n")


def register_error_handlers(app: Flask) -> None:
    """Attaches global error handlers to the Flask application.

    Ensures all error responses are returned as JSON structure and stack traces
    are never exposed to the client.

    Args:
        app: The Flask app instance.
    """

    @app.errorhandler(404)
    def handle_not_found(error) -> tuple[Response, int]:
        logger.warning("Resource not found (404 triggered).")
        return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(500)
    def handle_internal_server_error(error) -> tuple[Response, int]:
        logger.error(f"Internal Server Error: {error}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

    @app.errorhandler(Exception)
    def handle_unhandled_exception(error) -> tuple[Response, int]:
        logger.exception("An unhandled exception occurred during request routing.")
        return jsonify({"error": "Internal Server Error"}), 500


def create_app(config_name: str = None) -> Flask:
    """Instantiates and configures the Flask application factory.

    Resolves configurations, initializes logging handlers, creates initial structures,
    registers application routes and handles exceptions.

    Args:
        config_name: Optional configuration string (development, production, testing).

    Returns:
        Flask: The initialized Flask application instance.
    """
    if not config_name:
        config_name = os.environ.get("FLASK_ENV", "development")

    config_obj = config_by_name.get(config_name, config_by_name["default"])

    # 1. Initialize directories to ensure logging path exists
    ensure_directories(config_obj)

    # 2. Setup Centralized Log Handlers
    log_dir_path = config_obj.OUTPUT_PATH / "logs"
    setup_logging(log_level=config_obj.LOG_LEVEL, log_dir=log_dir_path)

    logger.info(f"Booting Candidate Ranking Backend [Env: {config_name}]")

    app = Flask(__name__)
    app.config.from_object(config_obj)

    # Initialize DB
    from api.db import init_app as init_db
    init_db(app)

    # Warm up candidate repository singleton at startup and store in app extensions
    from services.candidate_repository import JSONLCandidateRepository
    app.extensions["candidate_repos"] = {
        Path(config_obj.DATASET_PATH).resolve(): JSONLCandidateRepository(config_obj.DATASET_PATH)
    }

    # 3. Setup CORS
    CORS(app)

    # 4. Attach request timing and logging middleware
    from api.middleware.request_logger import register_request_logger
    register_request_logger(app)

    # 5. Register Blueprints
    # Legacy health route registered at root for backward compatibility
    app.register_blueprint(health_bp)

    # API v1 endpoints registered under unified /api/v1 prefix
    api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")

    from api.routes.jd_routes import jd_bp
    from api.routes.retrieval_routes import retrieval_bp
    from api.routes.ranking_routes import ranking_bp
    from api.routes.metrics_routes import metrics_bp
    from api.routes.health_routes import health_bp as api_health_bp
    from api.routes.copilot_routes import copilot_bp
    from api.routes.submission_routes import submission_bp
    from api.routes.user_routes import user_bp
    from api.auth import auth_bp

    api_v1.register_blueprint(auth_bp, url_prefix="/auth")
    api_v1.register_blueprint(user_bp, url_prefix="/user")
    api_v1.register_blueprint(jd_bp)
    api_v1.register_blueprint(retrieval_bp)
    api_v1.register_blueprint(ranking_bp)
    api_v1.register_blueprint(metrics_bp)
    api_v1.register_blueprint(api_health_bp)
    api_v1.register_blueprint(copilot_bp, url_prefix="/copilot")
    api_v1.register_blueprint(submission_bp)

    app.register_blueprint(api_v1)

    # 6. Global Error Handling Middleware
    from api.middleware.error_handler import register_error_handlers as register_api_error_handlers
    register_api_error_handlers(app)

    logger.info("Application initialized successfully.")
    return app



# Instance variable for standard WSGI servers (e.g. gunicorn)
app = create_app()

if __name__ == "__main__":
    # Fetch parameters from configured environment
    host = app.config.get("HOST", "0.0.0.0")
    port = app.config.get("PORT", 5000)
    debug = app.config.get("DEBUG", False)

    logger.info(f"Starting server on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
