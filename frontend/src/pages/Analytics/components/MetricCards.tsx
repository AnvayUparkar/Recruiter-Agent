import React from "react";
import { motion } from "framer-motion";
import { UserCheck, Star, Award, Sparkles, AlertCircle } from "lucide-react";

interface MetricCardsProps {
  candidatesRanked: number;
  strongHirePct: number;
  avgTechScore: number;
  avgReliability: number;
  interviewRecPct: number;
  avgConfidence: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  candidatesRanked,
  strongHirePct,
  avgTechScore,
  avgReliability,
  interviewRecPct,
  avgConfidence,
}) => {
  const cards = [
    {
      title: "Candidates Evaluated",
      value: candidatesRanked,
      suffix: " profiles",
      icon: <UserCheck size={20} />,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Strong Hire Verdicts",
      value: Math.round(strongHirePct * 100),
      suffix: "%",
      icon: <Award size={20} />,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Avg Technical Depth",
      value: Math.round(avgTechScore * 100),
      suffix: "%",
      icon: <Star size={20} />,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Reliability Index",
      value: Math.round(avgReliability * 100),
      suffix: "%",
      icon: <AlertCircle size={20} />,
      color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    {
      title: "Interview Recommended",
      value: Math.round(interviewRecPct * 100),
      suffix: "%",
      icon: <Sparkles size={20} />,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    },
    {
      title: "Advisor Confidence",
      value: Math.round(avgConfidence * 100),
      suffix: "%",
      icon: <Award size={20} />,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 140,
            damping: 20,
            delay: idx * 0.05 + 0.1,
          }}
          className="p-5 rounded-2xl glass-panel border-white/5 bg-white/2 hover:border-white/10 transition-all duration-200 flex items-center justify-between group cursor-default relative overflow-hidden"
        >
          {/* Subtle hover glow circle */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/1 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-xs text-slate-400 font-semibold truncate">
              {card.title}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono">
                {card.value}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {card.suffix}
              </span>
            </div>
          </div>

          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 group-hover:scale-110 transition-all duration-200 shadow-sm
              ${card.color}`}
          >
            {card.icon}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
export default MetricCards;
