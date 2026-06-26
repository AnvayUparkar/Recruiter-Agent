from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class NormalizedJob(BaseModel):
    title: str
    company: str
    location: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    employment_type: str = "Full-time"
    description: str
    required_skills: List[str] = Field(default_factory=list)
    redirect_url: str
    created_at: str
    source: str
    match_score: Optional[int] = None

class JobProvider(ABC):
    """
    Abstract base class for all external job providers.
    Follows the Interface Segregation Principle to allow multiple
    providers (Adzuna, LinkedIn, Indeed) to be plugged in seamlessly.
    """
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the name of the provider (e.g., 'Adzuna')."""
        pass

    @abstractmethod
    def search_jobs(self, query: str, limit: int = 20, filters: Dict = None) -> List[NormalizedJob]:
        """
        Searches for jobs based on a query string and optional filters.
        Must normalize the raw provider response into a list of NormalizedJob models.
        
        Args:
            query (str): The search string (e.g. "Python FastAPI")
            limit (int): Number of results to fetch
            filters (dict): Optional filters (location, remote, etc.)
            
        Returns:
            List[NormalizedJob]: Standardized list of jobs.
        """
        pass
