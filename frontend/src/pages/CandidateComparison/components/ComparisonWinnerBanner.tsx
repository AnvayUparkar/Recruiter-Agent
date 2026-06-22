import React from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles } from "lucide-react";
import { Candidate } from "../../../types/candidate";

interface ComparisonWinnerBannerProps {
  candidates: Candidate[];
  reports: Record<string, any>;
}

export const ComparisonWinnerBanner: React.FC<ComparisonWinnerBannerProps> = ({
  candidates,
  reports,
}) => {
  // Find winner based on highest composite score
  const winner = React.useMemo(() => {
    if (candidates.length === 0) return null;
    let bestCand = candidates[0];
    let bestScore = bestCand.rankingScore?.finalScore || 0;

    candidates.forEach((c) => {
      const score = c.rankingScore?.finalScore || 0;
      if (score > bestScore) {
        bestScore = score;
        bestCand = c;
      }
    });
    return bestCand;
  }, [candidates]);

  if (!winner) return null;

  // Synthesize reason summary
  const reasonSummary = React.useMemo(() => {
    const report = reports[winner.candidateId];
    if (report?.overallAssessment) {
      return report.overallAssessment;
    }

    const techScore = winner.rankingScore?.technicalScore || 0;
    const trustScore = winner.reliabilityProfile?.reliabilityScore || winner.rankingScore?.trustScore || 0;
    const behaviorScore = winner.behaviorProfile?.behavioralScore || winner.rankingScore?.behavioralScore || 0;

    const points = [];
    if (techScore >= 0.8) points.push("outstanding technical proficiency");
    if (trustScore >= 0.8) points.push("exceptional reliability marks");
    if (behaviorScore >= 0.8) points.push("strong collaboration patterns");

    const highlights = points.length > 0 
      ? points.join(", ") 
      : "solid overall parameter matches and credentials alignment";

    return `Recommended candidate based on ${highlights}. Represents the most stable match fit for the requirements defined in the job description.`;
  }, [winner, reports]);

  const winnerScore = winner.rankingScore?.finalScore 
    ? Math.round(winner.rankingScore.finalScore * 100) 
    : 85;

  const decisionConfidence = winner.rankingScore?.confidence 
    ? Math.round(winner.rankingScore.confidence * 100) 
    : 92;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 140,
        damping: 20,
        delay: 0.15,
      }}
      className="glass-panel p-6 md:p-8 rounded-2xl border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/10 to-purple-600/10 shadow-glow mb-6 relative overflow-hidden group"
    >
      {/* Decorative neon background light */}
      <div className="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-amber-500/15 blur-3xl pointer-events-none group-hover:bg-amber-500/25 transition-all duration-300" />
      <div className="absolute -left-20 -bottom-20 w-44 h-44 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
        {/* Crown Icon Container */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
          <Crown size={32} className="animate-pulse" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
              <Sparkles size={10} />
              <span>Recommended Choice</span>
            </span>
            <span className="text-xs text-slate-400">Match Rank #1</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white mt-1">
            {winner.name}
          </h2>

          <p className="text-xs text-slate-350 leading-relaxed font-sans mt-1 max-w-3xl">
            {reasonSummary}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 md:border-l border-white/10 md:pl-6 shrink-0 pt-4 md:pt-0 w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Composite Score
            </span>
            <span className="text-3xl font-black text-white font-mono mt-0.5">
              {winnerScore}%
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Confidence
            </span>
            <span className="text-3xl font-black text-amber-400 font-mono mt-0.5">
              {decisionConfidence}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default ComparisonWinnerBanner;
