import React, { useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "../../components/navigation/ThemeToggle";
import { NotificationBell } from "../../components/navigation/NotificationBell";
import { UserMenu } from "../../components/navigation/UserMenu";
import { useLayoutStore } from "../../store/layoutStore";
import { useResponsive } from "../ResponsiveLayout";
import { useAppStore } from "../../store/appStore";

export const TopNavbar: React.FC = () => {
  const { isSidebarOpen, setSidebarOpen, setCommandPaletteOpen } = useLayoutStore();
  const { isMobile } = useResponsive();
  const { parsedJD } = useAppStore();
  const [isScrolled, setIsScrolled] = useState(false);

  // Monitor page scroll to apply soft border/shadow effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`h-20 sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8 bg-background/70 backdrop-blur-md transition-all duration-300 border-b border-transparent
        ${isScrolled ? "shadow-lg shadow-black/5 dark:shadow-black/20 border-border bg-background/90" : ""}`}
    >
      {/* Left side actions */}
      <div className="flex items-center gap-4.5 min-w-0">
        {/* Sidebar Toggle or Hamburger */}
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl border border-border hover:bg-surface-hover text-text-muted transition-colors focus-ring outline-none shrink-0"
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          <Menu size={18} />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden md:block">
          <Breadcrumbs />
        </div>

        {/* Mobile active job title snippet */}
        {isMobile && parsedJD && (
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Position</span>
            <span className="text-xs font-semibold text-primary truncate max-w-[120px]">
              {parsedJD.job_title}
            </span>
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Ctrl+K Search Trigger Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-2.5 sm:w-48 text-left rounded-xl border border-border hover:bg-surface-hover text-muted transition-all focus-ring outline-none"
          title="Search commands (Ctrl+K)"
        >
          <Search size={15} className="shrink-0" />
          <span className="text-xs hidden sm:inline truncate">Search features...</span>
          <span className="ml-auto hidden sm:inline-flex items-center px-1.5 py-0.2 rounded bg-surface border border-border text-[9px] font-mono font-bold shrink-0">
            ⌘K
          </span>
        </button>

        {/* Theme Switch */}
        <ThemeToggle />

        {/* Alert Bell */}
        <NotificationBell />

        {/* Separator */}
        <div className="w-px h-6 bg-border shrink-0" />

        {/* User profile dropdown */}
        <UserMenu />
      </div>
    </header>
  );
};

export default TopNavbar;
