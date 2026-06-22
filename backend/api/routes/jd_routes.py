"""JD Routes Blueprint — Phase 14: Production API & Recruiter Suite.

Exposes endpoints for parsing and extracting specifications from job descriptions.
"""

from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from api.schemas.request_models import JDRequest
from services.jd_analyzer import JdAnalyzer
from services.jd_text_extractor import JdTextExtractor
from utils.logger import get_logger

logger = get_logger(__name__)

jd_bp = Blueprint("jd", __name__, url_prefix="/jd")
_analyzer = JdAnalyzer()


@jd_bp.route("/analyze", methods=["POST"])
def analyze_jd():
    """POST /api/v1/jd/analyze

    Parses raw JD text and returns clean structured requirements.
    """
    logger.info("Received request to analyze job description.")
    try:
        # 1. Parse and validate payload
        data = request.get_json() or {}
        req = JDRequest(**data)

        # 2. Process via service
        parsed = _analyzer.analyze_jd(req.job_description)

        # 3. Formulate output payload
        recruiter_view = _analyzer.generate_recruiter_view(parsed)

        return jsonify({
            "parsed_jd": parsed.model_dump(),
            "requirements": recruiter_view,
            "summary": parsed.summary,
        }), 200

    except ValidationError as ve:
        logger.warning(f"Request validation failed: {ve}")
        return jsonify({"error": "Validation Error", "details": ve.errors()}), 400
    except Exception as e:
        logger.error(f"Error analyzing job description: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500


@jd_bp.route("/extract-text", methods=["POST"])
def extract_text():
    """POST /api/v1/jd/extract-text

    Parses uploaded file and returns extracted text.
    """
    logger.info("Received request to extract text from file.")
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    try:
        extracted_text = JdTextExtractor.extract_text(file.filename, file.stream)
        return jsonify({"text": extracted_text}), 200
    except Exception as e:
        logger.error(f"Error extracting text from file {file.filename}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 400
