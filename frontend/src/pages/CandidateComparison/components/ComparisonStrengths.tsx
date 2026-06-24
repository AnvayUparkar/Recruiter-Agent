import React from "react";
import { motion } from "framer-motion";
import { Candidate } from "../../../types/candidate";
import { CheckCircle } from "lucide-react";

interface ComparisonStrengthsProps {
  candidate: Candidate;
  explanation?: any;
}

export const ComparisonStrengths: React.FC<ComparisonStrengthsProps> = ({
  candidate,
  explanation,
}) => {
  // Read from backend explanations if available, otherwise synthesize
  const strengths = React.useMemo(() => {
    const list = [...(explanation?.strengths || [])];

    // Fallbacks based on candidate profile signals
    if (list.length === 0) {
      if (candidate.experienceYears >= 7) {
        list.push(`Deep domain experience (${candidate.experienceYears} Years)`);
      }
      if ((candidate.skills || []).length >= 10) {
        list.push(`Broad technology coverage (${candidate.skills.length} skills matched)`);
      }
      const reliability = candidate.reliabilityProfile?.reliabilityScore || 0;
      if (reliability >= 0.85) {
        list.push("High trust profile index & timeline integrity");
      }
      const behavioral = candidate.behaviorProfile?.behavioralScore || 0;
      if (behavioral >= 0.85) {
        list.push("Strong collaboration and active candidate engagement");
      }
      if (candidate.projects && candidate.projects.length > 0) {
        list.push(`Demonstrated hands-on experience via ${candidate.projects.length} key projects`);
      }
      if (candidate.education && candidate.education.some((e) => e.tier === "tier_1")) {
        list.push("Top-tier institutional education credentials");
      }
    }

    return list.slice(0, 4); // Limit to top 4 for space
  }, [candidate, explanation]);

  return (
    <div className="p-5 rounded-2xl glass-panel border-border shadow-md flex flex-col gap-4 bg-surface h-full">
      <div>
        <h3 className="text-xs text-muted font-bold uppercase tracking-wider">
          Key Strengths
        </h3>
        <p className="text-sm font-semibold text-primary mt-0.5">
          {candidate.name}
        </p>
      </div>

      {strengths.length === 0 ? (
        <p className="text-xs text-muted italic">No primary strengths parsed.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {strengths.map((str, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 140,
                damping: 20,
                delay: idx * 0.08,
              }}
              className="flex items-start gap-2.5 text-xs text-text-muted font-sans leading-relaxed"
            >
              <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{str}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default ComparisonStrengths;
