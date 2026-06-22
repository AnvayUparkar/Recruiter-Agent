import numpy as np
from rank_bm25 import BM25Okapi
import pickle
from pathlib import Path
from services.bm25_tokenizer import Bm25Tokenizer

tokenizer = Bm25Tokenizer()
corpus = [
    "Senior Developer in python and retrieval databases.",
    "Frontend JS programmer."
]
tokenized_corpus = [tokenizer.tokenize(doc) for doc in corpus]
print("Tokenized corpus:", tokenized_corpus)

index = BM25Okapi(tokenized_corpus)
query = "python"
query_tokens = tokenizer.tokenize(query)
print("Query tokens:", query_tokens)

scores = index.get_scores(query_tokens)
print("Scores:", scores)

path = Path("test_bm25.pkl")
with open(path, "wb") as f:
    pickle.dump(index, f)

with open(path, "rb") as f:
    loaded_index = pickle.load(f)

loaded_scores = loaded_index.get_scores(query_tokens)
print("Loaded scores:", loaded_scores)

if path.exists():
    path.unlink()
