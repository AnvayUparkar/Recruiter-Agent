"""Leadership Feature Extractor service.

Extracts evidence-based leadership and ownership signals from
a Candidate's job titles, descriptions, and career progression.

Why it exists:
  Leadership signals are not stored directly in skill lists.
  They must be inferred from: job title patterns ("Tech Lead", "Staff Engineer"),
  description verb patterns ("led a team of", "drove adoption", "owned"),
  and career arcs (consistent upward title progression).

Ranking dependency:
  Produces LeadershipFeatures. Leadership group has 5% weight in default
  config, but is a critical gate for senior/principal roles.
"""

import re
from typing import List, Set, Tuple
from models.candidate import Candidate
from models.candidate_profile import CandidateProfile
from models.leadership_features import LeadershipFeatures
from models.career_history import CareerHistory
from utils.logger import get_logger

logger = get_logger(__name__)

# ── Title Signal Sets ─────────────────────────────────────────────────────────

PEOPLE_MANAGEMENT_TITLES: Set[str] = {
    "manager", "engineering manager", "em", "head of engineering",
    "director", "vp", "vice president", "team lead", "group lead",
}

TECHNICAL_LEADERSHIP_TITLES: Set[str] = {
    "tech lead", "technical lead", "staff engineer", "principal engineer",
    "distinguished engineer", "architect", "fellow", "senior staff",
}

# ── Description Pattern Sets ──────────────────────────────────────────────────

PEOPLE_MANAGEMENT_PATTERNS: List[str] = [
    r"manage[d]?\s+(?:a\s+)?team\s+of\s+\d+",
    r"led\s+(?:a\s+)?team\s+of\s+\d+",
    r"hired\s+(?:and|\/)\s+manage[d]?",
    r"performance\s+review",
    r"direct\s+report",
    r"reporting\s+to\s+me",
]

MENTORSHIP_PATTERNS: List[str] = [
    r"mentor(?:ed|ing)?",
    r"onboard(?:ed|ing)?\s+engineers",
    r"coaching",
    r"junior\s+engineer",
    r"intern\s+program",
    r"knowledge\s+transfer",
]

OWNERSHIP_PATTERNS: List[str] = [
    r"\bowned\b",
    r"\bdrove\b",
    r"\bchampioned\b",
    r"\bspearheaded\b",
    r"end-to-end\s+ownership",
    r"sole\s+(?:owner|engineer|contributor)",
    r"accountable\s+for",
]

CROSS_FUNCTIONAL_PATTERNS: List[str] = [
    r"cross[- ]functional",
    r"partner(?:ed)?\s+with\s+(?:product|design|business|data|infra)",
    r"stakeholder",
    r"collaborated\s+with",
    r"aligned\s+(?:with)?\s+(?:product|business|leadership)",
]

DECISION_MAKING_PATTERNS: List[str] = [
    r"architect(?:ed|ure\s+decision)",
    r"technical\s+decision",
    r"design\s+doc",
    r"rfc",
    r"defined\s+(?:the\s+)?(?:architecture|strategy|roadmap|technical\s+direction)",
    r"evaluated\s+(?:and\s+)?chose",
]


class LeadershipFeatureExtractor:
    """Extracts LeadershipFeatures from a Candidate record."""

    @staticmethod
    def _scan_patterns(text: str, patterns: List[str]) -> Tuple[float, List[str]]:
        """Scans text for regex pattern matches.

        Score: min(1.0, matches / 2) — 2+ pattern hits → full score.

        Args:
            text:     Lowercased text to scan.
            patterns: List of regex patterns.

        Returns:
            Tuple[float, List[str]]: (score, matched_snippets)
        """
        matched = []
        for pattern in patterns:
            found = re.findall(pattern, text)
            if found:
                matched.extend(found[:2])
        score = min(1.0, len(matched) / 2.0)
        return round(score, 4), matched[:5]

    @staticmethod
    def _has_title_signal(title: str, signal_set: Set[str]) -> bool:
        """Checks if a job title contains any signal keyword."""
        title_lower = title.lower()
        return any(s in title_lower for s in signal_set)

    def _title_score(
        self, career_history: List[CareerHistory], signal_set: Set[str]
    ) -> float:
        """Fraction of roles with a matching title signal.

        Args:
            career_history: List of career positions.
            signal_set:     Title keyword set to match against.

        Returns:
            float: Score in [0.0, 1.0].
        """
        if not career_history:
            return 0.0
        matches = sum(
            1 for job in career_history
            if self._has_title_signal(job.title, signal_set)
        )
        return round(min(1.0, matches / max(1, len(career_history) * 0.5)), 4)

    def _description_score(
        self, career_history: List[CareerHistory], patterns: List[str]
    ) -> Tuple[float, List[str]]:
        """Aggregates pattern scan across all career descriptions.

        Args:
            career_history: List of career positions.
            patterns:       Regex patterns.

        Returns:
            Tuple[float, List[str]]: (score, evidence)
        """
        full_text = " ".join(j.description for j in career_history).lower()
        return self._scan_patterns(full_text, patterns)

    # ── Main Extraction ───────────────────────────────────────────────────────

    def extract_features(
        self,
        candidate: Candidate,
        profile: CandidateProfile,
    ) -> LeadershipFeatures:
        """Extracts LeadershipFeatures from a Candidate record.

        Args:
            candidate: Raw Candidate record.
            profile:   CandidateProfile for intelligence signal blending.

        Returns:
            LeadershipFeatures: Populated feature object.
        """
        history = candidate.career_history
        cp = profile.career_profile

        # People management: title + description blend
        title_mgmt = self._title_score(history, PEOPLE_MANAGEMENT_TITLES)
        desc_mgmt, mgmt_evidence = self._description_score(history, PEOPLE_MANAGEMENT_PATTERNS)
        people_mgmt = round(0.5 * title_mgmt + 0.5 * desc_mgmt, 4)

        # Technical leadership: title + description blend
        title_tech_lead = self._title_score(history, TECHNICAL_LEADERSHIP_TITLES)
        desc_tech_lead, _ = self._description_score(history, DECISION_MAKING_PATTERNS)
        tech_lead = round(0.5 * title_tech_lead + 0.5 * desc_tech_lead, 4)

        # Mentorship
        mentorship_score, _ = self._description_score(history, MENTORSHIP_PATTERNS)

        # Ownership
        ownership_score, _ = self._description_score(history, OWNERSHIP_PATTERNS)

        # Cross-functional
        cross_func_score, _ = self._description_score(history, CROSS_FUNCTIONAL_PATTERNS)

        # Decision making
        decision_score, _ = self._description_score(history, DECISION_MAKING_PATTERNS)

        # Blend with Phase 5 leadership signal
        intel_leadership = cp.leadership_signal
        tech_lead    = round(0.7 * tech_lead    + 0.3 * intel_leadership, 4)
        ownership_score  = round(0.7 * ownership_score  + 0.3 * intel_leadership, 4)

        features = LeadershipFeatures(
            people_management_score=min(1.0, people_mgmt),
            technical_leadership_score=min(1.0, tech_lead),
            mentorship_score=min(1.0, mentorship_score),
            ownership_score=min(1.0, ownership_score),
            cross_functional_score=min(1.0, cross_func_score),
            decision_making_score=min(1.0, decision_score),
        )

        logger.debug(
            f"LeadershipFeatureExtractor: {candidate.candidate_id} → "
            f"overall={features.overall_leadership_score():.3f}"
        )
        return features
