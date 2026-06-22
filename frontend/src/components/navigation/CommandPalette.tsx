import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  Compass,
  CornerDownLeft,
  Sparkles,
  Sliders,
  FileText,
  ArrowRight,
  User,
  Sun,
  Moon,
  Laptop,
  RefreshCw,
  FileDown,
  BarChart3,
  GitCompare,
  Bot,
  Shield
} from "lucide-react";
import { useLayoutStore } from "../../store/layoutStore";
import { useTheme } from "../../providers/ThemeProvider";
import { useToastStore } from "../../store/toastStore";
import { usePWAStore } from "../../store/pwaStore";
import { useRankingStore } from "../../store/rankingStore";

interface CommandItem {
  id: string;
  title: string;
  description: string;
  path?: string;
  action?: () => void;
  category: "Navigation" | "Theme & Settings" | "Database Search" | "System Actions";
  icon: React.ReactNode;
}

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen: isOpen, setCommandPaletteOpen: setIsOpen } = useLayoutStore();
  const { setTheme } = useTheme();
  const { isOnline } = usePWAStore();
  const toastStore = useToastStore();
  const rankingStore = useRankingStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Static commands list
  const commandItems: CommandItem[] = [
    {
      id: "dashboard",
      title: "Go to Leaderboard",
      description: "View evaluated candidate rankings and priority matches",
      path: "/dashboard",
      category: "Navigation",
      icon: <Compass size={16} className="text-blue-500" />,
    },
    {
      id: "jd-analysis",
      title: "Go to JD Parser",
      description: "Upload and analyze position requirements",
      path: "/jd-analysis",
      category: "Navigation",
      icon: <FileText size={16} className="text-purple-500" />,
    },
    {
      id: "copilot",
      title: "Go to Recruiter Copilot",
      description: "Inspect AI dossier, strengths gaps, and interview plans",
      path: "/copilot",
      category: "Navigation",
      icon: <Bot size={16} className="text-amber-500" />,
    },
    {
      id: "comparison",
      title: "Go to Finalist Comparison",
      description: "Compare selected candidate credentials side-by-side",
      path: "/comparison",
      category: "Navigation",
      icon: <GitCompare size={16} className="text-indigo-500" />,
    },
    {
      id: "analytics",
      title: "Go to Analytics Hub",
      description: "Inspect score distributions and calibration charts",
      path: "/analytics",
      category: "Navigation",
      icon: <BarChart3 size={16} className="text-emerald-500" />,
    },
    {
      id: "reports",
      title: "Go to Export & Reports",
      description: "Generate standard submission CSV and candidate dossiers",
      path: "/reports",
      category: "Navigation",
      icon: <FileDown size={16} className="text-teal-500" />,
    },
    {
      id: "settings",
      title: "Go to Settings",
      description: "Calibrate score weights and review interface themes",
      path: "/settings",
      category: "Navigation",
      icon: <Sliders size={16} className="text-slate-400" />,
    },
    {
      id: "admin",
      title: "Go to Admin Console",
      description: "Monitor platform indices, audit trails, and configurations",
      path: "/admin",
      category: "Navigation",
      icon: <Shield size={16} className="text-rose-500" />,
    },
    {
      id: "demo",
      title: "Launch Guided Tour (Demo Mode)",
      description: "CINEMATIC: Explore recruiting features via a self-guided journey",
      path: "/demo",
      category: "Navigation",
      icon: <Sparkles size={16} className="text-pink-500 animate-pulse" />,
    },
    {
      id: "theme-light",
      title: "Switch to Light Mode",
      description: "Render high-contrast light panels",
      action: () => {
        setTheme("light");
        toastStore.success("Switched interface theme to Light Mode!");
      },
      category: "Theme & Settings",
      icon: <Sun size={16} className="text-amber-500" />,
    },
    {
      id: "theme-dark",
      title: "Switch to Dark Mode",
      description: "Render premium dark glassmorphic styling",
      action: () => {
        setTheme("dark");
        toastStore.success("Switched interface theme to Dark Mode!");
      },
      category: "Theme & Settings",
      icon: <Moon size={16} className="text-indigo-400" />,
    },
    {
      id: "theme-system",
      title: "Sync with System Colors",
      description: "Follow local operating system color schemes",
      action: () => {
        setTheme("system");
        toastStore.success("Synced interface theme with System settings!");
      },
      category: "Theme & Settings",
      icon: <Laptop size={16} className="text-slate-500" />,
    },
    {
      id: "reset-weights",
      title: "Reset Scoring Calibration Filters",
      description: "Restore standard scoring factors and weights",
      action: () => {
        rankingStore.resetFilters();
        toastStore.success("Weights and filter limits reset successfully!");
      },
      category: "System Actions",
      icon: <RefreshCw size={16} className="text-blue-500" />,
    },
  ];

  // Retrieve cached candidate names from query cache
  const cachedCandidates = React.useMemo(() => {
    const queries = queryClient.getQueriesData<any>({ queryKey: ["candidateDetails"] });
    const list: Array<{ id: string; name: string; title: string }> = [];
    const seen = new Set<string>();

    queries.forEach(([_, data]) => {
      if (data && data.candidateId) {
        const id = data.candidateId;
        if (!seen.has(id)) {
          seen.add(id);
          const name = data.profile?.anonymizedName || data.name || `Anonymized Candidate`;
          const title = data.profile?.currentTitle || data.profile?.headline || "Software Architect";
          list.push({ id, name, title });
        }
      }
    });

    // Fallback standard candidates list for hackathon showcase
    if (list.length === 0) {
      const mockups = [
        { id: "cand-001", name: "Anonymized Candidate Alpha", title: "Principal Quantitative Engineer" },
        { id: "cand-002", name: "Anonymized Candidate Beta", title: "Lead Blockchain Developer" },
        { id: "cand-003", name: "Anonymized Candidate Gamma", title: "Senior NLP Research Scientist" },
      ];
      mockups.forEach((m) => list.push(m));
    }

    return list;
  }, [isOpen, queryClient]);

  // Global keyboard shortcuts (Ctrl+K to toggle, Esc to close)
  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDownGlobal);
    return () => window.removeEventListener("keydown", handleKeyDownGlobal);
  }, [isOpen, setIsOpen]);

  // Reset indices on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter commands and dynamic candidates
  const filteredCommands = commandItems.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCandidates = search.trim()
    ? cachedCandidates.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Combine commands and candidate matches into a single key-navigable index
  const combinedItems = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      path?: string;
      action?: () => void;
      category: string;
      icon: React.ReactNode;
      isCandidate?: boolean;
    }> = [...filteredCommands];

    filteredCandidates.forEach((c) => {
      list.push({
        id: c.id,
        title: c.name,
        description: `${c.title} (ID: ${c.id})`,
        path: `/candidates/${c.id}`,
        category: "Database Search",
        icon: <User size={16} className="text-blue-500" />,
        isCandidate: true,
      });
    });

    return list;
  }, [filteredCommands, filteredCandidates]);

  // Keyboard navigation within modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (combinedItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % combinedItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (combinedItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + combinedItems.length) % combinedItems.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (combinedItems[activeIndex]) {
        handleExecute(combinedItems[activeIndex]);
      }
    }
  };

  const handleExecute = (item: typeof combinedItems[0]) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    } else if (item.path) {
      // If candidate and offline, show friendly warning if needed
      if (item.isCandidate && !isOnline) {
        toastStore.warning("Viewing cached local candidate dossier offline.");
      }
      navigate(item.path);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="w-full max-w-2xl bg-slate-900/80 dark:bg-slate-950/70 glass-panel shadow-2xl rounded-2xl border border-slate-200/10 dark:border-slate-800/60 overflow-hidden relative z-10 select-none flex flex-col focus-ring outline-none"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="command-listbox"
            aria-label="Command search palette"
          >
            {/* Search Input */}
            <div className="flex items-center px-4.5 border-b border-slate-200/10 dark:border-slate-800/50 bg-slate-200/5 dark:bg-slate-900/20">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search candidates, routes, themes, calibration strategies..."
                className="w-full bg-transparent border-none py-4.5 px-3 text-sm focus:outline-none text-slate-100 placeholder-slate-500"
                aria-autocomplete="list"
                aria-controls="command-listbox"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-mono text-slate-500 border border-slate-300 dark:border-slate-700 font-extrabold shadow-sm">
                  ESC
                </span>
              </div>
            </div>

            {/* Listbox */}
            <div
              id="command-listbox"
              role="listbox"
              ref={listRef}
              className="max-h-[360px] overflow-y-auto p-2.5 divide-y divide-slate-200/5 dark:divide-slate-800/10"
            >
              {combinedItems.length > 0 ? (
                combinedItems.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleExecute(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      role="option"
                      aria-selected={isActive}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-150 outline-none
                        ${
                          isActive
                            ? "bg-blue-600/15 dark:bg-blue-500/15 border border-blue-500/25 dark:border-blue-400/20 text-slate-100"
                            : "bg-transparent border border-transparent text-slate-400"
                        }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-200/10 dark:bg-slate-900 flex items-center justify-center border border-slate-350/10 shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${isActive ? "text-blue-500 dark:text-blue-400" : ""}`}>
                              {item.title}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[8px] font-bold tracking-wider uppercase text-slate-450 border border-slate-700/60">
                              {item.category}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 truncate max-w-[380px] sm:max-w-[480px]">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <div className="flex items-center gap-1 text-[9px] text-blue-400 font-bold shrink-0">
                          <span>Select</span>
                          <CornerDownLeft size={10} />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
                  <Search size={22} className="text-slate-700" />
                  <span className="text-xs font-bold">No results found for "{search}"</span>
                  <span className="text-[10px] text-slate-600">Try searching for "quantitative", "theme", or "reports".</span>
                </div>
              )}
            </div>

            {/* Shortcut HUD Footer */}
            <div className="p-3 border-t border-slate-200/10 dark:border-slate-800/50 bg-slate-200/5 dark:bg-slate-900/40 flex justify-between items-center text-[10px] text-slate-500">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-850 font-mono border border-slate-350 dark:border-slate-700">↑↓</span> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-850 font-mono border border-slate-350 dark:border-slate-700">Enter</span> Run Action
                </span>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-medium">
                <ArrowRight size={10} /> Shift+Click to Compare directly
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
