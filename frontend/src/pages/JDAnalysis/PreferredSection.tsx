import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, CheckSquare } from "lucide-react";

interface PreferredSectionProps {
  items: string[];
}

export const PreferredSection: React.FC<PreferredSectionProps> = ({ items }) => {
  const shouldReduceMotion = useReducedMotion();

  if (!items || items.length === 0) {
    return null;
  }

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-250/20 dark:border-slate-850">
        <Sparkles size={16} className="text-amber-500 shrink-0" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest">
          Preferred Credentials & Qualifiers
        </span>
      </div>

      {/* Grid List */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { x: 3, transition: { duration: 0.15 } }}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-200/30 dark:bg-slate-950/40 border border-slate-250/50 dark:border-slate-850 outline-none focus-ring cursor-pointer"
            tabIndex={0}
          >
            <div className="w-5.5 h-5.5 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
              <CheckSquare size={12} />
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {item}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default PreferredSection;
