import React from "react";
import { motion } from "framer-motion";
import { MapPin, Briefcase, Clock, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Candidate } from "../../../types/candidate";
import { RankedCandidate } from "../../../types/ranking";

interface CandidateContextCardProps {
  candidate?: Candidate | null;
  rankedData?: RankedCandidate | null;
  isLoading?: boolean;
  /** Collapsed state for mobile */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SCORE_COLORS = [
  { min: 80, color: "#10b981" },
  { min: 60, color: "#3b82f6" },
  { min: 40, color: "#f59e0b" },
  { min: 0, color: "#ef4444" },
];

const scoreColor = (pct: number) =>
  SCORE_COLORS.find((c) => pct >= c.min)?.color ?? "#ef4444";

const MiniRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 48 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, pct) / 100) * circ;
  const color = scoreColor(pct);
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.28} fontWeight={800} fontFamily="inherit">
        {pct}
      </text>
    </svg>
  );
};

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`rounded-lg bg-surface-hover animate-pulse ${className}`} />
);

const CandidateContextCard: React.FC<CandidateContextCardProps> = ({
  candidate,
  rankedData,
  isLoading,
  collapsed,
  onToggleCollapse,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface backdrop-blur-xl p-5 flex flex-col gap-4">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="rounded-2xl border border-border bg-surface backdrop-blur-xl p-5 flex flex-col items-center gap-2 text-center">
        <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center">
          <span className="text-xl">👤</span>
        </div>
        <p className="text-xs text-text-muted">No candidate selected</p>
      </div>
    );
  }

  const profile = candidate.profile;
  const displayName = profile?.anonymizedName || candidate.name || "Candidate";
  const initials = displayName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const finalScore = rankedData
    ? Math.round((rankedData.finalScore ?? 0) * 100)
    : candidate.rankingScore
    ? Math.round((candidate.rankingScore.finalScore ?? 0) * 100)
    : 0;
  const reliability = candidate.reliabilityProfile
    ? Math.round((candidate.reliabilityProfile.reliabilityScore ?? 0) * 100)
    : null;
  const verdict = rankedData?.verdict ?? "";
  const topSkills = (candidate.skills ?? []).slice(0, 5);

  return (
    <div className="rounded-2xl border border-border bg-surface backdrop-blur-xl overflow-hidden">
      {/* Header toggle (mobile) */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between px-5 pt-4 pb-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
          aria-expanded={!collapsed}
        >
          <span>Candidate Context</span>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      )}

      {!onToggleCollapse && (
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Candidate Context
          </span>
        </div>
      )}

      {!collapsed && (
        <div className="px-5 pb-5 flex flex-col gap-4">
          {/* Avatar + identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-blue-500/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">{displayName}</p>
              <p className="text-xs text-blue-400 truncate">
                {profile?.headline || profile?.currentTitle || "Professional"}
              </p>
            </div>
          </div>

          {/* Score + Reliability row */}
          <div className="flex items-center gap-3">
            {finalScore > 0 && (
              <div className="flex flex-col items-center gap-0.5">
                <MiniRing pct={finalScore} />
                <span className="text-[9px] text-text-disabled uppercase tracking-wider">AI Score</span>
              </div>
            )}
            {reliability !== null && (
              <div className="flex flex-col items-center gap-0.5">
                <MiniRing pct={reliability} size={44} />
                <span className="text-[9px] text-text-disabled uppercase tracking-wider">Trust</span>
              </div>
            )}
            {verdict && (
              <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-500/25 bg-blue-500/10 text-blue-400">
                {verdict}
              </span>
            )}
          </div>

          {/* Quick facts */}
          <div className="flex flex-col gap-1.5 text-xs text-text-muted">
            {(profile?.location || candidate.location) && (
              <span className="flex items-center gap-1.5">
                <MapPin size={11} className="text-text-disabled" />
                {profile?.location || candidate.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Briefcase size={11} className="text-text-disabled" />
              {profile?.yearsOfExperience || candidate.experienceYears || 0} yrs experience
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} className="text-text-disabled" />
              Notice: {candidate.availability || `${candidate.redrob_signals?.noticePeriodDays ?? 0}d`}
            </span>
            {candidate.redrob_signals?.openToWorkFlag && (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Star size={10} />
                Open to Work
              </span>
            )}
          </div>

          {/* Top skills */}
          {topSkills.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-disabled">
                Top Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {topSkills.map((s) => (
                  <span
                    key={s.name}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-surface-hover border border-border text-text-muted"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rank */}
          {rankedData?.rank && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[10px] text-text-disabled font-semibold">Pool Rank</span>
              <span className="text-sm font-black text-amber-400">#{rankedData.rank}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateContextCard;
