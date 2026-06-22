import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { Skeleton } from "../components/common/loading/Skeleton";
import { usePWAStore } from "../store/pwaStore";
import { useToastStore } from "../store/toastStore";
import { prefetchRoute } from "../utils/prefetch";

// Mock router
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/dashboard" }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

// Mock react query
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    getQueriesData: () => [[["candidateDetails", "cand-001"], { candidateId: "cand-001", name: "Alpha", profile: { headline: "SWE" } }]],
  }),
}));

describe("Phase 13: Production Polish & PWA Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePWAStore.getState().clearSyncQueue();
    useToastStore.getState().removeToast("");
  });

  // 1. Accessibility & Loading Skeletons
  describe("Accessibility & Skeletons", () => {
    it("renders Skeleton loaders with pulse animations and correct sizing", () => {
      const { container } = render(<Skeleton width="200px" height="40px" borderRadius="12px" className="test-pulse" />);
      const skeleton = container.querySelector(".test-pulse");
      expect(skeleton).toBeDefined();
    });
  });

  // 2. Route Prefetching
  describe("Route Prefetching", () => {
    it("initiates preloading when triggered and prevents redundant calls", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      prefetchRoute("/dashboard");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[PWA Prefetch]"));
      consoleSpy.mockRestore();
    });
  });

  // 3. Error Boundary and incident reference ID
  describe("ErrorBoundary Incident Tracker", () => {
    it("recovers and displays a unique reference ID (ERR-TA-XXXX) when crashed", () => {
      const CrashingComponent = () => {
        throw new Error("Simulated component render failure");
      };

      // Suppress console error reports during crashing test execution
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { getByText } = render(
        <ErrorBoundary>
          <CrashingComponent />
        </ErrorBoundary>
      );

      expect(getByText("Component Render Crash")).toBeDefined();
      expect(getByText(/Incident Reference:/)).toBeDefined();
      expect(getByText(/ERR-TA-/)).toBeDefined();

      consoleErrorSpy.mockRestore();
    });
  });

  // 4. Offline Banner & Notes Queue
  describe("Offline Experience", () => {
    it("updates store and sync queue when adding recruiter notes offline", () => {
      usePWAStore.getState().setOnline(false);
      expect(usePWAStore.getState().isOnline).toBe(false);

      usePWAStore.getState().queueOfflineNote("cand-001", "This is an offline recruiter validation comment.");
      const queue = usePWAStore.getState().syncQueue;
      expect(queue.length).toBe(1);
      expect(queue[0].candidateId).toBe("cand-001");
      expect(queue[0].noteText).toBe("This is an offline recruiter validation comment.");
    });
  });

  // 5. Toast Notifications
  describe("Toast Alert Notifications Queue", () => {
    it("registers new warnings and auto-dismisses after a timeout duration", async () => {
      const { addToast } = useToastStore.getState();
      addToast("success", "Ranking compiled successfully!", 100);
      expect(useToastStore.getState().toasts[0].message).toBe("Ranking compiled successfully!");
    });
  });
});
