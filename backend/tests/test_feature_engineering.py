"""Unit tests for Phase 10: Recruiter Feature Engineering Engine.

Covers:
  - All 6 feature models (construction, defaults, overall scores)
  - FeatureVector (flat dict, group scores, auto-computed fields)
  - FeatureRegistry (registration, queries, group weights)
  - TechnicalFeatureExtractor
  - CareerFeatureExtractor
  - LeadershipFeatureExtractor
  - ExecutionFeatureExtractor
  - MarketFeatureExtractor
  - MatchingFeatureExtractor
  - FeatureNormalizer (all 3 strategies)
  - FeatureEngineering (single + batch)
"""

import pytest
from datetime import date
from typing import List

from models.candidate import Candidate
from models.candidate_profile import CandidateProfile
from models.technical_profile import TechnicalProfile
from models.career_profile import CareerProfile
from models.behavioral_profile import BehavioralProfile
from models.market_profile import MarketProfile
from models.career_history import CareerHistory
from models.profile import Profile, CompanySize
from models.skill import Skill, SkillProficiency
from models.redrob_signals import RedrobSignals, ExpectedSalaryRange, PreferredWorkMode
from models.jd_requirements import Requirement, RequirementImportance
from models.parsed_jd import ParsedJD
from models.hybrid_candidate import HybridCandidate
from models.search_result import SearchResult
from models.retrieval_score import RetrievalScore

from models.technical_features import TechnicalFeatures, FeatureScore
from models.career_features import CareerFeatures
from models.leadership_features import LeadershipFeatures
from models.execution_features import ExecutionFeatures
from models.market_features import MarketFeatures
from models.matching_features import MatchingFeatures
from models.feature_vector import FeatureVector

from services.feature_registry import FeatureRegistry, get_feature_registry
from services.technical_feature_extractor import TechnicalFeatureExtractor
from services.career_feature_extractor import CareerFeatureExtractor
from services.leadership_feature_extractor import LeadershipFeatureExtractor
from services.execution_feature_extractor import ExecutionFeatureExtractor
from services.market_feature_extractor import MarketFeatureExtractor
from services.matching_feature_extractor import MatchingFeatureExtractor
from services.feature_normalizer import FeatureNormalizer
from services.feature_engineering import FeatureEngineering


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

def _make_profile(
    title: str = "Senior ML Engineer",
    years: float = 8.0,
    summary: str = "Built FAISS retrieval system serving 10M users. Python, LLM, NDCG.",
) -> Profile:
    return Profile(
        anonymized_name="Candidate A",
        headline=f"{title} | ML | Search",
        summary=summary,
        location="Bangalore, India",
        country="India",
        years_of_experience=years,
        current_title=title,
        current_company="SearchCorp",
        current_company_size=CompanySize.LARGE,
        current_industry="Technology",
    )


def _make_redrob_signals(
    open_to_work: bool = True,
    notice_days: int = 30,
    relocate: bool = True,
    salary_min: float = 30.0,
    salary_max: float = 60.0,
) -> RedrobSignals:
    return RedrobSignals(
        profile_completeness_score=88.0,
        signup_date=date(2022, 1, 1),
        last_active_date=date(2026, 6, 10),
        open_to_work_flag=open_to_work,
        profile_views_received_30d=30,
        applications_submitted_30d=5,
        recruiter_response_rate=0.8,
        avg_response_time_hours=4.0,
        skill_assessment_scores={"python": 90.0, "ml": 85.0},
        connection_count=300,
        endorsements_received=25,
        notice_period_days=notice_days,
        expected_salary_range_inr_lpa=ExpectedSalaryRange(min=salary_min, max=salary_max),
        preferred_work_mode=PreferredWorkMode.HYBRID,
        willing_to_relocate=relocate,
        github_activity_score=75.0,
        search_appearance_30d=50,
        saved_by_recruiters_30d=8,
        interview_completion_rate=0.9,
        offer_acceptance_rate=0.8,
        verified_email=True,
        verified_phone=True,
        linkedin_connected=True,
    )


def _make_career_history(
    company: str = "SearchCorp",
    title: str = "Senior ML Engineer",
    months: int = 36,
    description: str = "Built and deployed FAISS retrieval serving 10M users. Reduced latency by 40%.",
    is_product: bool = True,
) -> CareerHistory:
    return CareerHistory(
        company=company,
        title=title,
        start_date=date(2021, 1, 1),
        end_date=None if True else date(2024, 1, 1),
        duration_months=months,
        is_current=True,
        industry="Technology",
        company_size=CompanySize.LARGE,
        description=description,
    )


def _make_candidate(
    cand_id: str = "CAND_0000001",
    title: str = "Senior ML Engineer",
    years: float = 8.0,
) -> Candidate:
    return Candidate(
        candidate_id=cand_id,
        profile=_make_profile(title=title, years=years),
        career_history=[
            _make_career_history(title=title),
            _make_career_history(
                company="StartupAI",
                title="ML Engineer",
                months=24,
                description="Implemented recommendation system using two-tower model. Python, PyTorch.",
                is_product=True,
            ),
        ],
        education=[],
        skills=[
            Skill(name="python", proficiency=SkillProficiency.EXPERT, endorsements=10),
            Skill(name="faiss", proficiency=SkillProficiency.ADVANCED, endorsements=5),
            Skill(name="retrieval", proficiency=SkillProficiency.ADVANCED),
            Skill(name="ranking", proficiency=SkillProficiency.INTERMEDIATE),
        ],
        certifications=[],
        languages=[],
        redrob_signals=_make_redrob_signals(),
    )


def _make_candidate_profile(cand_id: str = "CAND_0000001") -> CandidateProfile:
    return CandidateProfile(
        candidate_id=cand_id,
        technical_profile=TechnicalProfile(
            retrieval_experience=0.85,
            ranking_experience=0.70,
            recommendation_experience=0.60,
            vector_database_experience=0.80,
            llm_experience=0.65,
            python_experience=0.90,
            evaluation_experience=0.55,
            fine_tuning_experience=0.40,
            distributed_systems_experience=0.60,
            production_ml_experience=0.75,
            open_source_signal=0.50,
            github_signal=0.60,
        ),
        career_profile=CareerProfile(
            years_experience=8.0,
            product_company_ratio=0.80,
            startup_ratio=0.30,
            average_tenure=2.5,
            leadership_signal=0.55,
            individual_contributor_signal=0.70,
            career_stability=0.75,
            career_growth_rate=0.65,
        ),
        behavioral_profile=BehavioralProfile(
            availability_score=0.85,
            responsiveness_score=0.80,
            engagement_score=0.70,
            interview_reliability=0.90,
            market_activity_score=0.75,
            verification_score=0.95,
        ),
        market_profile=MarketProfile(
            recruiter_interest=0.80,
            search_visibility=0.75,
            profile_quality=0.85,
            salary_expectation_score=0.70,
            relocation_score=0.90,
            market_competitiveness=0.80,
        ),
        candidate_summary=(
            "Senior ML Engineer with 8 years of experience. Built FAISS retrieval "
            "system serving 10M users. Expert in Python, LLM, NDCG evaluation, "
            "production ML, Kubernetes, Qdrant, ranking, recommendation systems. "
            "Open source contributor. GitHub: 150 stars."
        ),
        overall_strength=0.82,
    )


def _make_parsed_jd(skills: List[str] = None) -> ParsedJD:
    skills = skills or ["python", "faiss", "retrieval", "ranking"]
    return ParsedJD(
        job_title="Senior ML Engineer",
        company_name="TechCorp",
        must_have=[
            Requirement(name=s, importance=RequirementImportance.CRITICAL)
            for s in skills
        ],
        good_to_have=[
            Requirement(name="qdrant", importance=RequirementImportance.IMPORTANT),
        ],
        negative_signals=[],
        behavioral_preferences=[],
        culture_fit=[],
        industry_preferences=["Technology", "SaaS"],
        location_preferences=["Bangalore"],
        scoring_profile={},
        summary="Looking for Senior ML Engineer with Python, FAISS, retrieval, and ranking experience.",
    )


def _make_hybrid_candidate(cand_id: str = "CAND_0000001") -> HybridCandidate:
    return HybridCandidate(
        candidate_id=cand_id,
        semantic_result=SearchResult(
            candidate_id=cand_id,
            similarity_score=0.88,
            rank=1,
            distance=0.12,
            search_time_ms=1.0,
        ),
        retrieval_score=RetrievalScore(
            semantic_score=0.88,
            bm25_score=6.5,
            final_retrieval_score=0.92,
            fusion_strategy="rrf",
            in_semantic_results=True,
            in_lexical_results=True,
        ),
        retrieval_rank=1,
        matched_skills=["python", "faiss", "retrieval"],
        coverage_score=0.75,
        retrieval_source="hybrid",
    )


@pytest.fixture
def candidate():
    return _make_candidate()


@pytest.fixture
def profile():
    return _make_candidate_profile()


@pytest.fixture
def parsed_jd():
    return _make_parsed_jd()


@pytest.fixture
def hybrid_candidate():
    return _make_hybrid_candidate()


# ─────────────────────────────────────────────────────────────────────────────
# 1. Feature Model Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestTechnicalFeatures:
    def test_defaults_are_zero(self):
        tf = TechnicalFeatures()
        assert tf.retrieval_experience_score == 0.0
        assert tf.overall_technical_score() == 0.0

    def test_overall_score_bounded(self):
        tf = TechnicalFeatures(
            retrieval_experience_score=1.0,
            ranking_experience_score=1.0,
            python_score=1.0,
            production_ml_score=1.0,
        )
        assert 0.0 <= tf.overall_technical_score() <= 1.0

    def test_feature_score_construction(self):
        fs = FeatureScore(score=0.85, confidence=0.90, evidence=["Built FAISS"])
        assert fs.score == 0.85
        assert len(fs.evidence) == 1


class TestCareerFeatures:
    def test_penalty_reduces_overall(self):
        high_penalty = CareerFeatures(
            years_experience_score=0.8,
            career_growth_score=0.7,
            job_hopping_penalty=1.0,
            consulting_penalty=1.0,
        )
        no_penalty = CareerFeatures(
            years_experience_score=0.8,
            career_growth_score=0.7,
        )
        assert high_penalty.overall_career_score() < no_penalty.overall_career_score()

    def test_overall_score_bounded(self):
        cf = CareerFeatures(years_experience_score=1.0, career_stability_score=1.0)
        assert 0.0 <= cf.overall_career_score() <= 1.0


class TestLeadershipFeatures:
    def test_defaults_are_zero(self):
        lf = LeadershipFeatures()
        assert lf.overall_leadership_score() == 0.0

    def test_overall_score_bounded(self):
        lf = LeadershipFeatures(
            technical_leadership_score=1.0,
            ownership_score=1.0,
            decision_making_score=0.9,
        )
        assert 0.0 <= lf.overall_leadership_score() <= 1.0


class TestExecutionFeatures:
    def test_overall_score_bounded(self):
        ef = ExecutionFeatures(
            shipping_score=1.0, impact_score=1.0, system_scale_score=1.0
        )
        assert 0.0 <= ef.overall_execution_score() <= 1.0

    def test_defaults_zero(self):
        ef = ExecutionFeatures()
        assert ef.overall_execution_score() == 0.0


class TestMarketFeatures:
    def test_availability_dominates(self):
        high = MarketFeatures(availability_score=1.0, profile_strength_score=1.0)
        low  = MarketFeatures(availability_score=0.0)
        assert high.overall_market_score() > low.overall_market_score()

    def test_bounded(self):
        mf = MarketFeatures(
            availability_score=1.0, recruiter_engagement_score=1.0,
            profile_strength_score=1.0, salary_alignment_score=1.0,
        )
        assert 0.0 <= mf.overall_market_score() <= 1.0


class TestMatchingFeatures:
    def test_skill_coverage_dominates(self):
        high_match = MatchingFeatures(skill_coverage_score=1.0, semantic_alignment_score=1.0)
        no_match   = MatchingFeatures()
        assert high_match.overall_matching_score() > no_match.overall_matching_score()

    def test_bounded(self):
        mf = MatchingFeatures(
            skill_coverage_score=1.0, keyword_coverage_score=1.0,
            semantic_alignment_score=1.0, experience_alignment_score=1.0,
        )
        assert 0.0 <= mf.overall_matching_score() <= 1.0


# ─────────────────────────────────────────────────────────────────────────────
# 2. Feature Vector Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestFeatureVector:
    def test_to_flat_dict_keys(self):
        fv = FeatureVector(candidate_id="CAND_0000001")
        flat = fv.to_flat_dict()
        assert "tech_retrieval" in flat
        assert "career_experience" in flat
        assert "match_skill_coverage" in flat
        assert "overall_strength" in flat

    def test_feature_count_positive(self):
        fv = FeatureVector(candidate_id="CAND_0000001")
        assert fv.feature_count > 0

    def test_overall_strength_bounded(self):
        fv = FeatureVector(
            candidate_id="CAND_0000001",
            technical_features=TechnicalFeatures(python_score=1.0, retrieval_experience_score=1.0),
            matching_features=MatchingFeatures(skill_coverage_score=1.0),
        )
        assert 0.0 <= fv.overall_feature_strength <= 1.0

    def test_group_scores_keys(self):
        fv = FeatureVector(candidate_id="CAND_0000001")
        scores = fv.group_scores()
        assert set(scores.keys()) == {
            "technical", "career", "leadership", "execution", "market", "matching", "overall"
        }

    def test_all_flat_dict_values_bounded(self):
        fv = FeatureVector(
            candidate_id="CAND_0000001",
            technical_features=TechnicalFeatures(
                retrieval_experience_score=0.9, python_score=0.8
            ),
        )
        flat = fv.to_flat_dict()
        for name, val in flat.items():
            assert 0.0 <= val <= 1.0, f"Feature '{name}' = {val} out of [0,1]"


# ─────────────────────────────────────────────────────────────────────────────
# 3. Feature Registry Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestFeatureRegistry:
    def test_default_initialization(self):
        registry = FeatureRegistry()
        assert registry.feature_count() > 30
        assert len(registry.feature_groups()) == 6

    def test_register_new_feature(self):
        registry = FeatureRegistry()
        initial_count = registry.feature_count()
        registry.register_feature("test_custom_feature", "technical", "A test feature")
        assert registry.feature_count() == initial_count + 1

    def test_feature_names_by_group(self):
        registry = FeatureRegistry()
        tech_names = registry.feature_names("technical")
        assert len(tech_names) > 5
        assert all(name.startswith("tech_") for name in tech_names)

    def test_penalty_features(self):
        registry = FeatureRegistry()
        penalties = registry.penalty_features()
        assert "career_consulting_pen" in penalties
        assert "career_hopping_pen" in penalties

    def test_set_group_weight(self):
        registry = FeatureRegistry()
        registry.set_group_weight("technical", 0.50)
        assert registry.group_weights()["technical"] == 0.50

    def test_summary_has_required_keys(self):
        registry = FeatureRegistry()
        summary = registry.summary()
        assert "total_features" in summary
        assert "groups" in summary
        assert "group_weights" in summary

    def test_singleton_get_registry(self):
        r1 = get_feature_registry()
        r2 = get_feature_registry()
        assert r1 is r2


# ─────────────────────────────────────────────────────────────────────────────
# 4. Technical Feature Extractor Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestTechnicalFeatureExtractor:
    def test_extracts_retrieval_score(self, profile):
        extractor = TechnicalFeatureExtractor()
        features = extractor.extract_features(profile)
        # Profile has retrieval_experience=0.85 and summary mentions FAISS
        assert features.retrieval_experience_score > 0.5

    def test_extracts_python_score(self, profile):
        extractor = TechnicalFeatureExtractor()
        features = extractor.extract_features(profile)
        assert features.python_score > 0.5

    def test_extracts_llm_score(self, profile):
        extractor = TechnicalFeatureExtractor()
        features = extractor.extract_features(profile)
        # Summary mentions LLM
        assert features.llm_score > 0.0

    def test_overall_score_bounded(self, profile):
        extractor = TechnicalFeatureExtractor()
        features = extractor.extract_features(profile)
        assert 0.0 <= features.overall_technical_score() <= 1.0

    def test_evidence_populated(self, profile):
        extractor = TechnicalFeatureExtractor()
        features = extractor.extract_features(profile)
        # At least some features should have evidence
        assert any(
            len(fs.evidence) > 0 for fs in features.feature_evidence.values()
        )

    def test_no_signal_profile_scores_low(self):
        blank_profile = CandidateProfile(
            candidate_id="CAND_9999999",
            technical_profile=TechnicalProfile(),  # all zeros
            career_profile=CareerProfile(),
            behavioral_profile=BehavioralProfile(),
            market_profile=MarketProfile(),
            candidate_summary="Professional with experience in general work.",
            overall_strength=0.0,
        )
        extractor = TechnicalFeatureExtractor()
        features = extractor.extract_features(blank_profile)
        assert features.overall_technical_score() < 0.4


# ─────────────────────────────────────────────────────────────────────────────
# 5. Career Feature Extractor Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestCareerFeatureExtractor:
    def test_experience_score_increases_with_years(self):
        extractor = CareerFeatureExtractor()
        junior = _make_candidate(years=2.0)
        senior = _make_candidate(years=12.0)
        junior_profile = _make_candidate_profile()
        senior_profile = _make_candidate_profile()
        junior_features = extractor.extract_features(junior, junior_profile)
        senior_features = extractor.extract_features(senior, senior_profile)
        assert senior_features.years_experience_score > junior_features.years_experience_score

    def test_job_hopping_detected(self):
        extractor = CareerFeatureExtractor()
        hopper = _make_candidate()
        # Add multiple short-tenure roles
        hopper.career_history[0] = _make_career_history(months=6)
        hopper.career_history[1] = _make_career_history(months=8)
        features = extractor.extract_features(hopper)
        assert features.job_hopping_penalty > 0.0

    def test_product_company_score(self, candidate, profile):
        extractor = CareerFeatureExtractor()
        features = extractor.extract_features(candidate, profile)
        # All jobs at product companies
        assert features.product_company_score > 0.5

    def test_overall_bounded(self, candidate, profile):
        extractor = CareerFeatureExtractor()
        features = extractor.extract_features(candidate, profile)
        assert 0.0 <= features.overall_career_score() <= 1.0

    def test_experience_score_formula(self):
        extractor = CareerFeatureExtractor()
        assert extractor.calculate_experience_score(0.0) == 0.0
        assert extractor.calculate_experience_score(15.0) == pytest.approx(1.0, abs=0.05)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Leadership Feature Extractor Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestLeadershipFeatureExtractor:
    def test_tech_lead_title_detected(self, profile):
        candidate = _make_candidate(title="Tech Lead")
        extractor = LeadershipFeatureExtractor()
        features = extractor.extract_features(candidate, profile)
        assert features.technical_leadership_score > 0.0

    def test_management_description_detected(self, profile):
        candidate = _make_candidate()
        candidate.career_history[0] = _make_career_history(
            description="Managed a team of 6 engineers. Conducted performance reviews."
        )
        extractor = LeadershipFeatureExtractor()
        features = extractor.extract_features(candidate, profile)
        assert features.people_management_score > 0.0

    def test_ownership_detected(self, profile, candidate):
        candidate.career_history[0] = _make_career_history(
            description="Owned end-to-end ownership of the retrieval platform."
        )
        extractor = LeadershipFeatureExtractor()
        features = extractor.extract_features(candidate, profile)
        assert features.ownership_score > 0.0

    def test_overall_bounded(self, candidate, profile):
        extractor = LeadershipFeatureExtractor()
        features = extractor.extract_features(candidate, profile)
        assert 0.0 <= features.overall_leadership_score() <= 1.0


# ─────────────────────────────────────────────────────────────────────────────
# 7. Execution Feature Extractor Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestExecutionFeatureExtractor:
    def test_shipping_verbs_detected(self, candidate):
        extractor = ExecutionFeatureExtractor()
        features = extractor.extract_features(candidate)
        # Descriptions contain "Built", "Implemented", "Reduced"
        assert features.shipping_score > 0.0

    def test_scale_marker_detected(self):
        candidate = _make_candidate()
        candidate.career_history[0] = _make_career_history(
            description="Built FAISS retrieval system serving 10M users globally."
        )
        extractor = ExecutionFeatureExtractor()
        features = extractor.extract_features(candidate)
        assert features.system_scale_score > 0.0

    def test_impact_pattern_detected(self):
        candidate = _make_candidate()
        candidate.career_history[0] = _make_career_history(
            description="Reduced latency by 40%. Improved recall by 15%."
        )
        extractor = ExecutionFeatureExtractor()
        features = extractor.extract_features(candidate)
        assert features.impact_score > 0.0

    def test_production_from_history(self, candidate):
        extractor = ExecutionFeatureExtractor()
        features = extractor.extract_features(candidate)
        # has_production_keywords from CareerHistory
        assert features.production_delivery_score >= 0.0

    def test_overall_bounded(self, candidate):
        extractor = ExecutionFeatureExtractor()
        features = extractor.extract_features(candidate)
        assert 0.0 <= features.overall_execution_score() <= 1.0


# ─────────────────────────────────────────────────────────────────────────────
# 8. Market Feature Extractor Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestMarketFeatureExtractor:
    def test_availability_high_when_open_to_work(self, candidate):
        extractor = MarketFeatureExtractor()
        features = extractor.extract_features(candidate)
        assert features.availability_score > 0.5

    def test_availability_low_when_not_open(self):
        candidate = _make_candidate()
        candidate.redrob_signals = _make_redrob_signals(open_to_work=False, notice_days=90)
        extractor = MarketFeatureExtractor()
        features = extractor.extract_features(candidate)
        assert features.availability_score < 0.5

    def test_salary_alignment_overlap(self):
        extractor = MarketFeatureExtractor(
            role_salary_min_lpa=30.0, role_salary_max_lpa=60.0
        )
        candidate = _make_candidate()
        # Candidate expects 30-60, role is 30-60 → full overlap
        features = extractor.extract_features(candidate)
        assert features.salary_alignment_score > 0.5

    def test_salary_no_overlap(self):
        extractor = MarketFeatureExtractor(
            role_salary_min_lpa=100.0, role_salary_max_lpa=150.0
        )
        candidate = _make_candidate()
        features = extractor.extract_features(candidate)
        assert features.salary_alignment_score == 0.0

    def test_profile_strength_high_with_verifications(self, candidate):
        extractor = MarketFeatureExtractor()
        features = extractor.extract_features(candidate)
        assert features.profile_strength_score > 0.6

    def test_overall_bounded(self, candidate):
        extractor = MarketFeatureExtractor()
        features = extractor.extract_features(candidate)
        assert 0.0 <= features.overall_market_score() <= 1.0


# ─────────────────────────────────────────────────────────────────────────────
# 9. Matching Feature Extractor Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestMatchingFeatureExtractor:
    def test_skill_coverage_full(self, candidate, parsed_jd):
        extractor = MatchingFeatureExtractor()
        score = extractor.calculate_skill_coverage(candidate, parsed_jd)
        # Candidate has python, faiss, retrieval, ranking → 4/4
        assert score == pytest.approx(1.0)

    def test_skill_coverage_partial(self, parsed_jd):
        candidate = _make_candidate()
        candidate.skills = [Skill(name="python", proficiency=SkillProficiency.EXPERT)]
        extractor = MatchingFeatureExtractor()
        score = extractor.calculate_skill_coverage(candidate, parsed_jd)
        assert score == pytest.approx(0.25)

    def test_semantic_alignment_from_hybrid(self, candidate, parsed_jd, hybrid_candidate):
        extractor = MatchingFeatureExtractor()
        score = extractor.calculate_semantic_alignment(hybrid_candidate)
        # similarity=0.88 → (0.88+1)/2 = 0.94
        assert score == pytest.approx(0.94, abs=0.01)

    def test_location_alignment_match(self, candidate, parsed_jd):
        extractor = MatchingFeatureExtractor()
        # Candidate in Bangalore, JD prefers Bangalore
        score = extractor.calculate_location_alignment(candidate, parsed_jd)
        assert score == 1.0

    def test_location_alignment_mismatch_with_relocation(self, parsed_jd):
        candidate = _make_candidate()
        candidate.profile = _make_profile()
        candidate.profile = Profile(
            anonymized_name="X",
            headline="ML",
            summary="",
            location="Mumbai, India",
            country="India",
            years_of_experience=8.0,
            current_title="Senior ML Engineer",
            current_company="Co",
            current_company_size=CompanySize.LARGE,
            current_industry="Technology",
        )
        # candidate willing to relocate
        extractor = MatchingFeatureExtractor()
        score = extractor.calculate_location_alignment(candidate, parsed_jd)
        assert score == 0.75

    def test_experience_alignment_in_range(self, candidate, parsed_jd):
        extractor = MatchingFeatureExtractor()
        score = extractor.calculate_experience_alignment(
            candidate, parsed_jd, target_min_years=5.0, target_max_years=12.0
        )
        assert score == 1.0  # 8 years in [5, 12]

    def test_experience_alignment_below_minimum(self, parsed_jd):
        candidate = _make_candidate(years=2.0)
        extractor = MatchingFeatureExtractor()
        score = extractor.calculate_experience_alignment(
            candidate, parsed_jd, target_min_years=5.0, target_max_years=12.0
        )
        assert score < 1.0

    def test_overall_bounded(self, candidate, parsed_jd, hybrid_candidate):
        extractor = MatchingFeatureExtractor()
        features = extractor.extract_features(candidate, parsed_jd, hybrid_candidate)
        assert 0.0 <= features.overall_matching_score() <= 1.0


# ─────────────────────────────────────────────────────────────────────────────
# 10. Feature Normalizer Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestFeatureNormalizer:
    def test_min_max_normalization(self):
        dicts = [
            {"a": 0.0, "b": 1.0},
            {"a": 0.5, "b": 0.5},
            {"a": 1.0, "b": 0.0},
        ]
        normalizer = FeatureNormalizer()
        normed = normalizer.normalize_batch(dicts, strategy="min_max")
        assert normed[0]["a"] == pytest.approx(0.0)
        assert normed[-1]["a"] == pytest.approx(1.0)

    def test_z_score_normalization_bounded(self):
        dicts = [{"x": float(i)} for i in range(10)]
        normalizer = FeatureNormalizer()
        normed = normalizer.normalize_batch(dicts, strategy="z_score")
        for d in normed:
            assert 0.0 <= d["x"] <= 1.0

    def test_robust_normalization_outlier_resistant(self):
        dicts = [{"v": 1.0}, {"v": 2.0}, {"v": 3.0}, {"v": 100.0}]
        normalizer = FeatureNormalizer()
        normed = normalizer.normalize_batch(dicts, strategy="robust")
        for d in normed:
            assert 0.0 <= d["v"] <= 1.0

    def test_empty_batch_returns_empty(self):
        normalizer = FeatureNormalizer()
        assert normalizer.normalize_batch([]) == []

    def test_validate_feature_ranges_valid(self):
        normalizer = FeatureNormalizer()
        is_valid, violations = normalizer.validate_feature_ranges(
            {"a": 0.5, "b": 0.0, "c": 1.0}
        )
        assert is_valid
        assert violations == []

    def test_validate_feature_ranges_invalid(self):
        normalizer = FeatureNormalizer()
        is_valid, violations = normalizer.validate_feature_ranges(
            {"a": 1.5, "b": -0.1}
        )
        assert not is_valid
        assert len(violations) == 2

    def test_single_candidate_batch(self):
        normalizer = FeatureNormalizer()
        normed = normalizer.normalize_batch([{"x": 0.7}], strategy="min_max")
        assert len(normed) == 1


# ─────────────────────────────────────────────────────────────────────────────
# 11. Feature Engineering Pipeline Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestFeatureEngineering:
    def test_generate_features_returns_feature_vector(
        self, candidate, profile, parsed_jd, hybrid_candidate
    ):
        engine = FeatureEngineering()
        vector = engine.generate_features(
            candidate=candidate,
            profile=profile,
            parsed_jd=parsed_jd,
            hybrid_candidate=hybrid_candidate,
            query_id="TEST_Q",
        )
        assert isinstance(vector, FeatureVector)
        assert vector.candidate_id == "CAND_0000001"
        assert vector.query_id == "TEST_Q"

    def test_generate_features_overall_strength_positive(
        self, candidate, profile, parsed_jd, hybrid_candidate
    ):
        engine = FeatureEngineering()
        vector = engine.generate_features(
            candidate=candidate,
            profile=profile,
            parsed_jd=parsed_jd,
            hybrid_candidate=hybrid_candidate,
        )
        assert vector.overall_feature_strength > 0.0

    def test_generate_batch_features(self, profile, parsed_jd, hybrid_candidate):
        candidates = [_make_candidate(f"CAND_{str(i).zfill(7)}") for i in range(1, 6)]
        profiles = [_make_candidate_profile(c.candidate_id) for c in candidates]
        engine = FeatureEngineering()
        vectors = engine.generate_batch_features(
            candidates=candidates,
            profiles=profiles,
            parsed_jd=parsed_jd,
            normalize=False,
        )
        assert len(vectors) == 5

    def test_batch_with_normalization(self, parsed_jd):
        candidates = [_make_candidate(f"CAND_{str(i).zfill(7)}") for i in range(1, 4)]
        profiles = [_make_candidate_profile(c.candidate_id) for c in candidates]
        engine = FeatureEngineering()
        vectors = engine.generate_batch_features(
            candidates=candidates,
            profiles=profiles,
            parsed_jd=parsed_jd,
            normalize=True,
            normalization_strategy="min_max",
        )
        assert len(vectors) == 3

    def test_feature_statistics(self, candidate, profile, parsed_jd):
        engine = FeatureEngineering()
        vector = engine.generate_features(candidate, profile, parsed_jd)
        stats = engine.feature_statistics([vector])
        assert "tech_retrieval" in stats
        assert "mean" in stats["tech_retrieval"]

    def test_flat_dict_all_bounded(self, candidate, profile, parsed_jd, hybrid_candidate):
        engine = FeatureEngineering()
        vector = engine.generate_features(candidate, profile, parsed_jd, hybrid_candidate)
        flat = vector.to_flat_dict()
        for name, val in flat.items():
            assert 0.0 <= val <= 1.0, f"{name}={val} out of [0,1]"
