import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const TypingIndicator: React.FC = () => {
  const reduced = useReducedMotion();

  const dotVariants = {
    bounce: (i: number) => ({
      y: reduced ? 0 : [0, -6, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.15,
      },
    }),
  };

  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-800/60 border border-white/8 w-fit">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          custom={i}
          variants={dotVariants}
          animate="bounce"
          className="w-2 h-2 rounded-full bg-blue-400"
          style={{ display: "block" }}
        />
      ))}
    </div>
  );
};

export default TypingIndicator;
