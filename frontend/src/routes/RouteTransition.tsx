import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RouteTransitionProps {
  children: React.ReactNode;
}

/**
 * RouteTransition applies exit/entry transition animations to views.
 * It uses the requested spring configurations (stiffness: 140, damping: 20)
 * and honors the user's reduced-motion settings by falling back to a simple opacity fade.
 */
export const RouteTransition: React.FC<RouteTransitionProps> = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  // Premium animation presets
  const animationVariants = {
    initial: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.98, filter: "blur(4px)", y: 8 },
    animate: shouldReduceMotion
      ? { opacity: 1 }
      : { opacity: 1, scale: 1, filter: "blur(0px)", y: 0 },
    exit: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.98, filter: "blur(4px)", y: -8 },
  };

  const springTransition = {
    type: "spring",
    stiffness: 140,
    damping: 20,
    mass: 0.8,
  };

  const fadeTransition = {
    duration: 0.25,
    ease: "easeInOut",
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={animationVariants}
      transition={shouldReduceMotion ? fadeTransition : springTransition}
      className="w-full h-full flex flex-col flex-1"
    >
      {children}
    </motion.div>
  );
};

export default RouteTransition;
