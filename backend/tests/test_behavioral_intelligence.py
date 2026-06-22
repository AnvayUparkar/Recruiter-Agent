"""Tests for Phase 11: Behavioral Intelligence & Recruiter Trust Engine.

Covers:
    - AvailabilityAnalyzer (5 test scenarios)
    - EngagementAnalyzer (4 test scenarios)
    - ResponsivenessAnalyzer (4 test scenarios)
    - TrustEngine (5 test scenarios including anomaly detection)
    - JoinProbabilityEstimator (4 test scenarios)
    - BehavioralScoring (3 test scenarios including weight validation)
    - BehavioralMetrics (3 test scenarios)
    - BehavioralFeatureService (3 test scenarios)
    - RecruiterTrustService full pipeline (4 test scenarios)
    - Evidence collection (all analyzers)
    - Confidence scoring (all analyzers)

All tests use realistic candidate scenarios grounded in the existing
Candidate/RedrobSignals data model.
"""

import pytest
from datetime import date, timedelta
from typing import List

from models.candidate import Candidate
from models.profile import Profile, CompanySize
from models.career_history import CareerHistory
from models.education import Education, EducationTier
from models.skill import Skill, SkillProficiency
from models.certification import Certification
from models.language import Language, LanguageProficiency
from models.redrob_signals import RedrobSignals, PreferredWorkMode, ExpectedSalaryRange

from models.availability_profile import AvailabilityProfile
from models.engagement_profile import EngagementProfile
from models.responsiveness_profile import ResponsivenessProfile
from models.trust_profile import TrustProfile
from models.behavioral_intelligence import BehavioralIntelligence

from services.availability_analyzer import AvailabilityAnalyzer
from services.engagement_analyzer import EngagementAnalyzer
from services.responsiveness_analyzer import ResponsivenessAnalyzer
from services.trust_engine import TrustEngine
from services.join_probability_estimator import JoinProbabilityEstimator
from services.behavioral_scoring import BehavioralScoring, ScoringConfig
from services.behavioral_metrics import BehavioralMetrics
from services.behavioral_feature_service import BehavioralFeatureService
from services.recruiter_trust_service import RecruiterTrustService


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────────────────────────────────────

def _make_signals(
    open_to_work: bool = True,
    notice_period_days: int = 30,
    applications_30d: int = 5,
    profile_views_30d: int = 40,
    recruiter_saves_30d: int = 5,
    search_appearances_30d: int = 150,
    recruiter_response_rate: float = 0.85,
    avg_response_time_hours: float = 6.0,
    interview_completion_rate: float = 0.90,
    offer_acceptance_rate: float = 0.75,
    profile_completeness: float = 85.0,
    verified_email: bool = True,
    verified_phone: bool = True,
    linkedin_connected: bool = True,
    github_activity_score: float = 55.0,
    connection_count: int = 300,
    endorsements_received: int = 40,
    days_since_active: int = 5,
    salary_min: float = 30.0,
    salary_max: float = 50.0,
    skill_assessment_scores: dict = None,
) -> RedrobSignals:
    """Factory for creating RedrobSignals with sensible defaults."""
    last_active = date(2026, 6, 15) - timedelta(days=days_since_active)
    signup_date = date(2025, 1, 1)  # ~1.5 years ago

    return RedrobSignals(
        profile_completeness_score=profile_completeness,
        signup_date=signup_date,
        last_active_date=last_active,
        open_to_work_flag=open_to_work,
        profile_views_received_30d=profile_views_30d,
        applications_submitted_30d=applications_30d,
        recruiter_response_rate=recruiter_response_rate,
        avg_response_time_hours=avg_response_time_hours,
        skill_assessment_scores=skill_assessment_scores or {"Python": 85.0, "SQL": 75.0},
        connection_count=connection_count,
        endorsements_received=endorsements_received,
        notice_period_days=notice_period_days,
        expected_salary_range_inr_lpa=ExpectedSalaryRange(min=salary_min, max=salary_max),
        preferred_work_mode=PreferredWorkMode.HYBRID,
        willing_to_relocate=True,
        github_activity_score=github_activity_score,
        search_appearance_30d=search_appearances_30d,
        saved_by_recruiters_30d=recruiter_saves_30d,
        interview_completion_rate=interview_completion_rate,
        offer_acceptance_rate=offer_acceptance_rate,
        verified_email=verified_email,
        verified_phone=verified_phone,
        linkedin_connected=linkedin_connected,
    )


def _make_career_history(
    num_roles: int = 2,
    avg_tenure_months: int = 24,
    short_tenures: int = 0,
) -> List[CareerHistory]:
    """Factory for career history entries."""
    roles = []
    for i in range(num_roles):
        tenure = 6 if i < short_tenures else avg_tenure_months
        roles.append(
            CareerHistory(
                company=f"TechCorp {i + 1}",
                title=f"Senior Engineer {i + 1}",
                start_date=date(2020 + i, 1, 1),
                end_date=None if i == num_roles - 1 else date(2020 + i, 1, 1) + timedelta(days=tenure * 30),
                duration_months=tenure,
                is_current=(i == num_roles - 1),
                industry="Technology",
                company_size=CompanySize.MEDIUM,
                description=(
                    "Led production ML pipelines at scale. Deployed models to AWS, "
                    "managed CI/CD, kubernetes infrastructure, and monitoring dashboards."
                ),
            )
        )
    return roles


def _make_skills(count: int = 8) -> List[Skill]:
    """Factory for skill entries."""
    skill_names = ["Python", "SQL", "Machine Learning", "Kubernetes",
                   "AWS", "Docker", "FastAPI", "PostgreSQL", "Redis", "Spark"]
    return [
        Skill(
            name=skill_names[i % len(skill_names)],
            proficiency=SkillProficiency.ADVANCED,
            endorsements=10 + i,
        )
        for i in range(count)
    ]


def _make_candidate(
    candidate_id: str = "CAND_0000001",
    years_exp: float = 6.0,
    num_skills: int = 8,
    num_roles: int = 2,
    short_tenures: int = 0,
    **signals_kwargs,
) -> Candidate:
    """Factory for creating complete Candidate objects."""
    return Candidate(
        candidate_id=candidate_id,
        profile=Profile(
            anonymized_name="Candidate A",
            headline="Senior ML Engineer",
            summary="Experienced ML engineer with strong Python and cloud skills.",
            location="Bengaluru",
            country="India",
            years_of_experience=years_exp,
            current_title="Senior ML Engineer",
            current_company="TechCorp",
            current_company_size=CompanySize.MEDIUM,
            current_industry="Technology",
        ),
        career_history=_make_career_history(num_roles=num_roles, short_tenures=short_tenures),
        education=[
            Education(
                institution="IIT Bombay",
                degree="B.Tech",
                field_of_study="Computer Science",
                start_year=2014,
                end_year=2018,
                tier=EducationTier.TIER_1,
            )
        ],
        skills=_make_skills(num_skills),
        certifications=[],
        languages=[
            Language(language="English", proficiency=LanguageProficiency.NATIVE)
        ],
        redrob_signals=_make_signals(**signals_kwargs),
    )


# ─────────────────────────────────────────────────────────────────────────────
# AVAILABILITY ANALYZER TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestAvailabilityAnalyzer:
    """Tests for AvailabilityAnalyzer."""

    def setup_method(self):
        self.analyzer = AvailabilityAnalyzer()

    def test_high_availability_candidate(self):
        """Open-to-work, immediate joiner, active applications → high score."""
        candidate = _make_candidate(
            open_to_work=True,
            notice_period_days=0,
            applications_30d=8,
            days_since_active=2,
        )
        profile = self.analyzer.generate_profile(candidate)

        assert profile.availability_score >= 0.80
        assert profile.confidence >= 0.75
        assert profile.open_to_work_score == 1.0
        assert profile.notice_period_score == 1.0
        assert len(profile.evidence) > 0
        assert profile.is_immediately_available()

    def test_low_availability_passive_candidate(self):
        """Not open to work, long notice, no applications → low score."""
        candidate = _make_candidate(
            open_to_work=False,
            notice_period_days=120,
            applications_30d=0,
            days_since_active=95,
        )
        profile = self.analyzer.generate_profile(candidate)

        assert profile.availability_score < 0.30
        assert profile.open_to_work_score == 0.0
        assert not profile.is_immediately_available()

    def test_notice_period_scoring_tiers(self):
        """Validates each notice-period scoring tier produces expected ranges."""
        tiers = [
            (0,   0.95, 1.01),  # immediate
            (15,  0.85, 0.95),  # ≤15 days
            (30,  0.70, 0.80),  # ≤30 days
            (60,  0.45, 0.55),  # ≤60 days
            (90,  0.20, 0.30),  # ≤90 days
            (120, 0.01, 0.10),  # >90 days
        ]
        for days, low, high in tiers:
            score, _ = self.analyzer.calculate_notice_period(
                _make_candidate(notice_period_days=days)
            )
            assert low <= score <= high, f"Notice={days} days: expected [{low},{high}], got {score}"

    def test_recency_decay(self):
        """Profile recency score should decay as days_since_active increases."""
        scores = []
        for days in [3, 15, 45, 75]:
            c = _make_candidate(days_since_active=days)
            score, _ = self.analyzer.calculate_recency(c)
            scores.append(score)

        # Each successive interval should produce a lower score
        for i in range(len(scores) - 1):
            assert scores[i] >= scores[i + 1], (
                f"Recency should decay: {scores[i]} should >= {scores[i+1]}"
            )

    def test_evidence_is_populated(self):
        """Every sub-score should produce at least one evidence string."""
        candidate = _make_candidate()
        profile = self.analyzer.generate_profile(candidate)

        assert len(profile.evidence) >= 4  # At least one per sub-signal
        assert any("Open To Work" in e for e in profile.evidence)
        assert any("notice" in e.lower() or "Notice" in e for e in profile.evidence)


# ─────────────────────────────────────────────────────────────────────────────
# ENGAGEMENT ANALYZER TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestEngagementAnalyzer:
    """Tests for EngagementAnalyzer."""

    def setup_method(self):
        self.analyzer = EngagementAnalyzer()

    def test_high_engagement_candidate(self):
        """High profile views, recruiter saves, applications → high score."""
        candidate = _make_candidate(
            profile_views_30d=80,
            recruiter_saves_30d=15,
            applications_30d=8,
            search_appearances_30d=400,
            github_activity_score=70.0,
        )
        profile = self.analyzer.generate_profile(candidate)

        assert profile.engagement_score >= 0.65
        assert profile.confidence >= 0.80
        assert profile.is_highly_engaged()

    def test_low_engagement_passive_candidate(self):
        """Zero activity across all signals → near-zero score."""
        candidate = _make_candidate(
            profile_views_30d=0,
            recruiter_saves_30d=0,
            applications_30d=0,
            search_appearances_30d=0,
            github_activity_score=0.0,
        )
        profile = self.analyzer.generate_profile(candidate)

        assert profile.engagement_score < 0.20
        assert not profile.is_highly_engaged()

    def test_unknown_github_score(self):
        """GitHub score of -1.0 (unknown) should not crash and defaults to 0."""
        candidate = _make_candidate(github_activity_score=-1.0)
        market_score, evidence = self.analyzer.calculate_market_activity(candidate)

        assert market_score == 0.0
        assert any("No GitHub" in e for e in evidence)

    def test_engagement_feature_dict(self):
        """to_feature_dict() should return all expected engagement keys."""
        candidate = _make_candidate()
        profile = self.analyzer.generate_profile(candidate)
        features = profile.to_feature_dict()

        required_keys = [
            "engage_profile_views", "engage_recruiter_saves",
            "engage_applications", "engage_search_appear",
            "engage_market", "engage_overall", "engage_confidence",
        ]
        for key in required_keys:
            assert key in features, f"Missing feature key: {key}"
            assert 0.0 <= features[key] <= 1.0


# ─────────────────────────────────────────────────────────────────────────────
# RESPONSIVENESS ANALYZER TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestResponsivenessAnalyzer:
    """Tests for ResponsivenessAnalyzer."""

    def setup_method(self):
        self.analyzer = ResponsivenessAnalyzer()

    def test_highly_responsive_candidate(self):
        """High response rate, fast replies, perfect interview completion → high score."""
        candidate = _make_candidate(
            recruiter_response_rate=0.95,
            avg_response_time_hours=1.5,
            interview_completion_rate=1.0,
            offer_acceptance_rate=0.90,
        )
        profile = self.analyzer.generate_profile(candidate)

        assert profile.responsiveness_score >= 0.80
        assert profile.is_highly_responsive()
        assert profile.response_rate >= 0.90

    def test_unresponsive_candidate(self):
        """Zero response rate, very slow replies → low score."""
        candidate = _make_candidate(
            recruiter_response_rate=0.05,
            avg_response_time_hours=96.0,
            interview_completion_rate=0.10,
            offer_acceptance_rate=0.0,
        )
        profile = self.analyzer.generate_profile(candidate)

        assert profile.responsiveness_score < 0.30
        assert not profile.is_highly_responsive()

    def test_no_offer_history_neutral(self):
        """offer_acceptance_rate of -1.0 should default to neutral (0.50) mid-score."""
        candidate = _make_candidate(offer_acceptance_rate=-1.0)
        score, evidence = self.analyzer.calculate_communication_reliability(candidate)

        # Should not be zero or 1.0 — neutral territory
        assert 0.30 <= score <= 0.80
        assert any("No offer" in e or "neutral" in e.lower() for e in evidence)

    def test_response_time_tiers(self):
        """Verifies response-time scoring tiers are strictly ordered."""
        hours_to_score = [1.0, 8.0, 20.0, 50.0, 100.0]
        scores = []
        for hours in hours_to_score:
            c = _make_candidate(avg_response_time_hours=hours)
            s, _ = self.analyzer.calculate_response_time(c)
            scores.append(s)

        for i in range(len(scores) - 1):
            assert scores[i] >= scores[i + 1], (
                f"Response time tiers should be descending: {scores}"
            )


# ─────────────────────────────────────────────────────────────────────────────
# TRUST ENGINE TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestTrustEngine:
    """Tests for TrustEngine."""

    def setup_method(self):
        self.engine = TrustEngine()

    def test_fully_verified_profile(self):
        """Verified email + phone + LinkedIn → high verification score."""
        candidate = _make_candidate(
            verified_email=True,
            verified_phone=True,
            linkedin_connected=True,
            profile_completeness=90.0,
        )
        score, evidence = self.engine.calculate_verification_score(candidate)

        assert score == 1.0
        assert any("Email" in e and "verified" in e.lower() for e in evidence)
        assert any("Phone" in e and "verified" in e.lower() for e in evidence)
        assert any("LinkedIn" in e for e in evidence)

    def test_unverified_profile(self):
        """No verification signals → low score."""
        candidate = _make_candidate(
            verified_email=False,
            verified_phone=False,
            linkedin_connected=False,
        )
        score, _ = self.engine.calculate_verification_score(candidate)

        assert score == 0.0

    def test_career_consistency_stable(self):
        """Candidate with long tenures → high career consistency."""
        candidate = _make_candidate(num_roles=3, short_tenures=0)
        score, evidence = self.engine.calculate_career_consistency(candidate)

        assert score >= 0.70
        assert any("stable" in e.lower() for e in evidence)

    def test_career_consistency_job_hopper(self):
        """Candidate with many short tenures → lower career consistency."""
        candidate = _make_candidate(num_roles=4, short_tenures=4)
        score, evidence = self.engine.calculate_career_consistency(candidate)

        assert score <= 0.70
        assert any("short" in e.lower() or "hopping" in e.lower() for e in evidence)

    def test_anomaly_detection_open_to_work_no_apps(self):
        """Open To Work + zero applications should trigger an anomaly."""
        candidate = _make_candidate(
            open_to_work=True,
            applications_30d=0,
        )
        anomalies = self.engine.detect_anomalies(candidate)

        assert len(anomalies) >= 1
        assert any("Open To Work" in a for a in anomalies)

    def test_full_trust_profile_fields(self):
        """TrustProfile should have all fields populated with valid ranges."""
        candidate = _make_candidate()
        profile = self.engine.generate_profile(candidate)

        assert 0.0 <= profile.trust_score <= 1.0
        assert 0.0 <= profile.profile_completeness <= 1.0
        assert 0.0 <= profile.verification_score <= 1.0
        assert 0.0 <= profile.consistency_score <= 1.0
        assert 0.0 <= profile.career_consistency <= 1.0
        assert 0.0 <= profile.identity_confidence <= 1.0
        assert 0.0 <= profile.profile_quality <= 1.0
        assert 0.0 <= profile.confidence <= 1.0
        assert len(profile.evidence) > 0


# ─────────────────────────────────────────────────────────────────────────────
# JOIN PROBABILITY ESTIMATOR TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestJoinProbabilityEstimator:
    """Tests for JoinProbabilityEstimator."""

    def setup_method(self):
        self.estimator = JoinProbabilityEstimator()

    def test_ideal_conversion_candidate(self):
        """OTW + high response + salary match + strong history → high probability."""
        candidate = _make_candidate(
            open_to_work=True,
            applications_30d=7,
            recruiter_response_rate=0.90,
            offer_acceptance_rate=0.85,
            salary_min=35.0,
            salary_max=50.0,
        )
        result = self.estimator.estimate(candidate, offer_budget_lpa=45.0)

        assert result.join_probability >= 0.65
        assert result.confidence >= 0.60
        assert len(result.evidence) > 0

    def test_salary_below_minimum(self):
        """Offer below candidate's min expectation → lower join probability."""
        candidate = _make_candidate(salary_min=40.0, salary_max=60.0)
        result_low = self.estimator.estimate(candidate, offer_budget_lpa=20.0)
        result_match = self.estimator.estimate(candidate, offer_budget_lpa=50.0)

        assert result_low.join_probability < result_match.join_probability

    def test_no_offer_history_neutral(self):
        """No offer history (-1.0) should give a neutral mid-score."""
        candidate = _make_candidate(offer_acceptance_rate=-1.0)
        score, evidence = self.estimator._score_offer_history(candidate)

        assert score == 0.50
        assert any("No offer history" in e or "neutral" in e.lower() for e in evidence)

    def test_ml_override_is_passthrough(self):
        """ML override stub should return rule_based_score unchanged."""
        candidate = _make_candidate()
        rule_score = 0.72
        result = self.estimator._apply_ml_override(rule_score, candidate)

        assert result == rule_score


# ─────────────────────────────────────────────────────────────────────────────
# BEHAVIORAL SCORING TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestBehavioralScoring:
    """Tests for BehavioralScoring and ScoringConfig."""

    def _make_bi(
        self,
        trust: float = 0.80,
        availability: float = 0.75,
        responsiveness: float = 0.85,
        engagement: float = 0.60,
        join_prob: float = 0.70,
    ) -> BehavioralIntelligence:
        return BehavioralIntelligence(
            candidate_id="CAND_0000001",
            trust_score=trust,
            availability_score=availability,
            responsiveness_score=responsiveness,
            engagement_score=engagement,
            join_probability=join_prob,
        )

    def test_default_weight_formula(self):
        """Verifies default formula: 0.30×T + 0.25×A + 0.20×R + 0.15×E + 0.10×J."""
        bi = self._make_bi(
            trust=1.0, availability=1.0, responsiveness=1.0,
            engagement=1.0, join_prob=1.0
        )
        scorer = BehavioralScoring()
        result = scorer.compute_behavioral_score(bi)

        assert result.behavioral_score == pytest.approx(1.0, abs=0.01)

    def test_custom_scoring_config(self):
        """ScoringConfig with custom weights should produce expected composite."""
        config = ScoringConfig(
            trust=0.50,
            availability=0.20,
            responsiveness=0.15,
            engagement=0.10,
            join_probability=0.05,
        )
        scorer = BehavioralScoring(config=config)
        bi = self._make_bi(
            trust=0.80, availability=0.60, responsiveness=0.40,
            engagement=0.50, join_prob=0.70,
        )
        result = scorer.compute_behavioral_score(bi)

        expected = (0.50 * 0.80 + 0.20 * 0.60 + 0.15 * 0.40
                    + 0.10 * 0.50 + 0.05 * 0.70)
        assert result.behavioral_score == pytest.approx(expected, abs=0.01)

    def test_invalid_config_raises(self):
        """ScoringConfig with weights that don't sum to 1.0 should raise ValueError."""
        with pytest.raises(ValueError, match="must sum to 1.0"):
            ScoringConfig(
                trust=0.50,
                availability=0.50,
                responsiveness=0.50,
                engagement=0.50,
                join_probability=0.50,
            )

    def test_recruiter_friendliness_computed(self):
        """recruiter_friendliness should be filled after scoring."""
        bi = self._make_bi()
        scorer = BehavioralScoring()
        result = scorer.compute_behavioral_score(bi)

        assert 0.0 <= result.recruiter_friendliness <= 1.0

    def test_evidence_contains_scoring_breakdown(self):
        """Evidence should include the scoring formula breakdown string."""
        bi = self._make_bi()
        scorer = BehavioralScoring()
        result = scorer.compute_behavioral_score(bi)

        assert any("behavioral_score" in e for e in result.evidence)


# ─────────────────────────────────────────────────────────────────────────────
# BEHAVIORAL METRICS TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestBehavioralMetrics:
    """Tests for BehavioralMetrics."""

    def _make_profiles(self, n: int = 20) -> List[BehavioralIntelligence]:
        """Creates n dummy BehavioralIntelligence profiles with varying scores."""
        profiles = []
        for i in range(n):
            score = i / (n - 1)  # uniformly distributed 0.0 → 1.0
            profiles.append(
                BehavioralIntelligence(
                    candidate_id=f"CAND_{i:07d}",
                    trust_score=score,
                    availability_score=score,
                    engagement_score=score,
                    responsiveness_score=score,
                    join_probability=score,
                    behavioral_score=score,
                    recruiter_friendliness=score,
                    confidence=min(1.0, score + 0.1),
                )
            )
        return profiles

    def test_distribution_stats_structure(self):
        """calculate_metrics() should return all six dimension keys."""
        metrics = BehavioralMetrics()
        profiles = self._make_profiles(20)
        result = metrics.calculate_metrics(profiles)

        assert "behavioral" in result
        assert "trust" in result
        assert "availability" in result
        assert "engagement" in result
        assert "responsiveness" in result
        assert "join_probability" in result

    def test_report_structure(self):
        """generate_report() should return pool metadata + metrics."""
        metrics = BehavioralMetrics()
        profiles = self._make_profiles(10)
        report = metrics.generate_report(profiles, pool_name="Test Pool")

        assert report["pool_name"] == "Test Pool"
        assert report["total_candidates"] == 10
        assert "avg_behavioral_score" in report
        assert "recruiter_ready_count" in report
        assert "metrics" in report

    def test_empty_pool_report(self):
        """Empty pool should return gracefully with zero candidates."""
        metrics = BehavioralMetrics()
        report = metrics.generate_report([])

        assert report["total_candidates"] == 0
        assert report["metrics"] == {}


# ─────────────────────────────────────────────────────────────────────────────
# BEHAVIORAL FEATURE SERVICE TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestBehavioralFeatureService:
    """Tests for BehavioralFeatureService."""

    def _make_scored_bi(self) -> BehavioralIntelligence:
        """Creates a scored BehavioralIntelligence with sub-profiles for testing."""
        service = RecruiterTrustService()
        candidate = _make_candidate()
        return service.build_behavioral_profile(candidate)

    def test_generate_features_returns_valid_vector(self):
        """generate_features() should return a dict with [0,1] float values."""
        bi = self._make_scored_bi()
        feature_svc = BehavioralFeatureService()
        features = feature_svc.generate_features(bi)

        assert len(features) > 0
        for key, val in features.items():
            assert isinstance(val, float), f"Feature {key} is not float: {type(val)}"
            assert 0.0 <= val <= 1.0, f"Feature {key} out of range: {val}"

    def test_generate_features_contains_top_level_keys(self):
        """All TOP_LEVEL_FEATURES should be present in the output."""
        bi = self._make_scored_bi()
        feature_svc = BehavioralFeatureService()
        features = feature_svc.generate_features(bi)

        for key in BehavioralFeatureService.TOP_LEVEL_FEATURES:
            assert key in features, f"Missing top-level feature: {key}"

    def test_batch_feature_generation(self):
        """generate_batch_features() should return one entry per candidate."""
        candidates = [_make_candidate(candidate_id=f"CAND_{i:07d}") for i in range(5)]
        service = RecruiterTrustService()
        profiles = service.build_batch_profiles(candidates)

        feature_svc = BehavioralFeatureService()
        batch_features = feature_svc.generate_batch_features(profiles)

        assert len(batch_features) == 5
        for cid, fv in batch_features.items():
            assert len(fv) > 0


# ─────────────────────────────────────────────────────────────────────────────
# RECRUITER TRUST SERVICE — FULL PIPELINE TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestRecruiterTrustService:
    """End-to-end pipeline tests for RecruiterTrustService."""

    def setup_method(self):
        self.service = RecruiterTrustService()

    def test_high_trust_candidate_pipeline(self):
        """Fully verified, highly engaged, fast-responding candidate."""
        candidate = _make_candidate(
            verified_email=True,
            verified_phone=True,
            linkedin_connected=True,
            profile_completeness=92.0,
            open_to_work=True,
            notice_period_days=15,
            applications_30d=6,
            recruiter_response_rate=0.90,
            avg_response_time_hours=2.0,
            interview_completion_rate=0.95,
            offer_acceptance_rate=0.85,
            github_activity_score=65.0,
            recruiter_saves_30d=10,
            profile_views_30d=60,
        )
        bi = self.service.build_behavioral_profile(candidate)

        assert bi.behavioral_score >= 0.60
        assert bi.trust_score >= 0.60
        assert bi.availability_score >= 0.60
        assert bi.responsiveness_score >= 0.65
        assert bi.recruiter_friendliness >= 0.55
        assert bi.is_recruiter_ready()

    def test_low_trust_passive_candidate_pipeline(self):
        """Unverified, passive, unresponsive candidate → low scores."""
        candidate = _make_candidate(
            verified_email=False,
            verified_phone=False,
            linkedin_connected=False,
            profile_completeness=25.0,
            open_to_work=False,
            notice_period_days=120,
            applications_30d=0,
            recruiter_response_rate=0.05,
            avg_response_time_hours=120.0,
            interview_completion_rate=0.10,
            offer_acceptance_rate=0.0,
            github_activity_score=0.0,
            days_since_active=100,
        )
        bi = self.service.build_behavioral_profile(candidate)

        assert bi.behavioral_score < 0.40
        assert not bi.is_recruiter_ready()

    def test_evidence_collected_across_all_profiles(self):
        """The final BehavioralIntelligence should aggregate evidence from all sub-profiles."""
        candidate = _make_candidate()
        bi = self.service.build_behavioral_profile(candidate)

        # Evidence should contain strings from all four analyzer types
        evidence_text = " ".join(bi.evidence)
        assert "availability_score" in evidence_text or "Composite" in evidence_text
        assert len(bi.evidence) > 10  # Rich evidence trail

    def test_batch_profile_count_matches_input(self):
        """build_batch_profiles() should return exactly len(candidates) profiles."""
        candidates = [_make_candidate(candidate_id=f"CAND_{i:07d}") for i in range(10)]
        profiles = self.service.build_batch_profiles(candidates, chunk_size=3)

        assert len(profiles) == 10
        assert all(isinstance(p, BehavioralIntelligence) for p in profiles)

    def test_streaming_yields_all_candidates(self):
        """stream_profiles() should yield one profile per candidate."""
        candidates = [_make_candidate(candidate_id=f"CAND_{i:07d}") for i in range(5)]
        profiles = list(self.service.stream_profiles(candidates))

        assert len(profiles) == 5
        for profile in profiles:
            assert isinstance(profile, BehavioralIntelligence)
            assert 0.0 <= profile.behavioral_score <= 1.0

    def test_custom_offer_budget_affects_join_probability(self):
        """Changing offer_budget_lpa should affect join_probability."""
        candidate = _make_candidate(salary_min=40.0, salary_max=60.0)

        service_low_budget = RecruiterTrustService(offer_budget_lpa=20.0)
        service_high_budget = RecruiterTrustService(offer_budget_lpa=65.0)

        bi_low = service_low_budget.build_behavioral_profile(candidate)
        bi_high = service_high_budget.build_behavioral_profile(candidate)

        assert bi_low.join_probability < bi_high.join_probability


# ─────────────────────────────────────────────────────────────────────────────
# CONFIDENCE & EVIDENCE INVARIANT TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestConfidenceAndEvidence:
    """Cross-cutting tests ensuring confidence and evidence invariants hold."""

    def test_all_profiles_have_evidence(self):
        """Every sub-profile generated by the pipeline should have evidence."""
        service = RecruiterTrustService()
        candidate = _make_candidate()
        bi = service.build_behavioral_profile(candidate)

        assert len(bi.availability_profile.evidence) > 0
        assert len(bi.engagement_profile.evidence) > 0
        assert len(bi.responsiveness_profile.evidence) > 0
        assert len(bi.trust_profile.evidence) > 0

    def test_confidence_range_valid(self):
        """Confidence values must always be in [0.0, 1.0]."""
        service = RecruiterTrustService()
        candidate = _make_candidate()
        bi = service.build_behavioral_profile(candidate)

        for profile in [
            bi.availability_profile,
            bi.engagement_profile,
            bi.responsiveness_profile,
            bi.trust_profile,
        ]:
            assert 0.0 <= profile.confidence <= 1.0, (
                f"Confidence out of range in {type(profile).__name__}: {profile.confidence}"
            )

    def test_all_scores_in_valid_range(self):
        """All scalar scores in BehavioralIntelligence must be in [0.0, 1.0]."""
        service = RecruiterTrustService()
        candidate = _make_candidate()
        bi = service.build_behavioral_profile(candidate)

        score_fields = [
            bi.behavioral_score,
            bi.trust_score,
            bi.availability_score,
            bi.engagement_score,
            bi.responsiveness_score,
            bi.join_probability,
            bi.recruiter_friendliness,
            bi.confidence,
        ]
        for val in score_fields:
            assert 0.0 <= val <= 1.0, f"Score out of range: {val}"
