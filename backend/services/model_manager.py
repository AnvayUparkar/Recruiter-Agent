"""Embedding Model Manager service.

Provides a thread-safe, singleton interface for loading, caching, and querying
embedding models (PyTorch-based or Mock fallbacks).
"""

import os
import hashlib
import threading
from typing import Dict, List, Union
from utils.logger import get_logger

logger = get_logger(__name__)

# Try importing torch and transformers, handle cases gracefully
try:
    import torch
    from transformers import AutoModel, AutoTokenizer
    HAS_TORCH_TRANSFORMERS = True
except ImportError:
    HAS_TORCH_TRANSFORMERS = False


# Directory of standard model dimensions
MODEL_DIMENSIONS = {
    "BAAI/bge-large-en-v1.5": 1024,
    "BAAI/bge-base-en-v1.5": 768,
    "BAAI/bge-small-en-v1.5": 384,
    "intfloat/multilingual-e5-large": 1024,
    "text-embedding-3-large": 3072,
    "text-embedding-3-small": 1536,
    "text-embedding-ada-002": 1536,
}


class MockEmbeddingModel:
    """Mock fallback embedding model generating deterministic vectors from text hashes."""

    def __init__(self, model_name: str, dimension: int = 1024):
        self.model_name = model_name
        self.dimension = dimension
        self.device = "cpu"
        logger.info(f"Initialized MockEmbeddingModel for '{model_name}' (dimension={dimension})")

    def encode(self, texts: List[str]) -> List[List[float]]:
        """Generates deterministic, L2-normalized pseudo-random vectors based on text hash."""
        import numpy as np

        embeddings = []
        for text in texts:
            # Compute sha256 to seed generator deterministically
            h = hashlib.sha256(text.encode("utf-8")).digest()
            state = np.random.RandomState(int.from_bytes(h[:4], "big"))
            vec = state.randn(self.dimension)
            # Normalize vector (L2 norm)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            embeddings.append(vec.tolist())
        return embeddings


class RealEmbeddingModel:
    """Wrapper around PyTorch Hugging Face tokenizer and model pipeline."""

    def __init__(self, model_name: str):
        self.model_name = model_name
        # Auto-detect device (CPU / CUDA)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading real PyTorch embedding model '{model_name}' on device '{self.device}'...")
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.to(self.device)
        self.model.eval()
        
        # Determine dimension from model configs
        self.dimension = getattr(self.model.config, "hidden_size", 1024)
        logger.info(f"Successfully loaded real model '{model_name}' with hidden dimension size {self.dimension}")

    def encode(self, texts: List[str]) -> List[List[float]]:
        """Tokenizes, executes forward pass, CLS-pools, and L2 normalizes."""
        # Tokenize texts with padding and truncation
        encoded_input = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt"
        )
        
        # Move tensor parameters to selected device
        input_ids = encoded_input["input_ids"].to(self.device)
        attention_mask = encoded_input["attention_mask"].to(self.device)
        
        with torch.no_grad():
            model_output = self.model(input_ids=input_ids, attention_mask=attention_mask)
            # CLS pooling (first token representation) is standard for BGE models
            embeddings = model_output[0][:, 0]
            # L2 normalization along dimension 1
            embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
            return embeddings.cpu().numpy().tolist()


class ModelManager:
    """Singleton Manager holding cached model instances, thread-safe access, and fallbacks."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(ModelManager, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._models: Dict[str, Union[RealEmbeddingModel, MockEmbeddingModel]] = {}
        self.lock = threading.Lock()
        self._initialized = True

    def load_model(self, model_name: str, force_mock: bool = False) -> None:
        """Loads and caches an embedding model instance in memory.

        Args:
            model_name: HuggingFace hub path or identifier.
            force_mock: If True, forces initialization of the Mock model.
        """
        with self.lock:
            if model_name in self._models:
                logger.debug(f"Model '{model_name}' is already loaded.")
                return

            # Check if force-mock config or absence of libraries
            use_mock = force_mock or not HAS_TORCH_TRANSFORMERS or os.getenv("USE_REAL_EMBEDDINGS", "False").lower() != "true"

            if use_mock:
                dim = MODEL_DIMENSIONS.get(model_name, 1024)
                self._models[model_name] = MockEmbeddingModel(model_name, dimension=dim)
                return

            try:
                # Load real model
                self._models[model_name] = RealEmbeddingModel(model_name)
            except Exception as e:
                logger.error(
                    f"Failed loading real model '{model_name}': {e}. Falling back to Mock representation.",
                    exc_info=True
                )
                dim = MODEL_DIMENSIONS.get(model_name, 1024)
                self._models[model_name] = MockEmbeddingModel(model_name, dimension=dim)

    def get_model(self, model_name: str) -> Union[RealEmbeddingModel, MockEmbeddingModel]:
        """Fetches a loaded model instance, loading it dynamically if not present.

        Args:
            model_name: Target model identifier.

        Returns:
            The model wrapper instance.
        """
        if model_name not in self._models:
            self.load_model(model_name)
        return self._models[model_name]

    def unload_model(self, model_name: str) -> None:
        """Removes a model from cache, reclaiming memory.

        Args:
            model_name: Target model identifier.
        """
        with self.lock:
            if model_name in self._models:
                del self._models[model_name]
                logger.info(f"Unloaded model '{model_name}' from manager memory cache.")
                if HAS_TORCH_TRANSFORMERS:
                    # Clear PyTorch memory cache if on CUDA
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()

    def model_info(self, model_name: str) -> dict:
        """Returns metadata configuration details of a model.

        Args:
            model_name: Target model identifier.
        """
        model = self.get_model(model_name)
        return {
            "model_name": model_name,
            "dimension": model.dimension,
            "device": model.device,
            "type": "Mock" if isinstance(model, MockEmbeddingModel) else "Real",
        }
