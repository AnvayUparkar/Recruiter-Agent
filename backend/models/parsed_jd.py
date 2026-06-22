"""Parsed Job Description model definition.

Enforces structures for recruiter intentions, experience ranges, and
custom weight profiles for candidate score calculation.
"""

from typing import Dict, List, Set, Tuple
from pydantic import BaseModel, Field


class ParsedJD(BaseModel):
    """Pydantic model representing structured job description specifications."""

    job_title: str
    company_name: str
    experience_range: Tuple[float, float] = Field(
        default=(0.0, 50.0),
        description="Minimum and maximum years of experience required (min, max).",
    )
    must_have: List["Requirement"] = Field(default_factory=list)
    good_to_have: List["Requirement"] = Field(default_factory=list)
    negative_signals: List[str] = Field(default_factory=list)
    behavioral_preferences: List[str] = Field(default_factory=list)
    culture_fit: List[str] = Field(default_factory=list)
    industry_preferences: List[str] = Field(default_factory=list)
    location_preferences: List[str] = Field(default_factory=list)
    summary: str = ""
    scoring_profile: Dict[str, float] = Field(
        default_factory=lambda: {
            "technical_weight": 0.40,
            "career_weight": 0.20,
            "behavioral_weight": 0.20,
            "culture_weight": 0.10,
            "location_weight": 0.10,
        }
    )
    
    # Enriched fields for the recruiter dashboard
    domain: str = "Software Engineering"
    leadership: str = "Individual Contributor"
    work_mode: str = "Hybrid"
    salary_range: str = "$135,000 - $175,000 / yr"
    notice_period: str = "Immediate"
    degrees: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    preferred_qualifications: List[str] = Field(default_factory=list)
    responsibilities: List[Dict[str, str]] = Field(default_factory=list)
    confidence: float = 88.0
    raw_text: str = ""

    def get_critical_requirements(self) -> List[str]:
        """Collects the names of must-have requirements marked as 'critical'.

        Returns:
            List[str]: List of requirement names.
        """
        return [req.name for req in self.must_have if req.importance == "critical"]

    def get_required_skills(self) -> Set[str]:
        """Compiles a unique set of all required skill names.

        Returns:
            Set[str]: Unique skill names.
        """
        return {req.name for req in self.must_have}

    def is_location_compatible(self, candidate_location: str) -> bool:
        """Checks if a candidate's location aligns with preferred locations.

        Args:
            candidate_location: Location text from candidate profile.

        Returns:
            bool: True if compatible or if no location limits are set.
        """
        if not self.location_preferences:
            return True
        cand_lower = candidate_location.lower()
        return any(loc.lower() in cand_lower for loc in self.location_preferences)

    model_config = {
        "use_enum_values": True,
    }


# Resolve circular dependency import in Pydantic v2
from models.jd_requirements import Requirement

ParsedJD.model_rebuild()
