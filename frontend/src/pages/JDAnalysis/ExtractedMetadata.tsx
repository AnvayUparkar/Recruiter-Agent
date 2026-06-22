import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, DollarSign, Calendar, Clock } from "lucide-react";

interface ExtractedMetadataProps {
  location?: string;
  salaryRange?: string;
  noticePeriod?: string;
  employmentType?: string;
}

export const ExtractedMetadata: React.FC<ExtractedMetadataProps> = ({
  location = "Not Specified",
  salaryRange = "Competitive Rate",
  noticePeriod = "Standard",
  employmentType = "Full-Time",
}) => {
  const shouldReduceMotion = useReducedMotion();

  const metaItems = [
    {
      label: "Work Location",
      value: location,
      icon: MapPin,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Salary Indicator",
      value: salaryRange,
      icon: DollarSign,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Notice Window",
      value: noticePeriod,
      icon: Clock,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Employment Basis",
      value: employmentType,
      icon: Calendar,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
  ];

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 280, damping: 25 },
    },
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-250/20 dark:border-slate-850">
        <MapPin size={16} className="text-purple-500 shrink-0" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest">
          Administrative & Offer Context
        </span>
      </div>

      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full"
      >
        {metaItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={shouldReduceMotion ? {} : { y: -2, transition: { duration: 0.15 } }}
              className="p-3.5 rounded-xl bg-slate-200/20 dark:bg-slate-950/30 border border-slate-250/30 dark:border-slate-850 flex items-center gap-3 cursor-pointer outline-none focus-ring"
              tabIndex={0}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${item.color}`}>
                <Icon size={14} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[8.5px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider block">
                  {item.label}
                </span>
                <span className="text-[10.5px] font-bold text-slate-900 dark:text-slate-100 block truncate capitalize" title={item.value}>
                  {item.value}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default ExtractedMetadata;
