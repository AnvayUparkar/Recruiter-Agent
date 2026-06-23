import os
import sys
import json
import pickle
import hashlib
from pathlib import Path
import numpy as np
import faiss

# Add backend directory to python path
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

from config import Config
from services.model_manager import MockEmbeddingModel
from services.index_builder import IndexBuilder
from services.bm25_tokenizer import Bm25Tokenizer
from services.bm25_builder import Bm25Builder
from models.bm25_metadata import Bm25Metadata
from models.vector_index_metadata import VectorIndexMetadata
from rank_bm25 import BM25Okapi

def stream_candidates(file_path: Path):
    """Generator to stream candidate JSON objects from JSON or JSONL file."""
    if file_path.suffix == ".json":
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            for candidate in data:
                yield candidate
    else:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if stripped:
                    yield json.loads(stripped)

def main():
    dataset_path = Config.DATASET_PATH
    print(f"Dataset path: {dataset_path}")
    if not dataset_path.exists():
        print(f"Error: dataset file not found at {dataset_path}")
        sys.exit(1)

    index_dir = Config.INDEX_PATH
    print(f"Index directory: {index_dir}")
    os.makedirs(index_dir, exist_ok=True)
    os.makedirs(index_dir / "bm25", exist_ok=True)

    # Initialize tokenizer & model
    tokenizer = Bm25Tokenizer()
    model = MockEmbeddingModel("BAAI/bge-large-en-v1.5", dimension=1024)

    # Build exact flat IP index for ID mapping
    faiss_index = IndexBuilder.build_flat_index(dimension=1024)
    
    # Structures to hold values for BM25 serialization
    candidate_ids = []
    documents = []
    tokenized_corpus = []
    vocabulary = set()

    # Mappings for VectorStore
    candidate_to_vector = {}
    vector_to_candidate = {}
    hashes = {}
    vector_metadata = {}

    batch_texts = []
    batch_ids = []

    count = 0
    print("Starting candidate streaming and indexing...")

    for candidate in stream_candidates(dataset_path):
        candidate_id = candidate["candidate_id"]
        profile = candidate["profile"]
        career_history = candidate.get("career_history", [])
        skills = candidate.get("skills", [])
        signals = candidate.get("redrob_signals", {})

        # Concat text representation as required:
        # headline summary career history titles descriptions skill names
        headline = profile.get("headline", "")
        summary = profile.get("summary", "")
        
        jobs_part = " ".join(job.get("title", "") + " " + job.get("description", "") for job in career_history)
        skills_part = " ".join(s.get("name", "") for s in skills)
        candidate_text = f"{headline} {summary} {jobs_part} {skills_part}"

        # Hash text representation
        text_hash = hashlib.sha256(candidate_text.encode("utf-8")).hexdigest()

        # Tokenize for BM25
        tokens = tokenizer.tokenize(candidate_text)
        tokenized_corpus.append(tokens)
        vocabulary.update(tokens)
        candidate_ids.append(candidate_id)
        documents.append(candidate_text)

        # Bidirectional mapping updates
        vector_id = count
        candidate_to_vector[candidate_id] = vector_id
        vector_to_candidate[vector_id] = candidate_id
        hashes[candidate_id] = text_hash
        
        cand_meta = {
            "years_experience": float(profile.get("years_of_experience", 0.0)),
            "location": profile.get("location", ""),
            "open_to_work_flag": bool(signals.get("open_to_work_flag", True))
        }
        vector_metadata[candidate_id] = cand_meta

        # Queue for FAISS batch embedding
        batch_texts.append(candidate_text)
        batch_ids.append(vector_id)

        count += 1

        if len(batch_texts) == 500:
            embeddings = model.encode(batch_texts)
            np_embeddings = np.array(embeddings, dtype=np.float32)
            faiss.normalize_L2(np_embeddings)
            faiss_index.add_with_ids(np_embeddings, np.array(batch_ids, dtype=np.int64))
            batch_texts = []
            batch_ids = []

        if count % 10000 == 0:
            print(f"Processed {count} candidates...")

    # Process remaining batch
    if batch_texts:
        embeddings = model.encode(batch_texts)
        np_embeddings = np.array(embeddings, dtype=np.float32)
        faiss.normalize_L2(np_embeddings)
        faiss_index.add_with_ids(np_embeddings, np.array(batch_ids, dtype=np.int64))

    print(f"Total candidates processed: {count}")

    # Build and serialize BM25 index
    print("Building BM25Okapi index...")
    bm25_index = BM25Okapi(tokenized_corpus)

    print("Saving BM25 artifacts...")
    bm25_path = index_dir / "bm25" / "bm25.pkl"
    with open(bm25_path, "wb") as f:
        pickle.dump(bm25_index, f, protocol=pickle.HIGHEST_PROTOCOL)

    corpus_path = index_dir / "bm25" / "corpus.pkl"
    with open(corpus_path, "wb") as f:
        pickle.dump({
            "candidate_ids": candidate_ids,
            "documents": documents
        }, f, protocol=pickle.HIGHEST_PROTOCOL)

    vocab_path = index_dir / "bm25" / "vocabulary.pkl"
    with open(vocab_path, "wb") as f:
        pickle.dump(vocabulary, f, protocol=pickle.HIGHEST_PROTOCOL)

    avg_doc_len = float(bm25_index.avgdl) if bm25_index.corpus_size > 0 else 0.0
    bm25_meta = Bm25Metadata(
        index_name="bm25.pkl",
        algorithm="BM25Okapi",
        candidate_count=len(candidate_ids),
        token_count=len(vocabulary),
        average_document_length=round(avg_doc_len, 2),
        storage_size_mb=round(os.path.getsize(bm25_path) / (1024 * 1024), 2)
    )
    with open(index_dir / "bm25" / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(bm25_meta.model_dump(), f, indent=4, default=str)

    # Save FAISS artifacts
    print("Saving FAISS artifacts...")
    faiss_path = index_dir / "faiss.index"
    faiss.write_index(faiss_index, str(faiss_path))

    mapping_path = index_dir / "vector_mapping.pkl"
    with open(mapping_path, "wb") as f:
        pickle.dump({
            "candidate_to_vector": candidate_to_vector,
            "vector_to_candidate": vector_to_candidate,
            "hashes": hashes,
            "metadata": vector_metadata,
            "next_vector_id": count
        }, f, protocol=pickle.HIGHEST_PROTOCOL)

    faiss_meta = VectorIndexMetadata(
        index_name="faiss.index",
        index_type="IndexFlatIP",
        embedding_dimension=1024,
        candidate_count=count,
        model_name="BAAI/bge-large-en-v1.5",
        faiss_version=faiss.__version__,
        storage_size_mb=round(os.path.getsize(faiss_path) / (1024 * 1024), 2)
    )
    with open(index_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(faiss_meta.model_dump(), f, indent=4, default=str)

    print("Index build completed successfully!")

if __name__ == "__main__":
    main()
