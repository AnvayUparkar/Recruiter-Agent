"""Ranking Explainer service — Phase 13: Final Recruiter Ranking Engine.

Generates structured natural-language explanations, listing strengths, gaps, and fit verdicts.
"""

from typing import List
from models.candidate import Candidate
from models.parsed_jd import ParsedJD
from models.ranking_score import RankingScore
from models.recruiter_reasoning_trace import RecruiterReasoningTrace
from models.ranking_explanation import RankingExplanation


class RankingExplainer:
    """Generates natural language explanations of a candidate's fit profile."""

    @staticmethod
    def generate_explanation(
        candidate: Candidate,
        parsed_jd: ParsedJD,
        score: RankingScore,
        trace: RecruiterReasoningTrace,
    ) -> RankingExplanation:
        """Constructs strengths, gaps, fit verdict, and summary.

        Args:
            candidate: Candidate aggregate.
            parsed_jd: Parsed Job Description.
            score: Ranking score outputs.
            trace: Recruiter reasoning trace log.

        Returns:
            RankingExplanation: Structured text summary.
        """
        strengths: List[str] = []
        gaps: List[str] = []

        # ── 1. Identify Strengths ─────────────────────────────────────────────
        if score.technical_score >= 0.75:
            strengths.append(
                f"Exceptional technical depth (score: {score.technical_score:.2f}) aligned with JD stack."
            )
        if score.matching_score >= 0.75:
            strengths.append("High alignment on core job qualifications and requirements.")
        if score.behavioral_score >= 0.75:
            strengths.append("Strong engagement indicators and active platform responsiveness.")
        if score.reliability_score >= 0.85:
            strengths.append("highly credible and consistent profile history (no fraud risk).")

        # Must-have skill match checks
        jd_skills = parsed_jd.get_required_skills()
        cand_skills = {s.name.lower() for s in candidate.skills}
        matching_skills = [s for s in jd_skills if s.lower() in cand_skills]
        if len(matching_skills) >= 3:
            matched_list = ", ".join(matching_skills[:3])
            strengths.append(f"Possesses critical must-have skills: {matched_list}.")

        # Immediate joiner
        if candidate.redrob_signals.notice_period_days <= 15:
            strengths.append("Available to join immediately (notice period <= 15 days).")

        # Stable tenure
        if candidate.average_tenure >= 3.0:
            strengths.append(f"Demonstrates stable career tenure, averaging {candidate.average_tenure:.1f} years per role.")

        # Ensure we have at least one strength
        if not strengths:
            strengths.append("Meets baseline qualification criteria for the role.")

        # ── 2. Identify Gaps ────────────────────────────────────────────────
        missing_skills = [s for s in jd_skills if s.lower() not in cand_skills]
        if missing_skills:
            gaps.append(f"Missing must-have skills: {', '.join(missing_skills[:3])}.")

        # Experience check
        exp_min, exp_max = parsed_jd.experience_range
        cand_exp = candidate.total_years_experience
        if cand_exp < exp_min:
            gaps.append(
                f"Experience gap: candidate has {cand_exp:.1f} years, JD prefers a minimum of {exp_min:.1f} years."
            )
        elif cand_exp > exp_max + 5:
            gaps.append(
                f"Overqualified: candidate has {cand_exp:.1f} years of experience, exceeding JD range."
            )

        # Job hopping / Short tenure
        if candidate.average_tenure < 1.0 and candidate.average_tenure > 0:
            gaps.append("Short tenure history indicates high job-hopping risk.")

        # Timeline gap
        if score.reliability_score < 0.70:
            gaps.append("Timeline gaps or consistency risks detected in employment history.")

        # Notice period
        if candidate.redrob_signals.notice_period_days >= 60:
            gaps.append(f"Longer notice period ({candidate.redrob_signals.notice_period_days} days) may delay onboarding.")

        # Ensure we have at least one gap bullet or state none
        if not gaps:
            gaps.append("No critical gaps or mismatch signals detected.")

        # ── 3. Determine Fit Verdict ──────────────────────────────────────────
        score_val = score.final_score
        fraud_risk = trace.raw_signals_captured.get("overall_fraud_risk", 0.0)

        if score_val >= 0.75 and fraud_risk < 0.25:
            fit_verdict = "Strong Match"
        elif score_val >= 0.55 and fraud_risk < 0.40:
            fit_verdict = "Good Match"
        elif score_val >= 0.40 and fraud_risk < 0.50:
            fit_verdict = "Backup candidate"
        else:
            fit_verdict = "High Risk / Not Recommended"

        # ── 4. Formulate Summary Paragraph ────────────────────────────────────
        role = candidate.current_role or "Professional"
        summary = (
            f"Candidate is classified as a '{fit_verdict}' for the {parsed_jd.job_title} role. "
            f"They bring {cand_exp:.1f} years of experience as a {role}. "
        )

        if fit_verdict in ("Strong Match", "Good Match"):
            summary += (
                f"Their profile shows high matching alignment ({score.matching_score * 100:.0f}%) "
                f"and strong technical suitability. "
            )
            if strengths:
                summary += f"Strengths include: {strengths[0].lower()}"
        else:
            summary += (
                f"This recommendation is lowered due to specific match gaps or reliability concerns. "
            )
            if gaps:
                summary += f"Key risks to note: {gaps[0].lower()}"

        return RankingExplanation(
            summary=summary,
            strengths=strengths,
            gaps=gaps,
            fit_verdict=fit_verdict,
        )
