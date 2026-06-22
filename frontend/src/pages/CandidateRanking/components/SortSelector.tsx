import React, { useState } from "react";
import { ArrowUpDown, ChevronDown, Check, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export type SortField = "rank" | "technical" | "reliability" | "experience" | "availability";
export type SortDirection = "asc" | "desc";

interface SortSelectorProps {
  field: SortField;
  direction: SortDirection;
  onChange: (field: SortField, direction: SortDirection) => void;
}

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "rank", label: "Overall Fit Match" },
  { value: "technical", label: "Technical Competence" },
  { value: "reliability", label: "Profile Reliability" },
  { value: "experience", label: "Experience Tenure" },
  { value: "availability", label: "Notice / Availability" },
];

export const SortSelector: React.FC<SortSelectorProps> = ({
  field,
  direction,
  onChange,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);

  const activeOption = SORT_OPTIONS.find((o) => o.value === field) || SORT_OPTIONS[0];

  const handleSelect = (val: SortField) => {
    onChange(val, direction);
    setIsOpen(false);
  };

  const toggleDirection = () => {
    onChange(field, direction === "asc" ? "desc" : "asc");
  };

  return (
    <div className="relative flex items-center gap-2 select-none shrink-0 z-30">
      
      {/* Dropdown Selector trigger */}
      <div className="flex items-center bg-slate-200/50 dark:bg-slate-950 rounded-xl border border-slate-300 dark:border-slate-800 p-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-250 flex items-center gap-2 hover:bg-slate-200/50 dark:hover:bg-slate-900 transition-colors outline-none focus-ring"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <ArrowUpDown size={12} className="text-blue-500 shrink-0" />
          <span>Sort: {activeOption.label}</span>
          <ChevronDown size={11} className={`text-slate-450 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Sort Direction Toggle Button */}
        <button
          onClick={toggleDirection}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-500 hover:bg-slate-200/50 dark:hover:bg-slate-900 transition-colors outline-none focus-ring"
          title={`Switch to ${direction === "asc" ? "descending" : "ascending"} sort`}
        >
          {direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
        </button>
      </div>

      {/* Options Panel Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col p-1"
            role="listbox"
          >
            {SORT_OPTIONS.map((opt) => {
              const isSelected = opt.value === field;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg flex items-center justify-between transition-colors outline-none focus-ring
                    ${
                      isSelected
                        ? "bg-blue-500/10 text-blue-500"
                        : "text-slate-655 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900/60"
                    }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={12} />}
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
