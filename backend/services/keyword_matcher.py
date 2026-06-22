"""Keyword Matcher service.

Performs exact keyword alignment, counts token frequencies, maps technical synonyms,
and calculates coverage index scores.
"""

from typing import Dict, List, Optional, Set, Tuple
from services.bm25_tokenizer import Bm25Tokenizer
from utils.logger import get_logger

logger = get_logger(__name__)

# Specialized technical synonym and acronym dictionary
TECHNICAL_SYNONYMS: Dict[str, List[str]] = {
    "ltr": ["learning to rank", "re-ranking", "cross-encoder", "ndcg", "mrr", "map"],
    "learning to rank": ["ltr", "re-ranking", "cross-encoder", "ndcg", "mrr"],
    "vector db": ["pinecone", "qdrant", "milvus", "weaviate", "faiss", "chroma", "vector database"],
    "vector database": ["pinecone", "qdrant", "milvus", "weaviate", "faiss", "chroma", "vector db"],
    "faiss": ["vector db", "vector database"],
    "pinecone": ["vector db", "vector database"],
    "qdrant": ["vector db", "vector database"],
    "milvus": ["vector db", "vector database"],
    "weaviate": ["vector db", "vector database"],
    "retrieval": ["search", "information retrieval", "hybrid search", "lucene", "elasticsearch", "opensearch", "solr"],
    "elasticsearch": ["retrieval", "search", "search engine"],
    "opensearch": ["retrieval", "search", "search engine"],
    "rag": ["retrieval augmented generation", "langchain", "llamaindex", "retrieval-augmented"],
    "llm": ["large language model", "openai", "gpt", "claude", "gemini", "llama", "mistral", "transformers"],
    "mlops": ["production ml", "sagemaker", "mlflow", "deployment", "kubeflow"],
    "production ml": ["mlops", "deployment", "sagemaker", "mlflow"],
    "python": ["py", "django", "flask", "fastapi"],
    "k8s": ["kubernetes", "docker", "containers"],
    "kubernetes": ["k8s", "docker", "containers"],
}


class KeywordMatcher:
    """Evaluates query-to-document token alignment, synonym expands, and coverage."""

    def __init__(self, tokenizer: Optional[Bm25Tokenizer] = None):
        """Initializes the KeywordMatcher.

        Args:
            tokenizer: Bm25Tokenizer utility instance.
        """
        self.tokenizer = tokenizer or Bm25Tokenizer()

    def get_synonyms(self, term: str) -> Set[str]:
        """Fetches standard synonym expansions for a token.

        Args:
            term: Input lowercase token.

        Returns:
            Set[str]: Matching synonym tokens set.
        """
        syns = {term}
        # Add primary synonyms
        if term in TECHNICAL_SYNONYMS:
            syns.update(TECHNICAL_SYNONYMS[term])

        # Reverse matching check
        for key, vals in TECHNICAL_SYNONYMS.items():
            if term in vals:
                syns.add(key)
                syns.update(vals)

        return syns

    def find_exact_matches(
        self, doc_tokens: List[str], query_tokens: List[str]
    ) -> Tuple[List[str], int, float]:
        """Checks overlap between document tokens and query terms, factoring synonyms.

        Args:
            doc_tokens: Candidate document tokens.
            query_tokens: Query terms tokens.

        Returns:
            Tuple[List[str], int, float]: (matched_terms, total_match_count, coverage_score)
        """
        if not query_tokens:
            return [], 0, 0.0

        matched_query_terms = []
        total_count = 0
        doc_token_set = set(doc_tokens)

        for q_term in query_tokens:
            # Get synonym expansions
            syn_set = self.get_synonyms(q_term)
            
            # Intersection check
            intersect = syn_set.intersection(doc_token_set)
            if intersect:
                # Query term successfully matched (directly or via synonym)
                matched_query_terms.append(q_term)
                
                # Count total occurrences of matching tokens inside the document
                for token in doc_tokens:
                    if token in syn_set:
                        total_count += 1

        coverage = len(matched_query_terms) / len(query_tokens)
        return matched_query_terms, total_count, round(coverage, 2)

    def find_required_terms(
        self, text: str, required_terms: List[str]
    ) -> Tuple[List[str], int, float]:
        """Convenience method tokenizing raw text and matching list criteria.

        Args:
            text: Raw candidate document.
            required_terms: Specific query terms requested.
        """
        doc_tokens = self.tokenizer.tokenize(text)
        query_tokens = [t.lower() for t in required_terms]
        return self.find_exact_matches(doc_tokens, query_tokens)
