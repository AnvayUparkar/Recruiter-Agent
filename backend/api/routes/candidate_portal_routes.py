import json
from flask import Blueprint, request, jsonify, g, current_app
from bson.objectid import ObjectId
from datetime import datetime

from api.db import get_db
from utils.logger import get_logger
from api.auth.auth_utils import require_auth

from models.candidate import Candidate
from models.profile import Profile, CompanySize
from models.career_history import CareerHistory
from models.education import Education, EducationTier
from models.skill import Skill, SkillProficiency
from models.language import Language, LanguageProficiency
from models.redrob_signals import RedrobSignals, ExpectedSalaryRange, PreferredWorkMode

from services.match_score_service import MatchScoreService

logger = get_logger(__name__)
candidate_portal_bp = Blueprint("candidate_portal", __name__)

_match_score_service = MatchScoreService()

@candidate_portal_bp.route("/jobs", methods=["GET"])
@require_auth()
def get_published_jobs():
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    # Fetch all published jobs
    jobs = list(db.jobs.find({"status": "Published"}).sort("created_at", -1))
    
    for j in jobs:
        j["_id"] = str(j["_id"])
        # Remove matched_candidates to save bandwidth for candidates
        if "matched_candidates" in j:
            del j["matched_candidates"]
            
    return jsonify({"status": "success", "data": jobs}), 200

@candidate_portal_bp.route("/jobs/<job_id>", methods=["GET"])
@require_auth()
def get_job_details(job_id):
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            return jsonify({"error": "Job not found"}), 404
        job["_id"] = str(job["_id"])
        if "matched_candidates" in job:
            del job["matched_candidates"]
        return jsonify({"status": "success", "data": job}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@candidate_portal_bp.route("/jobs/<job_id>/match", methods=["GET"])
@require_auth()
def get_job_match_score(job_id):
    db = get_db()
    candidate_id = g.user_id
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job: return jsonify({"error": "Job not found"}), 404

        user = db.users.find_one({"_id": ObjectId(candidate_id) if len(str(candidate_id))==24 else candidate_id})
        if not user or not user.get("resume_data"):
             return jsonify({"error": "Candidate resume not found"}), 400

        match_data = _match_score_service.calculate_match(str(candidate_id), job, user["resume_data"])
        
        return jsonify({"status": "success", "data": match_data}), 200
    except Exception as e:
        logger.error(f"Error calculating match: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 400

@candidate_portal_bp.route("/jobs/<job_id>/apply", methods=["POST"])
@require_auth()
def apply_to_job(job_id):
    db = get_db()
    candidate_id = g.user_id
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job: return jsonify({"error": "Job not found"}), 404

        # Check if already applied
        existing_app = db.applications.find_one({
            "job_id": job_id,
            "candidate_id": str(candidate_id)
        })
        if existing_app:
            return jsonify({"error": "You have already applied for this position."}), 400

        user = db.users.find_one({"_id": ObjectId(candidate_id) if len(str(candidate_id))==24 else candidate_id})
        if not user or not user.get("resume_data"):
            return jsonify({"error": "Please upload a resume before applying."}), 400

        # Calculate score snapshot
        match_data = _match_score_service.calculate_match(str(candidate_id), job, user["resume_data"])
        score_snapshot = match_data.get("score", 0)
        
        resume_version = user.get("resume_version") or _match_score_service.generate_resume_hash(user["resume_data"])

        application = {
            "job_id": job_id,
            "candidate_id": str(candidate_id),
            "recruiter_id": job.get("recruiter_id"),
            "status": "Applied",
            "applied_at": datetime.utcnow().isoformat(),
            "resume_snapshot": user["resume_data"],
            "resume_version": resume_version,
            "match_score_snapshot": score_snapshot,
            "match_details_snapshot": match_data
        }

        result = db.applications.insert_one(application)
        
        # Emit to recruiter
        try:
            from api.sockets import socketio
            socketio.emit("new_application", {
                "job_id": job_id, 
                "candidate_id": str(candidate_id),
                "score": score_snapshot
            }, to=job.get("recruiter_id"))
        except Exception as se:
            logger.warning(f"Socket emit failed: {se}")

        # Update applications count on job
        db.jobs.update_one({"_id": ObjectId(job_id)}, {"$inc": {"applications_count": 1}})

        return jsonify({"status": "success", "message": "Application submitted successfully."}), 201

    except Exception as e:
        logger.error(f"Error applying to job: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 400

@candidate_portal_bp.route("/applications", methods=["GET"])
@require_auth()
def get_my_applications():
    db = get_db()
    candidate_id = g.user_id
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        applications = list(db.applications.find({"candidate_id": str(candidate_id)}).sort("applied_at", -1))
        
        # Enrich with job details
        for app in applications:
            app["_id"] = str(app["_id"])
            job = db.jobs.find_one({"_id": ObjectId(app["job_id"])})
            if job:
                app["job_title"] = job.get("title")
                app["company"] = job.get("company", "Company")
                app["location"] = job.get("location")
            else:
                app["job_title"] = "Unknown Job"
                
        return jsonify({"status": "success", "data": applications}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@candidate_portal_bp.route("/jobs/<job_id>/save", methods=["POST"])
@require_auth()
def save_job(job_id):
    db = get_db()
    candidate_id = g.user_id
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        db.saved_jobs.update_one(
            {"candidate_id": str(candidate_id), "job_id": job_id},
            {"$set": {"saved_at": datetime.utcnow().isoformat()}},
            upsert=True
        )
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@candidate_portal_bp.route("/jobs/<job_id>/save", methods=["DELETE"])
@require_auth()
def unsave_job(job_id):
    db = get_db()
    candidate_id = g.user_id
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        db.saved_jobs.delete_one({"candidate_id": str(candidate_id), "job_id": job_id})
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@candidate_portal_bp.route("/saved-jobs", methods=["GET"])
@require_auth()
def get_saved_jobs():
    db = get_db()
    candidate_id = g.user_id
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        saved = list(db.saved_jobs.find({"candidate_id": str(candidate_id)}))
        job_ids = [ObjectId(s["job_id"]) for s in saved]
        jobs = list(db.jobs.find({"_id": {"$in": job_ids}}))
        
        for j in jobs:
            j["_id"] = str(j["_id"])
            if "matched_candidates" in j:
                del j["matched_candidates"]
                
        return jsonify({"status": "success", "data": jobs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
