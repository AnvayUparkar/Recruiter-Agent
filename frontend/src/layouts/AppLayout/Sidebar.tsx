import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileSearch,
  Bot,
  GitCompare,
  BarChart3,
  FileDown,
  Settings,
  ChevronLeft,
  ChevronRight,
  Server,
  Shield,
  Terminal,
  User as UserIcon,
  FileText,
  Users,
  Briefcase
} from "lucide-react";
import { NavItem } from "../../components/navigation/NavItem";
import { NavSection } from "../../components/navigation/NavSection";
import { SidebarGroup } from "../../components/navigation/SidebarGroup";
import { useLayoutStore } from "../../store/layoutStore";
import { useCandidateStore } from "../../store/candidateStore";
import { useAuthStore } from "../../store/authStore";
import { healthService } from "../../services/healthService";
import { useResponsive } from "../ResponsiveLayout";

interface SidebarProps {}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { isSidebarOpen, setSidebarOpen } = useLayoutStore();
  const { comparisonCandidateIds } = useCandidateStore();
  const { user } = useAuthStore();
  const isRecruiter = user?.role !== "user";
  const [healthStatus, setHealthStatus] = useState<"healthy" | "unhealthy" | "checking">("checking");
  const shouldReduceMotion = useReducedMotion();

  // Fetch health status from Flask API
  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      try {
        const data = await healthService.fetchHealth();
        if (active) {
          setHealthStatus(data.status === "healthy" ? "healthy" : "unhealthy");
        }
      } catch (err) {
        if (active) {
          setHealthStatus("unhealthy");
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check health every 30s
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);


  const { isMobile } = useResponsive();

  // Only render on md+ screens — MobileMenu handles mobile navigation
  if (isMobile) {
    return null;
  }

  // Width changes
  const expandedWidth = 280;
  const collapsedWidth = 84;

  const sidebarVariants = {
    expanded: { width: expandedWidth },
    collapsed: { width: collapsedWidth },
  };

  const springConfig = { type: "spring", stiffness: 350, damping: 32 };

  return (
    <motion.aside
      initial={isSidebarOpen ? "expanded" : "collapsed"}
      animate={isSidebarOpen ? "expanded" : "collapsed"}
      variants={sidebarVariants}
      transition={shouldReduceMotion ? { duration: 0.15 } : springConfig}
      className="hidden md:flex sticky top-0 h-screen z-40 flex-col bg-slate-150/40 dark:bg-slate-950/40 glass-panel border-r border-slate-200/10 dark:border-slate-800/50 shadow-xl overflow-visible shrink-0"
    >
      {/* Header Container */}
      <div className="h-20 border-b border-slate-200/10 dark:border-slate-800/50 flex items-center justify-between px-6 shrink-0 overflow-hidden">
        <Link to="/" className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity outline-none rounded-lg focus-ring">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-500/20 shrink-0">
            NR
          </div>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="flex flex-col truncate"
            >
              <span className="font-extrabold text-sm tracking-wide text-slate-900 dark:text-slate-100">
                Nexa AI
              </span>
              <span className="text-[10px] text-blue-550 font-bold tracking-wider uppercase">
                Recruiter Copilot
              </span>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto custom-scrollbar select-none">
        {isRecruiter ? (
          <>
            {/* Main Section */}
            <SidebarGroup>
              <NavSection label="Candidate Sourcing" isCollapsed={!isSidebarOpen} />
              <NavItem
                label="JD Parser"
                path="/jd-analysis"
                icon={FileSearch}
                isCollapsed={!isSidebarOpen}
              />
              <NavItem
                label="Leaderboard"
                path="/dashboard"
                icon={LayoutDashboard}
                isCollapsed={!isSidebarOpen}
              />
              <NavItem
                label="Real-Time Candidates"
                path="/real-time-candidates"
                icon={Users}
                isCollapsed={!isSidebarOpen}
              />
              <NavItem
                label="Create Job Posting"
                path="/jobs/create"
                icon={Briefcase}
                isCollapsed={!isSidebarOpen}
              />
            </SidebarGroup>

            {/* Calibrations & Reports */}
            <SidebarGroup>
              <NavSection label="Evaluation Suite" isCollapsed={!isSidebarOpen} />
              <NavItem
                label="Copilot Report"
                path="/copilot"
                icon={Bot}
                isCollapsed={!isSidebarOpen}
              />
              <NavItem
                label="Finalist Comparison"
                path="/comparison"
                icon={GitCompare}
                badge={comparisonCandidateIds.length > 0 ? comparisonCandidateIds.length : undefined}
                isCollapsed={!isSidebarOpen}
              />
              <NavItem
                label="Analytics Hub"
                path="/analytics"
                icon={BarChart3}
                isCollapsed={!isSidebarOpen}
              />
              <NavItem
                label="Export & Reports"
                path="/reports"
                icon={FileDown}
                isCollapsed={!isSidebarOpen}
              />
            </SidebarGroup>

            {/* System Settings & Administration */}
            <SidebarGroup>
              <NavSection label="Preferences" isCollapsed={!isSidebarOpen} />
              <NavItem
                label="Settings"
                path="/settings"
                icon={Settings}
                isCollapsed={!isSidebarOpen}
              />
              {user?.role === "recruiter" && (
                <>
                  <NavItem
                    label="Admin Console"
                    path="/admin"
                    icon={Shield}
                    isCollapsed={!isSidebarOpen}
                  />
                  <NavItem
                    label="Launch Center"
                    path="/launch"
                    icon={Terminal}
                    isCollapsed={!isSidebarOpen}
                  />
                </>
              )}
            </SidebarGroup>
          </>
        ) : (
          <>
            {/* Candidate Tools Section */}
            <SidebarGroup>
              <NavSection label="Candidate Portal" isCollapsed={!isSidebarOpen} />
              <NavItem
                label="Dashboard"
                path="/user-dashboard"
                icon={LayoutDashboard}
                isCollapsed={!isSidebarOpen}
              />
              <NavItem
                label="Jobs"
                path="/portal/jobs"
                icon={Briefcase}
                isCollapsed={!isSidebarOpen}
              />
              <NavItem
                label="My Applications"
                path="/portal/applications"
                icon={FileText}
                isCollapsed={!isSidebarOpen}
              />
              <NavItem
                label="Profile"
                path="/profile"
                icon={UserIcon}
                isCollapsed={!isSidebarOpen}
              />
              <NavItem
                label="Resume"
                path="/resume"
                icon={FileText}
                isCollapsed={!isSidebarOpen}
              />
            </SidebarGroup>

            {/* System Settings */}
            <SidebarGroup>
              <NavSection label="Preferences" isCollapsed={!isSidebarOpen} />
              <NavItem
                label="Settings"
                path="/settings"
                icon={Settings}
                isCollapsed={!isSidebarOpen}
              />
            </SidebarGroup>
          </>
        )}
      </div>

      {/* Sidebar Health check status footer */}
      <div className="p-4 border-t border-slate-200/10 dark:border-slate-800/50 bg-slate-200/20 dark:bg-slate-900/10 shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-500 gap-2 overflow-hidden">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-slate-400 shrink-0" />
            {isSidebarOpen && <span className="truncate">Core Gateway</span>}
          </div>
          <div className="flex items-center gap-1.5 font-semibold shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${healthStatus === "healthy"
                ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                : healthStatus === "unhealthy"
                  ? "bg-rose-500 shadow-sm shadow-rose-500/50"
                  : "bg-amber-500 animate-pulse"
                }`}
            />
            {isSidebarOpen && <span className="capitalize text-[10px] text-slate-700 dark:text-slate-350">{healthStatus}</span>}
          </div>
        </div>
      </div>

      {/* Collapse Toggle Handle */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="absolute -right-3 top-10.5 w-6.5 h-6.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 flex items-center justify-center text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shadow shadow-slate-950/10 dark:shadow-slate-950/30 transition-colors z-30 outline-none focus-ring select-none"
        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isSidebarOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
