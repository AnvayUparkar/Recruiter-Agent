import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from services.adzuna_service import AdzunaService
from services.job_matcher import JobRecommendationEngine

def test_adzuna():
    service = AdzunaService()
    print(f"App ID: {service.app_id}")
    print(f"App Key: {service.app_key}")
    
    # Test Raw Adzuna Search
    try:
        print("Testing Adzuna API directly...")
        jobs = service.search_jobs("Python React", limit=5)
        print(f"Raw jobs found: {len(jobs)}")
        for j in jobs:
            print(f"- {j.title} at {j.company}")
    except Exception as e:
        print(f"Error testing Adzuna API: {e}")
        
    print("\n------------------\n")
    
    # Test Engine
    engine = JobRecommendationEngine()
    print("Testing Recommendation Engine...")
    skills = ["Artificial Intelligence", "Python", "React", "Node.js", "Machine Learning"]
    recs = engine.get_recommendations(skills, limit=10)
    print(f"Recommendations found (score >= 10%): {len(recs)}")
    for r in recs:
        print(f"- [Score: {r.match_score}%] {r.title} at {r.company}")
        
    print("\nLet's test manual scoring...")
    for j in jobs:
        print(f"Title: {j.title}")
        job_text = f"{j.title} {j.description}".lower()
        matched = []
        for s in skills:
            if s.lower() in job_text:
                matched.append(s)
        max_s = min(len(skills), 5)
        print(f"  Matched: {matched}")
        print(f"  Score: {int((len(matched)/max_s)*100)}%")

if __name__ == "__main__":
    test_adzuna()
