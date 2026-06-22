import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../../utils/cn";

export interface PopoverProps {
  content: React.ReactNode;
  children: React.ReactElement<any>;
  title?: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const positionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
  left: "right-full top-1/2 -translate-y-1/2 mr-3",
  right: "left-full top-1/2 -translate-y-1/2 ml-3",
};

const directionOffsets = {
  top: { y: 6, x: 0 },
  bottom: { y: -6, x: 0 },
  left: { x: 6, y: 0 },
  right: { x: -6, y: 0 },
};

export const Popover: React.FC<PopoverProps> = ({
  content,
  children,
  title,
  position = "bottom",
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const togglePopover = () => setIsOpen((prev) => !prev);

  // Clone trigger element and bind click handlers
  const trigger = React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      togglePopover();
      if (children.props.onClick) children.props.onClick(e);
    },
    className: cn(children.props.className, "cursor-pointer"),
    "aria-expanded": isOpen,
    "aria-haspopup": "true",
  });

  const variants = {
    hidden: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.93,
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
        stiffness: 400,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.95,
      transition: { duration: 0.15 },
    },
  };

  return (
    <div ref={containerRef} className="relative inline-block select-none">
      {trigger}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            className={cn(
              "absolute z-[60] glass-panel w-72 rounded-xl border border-glass-border p-4 shadow-strong focus:outline-none",
              positionClasses[position],
              className
            )}
          >
            {/* Header */}
            {(title || true) && (
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-glass-border">
                <span className="font-display-lg text-body-md font-semibold text-text-primary">
                  {title || "Options"}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus:ring-1 focus:ring-accent"
                  aria-label="Close popover"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {/* Interactive Body */}
            <div className="text-body-sm text-text-muted select-none">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Popover;
