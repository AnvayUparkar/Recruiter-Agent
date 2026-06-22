import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Award } from "lucide-react";
import { Education } from "../../../types/candidate";

interface EducationSectionProps {
  education?: Education[];
}

const TIER_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  tier_1: {
    label: "Tier 1",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
  tier_2: {
    label: "Tier 2",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
  },
  tier_3: {
    label: "Tier 3",
    color: "text-slate-400",
    bg: "bg-slate-700/40",
    border: "border-slate-700/50",
  },
  tier_4: {
    label: "Tier 4",
    color: "text-slate-500",
    bg: "bg-slate-800/40",
    border: "border-slate-800/50",
  },
  unknown: {
    label: "Unranked",
    color: "text-slate-500",
    bg: "bg-slate-800/40",
    border: "border-slate-800/50",
  },
};

const EducationSection: React.FC<EducationSectionProps> = ({ education }) => {
  if (!education?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 }}
      className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/6 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <GraduationCap size={14} className="text-amber-400" />
        </div>
        <span className="text-sm font-bold text-slate-100 tracking-tight">Education</span>
      </div>

      <div className="p-6 flex flex-col gap-4">
        {education.map((edu, idx) => {
          const tierMeta = TIER_META[edu.tier] ?? TIER_META.unknown;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.07 }}
              className="flex gap-4 items-start p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 transition-colors"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Award size={16} className="text-amber-400" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-100">
                    {edu.degree}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierMeta.bg} ${tierMeta.border} ${tierMeta.color}`}
                  >
                    {tierMeta.label}
                  </span>
                </div>
                <p className="text-xs font-semibold text-blue-400 mb-0.5">
                  {edu.fieldOfStudy}
                </p>
                <p className="text-xs text-slate-400">{edu.institution}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
                  <span>
                    {edu.startYear} — {edu.endYear}
                  </span>
                  {edu.grade && (
                    <span className="text-slate-500 font-semibold">
                      Grade: {edu.grade}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default EducationSection;
