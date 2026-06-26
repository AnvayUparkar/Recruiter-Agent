import os
import requests
import urllib.parse
from typing import List, Dict
from utils.logger import get_logger
from services.job_provider import JobProvider, NormalizedJob

logger = get_logger(__name__)

class AdzunaService(JobProvider):
    """
    Implementation of the JobProvider interface for Adzuna API.
    """
    
    def __init__(self):
        self.app_id = os.environ.get("ADZUNA_APP_ID")
        self.app_key = os.environ.get("ADZUNA_APP_KEY")
        self.country = os.environ.get("ADZUNA_COUNTRY", "in").lower()
        self.base_url = "https://api.adzuna.com/v1/api/jobs"
        
    def get_provider_name(self) -> str:
        return "Adzuna"
        
    def search_jobs(self, query: str, limit: int = 20, filters: Dict = None) -> List[NormalizedJob]:
        if not self.app_id or not self.app_key:
            logger.warning("Adzuna API credentials not configured. Returning empty job list.")
            return []
            
        filters = filters or {}
        
        # Build the Adzuna API URL
        # Docs: https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id={}&app_key={}&results_per_page=20&what=...
        url = f"{self.base_url}/{self.country}/search/1"
        
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "results_per_page": limit,
            "what": query,
            "sort_by": "relevance"
        }
        
        # Optional Adzuna parameters based on filters
        if filters.get("location"):
            params["where"] = filters.get("location")
            
        if filters.get("full_time"):
            params["full_time"] = 1
            
        if filters.get("contract"):
            params["contract"] = 1
            
        try:
            logger.info(f"Fetching jobs from Adzuna API for query: {query}")
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Adzuna API Error: {response.status_code} - {response.text}")
                return []
                
            data = response.json()
            return self._normalize_response(data.get("results", []))
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Adzuna API Request Failed: {e}")
            return []
            
    def _normalize_response(self, results: List[Dict]) -> List[NormalizedJob]:
        normalized_jobs = []
        
        for job in results:
            try:
                # Adzuna structures:
                # {
                #   "title": "...",
                #   "company": {"display_name": "..."},
                #   "location": {"display_name": "..."},
                #   "salary_min": ..., "salary_max": ...,
                #   "description": "...",
                #   "redirect_url": "...",
                #   "created": "..."
                # }
                company_name = job.get("company", {}).get("display_name", "Unknown Company")
                location_name = job.get("location", {}).get("display_name", "Unknown Location")
                
                normalized = NormalizedJob(
                    title=job.get("title", ""),
                    company=company_name,
                    location=location_name,
                    salary_min=job.get("salary_min"),
                    salary_max=job.get("salary_max"),
                    employment_type=job.get("contract_type", "Full-time").replace("_", "-").title(),
                    description=job.get("description", ""),
                    redirect_url=job.get("redirect_url", ""),
                    created_at=job.get("created", ""),
                    source=self.get_provider_name()
                )
                normalized_jobs.append(normalized)
            except Exception as e:
                logger.warning(f"Failed to normalize Adzuna job record: {e}")
                
        return normalized_jobs
