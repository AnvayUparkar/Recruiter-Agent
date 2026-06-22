"""Engagement Analyzer — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    Determines how visible and active a candidate is across the platform.
    Answers: "Is this candidate an active market participant, or a passive
    profile nobody sees?"

Signal Modeled:
    - Recruiter saves (passive market demand)
    - Profile views (platform visibility / discoverability)
    - Application activity (active job-search intent)
    - Search appearances (algorithmic discoverability)
    - Market/GitHub activity (external activity composite)

Phase 13 Ranking Usage:
    Returns EngagementProfile with ``engagement_score`` and
    ``confidence``. Consumed by BehavioralScoring (15% weight) and
    exported as ``behavioral_engagement`` to the Phase 13 ranking
    feature vector.
"""

import logging
from typing import List, Tuple

from models.engagement_profile import EngagementProfile
from models.candidate import Candidate

logger = logging.getLogger(__name__)


class EngagementAnalyzer:
    """Estimates how engaged a candidate is with the recruiting ecosystem.

    Design philosophy:
        Platform engagement is a leading indicator of candidate
        receptivity.  Candidates with high profile views + recruiter
        saves are in active demand.  Candidates who also apply actively
        are self-motivated movers.  Both types are valuable to different
        recruiter strategies — the scorer combines them additively.
    """

    # ── Normalisation ceilings (platform calibrated) ───────────────────────────
    MAX_PROFILE_VIEWS_30D: int = 100       # views → saturates at 100
    MAX_RECRUITER_SAVES_30D: int = 20      # saves → saturates at 20
    MAX_APPLICATIONS_30D: int = 10         # applications → saturates at 10
    MAX_SEARCH_APPEARANCES_30D: int = 500  # search hits → saturates at 500
    MAX_GITHUB_SCORE: float = 100.0        # github score → normalise to 1.0

    # ── Sub-score weights ──────────────────────────────────────────────────────
    WEIGHT_PROFILE_VIEWS: float = 0.15
    WEIGHT_RECRUITER_SAVES: float = 0.30
    WEIGHT_APPLICATION_ACTIVITY: float = 0.25
    WEIGHT_SEARCH_APPEARANCES: float = 0.20
    WEIGHT_MARKET_ACTIVITY: float = 0.10

    def calculate_profile_views(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores 30-day profile-view rate as a discoverability proxy.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        views = candidate.redrob_signals.profile_views_received_30d
        score = min(1.0, views / self.MAX_PROFILE_VIEWS_30D)
        evidence: List[str] = []

        if views == 0:
            evidence.append("⚪ No profile views in the last 30 days.")
        elif views <= 10:
            evidence.append(f"🟡 Low profile visibility: {views} views in 30 days.")
        elif views <= 40:
            evidence.append(f"✅ Moderate profile visibility: {views} views in 30 days.")
        else:
            evidence.append(f"✅ High profile visibility: {views} views in 30 days.")

        return round(score, 4), evidence

    def calculate_recruiter_saves(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores 30-day recruiter-save count as a passive market-demand signal.

        Recruiter saves are a strong leading indicator — recruiters who
        save profiles are actively building shortlists.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        saves = candidate.redrob_signals.saved_by_recruiters_30d
        score = min(1.0, saves / self.MAX_RECRUITER_SAVES_30D)
        evidence: List[str] = []

        if saves == 0:
            evidence.append("⚪ Not saved by any recruiter in the last 30 days.")
        elif saves <= 2:
            evidence.append(f"🟡 Low recruiter interest: saved by {saves} recruiter(s).")
        elif saves <= 7:
            evidence.append(f"✅ Moderate recruiter interest: saved by {saves} recruiter(s).")
        else:
            evidence.append(f"✅ High recruiter demand: saved by {saves} recruiter(s) in 30 days.")

        return round(score, 4), evidence

    def calculate_application_activity(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores 30-day job-application submissions as an active-intent signal.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        apps = candidate.redrob_signals.applications_submitted_30d
        score = min(1.0, apps / self.MAX_APPLICATIONS_30D)
        evidence: List[str] = []

        if apps == 0:
            evidence.append("⚪ No job applications submitted in the last 30 days.")
        elif apps <= 2:
            evidence.append(f"🟡 Low application activity: {apps} application(s) submitted.")
        elif apps <= 5:
            evidence.append(f"✅ Active job seeker: {apps} applications submitted in 30 days.")
        else:
            evidence.append(
                f"✅ Very active job seeker: {apps} applications in 30 days — strong intent signal."
            )

        return round(score, 4), evidence

    def calculate_search_appearances(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores 30-day platform-search appearance count as algorithmic discoverability.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        appearances = candidate.redrob_signals.search_appearance_30d
        score = min(1.0, appearances / self.MAX_SEARCH_APPEARANCES_30D)
        evidence: List[str] = []

        if appearances == 0:
            evidence.append("⚪ Candidate did not appear in any recruiter searches in 30 days.")
        elif appearances <= 50:
            evidence.append(f"🟡 Low search visibility: appeared in {appearances} searches.")
        elif appearances <= 200:
            evidence.append(f"✅ Moderate search visibility: appeared in {appearances} searches.")
        else:
            evidence.append(
                f"✅ High search visibility: appeared in {appearances} searches in 30 days."
            )

        return round(score, 4), evidence

    def calculate_market_activity(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores external market activity using GitHub activity as the primary proxy.

        GitHub score from platform signals is normalised to [0, 1].  A
        score of -1.0 (unknown) is treated as neutral (0.0).

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        github_raw = candidate.redrob_signals.github_activity_score
        evidence: List[str] = []

        if github_raw < 0:
            # Score of -1 means no GitHub data available
            score = 0.0
            evidence.append("⚪ No GitHub activity data available.")
        else:
            score = min(1.0, github_raw / self.MAX_GITHUB_SCORE)
            if github_raw == 0:
                evidence.append("⚪ GitHub activity score is zero — no public contributions detected.")
            elif github_raw <= 25:
                evidence.append(f"🟡 Low GitHub activity: score {github_raw:.1f}/100.")
            elif github_raw <= 60:
                evidence.append(f"✅ Moderate GitHub activity: score {github_raw:.1f}/100.")
            else:
                evidence.append(f"✅ High GitHub activity: score {github_raw:.1f}/100 — strong open-source signal.")

        return round(score, 4), evidence

    def calculate_engagement(self, candidate: Candidate) -> Tuple[float, float]:
        """Computes composite engagement score and confidence.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float]: (engagement_score, confidence) in [0,1].
        """
        pv, _ = self.calculate_profile_views(candidate)
        rs, _ = self.calculate_recruiter_saves(candidate)
        aa, _ = self.calculate_application_activity(candidate)
        sa, _ = self.calculate_search_appearances(candidate)
        ma, _ = self.calculate_market_activity(candidate)

        composite = (
            self.WEIGHT_PROFILE_VIEWS * pv
            + self.WEIGHT_RECRUITER_SAVES * rs
            + self.WEIGHT_APPLICATION_ACTIVITY * aa
            + self.WEIGHT_SEARCH_APPEARANCES * sa
            + self.WEIGHT_MARKET_ACTIVITY * ma
        )

        non_zero = sum(1 for s in (pv, rs, aa, sa, ma) if s > 0.0)
        confidence = non_zero / 5.0

        return round(min(1.0, composite), 4), round(confidence, 4)

    def generate_profile(self, candidate: Candidate) -> EngagementProfile:
        """Orchestrates all sub-calculations and returns a complete EngagementProfile.

        This is the primary public interface consumed by RecruiterTrustService.

        Args:
            candidate: Candidate aggregate.

        Returns:
            EngagementProfile: Fully populated engagement assessment.
        """
        logger.debug("Analyzing engagement for candidate %s", candidate.candidate_id)

        pv, pv_evidence = self.calculate_profile_views(candidate)
        rs, rs_evidence = self.calculate_recruiter_saves(candidate)
        aa, aa_evidence = self.calculate_application_activity(candidate)
        sa, sa_evidence = self.calculate_search_appearances(candidate)
        ma, ma_evidence = self.calculate_market_activity(candidate)

        composite = (
            self.WEIGHT_PROFILE_VIEWS * pv
            + self.WEIGHT_RECRUITER_SAVES * rs
            + self.WEIGHT_APPLICATION_ACTIVITY * aa
            + self.WEIGHT_SEARCH_APPEARANCES * sa
            + self.WEIGHT_MARKET_ACTIVITY * ma
        )
        composite = round(min(1.0, max(0.0, composite)), 4)

        non_zero = sum(1 for s in (pv, rs, aa, sa, ma) if s > 0.0)
        confidence = round(non_zero / 5.0, 4)

        all_evidence = (
            pv_evidence
            + rs_evidence
            + aa_evidence
            + sa_evidence
            + ma_evidence
            + [f"📊 Composite engagement_score = {composite:.3f} (confidence: {confidence:.2f})"]
        )

        logger.info(
            "Engagement profile built for %s | score=%.3f | confidence=%.3f",
            candidate.candidate_id,
            composite,
            confidence,
        )

        return EngagementProfile(
            profile_views=pv,
            recruiter_saves=rs,
            application_activity=aa,
            search_appearances=sa,
            market_activity=ma,
            engagement_score=composite,
            confidence=confidence,
            evidence=all_evidence,
        )
