import React from "react";
import { cn } from "../../../utils/cn";

// Base Shimmering Shape
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

export const Skeleton: React.FC<SkeletonProps> = ({ variant = "rectangular", className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-shimmer rounded bg-surface-hover/30",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 w-full rounded",
        className
      )}
      {...props}
    />
  );
};

// Shimmering Card
export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-panel border border-glass-border rounded-2xl p-6 flex flex-col gap-4 w-full">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
        <div className="flex flex-col gap-1.5 w-full">
          <Skeleton variant="text" className="h-4 w-[60%]" />
          <Skeleton variant="text" className="h-3 w-[40%]" />
        </div>
      </div>
      {/* Description lines */}
      <div className="flex flex-col gap-2.5 mt-2">
        <Skeleton variant="text" className="h-3.5 w-full" />
        <Skeleton variant="text" className="h-3.5 w-[90%]" />
        <Skeleton variant="text" className="h-3.5 w-[75%]" />
      </div>
      {/* Footer tags */}
      <div className="flex items-center gap-2 mt-4 pt-2 border-t border-glass-border">
        <Skeleton variant="rectangular" className="h-6 w-16 rounded-full" />
        <Skeleton variant="rectangular" className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
};

// Shimmering Dashboard Grid
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col gap-2 w-1/3">
          <Skeleton variant="text" className="h-6 w-full" />
          <Skeleton variant="text" className="h-4 w-2/3" />
        </div>
        <Skeleton variant="rectangular" className="h-10 w-28 rounded-lg" />
      </div>

      {/* Grid of Mini Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel border border-glass-border rounded-xl p-4 flex flex-col gap-3">
            <Skeleton variant="text" className="h-3 w-1/3" />
            <Skeleton variant="text" className="h-8 w-1/2" />
            <Skeleton variant="text" className="h-3 w-2/3" />
          </div>
        ))}
      </div>

      {/* Primary Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Skeleton variant="rectangular" className="h-[350px] w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
};

// Shimmering Table/List Block
export const TableSkeleton: React.FC = () => {
  return (
    <div className="glass-panel border border-glass-border rounded-2xl p-6 flex flex-col w-full overflow-hidden">
      {/* Table Header Controls */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-glass-border">
        <Skeleton variant="rectangular" className="h-9 w-48 rounded-lg" />
        <Skeleton variant="rectangular" className="h-9 w-24 rounded-lg" />
      </div>

      {/* Mock Table Rows */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="grid grid-cols-4 items-center py-2.5 border-b border-glass-border last:border-b-0 gap-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="h-8 w-8 shrink-0" />
              <Skeleton variant="text" className="h-3.5 w-full" />
            </div>
            <Skeleton variant="text" className="h-3.5 w-2/3" />
            <Skeleton variant="text" className="h-3.5 w-1/2" />
            <div className="flex justify-end">
              <Skeleton variant="rectangular" className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
