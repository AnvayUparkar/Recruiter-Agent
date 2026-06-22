import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "../../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  isLoading?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, isLoading, className, type = "text", onFocus, onBlur, onChange, value: customValue, defaultValue, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();
    const [focused, setFocused] = useState(false);
    const [value, setValue] = useState("");

    useEffect(() => {
      if (customValue !== undefined) {
        setValue(String(customValue));
      } else if (defaultValue !== undefined) {
        setValue(String(defaultValue));
      }
    }, [customValue, defaultValue]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      if (onBlur) onBlur(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (customValue === undefined) {
        setValue(e.target.value);
      }
      if (onChange) onChange(e);
    };

    const isFloating = focused || value.length > 0 || props.placeholder !== undefined;

    // Shake animation configuration on error
    const shakeVariants = {
      shake: {
        x: shouldReduceMotion ? 0 : [0, -10, 10, -10, 10, -5, 5, 0],
        transition: { duration: 0.5 },
      },
    };

    return (
      <div className="w-full font-sans">
        <motion.div
          animate={error ? "shake" : ""}
          variants={shakeVariants}
          className="relative w-full"
        >
          <input
            ref={ref}
            type={type}
            value={customValue !== undefined ? customValue : value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "w-full bg-glass text-text-primary border border-glass-border rounded-lg px-4 py-3.5 text-body-md transition-all duration-300 outline-none focus:outline-none focus:border-accent focus:shadow-glow placeholder:text-transparent select-none",
              error && "border-danger focus:border-danger focus:shadow-[0_0_15px_rgba(244,63,94,0.15)]",
              success && "border-success focus:border-success focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]",
              isLoading && "pr-10",
              (success || error) && "pr-10",
              className
            )}
            {...props}
          />

          {/* Floating Label */}
          <label
            className={cn(
              "absolute left-4 top-3.5 origin-left pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none text-text-muted",
              isFloating
                ? "transform translate-y-[-1.5rem] scale-[0.8] text-accent font-medium px-1 bg-background"
                : "transform translate-y-0 scale-100",
              error && isFloating && "text-danger",
              success && isFloating && "text-success",
              focused && "text-accent"
            )}
          >
            {label}
          </label>

          {/* Status Icons */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 text-accent"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {!isLoading && error && <AlertCircle className="h-5 w-5 text-danger" />}
            {!isLoading && success && !error && <Check className="h-5 w-5 text-success animate-[scaleIn_0.3s_ease-out]" />}
          </div>
        </motion.div>
        
        {/* Error message */}
        {error && (
          <p className="mt-1.5 text-body-sm text-danger flex items-center gap-1">
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
