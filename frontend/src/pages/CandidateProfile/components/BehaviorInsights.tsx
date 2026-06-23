import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { BehavioralIntelligence } from "../../../types/behavior";
import { RedrobSignals } from "../../../types/candidate";

interface BehaviorInsightsProps {
  behaviorProfile?: BehavioralIntelligence | null;
  signals?: RedrobSignals | null;
}

const StatCell: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}> = ({ label, value, unit, color = "#94a3b8" }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] text-slate-600 dark:text-slate-500 font-semibold uppercase tracking-wider">
      {label}
    </span>
    <span className="text-lg font-black tabular-nums" style={{ color }}>
      {value}
      {unit && <span className="text-xs font-semibold text-slate-600 dark:text-slate-500 ml-0.5">{unit}</span>}
    </span>
  </div>
);

const GaugeBar: React.FC<{ value: number; color: string; label: string; delay: number }> = ({
  value,
  color,
  label,
  delay,
}) => {
  const pct = Math.min(100, Math.round(value * 100));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-700 dark:text-slate-400 font-semibold">{label}</span>
        <span className="text-xs font-black tabular-nums" style={{ color }}>
          {pct}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}50` }}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay }}
        />
      </div>
    </div>
  );
};

const BehaviorInsights: React.FC<BehaviorInsightsProps> = ({
  behaviorProfile,
  signals,
}) => {
  if (!behaviorProfile && !signals) return null;

  const joinProbability = behaviorProfile
    ? Math.round(behaviorProfile.joinProbability * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="rounded-2xl border border-slate-200/20 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200/40 dark:border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Activity size={14} className="text-cyan-500 dark:text-cyan-400" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Behavioral Insights
          </span>
        </div>
        {joinProbability !== null && (
          <div className="text-right">
            <span className="text-[10px] text-slate-600 dark:text-slate-500 uppercase tracking-wider block">
              Join Probability
            </span>
            <span
              className="text-xl font-black"
              style={{
                color:
                  joinProbability >= 70
                    ? "#10b981"
                    : joinProbability >= 40
                    ? "#3b82f6"
                    : "#f59e0b",
              }}
            >
              {joinProbability}%
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Platform signal stats */}
        {signals && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCell
              label="Response Rate"
              value={`${Math.round((signals.recruiterResponseRate ?? 0) * 100)}%`}
              color={
                (signals.recruiterResponseRate ?? 0) > 0.7 ? "#10b981" : "#f59e0b"
              }
            />
            <StatCell
              label="Avg Response"
              value={(signals.avgResponseTimeHours ?? 0).toFixed(1)}
              unit="h"
              color="#94a3b8"
            />
            <StatCell
              label="Interview Completion"
              value={`${Math.round((signals.interviewCompletionRate ?? 0) * 100)}%`}
              color={
                (signals.interviewCompletionRate ?? 0) > 0.7 ? "#10b981" : "#f59e0b"
              }
            />
            <StatCell
              label="Offer Acceptance"
              value={`${Math.round((signals.offerAcceptanceRate ?? 0) * 100)}%`}
              color={
                (signals.offerAcceptanceRate ?? 0) > 0.7 ? "#10b981" : "#f59e0b"
              }
            />
          </div>
        )}

        {/* Behavioral scores */}
        {behaviorProfile && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-500">
              Engagement Dimensions
            </span>
            <GaugeBar
              label="Behavioral Score"
              value={behaviorProfile.behavioralScore}
              color="#3b82f6"
              delay={0.1}
            />
            <GaugeBar
              label="Responsiveness"
              value={behaviorProfile.responsivenessScore}
              color="#10b981"
              delay={0.15}
            />
            <GaugeBar
              label="Recruiter Friendliness"
              value={behaviorProfile.recruiterFriendliness}
              color="#8b5cf6"
              delay={0.2}
            />
            <GaugeBar
              label="Engagement"
              value={behaviorProfile.engagementScore}
              color="#f59e0b"
              delay={0.25}
            />
            <GaugeBar
              label="Availability"
              value={behaviorProfile.availabilityScore}
              color="#06b6d4"
              delay={0.3}
            />
          </div>
        )}

        {/* Evidence tags */}
        {behaviorProfile?.evidence && behaviorProfile.evidence.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-500">
              Evidence
            </span>
            <div className="flex flex-wrap gap-2">
              {behaviorProfile.evidence.map((e, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/50"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Signals extras */}
        {signals && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/40 dark:border-white/5">
            <StatCell
              label="Notice Period"
              value={signals.noticePeriodDays ?? 0}
              unit="d"
            />
            <StatCell
              label="Work Mode"
              value={
                signals.preferredWorkMode
                  ? signals.preferredWorkMode.charAt(0).toUpperCase() +
                    signals.preferredWorkMode.slice(1)
                  : "—"
              }
            />
            <StatCell
              label="Profile Views (30d)"
              value={signals.profileViewsReceived30d ?? 0}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BehaviorInsights;
