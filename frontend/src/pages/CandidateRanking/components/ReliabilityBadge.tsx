import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";

interface ReliabilityBadgeProps {
  score: number; // 0 to 100
}

export const ReliabilityBadge: React.FC<ReliabilityBadgeProps> = ({ score }) => {
  const getTier = (s: number) => {
    if (s >= 90) return { label: "Elite Profile", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: ShieldCheck };
    if (s >= 75) return { label: "Verified Data", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: Shield };
    return { label: "High Risk", color: "text-rose-500 bg-rose-500/10 border-rose-500/20", icon: ShieldAlert };
  };

  const tier = getTier(score);
  const Icon = tier.icon;

  const [isHovered, setIsHovered] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  const handleMouseEnter = () => {
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 8,
        right: window.innerWidth - rect.right
      });
      setIsHovered(true);
    }
  };

  return (
    <>
      <span 
        ref={badgeRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase border flex items-center gap-1.5 transition-all outline-none focus-ring cursor-pointer inline-flex select-none ${tier.color}`} 
        tabIndex={0}
      >
        <Icon size={12} className="shrink-0" />
        <span>{score}% {tier.label}</span>
      </span>

      {/* Tooltip Portal */}
      {isHovered && createPortal(
        <div 
          style={{ position: 'fixed', top: coords.top, right: coords.right, transform: 'translateY(-100%)' }}
          className="px-3 py-2.5 rounded-xl bg-slate-950 text-white text-[10px] font-semibold pointer-events-none whitespace-normal z-[9999] shadow-2xl border border-slate-800 w-56 leading-relaxed text-left animate-in fade-in zoom-in duration-200"
        >
          Generated from platform activity consistency, profile completeness, and work history duration checks.
        </div>,
        document.body
      )}
    </>
  );
};

export default ReliabilityBadge;
