import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const handleToggle = () => {
    // Standard toggling loop: dark -> light -> system -> dark
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  const getThemeIcon = () => {
    if (theme === "system") {
      return <Laptop size={18} className="text-slate-500" />;
    }
    return resolvedTheme === "dark" ? (
      <Moon size={18} className="text-blue-400" />
    ) : (
      <Sun size={18} className="text-amber-500" />
    );
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light Theme";
      case "dark":
        return "Dark Theme";
      case "system":
        return "System Theme";
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2.5 rounded-xl border border-slate-200/10 dark:border-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-650 dark:text-slate-400 transition-all duration-300 relative focus-ring outline-none"
      title={`Current: ${getThemeLabel()}. Click to cycle.`}
      aria-label="Toggle interface theme"
    >
      <motion.div
        key={theme}
        initial={shouldReduceMotion ? { opacity: 0 } : { rotate: -90, scale: 0.8, opacity: 0 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex items-center justify-center"
      >
        {getThemeIcon()}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
