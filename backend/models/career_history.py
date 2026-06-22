"""Career History model definition.

Represents an individual work history item and exposes properties for ranking heuristics.
"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field
from models.profile import CompanySize


class CareerHistory(BaseModel):
    """Pydantic model representing a single position in the candidate's history."""

    company: str
    title: str
    start_date: date
    end_date: Optional[date] = None
    duration_months: int = Field(
        ..., ge=0, description="Duration in months for this role."
    )
    is_current: bool
    industry: str
    company_size: CompanySize
    description: str

    @property
    def is_product_company(self) -> bool:
        """Determines if the employer is likely a product company.

        Heuristic: Filters out common consulting, agency, and IT outsourcing words.

        Returns:
            bool: True if likely a product company, False otherwise.
        """
        consulting_and_agencies = {
            "services",
            "consulting",
            "outsourcing",
            "agency",
            "solutions",
            "technologies",
            "systems",
            "integrator",
            "tcs",
            "infosys",
            "wipro",
            "cognizant",
            "accenture",
            "capgemini",
            "hcl",
            "tech mahindra",
        }
        company_lower = self.company.lower()
        return not any(keyword in company_lower for keyword in consulting_and_agencies)

    @property
    def tenure_years(self) -> float:
        """Returns the tenure in years.

        Returns:
            float: Number of years.
        """
        return self.duration_months / 12.0

    @property
    def has_production_keywords(self) -> bool:
        """Scans the title and description for keywords signifying production environment experience.

        Returns:
            bool: True if matching keywords are found, False otherwise.
        """
        production_terms = {
            "production",
            "scale",
            "ci/cd",
            "kubernetes",
            "docker",
            "aws",
            "gcp",
            "azure",
            "deployment",
            "deploy",
            "pipeline",
            "infrastructure",
            "terraform",
            "microservices",
            "monitoring",
        }
        search_text = f"{self.title} {self.description}".lower()
        return any(term in search_text for term in production_terms)

    model_config = {
        "use_enum_values": True,
    }
