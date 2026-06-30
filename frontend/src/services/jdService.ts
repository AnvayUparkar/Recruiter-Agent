import { apiClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { ParsedJD } from "../types/common";

export interface JDAnalyzeResponse {
  parsed_jd: ParsedJD;
  requirements: any;
  summary: string;
}

export const jdService = {
  /**
   * Submits a raw job description for lexical and semantic requirement analysis.
   * 
   * @param jobDescription Raw job description text.
   * @returns ParsedJD structured criteria representation.
   */
  async analyzeJD(jobDescription: string): Promise<ParsedJD> {
    const response = await apiClient.post<JDAnalyzeResponse>(ENDPOINTS.JD_ANALYZE, {
      job_description: jobDescription,
    });
    
    const parsedJd = response.data.parsed_jd;
    
    // Map snake_case keys to camelCase keys for general frontend backwards compatibility
    parsedJd.jobTitle = parsedJd.job_title;
    parsedJd.companyName = parsedJd.company_name;
    parsedJd.experienceRange = parsedJd.experience_range;
    parsedJd.mustHave = parsedJd.must_have;
    parsedJd.niceToHave = parsedJd.good_to_have;
    parsedJd.rawText = parsedJd.raw_text;
    parsedJd.workMode = parsedJd.work_mode;
    parsedJd.salaryRange = parsedJd.salary_range;
    parsedJd.noticePeriod = parsedJd.notice_period;
    parsedJd.preferredQualifications = parsedJd.preferred_qualifications;
    parsedJd.employmentType = "Full-Time";

    // Polyfill array-of-strings lists of required and preferred skills
    parsedJd.required_skills = parsedJd.must_have.map(r => r.name);
    parsedJd.preferred_skills = parsedJd.good_to_have.map(r => r.name);

    return parsedJd;
  },

  /**
   * Submits a document (TXT, PDF, Word) to extract its text content on the backend.
   * 
   * @param file User selected file object.
   * @returns Extracted raw text.
   */
  async extractText(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await apiClient.post<{ text: string }>(
      ENDPOINTS.JD_EXTRACT_TEXT,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.text;
  },

  /**
   * Saves the parsed JD to the backend (MongoDB) for the authenticated recruiter.
   * 
   * @param parsedJd The structured ParsedJD object to save.
   */
  async saveParsedJD(parsedJd: ParsedJD): Promise<void> {
    const token = localStorage.getItem("recruiter_auth_token");
    if (!token) return;
    
    await apiClient.post(ENDPOINTS.USER_JD_SAVE, {
      parsed_jd: parsedJd
    });
  },
};
export type JdService = typeof jdService;
