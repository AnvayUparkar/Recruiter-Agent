"""Job Description cleaning and normalization service.

Provides functions to clean raw, copy-pasted, or HTML-formatted JD text
without removing technical terms or company-specific context.
"""

import re
import unicodedata
from utils.logger import get_logger

logger = get_logger(__name__)


class JdCleaner:
    """Cleans and standardizes raw job description texts."""

    @staticmethod
    def remove_html(text: str) -> str:
        """Removes all HTML tags from the text.

        Args:
            text: Raw input text.
        """
        html_regex = re.compile(r"<[^>]*>")
        return html_regex.sub("", text)

    @staticmethod
    def remove_extra_whitespace(text: str) -> str:
        """Collapses multiple spaces and limits consecutive newlines.

        Args:
            text: Raw input text.
        """
        # Collapse multiple spaces/tabs to a single space
        text = re.sub(r"[ \t]+", " ", text)
        # Collapse multiple newlines (3 or more) to double newlines to preserve paragraphs
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def normalize_unicode(text: str) -> str:
        """Standardizes unicode characters, smart quotes, and dashes.

        Args:
            text: Raw input text.
        """
        # NFC/NFKC Normalization
        text = unicodedata.normalize("NFKC", text)

        # Map common smart/special punctuation to basic ASCII equivalents
        replacements = {
            "\u201c": '"',  # Left smart quote
            "\u201d": '"',  # Right smart quote
            "\u2018": "'",  # Left smart single quote
            "\u2019": "'",  # Right smart single quote
            "\u2013": "-",  # En-dash
            "\u2014": " - ",  # Em-dash
            "\u2022": "-",  # Bullet point character
            "\xa0": " ",  # Non-breaking space
        }

        for special, replacement in replacements.items():
            text = text.replace(special, replacement)

        return text

    @staticmethod
    def normalize_bullets(text: str) -> str:
        """Replaces common list bullet markers with standard hyphens.

        Args:
            text: Raw input text.
        """
        # Convert lines starting with *, •, o, or en/em dashes into "- "
        lines = text.split("\n")
        normalized_lines = []
        for line in lines:
            stripped = line.lstrip()
            # Match common list bullets (e.g., "* ", "• ", "- ", "— ")
            match = re.match(r"^([\*\u2022\u2013\u2014\-\+]|\([a-zA-Z0-9]\))\s*", stripped)
            if match:
                # Replace bullet with standard "- "
                line_content = stripped[match.end():]
                normalized_lines.append(f"- {line_content}")
            else:
                normalized_lines.append(line)
        return "\n".join(normalized_lines)

    def clean_text(self, text: str) -> str:
        """Applies all cleaning and normalization steps in order.

        Args:
            text: Raw input text.

        Returns:
            str: Cleaned, structured text.
        """
        if not text:
            return ""

        cleaned = self.remove_html(text)
        cleaned = self.normalize_unicode(cleaned)
        cleaned = self.normalize_bullets(cleaned)
        cleaned = self.remove_extra_whitespace(cleaned)

        logger.debug("Raw Job Description text cleaned and normalized.")
        return cleaned
