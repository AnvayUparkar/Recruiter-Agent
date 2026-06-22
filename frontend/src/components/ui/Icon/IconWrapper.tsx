import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";

export interface IconWrapperProps extends React.ComponentPropsWithoutRef<"span"> {
  icon: LucideIcon;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  variant?: "default" | "accent" | "success" | "warning" | "danger" | "info" | "muted";
  animation?: "none" | "spin" | "pulse" | "rotate-hover" | "bounce-hover" | "glow-hover";
}

const sizeClasses = {
  xs: "w-3 h-3 text-[12px]",
  sm: "w-4 h-4 text-[14px]",
  md: "w-5 h-5 text-[16px]",
  lg: "w-6 h-6 text-[20px]",
  xl: "w-8 h-8 text-[32px]",
};

const variantClasses = {
  default: "text-text-primary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  muted: "text-text-muted",
};

export const IconWrapper = React.forwardRef<HTMLSpanElement, IconWrapperProps>(
  ({ icon: Icon, size = "md", variant = "default", animation = "none", className, ...props }, ref) => {
    const isCustomSize = typeof size === "number";

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-300",
          // Animations
          animation === "spin" && "animate-spin",
          animation === "pulse" && "animate-[pulse_2s_infinite]",
          animation === "rotate-hover" && "hover:rotate-12",
          animation === "bounce-hover" && "hover:-translate-y-0.5",
          animation === "glow-hover" && "hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]",
          className
        )}
        style={{
          width: isCustomSize ? `${size}px` : undefined,
          height: isCustomSize ? `${size}px` : undefined,
        }}
        {...props}
      >
        <Icon
          className={cn(
            !isCustomSize && sizeClasses[size],
            variantClasses[variant]
          )}
          style={
            isCustomSize
              ? {
                  width: `${size}px`,
                  height: `${size}px`,
                }
              : undefined
          }
        />
      </span>
    );
  }
);

IconWrapper.displayName = "IconWrapper";
