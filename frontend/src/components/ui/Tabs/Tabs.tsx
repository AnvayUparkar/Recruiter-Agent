import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../../utils/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "underline" | "pill";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "flex select-none font-sans",
        variant === "underline" && "border-b border-glass-border w-full gap-8",
        variant === "pill" && "glass-panel p-1 rounded-xl border border-glass-border gap-1 items-center self-start",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-4 py-2.5 text-body-sm font-semibold select-none transition-colors duration-200 outline-none focus:outline-none",
              // Underline classes
              variant === "underline" &&
                "text-text-muted hover:text-text-primary pb-3 border-b-2 border-transparent focus-visible:text-accent",
              variant === "underline" && isActive && "text-accent font-bold",
              
              // Pill classes
              variant === "pill" &&
                "rounded-lg text-text-muted hover:text-text-primary z-10 px-5",
              variant === "pill" && isActive && "text-accent font-bold"
            )}
          >
            {/* Sliding Highlight Layer */}
            {isActive && variant === "underline" && (
              <motion.div
                layoutId={shouldReduceMotion ? undefined : "active-tab-underline"}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent shadow-glow"
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}

            {isActive && variant === "pill" && (
              <motion.div
                layoutId={shouldReduceMotion ? undefined : "active-tab-pill"}
                className="absolute inset-0 bg-accent/10 border border-accent/20 rounded-lg shadow-glow z-[-1]"
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}

            <span className="flex items-center gap-1.5 justify-center">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold select-none",
                    isActive ? "bg-accent text-white" : "bg-surface-hover text-text-muted border border-border"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
