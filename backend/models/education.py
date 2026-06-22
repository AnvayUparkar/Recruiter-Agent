"""Education model definition.

Enforces rules for candidate academic backgrounds and calculates study durations.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class EducationTier(str, Enum):
    """Enumeration of educational institution tiers."""

    TIER_1 = "tier_1"
    TIER_2 = "tier_2"
    TIER_3 = "tier_3"
    TIER_4 = "tier_4"
    UNKNOWN = "unknown"


class Education(BaseModel):
    """Pydantic model representing an academic credential."""

    institution: str
    degree: str
    field_of_study: str
    start_year: int = Field(..., ge=1970, le=2030)
    end_year: int = Field(..., ge=1970, le=2035)
    grade: Optional[str] = None
    tier: EducationTier = EducationTier.UNKNOWN

    @model_validator(mode="after")
    def validate_years(self) -> "Education":
        """Ensures the academic end year is logical relative to the start year."""
        if self.end_year < self.start_year:
            raise ValueError(
                f"end_year ({self.end_year}) cannot be earlier than start_year ({self.start_year})"
            )
        return self

    @property
    def education_duration(self) -> int:
        """Returns duration of study in years.

        Returns:
            int: Number of years.
        """
        return self.end_year - self.start_year

    model_config = {
        "use_enum_values": True,
    }
