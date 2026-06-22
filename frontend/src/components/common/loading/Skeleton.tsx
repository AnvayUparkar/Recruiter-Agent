import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width = "100%",
  height = "16px",
  borderRadius = "0.375rem",
}) => {
  return (
    <div
      className={`animate-pulse bg-slate-800/80 ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
};

export default Skeleton;
