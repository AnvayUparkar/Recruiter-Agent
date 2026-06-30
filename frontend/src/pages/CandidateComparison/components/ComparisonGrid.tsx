import React from "react";
import { motion } from "framer-motion";
import { Candidate } from "../../../types/candidate";

interface ComparisonGridProps {
  candidates: Candidate[];
  children: (candidate: Candidate, index: number) => React.ReactNode;
}

export const ComparisonGrid: React.FC<ComparisonGridProps> = ({
  candidates,
  children,
}) => {
  const columnCount = candidates.length;

  return (
    <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div
        className="grid gap-6 min-w-max md:min-w-0 skill-coverage-grid"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(280px, 1fr))`,
        }}
      >
        {candidates.map((candidate, index) => (
          <motion.div
            key={candidate.candidateId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 140,
              damping: 20,
              delay: index * 0.05,
            }}
            className="flex flex-col h-full candidate-card"
          >
            {children(candidate, index)}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default ComparisonGrid;
