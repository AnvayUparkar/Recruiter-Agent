import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { useAuthStore } from "../../store/authStore";

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { user, logout, isAuthenticated } = useAuthStore();

  // If not authenticated, we could return a login button, but TopNavbar can also handle it.
  // For now, let's show login/signup if not authenticated.
  
  const displayUser = user ? {
    name: user.full_name || "User",
    email: user.email || "",
    avatarInitials: user.full_name ? user.full_name.substring(0, 2).toUpperCase() : "U",
    role: user.role === "recruiter" ? "Recruiter" : "Candidate",
  } : null;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard Escape to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  if (!isAuthenticated || !displayUser) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="text-sm font-medium text-text-muted hover:text-primary transition-colors">Log In</Link>
        <Link to="/signup" className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">Sign Up</Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-border hover:bg-surface-hover transition-all duration-300 focus-ring outline-none select-none text-left"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/10 shrink-0">
          {displayUser.avatarInitials}
        </div>
        <div className="hidden sm:flex flex-col min-w-0 pr-1">
          <span className="text-xs font-bold text-primary truncate max-w-[100px]">
            {displayUser.name}
          </span>
          <span className="text-[9px] text-muted font-medium truncate max-w-[100px]">
            {displayUser.role}
          </span>
        </div>
        <ChevronDown size={14} className={`text-text-disabled transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute right-0 mt-3 w-56 glass-panel shadow-2xl rounded-2xl border border-border overflow-hidden z-50 focus-ring"
            role="menu"
            aria-label="User profile options"
          >
            {/* Header info */}
            <div className="p-4 border-b border-border bg-surface">
              <span className="text-xs font-bold text-primary block truncate">
                {displayUser.name}
              </span>
              <span className="text-[10px] text-muted truncate block mt-0.5">
                {displayUser.email}
              </span>
            </div>

            {/* Menu Links */}
            <div className="p-1.5 space-y-0.5">
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-text-muted hover:bg-surface-hover hover:text-primary transition-colors font-medium outline-none focus-ring"
                role="menuitem"
              >
                <User size={14} className="text-muted" />
                <span>My Profile</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-text-muted hover:bg-surface-hover hover:text-primary transition-colors font-medium outline-none focus-ring"
                role="menuitem"
              >
                <Settings size={14} className="text-muted" />
                <span>Account Settings</span>
              </Link>
            </div>

            {/* Theme Customizer Sub-section */}
            <div className="border-t border-border p-2">
              <span className="text-[9px] font-bold text-text-disabled uppercase tracking-widest px-2.5 py-1 block">
                Theme Preset
              </span>
              <div className="flex gap-1 p-0.5">
                {(["light", "dark", "system"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold tracking-wide capitalize transition-all border
                      ${
                        theme === mode
                          ? "bg-blue-600 text-white border-transparent shadow"
                          : "bg-transparent border-transparent text-text-muted hover:bg-surface-hover"
                      }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Logout Row */}
            <div className="border-t border-border p-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-colors font-semibold outline-none focus-ring text-left"
                role="menuitem"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
