import React from "react";
import { motion } from "framer-motion";
import { Candidate } from "../../../types/candidate";
import { Sparkles, Trophy } from "lucide-react";

interface ComparisonScoreCardProps {
  candidate: Candidate;
  allCandidates: Candidate[];
}

export const ComparisonScoreCard: React.FC<ComparisonScoreCardProps> = ({
  candidate,
  allCandidates,
}) => {
  const getScoreDetails = (c: Candidate) => {
    return {
      final: c.rankingScore?.finalScore || 0,
      technical: c.rankingScore?.technicalScore || 0,
      behavior: c.behaviorProfile?.behavioralScore || c.rankingScore?.behavioralScore || 0,
      reliability: c.reliabilityProfile?.reliabilityScore || c.rankingScore?.trustScore || 0,
      leadership: c.rankingScore?.leadershipScore || 0,
      matching: c.rankingScore?.matchingScore || 0,
      confidence: c.rankingScore?.confidence || 0.8,
    };
  };

  const currentScores = getScoreDetails(candidate);

  // Helper to determine if current candidate leads in a specific score
  const isLeader = (key: keyof ReturnType<typeof getScoreDetails>) => {
    if (allCandidates.length <= 1) return false;
    const allVal = allCandidates.map((c) => getScoreDetails(c)[key]);
    const maxVal = Math.max(...allVal);
    return currentScores[key] === maxVal && maxVal > 0;
  };

  const metrics = [
    { key: "final", label: "AI Composite Score", color: "from-blue-500 to-indigo-600" },
    { key: "technical", label: "Technical Competence", color: "from-cyan-500 to-blue-500" },
    { key: "matching", label: "JD Requirements Fit", color: "from-emerald-500 to-teal-500" },
    { key: "reliability", label: "Reliability & Fraud Profile", color: "from-violet-500 to-purple-600" },
    { key: "behavior", label: "Behavior & Interaction", color: "from-fuchsia-500 to-pink-500" },
    { key: "leadership", label: "Leadership Potential", color: "from-amber-500 to-orange-500" },
  ] as const;

  return (
    <div className="p-5 rounded-2xl glass-panel border-white/10 shadow-md flex flex-col gap-4 bg-white/2 relative overflow-hidden group">
      {isLeader("final") && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500/20 to-transparent text-emerald-400 text-[10px] font-bold py-1 px-3 rounded-bl-xl border-l border-b border-emerald-500/20 flex items-center gap-1">
          <Trophy size={10} className="fill-current" />
          <span>Cohort Leader</span>
        </div>
      )}

      <div>
        <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          AI Score Breakdown
        </h3>
        <p className="text-sm font-semibold text-white mt-0.5">
          {candidate.name}
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        {metrics.map((m) => {
          const value = Math.round(currentScores[m.key] * 100);
          const isCurrentLeader = isLeader(m.key);

          return (
            <div key={m.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{m.label}</span>
                <div className="flex items-center gap-1 font-mono">
                  {isCurrentLeader && (
                    <Sparkles size={11} className="text-emerald-400 animate-pulse" />
                  )}
                  <span className={isCurrentLeader ? "text-emerald-400 font-bold" : "text-white"}>
                    {value}%
                  </span>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="w-full h-2 rounded-full bg-white/5 border border-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                  }}
                  className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                />
              </div>
            </div>
          );
        })}

        {/* Confidence metric */}
        <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>Match Confidence</span>
          <span className="font-mono text-slate-200">
            {Math.round(currentScores.confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
export default ComparisonScoreCard;
