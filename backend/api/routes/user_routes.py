"""User/Candidate Routes Blueprint for Candidate Portal."""

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import io
import os
from bson.objectid import ObjectId

from services.resume_parser import ResumeParser
from api.db import get_db
from utils.logger import get_logger
from api.auth.auth_utils import require_auth
from flask import g

logger = get_logger(__name__)

user_bp = Blueprint("user_routes", __name__)
_resume_parser = ResumeParser()

# In-memory storage or local storage helper if you don't use MongoDB GridFS
# But for parsing we can just read from the stream

@user_bp.route("/upload-resume", methods=["POST"])
@require_auth()
def upload_resume():
    """POST /api/v1/user/upload-resume

    Accepts a candidate's resume (PDF/DOCX), parses it, extracts structured data,
    and updates the candidate's profile in the database.
    """
    logger.info("Received request to upload and parse candidate resume.")
    
    # 1. Validate file presence
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc']:
        return jsonify({"error": f"Unsupported file type: {ext}. Please upload a PDF or Word document."}), 400
        
    try:
        # Read file into memory stream
        file_stream = io.BytesIO(file.read())
        
        # 2. Parse the resume
        parsed_resume = _resume_parser.parse_file(file.filename, file_stream)
        parsed_data = parsed_resume.model_dump()
        
        # 3. Store in MongoDB using authenticated user
        candidate_id = g.user_id
        
        if candidate_id:
            db = get_db()
            if db is not None:
                try:
                    query_id = ObjectId(candidate_id)
                except Exception:
                    query_id = candidate_id
                
                db.users.update_one(
                    {"_id": query_id},
                    {"$set": {"resume_data": parsed_data}},
                    upsert=True
                )
                logger.info(f"Updated resume data for candidate {candidate_id}")
            else:
                logger.warning("Database connection not available to save resume data.")
        # Emit a WebSocket event to recruiters
        try:
            from api.sockets import socketio
            
            # Fetch user to get real full_name
            db = get_db()
            user_doc = None
            if db is not None:
                user_doc = db.users.find_one({"_id": query_id})
            
            full_name = user_doc.get("full_name") if user_doc else None

            socketio.emit("new_candidate", {
                "candidate_id": candidate_id,
                "full_name": full_name,
                "resume_data": parsed_data
            }, to="recruiters")
        except Exception as e:
            logger.error(f"Failed to emit new_candidate event: {e}")
            
        # 4. Return structured JSON
        return jsonify({
            "message": "Resume parsed successfully.",
            "data": parsed_data
        }), 200

    except ValueError as ve:
        logger.warning(f"Validation/Parsing error: {ve}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error during resume upload and parse: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

@user_bp.route("/candidates", methods=["GET"])
def get_recent_candidates():
    """GET /api/v1/user/candidates
    Returns candidates that have uploaded and parsed resumes, along with a computed match score.
    """
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not available"}), 500
        
    jd_skills = []
    
    # Optional auth for personalized score
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from api.auth.jwt_utils import decode_token
            payload = decode_token(token)
            recruiter_id = payload.get("sub")
            if recruiter_id:
                try:
                    query_id = ObjectId(recruiter_id)
                except Exception:
                    query_id = recruiter_id
                    
                recruiter = db.users.find_one({"_id": query_id})
                if recruiter and recruiter.get("parsed_jd") and isinstance(recruiter["parsed_jd"].get("skills"), list):
                    raw_jd_skills = recruiter["parsed_jd"]["skills"]
                    jd_skills = [
                        str(s.get("name") if isinstance(s, dict) else s).strip().lower()
                        for s in raw_jd_skills if s
                    ]
        except Exception as e:
            logger.warning(f"Optional auth token decoding failed: {e}")

    # Find users that have resume_data
    cursor = db.users.find({"resume_data": {"$exists": True}}).limit(50)
    candidates = []
    
    for user in cursor:
        cand_skills = []
        if user.get("resume_data") and isinstance(user["resume_data"].get("skills"), list):
            raw_cand_skills = user["resume_data"]["skills"]
            cand_skills = [
                str(s.get("name") if isinstance(s, dict) else s).strip().lower() 
                for s in raw_cand_skills if s
            ]
            
        score = 0
        if jd_skills:
            intersection = set(jd_skills).intersection(set(cand_skills))
            score = int((len(intersection) / len(jd_skills)) * 100)
            
        candidates.append({
            "candidate_id": str(user.get("_id")),
            "resume_data": user.get("resume_data"),
            "full_name": user.get("full_name"),
            "score": score
        })
        
    return jsonify({"candidates": candidates}), 200

@user_bp.route("/jd", methods=["POST"])
@require_auth()
def save_user_jd():
    """POST /api/v1/user/jd
    Saves parsed JD data for the authenticated recruiter.
    """
    logger.info("Received request to save parsed JD.")
    data = request.get_json()
    if not data or "parsed_jd" not in data:
        return jsonify({"error": "Missing parsed_jd in request body"}), 400
        
    user_id = g.user_id
    
    if user_id:
        db = get_db()
        if db is not None:
            try:
                query_id = ObjectId(user_id)
            except Exception:
                query_id = user_id
            
            db.users.update_one(
                {"_id": query_id},
                {"$set": {"parsed_jd": data["parsed_jd"]}},
                upsert=True
            )
            logger.info(f"Saved parsed JD for user {user_id}")
            return jsonify({"message": "Parsed JD saved successfully."}), 200
        else:
            logger.warning("Database connection not available to save JD data.")
            return jsonify({"error": "Database not available"}), 500
            
    return jsonify({"error": "Unauthorized"}), 401

@user_bp.route("/profile", methods=["GET"])
@require_auth()
def get_user_profile():
    """GET /api/v1/user/profile
    Returns the authenticated user's profile including resume_data.
    """
    db = get_db()
    user_id = g.user_id
    
    if db is None:
        return jsonify({"error": "Database not available"}), 500
        
    try:
        query_id = ObjectId(user_id)
    except Exception:
        query_id = user_id
        
    user = db.users.find_one({"_id": query_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "user_id": user_id,
        "resume_data": user.get("resume_data"),
        "parsed_jd": user.get("parsed_jd")
    }), 200
