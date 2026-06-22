import { useQuery, useMutation, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { analyticsService } from "../../services/analyticsService";
import { EvaluationReport, SubmissionResult } from "../../types/analytics";
import { ApiError } from "../../utils/errors/ApiError";

/**
 * Hook to retrieve search quality metrics, NDCG, MRR, and platform latencies.
 */
export function useAnalyticsMetrics(enabled = true): UseQueryResult<EvaluationReport, ApiError> {
  return useQuery<EvaluationReport, ApiError>({
    queryKey: ["analyticsMetrics"],
    queryFn: () => analyticsService.fetchMetrics(),
    enabled,
    staleTime: 60 * 1000, // Refresh metrics every 60 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}

/**
 * Mutation hook to export candidate evaluation pools to disk in standard CSV.
 */
export function useExportSubmission(): UseMutationResult<
  SubmissionResult,
  ApiError,
  string, // job description text context
  unknown
> {
  return useMutation<SubmissionResult, ApiError, string>({
    mutationFn: (jobDescription: string) => analyticsService.exportSubmission(jobDescription),
    onError: (err) => {
      console.error("Submission packaging failed:", err.message);
    },
  });
}
