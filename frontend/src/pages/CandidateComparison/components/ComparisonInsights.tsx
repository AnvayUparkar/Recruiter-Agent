import React from "react";
import { Candidate } from "../../../types/candidate";
import { Code, ShieldCheck, Users, Zap } from "lucide-react";

interface ComparisonInsightsProps {
  candidates: Candidate[];
}

export const ComparisonInsights: React.FC<ComparisonInsightsProps> = ({
  candidates,
}) => {
  const insights = React.useMemo(() => {
    if (candidates.length < 2) return [];

    const list: Array<{
      title: string;
      description: string;
      icon: React.ReactNode;
      color: string;
    }> = [];

    // Helper: Find max candidate by score
    const getMaxCandidate = (
      extractor: (c: Candidate) => number
    ): { candidate: Candidate; val: number } => {
      let best = candidates[0];
      let bestVal = extractor(best);
      candidates.forEach((c) => {
        const val = extractor(c);
        if (val > bestVal) {
          bestVal = val;
          best = c;
        }
      });
      return { candidate: best, val: bestVal };
    };

    // 1. Technical Depth
    const techLeader = getMaxCandidate((c) => c.rankingScore?.technicalScore || 0);
    if (techLeader.val > 0) {
      list.push({
        title: "Technical Depth Leader",
        description: `${techLeader.candidate.name} exhibits the highest technical alignment score (${Math.round(techLeader.val * 100)}%), with robust exposure to required codebase technologies.`,
        icon: <Code size={18} />,
        color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      });
    }

    // 2. Reliability & Trust
    const reliabilityLeader = getMaxCandidate(
      (c) => c.reliabilityProfile?.reliabilityScore || c.rankingScore?.trustScore || 0
    );
    if (reliabilityLeader.val > 0) {
      list.push({
        title: "Reliability & Integrity Leader",
        description: `${reliabilityLeader.candidate.name} has the highest profile reliability score (${Math.round(reliabilityLeader.val * 100)}%), representing the lowest timeline anomaly risk.`,
        icon: <ShieldCheck size={18} />,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      });
    }

    // 3. Leadership Potential
    const leadershipLeader = getMaxCandidate((c) => c.rankingScore?.leadershipScore || 0);
    if (leadershipLeader.val > 0) {
      list.push({
        title: "Leadership Progression",
        description: `${leadershipLeader.candidate.name} shows strong indicators of team leadership, mentorship, and career growth potential (${Math.round(leadershipLeader.val * 100)}%).`,
        icon: <Users size={18} />,
        color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      });
    }

    // 4. Response Time & Behavioral
    const behaviorLeader = getMaxCandidate(
      (c) => c.behaviorProfile?.behavioralScore || c.rankingScore?.behavioralScore || 0
    );
    if (behaviorLeader.val > 0) {
      list.push({
        title: "Engagement & Communication",
        description: `${behaviorLeader.candidate.name} demonstrates the most active recruiter responsiveness and positive candidate engagement logs.`,
        icon: <Zap size={18} />,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      });
    }

    return list;
  }, [candidates]);

  if (insights.length === 0) return null;

  return (
    <div className="w-full mb-6">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-heading">
          AI Comparative Insights
        </h2>
        <p className="text-[11px] text-muted">
          Synthesized summary comparison of candidate properties and metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((ins, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl glass-panel border-border flex gap-3.5 bg-surface shadow-sm hover:border-border transition-all duration-200"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${ins.color}`}
            >
              {ins.icon}
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-primary font-heading">
                {ins.title}
              </h4>
              <p className="text-[11px] text-text-muted leading-relaxed font-sans">
                {ins.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ComparisonInsights;
