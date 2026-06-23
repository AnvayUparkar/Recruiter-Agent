import { apiClient } from "../api/client";

export interface InterviewQuestion {
  question: string;
  reason: string;
  difficulty: string;
  category: string;
  follow_up: string;
}

export interface GeneratedQuestionsResponse {
  technical: InterviewQuestion[];
  behavioral: InterviewQuestion[];
  leadership: InterviewQuestion[];
  risk_validation: InterviewQuestion[];
  generated_at?: string;
  model?: string;
}

export interface GenerateInterviewQuestionsPayload {
  candidate: any;
  job_description: any;
  ranking?: any;
  behavior?: any;
  reliability?: any;
}

export const interviewQuestionService = {
  async generateInterviewQuestions(
    payload: GenerateInterviewQuestionsPayload
  ): Promise<GeneratedQuestionsResponse> {
    const response = await apiClient.post<GeneratedQuestionsResponse>(
      "/api/v1/copilot/generate-interview-questions",
      payload
    );
    return response.data;
  },
};
