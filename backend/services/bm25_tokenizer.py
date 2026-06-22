"""BM25 Tokenizer service.

Provides custom tokenization of candidate documents and queries, preserving
technical operators and programming terms (like C++, C#, A/B).
"""

import re
from typing import List, Set
from utils.logger import get_logger

logger = get_logger(__name__)


class Bm25Tokenizer:
    """Specialized tokenization engine for technical text parsing."""

    def __init__(self):
        """Initializes regular expressions and english stopwords."""
        # Matches alphanumeric sequences along with trailing '+', '#', '-', and '.'
        # This keeps C++, C#, .NET, A/B, MLOps, etc., intact.
        self._pattern = re.compile(r"[a-zA-Z0-9+#\-.]+")

        # Standard english stopwords list to filter noise words
        self.stopwords: Set[str] = {
            "a", "about", "above", "after", "again", "against", "all", "also", "am", "an", "and", "any", "are", "arent",
            "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant",
            "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during",
            "each", "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having",
            "he", "hed", "hell", "hes", "her", "here", "heres", "hers", "herself", "him", "himself", "his", "how",
            "hows", "i", "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets",
            "me", "more", "most", "mustnt", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only",
            "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant", "she", "shed",
            "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the", "their",
            "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre",
            "theyve", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasnt", "we",
            "wed", "well", "were", "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which",
            "while", "who", "whos", "whom", "why", "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll",
            "youre", "youve", "your", "yours", "yourself", "yourselves"
        }

    def normalize_tokens(self, tokens: List[str]) -> List[str]:
        """Cleans tokens, stripping outer punctuation except technical symbols.

        Args:
            tokens: Raw matched tokens list.

        Returns:
            List[str]: Cleaned tokens list.
        """
        normalized = []
        for token in tokens:
            # Strip spaces, dashes, commas
            t = token.strip(" - ,")
            # Strip trailing dots (e.g. "systems." -> "systems")
            if t.endswith("."):
                t = t.rstrip(".")
            # Strip leading dots only if it is a single dot
            if t.startswith(".") and len(t) <= 1:
                t = t.lstrip(".")

            if t and t not in self.stopwords:
                normalized.append(t)
            # Retain single character letters if they represent key languages like C, R, or Go
            elif t in {"c", "r"}:
                normalized.append(t)
        return normalized

    def tokenize(self, text: str) -> List[str]:
        """Tokenizes a text string into normalized, lowercase keywords.

        Args:
            text: Input string.

        Returns:
            List[str]: Token list.
        """
        if not text:
            return []
        text_lower = text.lower()
        raw_tokens = self._pattern.findall(text_lower)
        return self.normalize_tokens(raw_tokens)

    def tokenize_batch(self, texts: List[str]) -> List[List[str]]:
        """Processes a list of strings into a list of token arrays.

        Args:
            texts: List of strings.

        Returns:
            List[List[str]]: Grouped token arrays.
        """
        return [self.tokenize(t) for t in texts]
