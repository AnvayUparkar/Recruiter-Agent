import React from "react";
import { Sparkles, CheckCircle2, UserCheck, AlertCircle } from "lucide-react";

interface RecommendationBadgeProps {
  verdict: string;
}

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({ verdict }) => {
  const getBadgeStyle = (v: string) => {
    const val = v.toLowerCase();
    if (val.includes("strong") || val.includes("hire")) {
      return {
        label: "Strong Hire",
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/5",
        icon: Sparkles,
        glow: "shadow-emerald-500/20",
        tooltip: "Highly recommended. Excellent skills alignment, strong tenure, and low inconsistency risk."
      };
    }
    if (val.includes("interview") || val.includes("good")) {
      return {
        label: "Interview",
        color: "text-blue-500 bg-blue-500/10 border-blue-500/30 shadow-blue-500/5",
        icon: UserCheck,
        glow: "shadow-blue-500/20",
        tooltip: "Good candidate. Strongly aligned required capabilities, standard interview target."
      };
    }
    if (val.includes("consider") || val.includes("backup")) {
      return {
        label: "Backup / Consider",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/30 shadow-amber-500/5",
        icon: CheckCircle2,
        glow: "shadow-amber-500/20",
        tooltip: "Potential match. Possesses must-have criteria but secondary parameters need review."
      };
    }
    return {
      label: "Needs Review",
      color: "text-rose-500 bg-rose-500/10 border-rose-500/30 shadow-rose-500/5",
      icon: AlertCircle,
      glow: "shadow-rose-500/20",
      tooltip: "Low alignment. Significant gaps in core skills or experience levels."
    };
  };

  const config = getBadgeStyle(verdict);
  const Icon = config.icon;

  return (
    <div className="relative group inline-block select-none">
      <span
        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer outline-none focus-ring shadow-lg ${config.color}`}
        tabIndex={0}
      >
        <Icon size={12} className="shrink-0 animate-pulse" />
        <span>{config.label}</span>
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-slate-950 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal z-50 shadow-xl border border-slate-800 w-44 leading-relaxed text-center">
        {config.tooltip}
      </div>
    </div>
  );
};

export default RecommendationBadge;
