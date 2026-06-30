import json
import hashlib
from datetime import datetime
from bson.objectid import ObjectId

from api.db import get_db
from utils.logger import get_logger

from models.candidate import Candidate
from models.profile import Profile, CompanySize
from models.career_history import CareerHistory
from models.education import Education, EducationTier
from models.skill import Skill, SkillProficiency
from models.language import Language, LanguageProficiency
from models.redrob_signals import RedrobSignals, ExpectedSalaryRange, PreferredWorkMode
from models.hybrid_retrieval_response import HybridRetrievalResponse
from models.hybrid_candidate import HybridCandidate
from models.lexical_match import LexicalMatch
from models.search_result import SearchResult
from models.retrieval_score import RetrievalScore

from services.jd_analyzer import JdAnalyzer
from services.candidate_intelligence_service import CandidateIntelligenceService
from services.recruiter_trust_service import RecruiterTrustService
from services.trustworthiness_service import TrustworthinessService
from services.feature_service import FeatureService
from services.final_ranking_service import FinalRankingService
from services.ranking_strategy import RankingStrategyType

logger = get_logger(__name__)

class MatchScoreService:
    def __init__(self):
        self._jd_analyzer = JdAnalyzer()
        self._candidate_intel_service = CandidateIntelligenceService()
        self._behavioral_service = RecruiterTrustService()
        self._reliability_service = TrustworthinessService()
        self._feature_service = FeatureService()
        self._ranking_service = FinalRankingService()

    def build_dummy_candidate_from_resume(self, candidate_id: str, resume_data: dict) -> Candidate:
        """Helper to build a robust Candidate object from basic parsed resume data."""
        try:
            years_exp = 0.0
            career_history = []
            if resume_data.get("experience"):
                years_exp = len(resume_data["experience"]) * 1.5
                for exp in resume_data["experience"]:
                    career_history.append(CareerHistory(
                        company=exp.get("title", "Unknown Company").split(" at ")[-1] if " at " in exp.get("title", "") else "Unknown Company",
                        title=exp.get("title", "Professional"),
                        start_date=datetime(2020, 1, 1).date(),
                        end_date=None,
                        duration_months=12,
                        is_current=True,
                        industry="Unknown",
                        company_size=CompanySize.SMALL,
                        description=exp.get("description", "")
                    ))
            if not career_history:
                 career_history.append(CareerHistory(
                        company="Unknown Company",
                        title="Professional",
                        start_date=datetime(2020, 1, 1).date(),
                        end_date=None,
                        duration_months=12,
                        is_current=True,
                        industry="Unknown",
                        company_size=CompanySize.SMALL,
                        description="Professional experience."
                    ))

            skills = []
            if resume_data.get("skills"):
                for s in resume_data["skills"]:
                    name = s.get("name", str(s)) if isinstance(s, dict) else str(s)
                    skills.append(Skill(name=name, proficiency=SkillProficiency.INTERMEDIATE, endorsements=1))

            return Candidate(
                candidate_id="CAND_0000000",
                profile=Profile(
                    anonymized_name=resume_data.get("name", "Candidate"),
                    headline=resume_data.get("name", "Candidate"),
                    summary=resume_data.get("raw_text", "")[:500],
                    location="Unknown",
                    country="Unknown",
                    years_of_experience=years_exp,
                    current_title="Professional",
                    current_company="Unknown",
                    current_company_size=CompanySize.SMALL,
                    current_industry="Unknown"
                ),
                career_history=career_history,
                education=[
                    Education(
                        institution="Unknown",
                        degree="Degree",
                        field_of_study="General",
                        start_year=2015,
                        end_year=2019,
                        tier=EducationTier.TIER_3
                    )
                ],
                skills=skills,
                certifications=[],
                languages=[Language(language="English", proficiency=LanguageProficiency.NATIVE)],
                redrob_signals=RedrobSignals(
                    profile_completeness_score=80.0,
                    signup_date=datetime(2026, 1, 1).date(),
                    last_active_date=datetime(2026, 6, 15).date(),
                    open_to_work_flag=True,
                    profile_views_received_30d=10,
                    applications_submitted_30d=5,
                    recruiter_response_rate=0.8,
                    avg_response_time_hours=24.0,
                    skill_assessment_scores={},
                    connection_count=100,
                    endorsements_received=10,
                    notice_period_days=30,
                    expected_salary_range_inr_lpa=ExpectedSalaryRange(min=10.0, max=20.0),
                    preferred_work_mode=PreferredWorkMode.HYBRID,
                    willing_to_relocate=True,
                    github_activity_score=50.0,
                    search_appearance_30d=10,
                    saved_by_recruiters_30d=2,
                    interview_completion_rate=1.0,
                    offer_acceptance_rate=1.0,
                    verified_email=True,
                    verified_phone=True,
                    linkedin_connected=True
                )
            )
        except Exception as e:
            logger.error(f"Error building candidate: {e}", exc_info=True)
            raise

    def get_latest_job_for_recruiter(self, recruiter_id: str):
        """Returns the most recent published job for the recruiter."""
        db = get_db()
        if db is None:
            return None
        
        try:
            query_id = ObjectId(recruiter_id)
        except Exception:
            query_id = recruiter_id
            
        job = db.jobs.find_one(
            {"recruiter_id": str(query_id), "status": "Published"},
            sort=[("created_at", -1)]
        )
        
        if not job:
            # Fallback to demo-recruiter
            job = db.jobs.find_one(
                {"recruiter_id": "demo-recruiter", "status": "Published"},
                sort=[("created_at", -1)]
            )
            
        return job

    def generate_resume_hash(self, resume_data: dict) -> str:
        """Generates a stable hash for resume data to use as resumeVersion."""
        if not resume_data:
            return "empty"
        # Serialize to string deterministically
        s = json.dumps(resume_data, sort_keys=True)
        return hashlib.md5(s.encode('utf-8')).hexdigest()

    def calculate_match(self, candidate_id: str, job: dict, resume_data: dict) -> dict:
        """
        Calculates the AI Match Score using the full Ranking Engine.
        Uses caching based on (job_id, candidate_id, resume_version).
        """
        if not job or not resume_data:
            return {"score": 0, "verdict": "Unknown", "summary": "Missing data."}
            
        job_id = str(job.get("_id", "unknown_job"))
        resume_version = resume_data.get("version") or self.generate_resume_hash(resume_data)
        
        db = get_db()
        if db is not None:
            # Check cache
            cache_entry = db.match_cache.find_one({
                "job_id": job_id,
                "candidate_id": str(candidate_id),
                "resume_version": resume_version
            })
            if cache_entry:
                logger.info(f"Cache hit for job {job_id} and candidate {candidate_id}")
                return cache_entry["match_data"]

        logger.info(f"Cache miss for job {job_id} and candidate {candidate_id}, calculating...")
        jd_text = job.get("description", "")
        if not jd_text:
            return {"score": 0, "verdict": "Unknown", "summary": "Missing JD data."}

        parsed_jd = self._jd_analyzer.analyze_jd(jd_text)
        parsed_jd.job_title = job.get("title", parsed_jd.job_title)
        
        cand = self.build_dummy_candidate_from_resume(candidate_id, resume_data)
        
        # Mock pool for feature service
        pool = HybridRetrievalResponse(
            query_id="mock",
            fused_candidates=[HybridCandidate(
                candidate_id=cand.candidate_id,
                lexical_result=LexicalMatch(
                    candidate_id=cand.candidate_id,
                    bm25_score=0.8,
                    rank=1,
                    retrieval_reason="Mock lexical match"
                ),
                semantic_result=SearchResult(
                    candidate_id=cand.candidate_id,
                    similarity_score=0.8,
                    rank=1,
                    distance=0.2,
                    search_time_ms=5.0
                ),
                retrieval_rank=1,
                retrieval_score=RetrievalScore(fusion_score=0.8, is_new_discovery=False)
            )],
            total_semantic=1,
            total_lexical=1,
            total_fused=1,
            retrieval_time_ms=10.0
        )

        profiles = self._candidate_intel_service.build_batch_profiles([cand])
        bi_list = self._behavioral_service.build_batch_profiles([cand])
        bi_map = {bi.candidate_id: bi for bi in bi_list}
        rp_list = self._reliability_service.build_batch_profiles([cand], behavioral_intels=bi_map)
        rp_map = {rp.candidate_id: rp for rp in rp_list}
        
        fvs_list = self._feature_service.build_feature_vectors(
            candidates=[cand], profiles=profiles, parsed_jd=parsed_jd, pool=pool
        )
        fv_map = {fv.candidate_id: fv for fv in fvs_list}
        
        result = self._ranking_service.rank_candidates(
            candidates=[cand], feature_vectors=fv_map,
            behavioral_intels=bi_map, reliability_profiles=rp_map,
            parsed_jd=parsed_jd, strategy=RankingStrategyType.BALANCED
        )

        if not result.ranked_candidates:
            match_data = {"score": 0, "verdict": "Unknown", "summary": "Failed to rank."}
        else:
            rc = result.ranked_candidates[0]
            match_data = {
                "score": rc.final_score,
                "confidence": rc.confidence,
                "verdict": rc.explanation.fit_verdict if rc.explanation else "Backup",
                "summary": rc.explanation.summary if rc.explanation else "",
                "strengths": rc.explanation.strengths if rc.explanation else [],
                "gaps": rc.explanation.gaps if rc.explanation else [],
                "details": rc.score_details.model_dump() if rc.score_details else {}
            }
            
        if db is not None:
            # Save to cache
            db.match_cache.update_one(
                {
                    "job_id": job_id,
                    "candidate_id": str(candidate_id),
                    "resume_version": resume_version
                },
                {"$set": {
                    "match_data": match_data,
                    "updated_at": datetime.utcnow().isoformat()
                }},
                upsert=True
            )
            
        return match_data
