import React from "react";
import { Award, Zap, Target, Sparkles, TrendingUp } from "lucide-react";

interface RankingQualityPanelProps {
  ndcg: number;
  precision: number;
  mrr: number;
  avgConfidence: number;
  recommendationRate: number;
}

export const RankingQualityPanel: React.FC<RankingQualityPanelProps> = ({
  ndcg,
  precision,
  mrr,
  avgConfidence,
  recommendationRate,
}) => {
  const metrics = [
    {
      label: "NDCG@5 (Ranking Quality)",
      value: Math.round(ndcg * 100),
      icon: <TrendingUp size={16} className="text-blue-400" />,
      desc: "Measures ranking order accuracy. A high score means the AI successfully places the absolute best-matching candidates at the very top of your leaderboard.",
    },
    {
      label: "Precision@5 (Fit Accuracy)",
      value: Math.round(precision * 100),
      icon: <Target size={16} className="text-emerald-400" />,
      desc: "Measures relevancy rate. Indicates what percentage of the top 5 candidates meet your core job description constraints without warning flags.",
    },
    {
      label: "MRR (Mean Reciprocal Rank)",
      value: Math.round(mrr * 100),
      icon: <Zap size={16} className="text-violet-400" />,
      desc: "Measures system response priority. Indicates how quickly the search algorithm detects the first highly qualified profile (closer to 100% is better).",
    },
    {
      label: "AI Recommendation Rate",
      value: Math.round(recommendationRate * 100),
      icon: <Award size={16} className="text-pink-400" />,
      desc: "Percentage of the candidate pool classified as 'Hire' or 'Strong Hire' by AI advisor models relative to the entire dataset.",
    },
    {
      label: "Average Match Confidence",
      value: Math.round(avgConfidence * 100),
      icon: <Sparkles size={16} className="text-amber-400" />,
      desc: "The average confidence level reported by AI scoring models during semantic feature evaluations.",
    },
  ];

  return (
    <div className="w-full glass-panel rounded-2xl border-white/10 shadow-xl p-5 md:p-6 mb-6">
      <div className="mb-5 border-b border-white/5 pb-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
          AI Ranking Quality & Calibration
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Information retrieval metrics evaluating matching calibration.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="flex flex-col md:flex-row gap-3 md:items-start justify-between p-3.5 rounded-xl bg-white/2 border border-white/5">
            <div className="flex gap-3 items-start max-w-xl">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
                {m.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white font-heading">
                  {m.label}
                </span>
                <span className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  {m.desc}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0 pt-2 md:pt-0">
              <span className="text-2xl font-black text-white font-mono leading-none">
                {m.value}%
              </span>
              <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden mt-2 border border-white/5">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${m.value}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default RankingQualityPanel;
