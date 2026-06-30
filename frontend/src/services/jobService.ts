import { apiClient } from "../api/client";
import { ENDPOINTS, API_BASE_PREFIX } from "../api/endpoints";

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

export interface JobPostingDataResponse {
  status: string;
  data: any;
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
  },

  async createJob(jobData: any): Promise<any> {
    const response = await apiClient.post<JobPostingDataResponse>(`${API_BASE_PREFIX}/jobs`, jobData);
    return response.data.data;
  },

  async getJobs(): Promise<any[]> {
    const token = localStorage.getItem("recruiter_auth_token");
    if (!token) return [];
    
    const response = await apiClient.get<JobPostingDataResponse>(`${API_BASE_PREFIX}/jobs`);
    return response.data.data || [];
  },

  async getJob(id: string): Promise<any> {
    const response = await apiClient.get<JobPostingDataResponse>(`${API_BASE_PREFIX}/jobs/${id}`);
    return response.data.data;
  },

  async updateJob(id: string, jobData: any): Promise<void> {
    await apiClient.put(`${API_BASE_PREFIX}/jobs/${id}`, jobData);
  },

  async deleteJob(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE_PREFIX}/jobs/${id}`);
  },

  async publishJob(id: string): Promise<void> {
    await apiClient.post(`${API_BASE_PREFIX}/jobs/${id}/publish`);
  },

  async getJobCandidates(id: string): Promise<any[]> {
    const response = await apiClient.get<JobPostingDataResponse>(`${API_BASE_PREFIX}/jobs/${id}/candidates`);
    return response.data.data || [];
  },

  async regenerateMatches(id: string): Promise<void> {
    await apiClient.post(`${API_BASE_PREFIX}/jobs/${id}/regenerate`);
  },

  async getJobAnalytics(id: string): Promise<any> {
    const response = await apiClient.get<JobPostingDataResponse>(`${API_BASE_PREFIX}/jobs/${id}/analytics`);
    return response.data.data;
  },

  async updateApplicantStage(jobId: string, candidateId: string, stage: string): Promise<void> {
    await apiClient.put(`${API_BASE_PREFIX}/jobs/${jobId}/applicants/${candidateId}/stage`, { stage });
  }
};
