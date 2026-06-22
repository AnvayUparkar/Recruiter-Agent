import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "../../../utils/cn";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  error?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  label,
  className,
  error,
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

  const handleSelect = (optionValue: string) => {
    const isAlreadySelected = selectedValues.includes(optionValue);
    if (isAlreadySelected) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== optionValue));
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

      {/* Multi-Select Trigger Bar */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full bg-glass text-text-primary border border-glass-border rounded-lg p-2.5 text-body-md flex items-center justify-between text-left outline-none transition-all duration-300 focus-within:border-accent focus-within:shadow-glow cursor-pointer min-h-[46px]",
          error && "border-danger focus-within:border-danger focus-within:shadow-[0_0_15px_rgba(244,63,94,0.15)]",
          isOpen && "border-accent shadow-glow"
        )}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1">
          {selectedValues.length === 0 ? (
            <span className="text-text-muted select-none">{placeholder}</span>
          ) : (
            selectedValues.map((val) => {
              const matchedOption = options.find((o) => o.value === val);
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 bg-accent/10 border border-accent/20 text-accent font-semibold px-2 py-0.5 rounded text-body-sm animate-[scaleIn_0.2s_ease-out] select-none"
                >
                  <span className="max-w-[120px] truncate">{matchedOption ? matchedOption.label : val}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(val, e)}
                    className="text-accent hover:text-accent-hover p-0.5 rounded transition-colors"
                    aria-label={`Remove ${matchedOption ? matchedOption.label : val}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-muted transition-transform duration-300 ml-2",
            isOpen && "rotate-180 text-accent"
          )}
        />
      </div>

      {/* Options Dropdown */}
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
                const isSelected = selectedValues.includes(option.value);
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "px-4 py-2.5 text-body-md cursor-pointer transition-colors duration-150 select-none flex items-center justify-between text-text-primary hover:bg-surface-hover",
                      isSelected && "text-accent bg-accent/5 font-semibold"
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="h-4.5 w-4.5 text-accent animate-[scaleIn_0.2s_ease-out]" />}
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

export default MultiSelect;
