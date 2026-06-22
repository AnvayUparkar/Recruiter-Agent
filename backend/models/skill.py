"""Skill model definition.

Represents a competency declared by a candidate, including endorsements and proficiency scales.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class SkillProficiency(str, Enum):
    """Enumeration of competency levels."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class Skill(BaseModel):
    """Pydantic model representing a technical or soft skill."""

    name: str
    proficiency: SkillProficiency
    endorsements: int = Field(0, ge=0)
    duration_months: Optional[int] = Field(None, ge=0)

    def skill_strength_score(self) -> float:
        """Calculates a normalized strength score based on proficiency.

        Returns:
            float: Weight ranging from 0.25 (beginner) to 1.00 (expert).
        """
        weights = {
            SkillProficiency.BEGINNER: 0.25,
            SkillProficiency.INTERMEDIATE: 0.50,
            SkillProficiency.ADVANCED: 0.75,
            SkillProficiency.EXPERT: 1.00,
        }
        return weights.get(self.proficiency, 0.0)

    model_config = {
        "use_enum_values": True,
    }
