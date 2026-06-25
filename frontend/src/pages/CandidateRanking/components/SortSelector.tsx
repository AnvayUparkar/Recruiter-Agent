import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, ArrowUp, ArrowDown, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export type SortField = "rank" | "technical" | "reliability" | "experience" | "availability";
export type SortDirection = "asc" | "desc";

interface SortSelectorProps {
  field: SortField;
  direction: SortDirection;
  onChange: (field: SortField, direction: SortDirection) => void;
}

const SORT_OPTIONS: { value: SortField; label: string; icon: string }[] = [
  { value: "rank", label: "Overall Fit", icon: "⭐" },
  { value: "technical", label: "Technical Strength", icon: "🧠" },
  { value: "reliability", label: "Reliability", icon: "🛡" },
  { value: "experience", label: "Leadership / Exp", icon: "🚀" },
  { value: "availability", label: "Availability", icon: "⏱" },
];

export const SortSelector: React.FC<SortSelectorProps> = ({
  field,
  direction,
  onChange,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = SORT_OPTIONS.find((o) => o.value === field) || SORT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: SortField) => {
    onChange(val, direction);
    setIsOpen(false);
  };

  const toggleDirection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(field, direction === "asc" ? "desc" : "asc");
  };

  return (
    <div className="relative flex items-center select-none shrink-0 z-40" ref={dropdownRef}>
      
      {/* Dropdown Selector trigger */}
      <div className="flex items-center bg-white/80 dark:bg-[#0A0F1C]/80 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-800 p-1 shadow-sm hover:shadow-md transition-all group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="pl-4 pr-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors outline-none focus-ring"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <SlidersHorizontal size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Sort by:</span> 
            <span>{activeOption.icon} {activeOption.label}</span>
          </span>
          <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Sort Direction Toggle Button */}
        <button
          onClick={toggleDirection}
          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors outline-none focus-ring active:scale-95"
          title={`Switch to ${direction === "asc" ? "descending" : "ascending"} sort`}
        >
          {direction === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
        </button>
      </div>

      {/* Options Panel Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-full right-0 mt-3 w-56 rounded-2xl bg-white/95 dark:bg-[#0A0F1C]/95 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col p-2"
            role="listbox"
          >
            {SORT_OPTIONS.map((opt) => {
              const isSelected = opt.value === field;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-3 py-2.5 text-left text-xs font-bold rounded-xl flex items-center justify-between transition-all outline-none group/opt relative overflow-hidden
                    ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-sm">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </span>
                  {isSelected && (
                    <motion.div layoutId="sortCheck" className="relative z-10">
                      <Check size={14} className="text-blue-500" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SortSelector;
