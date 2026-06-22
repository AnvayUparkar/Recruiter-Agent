import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ButtonProps } from "./Button.types";
import { baseStyles, variants, sizes } from "./Button.styles";
import { cn } from "../../../utils/cn";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();

    const hoverAnimation = shouldReduceMotion
      ? {}
      : { scale: 1.02 };

    const tapAnimation = shouldReduceMotion
      ? {}
      : { scale: 0.97 };

    return (
      <motion.button
        ref={ref as any}
        type={type}
        disabled={disabled || isLoading}
        whileHover={disabled || isLoading ? {} : hoverAnimation}
        whileTap={disabled || isLoading ? {} : tapAnimation}
        transition={{ type: "spring", stiffness: 450, damping: 20 }}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && "cursor-wait opacity-80",
          className
        )}
        aria-busy={isLoading}
        {...(props as any)}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            data-testid="loading-spinner"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!isLoading && LeftIcon && (
          <span className="shrink-0" aria-hidden="true">
            <LeftIcon className="h-4 w-4" />
          </span>
        )}
        
        <span className="truncate">{children}</span>
        
        {!isLoading && RightIcon && (
          <span className="shrink-0" aria-hidden="true">
            <RightIcon className="h-4 w-4" />
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
export * from "./Button.types";
