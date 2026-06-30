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
const JobPostingForm = lazy(() => import("../pages/JobPosting").then(module => ({ default: module.JobPostingForm })));
const JobPostingsList = lazy(() => import("../pages/JobPosting/JobPostingsList"));
const JobWorkspace = lazy(() => import("../pages/JobPosting/JobWorkspace"));

// Auth pages
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const SignupPage = lazy(() => import("../pages/auth/SignupPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));

// User pages
const UserProfilePage = lazy(() => import("../pages/user/UserProfilePage"));
const UserDashboardPage = lazy(() => import("../pages/user/UserDashboardPage"));
const UserResumePage = lazy(() => import("../pages/user/UserResumePage"));
const CandidateJobsPage = lazy(() => import("@/pages/user/CandidateJobsPage"));
const CandidateJobDetailsPage = lazy(() => import("@/pages/user/CandidateJobDetailsPage"));
const MyApplicationsPage = lazy(() => import("@/pages/user/MyApplicationsPage"));
// End user candidate pages

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
    element: <RouteWrapper element={<ForgotPasswordPage />} protectedRoute={false} useAppLayout={false} />,
  },
  // Recruiter TA Pages (Protected, using AppLayout)
  {
    path: "/dashboard",
    element: <RouteWrapper element={<RankingDashboard />} protectedRoute={false} />,
  },
  {
    path: "/jd-analysis",
    element: <RouteWrapper element={<JDAnalysis />} protectedRoute={false} />,
  },
  {
    path: "/candidates",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/candidates/:candidateId",
    element: <RouteWrapper element={<CandidateProfile />} protectedRoute={false} />,
  },
  {
    path: "/copilot",
    element: <RouteWrapper element={<RecruiterCopilot />} protectedRoute={false} />,
  },
  {
    path: "/comparison",
    element: <RouteWrapper element={<CandidateComparison />} protectedRoute={false} />,
  },
  {
    path: "/real-time-candidates",
    element: <RouteWrapper element={<RealTimeCandidatesPage />} protectedRoute={false} />,
  },
  {
    path: "/analytics",
    element: <RouteWrapper element={<Analytics />} protectedRoute={false} />,
  },
  {
    path: "/jobs/create",
    element: <RouteWrapper element={<JobPostingForm />} protectedRoute={false} />,
  },
  {
    path: "/recruiter/jobs",
    element: <RouteWrapper element={<JobPostingsList />} protectedRoute={false} />,
  },
  {
    path: "/recruiter/jobs/:jobId",
    element: <RouteWrapper element={<JobWorkspace />} protectedRoute={false} />,
  },
  {
    path: "/jobs/:id/candidates",
    element: <Navigate to="/recruiter/jobs" replace />,
  },
  {
    path: "/reports",
    element: <RouteWrapper element={<Reports />} protectedRoute={false} />,
  },
  {
    path: "/settings",
    element: <RouteWrapper element={<Settings />} protectedRoute={false} />,
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
  {
    path: "/portal/jobs",
    element: <RouteWrapper element={<CandidateJobsPage />} allowedRoles={["user"]} />,
  },
  {
    path: "/portal/jobs/:id",
    element: <RouteWrapper element={<CandidateJobDetailsPage />} allowedRoles={["user"]} />,
  },
  {
    path: "/portal/applications",
    element: <RouteWrapper element={<MyApplicationsPage />} allowedRoles={["user"]} />,
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
