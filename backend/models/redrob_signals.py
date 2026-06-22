"""Redrob signals model definition.

Captures behavioral characteristics, platform interaction data, and candidate preferences.
"""

from datetime import date
from enum import Enum
from typing import Dict
from pydantic import BaseModel, Field, model_validator


class PreferredWorkMode(str, Enum):
    """Enumeration of preferred employment workspace modalities."""

    REMOTE = "remote"
    HYBRID = "hybrid"
    ONSITE = "onsite"
    FLEXIBLE = "flexible"


class ExpectedSalaryRange(BaseModel):
    """Represents expected compensation range in Lakhs Per Annum (INR LPA)."""

    min: float = Field(..., ge=0.0)
    max: float = Field(..., ge=0.0)

    @model_validator(mode="after")
    def validate_salary_range(self) -> "ExpectedSalaryRange":
        """Ensures that max salary expectation is equal or greater than min expectation."""
        if self.max < self.min:
            raise ValueError(
                f"max expected salary ({self.max}) cannot be less than min expected salary ({self.min})"
            )
        return self


class RedrobSignals(BaseModel):
    """Pydantic model encapsulating Redrob ecosystem activity signals."""

    profile_completeness_score: float = Field(..., ge=0.0, le=100.0)
    signup_date: date
    last_active_date: date
    open_to_work_flag: bool
    profile_views_received_30d: int = Field(..., ge=0)
    applications_submitted_30d: int = Field(..., ge=0)
    recruiter_response_rate: float = Field(..., ge=0.0, le=1.0)
    avg_response_time_hours: float = Field(..., ge=0.0)
    skill_assessment_scores: Dict[str, float] = Field(
        ...,
        description="Assessment scores per skill name (0-100).",
    )
    connection_count: int = Field(..., ge=0)
    endorsements_received: int = Field(..., ge=0)
    notice_period_days: int = Field(..., ge=0, le=180)
    expected_salary_range_inr_lpa: ExpectedSalaryRange
    preferred_work_mode: PreferredWorkMode
    willing_to_relocate: bool
    github_activity_score: float = Field(..., ge=-1.0, le=100.0)
    search_appearance_30d: int = Field(..., ge=0)
    saved_by_recruiters_30d: int = Field(..., ge=0)
    interview_completion_rate: float = Field(..., ge=0.0, le=1.0)
    offer_acceptance_rate: float = Field(..., ge=-1.0, le=1.0)
    verified_email: bool
    verified_phone: bool
    linkedin_connected: bool

    @model_validator(mode="after")
    def validate_dates(self) -> "RedrobSignals":
        """Ensures that last active date is not before the signup date."""
        if self.last_active_date < self.signup_date:
            raise ValueError(
                f"last_active_date ({self.last_active_date}) cannot be earlier than signup_date ({self.signup_date})"
            )
        return self

    def days_since_last_active(self, reference_date: date = date(2026, 6, 15)) -> int:
        """Calculates days elapsed since the candidate's last system activity.

        Args:
            reference_date: Anchor date for timeline calculation.

        Returns:
            int: Number of days.
        """
        delta = reference_date - self.last_active_date
        return max(0, delta.days)

    def is_recently_active(
        self, reference_date: date = date(2026, 6, 15), days: int = 30
    ) -> bool:
        """Determines if candidate was active within the specified time window.

        Args:
            reference_date: Anchor date for timeline calculation.
            days: Day threshold count to qualify as active.

        Returns:
            bool: True if recent activity falls under threshold.
        """
        return self.days_since_last_active(reference_date) <= days

    def availability_score_components(self) -> dict:
        """Assembles key availability parameters for behavioral scoring.

        Returns:
            dict: Structured availability signals.
        """
        return {
            "open_to_work": self.open_to_work_flag,
            "notice_period_days": self.notice_period_days,
            "willing_to_relocate": self.willing_to_relocate,
        }

    def has_verified_profile(self) -> bool:
        """Indicates if basic email and phone details are verified.

        Returns:
            bool: True if both contact fields are verified.
        """
        return self.verified_email and self.verified_phone

    model_config = {
        "use_enum_values": True,
    }
