"""User/Candidate Routes Blueprint for Candidate Portal."""

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import io
import os

from services.resume_parser import ResumeParser
from api.db import get_db
from utils.logger import get_logger

logger = get_logger(__name__)

user_bp = Blueprint("user_routes", __name__)
_resume_parser = ResumeParser()

# In-memory storage or local storage helper if you don't use MongoDB GridFS
# But for parsing we can just read from the stream

@user_bp.route("/upload-resume", methods=["POST"])
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
        
        # 3. Store in MongoDB
        # If user is authenticated, we would get user_id from token.
        # Since auth middleware isn't fully strictly applied here yet, we'll try to get 
        # a candidate_id from form data or headers, otherwise we just return the parsed data.
        candidate_id = request.form.get("candidate_id") or request.headers.get("X-Candidate-ID")
        
        if candidate_id:
            db = get_db()
            if db is not None:
                db.users.update_one(
                    {"_id": candidate_id},
                    {"$set": {"resume_data": parsed_data}},
                    upsert=True
                )
                logger.info(f"Updated resume data for candidate {candidate_id}")
            else:
                logger.warning("Database connection not available to save resume data.")
        
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
