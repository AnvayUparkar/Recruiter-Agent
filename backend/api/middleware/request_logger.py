"""Request Logger Middleware — Phase 14: Production API & Recruiter Suite.

Instruments Flask endpoints with request logging and performance latency tracing.
"""

import time
from flask import Flask, request, g
from services.analytics_service import AnalyticsService
from utils.logger import get_logger

logger = get_logger(__name__)


def register_request_logger(app: Flask) -> None:
    """Attaches hooks to the Flask app to track and log endpoint execution duration.

    Args:
        app: The target Flask application instance.
    """

    @app.before_request
    def start_timer():
        """Saves current high-resolution time at request entry."""
        g.start_time = time.perf_counter()
        logger.info(f"Incoming Request: {request.method} {request.path}")

    @app.after_request
    def log_request_performance(response):
        """Measures elapsed time, logs the result, and feeds the analytics service."""
        # Handle cases where before_request was skipped or crashed
        start_time = getattr(g, "start_time", None)
        if start_time is not None:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            # Log to Analytics telemetry service
            AnalyticsService.log_query(elapsed_ms)

            logger.info(
                f"Request Completed: {request.method} {request.path} | "
                f"Status: {response.status_code} | "
                f"Latency: {elapsed_ms:.2f}ms"
            )
        else:
            logger.info(f"Request Completed (no timer): {request.method} {request.path} | Status: {response.status_code}")

        return response
