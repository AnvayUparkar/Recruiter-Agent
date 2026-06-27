import React, { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Server, LucideIcon } from "lucide-react";
import { NavItem } from "./NavItem";
import { useLayoutStore } from "../../store/layoutStore";
import { useResponsive } from "../../layouts/ResponsiveLayout";

interface MobileMenuProps {
  navItems: Array<{
    label: string;
    path: string;
    icon: LucideIcon;
    badge?: string | number;
  }>;
  healthStatus: "healthy" | "unhealthy" | "checking";
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ navItems, healthStatus }) => {
  const { isSidebarOpen: isOpen, setSidebarOpen: setIsOpen } = useLayoutStore();
  const { isDesktop, isMobile } = useResponsive();
  const shouldReduceMotion = useReducedMotion();

  // Close when screen resizes to desktop width
  useEffect(() => {
    if (isDesktop && isOpen) {
      setIsOpen(false);
    }
  }, [isDesktop, isOpen, setIsOpen]);

  // Handle escape press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  return (
    <>
      {/* Backdrop AnimatePresence */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[19999] bg-slate-950/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Drawer AnimatePresence */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            key="mobile-drawer"
            initial={shouldReduceMotion ? { opacity: 0 } : { x: "-100%" }}
            animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: "-100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] flex flex-col bg-slate-100/90 dark:bg-slate-950/95 glass-panel shadow-2xl border-r border-slate-250/20 dark:border-slate-800/60 z-[20000] overflow-hidden"
          >
            {/* Header info */}
            <div className="h-20 border-b border-slate-200/10 dark:border-slate-800/50 flex items-center justify-between px-6 shrink-0 bg-slate-200/30 dark:bg-slate-900/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-500/20">
                  LA
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-wide text-slate-900 dark:text-slate-100">
                    Antigravity TA
                  </span>
                  <span className="text-[10px] text-blue-500 font-bold tracking-wider uppercase">
                    Recruiter Copilot
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg border border-slate-200/10 dark:border-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-all focus-ring outline-none"
                aria-label="Close menu drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Lists */}
            <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto" role="navigation" aria-label="Mobile links">
              {navItems.map((item) => (
                <NavItem
                  key={item.path}
                  label={item.label}
                  path={item.path}
                  icon={item.icon}
                  badge={item.badge}
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </nav>

            {/* System gateways status footer */}
            <div className="p-6 border-t border-slate-200/10 dark:border-slate-800/50 bg-slate-200/20 dark:bg-slate-900/10 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Server size={14} />
                <span>Backend Gateway:</span>
                <div className="flex items-center gap-1.5 ml-auto font-semibold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      healthStatus === "healthy"
                        ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                        : healthStatus === "unhealthy"
                        ? "bg-rose-500 shadow-sm shadow-rose-500/50"
                        : "bg-amber-500 animate-pulse"
                    }`}
                  />
                  <span className="capitalize text-slate-700 dark:text-slate-350">{healthStatus}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileMenu;
