export const API_BASE_PREFIX = "/api/v1";

export const ENDPOINTS = {
  JD_ANALYZE: `${API_BASE_PREFIX}/jd/analyze`,
  JD_EXTRACT_TEXT: `${API_BASE_PREFIX}/jd/extract-text`,
  RANK: `${API_BASE_PREFIX}/rank`,
  RETRIEVE: `${API_BASE_PREFIX}/retrieve`,
  EXPLAIN: `${API_BASE_PREFIX}/explain`,
  METRICS: `${API_BASE_PREFIX}/metrics`,
  HEALTH: `${API_BASE_PREFIX}/health`,
  VERSION: `${API_BASE_PREFIX}/version`,
  USER_RESUME_UPLOAD: `${API_BASE_PREFIX}/user/upload-resume`,
  USER_PROFILE: `${API_BASE_PREFIX}/user/profile`,
  USER_JD_SAVE: `${API_BASE_PREFIX}/user/jd`,
  USER_JOB_RECOMMENDATIONS: `${API_BASE_PREFIX}/jobs/recommendations`,
  CHAT_MESSAGES: `${API_BASE_PREFIX}/chat/messages`,
  CHAT_SEND: `${API_BASE_PREFIX}/chat/send`,
  CHAT_CONVERSATIONS: `${API_BASE_PREFIX}/chat/conversations`,
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
