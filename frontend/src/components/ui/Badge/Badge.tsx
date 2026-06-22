import React from "react";
import { cn } from "../../../utils/cn";

// Status Badge: features a subtle pulsing status indicator dot
export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "muted";
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  variant = "info",
  pulse = true,
  className,
  ...props
}) => {
  const bgColors = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    info: "bg-info/10 text-info border-info/20",
    muted: "bg-surface-hover text-text-muted border-border",
  };

  const dotColors = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
    muted: "bg-text-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold border select-none tracking-wide uppercase",
        bgColors[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColors[variant]
            )}
          />
          <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColors[variant])} />
        </span>
      )}
      {children}
    </span>
  );
};

// Score Badge: represents score percentages (e.g. 98/100, Match 85%)
export interface ScoreBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  score: number; // 0 to 100
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, className, ...props }) => {
  let colorClass = "text-danger border-danger/30 bg-danger/10 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
  if (score >= 80) {
    colorClass = "text-success border-success/30 bg-success/10 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
  } else if (score >= 60) {
    colorClass = "text-warning border-warning/30 bg-warning/10 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-mono font-bold text-body-sm px-2 py-0.5 rounded-lg border select-none tracking-tight",
        colorClass,
        className
      )}
      {...props}
    >
      {score}% Match
    </span>
  );
};

// Rank Badge: features gold/silver/bronze metallic gradients and glowing animations
export interface RankBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  rank: number; // 1 = Gold, 2 = Silver, 3 = Bronze, etc.
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, className, ...props }) => {
  let rankClass = "bg-glass border-glass-border text-text-muted";
  let suffixLabel = `#${rank}`;

  if (rank === 1) {
    rankClass =
      "bg-gradient-to-r from-amber-400/20 via-yellow-300/20 to-amber-500/20 text-yellow-300 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.25)] animate-pulse";
    suffixLabel = "🥇 Rank #1";
  } else if (rank === 2) {
    rankClass =
      "bg-gradient-to-r from-slate-300/20 via-zinc-200/20 to-slate-400/20 text-zinc-300 border-zinc-400/40 shadow-[0_0_10px_rgba(228,228,231,0.15)]";
    suffixLabel = "🥈 Rank #2";
  } else if (rank === 3) {
    rankClass =
      "bg-gradient-to-r from-amber-700/20 via-amber-600/20 to-orange-800/20 text-orange-400 border-orange-700/40 shadow-[0_0_10px_rgba(194,65,12,0.15)]";
    suffixLabel = "🥉 Rank #3";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-sans font-semibold text-body-sm px-3 py-1 rounded-lg border select-none tracking-wide",
        rankClass,
        className
      )}
      {...props}
    >
      {suffixLabel}
    </span>
  );
};
