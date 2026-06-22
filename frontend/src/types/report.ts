export interface ReportExportOptions {
  candidateId: string;
  format: "json" | "markdown" | "html";
}

export interface ReportExportResponse {
  filePath: string;
  content: string;
  format: "json" | "markdown" | "html";
}
