import React from "react";
import { Candidate } from "../../../types/candidate";
import { Shield } from "lucide-react";

interface ComparisonReliabilityProps {
  candidate: Candidate;
}

export const ComparisonReliability: React.FC<ComparisonReliabilityProps> = ({
  candidate,
}) => {
  const reliability = candidate.reliabilityProfile;

  // Values
  const reliabilityScore = reliability?.reliabilityScore
    ? Math.round(reliability.reliabilityScore * 100)
    : 80;
  
  const qualityScore = reliability?.qualityScore
    ? Math.round(reliability.qualityScore * 100)
    : reliability?.profileQuality?.profileCompleteness
    ? Math.round(reliability.profileQuality.profileCompleteness * 100)
    : 82;

  const consistencyScore = reliability?.consistencyScore
    ? Math.round(reliability.consistencyScore * 100)
    : reliability?.consistencyProfile?.consistencyScore
    ? Math.round(reliability.consistencyProfile.consistencyScore * 100)
    : 85;

  const fraudRisk = reliability?.fraudProfile?.overallFraudRisk || 0;
  const anomalyCount = reliability?.anomalyProfile?.anomalyCount || 0;

  // Determine neutral risk wording
  const getRiskLabel = (riskVal: number) => {
    if (riskVal < 0.15) return { text: "Negligible Deviation", color: "text-emerald-450 bg-emerald-500/10 border-emerald-500/20" };
    if (riskVal < 0.35) return { text: "Standard Variance", color: "text-blue-450 bg-blue-500/10 border-blue-500/20" };
    return { text: "Further Review Recommended", color: "text-amber-450 bg-amber-500/10 border-amber-500/20" };
  };

  const riskBadge = getRiskLabel(fraudRisk);

  return (
    <div className="p-5 rounded-2xl glass-panel border-white/10 shadow-md flex flex-col gap-4 bg-white/2 h-full">
      <div className="border-b border-white/5 pb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Reliability & Verification
          </h3>
          <p className="text-sm font-semibold text-white mt-0.5">
            {candidate.name}
          </p>
        </div>
        <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/25 flex items-center justify-center">
          <Shield size={16} />
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Reliability Score */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-350">Reliability Index</span>
            <span className="font-mono text-white font-bold">{reliabilityScore}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              style={{ width: `${reliabilityScore}%` }}
            />
          </div>
        </div>

        {/* Profile Quality */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-350">Documentation Quality</span>
            <span className="font-mono text-white font-bold">{qualityScore}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
              style={{ width: `${qualityScore}%` }}
            />
          </div>
        </div>

        {/* Career Consistency */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-350">Timeline Consistency</span>
            <span className="font-mono text-white font-bold">{consistencyScore}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
              style={{ width: `${consistencyScore}%` }}
            />
          </div>
        </div>

        {/* Risk & Anomalies */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Risk Assessment:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskBadge.color}`}>
              {riskBadge.text}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Verification Indicators:</span>
            <span className="text-slate-200 font-medium">
              {anomalyCount === 0 ? "Fully Consistent" : `${anomalyCount} minor variances`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ComparisonReliability;
