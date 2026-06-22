import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "5xl" | "6xl" | "7xl" | "full";
  className?: string;
  animate?: boolean;
}

const maxWidthMap = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = "7xl",
  className = "",
  animate = true,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const containerClasses = `w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 flex flex-col min-h-0 ${
    maxWidthMap[maxWidth]
  } ${className}`;

  if (!animate) {
    return <div className={containerClasses}>{children}</div>;
  }

  // Smooth entrance animations
  const pageVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageVariants}
      transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.9 }}
      className={containerClasses}
    >
      {children}
    </motion.div>
  );
};

export default PageContainer;
