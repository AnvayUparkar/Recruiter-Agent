import { apiClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

export interface RecommendedJob {
  title: string;
  company: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  employment_type: string;
  description: string;
  required_skills: string[];
  redirect_url: string;
  created_at: string;
  source: string;
  match_score: number;
}

export interface JobRecommendationsResponse {
  status: string;
  data: {
    jobs: RecommendedJob[];
  };
}

export const jobService = {
  /**
   * Fetches job recommendations based on candidate skills.
   * 
   * @param skills Array of skills to search for
   */
  async getRecommendations(skills: string[]): Promise<RecommendedJob[]> {
    if (!skills || skills.length === 0) {
      return [];
    }
    
    try {
      const skillsParam = skills.join(",");
      const response = await apiClient.get<JobRecommendationsResponse>(
        `${ENDPOINTS.USER_JOB_RECOMMENDATIONS}?skills=${encodeURIComponent(skillsParam)}`
      );
      
      if (response.data && response.data.data && response.data.data.jobs) {
        return response.data.data.jobs;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch job recommendations:", error);
      return [];
    }
  }
};
