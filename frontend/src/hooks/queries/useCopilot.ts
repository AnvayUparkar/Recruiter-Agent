import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { copilotService } from "../../services/copilotService";
import { RecruiterReport, CandidateComparisonResult, HiringDecision } from "../../types/copilot";
import { ApiError } from "../../utils/errors/ApiError";

/**
 * Query hook to compile the recruiter copilot report for a candidate.
 */
export function useCopilotReport(
  candidateId: string,
  jobDescription: string,
  enabled = true
): UseQueryResult<RecruiterReport, ApiError> {
  return useQuery<RecruiterReport, ApiError>({
    queryKey: ["copilotReport", candidateId, { jobDescription }],
    queryFn: () => copilotService.generateReport(candidateId, jobDescription),
    enabled: enabled && !!candidateId && jobDescription.length >= 20,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query hook to perform finalist head-to-head comparison calculations.
 */
export function useFinalistComparison(
  candidateIdA: string,
  candidateIdB: string,
  jobDescription: string,
  enabled = true
): UseQueryResult<CandidateComparisonResult, ApiError> {
  return useQuery<CandidateComparisonResult, ApiError>({
    queryKey: ["finalistComparison", { candidateIdA, candidateIdB, jobDescription }],
    queryFn: () => copilotService.compareCandidates(candidateIdA, candidateIdB, jobDescription),
    enabled: enabled && !!candidateIdA && !!candidateIdB && jobDescription.length >= 20,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Query hook to retrieve structured hiring manager proposals.
 */
export function useHiringDecision(
  candidateId: string,
  jobDescription: string,
  enabled = true
): UseQueryResult<HiringDecision, ApiError> {
  return useQuery<HiringDecision, ApiError>({
    queryKey: ["hiringDecision", candidateId, { jobDescription }],
    queryFn: () => copilotService.generateHiringDecision(candidateId, jobDescription),
    enabled: enabled && !!candidateId && jobDescription.length >= 20,
    staleTime: 5 * 60 * 1000,
  });
}
