"""Candidate aggregate model definition.

Acts as the main root model combining profile, employment, education, skills, and activity signals.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

from models.profile import Profile
from models.career_history import CareerHistory
from models.education import Education
from models.skill import Skill
from models.certification import Certification
from models.language import Language
from models.redrob_signals import RedrobSignals


class Candidate(BaseModel):
    """Aggregate model representing a complete candidate record."""

    candidate_id: str = Field(
        ...,
        pattern=r"^CAND_[0-9]{7}$",
        description="Unique identifier formatted as CAND_XXXXXXX (7 digits).",
    )
    profile: Profile
    career_history: List[CareerHistory] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="List of employment history items.",
    )
    education: List[Education] = Field(
        default_factory=list,
        max_length=5,
        description="List of educational background items.",
    )
    skills: List[Skill] = Field(
        default_factory=list,
        description="Competencies declared by the candidate.",
    )
    certifications: List[Certification] = Field(
        default_factory=list,
        description="Professional certifications earned.",
    )
    languages: List[Language] = Field(
        default_factory=list,
        description="Linguistic capabilities.",
    )
    redrob_signals: RedrobSignals

    @property
    def total_years_experience(self) -> float:
        """Returns total years of experience recorded in candidate profile.

        Returns:
            float: Years of experience.
        """
        return self.profile.years_of_experience

    @property
    def current_role(self) -> Optional[str]:
        """Identifies the active job title from career history.

        Falls back to profile.current_title if no current role is marked.

        Returns:
            Optional[str]: Active job title.
        """
        for job in self.career_history:
            if job.is_current:
                return job.title
        return self.profile.current_title

    @property
    def current_company(self) -> Optional[str]:
        """Identifies the active employer from career history.

        Falls back to profile.current_company if no current role is marked.

        Returns:
            Optional[str]: Active employer company name.
        """
        for job in self.career_history:
            if job.is_current:
                return job.company
        return self.profile.current_company

    @property
    def top_skills(self) -> List[Skill]:
        """Sorts and returns candidate competencies.

        Ordered by skill strength score (proficiency) and endorsements.

        Returns:
            List[Skill]: Sorted list of skills.
        """
        return sorted(
            self.skills,
            key=lambda s: (s.skill_strength_score(), s.endorsements),
            reverse=True,
        )

    @property
    def has_github_activity(self) -> bool:
        """Indicates if candidate has github activity recorded on platform.

        Returns:
            bool: True if github score is positive.
        """
        return self.redrob_signals.github_activity_score > 0.0

    @property
    def is_open_to_work(self) -> bool:
        """Indicates if candidate is open to work opportunities.

        Returns:
            bool: True if open_to_work_flag is active.
        """
        return self.redrob_signals.open_to_work_flag

    @property
    def average_tenure(self) -> float:
        """Calculates the average tenure per employment role in years.

        Returns:
            float: Average tenure in years.
        """
        if not self.career_history:
            return 0.0
        total_tenure = sum(job.tenure_years for job in self.career_history)
        return total_tenure / len(self.career_history)

    @property
    def candidate_summary(self) -> str:
        """Synthesizes a text summary of the candidate for semantic search.

        Combines title, experience, top skills, and profile summary.

        Returns:
            str: Normalized semantic search summary text.
        """
        role = self.current_role or "Professional"
        years = self.total_years_experience
        skills_list = [s.name for s in self.top_skills[:5]]
        skills_str = ", ".join(skills_list) if skills_list else "various tools"
        summary_intro = (
            f"{role} with {years:.1f} years of experience. Top skills: {skills_str}."
        )
        return f"{summary_intro} {self.profile.summary}".strip()

    model_config = {
        "use_enum_values": True,
        "populate_by_name": True,
    }
