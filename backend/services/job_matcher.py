import functools
from typing import List, Dict
from services.job_provider import JobProvider, NormalizedJob
from services.adzuna_service import AdzunaService
from utils.logger import get_logger

logger = get_logger(__name__)

class JobRecommendationEngine:
    def __init__(self):
        # We can add more providers here in the future
        self.providers: List[JobProvider] = [
            AdzunaService()
        ]

    def _build_search_query(self, skills: List[str]) -> str:
        """
        Intelligently builds a search query from skills.
        Takes up to the top 7 skills to avoid overly constrained queries.
        """
        if not skills:
            return ""
        
        # Taking top 2 skills for the search query to ensure a broad result pool.
        # We will score the results against ALL skills locally.
        top_skills = skills[:2]
        return " ".join(top_skills)

    def _calculate_match_score(self, job: NormalizedJob, candidate_skills: List[str]) -> int:
        """
        Calculates a percentage match score based on how many of the candidate's skills
        appear in the job title or description.
        """
        if not candidate_skills:
            return 0
            
        job_text = (f"{job.title} {job.description}").lower()
        
        matched_count = 0
        matched_skills = []
        for skill in candidate_skills:
            if skill.lower() in job_text:
                matched_count += 1
                matched_skills.append(skill)
                
        # Set matched skills on the job model for frontend display
        job.required_skills = matched_skills
                
        # Calculate score based on a realistic maximum number of required skills (e.g. 5)
        # instead of penalizing candidates who have many skills.
        max_expected_skills = min(len(candidate_skills), 5)
        if max_expected_skills == 0:
            return 0
            
        score = int((matched_count / max_expected_skills) * 100)
        return min(score, 100)

    @functools.lru_cache(maxsize=128)
    def _fetch_from_providers_cached(self, query: str, limit: int) -> List[NormalizedJob]:
        """
        Caches API responses to avoid hitting rate limits for the same query.
        """
        all_jobs = []
        for provider in self.providers:
            try:
                jobs = provider.search_jobs(query, limit=limit)
                all_jobs.extend(jobs)
            except Exception as e:
                logger.error(f"Provider {provider.get_provider_name()} failed: {e}")
                
        return all_jobs

    def get_recommendations(self, skills: List[str], filters: Dict = None, limit: int = 30) -> List[NormalizedJob]:
        query = self._build_search_query(skills)
        if not query:
            return []
            
        logger.info(f"Fetching job recommendations for skills query: {query}")
        
        # Use cache for fetching. Filters are currently ignored in cache key for simplicity,
        # but could be added to cache key via frozen dicts if needed.
        raw_jobs = self._fetch_from_providers_cached(query, limit=limit)
        
        # Score and deduplicate
        unique_urls = set()
        scored_jobs = []
        
        for job in raw_jobs:
            if job.redirect_url in unique_urls:
                continue
            unique_urls.add(job.redirect_url)
            
            job.match_score = self._calculate_match_score(job, skills)
            
            # Filter out jobs with very low relevance (e.g. less than 10%)
            if job.match_score >= 10:
                scored_jobs.append(job)
                
        # Sort by match score descending
        scored_jobs.sort(key=lambda j: j.match_score, reverse=True)
        
        return scored_jobs
