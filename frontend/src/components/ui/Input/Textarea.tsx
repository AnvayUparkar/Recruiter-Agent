import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { cn } from "../../../utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  success?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, success, className, onFocus, onBlur, onChange, value: customValue, defaultValue, ...props }, ref) => {
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

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setFocused(false);
      if (onBlur) onBlur(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (customValue === undefined) {
        setValue(e.target.value);
      }
      if (onChange) onChange(e);
    };

    const isFloating = focused || value.length > 0 || props.placeholder !== undefined;

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
          <textarea
            ref={ref}
            value={customValue !== undefined ? customValue : value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "w-full bg-glass text-text-primary border border-glass-border rounded-lg px-4 py-3.5 text-body-md transition-all duration-300 outline-none focus:outline-none focus:border-accent focus:shadow-glow placeholder:text-transparent min-h-[120px] resize-y",
              error && "border-danger focus:border-danger focus:shadow-[0_0_15px_rgba(244,63,94,0.15)]",
              success && "border-success focus:border-success focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]",
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

          {/* Error Indicator Icon */}
          {error && (
            <div className="absolute right-3.5 top-3.5 pointer-events-none">
              <AlertCircle className="h-5 w-5 text-danger" />
            </div>
          )}
        </motion.div>

        {/* Error message */}
        {error && (
          <p className="mt-1.5 text-body-sm text-danger">
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
