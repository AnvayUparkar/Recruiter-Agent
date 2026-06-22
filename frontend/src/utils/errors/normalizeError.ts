import { AxiosError } from "axios";
import { ApiError } from "./ApiError";
import { ERROR_MESSAGES, getErrorMessageByStatus } from "./errorMessages";

export function normalizeError(error: any): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  // Check if error matches Axios error pattern
  if (error && (error.isAxiosError || error.config)) {
    const axiosError = error as AxiosError<any>;
    const status = axiosError.response?.status || 0;
    const responseData = axiosError.response?.data;

    let message = responseData?.error || responseData?.message || axiosError.message;
    const code = responseData?.code || axiosError.code;

    if (axiosError.code === "ECONNABORTED") {
      message = ERROR_MESSAGES.TIMEOUT_ERROR;
      return new ApiError(message, 408, "TIMEOUT", axiosError.config);
    }

    if (!axiosError.response) {
      message = ERROR_MESSAGES.NETWORK_ERROR;
      return new ApiError(message, 0, "NETWORK_ERROR");
    }

    if (!responseData?.error && !responseData?.message) {
      message = getErrorMessageByStatus(status);
    }

    return new ApiError(message, status, code, responseData?.details || responseData);
  }

  const genericMsg = error instanceof Error ? error.message : String(error);
  return new ApiError(genericMsg, 500, "UNKNOWN_ERROR");
}
