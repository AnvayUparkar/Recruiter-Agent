"""Execution Feature Extractor service.

Extracts hands-on delivery and engineering impact signals from
candidate career descriptions.

Why it exists:
  Impact and delivery are the hardest signals to fake in a candidate profile.
  "Built retrieval system serving 10M users" is fundamentally different from
  "involved in retrieval project." The extractor finds these signals using
  action verb patterns and scale marker detection.

Ranking dependency:
  Produces ExecutionFeatures. Execution group has 15% weight in ranking.
  shipping_score and impact_score are among the strongest predictors of
  actual engineering performance.
"""

import re
from typing import List, Tuple
from models.candidate import Candidate
from models.execution_features import ExecutionFeatures
from utils.logger import get_logger

logger = get_logger(__name__)

# ── Pattern Libraries ─────────────────────────────────────────────────────────

# Verbs that signal actual shipping/delivery
SHIPPING_VERBS: List[str] = [
    r"\bbuilt\b", r"\blaunched\b", r"\bshipped\b", r"\bdeployed\b",
    r"\breleased\b", r"\bimplemented\b", r"\bdelivered\b", r"\bdeveloped\b",
    r"\bcreated\b", r"\bproduced\b",
]

# Evidence of production operations
PRODUCTION_PATTERNS: List[str] = [
    r"\bproduction\b", r"\bci/cd\b", r"\bkubernetes\b", r"\bdocker\b",
    r"\bmonitoring\b", r"\balerting\b", r"\bslo\b", r"\bsla\b",
    r"\bon-call\b", r"\boncall\b", r"\bdeployment\s+pipeline\b",
    r"\binfrastructure\s+as\s+code\b", r"\bterraform\b",
]

# Quantified impact patterns
IMPACT_PATTERNS: List[str] = [
    # Latency improvements
    r"reduced\s+latency\s+by\s+\d+",
    r"improved\s+(?:latency|throughput|recall|precision)\s+by\s+\d+",
    r"\d+%\s+(?:reduction|improvement|increase|decrease|faster)",
    r"(?:reduced|cut|decreased)\s+\w+\s+by\s+\d+",
    # Revenue / cost
    r"\$\d+[mkb]?\s+(?:revenue|savings|impact)",
    r"saved\s+\$\d+",
    r"increased\s+revenue\s+by",
    # User-facing metrics
    r"improved\s+(?:user|customer)\s+(?:experience|satisfaction|retention)",
    r"engagement\s+(?:up|increased)\s+by\s+\d+",
]

# Scale markers
SCALE_PATTERNS: List[str] = [
    r"\d+[mb]?\s+users",            # 10M users
    r"\d+\s+(?:million|billion)\s+(?:users|requests|records|queries|documents)",
    r"serving\s+\d+\w?\s+(?:qps|tps|rps|requests)",
    r"\d+[tmb]?\s+(?:records|rows|documents|events)",
    r"petabyte|terabyte|tb\s+scale",
    r"global\s+(?:scale|traffic|deployment)",
    r"\d+\s+(?:data\s+centers|regions|availability\s+zones)",
]

# Project complexity markers
COMPLEXITY_PATTERNS: List[str] = [
    r"\bdistributed\b",
    r"\breal-time\b",
    r"\bnear-real-time\b",
    r"\bmulti-tenant\b",
    r"\bmulti-modal\b",
    r"\bhigh\s+availability\b",
    r"\bfault\s+toleran",
    r"\blow\s+latency\b",
    r"\bhigh\s+throughput\b",
    r"\bsharded\b",
    r"\bfederated\b",
]

# Initiative and ownership verbs
INITIATIVE_PATTERNS: List[str] = [
    r"\binitiated\b", r"\bproposed\b", r"\bchampioned\b",
    r"\bspearheaded\b", r"\bdrove\s+adoption\b", r"\bpioneer[ed]?\b",
    r"\bfounded\b", r"\bestablished\b",
]


class ExecutionFeatureExtractor:
    """Extracts ExecutionFeatures from a Candidate record."""

    @staticmethod
    def _scan_patterns(text: str, patterns: List[str]) -> Tuple[float, List[str]]:
        """Scans text for regex pattern matches.

        Score: min(1.0, hits / 3) — 3+ distinct pattern hits → max score.

        Args:
            text:     Lowercased text.
            patterns: List of regex patterns.

        Returns:
            Tuple[float, List[str]]: (score, evidence_snippets)
        """
        hits = []
        for pattern in patterns:
            found = re.findall(pattern, text)
            if found:
                hits.extend(found[:2])
        score = min(1.0, len(hits) / 3.0)
        return round(score, 4), hits[:5]

    @staticmethod
    def _build_description_text(candidate: Candidate) -> str:
        """Concatenates all career descriptions into a single text block."""
        parts = [job.description for job in candidate.career_history]
        parts += [candidate.profile.summary, candidate.profile.headline]
        return " ".join(p for p in parts if p).lower()

    def extract_features(self, candidate: Candidate) -> ExecutionFeatures:
        """Extracts ExecutionFeatures from a Candidate record.

        Args:
            candidate: Raw Candidate record.

        Returns:
            ExecutionFeatures: Populated feature object.
        """
        text = self._build_description_text(candidate)

        shipping_score, _ = self._scan_patterns(text, SHIPPING_VERBS)
        production_score, _ = self._scan_patterns(text, PRODUCTION_PATTERNS)
        impact_score, _ = self._scan_patterns(text, IMPACT_PATTERNS)
        scale_score, _ = self._scan_patterns(text, SCALE_PATTERNS)
        complexity_score, _ = self._scan_patterns(text, COMPLEXITY_PATTERNS)
        initiative_score, _ = self._scan_patterns(text, INITIATIVE_PATTERNS)

        # Production evidence also comes from CareerHistory.has_production_keywords
        prod_from_history = sum(
            1.0 for job in candidate.career_history if job.has_production_keywords
        ) / max(1, len(candidate.career_history))
        production_score = round(0.6 * production_score + 0.4 * prod_from_history, 4)

        features = ExecutionFeatures(
            shipping_score=min(1.0, shipping_score),
            production_delivery_score=min(1.0, production_score),
            impact_score=min(1.0, impact_score),
            system_scale_score=min(1.0, scale_score),
            project_complexity_score=min(1.0, complexity_score),
            initiative_score=min(1.0, initiative_score),
        )

        logger.debug(
            f"ExecutionFeatureExtractor: {candidate.candidate_id} → "
            f"overall={features.overall_execution_score():.3f}"
        )
        return features
