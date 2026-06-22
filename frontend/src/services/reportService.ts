import { apiClient } from "../api/client";
import { ReportExportResponse } from "../types/report";

export const reportService = {
  /**
   * Generates and writes formatted candidate review reports to disk.
   * 
   * @param candidateId Target candidate.
   * @param format 'json' | 'markdown' | 'html'.
   */
  async exportReport(
    candidateId: string,
    format: "json" | "markdown" | "html" = "json"
  ): Promise<ReportExportResponse> {
    const response = await apiClient.post<ReportExportResponse>("/api/v1/report/export", {
      candidate_id: candidateId,
      format_type: format,
    });
    return response.data;
  },
};
export type ReportService = typeof reportService;
