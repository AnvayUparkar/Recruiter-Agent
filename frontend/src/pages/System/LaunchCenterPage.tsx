import React, { useEffect, useState } from "react";
import { Server, Shield, Terminal } from "lucide-react";
import { useLaunchStore } from "../../store/launchStore";

// Import all 15 components
import LaunchChecklist from "./components/LaunchChecklist";
import DeploymentStatusCard from "./components/DeploymentStatusCard";
import EnvironmentPanel from "./components/EnvironmentPanel";
import SecurityDashboard from "./components/SecurityDashboard";
import SecretsValidator from "./components/SecretsValidator";
import MonitoringPanel from "./components/MonitoringPanel";
import PerformanceOverview from "./components/PerformanceOverview";
import BackupCenter from "./components/BackupCenter";
import RestoreCenter from "./components/RestoreCenter";
import HealthTimeline from "./components/HealthTimeline";
import ReleaseNotesPanel from "./components/ReleaseNotesPanel";
import VersionInfoCard from "./components/VersionInfoCard";
import BuildVerificationPanel from "./components/BuildVerificationPanel";
import JudgePresentationPanel from "./components/JudgePresentationPanel";
import FinalSubmissionPanel from "./components/FinalSubmissionPanel";

export const LaunchCenterPage: React.FC = () => {
  const { checklist } = useLaunchStore();
  const [reducedMotion, setReducedMotion] = useState(false);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Calculate dynamic scores (0-100) based on checklist items
  const securityItems = [
    checklist.httpsEnabled,
    checklist.secretsExternalized,
    checklist.corsConfigured,
    checklist.rateLimitingEnabled,
    checklist.authSecure,
  ];
  const securityScore = Math.round((securityItems.filter(Boolean).length / securityItems.length) * 100);

  const performanceItems = [
    checklist.unitTestsPassed,
    checklist.monitoringConfigured,
    checklist.offlineReady,
  ];
  const performanceScore = Math.round((performanceItems.filter(Boolean).length / performanceItems.length) * 100);

  const accessibilityItems = [
    checklist.accessibilityAudited,
    checklist.responsiveVerified,
  ];
  const accessibilityScore = Math.round((accessibilityItems.filter(Boolean).length / accessibilityItems.length) * 100);

  const totalChecks = Object.values(checklist);
  const overallScore = Math.round((totalChecks.filter(Boolean).length / totalChecks.length) * 100);

  // Score Ring renderer helper
  const renderScoreRing = (score: number, label: string, strokeColor: string) => {
    const radius = 30;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;

    return (
      <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200/5 dark:border-slate-800/40 bg-slate-200/20 dark:bg-slate-950/30 flex-1 min-w-[120px]">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              className="stroke-slate-300 dark:stroke-slate-850"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              className={`transition-all ${reducedMotion ? "duration-0" : "duration-700 ease-out"}`}
              strokeWidth="5"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke={strokeColor}
              fill="transparent"
            />
          </svg>
          <span className="absolute text-xs font-black text-slate-855 dark:text-slate-100 font-mono">
            {score}%
          </span>
        </div>
        <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider mt-2.5 text-center leading-none">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 flex flex-col gap-6 max-w-7xl min-h-screen">
      {/* Top Header Cockpit */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-200/10 dark:border-slate-805">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Terminal size={20} className="text-blue-500 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-black text-slate-850 dark:text-slate-100 uppercase tracking-wide">
              DevOps & Launch Cockpit
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1">
            System status monitoring, security verification checkpoints, and final hackathon presentation tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-[9px] font-extrabold uppercase tracking-wider">
            <Server size={10} />
            <span>Phase 14 Active</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider">
            <Shield size={10} />
            <span>Audited</span>
          </span>
        </div>
      </div>

      {/* Dynamic Circular Readiness Scores Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {renderScoreRing(overallScore, "Launch Readiness", "#3b82f6")}
        {renderScoreRing(securityScore, "Security Audit", "#10b981")}
        {renderScoreRing(performanceScore, "Performance KPI", "#f59e0b")}
        {renderScoreRing(accessibilityScore, "Accessibility AA", "#8b5cf6")}
      </div>

      {/* Main Multi-Column Cockpit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Infrastructures & Health */}
        <div className="flex flex-col gap-6">
          <EnvironmentPanel />
          <DeploymentStatusCard />
          <HealthTimeline />
          <BackupCenter />
          <RestoreCenter />
        </div>

        {/* Column 2: System Standards & Diagnostics */}
        <div className="flex flex-col gap-6">
          <LaunchChecklist />
          <MonitoringPanel />
          <PerformanceOverview />
          <SecurityDashboard />
          <SecretsValidator />
        </div>

        {/* Column 3: Presentation & Packaging */}
        <div className="flex flex-col gap-6">
          <JudgePresentationPanel />
          <FinalSubmissionPanel />
          <BuildVerificationPanel />
          <ReleaseNotesPanel />
          <VersionInfoCard />
        </div>

      </div>
    </div>
  );
};

export default LaunchCenterPage;
