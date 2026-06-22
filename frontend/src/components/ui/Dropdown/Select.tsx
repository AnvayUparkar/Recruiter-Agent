import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../../utils/cn";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  className,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -4,
      scale: shouldReduceMotion ? 1 : 0.98,
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
    <div ref={containerRef} className={cn("relative w-full font-sans select-none", className)}>
      {label && (
        <span className="block text-body-sm font-medium text-text-muted mb-1.5 select-none">
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full bg-glass text-text-primary border border-glass-border rounded-lg px-4 py-2.5 text-body-md flex items-center justify-between text-left outline-none transition-all duration-300 focus:border-accent focus:shadow-glow",
          error && "border-danger focus:border-danger focus:shadow-[0_0_15px_rgba(244,63,94,0.15)]",
          isOpen && "border-accent shadow-glow"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={cn(!selectedOption && "text-text-muted")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-muted transition-transform duration-300",
            isOpen && "rotate-180 text-accent"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            className="absolute z-[50] mt-2 w-full glass-panel border border-glass-border rounded-lg shadow-strong max-h-60 overflow-y-auto outline-none py-1"
          >
            {options.length === 0 ? (
              <li className="px-4 py-2 text-body-sm text-text-muted select-none">
                No options available
              </li>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "px-4 py-2.5 text-body-md cursor-pointer transition-colors duration-150 select-none text-text-primary hover:bg-surface-hover",
                      isSelected && "text-accent bg-accent/10 hover:bg-accent/15 font-semibold"
                    )}
                  >
                    {option.label}
                  </li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && <p className="mt-1 text-body-sm text-danger">{error}</p>}
    </div>
  );
};

export default Select;
