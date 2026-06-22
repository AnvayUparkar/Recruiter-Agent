import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ListChecks } from "lucide-react";

interface TimelineItem {
  label: string;
  value: string | number;
  status: "success" | "pending";
}

interface AnalysisTimelineProps {
  titleDetected: boolean;
  requiredSkillsCount: number;
  preferredSkillsCount: number;
  experienceRange: [number, number];
  educationCount: number;
  responsibilitiesCount: number;
  metadataCount: number;
}

export const AnalysisTimeline: React.FC<AnalysisTimelineProps> = ({
  titleDetected,
  requiredSkillsCount,
  preferredSkillsCount,
  experienceRange,
  educationCount,
  responsibilitiesCount,
  metadataCount,
}) => {
  const checkItems: TimelineItem[] = [
    {
      label: "Job Profile Detected",
      value: titleDetected ? "Success" : "Pending",
      status: titleDetected ? "success" : "pending",
    },
    {
      label: "Required Capabilities",
      value: requiredSkillsCount > 0 ? `${requiredSkillsCount} Skills` : "None Found",
      status: requiredSkillsCount > 0 ? "success" : "pending",
    },
    {
      label: "Preferred Skills",
      value: preferredSkillsCount > 0 ? `${preferredSkillsCount} Skills` : "None Found",
      status: preferredSkillsCount > 0 ? "success" : "pending",
    },
    {
      label: "Tenure Bounds Vetted",
      value: experienceRange[0] !== undefined ? `${experienceRange[0]}-${experienceRange[1]} yrs` : "Pending",
      status: experienceRange[0] !== undefined ? "success" : "pending",
    },
    {
      label: "Degrees & Certifications",
      value: educationCount > 0 ? `${educationCount} Benchmarks` : "None Found",
      status: educationCount > 0 ? "success" : "pending",
    },
    {
      label: "Core Responsibilities",
      value: responsibilitiesCount > 0 ? `${responsibilitiesCount} Tasks` : "None Found",
      status: responsibilitiesCount > 0 ? "success" : "pending",
    },
    {
      label: "Administrative Details",
      value: metadataCount > 0 ? `${metadataCount} Fields` : "None Found",
      status: metadataCount > 0 ? "success" : "pending",
    },
  ];

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, x: -8 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl space-y-5 select-none relative">
      {/* Title */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-250/20 dark:border-slate-850">
        <ListChecks size={16} className="text-blue-500 shrink-0" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest">
          Extraction Dossier Status
        </span>
      </div>

      {/* Checklist list */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-40px" }}
        className="space-y-3 relative pl-3.5"
      >
        {/* Connector vertical line */}
        <div className="absolute left-[5.5px] top-[10px] bottom-[10px] w-0.5 bg-slate-200 dark:bg-slate-850 pointer-events-none" />

        {checkItems.map((item, idx) => {
          const isSuccess = item.status === "success";
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="flex items-start justify-between gap-3 relative"
            >
              {/* Bullet Node */}
              <div
                className={`absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300
                  ${isSuccess ? "bg-emerald-500 border-emerald-550 shadow-sm shadow-emerald-500/50" : "bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800"}`}
              />

              <div className="space-y-0.5 pl-1">
                <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-350 block">
                  {item.label}
                </span>
                <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-550 block">
                  {item.value}
                </span>
              </div>

              {isSuccess ? (
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-slate-350 dark:border-slate-800 shrink-0 mt-0.5 animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default AnalysisTimeline;
