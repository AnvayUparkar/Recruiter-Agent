import React from "react";
import { LucideIcon } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: LucideIcon | React.ComponentType<any>;
  rightIcon?: LucideIcon | React.ComponentType<any>;
}
