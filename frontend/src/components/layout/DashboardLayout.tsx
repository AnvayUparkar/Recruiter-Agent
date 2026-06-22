import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useThemeStore } from "../../store/themeStore";
import { useAppStore } from "../../store/appStore";
import { useCandidateStore } from "../../store/candidateStore";
import { healthService } from "../../services/healthService";
import {
  LayoutDashboard,
  FileSearch,
  Bot,
  GitCompare,
  BarChart3,
  FileDown,
  Settings,
  Sun,
  Moon,
  Server,
  AlertCircle,
  Menu,
  X
} from "lucide-react";

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { parsedJD } = useAppStore();
  const { comparisonCandidateIds } = useCandidateStore();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [healthStatus, setHealthStatus] = useState<"healthy" | "unhealthy" | "checking">("checking");
  const [isMobile, setIsMobile] = useState(false);

  // Apply theme class to HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Monitor screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "JD Parser", path: "/jd-analysis", icon: FileSearch },
    { label: "Copilot Report", path: "/copilot", icon: Bot },
    { label: "Finalist Comparison", path: "/comparison", icon: GitCompare, badge: comparisonCandidateIds.length > 0 ? comparisonCandidateIds.length : undefined },
    { label: "Analytics Hub", path: "/analytics", icon: BarChart3 },
    { label: "Export & Report", path: "/reports", icon: FileDown },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex text-slate-100 dark:bg-[#0d1117] bg-[#f6f8fa] text-slate-800 dark:text-[#c9d1d9] transition-colors duration-300 font-sans`}>
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 transition-all duration-300 flex flex-col glass-panel shadow-2xl
          ${isSidebarOpen ? "w-72" : "w-0 lg:w-20 overflow-hidden lg:overflow-visible"} 
          ${isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"}`}
      >
        {/* Sidebar Header */}
        <div className="h-20 border-b border-slate-200/10 dark:border-slate-800/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
              LA
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-slate-100">Antigravity TA</span>
                <span className="text-xs text-blue-500 font-medium">Recruiter Copilot</span>
              </div>
            )}
          </div>
          {isMobile && (
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group relative
                  ${isActive 
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/10 border border-blue-500/30 text-blue-500 dark:text-blue-400 font-medium shadow-md shadow-blue-500/5" 
                    : "hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
              >
                <Icon size={20} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
                {isSidebarOpen && <span className="text-sm">{item.label}</span>}
                {item.badge && isSidebarOpen && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
                {/* Tooltip for collapsed sidebar */}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        {isSidebarOpen && (
          <div className="p-6 border-t border-slate-200/10 dark:border-slate-800/50 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Server size={14} />
              <span>Backend Gateways:</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className={`w-2 h-2 rounded-full 
                  ${healthStatus === "healthy" ? "bg-emerald-500" : healthStatus === "unhealthy" ? "bg-rose-500" : "bg-amber-500 animate-pulse"}`} 
                />
                <span className="capitalize">{healthStatus}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Panel */}
        <header className="h-20 border-b border-slate-200/10 dark:border-slate-800/50 flex items-center justify-between px-6 lg:px-8 glass-panel sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
            >
              <Menu size={20} />
            </button>
            {parsedJD ? (
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Position</span>
                <span className="text-sm lg:text-base font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px] lg:max-w-[400px]">
                  {parsedJD.job_title}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <AlertCircle size={16} className="text-amber-500" />
                <span>No Active Job Description Uploaded</span>
                <Link to="/jd-analysis" className="text-blue-500 hover:underline font-medium text-xs ml-2">
                  Upload Now
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Quick finalist comparison summary */}
            {comparisonCandidateIds.length > 0 && (
              <Link 
                to="/comparison" 
                className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-500 text-xs font-medium hover:bg-blue-600/20 transition-all duration-300"
              >
                <GitCompare size={14} />
                <span>Compare final ({comparisonCandidateIds.length}/2)</span>
              </Link>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200/10 dark:border-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 transition-all duration-300"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
