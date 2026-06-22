import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../../utils/cn";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  icon?: LucideIcon | React.ComponentType<any>;
  variant?: "default" | "danger" | "success";
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  position?: "left" | "right";
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  position = "right",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

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

  const handleItemClick = (onClick?: () => void) => {
    if (onClick) onClick();
    setIsOpen(false);
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -6,
      scale: shouldReduceMotion ? 1 : 0.97,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 24,
      },
    },
    exit: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.98,
      transition: { duration: 0.1 },
    },
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block font-sans select-none", className)}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            className={cn(
              "absolute z-[50] mt-2 w-56 glass-panel border border-glass-border rounded-lg shadow-strong py-1 outline-none",
              position === "right" ? "right-0" : "left-0"
            )}
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              const isDanger = item.variant === "danger";
              const isSuccess = item.variant === "success";

              return (
                <button
                  key={index}
                  onClick={() => !item.disabled && handleItemClick(item.onClick)}
                  disabled={item.disabled}
                  className={cn(
                    "w-full px-4 py-2.5 text-body-sm flex items-center gap-2.5 text-left transition-colors select-none",
                    item.disabled && "opacity-40 pointer-events-none",
                    isDanger
                      ? "text-danger hover:bg-danger/10"
                      : isSuccess
                      ? "text-success hover:bg-success/10"
                      : "text-text-primary hover:bg-surface-hover"
                  )}
                >
                  {Icon && <Icon className="h-4.5 w-4.5 shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
