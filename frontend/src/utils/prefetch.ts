// Route Prefetch Map aligning with lazy page imports in AppRouter
const prefetchMap: Record<string, () => Promise<any>> = {
  "/": () => import("../pages/Landing"),
  "/dashboard": () => import("../pages/RankingDashboard"),
  "/jd-analysis": () => import("../pages/JDAnalysis"),
  "/copilot": () => import("../pages/RecruiterCopilot"),
  "/comparison": () => import("../pages/CandidateComparison"),
  "/analytics": () => import("../pages/Analytics"),
  "/reports": () => import("../pages/Reports"),
  "/settings": () => import("../pages/Settings"),
  "/admin": () => import("../pages/Admin"),
  "/demo": () => import("../pages/Demo"),
};

const prefetchedPaths = new Set<string>();

/**
 * Prefetches the code bundle for a given route path on hover or event trigger.
 * Deduplicates calls to prevent redundant downloads.
 */
export const prefetchRoute = (path: string) => {
  // Normalize parameters
  let targetPath = path;
  if (path.startsWith("/candidates/")) {
    targetPath = "/candidates/:candidateId";
  }

  if (prefetchedPaths.has(targetPath)) {
    return;
  }

  const loadPage = prefetchMap[targetPath];
  if (loadPage) {
    prefetchedPaths.add(targetPath);
    console.log(`[PWA Prefetch] Preloading javascript chunk for: ${targetPath}`);
    loadPage().catch((err) => {
      console.warn(`[PWA Prefetch] Failed preloading route: ${targetPath}`, err);
      prefetchedPaths.delete(targetPath); // Allow retry if failed
    });
  }
};
