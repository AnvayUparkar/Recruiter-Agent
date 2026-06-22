import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../../utils/cn";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  position?: "left" | "right";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  position = "right",
  size = "md",
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
        );

        if (focusableElements.length === 0) return;

        const first = focusableElements[0] as HTMLElement;
        const last = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    setTimeout(() => {
      if (drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
        );
        if (focusable.length > 0) {
          (focusable[0] as HTMLElement).focus();
        }
      }
    }, 50);

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [isOpen, onClose]);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const drawerVariants = {
    hidden: {
      x: shouldReduceMotion ? 0 : position === "right" ? "100%" : "-100%",
      opacity: shouldReduceMotion ? 0 : 1,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      x: shouldReduceMotion ? 0 : position === "right" ? "100%" : "-100%",
      opacity: shouldReduceMotion ? 0 : 1,
      transition: { duration: 0.2, ease: "easeInOut" },
    },
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex" role="dialog" aria-modal="true">
          {/* Overlay backdrop */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/40 backdrop-blur-md cursor-pointer"
          />

          {/* Drawer container */}
          <motion.div
            ref={drawerRef}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
            className={cn(
              "glass-panel fixed top-0 bottom-0 w-full flex flex-col border-y-0 border-glass-border shadow-strong p-6 overflow-hidden z-10",
              position === "right" ? "right-0 border-l" : "left-0 border-r",
              sizeClasses[size],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-glass-border pb-4">
              {title ? (
                <h2 className="font-display-lg text-heading-md font-semibold tracking-tight text-text-primary">
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus:ring-2 focus:ring-accent"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 text-body-md text-text-muted select-none">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Drawer;
