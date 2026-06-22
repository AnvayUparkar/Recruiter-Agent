import React from "react";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";

interface ReliabilityBadgeProps {
  score: number; // 0 to 100
}

export const ReliabilityBadge: React.FC<ReliabilityBadgeProps> = ({ score }) => {
  const getTier = (s: number) => {
    if (s >= 90) return { label: "Elite Profile", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: ShieldCheck };
    if (s >= 75) return { label: "Verified Data", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: Shield };
    return { label: "High Risk", color: "text-rose-500 bg-rose-500/10 border-rose-500/20", icon: ShieldAlert };
  };

  const tier = getTier(score);
  const Icon = tier.icon;

  return (
    <div className="relative group inline-block select-none">
      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase border flex items-center gap-1.5 transition-all outline-none focus-ring cursor-pointer ${tier.color}`} tabIndex={0}>
        <Icon size={12} className="shrink-0" />
        <span>{score}% {tier.label}</span>
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-slate-950 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal z-50 shadow-xl border border-slate-800 w-44 leading-relaxed text-center">
        Generated from platform activity consistency, profile completeness, and work history duration checks.
      </div>
    </div>
  );
};

export default ReliabilityBadge;
