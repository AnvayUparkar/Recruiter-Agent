import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { prefetchRoute } from "../../utils/prefetch";

interface NavItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  label,
  path,
  icon: Icon,
  badge,
  isCollapsed = false,
  onClick,
}) => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  // Check if item is active: exact match or subpath match
  const isActive =
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  // Key visual transitions
  const springConfig = { type: "spring", stiffness: 380, damping: 28 };

  return (
    <Link
      to={path}
      onClick={onClick}
      onMouseEnter={() => prefetchRoute(path)}
      className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative focus-ring outline-none select-none
        ${
          isActive
            ? "text-blue-500 dark:text-blue-400 font-semibold"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        }`}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Background Hover Glow & Slide Indicators */}
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/5 dark:from-blue-500/10 dark:to-purple-500/5 border border-blue-500/25 dark:border-blue-400/20 rounded-xl shadow-inner-glow pointer-events-none"
          transition={shouldReduceMotion ? { duration: 0.15 } : springConfig}
        />
      )}

      {/* Active Sidebar Left Marker */}
      {isActive && !isCollapsed && (
        <motion.span
          layoutId="active-marker"
          className="absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r bg-blue-500 dark:bg-blue-400"
          transition={shouldReduceMotion ? { duration: 0.15 } : springConfig}
        />
      )}

      {/* Nav Link Icon wrapper */}
      <div className="relative z-10 shrink-0">
        <Icon
          size={20}
          className={`transition-all duration-300 
            ${
              isActive
                ? "text-blue-500 dark:text-blue-400 scale-105"
                : "text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:scale-110"
            }`}
        />
      </div>

      {/* Navigation Label */}
      {!isCollapsed && (
        <span className="text-sm ml-3.5 font-medium relative z-10 truncate">
          {label}
        </span>
      )}

      {/* Item Badge */}
      {badge && !isCollapsed && (
        <span className="ml-auto px-2 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse relative z-10">
          {badge}
        </span>
      )}

      {/* Tooltip for Collapsed Menu */}
      {isCollapsed && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-800">
          {label}
          {badge && <span className="ml-1.5 px-1.5 py-0.2 bg-blue-500 text-white text-[9px] rounded-full">{badge}</span>}
        </div>
      )}
    </Link>
  );
};

export default NavItem;
