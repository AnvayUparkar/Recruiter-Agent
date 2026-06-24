"""Copilot Routes Blueprint — Phase 15 & 17.

Exposes endpoints for recruiter copilot report generation, candidate comparison, and hiring manager proposals.
"""

from flask import Blueprint, request, jsonify, current_app
from pydantic import BaseModel, Field, ValidationError
from typing import Dict, Any, Optional, List

from services.jd_analyzer import JdAnalyzer
from services.copilot_service import CopilotService
from services.gemini_service import GeminiService
from utils.logger import get_logger

logger = get_logger(__name__)

copilot_bp = Blueprint("copilot", __name__)

_jd_analyzer = JdAnalyzer()
_copilot_service = CopilotService()
_gemini_service = GeminiService()


# Simple inline request models to validate inputs
class CopilotReportRequest(BaseModel):
    candidate_id: str = Field(..., pattern=r"^CAND_[0-9]{7}$")
    job_description: str = Field(..., min_length=20)


class CopilotCompareRequest(BaseModel):
    candidate_id_a: Optional[str] = Field(None, pattern=r"^CAND_[0-9]{7}$")
    candidate_id_b: Optional[str] = Field(None, pattern=r"^CAND_[0-9]{7}$")
    candidate_ids: Optional[List[str]] = Field(None)
    job_description: str = Field(..., min_length=20)


@copilot_bp.route("/report", methods=["POST"])
def get_candidate_report():
    """POST /api/v1/copilot/report

    Generates the recruiter copilot report for a single candidate.
    """
    logger.info("Received request to generate recruiter copilot report.")
    try:
        data = request.get_json() or {}
        req = CopilotReportRequest(**data)

        # Parse job description
        parsed_jd = _jd_analyzer.analyze_jd(req.job_description)

        # Generate report
        report = _copilot_service.generate_candidate_report(req.candidate_id, parsed_jd)
        if not report:
            return jsonify({"error": f"Candidate {req.candidate_id} not found."}), 404

        return jsonify(report.model_dump()), 200

    except ValidationError as ve:
        logger.warning(f"Request validation failed: {ve}")
        return jsonify({"error": "Validation Error", "details": ve.errors()}), 400
    except Exception as e:
        logger.error(f"Error generating recruiter report: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500


@copilot_bp.route("/compare", methods=["POST"])
def compare_candidates():
    """POST /api/v1/copilot/compare

    Compares multiple finalists side-by-side (2 to 5 candidates).
    """
    logger.info("Received request to compare candidates.")
    try:
        data = request.get_json() or {}
        req = CopilotCompareRequest(**data)

        # Parse job description
        parsed_jd = _jd_analyzer.analyze_jd(req.job_description)

        # Resolve candidate list
        candidate_ids = []
        if req.candidate_ids:
            candidate_ids = req.candidate_ids
        elif req.candidate_id_a and req.candidate_id_b:
            candidate_ids = [req.candidate_id_a, req.candidate_id_b]

        if len(candidate_ids) < 2 or len(candidate_ids) > 5:
            return jsonify({"error": "Must compare between 2 and 5 candidates."}), 400

        # Generate comparison
        result = _copilot_service.compare_candidates_multi(candidate_ids, parsed_jd)
        if not result:
            return jsonify({"error": "One or more candidates could not be loaded."}), 400

        return jsonify(result.model_dump()), 200

    except ValidationError as ve:
        logger.warning(f"Request validation failed: {ve}")
        return jsonify({"error": "Validation Error", "details": ve.errors()}), 400
    except Exception as e:
        logger.error(f"Error comparing candidates: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500



@copilot_bp.route("/decision", methods=["POST"])
def get_hiring_decision():
    """POST /api/v1/copilot/decision

    Evaluates a candidate and generates a hiring manager decision proposal.
    """
    logger.info("Received request to generate hiring proposal decision.")
    try:
        data = request.get_json() or {}
        req = CopilotReportRequest(**data)

        # Parse job description
        parsed_jd = _jd_analyzer.analyze_jd(req.job_description)

        # Generate hiring decision
        decision = _copilot_service.generate_hiring_decision(req.candidate_id, parsed_jd)
        if not decision:
            return jsonify({"error": f"Candidate {req.candidate_id} not found."}), 404

        return jsonify(decision.model_dump()), 200

    except ValidationError as ve:
        logger.warning(f"Request validation failed: {ve}")
        return jsonify({"error": "Validation Error", "details": ve.errors()}), 400
    except Exception as e:
        logger.error(f"Error generating hiring decision: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500


class GenerateInterviewQuestionsRequest(BaseModel):
    candidate: Dict[str, Any]
    job_description: Dict[str, Any]
    ranking: Optional[Dict[str, Any]] = None
    behavior: Optional[Dict[str, Any]] = None
    reliability: Optional[Dict[str, Any]] = None


@copilot_bp.route("/generate-interview-questions", methods=["POST"])
def generate_interview_questions():
    """POST /api/v1/copilot/generate-interview-questions

    Generates personalized dynamic questions using Gemini.
    """
    logger.info("Received request to generate interview questions using Gemini.")
    try:
        data = request.get_json() or {}
        req = GenerateInterviewQuestionsRequest(**data)

        # Call Gemini service
        questions = _gemini_service.generate_interview_questions(
            candidate=req.candidate,
            job_description=req.job_description,
            ranking=req.ranking,
            behavior=req.behavior,
            reliability=req.reliability
        )

        return jsonify(questions), 200

    except ValidationError as ve:
        logger.warning(f"Request validation failed: {ve}")
        return jsonify({"error": "Validation Error", "details": ve.errors()}), 400
    except ValueError as ve:
        logger.warning(f"API key missing: {ve}")
        return jsonify({"error": "Configuration Error", "message": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error generating interview questions: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500
