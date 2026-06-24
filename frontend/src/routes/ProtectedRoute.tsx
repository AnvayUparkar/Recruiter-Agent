import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("user" | "recruiter")[];
}

/**
 * ProtectedRoute — HACKATHON MODE
 *
 * Auth enforcement is disabled so judges and reviewers can navigate freely.
 * The login/signup pages still exist and the JWT flow still works end-to-end,
 * but no route is blocked for unauthenticated visitors.
 *
 * To re-enable production enforcement, swap the body below with:
 *   const { isAuthenticated, user } = useAuthStore();
 *   if (!isAuthenticated) return <Navigate to="/login" ... />;
 *   if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate ... />;
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export const RecruiterRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export default ProtectedRoute;

