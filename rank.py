import os
import sys
import csv
import argparse
from pathlib import Path

# Set up paths so we can import from backend
project_root = Path(__file__).resolve().parent
backend_dir = project_root / "backend"
sys.path.append(str(backend_dir))

import docx

# Import backend services
from config import Config
from services.jd_analyzer import JdAnalyzer
from services.hybrid_retrieval_service import HybridRetrievalService
from services.candidate_repository import JSONLCandidateRepository
from services.candidate_intelligence_service import CandidateIntelligenceService
from services.recruiter_trust_service import RecruiterTrustService
from services.trustworthiness_service import TrustworthinessService
from services.feature_service import FeatureService
from services.final_ranking_service import FinalRankingService
from services.ranking_strategy import RankingStrategyType

def extract_jd_text(docx_path: str) -> str:
    """Reads text from a .docx file."""
    doc = docx.Document(docx_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

def main():
    parser = argparse.ArgumentParser(description="Candidate Ranking Script for Hackathon")
    parser.add_argument("--candidates", required=True, help="Path to candidates.jsonl file")
    parser.add_argument("--out", required=True, help="Path to output submission.csv file")
    args = parser.parse_args()

    print("Initializing services...")
    jd_analyzer = JdAnalyzer()
    retrieval_service = HybridRetrievalService()
    candidate_intel_service = CandidateIntelligenceService()
    behavioral_service = RecruiterTrustService()
    reliability_service = TrustworthinessService()
    feature_service = FeatureService()
    ranking_service = FinalRankingService()

    # Hardcoded path to the existing JD docx
    jd_path = project_root / "[PUB] India_runs_data_and_ai_challenge" / "India_runs_data_and_ai_challenge" / "job_description.docx"
    print(f"Reading Job Description from {jd_path}...")
    jd_text = extract_jd_text(str(jd_path))
    
    print("Parsing Job Description...")
    parsed_jd = jd_analyzer.analyze_jd(jd_text)

    print("Retrieving candidate pool using existing FAISS index...")
    # Retrieve a larger pool to ensure we can get 100 final candidates after intersection
    pool = retrieval_service.retrieve_candidate_pool(parsed_jd, pool_size=5000)
    candidate_ids = [c.candidate_id for c in pool.candidates]

    if not candidate_ids:
        print("No candidates retrieved from the index. Exiting.")
        sys.exit(1)

    print(f"Loading candidate data from {args.candidates}...")
    repo = JSONLCandidateRepository(Path(args.candidates))
    candidates = repo.find_many(candidate_ids)

    cand_map = {c.candidate_id: c for c in candidates}
    
    # Maintain the order of the FAISS retrieval, but only keep candidates present in the input file
    ordered_candidates = [cand_map[cid] for cid in candidate_ids if cid in cand_map]

    if not ordered_candidates:
        print("None of the retrieved candidates exist in the provided file. Exiting.")
        sys.exit(1)

    print(f"Found {len(ordered_candidates)} matched candidates in the file. Building profiles...")
    
    profiles = candidate_intel_service.build_batch_profiles(ordered_candidates)
    bi_list = behavioral_service.build_batch_profiles(ordered_candidates)
    bi_map = {bi.candidate_id: bi for bi in bi_list}
    
    rp_list = reliability_service.build_batch_profiles(ordered_candidates, behavioral_intels=bi_map)
    rp_map = {rp.candidate_id: rp for rp in rp_list}
    
    print("Building feature vectors...")
    fvs_list = feature_service.build_feature_vectors(
        candidates=ordered_candidates,
        profiles=profiles,
        parsed_jd=parsed_jd,
        pool=pool
    )
    fv_map = {fv.candidate_id: fv for fv in fvs_list}

    print("Ranking candidates...")
    strategy_type = RankingStrategyType.BALANCED
    result = ranking_service.rank_candidates(
        candidates=ordered_candidates,
        feature_vectors=fv_map,
        behavioral_intels=bi_map,
        reliability_profiles=rp_map,
        parsed_jd=parsed_jd,
        strategy=strategy_type
    )

    # Hackathon spec requires exactly 100 rows
    top_candidates = result.ranked_candidates[:100]
    
    print(f"Writing top {len(top_candidates)} candidates to {args.out}...")
    
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(out_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        # Expected hackathon headers
        writer.writerow(["candidate_id", "rank", "score", "reasoning"])
        
        for i, rc in enumerate(top_candidates, start=1):
            expl_text = rc.explanation.summary if rc.explanation else ""
            
            # Format the output exactly as expected
            writer.writerow([
                rc.candidate_id,
                i,  # Output continuous ranks from 1 to 100
                f"{rc.final_score:.4f}",
                expl_text.replace("\n", " ").strip(),
            ])

    print("Done! Valid format generation complete.")

if __name__ == "__main__":
    main()
