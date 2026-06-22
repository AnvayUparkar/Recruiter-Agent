import React from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { RankingScore } from "../../../types/ranking";

interface ScoreBreakdownProps {
  rankingScore?: RankingScore | null;
}

interface ScoreDimension {
  key: keyof RankingScore;
  label: string;
  color: string;
  glow: string;
  icon: string;
  description: string;
}

const DIMENSIONS: ScoreDimension[] = [
  {
    key: "technicalScore",
    label: "Technical Fit",
    color: "#3b82f6",
    glow: "shadow-blue-500/20",
    icon: "⚡",
    description: "Skills, tech stack & assessment alignment",
  },
  {
    key: "careerScore",
    label: "Career Trajectory",
    color: "#8b5cf6",
    glow: "shadow-violet-500/20",
    icon: "📈",
    description: "Growth, tenure & company quality",
  },
  {
    key: "behavioralScore",
    label: "Behavioral Fit",
    color: "#10b981",
    glow: "shadow-emerald-500/20",
    icon: "🎯",
    description: "Platform engagement & responsiveness",
  },
  {
    key: "trustScore",
    label: "Trust Index",
    color: "#f59e0b",
    glow: "shadow-amber-500/20",
    icon: "🛡",
    description: "Reliability & consistency score",
  },
  {
    key: "matchingScore",
    label: "JD Match",
    color: "#ec4899",
    glow: "shadow-pink-500/20",
    icon: "🔍",
    description: "Semantic alignment with job description",
  },
  {
    key: "leadershipScore",
    label: "Leadership",
    color: "#06b6d4",
    glow: "shadow-cyan-500/20",
    icon: "👑",
    description: "Management scope & team impact signals",
  },
  {
    key: "marketScore",
    label: "Market Availability",
    color: "#84cc16",
    glow: "shadow-lime-500/20",
    icon: "🌐",
    description: "Openness, notice period & relocate intent",
  },
];

const ScoreBar: React.FC<{
  value: number;
  color: string;
  delay: number;
}> = ({ value, color, delay }) => {
  const pct = Math.min(100, Math.max(0, Math.round(value * 100)));
  return (
    <div className="relative h-2 rounded-full bg-white/6 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}55` }}
        initial={{ width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut", delay }}
      />
    </div>
  );
};

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ rankingScore }) => {
  if (!rankingScore) return null;

  const finalPct = Math.round((rankingScore.finalScore ?? 0) * 100);
  const netAdj =
    Math.round((rankingScore.totalBonus ?? 0) * 100) -
    Math.round((rankingScore.totalPenalty ?? 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <BarChart3 size={14} className="text-violet-400" />
          </div>
          <span className="text-sm font-bold text-slate-100 tracking-tight">
            Score Breakdown
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {netAdj !== 0 && (
            <span
              className={`font-bold ${netAdj > 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {netAdj > 0 ? "+" : ""}
              {netAdj} adj
            </span>
          )}
          <span className="text-2xl font-black text-slate-100">{finalPct}</span>
          <span className="text-slate-500 font-semibold">/ 100</span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        {DIMENSIONS.map((dim, i) => {
          const rawVal = rankingScore[dim.key] as number | undefined;
          if (rawVal === undefined || rawVal === null) return null;
          const pct = Math.round(rawVal * 100);

          return (
            <div key={dim.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <span>{dim.icon}</span>
                  {dim.label}
                </span>
                <motion.span
                  className="text-xs font-black tabular-nums"
                  style={{ color: dim.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  {pct}
                </motion.span>
              </div>
              <ScoreBar value={rawVal} color={dim.color} delay={0.1 + i * 0.06} />
              <span className="text-[10px] text-slate-600">{dim.description}</span>
            </div>
          );
        })}
      </div>

      {/* Bonus / Penalty strip */}
      {(rankingScore.totalBonus > 0 || rankingScore.totalPenalty > 0) && (
        <div className="px-6 pb-5 flex items-center gap-4 text-xs">
          {rankingScore.totalBonus > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              +{Math.round(rankingScore.totalBonus * 100)} bonus
            </span>
          )}
          {rankingScore.totalPenalty > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">
              -{Math.round(rankingScore.totalPenalty * 100)} penalty
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ScoreBreakdown;
