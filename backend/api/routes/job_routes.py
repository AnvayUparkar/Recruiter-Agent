from flask import Blueprint, request, jsonify
from utils.logger import get_logger
from services.job_matcher import JobRecommendationEngine
from api.db import get_db
import json

logger = get_logger(__name__)
job_bp = Blueprint("jobs", __name__)
recommendation_engine = JobRecommendationEngine()

@job_bp.route("/recommendations", methods=["GET"])
def get_job_recommendations():
    """
    Fetches job recommendations based on candidate skills.
    
    Query Params:
    - skills: Comma separated list of skills (e.g. "Python,FastAPI,AWS")
    - candidate_id: (Optional) If provided, fetches skills from DB
    - location: (Optional) Location filter
    """
    try:
        skills_param = request.args.get("skills", "")
        candidate_id = request.args.get("candidate_id")
        
        skills = []
        if skills_param:
            skills = [s.strip() for s in skills_param.split(",") if s.strip()]
            
        if not skills and candidate_id:
            # Fallback to fetching from DB
            db = get_db()
            if db is not None:
                user = db.users.find_one({"_id": candidate_id})
                if user and "resume_data" in user:
                    skills = user["resume_data"].get("skills", [])
                    
        if not skills:
            return jsonify({
                "status": "error",
                "message": "No skills provided for job recommendations."
            }), 400
            
        filters = {}
        if request.args.get("location"):
            filters["location"] = request.args.get("location")
            
        jobs = recommendation_engine.get_recommendations(skills, filters=filters)
        
        return jsonify({
            "status": "success",
            "data": {
                "jobs": [j.model_dump() for j in jobs]
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching job recommendations: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "An error occurred while fetching job recommendations."
        }), 500
