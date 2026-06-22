import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { reportService } from "../../services/reportService";
import { ReportExportResponse } from "../../types/report";
import { ApiError } from "../../utils/errors/ApiError";

interface ExportReportParams {
  candidateId: string;
  format: "json" | "markdown" | "html";
}

/**
 * Mutation hook to export and download candidate review reports.
 */
export function useExportReport(): UseMutationResult<
  ReportExportResponse,
  ApiError,
  ExportReportParams,
  unknown
> {
  return useMutation<ReportExportResponse, ApiError, ExportReportParams>({
    mutationFn: ({ candidateId, format }) => reportService.exportReport(candidateId, format),
    onSuccess: (data) => {
      console.log(`Successfully exported report to: ${data.filePath}`);
    },
    onError: (err) => {
      console.error("Report generation failed:", err.message);
    },
  });
}
