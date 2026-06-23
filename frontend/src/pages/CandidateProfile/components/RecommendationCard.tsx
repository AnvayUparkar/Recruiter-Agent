import React from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Zap } from "lucide-react";
import { ExplanationResponse } from "../../../types/ranking";
import { RankedCandidate } from "../../../types/ranking";

interface RecommendationCardProps {
  rankedData?: RankedCandidate | null;
  explanation?: ExplanationResponse | null;
}

interface VerdictConfig {
  label: string;
  sublabel: string;
  color: string;
  glow: string;
  icon: React.FC<{ size?: number; className?: string }>;
  badge: string;
}

const VERDICTS: Record<string, VerdictConfig> = {
  strong: {
    label: "Strong Hire",
    sublabel: "Highly recommended for this role",
    color: "#10b981",
    glow: "rgba(16,185,129,0.15)",
    icon: Trophy,
    badge: "✦ TOP PICK",
  },
  good: {
    label: "Good Fit",
    sublabel: "Solid match with manageable gaps",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.12)",
    icon: TrendingUp,
    badge: "◎ RECOMMENDED",
  },
  moderate: {
    label: "Moderate Fit",
    sublabel: "Worth interviewing with targeted questions",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.10)",
    icon: Zap,
    badge: "△ CONSIDER",
  },
  low: {
    label: "Low Priority",
    sublabel: "Significant gaps relative to the JD requirements",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.10)",
    icon: Zap,
    badge: "○ REVIEW",
  },
};

const classifyVerdict = (
  score: number,
  verdictStr?: string
): keyof typeof VERDICTS => {
  const v = verdictStr?.toLowerCase() ?? "";
  if (v.includes("strong") || v.includes("excellent") || score >= 0.8) return "strong";
  if (v.includes("good") || v.includes("moderate") || score >= 0.6) return "good";
  if (score >= 0.45) return "moderate";
  return "low";
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  rankedData,
  explanation,
}) => {
  if (!rankedData && !explanation) return null;

  const score = rankedData?.finalScore ?? 0;
  const verdictKey = classifyVerdict(score, rankedData?.verdict || explanation?.fitVerdict || explanation?.fit_verdict);
  const cfg = VERDICTS[verdictKey];
  const Icon = cfg.icon;
  const scorePct = Math.round(score * 100);
  const confidence = rankedData?.confidence ? Math.round(rankedData.confidence * 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: `${cfg.color}30`,
        background: `radial-gradient(ellipse at top, ${cfg.glow}, transparent 70%), rgba(248,250,252,0.8)`,
        boxShadow: `0 0 40px ${cfg.glow}`,
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="dark:bg-[rgba(15,23,42,0.8)] bg-transparent absolute inset-0 -z-10" />
      <div className="p-6 md:p-8 flex flex-col items-center text-center gap-4 relative z-10">
        {/* Glow icon */}
        <motion.div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: `${cfg.color}18`,
            border: `1.5px solid ${cfg.color}35`,
            boxShadow: `0 0 24px ${cfg.color}30`,
          }}
          animate={{ boxShadow: [`0 0 24px ${cfg.color}30`, `0 0 48px ${cfg.color}50`, `0 0 24px ${cfg.color}30`] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span style={{ color: cfg.color }}>
            <Icon size={28} />
          </span>
        </motion.div>

        {/* Badge */}
        <span
          className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border"
          style={{
            color: cfg.color,
            borderColor: `${cfg.color}35`,
            backgroundColor: `${cfg.color}10`,
          }}
        >
          {cfg.badge}
        </span>

        {/* Verdict */}
        <div>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: cfg.color }}>
            {cfg.label}
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-400 mt-1">{cfg.sublabel}</p>
        </div>

        {/* Score + confidence row */}
        {scorePct > 0 && (
          <div className="flex items-center gap-6 pt-2 border-t border-slate-200/30 dark:border-white/5 w-full justify-center">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black tabular-nums" style={{ color: cfg.color }}>
                {scorePct}
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-500 font-semibold uppercase tracking-wider">
                AI Score
              </span>
            </div>
            {confidence !== null && (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black tabular-nums text-slate-800 dark:text-slate-300">
                  {confidence}%
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  Confidence
                </span>
              </div>
            )}
            {rankedData?.rank && (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black tabular-nums text-amber-500 dark:text-amber-400">
                  #{rankedData.rank}
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  Rank
                </span>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {(rankedData?.summary || explanation?.summary) && (
          <p className="text-xs text-slate-700 dark:text-slate-400 leading-relaxed max-w-md">
            {rankedData?.summary || explanation?.summary}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default RecommendationCard;
