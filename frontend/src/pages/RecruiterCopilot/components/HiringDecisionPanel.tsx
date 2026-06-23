import React from "react";
import { motion } from "framer-motion";
import { Trophy, AlertCircle, Zap } from "lucide-react";
import { HiringDecision } from "../../../types/copilot";

interface HiringDecisionPanelProps {
  decision?: HiringDecision | null;
  isLoading?: boolean;
}

const DECISION_META: Record<string, { color: string; bg: string; icon: typeof Trophy; label: string }> = {
  "strong hire": { color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: Trophy, label: "Strong Hire" },
  "hire": { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: Trophy, label: "Hire" },
  "interview": { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: Zap, label: "Interview" },
  "consider": { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: Zap, label: "Consider" },
  "needs review": { color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: AlertCircle, label: "Needs Review" },
  "reject": { color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: AlertCircle, label: "Reject" },
};

const getDM = (dec: string) => {
  const key = dec.toLowerCase().trim();
  return (
    DECISION_META[key] ??
    Object.entries(DECISION_META).find(([k]) => key.includes(k))?.[1] ??
    DECISION_META["consider"]
  );
};

const HiringDecisionPanel: React.FC<HiringDecisionPanelProps> = ({ decision, isLoading }) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface backdrop-blur-xl p-5 flex flex-col gap-3">
        <div className="h-3 w-28 rounded bg-surface-hover animate-pulse" />
        <div className="h-12 rounded-xl bg-surface-hover animate-pulse" />
        <div className="h-16 rounded-xl bg-surface-hover animate-pulse" />
      </div>
    );
  }

  if (!decision) return null;

  const meta = getDM(decision.decision);
  const Icon = meta.icon;
  const confidencePct = Math.round((decision.confidence ?? 0) * 100);
  const evidence = decision.supportingEvidence ?? decision.supporting_evidence ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${meta.color}28`, background: "var(--surface)", backdropFilter: "blur(16px)" }}
    >
      {/* Verdict row */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: `${meta.color}18`, background: meta.bg }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${meta.color}18`, border: `1.5px solid ${meta.color}35` }}
          >
            <Icon size={16} style={{ color: meta.color } as React.CSSProperties} />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
              Hiring Decision
            </span>
            <span className="text-sm font-black" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-text-disabled block">Confidence</span>
          <span className="text-lg font-black" style={{ color: meta.color }}>
            {confidencePct}%
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Confidence bar */}
        <div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: meta.color }}
              initial={{ width: "0%" }}
              animate={{ width: `${confidencePct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>

        {/* Rationale */}
        {decision.rationale && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 block">
              Rationale
            </span>
            <p className="text-xs text-text-muted leading-relaxed">{decision.rationale}</p>
          </div>
        )}

        {/* Risk summary */}
        {(decision.riskSummary || (decision as any).risk_summary) && (
          <div className="p-3 rounded-xl border border-amber-500/15 bg-amber-500/5">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-1">
              <AlertCircle size={10} /> Risk Summary
            </span>
            <p className="text-xs text-text-muted leading-relaxed">
              {decision.riskSummary || (decision as any).risk_summary}
            </p>
          </div>
        )}

        {/* Evidence */}
        {evidence.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Supporting Evidence
            </span>
            {evidence.slice(0, 3).map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-text-muted">
                <span className="text-text-disabled mt-0.5 shrink-0">•</span>
                {e}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HiringDecisionPanel;
