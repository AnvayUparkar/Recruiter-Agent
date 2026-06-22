import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, TrendingDown, Info } from "lucide-react";
import { ReliabilityProfile, FraudProfile, ConsistencyProfile } from "../../../types/reliability";

interface ReliabilityPanelProps {
  reliabilityProfile?: ReliabilityProfile | null;
}

const ScoreRing: React.FC<{ pct: number; color: string; size?: number }> = ({
  pct,
  color,
  size = 56,
}) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, pct) / 100) * circ;
  return (
    <svg width={size} height={size} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={5}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.26}
        fontWeight={800}
        fontFamily="inherit"
      >
        {pct}
      </text>
    </svg>
  );
};

const getVerdict = (score: number) => {
  if (score >= 0.8) return { label: "Trusted Profile", color: "#10b981", icon: ShieldCheck };
  if (score >= 0.5) return { label: "Verify Highlights", color: "#f59e0b", icon: AlertTriangle };
  return { label: "High Risk", color: "#ef4444", icon: TrendingDown };
};

const SubScoreRow: React.FC<{ label: string; value: number; color: string; delay: number }> = ({
  label,
  value,
  color,
  delay,
}) => {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-semibold">{label}</span>
        <span className="text-xs font-black tabular-nums" style={{ color }}>
          {pct}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay }}
        />
      </div>
    </div>
  );
};

const FraudRiskPanel: React.FC<{ fraud?: FraudProfile }> = ({ fraud }) => {
  if (!fraud) return null;
  const overallPct = Math.round((fraud.overallFraudRisk ?? 0) * 100);
  const isLow = overallPct < 30;
  const color = isLow ? "#10b981" : overallPct < 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="rounded-xl border border-white/6 p-4 flex flex-col gap-3">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <AlertTriangle size={11} />
        Fraud Risk Indicators
      </span>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {[
          { label: "Skill Stuffing", val: fraud.skillStuffingRisk },
          { label: "Timeline Risk", val: fraud.timelineRisk },
          { label: "Identity Risk", val: fraud.identityRisk },
          { label: "Experience Risk", val: fraud.experienceRisk },
          { label: "Anomaly Risk", val: fraud.anomalyRisk },
        ].map(({ label, val }, i) => {
          const riskColor =
            val < 0.3 ? "#10b981" : val < 0.6 ? "#f59e0b" : "#ef4444";
          return (
            <SubScoreRow
              key={label}
              label={label}
              value={val ?? 0}
              color={riskColor}
              delay={0.05 * i}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-xs text-slate-500 font-semibold">Overall Fraud Risk</span>
        <span className="text-sm font-black" style={{ color }}>
          {overallPct}%
        </span>
      </div>
    </div>
  );
};

const ConsistencyPanelBlock: React.FC<{ consistency?: ConsistencyProfile }> = ({
  consistency,
}) => {
  if (!consistency) return null;
  return (
    <div className="rounded-xl border border-white/6 p-4 flex flex-col gap-3">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <Info size={11} />
        Consistency Audit
      </span>
      <div className="flex flex-col gap-2">
        {[
          { label: "Career Consistency", val: consistency.careerConsistency },
          { label: "Timeline Consistency", val: consistency.timelineConsistency },
          { label: "Skill Consistency", val: consistency.skillConsistency },
          { label: "Title Consistency", val: consistency.titleConsistency },
          { label: "Experience Consistency", val: consistency.experienceConsistency },
        ].map(({ label, val }, i) => {
          const c = val >= 0.7 ? "#10b981" : val >= 0.4 ? "#f59e0b" : "#ef4444";
          return (
            <SubScoreRow key={label} label={label} value={val ?? 0} color={c} delay={0.05 * i} />
          );
        })}
      </div>
    </div>
  );
};

const ReliabilityPanel: React.FC<ReliabilityPanelProps> = ({ reliabilityProfile }) => {
  if (!reliabilityProfile) return null;

  const score = reliabilityProfile.reliabilityScore ?? 0;
  const pct = Math.round(score * 100);
  const verdict = getVerdict(score);
  const VerdictIcon = verdict.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <span className="text-sm font-bold text-slate-100 tracking-tight">
            Reliability Audit
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div
              className="flex items-center gap-1.5 text-xs font-bold"
              style={{ color: verdict.color }}
            >
              <VerdictIcon size={13} />
              {verdict.label}
            </div>
            <span className="text-[10px] text-slate-600">
              Confidence: {Math.round((reliabilityProfile.confidence ?? 0) * 100)}%
            </span>
          </div>
          <ScoreRing pct={pct} color={verdict.color} />
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Core reliability scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Quality", value: reliabilityProfile.qualityScore ?? 0, color: "#3b82f6" },
            { label: "Consistency", value: reliabilityProfile.consistencyScore ?? 0, color: "#10b981" },
            { label: "Behavioral", value: reliabilityProfile.behavioralScore ?? 0, color: "#8b5cf6" },
            { label: "Trust", value: reliabilityProfile.trustScore ?? 0, color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <ScoreRing pct={Math.round(value * 100)} color={color} size={52} />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Fraud penalty */}
        {reliabilityProfile.fraudPenalty > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-500/8 border border-rose-500/20">
            <span className="text-xs font-semibold text-rose-400">Fraud Penalty Applied</span>
            <span className="text-sm font-black text-rose-400">
              -{Math.round(reliabilityProfile.fraudPenalty * 100)} pts
            </span>
          </div>
        )}

        {/* Sub-panels */}
        <FraudRiskPanel fraud={reliabilityProfile.fraudProfile} />
        <ConsistencyPanelBlock consistency={reliabilityProfile.consistencyProfile} />

        {/* Evidence */}
        {reliabilityProfile.evidence?.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Audit Evidence
            </span>
            <ul className="flex flex-col gap-1">
              {reliabilityProfile.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-slate-600 mt-0.5">•</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReliabilityPanel;
