"""Certification model definition.

Represents credential systems achieved by candidates and offers utility functions for recency checks.
"""

from pydantic import BaseModel, Field


class Certification(BaseModel):
    """Pydantic model representing a professional credential or license."""

    name: str
    issuer: str
    year: int = Field(..., ge=1970, le=2035, description="Year the certification was awarded.")

    def is_recent(self, reference_year: int = 2026) -> bool:
        """Determines if the credential was earned in the last 5 years.

        Args:
            reference_year: System target year to evaluate against.

        Returns:
            bool: True if recent, False otherwise.
        """
        return self.year >= (reference_year - 5)
