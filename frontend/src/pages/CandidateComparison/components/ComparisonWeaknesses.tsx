import React from "react";
import { motion } from "framer-motion";
import { Candidate } from "../../../types/candidate";
import { AlertTriangle } from "lucide-react";

interface ComparisonWeaknessesProps {
  candidate: Candidate;
  explanation?: any;
}

export const ComparisonWeaknesses: React.FC<ComparisonWeaknessesProps> = ({
  candidate,
  explanation,
}) => {
  // Read from backend explanations if available, otherwise synthesize
  const gaps = React.useMemo(() => {
    const list = [...(explanation?.weaknesses || explanation?.gaps || [])];

    // Fallbacks based on candidate profile signals
    if (list.length === 0) {
      if (candidate.redrob_signals?.noticePeriodDays && candidate.redrob_signals.noticePeriodDays > 60) {
        list.push(`Extended notice period of ${candidate.redrob_signals.noticePeriodDays} days`);
      }
      if (candidate.experienceYears < 3) {
        list.push("Early-stage career progression with limited direct domain exposure");
      }
      
      const missingSkills: string[] = [];
      const required = ["React", "TypeScript", "Python", "Kubernetes", "Docker", "AWS"];
      const candidateSkillNames = (candidate.skills || []).map((s) => s.name.toLowerCase());
      
      required.forEach((req) => {
        if (!candidateSkillNames.some((c) => c.includes(req.toLowerCase()))) {
          missingSkills.push(req);
        }
      });

      if (missingSkills.length > 0) {
        list.push(`Lacks verified exposure to: ${missingSkills.slice(0, 2).join(", ")}`);
      }

      const fraud = candidate.reliabilityProfile?.fraudProfile?.overallFraudRisk || 0;
      if (fraud > 0.3) {
        list.push("Minor profile verification anomalies detected (suggest validator audit)");
      }
      
      if (!candidate.projects || candidate.projects.length === 0) {
        list.push("Limited open-source contribution indicators or hands-on portfolio URLs");
      }
    }

    return list.slice(0, 3); // Limit to top 3 for space
  }, [candidate, explanation]);

  return (
    <div className="p-5 rounded-2xl glass-panel border-white/10 shadow-md flex flex-col gap-4 bg-white/2 h-full">
      <div>
        <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Gaps & Growth Areas
        </h3>
        <p className="text-sm font-semibold text-white mt-0.5">
          {candidate.name}
        </p>
      </div>

      {gaps.length === 0 ? (
        <p className="text-xs text-slate-500 italic">No critical anomalies or gaps detected.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {gaps.map((gap, idx) => (
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
              className="flex items-start gap-2.5 text-xs text-slate-300 font-sans leading-relaxed"
            >
              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <span>{gap}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default ComparisonWeaknesses;
