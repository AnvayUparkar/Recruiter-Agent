import React, { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../../utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  enableTilt?: boolean;
  enableSpotlight?: boolean;
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, enableTilt = true, enableSpotlight = true, glow = false, style, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [spotlight, setSpotlight] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setSpotlight({ x, y });

      if (enableTilt && !shouldReduceMotion) {
        const width = rect.width;
        const height = rect.height;
        const mouseX = x - width / 2;
        const mouseY = y - height / 2;
        // Normalize rotation to max 8 degrees
        const rX = (mouseY / (height / 2)) * 8;
        const rY = -(mouseX / (width / 2)) * 8;
        setTilt({ x: rX, y: rY });
      }
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      setTilt({ x: 0, y: 0 });
    };

    const hoverClass = !shouldReduceMotion
      ? "hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-lg hover:border-accent/40"
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel relative rounded-2xl p-6 overflow-hidden border border-glass-border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          glow && "shadow-glow border-accent/20",
          hoverClass,
          className
        )}
        style={{
          transform:
            enableTilt && !shouldReduceMotion && isHovered
              ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
              : undefined,
          transition:
            isHovered
              ? "background-color 0.25s, border-color 0.25s, box-shadow 0.25s"
              : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s, border-color 0.25s, box-shadow 0.25s, y 0.25s",
          ...style,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Pointer Spotlight Sweep */}
        {enableSpotlight && isHovered && (
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(400px circle at ${spotlight.x}px ${spotlight.y}px, var(--accent-muted), transparent 80%)`,
            }}
          />
        )}

        {/* Ambient Corner Shine */}
        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[radial-gradient(circle,var(--accent-muted)_0%,transparent_70%)] opacity-30 pointer-events-none" />

        {/* Card Content Wrapper */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";
export default Card;
