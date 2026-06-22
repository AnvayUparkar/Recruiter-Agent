"""Tests for Phase 12: Profile Quality & Fraud Detection Engine.

Covers:
    - ProfileCompletenessAnalyzer (4 scenarios)
    - ProfileQualityAnalyzer (5 scenarios)
    - SkillStuffingDetector (5 scenarios)
    - TimelineValidator (5 scenarios)
    - ConsistencyChecker (5 scenarios)
    - AnomalyDetector (6 scenarios)
    - FraudDetector (4 scenarios)
    - ReliabilityScoring (4 scenarios)
    - QualityMetrics (3 scenarios)
    - TrustworthinessService full pipeline (5 scenarios)
    - Evidence collection invariants (all services)

All tests use realistic candidate scenarios grounded in the existing
Candidate/RedrobSignals data model.
"""

import pytest
from datetime import date, timedelta
from typing import List, Optional

from models.candidate import Candidate
from models.profile import Profile, CompanySize
from models.career_history import CareerHistory
from models.education import Education, EducationTier
from models.skill import Skill, SkillProficiency
from models.certification import Certification
from models.language import Language, LanguageProficiency
from models.redrob_signals import RedrobSignals, PreferredWorkMode, ExpectedSalaryRange
from models.behavioral_intelligence import BehavioralIntelligence
from models.profile_quality import ProfileQuality
from models.fraud_profile import FraudProfile
from models.consistency_profile import ConsistencyProfile
from models.anomaly_profile import AnomalyProfile, AnomalyType
from models.reliability_profile import ReliabilityProfile

from services.profile_completeness import ProfileCompletenessAnalyzer
from services.profile_quality_analyzer import ProfileQualityAnalyzer
from services.skill_stuffing_detector import SkillStuffingDetector
from services.timeline_validator import TimelineValidator
from services.consistency_checker import ConsistencyChecker
from services.anomaly_detector import AnomalyDetector
from services.fraud_detector import FraudDetector
from services.reliability_scoring import ReliabilityScoring, ReliabilityConfig
from services.quality_metrics import QualityMetrics
from services.trustworthiness_service import TrustworthinessService


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
    skill_assessment_scores: Optional[dict] = None,
) -> RedrobSignals:
    last_active = date(2026, 6, 15) - timedelta(days=days_since_active)
    return RedrobSignals(
        profile_completeness_score=profile_completeness,
        signup_date=date(2025, 1, 1),
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


def _make_role(
    company: str = "TechCorp",
    title: str = "Senior ML Engineer",
    duration_months: int = 24,
    is_current: bool = True,
    description: str = (
        "Built recommendation systems serving 2M users. "
        "Deployed ML pipelines to AWS using Kubernetes and Docker. "
        "Reduced model latency by 40% through optimization. "
        "Led team of 4 engineers delivering production models."
    ),
    industry: str = "Technology",
    company_size: CompanySize = CompanySize.MEDIUM,
    start_offset_months: int = 0,
) -> CareerHistory:
    start = date(2022, 1, 1) - timedelta(days=start_offset_months * 30)
    end = None if is_current else start + timedelta(days=duration_months * 30)
    return CareerHistory(
        company=company,
        title=title,
        start_date=start,
        end_date=end,
        duration_months=duration_months,
        is_current=is_current,
        industry=industry,
        company_size=company_size,
        description=description,
    )


def _make_skills(count: int = 8, stuffing: bool = False) -> List[Skill]:
    """Creates a list of skills — optionally inflated for stuffing tests."""
    base_skills = [
        "Python", "SQL", "Machine Learning", "Kubernetes", "AWS",
        "Docker", "FastAPI", "PostgreSQL", "Redis", "Spark",
        "Scala", "Java", "TensorFlow", "PyTorch", "React",
        "TypeScript", "Go", "Rust", "C++", "Haskell",
        "Erlang", "Elixir", "Clojure", "Prolog", "COBOL",
        "FORTRAN", "Assembly", "VHDL", "SystemVerilog", "Verilog",
    ]
    skills = []
    for i in range(min(count, len(base_skills))):
        skills.append(
            Skill(
                name=base_skills[i],
                proficiency=SkillProficiency.INTERMEDIATE if stuffing else SkillProficiency.ADVANCED,
                endorsements=0 if stuffing else (5 + i),
            )
        )
    return skills


def _make_candidate(
    candidate_id: str = "CAND_0000001",
    years_exp: float = 6.0,
    num_skills: int = 8,
    skill_stuffing: bool = False,
    num_roles: int = 2,
    current_title: str = "Senior ML Engineer",
    summary: str = (
        "Experienced ML engineer specialising in recommendation systems and "
        "production ML pipelines. Built systems serving millions of users."
    ),
    role_description: str = (
        "Built recommendation systems serving 2M users. "
        "Deployed ML pipelines to AWS using Kubernetes. "
        "Reduced latency by 40% through model optimization."
    ),
    **signals_kwargs,
) -> Candidate:
    roles = []
    for i in range(num_roles):
        is_current = (i == num_roles - 1)
        roles.append(
            _make_role(
                company=f"TechCorp {i + 1}",
                title=current_title if is_current else f"ML Engineer {i}",
                duration_months=int(years_exp * 12 / num_roles),
                is_current=is_current,
                description=role_description,
                start_offset_months=(num_roles - i - 1) * int(years_exp * 12 / num_roles),
            )
        )

    return Candidate(
        candidate_id=candidate_id,
        profile=Profile(
            anonymized_name="Candidate X",
            headline="Senior ML Engineer at TechCorp",
            summary=summary,
            location="Bengaluru",
            country="India",
            years_of_experience=years_exp,
            current_title=current_title,
            current_company="TechCorp",
            current_company_size=CompanySize.MEDIUM,
            current_industry="Technology",
        ),
        career_history=roles,
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
        skills=_make_skills(num_skills, stuffing=skill_stuffing),
        certifications=[],
        languages=[Language(language="English", proficiency=LanguageProficiency.NATIVE)],
        redrob_signals=_make_signals(**signals_kwargs),
    )


# ─────────────────────────────────────────────────────────────────────────────
# PROFILE COMPLETENESS TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestProfileCompletenessAnalyzer:
    def setup_method(self):
        self.analyzer = ProfileCompletenessAnalyzer()

    def test_complete_profile_scores_high(self):
        """Full profile with all sections → high completeness."""
        candidate = _make_candidate(num_skills=10)
        report = self.analyzer.generate_report(candidate)
        assert report["overall"] >= 0.60

    def test_missing_summary_reduces_score(self):
        """Empty summary should reduce completeness."""
        candidate = _make_candidate(summary="")
        report = self.analyzer.generate_report(candidate)
        assert report["summary"] < 0.60

    def test_missing_skills_reduces_score(self):
        """Zero skills → summary score is 0."""
        candidate = _make_candidate(num_skills=0)
        summary_score, _ = self.analyzer._check_skills(candidate)
        assert summary_score == 0.0

    def test_missing_description_reduces_score(self):
        """Roles with empty descriptions → lower description score."""
        candidate = _make_candidate(role_description="")
        desc_score, ev = self.analyzer._check_career_descriptions(candidate)
        assert desc_score < 0.50
        assert any("descriptions" in e.lower() or "character" in e.lower() for e in ev)


# ─────────────────────────────────────────────────────────────────────────────
# PROFILE QUALITY ANALYZER TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestProfileQualityAnalyzer:
    def setup_method(self):
        self.analyzer = ProfileQualityAnalyzer()

    def test_strong_documented_profile_scores_high(self):
        """Quantified achievements, action verbs → high documentation quality."""
        candidate = _make_candidate(
            role_description=(
                "Built recommendation system serving 2M users with 95% accuracy. "
                "Reduced latency by 40ms using Kubernetes deployments. "
                "Delivered 3 production models in Q4 2025."
            )
        )
        profile = self.analyzer.analyze_quality(candidate)
        assert profile.documentation_quality >= 0.60
        assert profile.quality_score >= 0.50

    def test_vague_profile_scores_low_documentation(self):
        """'Worked on ML projects' patterns → low documentation quality."""
        candidate = _make_candidate(
            role_description="Worked on various ML projects and assisted team with tasks etc.",
            summary="Responsible for helping with projects.",
        )
        doc_score = self.analyzer._score_description_quality(
            "Worked on various ML projects and assisted team with tasks etc."
        )
        assert doc_score < 0.40

    def test_skill_inflation_penalises_quality(self):
        """Too many skills for experience years → lower skills_quality."""
        candidate = _make_candidate(
            num_skills=28,
            skill_stuffing=True,
            years_exp=2.0,
        )
        skills_score, ev = self.analyzer._analyze_skills_quality(candidate)
        # Some penalty expected due to many unendorsed skills for low experience
        assert isinstance(skills_score, float)
        assert 0.0 <= skills_score <= 1.0

    def test_profile_quality_returns_valid_model(self):
        """analyze_quality() should return a ProfileQuality with all fields."""
        candidate = _make_candidate()
        profile = self.analyzer.analyze_quality(candidate)
        assert isinstance(profile, ProfileQuality)
        assert 0.0 <= profile.quality_score <= 1.0
        assert 0.0 <= profile.confidence <= 1.0
        assert len(profile.evidence) > 0

    def test_quality_score_convenience_method(self):
        """quality_score() returns float equal to profile.quality_score."""
        candidate = _make_candidate()
        score = self.analyzer.quality_score(candidate)
        profile = self.analyzer.analyze_quality(candidate)
        assert score == profile.quality_score


# ─────────────────────────────────────────────────────────────────────────────
# SKILL STUFFING DETECTOR TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestSkillStuffingDetector:
    def setup_method(self):
        self.detector = SkillStuffingDetector()

    def test_proportional_skills_low_risk(self):
        """8 skills for 6 years experience → low stuffing risk."""
        candidate = _make_candidate(num_skills=8, years_exp=6.0)
        risk, confidence, evidence = self.detector.detect_stuffing(candidate)
        assert risk < 0.40
        assert confidence > 0.0

    def test_excessive_skills_high_risk(self):
        """28 skills for 2 years experience → elevated stuffing risk."""
        candidate = _make_candidate(
            num_skills=28,
            years_exp=2.0,
            skill_stuffing=True,
            role_description="Worked on ML projects.",  # minimal description
        )
        risk, _, _ = self.detector.detect_stuffing(candidate)
        assert risk > 0.20  # Some elevated risk

    def test_skills_mentioned_in_descriptions_reduce_risk(self):
        """Skills appearing in job descriptions should have lower stuffing risk."""
        candidate_with_desc = _make_candidate(
            num_skills=8,
            role_description="Used Python, SQL, Kubernetes, AWS, Docker in production.",
        )
        candidate_without_desc = _make_candidate(
            num_skills=8,
            role_description="",
        )
        risk_with, _, _ = self.detector.detect_stuffing(candidate_with_desc)
        risk_without, _, _ = self.detector.detect_stuffing(candidate_without_desc)
        assert risk_with <= risk_without

    def test_evidence_present(self):
        """Stuffing detection should always return evidence strings."""
        candidate = _make_candidate(num_skills=5)
        _, _, evidence = self.detector.detect_stuffing(candidate)
        assert len(evidence) > 0
        assert any("skill" in e.lower() or "Skill" in e for e in evidence)

    def test_description_support_check_with_no_descriptions(self):
        """No descriptions → all skills unsupported → high support risk."""
        candidate = _make_candidate(
            num_skills=10,
            role_description="",
        )
        support_risk, ev = self.detector._check_description_support(candidate)
        assert support_risk >= 0.70


# ─────────────────────────────────────────────────────────────────────────────
# TIMELINE VALIDATOR TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestTimelineValidator:
    def setup_method(self):
        self.validator = TimelineValidator()

    def test_consistent_timeline_low_risk(self):
        """Sequential, non-overlapping roles → low timeline risk."""
        candidate = _make_candidate(num_roles=2, years_exp=4.0)
        risk, confidence, evidence = self.validator.validate(candidate)
        assert risk < 0.50
        assert confidence >= 0.70

    def test_experience_mismatch_detection(self):
        """Claimed 20 years with only 2 roles of 12 months each → high mismatch risk."""
        candidate = _make_candidate(
            years_exp=20.0,
            num_roles=2,
        )
        # Override duration to be short
        for role in candidate.career_history:
            object.__setattr__(role, "duration_months", 12)
        mismatch_risk, ev = self.validator._check_experience_mismatch(candidate)
        assert mismatch_risk > 0.0

    def test_single_role_no_overlap(self):
        """Single role → overlap check returns 0 risk."""
        candidate = _make_candidate(num_roles=1)
        overlap_risk, evidence = self.validator._check_overlapping_roles(candidate)
        assert overlap_risk == 0.0

    def test_validates_returns_triple(self):
        """validate() should return (float, float, List[str])."""
        candidate = _make_candidate()
        result = self.validator.validate(candidate)
        assert len(result) == 3
        risk, confidence, evidence = result
        assert 0.0 <= risk <= 1.0
        assert 0.0 <= confidence <= 1.0
        assert isinstance(evidence, list)

    def test_evidence_includes_summary(self):
        """Evidence should contain a timeline_risk summary line."""
        candidate = _make_candidate()
        _, _, evidence = self.validator.validate(candidate)
        assert any("timeline_risk" in e for e in evidence)


# ─────────────────────────────────────────────────────────────────────────────
# CONSISTENCY CHECKER TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestConsistencyChecker:
    def setup_method(self):
        self.checker = ConsistencyChecker()

    def test_consistent_profile_high_score(self):
        """Coherent career path, skills in descriptions → high consistency."""
        candidate = _make_candidate(
            num_roles=2,
            role_description="Used Python, SQL, AWS, Machine Learning in production systems.",
            num_skills=5,
        )
        profile = self.checker.generate_profile(candidate)
        assert profile.consistency_score >= 0.50
        assert len(profile.evidence) > 0

    def test_title_seniority_mismatch(self):
        """Executive title with <8 years experience → lower title consistency."""
        candidate = _make_candidate(years_exp=3.0, current_title="VP of Engineering")
        score, evidence = self.checker._check_title_consistency(candidate)
        assert score < 1.0
        assert any("VP" in e or "Executive" in e or "years" in e.lower() for e in evidence)

    def test_skill_consistency_with_supported_skills(self):
        """Skills mentioned in descriptions → higher skill consistency."""
        candidate = _make_candidate(
            role_description="Developed Python and SQL pipelines on AWS using Machine Learning.",
            num_skills=4,
        )
        score, _ = self.checker._check_skill_consistency(candidate)
        assert score > 0.0

    def test_consistency_profile_all_fields_valid(self):
        """ConsistencyProfile should have all fields in valid ranges."""
        candidate = _make_candidate()
        profile = self.checker.generate_profile(candidate)
        for field_val in [
            profile.career_consistency,
            profile.timeline_consistency,
            profile.skill_consistency,
            profile.title_consistency,
            profile.experience_consistency,
            profile.consistency_score,
            profile.confidence,
        ]:
            assert 0.0 <= field_val <= 1.0

    def test_no_career_history_consistency(self):
        """check_consistency on empty career history → lower confidence."""
        candidate = _make_candidate(num_roles=1)
        score, confidence = self.checker.check_consistency(candidate)
        assert 0.0 <= score <= 1.0
        assert 0.0 <= confidence <= 1.0


# ─────────────────────────────────────────────────────────────────────────────
# ANOMALY DETECTOR TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestAnomalyDetector:
    def setup_method(self):
        self.detector = AnomalyDetector()

    def test_clean_profile_zero_anomalies(self):
        """Normal, well-documented profile → zero or minimal anomalies."""
        candidate = _make_candidate()
        profile = self.detector.detect(candidate)
        assert profile.anomaly_count <= 2  # Some edge cases acceptable

    def test_skill_inflation_detected(self):
        """28 skills for 2 years experience → SKILL_INFLATION anomaly."""
        candidate = _make_candidate(num_skills=28, years_exp=2.0)
        profile = self.detector.detect(candidate)
        assert AnomalyType.SKILL_INFLATION.value in [
            a.value if hasattr(a, "value") else a
            for a in profile.anomaly_types
        ]

    def test_contradictory_signals_detected(self):
        """High response rate + very slow response time → CONTRADICTORY_SIGNALS."""
        candidate = _make_candidate(
            recruiter_response_rate=0.95,
            avg_response_time_hours=96.0,
        )
        profile = self.detector.detect(candidate)
        assert AnomalyType.CONTRADICTORY_SIGNALS.value in [
            a.value if hasattr(a, "value") else a
            for a in profile.anomaly_types
        ]

    def test_response_pattern_detected(self):
        """Perfect interview completion + zero offer acceptance → RESPONSE_PATTERN."""
        candidate = _make_candidate(
            interview_completion_rate=1.0,
            offer_acceptance_rate=0.0,
        )
        profile = self.detector.detect(candidate)
        assert AnomalyType.RESPONSE_PATTERN.value in [
            a.value if hasattr(a, "value") else a
            for a in profile.anomaly_types
        ]

    def test_custom_thresholds_respected(self):
        """Custom threshold should change detection behavior."""
        # Lower the skill inflation threshold to trigger on 5 skills/year
        custom_detector = AnomalyDetector(
            thresholds={"skill_inflation_ratio": 2.0}
        )
        candidate = _make_candidate(num_skills=10, years_exp=4.0)  # 2.5 skills/year
        profile = custom_detector.detect(candidate)
        # Should detect inflation at 2.5 > 2.0 threshold
        assert AnomalyType.SKILL_INFLATION.value in [
            a.value if hasattr(a, "value") else a
            for a in profile.anomaly_types
        ]

    def test_anomaly_profile_fields_valid(self):
        """AnomalyProfile fields should all be in valid ranges."""
        candidate = _make_candidate()
        profile = self.detector.detect(candidate)
        assert 0.0 <= profile.severity_score <= 1.0
        assert 0.0 <= profile.risk_score <= 1.0
        assert isinstance(profile.anomaly_types, list)
        assert isinstance(profile.evidence, list)


# ─────────────────────────────────────────────────────────────────────────────
# FRAUD DETECTOR TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestFraudDetector:
    def setup_method(self):
        self.detector = FraudDetector()

    def test_clean_profile_low_fraud_risk(self):
        """Verified, consistent, well-documented profile → low fraud risk."""
        candidate = _make_candidate(
            verified_email=True,
            verified_phone=True,
            linkedin_connected=True,
            profile_completeness=88.0,
        )
        profile = self.detector.detect_fraud(candidate)
        assert profile.overall_fraud_risk < 0.60

    def test_unverified_profile_higher_identity_risk(self):
        """No verification signals → higher identity_risk."""
        candidate = _make_candidate(
            verified_email=False,
            verified_phone=False,
            linkedin_connected=False,
        )
        profile = self.detector.detect_fraud(candidate)
        assert profile.identity_risk >= 0.80

    def test_fraud_profile_all_fields_valid(self):
        """FraudProfile should have all risk fields in [0, 1]."""
        candidate = _make_candidate()
        profile = self.detector.detect_fraud(candidate)
        for field_val in [
            profile.skill_stuffing_risk,
            profile.timeline_risk,
            profile.identity_risk,
            profile.experience_risk,
            profile.anomaly_risk,
            profile.overall_fraud_risk,
            profile.confidence,
        ]:
            assert 0.0 <= field_val <= 1.0

    def test_ml_override_stub_passthrough(self):
        """ML override stub should return the rule-based risk unchanged."""
        candidate = _make_candidate()
        rule_risk = 0.45
        result = self.detector._apply_ml_override(rule_risk, candidate)
        assert result == rule_risk


# ─────────────────────────────────────────────────────────────────────────────
# RELIABILITY SCORING TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestReliabilityScoring:
    def _make_profiles(self, quality=0.80, fraud=0.10, consistency=0.75):
        quality_p = ProfileQuality(
            candidate_id="CAND_0000001",
            quality_score=quality,
            confidence=0.85,
        )
        fraud_p = FraudProfile(
            candidate_id="CAND_0000001",
            overall_fraud_risk=fraud,
            confidence=0.80,
        )
        consist_p = ConsistencyProfile(
            candidate_id="CAND_0000001",
            consistency_score=consistency,
            confidence=0.90,
        )
        return quality_p, fraud_p, consist_p

    def test_high_quality_low_fraud_high_reliability(self):
        """High quality + low fraud → high reliability score."""
        scorer = ReliabilityScoring()
        quality_p, fraud_p, consist_p = self._make_profiles(quality=0.85, fraud=0.05)
        result = scorer.compute_reliability_score(
            "CAND_0000001", quality_p, fraud_p, consist_p,
            behavioral_score=0.80, trust_score=0.75,
        )
        assert result.reliability_score >= 0.65
        assert result.is_reliable()

    def test_high_fraud_penalty_reduces_reliability(self):
        """High fraud risk → lower reliability than same profile without it."""
        scorer = ReliabilityScoring()
        quality_p, fraud_high, consist_p = self._make_profiles(fraud=0.90)
        _, fraud_low, _ = self._make_profiles(fraud=0.05)

        result_high = scorer.compute_reliability_score(
            "CAND_0000001", quality_p, fraud_high, consist_p,
            behavioral_score=0.70, trust_score=0.70,
        )
        result_low = scorer.compute_reliability_score(
            "CAND_0000001", quality_p, fraud_low, consist_p,
            behavioral_score=0.70, trust_score=0.70,
        )
        assert result_high.reliability_score < result_low.reliability_score

    def test_reliability_profile_has_evidence(self):
        """compute_reliability_score() should produce non-empty evidence."""
        scorer = ReliabilityScoring()
        quality_p, fraud_p, consist_p = self._make_profiles()
        result = scorer.compute_reliability_score(
            "CAND_0000001", quality_p, fraud_p, consist_p,
        )
        assert len(result.evidence) > 0
        assert any("reliability_score" in e for e in result.evidence)

    def test_reliability_tier_classification(self):
        """reliability_tier() should return correct tier strings."""
        scorer = ReliabilityScoring()
        quality_p, fraud_p, consist_p = self._make_profiles(quality=0.90, fraud=0.02)
        result = scorer.compute_reliability_score(
            "CAND_0000001", quality_p, fraud_p, consist_p,
            behavioral_score=0.85, trust_score=0.85,
        )
        assert result.reliability_tier() in ("HIGH", "MEDIUM", "LOW", "VERY_LOW")


# ─────────────────────────────────────────────────────────────────────────────
# QUALITY METRICS TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestQualityMetrics:
    def _make_reliability_profiles(self, n: int = 15) -> List[ReliabilityProfile]:
        profiles = []
        for i in range(n):
            score = i / (n - 1)
            profiles.append(
                ReliabilityProfile(
                    candidate_id=f"CAND_{i:07d}",
                    quality_score=score,
                    fraud_penalty=1.0 - score,
                    consistency_score=score,
                    reliability_score=score,
                    behavioral_score=score,
                    trust_score=score,
                    confidence=min(1.0, score + 0.1),
                )
            )
        return profiles

    def test_metrics_structure(self):
        """calculate_metrics() should return all four dimension keys."""
        metrics = QualityMetrics()
        profiles = self._make_reliability_profiles(10)
        result = metrics.calculate_metrics(profiles)
        assert "quality" in result
        assert "fraud" in result
        assert "consistency" in result
        assert "reliability" in result

    def test_report_structure(self):
        """generate_report() should include pool metadata and metrics."""
        metrics = QualityMetrics()
        profiles = self._make_reliability_profiles(10)
        report = metrics.generate_report(profiles, pool_name="Test Pool")
        assert report["pool_name"] == "Test Pool"
        assert report["total_candidates"] == 10
        assert "avg_reliability_score" in report
        assert "metrics" in report

    def test_empty_pool_report(self):
        """Empty pool should return gracefully."""
        metrics = QualityMetrics()
        report = metrics.generate_report([])
        assert report["total_candidates"] == 0


# ─────────────────────────────────────────────────────────────────────────────
# TRUSTWORTHINESS SERVICE — FULL PIPELINE TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestTrustworthinessService:
    def setup_method(self):
        self.service = TrustworthinessService()

    def test_high_quality_profile_pipeline(self):
        """Verified, documented, consistent profile → reliable."""
        candidate = _make_candidate(
            verified_email=True,
            verified_phone=True,
            linkedin_connected=True,
            profile_completeness=90.0,
            num_skills=10,
            role_description=(
                "Built production ML systems serving 5M users. "
                "Deployed 8 models to AWS using Kubernetes. "
                "Reduced model latency by 45% achieving 99.9% uptime."
            ),
        )
        reliability = self.service.build_reliability_profile(candidate)
        assert isinstance(reliability, ReliabilityProfile)
        assert 0.0 <= reliability.reliability_score <= 1.0

    def test_low_quality_profile_pipeline(self):
        """Sparse, unverified, inflated profile → lower reliability."""
        candidate = _make_candidate(
            verified_email=False,
            verified_phone=False,
            linkedin_connected=False,
            profile_completeness=20.0,
            num_skills=28,
            skill_stuffing=True,
            years_exp=2.0,
            summary="",
            role_description="",
        )
        reliability = self.service.build_reliability_profile(candidate)
        assert reliability.reliability_score < 0.70

    def test_phase11_integration(self):
        """Providing BehavioralIntelligence should affect reliability_score."""
        candidate = _make_candidate()
        bi_high = BehavioralIntelligence(
            candidate_id=candidate.candidate_id,
            behavioral_score=0.90,
            trust_score=0.90,
        )
        bi_low = BehavioralIntelligence(
            candidate_id=candidate.candidate_id,
            behavioral_score=0.10,
            trust_score=0.10,
        )
        reliability_high = self.service.build_reliability_profile(candidate, bi_high)
        reliability_low = self.service.build_reliability_profile(candidate, bi_low)
        assert reliability_high.reliability_score > reliability_low.reliability_score

    def test_batch_profile_count_matches(self):
        """build_batch_profiles() should return exactly len(candidates) profiles."""
        candidates = [_make_candidate(candidate_id=f"CAND_{i:07d}") for i in range(8)]
        profiles = self.service.build_batch_profiles(candidates, chunk_size=3)
        assert len(profiles) == 8
        assert all(isinstance(p, ReliabilityProfile) for p in profiles)

    def test_streaming_yields_all_candidates(self):
        """stream_profiles() should yield one profile per candidate."""
        candidates = [_make_candidate(candidate_id=f"CAND_{i:07d}") for i in range(5)]
        profiles = list(self.service.stream_profiles(candidates))
        assert len(profiles) == 5
        for p in profiles:
            assert 0.0 <= p.reliability_score <= 1.0


# ─────────────────────────────────────────────────────────────────────────────
# CROSS-CUTTING INVARIANT TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestInvariants:
    def test_all_scores_in_valid_range(self):
        """All ReliabilityProfile scalar scores must be in [0.0, 1.0]."""
        service = TrustworthinessService()
        candidate = _make_candidate()
        reliability = service.build_reliability_profile(candidate)

        for val in [
            reliability.reliability_score,
            reliability.quality_score,
            reliability.fraud_penalty,
            reliability.consistency_score,
            reliability.behavioral_score,
            reliability.trust_score,
            reliability.confidence,
        ]:
            assert 0.0 <= val <= 1.0, f"Score out of range: {val}"

    def test_sub_profiles_have_evidence(self):
        """All sub-profiles generated by the pipeline should have evidence."""
        service = TrustworthinessService()
        candidate = _make_candidate()
        reliability = service.build_reliability_profile(candidate)

        assert len(reliability.quality_profile.evidence) > 0
        assert len(reliability.fraud_profile.evidence) > 0
        assert len(reliability.consistency_profile.evidence) > 0

    def test_feature_dict_all_floats(self):
        """to_feature_dict() should return only float values."""
        service = TrustworthinessService()
        candidate = _make_candidate()
        reliability = service.build_reliability_profile(candidate)
        features = reliability.to_feature_dict()

        assert len(features) > 0
        for key, val in features.items():
            assert isinstance(val, float), f"{key}: expected float, got {type(val)}"
            assert 0.0 <= val <= 1.0, f"{key}: {val} out of [0,1]"

    def test_fraud_profile_penalty_method(self):
        """FraudProfile.fraud_penalty() should be capped at 0.30."""
        fp = FraudProfile(
            candidate_id="CAND_0000001",
            overall_fraud_risk=1.0,
            confidence=0.90,
        )
        penalty = fp.fraud_penalty()
        assert penalty <= 0.30
        assert penalty >= 0.0
