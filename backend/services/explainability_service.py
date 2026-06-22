"""Explainability Service — Phase 14: Production API & Recruiter Suite.

Generates structured, fact-grounded recruiter fit explanation reports.
"""

from datetime import datetime
from typing import List, Dict, Any
from models.candidate import Candidate
from models.parsed_jd import ParsedJD
from models.ranking_score import RankingScore
from models.recruiter_reasoning_trace import RecruiterReasoningTrace
from models.explanation_report import ExplanationReport


class ExplainabilityService:
    """Generates detailed, audited explainability reports for candidates."""

    @staticmethod
    def generate_report(
        candidate: Candidate,
        parsed_jd: ParsedJD,
        score: RankingScore,
        trace: RecruiterReasoningTrace,
    ) -> ExplanationReport:
        """Assembles a structured explanation report for a single candidate.

        Args:
            candidate: Candidate aggregate.
            parsed_jd: Job description specification.
            score: Ranking score detail.
            trace: Recruiter reasoning trace log.

        Returns:
            ExplanationReport: Structured recruiter review payload.
        """
        # 1. Map core requirements match
        jd_skills = parsed_jd.must_have
        cand_skills_lower = {s.name.lower() for s in candidate.skills}

        matched_reqs: List[Dict[str, Any]] = []
        missing_reqs: List[str] = []

        for req in jd_skills:
            matched = req.name.lower() in cand_skills_lower
            matched_reqs.append({
                "name": req.name,
                "matched": matched,
                "importance": getattr(req.importance, "value", str(req.importance)),
            })
            if not matched:
                missing_reqs.append(req.name)

        # 2. Extract strengths and weaknesses
        # Clean clean tags from bonuses/penalties to display on UI
        strengths = [s.split(" (+")[0] for s in score.bonuses_applied]
        weaknesses = [p.split(" (-")[0] for p in score.penalties_applied]

        # 3. Assemble category-level factual evidence highlights
        career_highlights = [
            f"Brings {candidate.total_years_experience:.1f} total years of professional experience.",
            f"Currently holds the title '{candidate.profile.current_title}' at '{candidate.profile.current_company}'.",
            f"Maintains an average tenure of {candidate.average_tenure:.1f} years per role.",
        ]

        behavioral_highlights = [
            f"Notice period: {candidate.redrob_signals.notice_period_days} days.",
            f"Interview completion rate: {candidate.redrob_signals.interview_completion_rate * 100:.0f}%.",
            f"Preferred work mode: {candidate.redrob_signals.preferred_work_mode}.",
        ]

        trust_highlights = [
            f"Profile verification score: {candidate.redrob_signals.profile_completeness_score:.0f}%.",
            f"Verified contact info: Email={'Yes' if candidate.redrob_signals.verified_email else 'No'}, Phone={'Yes' if candidate.redrob_signals.verified_phone else 'No'}.",
            f"Reliability multiplier: {score.reliability_score:.2f}.",
        ]

        evidence = {
            "career": career_highlights,
            "behavioral": behavioral_highlights,
            "trust": trust_highlights,
        }

        # 4. Generate fit verdict
        fit_verdict = "Backup / Low Match"
        if score.final_score >= 0.75:
            fit_verdict = "Strong Match"
        elif score.final_score >= 0.55:
            fit_verdict = "Good Match"
        elif score.final_score >= 0.40:
            fit_verdict = "Backup candidate"

        # 5. Formulate summary paragraph
        summary = (
            f"Candidate has been ranked as a '{fit_verdict}' for the '{parsed_jd.job_title}' role "
            f"with a final calibrated score of {score.final_score:.2f} and a ranking confidence "
            f"of {score.confidence * 100:.0f}%. "
        )

        if strengths:
            summary += f"Key highlights: {strengths[0]}."
        if missing_reqs:
            summary += f" Main gaps to address: missing {', '.join(missing_reqs[:2])}."

        return ExplanationReport(
            candidate_id=candidate.candidate_id,
            fit_verdict=fit_verdict,
            summary=summary,
            strengths=strengths,
            weaknesses=weaknesses,
            matched_requirements=matched_reqs,
            missing_requirements=missing_reqs,
            evidence=evidence,
            generated_at=datetime.utcnow().isoformat(),
        )
