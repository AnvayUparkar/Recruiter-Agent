import React, { useEffect, useRef } from "react";
import { Search, LayoutGrid, List } from "lucide-react";

interface SearchToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  placeholder?: string;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  query,
  onQueryChange,
  viewMode,
  onViewModeChange,
  placeholder = "Filter by candidate ID, keywords, title...",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Bind Ctrl + / or Cmd + / to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex items-center gap-3 w-full select-none">
      
      {/* Search Bar Input */}
      <div className="relative flex-1">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-20 py-3 rounded-xl text-xs bg-slate-200/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-blue-500/50 transition-all font-semibold"
          aria-label="Search candidates listing"
        />
        
        {/* Hotkey Indicator Badge */}
        <span className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">
          Ctrl + /
        </span>
      </div>

      {/* Grid vs Table Layout Toggle */}
      <div className="flex items-center bg-slate-200/60 dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-800 shrink-0">
        <button
          onClick={() => onViewModeChange("grid")}
          className={`p-2 rounded-lg transition-all outline-none focus-ring
            ${
              viewMode === "grid"
                ? "bg-slate-100 dark:bg-slate-900 text-blue-500 shadow-sm border border-slate-250/20 dark:border-slate-850"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          title="Grid view card items"
          aria-label="Switch to grid view"
        >
          <LayoutGrid size={14} />
        </button>
        <button
          onClick={() => onViewModeChange("table")}
          className={`p-2 rounded-lg transition-all outline-none focus-ring
            ${
              viewMode === "table"
                ? "bg-slate-100 dark:bg-slate-900 text-blue-500 shadow-sm border border-slate-250/20 dark:border-slate-850"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          title="Table view list items"
          aria-label="Switch to table view"
        >
          <List size={14} />
        </button>
      </div>

    </div>
  );
};

export default SearchToolbar;
