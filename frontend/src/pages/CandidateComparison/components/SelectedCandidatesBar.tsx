import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Award, ShieldAlert } from "lucide-react";
import { Candidate } from "../../../types/candidate";

interface SelectedCandidatesBarProps {
  candidates: Candidate[];
  onRemove: (id: string) => void;
}

export const SelectedCandidatesBar: React.FC<SelectedCandidatesBarProps> = ({
  candidates,
  onRemove,
}) => {
  return (
    <div className="w-full mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {candidates.map((candidate) => {
            const finalScore = candidate.rankingScore?.finalScore
              ? Math.round(candidate.rankingScore.finalScore * 100)
              : candidate.experienceYears * 5 + 40; // fallback logic if scores aren't calculated

            const isStrong = finalScore >= 80;
            const isMid = finalScore >= 65 && finalScore < 80;

            const currentRole =
              candidate.profile?.currentTitle ||
              (candidate.skills.slice(0, 2).map((s) => s.name).join(" / ") || "Engineer");

            const currentCompany = candidate.profile?.currentCompany
              ? `at ${candidate.profile.currentCompany}`
              : "";

            // Use first letter of name for placeholder avatar
            const initials = candidate.name
              ? candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "C";

            return (
              <motion.div
                key={candidate.candidateId}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{
                  type: "spring",
                  stiffness: 140,
                  damping: 20,
                }}
                className="relative p-4 rounded-2xl glass-panel border-border hover-sweep overflow-hidden flex items-center gap-3 group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm shrink-0 shadow-sm">
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-primary truncate group-hover:text-blue-400 transition-colors">
                    {candidate.name}
                  </h3>
                  <p className="text-[11px] text-muted truncate">
                    {currentRole} {currentCompany}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                      Score: {finalScore}%
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 border
                        ${
                          isStrong
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isMid
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                    >
                      {isStrong ? (
                        <>
                          <Award size={10} />
                          <span>Strong Hire</span>
                        </>
                      ) : isMid ? (
                        <span>Hire</span>
                      ) : (
                        <>
                          <ShieldAlert size={10} />
                          <span>Needs Review</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => onRemove(candidate.candidateId)}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-surface/80 hover:bg-rose-500/20 text-text-muted hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Remove ${candidate.name} from comparison`}
                >
                  <X size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default SelectedCandidatesBar;
