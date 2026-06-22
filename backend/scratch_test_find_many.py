import time
import json
from pathlib import Path
from services.candidate_loader import CandidateLoader

dataset_path = Path("d:/Engineering/Hackathon Projects/Finance Agent/[PUB] India_runs_data_and_ai_challenge/India_runs_data_and_ai_challenge/candidates.jsonl")

# Target IDs scattered and near the end
target_ids = {f"CAND_{i:07d}" for i in range(99800, 100000)}
print("Target IDs count:", len(target_ids))

start = time.time()
count = 0
matched = 0
loader = CandidateLoader()

for line_number, line in loader.iterate_raw_records(dataset_path):
    count += 1
    # Check if the candidate ID prefix is in the line (substring check is extremely fast in C-extension)
    # e.g. "candidate_id"
    # To check which ID it is: we can parse json only if the line has a potential match, or just use json.loads.
    # Wait, can we extract candidate_id from string partition/index?
    # Yes, candidate_id is at the start of the line or in a known position!
    # Let's see: '"candidate_id": "CAND_0099800"'
    # We can do line.partition('"candidate_id": "')[2].partition('"')[0]
    # This avoids json.loads entirely unless we match!
    # Let's test this string extraction!
    cid = line.partition('"candidate_id": "')[2].partition('"')[0]
    if cid in target_ids:
        matched += 1
        if matched == len(target_ids):
            break

print(f"Checked {count} lines. Found {matched} matches in {time.time() - start:.4f} seconds.")
