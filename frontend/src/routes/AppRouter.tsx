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
const Analytics = lazy(() => import("../pages/Analytics"));
const Reports = lazy(() => import("../pages/Reports"));
const Settings = lazy(() => import("../pages/Settings"));
const Admin = lazy(() => import("../pages/Admin"));
const DesignSystemPreview = lazy(() => import("../pages/DesignSystemPreview"));
const Demo = lazy(() => import("../pages/Demo"));
const NotFound = lazy(() => import("../pages/NotFound"));
const LaunchCenterPage = lazy(() => import("../pages/System/LaunchCenterPage"));

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
  useAppLayout?: boolean;
}

const RouteWrapper: React.FC<RouteWrapperProps> = ({
  element,
  protectedRoute = true,
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
    <ProtectedRoute>{content}</ProtectedRoute>
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
  // Dashboard & TA Pages (Protected, using AppLayout)
  {
    path: "/dashboard",
    element: <RouteWrapper element={<RankingDashboard />} />,
  },
  {
    path: "/jd-analysis",
    element: <RouteWrapper element={<JDAnalysis />} />,
  },
  {
    path: "/candidates",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/candidates/:candidateId",
    element: <RouteWrapper element={<CandidateProfile />} />,
  },
  {
    path: "/copilot",
    element: <RouteWrapper element={<RecruiterCopilot />} />,
  },
  {
    path: "/comparison",
    element: <RouteWrapper element={<CandidateComparison />} />,
  },
  {
    path: "/analytics",
    element: <RouteWrapper element={<Analytics />} />,
  },
  {
    path: "/reports",
    element: <RouteWrapper element={<Reports />} />,
  },
  {
    path: "/settings",
    element: <RouteWrapper element={<Settings />} />,
  },
  {
    path: "/admin",
    element: <RouteWrapper element={<Admin />} />,
  },
  {
    path: "/launch",
    element: <RouteWrapper element={<LaunchCenterPage />} />,
  },
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
