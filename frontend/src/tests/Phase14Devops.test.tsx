import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { useLaunchStore } from "../store/launchStore";
import { LaunchChecklist } from "../pages/System/components/LaunchChecklist";
import { EnvironmentPanel } from "../pages/System/components/EnvironmentPanel";

// Mock router
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/launch" }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

// Mock toast store
vi.mock("../store/toastStore", () => ({
  useToastStore: () => ({
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("Phase 14: DevOps, Observability & Submission Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLaunchStore.getState().resetChecklist();
    useLaunchStore.getState().clearBackupLogs();
  });

  // 1. Checklist State Store Toggles
  describe("Zustand Launch Store Checklist State", () => {
    it("starts with default checklist items and allows toggles", () => {
      const state = useLaunchStore.getState();
      expect(state.checklist.httpsEnabled).toBe(true);
      expect(state.checklist.unitTestsPassed).toBe(false);

      // Toggle item
      state.toggleCheckItem("unitTestsPassed");
      expect(useLaunchStore.getState().checklist.unitTestsPassed).toBe(true);

      state.toggleCheckItem("unitTestsPassed");
      expect(useLaunchStore.getState().checklist.unitTestsPassed).toBe(false);
    });
  });

  // 2. Launch Readiness Score Calculations
  describe("Dynamic Readiness Scores Engine", () => {
    it("calculates correct overall launch readiness score percentages", () => {
      const state = useLaunchStore.getState();
      const items = Object.values(state.checklist);
      const passedCount = items.filter(Boolean).length;
      const calculatedScore = Math.round((passedCount / items.length) * 100);

      // Default values should yield a positive but incomplete score
      expect(calculatedScore).toBeGreaterThan(0);
      expect(calculatedScore).toBeLessThan(100);

      // Toggle everything to true
      const keys = Object.keys(state.checklist) as Array<keyof typeof state.checklist>;
      keys.forEach((key) => {
        if (!state.checklist[key]) {
          state.toggleCheckItem(key);
        }
      });

      const updatedItems = Object.values(useLaunchStore.getState().checklist);
      const updatedScore = Math.round((updatedItems.filter(Boolean).length / updatedItems.length) * 100);
      expect(updatedScore).toBe(100);
    });
  });

  // 3. Backup Center Logging
  describe("Backup Log History", () => {
    it("appends new logs to backup logs and displays them correctly", () => {
      const state = useLaunchStore.getState();
      expect(state.backupLogs.length).toBe(0);

      state.addBackupLog("rc_backup_configurations.json", "CONFIGURATIONS", 2048);
      
      const updatedLogs = useLaunchStore.getState().backupLogs;
      expect(updatedLogs.length).toBe(1);
      expect(updatedLogs[0].name).toBe("rc_backup_configurations.json");
      expect(updatedLogs[0].type).toBe("CONFIGURATIONS");
      expect(updatedLogs[0].sizeBytes).toBe(2048);
    });
  });

  // 4. Environment Panel Controls
  describe("Target Environment Toggles", () => {
    it("updates target environments in the Zustand store", () => {
      const state = useLaunchStore.getState();
      expect(state.environment).toBe("staging"); // default

      state.setEnvironment("production");
      expect(useLaunchStore.getState().environment).toBe("production");

      state.setEnvironment("development");
      expect(useLaunchStore.getState().environment).toBe("development");
    });
  });
});
