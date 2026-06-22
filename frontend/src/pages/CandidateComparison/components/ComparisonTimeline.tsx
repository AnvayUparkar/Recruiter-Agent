import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Candidate } from "../../../types/candidate";
import { Calendar, Briefcase, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";

interface ComparisonTimelineProps {
  candidate: Candidate;
}

export const ComparisonTimeline: React.FC<ComparisonTimelineProps> = ({
  candidate,
}) => {
  const history = candidate.career_history || [];
  const years = candidate.experienceYears || candidate.profile?.yearsOfExperience || 0;

  // Track expanded job indices
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Helper to format date strings
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Present";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-5 rounded-2xl glass-panel border-white/10 shadow-md flex flex-col gap-4 bg-white/2 h-full">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div>
          <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Career Timeline
          </h3>
          <p className="text-sm font-semibold text-white mt-0.5">
            {candidate.name}
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {years} Years Exp
        </span>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-xs gap-2">
          <Briefcase size={20} />
          <span>No career history documented.</span>
        </div>
      ) : (
        <div className="relative flex flex-col pl-4 border-l border-white/10 gap-5 mt-2">
          {history.map((job, idx) => {
            const isExpanded = expandedIndices.includes(idx);
            const isPromotion =
              idx < history.length - 1 &&
              history[idx + 1].company === job.company &&
              job.title !== history[idx + 1].title;

            return (
              <div key={idx} className="relative group">
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-black transition-all duration-300
                    ${
                      job.isCurrent
                        ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                        : "bg-slate-600 group-hover:bg-blue-400"
                    }`}
                />

                {/* Job Card */}
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/2 border border-white/5 group-hover:border-white/10 transition-all duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {job.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
                        {job.company}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleExpand(idx)}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      aria-label={isExpanded ? "Collapse job details" : "Expand job details"}
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      <span>
                        {formatDate(job.startDate)} – {formatDate(job.endDate)}
                      </span>
                    </span>
                    <span>•</span>
                    <span>{Math.round(job.durationMonths / 12 * 10) / 10} yrs</span>
                  </div>

                  {/* Promotion/Tenure Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {job.isCurrent && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold uppercase px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Current Role
                      </span>
                    )}
                    {job.isProductCompany && (
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 font-bold uppercase px-1.5 py-0.5 rounded border border-blue-500/20">
                        Product Co.
                      </span>
                    )}
                    {isPromotion && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 font-bold uppercase px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5">
                        <TrendingUp size={9} /> Promotion Cadence
                      </span>
                    )}
                  </div>

                  {/* Expandable description */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-2 border-t border-white/5 pt-2"
                      >
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans whitespace-pre-line">
                          {job.description || "No description provided."}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ComparisonTimeline;
