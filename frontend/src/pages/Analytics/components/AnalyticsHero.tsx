import React from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, Shield, Sparkles, Clock, FileSpreadsheet } from "lucide-react";

interface AnalyticsHeroProps {
  totalCandidates: number;
  shortlistedCount: number;
  avgReliability: number;
  avgMatchScore: number;
  processingTime: number;
  reportsCount: number;
}

export const AnalyticsHero: React.FC<AnalyticsHeroProps> = ({
  totalCandidates,
  shortlistedCount,
  avgReliability,
  avgMatchScore,
  processingTime,
  reportsCount,
}) => {
  const kpis = [
    {
      label: "Total Pool Candidates",
      value: totalCandidates,
      suffix: "",
      icon: <Users size={20} className="text-blue-400" />,
      bg: "from-blue-500/10 to-indigo-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Shortlisted Candidates",
      value: shortlistedCount,
      suffix: "",
      icon: <CheckCircle size={20} className="text-emerald-400" />,
      bg: "from-emerald-500/10 to-teal-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Avg Reliability Score",
      value: Math.round(avgReliability * 100),
      suffix: "%",
      icon: <Shield size={20} className="text-violet-400" />,
      bg: "from-violet-500/10 to-purple-500/10",
      border: "border-violet-500/20",
    },
    {
      label: "Avg Match Score",
      value: Math.round(avgMatchScore * 100),
      suffix: "%",
      icon: <Sparkles size={20} className="text-amber-400" />,
      bg: "from-amber-500/10 to-orange-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Avg Telemetry Latency",
      value: processingTime,
      suffix: " ms",
      icon: <Clock size={20} className="text-cyan-400" />,
      bg: "from-cyan-500/10 to-blue-500/10",
      border: "border-cyan-500/20",
    },
    {
      label: "Reports Exported",
      value: reportsCount,
      suffix: "",
      icon: <FileSpreadsheet size={20} className="text-pink-400" />,
      bg: "from-pink-500/10 to-fuchsia-500/10",
      border: "border-pink-500/20",
    },
  ];

  return (
    <div className="flex flex-col gap-6 mb-6">
      {/* Welcome Title */}
      <div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
          AI Recruiter Analytics Center
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Monitor ranking quality, hiring insights, system latency, and AI evaluation metrics in real time.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 140,
              damping: 20,
              delay: idx * 0.05,
            }}
            className={`p-4 rounded-2xl glass-panel border border-white/5 bg-gradient-to-br ${kpi.bg} ${kpi.border} shadow-md flex flex-col gap-3 group hover-sweep overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider">
                {kpi.label}
              </span>
              <div className="shrink-0 group-hover:scale-110 transition-transform duration-200">
                {kpi.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                {kpi.value}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400 font-mono">
                {kpi.suffix}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsHero;
