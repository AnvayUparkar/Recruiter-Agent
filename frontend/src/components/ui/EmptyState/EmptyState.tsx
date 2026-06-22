import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { Button } from "../Button/Button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: LucideIcon | React.ComponentType<any>;
  actionLabel?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  onActionClick,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "glass-panel border border-glass-border rounded-2xl p-10 flex flex-col items-center text-center justify-center max-w-lg mx-auto font-sans select-none",
        className
      )}
      {...props}
    >
      {/* Decorative Illustration Ring Mesh */}
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-glass-border bg-glass shadow-glass">
        {Icon ? (
          <Icon className="h-8 w-8 text-accent animate-[pulse_3s_infinite]" />
        ) : (
          /* Premium wireframe card silhouette */
          <svg
            className="h-8 w-8 text-accent animate-[pulse_3s_infinite]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.75c.621 0 1.125.504 1.125 1.125V18c0 .621-.504 1.125-1.125 1.125H5.25a1.125 1.125 0 01-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125H9m1.5-1.5h3h-3z" />
          </svg>
        )}
        <div className="absolute inset-0 rounded-2xl bg-radial-gradient from-accent-muted to-transparent pointer-events-none opacity-20" />
      </div>

      {/* Headings */}
      <h3 className="text-heading-lg font-semibold tracking-tight text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-body-md text-text-muted mb-6 leading-relaxed max-w-sm">
        {description}
      </p>

      {/* Optional action CTA */}
      {actionLabel && onActionClick && (
        <Button variant="primary" onClick={onActionClick} className="shadow-md hover:shadow-glow">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
