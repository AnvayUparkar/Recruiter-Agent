import axios, { AxiosRequestConfig } from "axios";
import { normalizeError } from "../utils/errors/normalizeError";

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  retry?: number;
  retryCount?: number;
}

const API_TIMEOUT_MS = 180000;  // 3 minutes — covers the longest /rank pipeline
const MAX_RETRIES = 1;          // Only retry once (not on ranking endpoints)
const RETRY_DELAY_MS = 1000;

export const apiClient = axios.create({
  baseURL: (import.meta.env?.VITE_API_URL as string) || "http://localhost:5000",
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: Inject headers and standard trackers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("recruiter_auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(normalizeError(error));
  }
);

// Response interceptor: Automated retries for network/5xx errors, and error normalization
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as CustomAxiosRequestConfig;
    
    if (!config) {
      return Promise.reject(normalizeError(error));
    }

    config.retry = config.retry ?? MAX_RETRIES;
    config.retryCount = config.retryCount ?? 0;

    // Retry only on non-timeout network errors or 5xx server errors.
    // Do NOT retry on ECONNABORTED/timeout (code 'ECONNABORTED' or status 408)
    // to avoid flooding long-running endpoints like /rank.
    const isTimeout = error.code === 'ECONNABORTED' || error.response?.status === 408;
    const isNetworkError = !error.response && !isTimeout;
    const isServerError = error.response && error.response.status >= 500;
    const shouldRetry = (isNetworkError || isServerError) && !isTimeout;

    if (shouldRetry && config.retryCount < config.retry) {
      config.retryCount += 1;
      
      // Backoff delay delay multiplier
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * config.retryCount!));
      
      return apiClient(config);
    }

    // Handle 401 Unauthorized globally
    if (error.response && error.response.status === 401) {
      // Dynamically import to avoid circular dependencies at boot
      import("../store/authStore").then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/login" && window.location.pathname !== "/" && window.location.pathname !== "/signup") {
          window.location.href = "/login";
        }
      });
    }

    return Promise.reject(normalizeError(error));
  }
);
