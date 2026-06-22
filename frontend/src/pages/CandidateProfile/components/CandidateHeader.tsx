import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  Star,
  Share2,
  Download,
  Bot,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Candidate } from "../../../types/candidate";
import { RankedCandidate } from "../../../types/ranking";

interface CandidateHeaderProps {
  candidate: Candidate;
  rankedData?: RankedCandidate | null;
  onExport?: () => void;
}

const SCORE_COLORS = [
  { min: 85, color: "#10b981", label: "Exceptional" },
  { min: 70, color: "#3b82f6", label: "Strong" },
  { min: 55, color: "#f59e0b", label: "Moderate" },
  { min: 0, color: "#ef4444", label: "Needs Review" },
];

const getScoreMeta = (score: number) =>
  SCORE_COLORS.find((c) => score >= c.min) ?? SCORE_COLORS[SCORE_COLORS.length - 1];

/** Circular SVG score ring */
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 72 }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = circ - (pct / 100) * circ;
  const meta = getScoreMeta(score);

  return (
    <svg width={size} height={size} className="shrink-0" aria-label={`Score: ${score}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={6}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={meta.color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 6px ${meta.color}88)` }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={meta.color}
        fontSize={size * 0.24}
        fontWeight={800}
        fontFamily="inherit"
      >
        {score}
      </text>
    </svg>
  );
};

const CandidateHeader: React.FC<CandidateHeaderProps> = ({
  candidate,
  rankedData,
  onExport,
}) => {
  const navigate = useNavigate();
  const profile = candidate.profile;

  const displayName = profile?.anonymizedName || candidate.name || "Anonymous Candidate";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const finalScore = rankedData
    ? Math.round((rankedData.finalScore ?? 0) * 100)
    : candidate.rankingScore
    ? Math.round((candidate.rankingScore.finalScore ?? 0) * 100)
    : 0;

  const confidence = rankedData?.confidence ?? candidate.rankingScore?.confidence ?? 0;
  const rank = rankedData?.rank;
  const verdict = rankedData?.verdict ?? "";
  const scoreMeta = getScoreMeta(finalScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl shadow-2xl"
      style={{ boxShadow: `0 0 60px ${scoreMeta.color}18` }}
    >
      {/* Ambient glow stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${scoreMeta.color}66, transparent)`,
        }}
      />

      <div className="p-6 md:p-8">
        {/* Top bar: back + actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-100 transition-colors group"
          >
            <ArrowLeft
              size={15}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Rankings
          </button>

          <div className="flex items-center gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all"
              >
                <Download size={13} />
                Export
              </button>
            )}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all"
              aria-label="Share profile"
            >
              <Share2 size={13} />
              Share
            </button>
            <Link
              to="/copilot"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all"
            >
              <Bot size={13} />
              AI Copilot
            </Link>
          </div>
        </div>

        {/* Main hero row */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-blue-500 via-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/25">
              {initials}
            </div>
            {rank && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-black text-white shadow-md shadow-amber-500/30"
              >
                #{rank}
              </motion.div>
            )}
          </div>

          {/* Identity block */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-slate-50 tracking-tight truncate">
                {displayName}
              </h1>
              {verdict && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                  style={{
                    color: scoreMeta.color,
                    borderColor: `${scoreMeta.color}44`,
                    backgroundColor: `${scoreMeta.color}14`,
                  }}
                >
                  {verdict}
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-slate-300 mb-3">
              {profile?.headline || profile?.currentTitle || "Senior Professional"}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-slate-500" />
                {profile?.location || candidate.location || "Remote"}
                {profile?.country && `, ${profile.country}`}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase size={12} className="text-slate-500" />
                {profile?.yearsOfExperience || candidate.experienceYears || 0} yrs experience
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-slate-500" />
                Notice:{" "}
                {candidate.availability ||
                  `${candidate.redrob_signals?.noticePeriodDays ?? 0} days`}
              </span>
              {candidate.redrob_signals?.openToWorkFlag && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/25 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                  <Star size={10} />
                  Open to Work
                </span>
              )}
            </div>
          </div>

          {/* Score ring + confidence */}
          {finalScore > 0 && (
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <ScoreRing score={finalScore} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                AI Score
              </span>
              <span className="text-[10px] text-slate-600">
                {Math.round(confidence * 100)}% conf.
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CandidateHeader;
