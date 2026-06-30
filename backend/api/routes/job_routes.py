from flask import Blueprint, request, jsonify, current_app
from utils.logger import get_logger
from services.job_matcher import JobRecommendationEngine
from api.db import get_db
from models.job_posting import JobPosting
from bson import ObjectId
from datetime import datetime
import json

from api.schemas.request_models import RankingRequest
from services.jd_analyzer import JdAnalyzer
from services.hybrid_retrieval_service import HybridRetrievalService
from services.candidate_repository import JSONLCandidateRepository
from services.candidate_intelligence_service import CandidateIntelligenceService
from services.recruiter_trust_service import RecruiterTrustService
from services.trustworthiness_service import TrustworthinessService
from services.feature_service import FeatureService
from services.final_ranking_service import FinalRankingService
from services.ranking_strategy import RankingStrategyType

# Use auth utils if needed; ignoring auth decorator for hackathon simplicity unless strictly needed.
from services.match_score_service import MatchScoreService
logger = get_logger(__name__)
job_bp = Blueprint("job", __name__)
_match_score_service = MatchScoreService()
recommendation_engine = JobRecommendationEngine()

# Initialize ranking services
_jd_analyzer = JdAnalyzer()
_retrieval_service = HybridRetrievalService()
_candidate_intel_service = CandidateIntelligenceService()
_behavioral_service = RecruiterTrustService()
_reliability_service = TrustworthinessService()
_feature_service = FeatureService()
_ranking_service = FinalRankingService()

def get_current_recruiter_id():
    """Extract recruiter_id from headers or return default"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        from api.auth.jwt_utils import decode_token
        try:
            payload = decode_token(auth_header.split(" ")[1])
            return payload.get("sub", "demo-recruiter")
        except Exception:
            pass
    return "demo-recruiter"

def run_candidate_matching(job_data: dict, limit: int = 50):
    """Reuses ranking engine to find matches for a job posting."""
    try:
        jd_text = job_data.get("description", "")
        if not jd_text:
            return []
            
        parsed_jd = _jd_analyzer.analyze_jd(jd_text)
        
        # Override with manual inputs if needed
        parsed_jd.job_title = job_data.get("title", parsed_jd.job_title)
        
        pool = _retrieval_service.retrieve_candidate_pool(parsed_jd, pool_size=200)
        candidate_ids = [c.candidate_id for c in pool.candidates]
        
        if not candidate_ids: return []
        
        dataset_path = current_app.config.get("DATASET_PATH")
        repo = JSONLCandidateRepository(dataset_path)
        candidates = repo.find_many(candidate_ids)
        cand_map = {c.candidate_id: c for c in candidates}
        ordered_candidates = [cand_map[cid] for cid in candidate_ids if cid in cand_map]
        
        if not ordered_candidates: return []
        
        profiles = _candidate_intel_service.build_batch_profiles(ordered_candidates)
        bi_list = _behavioral_service.build_batch_profiles(ordered_candidates)
        bi_map = {bi.candidate_id: bi for bi in bi_list}
        rp_list = _reliability_service.build_batch_profiles(ordered_candidates, behavioral_intels=bi_map)
        rp_map = {rp.candidate_id: rp for rp in rp_list}
        
        fvs_list = _feature_service.build_feature_vectors(
            candidates=ordered_candidates, profiles=profiles, parsed_jd=parsed_jd, pool=pool
        )
        fv_map = {fv.candidate_id: fv for fv in fvs_list}
        
        result = _ranking_service.rank_candidates(
            candidates=ordered_candidates, feature_vectors=fv_map,
            behavioral_intels=bi_map, reliability_profiles=rp_map,
            parsed_jd=parsed_jd, strategy=RankingStrategyType.HYBRID
        )
        
        ranked_list = []
        for rc in result.ranked_candidates[:limit]:
            cand = cand_map.get(rc.candidate_id)
            if not cand: continue
            
            profile_dict = cand.profile.model_dump()
            profile_dict["name"] = cand.profile.anonymized_name
            profile_dict["skills"] = [s.model_dump() for s in cand.skills]
            
            ranked_list.append({
                "candidate_id": rc.candidate_id,
                "rank": rc.rank,
                "score": rc.final_score,
                "confidence": rc.confidence,
                "verdict": rc.explanation.fit_verdict if rc.explanation else "Backup",
                "summary": rc.explanation.summary if rc.explanation else "",
                "profile": profile_dict,
                "redrob_signals": cand.redrob_signals.model_dump() if cand.redrob_signals else {}
            })
            
        return ranked_list
    except Exception as e:
        logger.error(f"Error running candidate matching: {e}")
        return []

@job_bp.route("", methods=["POST"])
def create_job():
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    data = request.json or {}
    try:
        data["recruiter_id"] = get_current_recruiter_id()
        job = JobPosting(**data)
        job_dict = job.model_dump(by_alias=True, exclude_none=True)
        if "_id" in job_dict: del job_dict["_id"]
        
        result = db.jobs.insert_one(job_dict)
        job_dict["_id"] = str(result.inserted_id)
        
        return jsonify({"status": "success", "data": job_dict}), 201
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        return jsonify({"error": str(e)}), 400

@job_bp.route("", methods=["GET"])
def get_jobs():
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    recruiter_id = get_current_recruiter_id()
    jobs = list(db.jobs.find({"recruiter_id": recruiter_id}).sort("created_at", -1))
    
    for j in jobs:
        j["_id"] = str(j["_id"])
        
    return jsonify({"status": "success", "data": jobs}), 200

@job_bp.route("/<job_id>", methods=["GET"])
def get_job(job_id):
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            return jsonify({"error": "Job not found"}), 404
        job["_id"] = str(job["_id"])
        return jsonify({"status": "success", "data": job}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@job_bp.route("/<job_id>", methods=["PUT"])
def update_job(job_id):
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    data = request.json or {}
    data["updated_at"] = datetime.utcnow().isoformat()
    
    try:
        # Prevent immutable field updates
        if "_id" in data: del data["_id"]
        if "recruiter_id" in data: del data["recruiter_id"]
        
        result = db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": data})
        if result.matched_count == 0:
            return jsonify({"error": "Job not found"}), 404
            
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@job_bp.route("/<job_id>", methods=["DELETE"])
def delete_job(job_id):
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    try:
        result = db.jobs.delete_one({"_id": ObjectId(job_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Job not found"}), 404
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@job_bp.route("/<job_id>/publish", methods=["POST"])
def publish_job(job_id):
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job: return jsonify({"error": "Job not found"}), 404
        
        # Run matching
        matches = run_candidate_matching(job)
        
        update_data = {
            "status": "Published",
            "updated_at": datetime.utcnow().isoformat(),
            "matched_candidates": matches
        }
        
        db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": update_data})
        
        # Fire socket event if sockets exist
        try:
            from api.sockets import socketio
            socketio.emit("job_published", {"job_id": job_id, "matches_count": len(matches)}, to=job.get("recruiter_id"))
        except Exception:
            pass
            
        return jsonify({"status": "success", "message": "Job published and matching started."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@job_bp.route("/<job_id>/candidates", methods=["GET"])
def get_job_candidates(job_id):
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job: return jsonify({"error": "Job not found"}), 404
        
        matches = job.get("matched_candidates", [])
        match_map = {m["candidate_id"]: m for m in matches}
        
        applications = list(db.applications.find({"job_id": job_id}))
        
        for app in applications:
            cid = app["candidate_id"]
            user = db.users.find_one({"_id": ObjectId(cid) if len(cid)==24 else cid})
            if not user or not user.get("resume_data"):
                continue
                
            # Use MatchScoreService to get the LIVE score
            match_data = _match_score_service.calculate_match(cid, job, user["resume_data"])
            live_score = match_data.get("score", 0)
            
            if cid in match_map:
                match_map[cid]["score"] = live_score
                match_map[cid]["application_status"] = app.get("status", "Applied")
                match_map[cid]["applied_at"] = app.get("applied_at")
                match_map[cid]["applied_score"] = app.get("match_score_snapshot")
            else:
                # Add new applicant to the matches list
                new_match = {
                    "candidate_id": cid,
                    "score": live_score,
                    "application_status": app.get("status", "Applied"),
                    "applied_at": app.get("applied_at"),
                    "applied_score": app.get("match_score_snapshot"),
                    "profile": {
                        "name": user.get("full_name", "Applicant"),
                        "headline": "Applicant",
                        "skills": user.get("resume_data", {}).get("skills", [])
                    }
                }
                matches.append(new_match)
                    
        # Sort matches: Applicants first (by score), then non-applicants (by score)
        matches.sort(key=lambda x: (x.get("application_status") is not None, x.get("score", 0)), reverse=True)
        
        return jsonify({
            "status": "success",
            "data": matches
        }), 200
    except Exception as e:
        logger.error(f"Error getting candidates: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 400

@job_bp.route("/<job_id>/regenerate", methods=["POST"])
def regenerate_matches(job_id):
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job: return jsonify({"error": "Job not found"}), 404
        
        matches = run_candidate_matching(job)
        db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"matched_candidates": matches, "updated_at": datetime.utcnow().isoformat()}}
        )
        return jsonify({"status": "success", "matches_count": len(matches)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@job_bp.route("/<job_id>/analytics", methods=["GET"])
def job_analytics(job_id):
    db = get_db()
    if db is None: return jsonify({"error": "Database not available"}), 500
    
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job: return jsonify({"error": "Job not found"}), 404
        
        matches = job.get("matched_candidates", [])
        strong_matches = sum(1 for m in matches if m.get("score", 0) > 80)
        avg_score = sum(m.get("score", 0) for m in matches) / len(matches) if matches else 0
        
        return jsonify({
            "status": "success",
            "data": {
                "total_candidates": len(matches),
                "matched_candidates": len(matches),
                "strong_matches": strong_matches,
                "average_match_score": round(avg_score, 2),
                "views": job.get("views", 0),
                "applications": job.get("applications", 0)
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Original recommendations endpoint
@job_bp.route("/recommendations", methods=["GET"])
def get_job_recommendations():
    try:
        skills_param = request.args.get("skills", "")
        candidate_id = request.args.get("candidate_id")
        
        skills = []
        if skills_param:
            skills = [s.strip() for s in skills_param.split(",") if s.strip()]
            
        if not skills and candidate_id:
            db = get_db()
            if db is not None:
                user = db.users.find_one({"_id": candidate_id})
                if user and "resume_data" in user:
                    skills = user["resume_data"].get("skills", [])
                    
        if not skills:
            return jsonify({"status": "error", "message": "No skills provided for job recommendations."}), 400
            
        filters = {}
        if request.args.get("location"):
            filters["location"] = request.args.get("location")
            
        jobs = recommendation_engine.get_recommendations(skills, filters=filters)
        return jsonify({"status": "success", "data": {"jobs": [j.model_dump() for j in jobs]}})
    except Exception as e:
        logger.error(f"Error fetching job recommendations: {e}", exc_info=True)
        return jsonify({"status": "error", "message": "An error occurred."}), 500
