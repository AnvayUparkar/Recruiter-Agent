import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Candidate } from "../../../types/candidate";
import { ArrowRight, MessageSquare, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StickyCompareFooterProps {
  candidates: Candidate[];
}

export const StickyCompareFooter: React.FC<StickyCompareFooterProps> = ({
  candidates,
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show footer after scrolling down 250px
      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFinalize = () => {
    alert("Saving decisions to recruiter ATS dashboard... Comparison complete!");
    navigate("/dashboard");
  };

  const handleOpenCopilot = () => {
    navigate("/copilot");
  };

  const handleGenerateReport = () => {
    alert("Generating consolidated executive comparison briefing (PDF)...");
  };

  if (candidates.length < 2) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 border-t border-white/10 bg-black/80 backdrop-blur-md shadow-2xl flex items-center justify-center"
        >
          <div className="max-w-5xl w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Selected Candidates list */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                Matchup:
              </span>
              <div className="flex items-center gap-1.5">
                {candidates.map((c) => {
                  const score = c.rankingScore?.finalScore 
                    ? Math.round(c.rankingScore.finalScore * 100) 
                    : 85;

                  return (
                    <span
                      key={c.candidateId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] font-medium shrink-0 font-sans"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{c.name.split(" ")[0]}</span>
                      <span className="text-slate-400 font-mono">({score}%)</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 text-[11px] font-semibold transition-all"
              >
                <FileText size={12} />
                <span>Executive Summary</span>
              </button>

              <button
                onClick={handleOpenCopilot}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 text-[11px] font-semibold transition-all"
              >
                <MessageSquare size={12} />
                <span>Copilot Chat</span>
              </button>

              <button
                onClick={handleFinalize}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-semibold transition-all shadow-glow hover:shadow-neon"
              >
                <span>Finalize Decision</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default StickyCompareFooter;
