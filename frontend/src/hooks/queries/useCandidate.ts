import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { candidateService, CandidatePoolResult } from "../../services/candidateService";
import { rankingService } from "../../services/rankingService";
import { ExplanationResponse } from "../../types/ranking";
import { Candidate } from "../../types/candidate";
import { ApiError } from "../../utils/errors/ApiError";

/**
 * Hook to retrieve a matched candidate pool using lexical/semantic hybrid search.
 */
export function useCandidatePool(
  jobDescription: string,
  limit = 100,
  enabled = true
): UseQueryResult<CandidatePoolResult, ApiError> {
  return useQuery<CandidatePoolResult, ApiError>({
    queryKey: ["candidatePool", { jobDescription, limit }],
    queryFn: () => candidateService.retrievePool(jobDescription, limit),
    enabled: enabled && jobDescription.length >= 20,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to retrieve recruiter justification summaries and checklists for a single candidate.
 */
export function useCandidateExplanation(
  candidateId: string,
  jobDescription?: string,
  enabled = true
): UseQueryResult<ExplanationResponse, ApiError> {
  return useQuery<ExplanationResponse, ApiError>({
    queryKey: ["explanation", candidateId, { jobDescription }],
    queryFn: () => rankingService.explainCandidate(candidateId, jobDescription),
    enabled: enabled && !!candidateId,
    staleTime: 10 * 60 * 1000, // Caches reports longer
  });
}

/**
 * Hook to retrieve the complete candidate profile details.
 */
export function useCandidateDetails(
  candidateId: string,
  enabled = true
): UseQueryResult<Candidate, ApiError> {
  return useQuery<Candidate, ApiError>({
    queryKey: ["candidateDetails", candidateId],
    queryFn: () => candidateService.getCandidate(candidateId),
    enabled: enabled && !!candidateId,
    staleTime: 10 * 60 * 1000,
  });
}

