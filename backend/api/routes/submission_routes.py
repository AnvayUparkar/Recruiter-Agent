"""Submission & Report Export Routes Blueprint — Phase 14, 15 & 17.

Exposes endpoints for generating submission CSVs and candidate dossiers.
"""

import json
from pathlib import Path
from flask import Blueprint, request, jsonify, current_app
from pydantic import BaseModel, Field, ValidationError

from services.jd_analyzer import JdAnalyzer
from services.hybrid_retrieval_service import HybridRetrievalService
from services.candidate_repository import JSONLCandidateRepository
from services.candidate_intelligence_service import CandidateIntelligenceService
from services.recruiter_trust_service import RecruiterTrustService
from services.trustworthiness_service import TrustworthinessService
from services.feature_service import FeatureService
from services.final_ranking_service import FinalRankingService
from services.submission_service import SubmissionService
from services.copilot_service import CopilotService
from utils.logger import get_logger

logger = get_logger(__name__)

submission_bp = Blueprint("submission", __name__)

_jd_analyzer = JdAnalyzer()
_retrieval_service = HybridRetrievalService()
_candidate_intel_service = CandidateIntelligenceService()
_behavioral_service = RecruiterTrustService()
_reliability_service = TrustworthinessService()
_feature_service = FeatureService()
_ranking_service = FinalRankingService()
_copilot_service = CopilotService()


class SubmissionExportRequest(BaseModel):
    job_description: str = Field(..., min_length=20)


class ReportExportRequest(BaseModel):
    candidate_id: str = Field(..., pattern=r"^CAND_[0-9]{7}$")
    format_type: str = Field("json", pattern="^(json|markdown|html)$")


@submission_bp.route("/submission/export", methods=["POST"])
def export_submission():
    """POST /api/v1/submission/export

    Ranks candidate pool and exports rankings to standard submissions CSV format.
    """
    logger.info("Received request to export candidate rankings CSV.")
    try:
        data = request.get_json() or {}
        req = SubmissionExportRequest(**data)

        # 1. Analyze Job Description
        parsed_jd = _jd_analyzer.analyze_jd(req.job_description)

        # 2. Retrieve pool matches
        pool = _retrieval_service.retrieve_candidate_pool(parsed_jd, pool_size=1000)
        candidate_ids = [c.candidate_id for c in pool.candidates]

        if not candidate_ids:
            return jsonify({"error": "No candidates matched the retrieval query."}), 400

        # 3. Load full candidate records
        dataset_path = current_app.config.get("DATASET_PATH")
        repo = JSONLCandidateRepository(dataset_path)
        candidates = repo.find_many(candidate_ids)

        cand_map = {c.candidate_id: c for c in candidates}
        ordered_candidates = [cand_map[cid] for cid in candidate_ids if cid in cand_map]

        if not ordered_candidates:
            return jsonify({"error": "Candidates could not be loaded."}), 400

        # 4. Score candidates
        profiles = _candidate_intel_service.build_batch_profiles(ordered_candidates)
        bi_list = _behavioral_service.build_batch_profiles(ordered_candidates)
        bi_map = {bi.candidate_id: bi for bi in bi_list}

        rp_list = _reliability_service.build_batch_profiles(ordered_candidates, behavioral_intels=bi_map)
        rp_map = {rp.candidate_id: rp for rp in rp_list}

        fvs_list = _feature_service.build_feature_vectors(
            candidates=ordered_candidates,
            profiles=profiles,
            parsed_jd=parsed_jd,
            pool=pool
        )
        fv_map = {fv.candidate_id: fv for fv in fvs_list}

        # 5. Order list
        result = _ranking_service.rank_candidates(
            candidates=ordered_candidates,
            feature_vectors=fv_map,
            behavioral_intels=bi_map,
            reliability_profiles=rp_map,
            parsed_jd=parsed_jd
        )

        # 6. Call Submission service
        output_dir = Path(current_app.config.get("OUTPUT_PATH")) / "submissions"
        top_candidates = result.ranked_candidates[:100]
        sub_res = SubmissionService.generate_submission(top_candidates, output_dir)

        # 7. Package and return response
        
        csv_content = ""
        try:
            with open(sub_res.file_path, "r", encoding="utf-8") as f:
                csv_content = f.read()
        except Exception as e:
            logger.warning(f"Could not read generated CSV: {e}")

        return jsonify({
            "exportPath": sub_res.file_path,
            "sha256Hash": sub_res.checksum,
            "rowCount": sub_res.candidate_count,
            "timestamp": sub_res.generated_at,
            "csvContent": csv_content
        }), 200

    except ValidationError as ve:
        logger.warning(f"Request validation failed: {ve}")
        return jsonify({"error": "Validation Error", "details": ve.errors()}), 400
    except Exception as e:
        logger.error(f"Error during submission export: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500


@submission_bp.route("/report/export", methods=["POST"])
def export_candidate_report():
    """POST /api/v1/report/export

    Writes a single candidate's recruiter evaluation report to disk in JSON, MD, or HTML format.
    """
    logger.info("Received request to export candidate dossier report.")
    try:
        data = request.get_json() or {}
        req = ReportExportRequest(**data)

        # We need a fallback JD if not active
        jd_text = "We are seeking a Senior Developer with competence in Python and distributed systems."
        parsed_jd = _jd_analyzer.analyze_jd(jd_text)

        report = _copilot_service.generate_candidate_report(req.candidate_id, parsed_jd)
        if not report:
            return jsonify({"error": f"Candidate {req.candidate_id} not found."}), 404

        output_dir = Path(current_app.config.get("OUTPUT_PATH")) / "reports"
        output_dir.mkdir(parents=True, exist_ok=True)

        content = ""
        file_name = f"candidate_report_{req.candidate_id}"

        if req.format_type == "markdown":
            file_name += ".md"
            content = f"# Recruiter Copilot Dossier: Candidate {report.candidate_id}\n\n"
            content += f"## Executive Summary\n{report.recruiter_summary}\n\n"
            content += f"## Fit Verdict\n**Recommendation:** {report.hire_recommendation.recommendation}\n\n"
            content += f"## Strengths\n" + "\n".join([f"- {s}" for s in report.strengths]) + "\n\n"
            content += f"## Areas of Interview Focus\n" + "\n".join([f"- {f}" for f in report.interview_focus]) + "\n\n"
        elif req.format_type == "html":
            file_name += ".html"
            content = f"<html><body><h1>Dossier for Candidate {report.candidate_id}</h1>"
            content += f"<p><strong>Recommendation:</strong> {report.hire_recommendation.recommendation}</p>"
            content += f"<h3>Factual Summary</h3><p>{report.recruiter_summary}</p></body></html>"
        else:
            file_name += ".json"
            content = json.dumps(report.model_dump(), indent=2)

        file_path = output_dir / file_name
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        return jsonify({
            "filePath": str(file_path),
            "content": content,
            "format": req.format_type
        }), 200

    except ValidationError as ve:
        logger.warning(f"Request validation failed: {ve}")
        return jsonify({"error": "Validation Error", "details": ve.errors()}), 400
    except Exception as e:
        logger.error(f"Error during report export: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

from flask import send_file

@submission_bp.route("/submission/download/<filename>", methods=["GET"])
def download_submission(filename: str):
    """GET /api/v1/submission/download/<filename>"""
    try:
        # Prevent path traversal
        clean_name = Path(filename).name
        output_dir = Path(current_app.config.get("OUTPUT_PATH")) / "submissions"
        file_path = output_dir / clean_name
        
        if not file_path.exists():
            return jsonify({"error": "File not found"}), 404
            
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        logger.error(f"Error downloading submission {filename}: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500
