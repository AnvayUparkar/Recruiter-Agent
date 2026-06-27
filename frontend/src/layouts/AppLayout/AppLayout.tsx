import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ResponsiveProvider, useResponsive } from "../ResponsiveLayout";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { Footer } from "./Footer";
import { MobileMenu } from "../../components/navigation/MobileMenu";
import { CommandPalette } from "../../components/navigation/CommandPalette";
import { useLayoutStore } from "../../store/layoutStore";
import { LayoutDashboard, FileSearch, Bot, GitCompare, BarChart3, FileDown, Settings, Shield, Terminal, User as UserIcon, FileText } from "lucide-react";
import { useCandidateStore } from "../../store/candidateStore";
import { useAuthStore } from "../../store/authStore";
import GuidedTour from "../../pages/Demo/components/GuidedTour.tsx";
import { ToastContainer } from "../../components/common/ToastContainer";
import { OfflineStatusBanner } from "../../components/common/OfflineStatusBanner";
// import { PwaInstallPrompt } from "../../components/common/PwaInstallPrompt";

interface AppLayoutContentProps {
  children: React.ReactNode;
}

const AppLayoutContent: React.FC<AppLayoutContentProps> = ({ children }) => {
  const { setSidebarOpen } = useLayoutStore();
  const { isDesktop, isMobile } = useResponsive();
  const { comparisonCandidateIds } = useCandidateStore();
  const { user } = useAuthStore();
  const isRecruiter = user?.role !== "user";
  const location = useLocation();

  // Handle auto-collapsing sidebar on smaller desktop viewports
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false); // Always close the sidebar on mobile/tablet
    } else {
      setSidebarOpen(true); // Expanded by default on large desktops
    }
  }, [isDesktop, setSidebarOpen]);

  // Close mobile drawer when route changes
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isDesktop, setSidebarOpen]);

  // Navigation configurations
  const navItems = isRecruiter ? [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "JD Parser", path: "/jd-analysis", icon: FileSearch },
    { label: "Copilot Report", path: "/copilot", icon: Bot },
    {
      label: "Finalist Comparison",
      path: "/comparison",
      icon: GitCompare,
      badge: comparisonCandidateIds.length > 0 ? comparisonCandidateIds.length : undefined,
    },
    { label: "Analytics Hub", path: "/analytics", icon: BarChart3 },
    { label: "Export & Report", path: "/reports", icon: FileDown },
    { label: "Settings", path: "/settings", icon: Settings },
    { label: "Admin Console", path: "/admin", icon: Shield },
    { label: "Launch Center", path: "/launch", icon: Terminal },
  ] : [
    { label: "Dashboard", path: "/user-dashboard", icon: LayoutDashboard },
    { label: "Profile", path: "/profile", icon: UserIcon },
    { label: "Resume", path: "/resume", icon: FileText },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex w-full max-w-full overflow-x-hidden text-slate-800 dark:text-slate-200 bg-[#f6f8fa] dark:bg-[#0d1117] transition-colors duration-300 font-sans">
      {/* Skip to Content link for screen readers */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 px-4 py-2 bg-blue-600 text-white rounded-lg">
        Skip to main content
      </a>

      {/* Desktop/Tablet Sidebar — only on md+ screens */}
      {!isMobile && <Sidebar />}

      {/* Mobile drawer — shown on screens smaller than 768px */}
      {isMobile && (
        <MobileMenu navItems={navItems} healthStatus="healthy" />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden relative">
        {/* Sticky top navigation bar */}
        <TopNavbar />

        {/* Dynamic Route Content */}
        <main id="main-content" className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden p-4 md:p-6 lg:p-8 outline-none">
          {children}
        </main>

        {/* Global Footer element */}
        <Footer />
      </div>

      {/* Search Command Palette Dialog */}
      <CommandPalette />

      {/* Guided Tour Spotlight & HUD Overlay */}
      <GuidedTour />

      {/* Toast notifications portal */}
      <ToastContainer />

      {/* Offline state alert indicator */}
      <OfflineStatusBanner />

      {/* PWA desktop/mobile app installation prompt */}
      {/* <PwaInstallPrompt /> */}
    </div>
  );
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ResponsiveProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </ResponsiveProvider>
  );
};

export default AppLayout;
