"""Recruiter Reasoning service — Phase 13: Final Recruiter Ranking Engine.

Evaluates rules and captures the recruiter reasoning trace for a candidate.
"""

from typing import Dict, List, Any
from models.candidate import Candidate
from models.parsed_jd import ParsedJD
from models.feature_vector import FeatureVector
from models.behavioral_intelligence import BehavioralIntelligence
from models.reliability_profile import ReliabilityProfile
from models.ranking_score import RankingScore
from models.recruiter_reasoning_trace import RecruiterReasoningTrace


class RecruiterReasoning:
    """Computes rule evaluations and compiles recruiter decision traces."""

    @staticmethod
    def capture_trace(
        candidate: Candidate,
        parsed_jd: ParsedJD,
        feature_vector: FeatureVector,
        behavioral_intel: BehavioralIntelligence,
        reliability_profile: ReliabilityProfile,
        score: RankingScore,
    ) -> RecruiterReasoningTrace:
        """Evaluates matching rules and compiles a reasoning trace.

        Args:
            candidate: Candidate aggregate.
            parsed_jd: Parsed Job Description.
            feature_vector: Feature vector containing signal scores.
            behavioral_intel: Behavioral intelligence profile.
            reliability_profile: Reliability profile.
            score: Computed final score details.

        Returns:
            RecruiterReasoningTrace: Step-by-step log and rule triggers.
        """
        candidate_id = candidate.candidate_id
        rule_evaluations: List[Dict[str, Any]] = []
        decision_steps: List[str] = []

        # Step 1: Experience Rule
        exp_min, exp_max = parsed_jd.experience_range
        cand_exp = candidate.total_years_experience
        exp_ok = exp_min <= cand_exp <= exp_max
        rule_evaluations.append({
            "rule_name": "Experience Range Check",
            "passed": exp_ok,
            "details": f"Candidate experience: {cand_exp:.1f} years. Required: [{exp_min:.1f}, {exp_max:.1f}] years.",
            "impact_on_score": 0.0 if exp_ok else -0.05,
        })
        decision_steps.append(
            f"Checked total experience: candidate has {cand_exp:.1f} years (required {exp_min}-{exp_max} years)."
        )

        # Step 2: Critical/Must-Have Skill Check
        jd_skills = parsed_jd.get_required_skills()
        cand_skills = {s.name.lower() for s in candidate.skills}
        matching_jd_skills = [s for s in jd_skills if s.lower() in cand_skills]
        skills_percent = len(matching_jd_skills) / len(jd_skills) if jd_skills else 1.0
        skills_ok = skills_percent >= 0.6
        rule_evaluations.append({
            "rule_name": "Must-Have Skill Coverage",
            "passed": skills_ok,
            "details": f"Candidate has {len(matching_jd_skills)} out of {len(jd_skills)} required JD skills.",
            "impact_on_score": 0.0 if skills_ok else -0.10,
        })
        decision_steps.append(
            f"Analyzed skill coverage: found {len(matching_jd_skills)} of {len(jd_skills)} must-have requirements."
        )

        # Step 3: Location Compatibility
        loc_ok = parsed_jd.is_location_compatible(candidate.profile.location)
        rule_evaluations.append({
            "rule_name": "Location Compatibility Check",
            "passed": loc_ok,
            "details": f"Candidate location: '{candidate.profile.location}'. Preferred: {parsed_jd.location_preferences or 'Any'}",
            "impact_on_score": 0.0 if loc_ok else -0.05,
        })
        decision_steps.append(
            f"Evaluated geographic compatibility for candidate location '{candidate.profile.location}'."
        )

        # Step 4: Reliability and Fraud Risk Check
        reliability_ok = reliability_profile.reliability_score >= 0.70
        rule_evaluations.append({
            "rule_name": "Profile Reliability Check",
            "passed": reliability_ok,
            "details": f"Reliability score is {reliability_profile.reliability_score:.2f} (Quality: {reliability_profile.quality_score:.2f}, Fraud risk: {reliability_profile.fraud_profile.overall_fraud_risk:.2f}).",
            "impact_on_score": 0.0 if reliability_ok else -0.15,
        })
        decision_steps.append(
            f"Checked profile reliability: score is {reliability_profile.reliability_score:.2f}. "
            f"Detected {reliability_profile.anomaly_profile.anomaly_count} anomalies."
        )

        # Capture raw signals snapshot for audit
        raw_signals = {
            "candidate_experience_years": cand_exp,
            "matching_skills_count": len(matching_jd_skills),
            "profile_completeness_percent": candidate.redrob_signals.profile_completeness_score,
            "days_since_active": candidate.redrob_signals.days_since_last_active(),
            "notice_period_days": candidate.redrob_signals.notice_period_days,
            "average_tenure_years": candidate.average_tenure,
            "anomaly_count": reliability_profile.anomaly_profile.anomaly_count,
            "overall_fraud_risk": reliability_profile.fraud_profile.overall_fraud_risk,
        }

        # Final adjustments dictionary
        final_adjustments = {
            "total_bonus": score.total_bonus,
            "total_penalty": score.total_penalty,
            "reliability_multiplier": score.reliability_score,
            "final_calibrated_score": score.final_score,
        }

        decision_steps.append(
            f"Applied final scoring calibration. Composite score: {score.final_score:.4f}."
        )

        return RecruiterReasoningTrace(
            candidate_id=candidate_id,
            rule_evaluations=rule_evaluations,
            raw_signals_captured=raw_signals,
            decision_steps=decision_steps,
            final_adjustments=final_adjustments,
        )
