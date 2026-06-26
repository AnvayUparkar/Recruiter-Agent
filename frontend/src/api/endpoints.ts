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
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
