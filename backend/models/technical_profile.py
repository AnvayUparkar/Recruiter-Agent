"""Technical experience profile model.

Represents a candidate's technical skills and experience levels in core domains.
"""

from pydantic import BaseModel, Field


class TechnicalProfile(BaseModel):
    """Pydantic model representing a candidate's technical competencies."""

    retrieval_experience: float = Field(0.0, ge=0.0, le=1.0)
    ranking_experience: float = Field(0.0, ge=0.0, le=1.0)
    recommendation_experience: float = Field(0.0, ge=0.0, le=1.0)
    vector_database_experience: float = Field(0.0, ge=0.0, le=1.0)
    llm_experience: float = Field(0.0, ge=0.0, le=1.0)
    python_experience: float = Field(0.0, ge=0.0, le=1.0)
    evaluation_experience: float = Field(0.0, ge=0.0, le=1.0)
    fine_tuning_experience: float = Field(0.0, ge=0.0, le=1.0)
    distributed_systems_experience: float = Field(0.0, ge=0.0, le=1.0)
    production_ml_experience: float = Field(0.0, ge=0.0, le=1.0)
    open_source_signal: float = Field(0.0, ge=0.0, le=1.0)
    github_signal: float = Field(0.0, ge=0.0, le=1.0)

    def technical_strength_score(self) -> float:
        """Calculates a normalized overall technical strength rating.

        Returns:
            float: Strength rating from 0.0 to 1.0.
        """
        features = [
            self.retrieval_experience,
            self.ranking_experience,
            self.recommendation_experience,
            self.vector_database_experience,
            self.llm_experience,
            self.python_experience,
            self.evaluation_experience,
            self.fine_tuning_experience,
            self.distributed_systems_experience,
            self.production_ml_experience,
            self.open_source_signal,
            self.github_signal,
        ]
        return sum(features) / len(features)

    model_config = {
        "use_enum_values": True,
    }
