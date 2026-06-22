export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Failed to connect to the recruitment platform. Please check your internet connection.",
  TIMEOUT_ERROR: "Request timed out. The server took too long to analyze the candidate profiles.",
  UNAUTHORIZED: "Session expired. Please log in again to access the talent pipeline.",
  FORBIDDEN: "You do not have permissions to access these candidate details.",
  NOT_FOUND: "The requested candidate or report could not be found.",
  SERVER_ERROR: "An internal server error occurred in our ranking engine. Please try again later.",
  VALIDATION_ERROR: "Invalid query parameters sent to the ranking pipeline.",
  UNKNOWN: "An unexpected error occurred. Please contact system support.",
} as const;

export function getErrorMessageByStatus(status: number): string {
  if (status === 401) return ERROR_MESSAGES.UNAUTHORIZED;
  if (status === 403) return ERROR_MESSAGES.FORBIDDEN;
  if (status === 404) return ERROR_MESSAGES.NOT_FOUND;
  if (status === 422 || status === 400) return ERROR_MESSAGES.VALIDATION_ERROR;
  if (status >= 500) return ERROR_MESSAGES.SERVER_ERROR;
  return ERROR_MESSAGES.UNKNOWN;
}
