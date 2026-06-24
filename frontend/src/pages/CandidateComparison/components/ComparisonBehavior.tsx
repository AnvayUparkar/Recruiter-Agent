import React from "react";
import { Candidate } from "../../../types/candidate";
import { MessageSquare } from "lucide-react";

interface ComparisonBehaviorProps {
  candidate: Candidate;
}

export const ComparisonBehavior: React.FC<ComparisonBehaviorProps> = ({
  candidate,
}) => {
  const behavior = candidate.behaviorProfile;

  // Raw attributes
  const behavioralIndex = behavior?.behavioralScore
    ? Math.round(behavior.behavioralScore * 100)
    : 80;

  const responsiveness = behavior?.responsivenessScore
    ? Math.round(behavior.responsivenessScore * 100)
    : 85;

  const engagement = behavior?.engagementScore
    ? Math.round(behavior.engagementScore * 100)
    : 88;

  const joinProb = behavior?.joinProbability
    ? Math.round(behavior.joinProbability * 100)
    : 75;

  return (
    <div className="p-5 rounded-2xl glass-panel border-border shadow-md flex flex-col gap-4 bg-surface h-full">
      <div className="border-b border-border pb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs text-muted font-bold uppercase tracking-wider">
            Behavior & Communication
          </h3>
          <p className="text-sm font-semibold text-primary mt-0.5">
            {candidate.name}
          </p>
        </div>
        <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-450 border border-indigo-500/25 flex items-center justify-center">
          <MessageSquare size={16} />
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Behavioral Index */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Collaboration Index</span>
            <span className="font-mono text-primary font-bold">{behavioralIndex}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-pink-500"
              style={{ width: `${behavioralIndex}%` }}
            />
          </div>
        </div>

        {/* Responsiveness */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Recruiter Responsiveness</span>
            <span className="font-mono text-primary font-bold">{responsiveness}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500"
              style={{ width: `${responsiveness}%` }}
            />
          </div>
        </div>

        {/* Engagement */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Interview Engagement</span>
            <span className="font-mono text-primary font-bold">{engagement}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
              style={{ width: `${engagement}%` }}
            />
          </div>
        </div>

        {/* Join Probability */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">Join Probability:</span>
            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border
                ${
                  joinProb >= 80
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : joinProb >= 60
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}
            >
              {joinProb}% Probability
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted">Communication Signal:</span>
            <span className="text-primary font-medium">Professional & Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ComparisonBehavior;
