import { ButtonVariant, ButtonSize } from "./Button.types";

export const baseStyles =
  "relative inline-flex items-center justify-center font-sans font-medium select-none text-center outline-none transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]";

export const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover shadow-md hover:shadow-glow active:scale-[0.97]",
  secondary:
    "bg-surface-hover text-text-primary hover:bg-border border border-transparent active:scale-[0.97]",
  ghost:
    "bg-transparent text-text-primary hover:bg-surface-hover active:scale-[0.97]",
  danger:
    "bg-danger text-white hover:bg-red-600 shadow-md hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] active:scale-[0.97]",
  success:
    "bg-success text-white hover:bg-emerald-600 shadow-md hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.97]",
  outline:
    "bg-transparent text-text-primary border border-border hover:bg-surface-hover active:scale-[0.97]",
};

export const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-body-sm rounded-md gap-1.5",
  md: "px-5 py-2 text-body-md rounded-lg gap-2",
  lg: "px-7 py-3 text-heading-md rounded-xl gap-2.5",
};
