import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "../../../utils/cn";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<any>;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
}

const positionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const directionOffsets = {
  top: { y: 4, x: 0 },
  bottom: { y: -4, x: 0 },
  left: { x: 4, y: 0 },
  right: { x: -4, y: 0 },
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className,
  delay = 200,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  let timeoutId: any;

  const showTooltip = () => {
    timeoutId = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  // Close on escape
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVisible(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  // Clone child to apply event handlers for accessibility and mouse control
  const trigger = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      if (children.props.onMouseEnter) children.props.onMouseEnter(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      if (children.props.onMouseLeave) children.props.onMouseLeave(e);
    },
    onFocus: (e: React.FocusEvent) => {
      setIsVisible(true);
      if (children.props.onFocus) children.props.onFocus(e);
    },
    onBlur: (e: React.FocusEvent) => {
      setIsVisible(false);
      if (children.props.onBlur) children.props.onBlur(e);
    },
    ...(!children.props.tabIndex ? { tabIndex: 0 } : {}),
  });

  const variants = {
    hidden: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.94,
      y: shouldReduceMotion ? 0 : directionOffsets[position].y,
      x: shouldReduceMotion ? 0 : directionOffsets[position].x,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 450,
        damping: 24,
      },
    },
    exit: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.96,
      transition: { duration: 0.1 },
    },
  };

  return (
    <div className="relative inline-block select-none">
      {trigger}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            role="tooltip"
            className={cn(
              "absolute z-[70] bg-surface text-text-primary text-body-sm font-sans px-2.5 py-1.5 rounded-md border border-glass-border shadow-glass whitespace-nowrap pointer-events-none select-none",
              positionClasses[position],
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
