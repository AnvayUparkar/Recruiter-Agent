import React, { useEffect, useRef, useState } from "react";
import { Search, LayoutGrid, List, Sparkles, Command } from "lucide-react";

interface SearchToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  query,
  onQueryChange,
  viewMode,
  onViewModeChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Bind Ctrl/Cmd + K to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full select-none">
      
      {/* Premium Search Bar */}
      <div className={`relative flex-1 group transition-all duration-300 ${isFocused ? "scale-[1.01]" : ""}`}>
        {/* Glow backdrop */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 blur-xl transition-opacity duration-500 ${isFocused ? "opacity-100" : "opacity-0"}`} />
        
        <div className={`relative flex items-center w-full bg-white/80 dark:bg-[#0A0F1C]/80 backdrop-blur-2xl rounded-2xl border transition-colors overflow-hidden ${isFocused ? "border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]" : "border-slate-200 dark:border-slate-800"}`}>
          
          <div className="pl-5 pr-2 py-4 flex items-center justify-center shrink-0">
            {isFocused ? (
              <Sparkles size={20} className="text-blue-500 animate-pulse" />
            ) : (
              <Search size={20} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
            )}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search candidates, skills, companies, technologies, certifications..."
            className="w-full py-4 px-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-semibold tracking-wide"
            aria-label="Semantic candidate search"
          />
          
          <div className="pr-4 flex items-center gap-2 shrink-0">
            {/* AI Semantic Badge */}
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-500">
              Semantic Enabled
            </span>
            {/* Command Shortcut */}
            <div className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
              <Command size={12} />
              <span className="text-[10px] font-black font-mono tracking-tighter">K</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggles */}
      <div className="flex items-center bg-white/80 dark:bg-[#0A0F1C]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0 self-end sm:self-auto shadow-sm hover:shadow-md transition-shadow">
        <button
          onClick={() => onViewModeChange("grid")}
          className={`p-2.5 rounded-xl transition-all outline-none focus-ring relative overflow-hidden group
            ${viewMode === "grid" ? "text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          title="Grid Layout"
        >
          {viewMode === "grid" && (
            <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20" />
          )}
          <LayoutGrid size={18} className="relative z-10 group-active:scale-95 transition-transform" />
        </button>
        <button
          onClick={() => onViewModeChange("table")}
          className={`p-2.5 rounded-xl transition-all outline-none focus-ring relative overflow-hidden group
            ${viewMode === "table" ? "text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          title="Table Layout"
        >
          {viewMode === "table" && (
            <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20" />
          )}
          <List size={18} className="relative z-10 group-active:scale-95 transition-transform" />
        </button>
      </div>

    </div>
  );
};

export default SearchToolbar;
