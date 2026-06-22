"""Language model definition.

Represents candidates' linguistic skills and provides strength conversion helpers.
"""

from enum import Enum
from pydantic import BaseModel


class LanguageProficiency(str, Enum):
    """Enumeration of language capability levels."""

    BASIC = "basic"
    CONVERSATIONAL = "conversational"
    PROFESSIONAL = "professional"
    NATIVE = "native"


class Language(BaseModel):
    """Pydantic model representing a language fluency declaration."""

    language: str
    proficiency: LanguageProficiency

    def language_score(self) -> float:
        """Calculates a normalized language strength score based on proficiency.

        Returns:
            float: Weight ranging from 0.25 (basic) to 1.00 (native).
        """
        weights = {
            LanguageProficiency.BASIC: 0.25,
            LanguageProficiency.CONVERSATIONAL: 0.50,
            LanguageProficiency.PROFESSIONAL: 0.75,
            LanguageProficiency.NATIVE: 1.00,
        }
        return weights.get(self.proficiency, 0.0)

    model_config = {
        "use_enum_values": True,
    }
