"""Job Description Requirement structures.

Enforces strongly typed requirement entries indicating the significance of capabilities.
"""

from enum import Enum
from pydantic import BaseModel, Field


class RequirementImportance(str, Enum):
    """Significance levels of a parsed requirement."""

    CRITICAL = "critical"
    IMPORTANT = "important"
    OPTIONAL = "optional"
    BONUS = "bonus"


class Requirement(BaseModel):
    """Strongly typed requirement object representing a candidate criteria constraint."""

    name: str
    importance: RequirementImportance
    confidence: float = Field(
        1.0, ge=0.0, le=1.0, description="Inference confidence score (0.0 to 1.0)."
    )
    category: str | None = Field(
        None, description="Category of the requirement (e.g., Vector Database, NLP)."
    )

    model_config = {
        "use_enum_values": True,
    }
