import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp, Bot } from "lucide-react";

interface ResponsibilityItem {
  title: string;
  detail: string;
}

interface ResponsibilitiesSectionProps {
  items: ResponsibilityItem[];
}

export const ResponsibilitiesSection: React.FC<ResponsibilitiesSectionProps> = ({ items }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // Default open first
  const shouldReduceMotion = useReducedMotion();

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl space-y-4.5 select-none">
      
      {/* Title Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-250/20 dark:border-slate-850">
        <Bot size={16} className="text-purple-500" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest">
          Extracted Core Responsibilities
        </span>
      </div>

      {/* Accordion Timeline List */}
      <div className="space-y-3 relative pl-3.5">
        {/* Timeline left line */}
        <div className="absolute left-[5px] top-[14px] bottom-[14px] w-0.5 bg-slate-200 dark:bg-slate-800 pointer-events-none" />

        {items.map((item, idx) => {
          const isExpanded = expandedIndex === idx;

          return (
            <div key={idx} className="flex flex-col gap-2 relative">
              
              {/* Timeline Bullet Ring */}
              <div
                className={`absolute -left-[18px] top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300
                  ${isExpanded ? "bg-purple-500 border-purple-550 scale-110 shadow shadow-purple-500/50" : "bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800"}`}
              />

              {/* Title Trigger Row */}
              <button
                onClick={() => handleToggle(idx)}
                className={`w-full flex justify-between items-center text-xs font-bold transition-all text-left outline-none rounded-lg p-1.5 hover:bg-slate-200/40 dark:hover:bg-slate-950/40 focus-ring
                  ${isExpanded ? "text-purple-500 dark:text-purple-400 font-extrabold" : "text-slate-655 dark:text-slate-400"}`}
                aria-expanded={isExpanded}
              >
                <span>{item.title}</span>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-slate-450 dark:text-slate-600 shrink-0" />
                ) : (
                  <ChevronDown size={14} className="text-slate-450 dark:text-slate-600 shrink-0" />
                )}
              </button>

              {/* Expanded Description detail card */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <p className="pl-1.5 pb-2 text-[10.5px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                      {item.detail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResponsibilitiesSection;
