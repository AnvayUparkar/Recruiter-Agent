import React from "react";
import { motion } from "framer-motion";
import { Briefcase, Calendar, Building2, TrendingUp } from "lucide-react";
import { CareerHistory } from "../../../types/candidate";

interface CareerTimelineProps {
  careerHistory?: CareerHistory[];
}

const TENURE_COLORS = [
  { min: 36, color: "#10b981", label: "Long tenure" },
  { min: 18, color: "#3b82f6", label: "Solid stint" },
  { min: 6, color: "#f59e0b", label: "Short stay" },
  { min: 0, color: "#ef4444", label: "Brief" },
];

const getTenureMeta = (months: number) =>
  TENURE_COLORS.find((c) => months >= c.min) ?? TENURE_COLORS[TENURE_COLORS.length - 1];

const formatDuration = (months: number) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}m`;
  if (m === 0) return `${y}y`;
  return `${y}y ${m}m`;
};

const CareerTimeline: React.FC<CareerTimelineProps> = ({ careerHistory }) => {
  if (!careerHistory?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
      className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <TrendingUp size={14} className="text-blue-400" />
          </div>
          <span className="text-sm font-bold text-slate-100 tracking-tight">
            Career Timeline
          </span>
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {careerHistory.length} positions
        </span>
      </div>

      <div className="p-6">
        <div className="relative flex flex-col gap-0">
          {/* Vertical track */}
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-blue-500/40 via-slate-700/40 to-transparent" />

          {careerHistory.map((job, idx) => {
            const meta = getTenureMeta(job.durationMonths);
            const isFirst = idx === 0;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + idx * 0.07 }}
                className="flex gap-4 pb-6 last:pb-0 relative"
              >
                {/* Timeline node */}
                <div className="relative z-10 shrink-0 mt-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${meta.color}18`,
                      border: `1.5px solid ${meta.color}40`,
                      boxShadow: isFirst ? `0 0 12px ${meta.color}30` : undefined,
                    }}
                  >
                    <Briefcase size={15} style={{ color: meta.color }} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-100 truncate">
                      {job.title}
                    </h3>
                    {job.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/12 border border-emerald-500/25 text-emerald-400">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-400">
                      <Building2 size={11} />
                      {job.company}
                    </span>
                    {job.companySize && (
                      <span className="text-[10px] text-slate-500">{job.companySize}</span>
                    )}
                    {job.isProductCompany && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/12 border border-violet-500/20 text-violet-400 font-bold">
                        Product Co.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {job.startDate} — {job.endDate || "Present"}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded font-bold"
                      style={{
                        color: meta.color,
                        backgroundColor: `${meta.color}12`,
                      }}
                    >
                      {formatDuration(job.durationMonths)}
                    </span>
                    <span className="italic text-slate-600">{meta.label}</span>
                  </div>

                  {job.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {job.description}
                    </p>
                  )}

                  {job.hasProductionKeywords && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        ⚡ Production Keywords
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default CareerTimeline;
