"""Candidate Profile model definition.

Enforces constraints for primary profile characteristics such as experience and company size.
"""

from enum import Enum
from pydantic import BaseModel, Field


class CompanySize(str, Enum):
    """Enumeration of standard company sizes in the candidate schema."""

    TINY = "1-10"
    SMALL = "11-50"
    MEDIUM_SMALL = "51-200"
    MEDIUM = "201-500"
    MEDIUM_LARGE = "501-1000"
    LARGE = "1001-5000"
    VERY_LARGE = "5001-10000"
    ENTERPRISE = "10001+"


class Profile(BaseModel):
    """Pydantic model representing core metadata of a candidate profile."""

    anonymized_name: str
    headline: str
    summary: str
    location: str
    country: str
    years_of_experience: float = Field(
        ..., ge=0.0, le=50.0, description="Total years of work experience."
    )
    current_title: str
    current_company: str
    current_company_size: CompanySize
    current_industry: str

    model_config = {
        "use_enum_values": True,
        "populate_by_name": True,
    }
