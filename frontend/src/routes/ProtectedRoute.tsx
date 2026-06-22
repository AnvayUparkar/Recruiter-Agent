import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute wraps routes that require authentication.
 * For the hackathon preview, we check a mock localStorage flag (defaulting to true)
 * to demonstrate clean redirect guards without blocking standard entry.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Mock authentication check: checks local storage or defaults to authenticated
  const isAuthenticated = localStorage.getItem("recruiter_authenticated") !== "false";

  if (!isAuthenticated) {
    // Redirect to home/login if not authenticated
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
