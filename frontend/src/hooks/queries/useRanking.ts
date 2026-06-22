import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { rankingService } from "../../services/rankingService";
import { RankingResponse } from "../../types/ranking";
import { ApiError } from "../../utils/errors/ApiError";

interface UseRankingParams {
  jobDescription: string;
  strategy?: "balanced" | "technical_first" | "engagement_first";
  limit?: number;
  enabled?: boolean;
}

/**
 * Query hook to fetch candidate ranking list evaluated against job description requirements.
 */
export function useRanking({
  jobDescription,
  strategy = "balanced",
  limit = 100,
  enabled = true,
}: UseRankingParams): UseQueryResult<RankingResponse, ApiError> {
  return useQuery<RankingResponse, ApiError>({
    queryKey: ["ranking", { jobDescription, strategy, limit }],
    queryFn: () => rankingService.rankCandidates(jobDescription, strategy, limit),
    enabled: enabled && jobDescription.length >= 20,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}
export default useRanking;
