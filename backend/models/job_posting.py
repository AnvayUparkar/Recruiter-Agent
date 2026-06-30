from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

class JobPosting(BaseModel):
    """
    Schema for a Job Posting created by a recruiter.
    """
    id: Optional[str] = Field(None, alias="_id")
    recruiter_id: str
    company: str
    title: str
    description: str
    
    # Skills
    parsed_skills: List[str] = Field(default_factory=list)
    selected_skills: List[str] = Field(default_factory=list)
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    nice_to_have_skills: List[str] = Field(default_factory=list)
    
    # Requirements
    experience: Dict[str, Any] = Field(
        default_factory=lambda: {
            "min": 0.0,
            "max": 5.0,
            "required_industry": "",
            "preferred_industry": "",
            "previous_product_company": False,
            "startup_experience": False,
            "leadership_experience": False
        }
    )
    education: Dict[str, Any] = Field(
        default_factory=lambda: {
            "degree": "",
            "branch": "",
            "min_cgpa": 0.0,
            "preferred_colleges": []
        }
    )
    responsibilities: List[str] = Field(default_factory=list)
    benefits: List[str] = Field(default_factory=list)
    interview_process: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Additional Metadata
    employment_type: str = "Full-Time"
    location: str = "Remote"
    work_mode: str = "Remote"
    salary_range: str = ""
    openings: int = 1
    application_deadline: Optional[str] = None
    priority: str = "Medium"
    
    # Status
    status: str = "Draft" # Draft, Published, Closed
    
    # Analytics
    views: int = 0
    applications: int = 0
    matched_candidates: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    model_config = {
        "populate_by_name": True,
    }
