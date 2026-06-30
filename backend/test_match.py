import sys
import os
from pprint import pprint

# Add backend to path
sys.path.append(os.path.abspath('d:\\Engineering\\Hackathon Projects\\Recruiter Agent\\backend'))

from api.routes.candidate_portal_routes import calculate_single_candidate_match
from datetime import datetime

# Dummy inputs
resume_data = {
    "name": "Test User",
    "raw_text": "Experienced software engineer",
    "skills": ["Python", "React"],
    "experience": [
        {"title": "Software Engineer at TechCorp", "description": "Built things"}
    ]
}

job = {
    "description": "Looking for a great software engineer with Python and React.",
    "skills": ["Python", "React"]
}

candidate_id = "6a3e1715c4e6a0f68d73ed21"

try:
    print("Running calculate_single_candidate_match...")
    match_data = calculate_single_candidate_match(candidate_id, resume_data, job)
    print("Success! Match Data:")
    pprint(match_data)
except Exception as e:
    print("FAILED with exception:")
    import traceback
    traceback.print_exc()
