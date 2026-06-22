import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number; // initial random left coordinate
  color: string;
  size: number;
  delay: number;
  rotate: number;
}

export const DemoCelebration: React.FC = () => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const colors = ["#3b82f6", "#a855f7", "#ec4899", "#10b981", "#f59e0b", "#6366f1"];

  useEffect(() => {
    // Generate 60 randomized confetti pieces
    const items: ConfettiPiece[] = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6,
      delay: Math.random() * 2,
      rotate: Math.random() * 360,
    }));
    setPieces(items);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none" aria-hidden="true">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            y: -20,
            x: p.x,
            rotate: p.rotate,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 50,
            x: p.x + (Math.random() * 100 - 50),
            rotate: p.rotate + 720,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            delay: p.delay,
            ease: "easeOut"
          }}
          style={{
            position: "absolute",
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};

export default DemoCelebration;
