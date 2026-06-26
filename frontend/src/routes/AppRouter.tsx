import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { RouteTransition } from "./RouteTransition";
import { GlobalLoader } from "../components/common/GlobalLoader";
import { ErrorBoundary } from "../components/common/ErrorBoundary";

// Lazy-loaded pages
const Landing = lazy(() => import("../pages/Landing"));
const JDAnalysis = lazy(() => import("../pages/JDAnalysis"));
const RankingDashboard = lazy(() => import("../pages/RankingDashboard"));
const CandidateProfile = lazy(() => import("../pages/CandidateProfile"));
const RecruiterCopilot = lazy(() => import("../pages/RecruiterCopilot"));
const CandidateComparison = lazy(() => import("../pages/CandidateComparison"));
const RealTimeCandidatesPage = lazy(() => import("../pages/recruiter/RealTimeCandidatesPage"));
const Analytics = lazy(() => import("../pages/Analytics"));
const Reports = lazy(() => import("../pages/Reports"));
const Settings = lazy(() => import("../pages/Settings"));
const Admin = lazy(() => import("../pages/Admin"));
const DesignSystemPreview = lazy(() => import("../pages/DesignSystemPreview"));
const Demo = lazy(() => import("../pages/Demo"));
const NotFound = lazy(() => import("../pages/NotFound"));
const LaunchCenterPage = lazy(() => import("../pages/System/LaunchCenterPage"));

// Auth pages
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const SignupPage = lazy(() => import("../pages/auth/SignupPage"));
const ForgotPasswordPlaceholder = lazy(() => import("../pages/auth/ForgotPasswordPlaceholder"));

// User pages
const UserProfilePage = lazy(() => import("../pages/user/UserProfilePage"));
const UserDashboardPage = lazy(() => import("../pages/user/UserDashboardPage"));
const UserResumePage = lazy(() => import("../pages/user/UserResumePage"));

// Layout wrappers
const AppLayout = lazy(() => import("../layouts/AppLayout/AppLayout"));
const EmptyLayout = lazy(() => import("../components/common/EmptyLayout"));

/**
 * Helper component to wrap route elements with Suspense, ErrorBoundary,
 * and Framer Motion RouteTransition animations.
 */
interface RouteWrapperProps {
  element: React.ReactNode;
  protectedRoute?: boolean;
  allowedRoles?: ("user" | "recruiter")[];
  useAppLayout?: boolean;
}

const RouteWrapper: React.FC<RouteWrapperProps> = ({
  element,
  protectedRoute = true,
  allowedRoles,
  useAppLayout = true,
}) => {
  const content = (
    <ErrorBoundary>
      <Suspense fallback={<GlobalLoader />}>
        <RouteTransition>{element}</RouteTransition>
      </Suspense>
    </ErrorBoundary>
  );

  const guardedContent = protectedRoute ? (
    <ProtectedRoute allowedRoles={allowedRoles}>{content}</ProtectedRoute>
  ) : (
    content
  );

  if (useAppLayout) {
    return (
      <Suspense fallback={<GlobalLoader />}>
        <AppLayout>{guardedContent}</AppLayout>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<GlobalLoader />}>
      <EmptyLayout>{guardedContent}</EmptyLayout>
    </Suspense>
  );
};

export const router = createBrowserRouter([
  // Guest Landing / Entry Page
  {
    path: "/",
    element: (
      <RouteWrapper
        element={<Landing />}
        protectedRoute={false}
        useAppLayout={false}
      />
    ),
  },
  // Auth Pages
  {
    path: "/login",
    element: <RouteWrapper element={<LoginPage />} protectedRoute={false} useAppLayout={false} />,
  },
  {
    path: "/signup",
    element: <RouteWrapper element={<SignupPage />} protectedRoute={false} useAppLayout={false} />,
  },
  {
    path: "/forgot-password",
    element: <RouteWrapper element={<ForgotPasswordPlaceholder />} protectedRoute={false} useAppLayout={false} />,
  },
  // Recruiter TA Pages (Protected, using AppLayout)
  {
    path: "/dashboard",
    element: <RouteWrapper element={<RankingDashboard />} allowedRoles={["recruiter"]} />,
  },
  {
    path: "/jd-analysis",
    element: <RouteWrapper element={<JDAnalysis />} allowedRoles={["recruiter"]} />,
  },
  {
    path: "/candidates",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/candidates/:candidateId",
    element: <RouteWrapper element={<CandidateProfile />} allowedRoles={["recruiter"]} />,
  },
  {
    path: "/copilot",
    element: <RouteWrapper element={<RecruiterCopilot />} allowedRoles={["recruiter"]} />,
  },
  {
    path: "/comparison",
    element: <RouteWrapper element={<CandidateComparison />} allowedRoles={["recruiter"]} />,
  },
  {
    path: "/real-time-candidates",
    element: <RouteWrapper element={<RealTimeCandidatesPage />} allowedRoles={["recruiter"]} />,
  },
  {
    path: "/analytics",
    element: <RouteWrapper element={<Analytics />} allowedRoles={["recruiter"]} />,
  },
  {
    path: "/reports",
    element: <RouteWrapper element={<Reports />} allowedRoles={["recruiter"]} />,
  },
  {
    path: "/settings",
    element: <RouteWrapper element={<Settings />} allowedRoles={["recruiter", "user"]} />,
  },
  {
    path: "/admin",
    element: <RouteWrapper element={<Admin />} allowedRoles={["recruiter"]} />,
  },
  {
    path: "/launch",
    element: <RouteWrapper element={<LaunchCenterPage />} allowedRoles={["recruiter"]} />,
  },
  // User Pages
  {
    path: "/profile",
    element: <RouteWrapper element={<UserProfilePage />} allowedRoles={["user"]} />,
  },
  {
    path: "/user-dashboard",
    element: <RouteWrapper element={<UserDashboardPage />} allowedRoles={["user"]} />,
  },
  {
    path: "/resume",
    element: <RouteWrapper element={<UserResumePage />} allowedRoles={["user"]} />,
  },
  // Public Shared
  {
    path: "/demo",
    element: (
      <RouteWrapper
        element={<Demo />}
        protectedRoute={false}
        useAppLayout={false}
      />
    ),
  },
  // Design System Preview (Accessible standalone)
  {
    path: "/design-system",
    element: (
      <RouteWrapper
        element={<DesignSystemPreview />}
        protectedRoute={false}
        useAppLayout={false}
      />
    ),
  },
  // 404 Pages
  {
    path: "/not-found",
    element: (
      <RouteWrapper
        element={<NotFound />}
        protectedRoute={false}
        useAppLayout={false}
      />
    ),
  },
  {
    path: "*",
    element: <Navigate to="/not-found" replace />,
  },
]);

export default router;
