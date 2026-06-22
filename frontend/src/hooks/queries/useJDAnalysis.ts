import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { jdService } from "../../services/jdService";
import { ParsedJD } from "../../types/common";
import { ApiError } from "../../utils/errors/ApiError";

/**
 * Mutation hook to parse and analyze job description specifications.
 */
export function useJDAnalysis(): UseMutationResult<
  ParsedJD,
  ApiError,
  string, // raw text input
  unknown
> {
  return useMutation<ParsedJD, ApiError, string>({
    mutationFn: (jdText: string) => jdService.analyzeJD(jdText),
    onError: (error) => {
      console.error("Failed to analyze Job Description:", error.message);
    },
  });
}
