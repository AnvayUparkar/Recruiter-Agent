import React, { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  BrainCircuit,
  ShieldCheck,
  MessagesSquare,
  BarChart,
  UserPlus,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCandidateDetails } from "../../../hooks/queries/useCandidate";
import { RankedCandidate } from "../../../types/ranking";
import { useCandidateStore } from "../../../store/candidateStore";

interface CandidateCardProps {
  rankedInfo: RankedCandidate;
  isCompared: boolean;
  onToggleComparison: (checked: boolean) => void;
  isCompareDisabled: boolean;
  onSelect: () => void;
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  glowClass?: string;
}

// Premium Circular Progress Component
const CircularProgress = ({ value, size = 60, strokeWidth = 6, colorClass = "text-blue-500", glowClass = "shadow-blue-500/50" }: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className={`absolute inset-0 rounded-full blur-md opacity-40 ${glowClass}`} />
      <svg className="transform -rotate-90 relative z-10" width={size} height={size}>
        <circle
          className="text-slate-200 dark:text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-xs font-black text-slate-900 dark:text-white leading-none">{value}%</span>
      </div>
    </div>
  );
};

interface PremiumMetricBarProps {
  label: string;
  score: number;
  colorFrom: string;
  colorTo: string;
  tooltip?: string;
}

// Premium Metric Bar Component
const PremiumMetricBar = ({ label, score, colorFrom, colorTo, tooltip }: PremiumMetricBarProps) => {
  return (
    <div className="group relative" title={tooltip}>
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-[10px] font-black text-slate-900 dark:text-white">{score}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${colorFrom} ${colorTo} shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
        />
      </div>
    </div>
  );
};

export const CandidateCard = React.memo<CandidateCardProps>(({
  rankedInfo,
  isCompared,
  onToggleComparison,
  isCompareDisabled,
  onSelect,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { setSelectedCandidateId } = useCandidateStore();

  // Fetch candidate details asynchronously
  const { data: candidate, isLoading } = useCandidateDetails(rankedInfo.candidateId, !rankedInfo.details);

  const candidateData = rankedInfo.details || candidate;
  const isRowLoading = !rankedInfo.details && isLoading;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    card.style.transform = `perspective(1000px) rotateX(${-(y / (box.height / 2)) * 2}deg) rotateY(${(x / (box.width / 2)) * 2}deg)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    if (!shouldReduceMotion) {
      e.currentTarget.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    }
  };

  const handleOpenCopilot = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCandidateId(rankedInfo.candidateId);
    navigate("/copilot");
  };

  if (isRowLoading) {
    return (
      <div className="p-5 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 shadow-xl space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  // Exact Data Extraction (NO FAKE DATA)
  const finalScorePct = Math.round(rankedInfo.finalScore * 100);
  const confidencePct = Math.round(rankedInfo.confidence * 100);

  const name = candidateData?.profile?.anonymizedName || candidateData?.name || rankedInfo.candidateId;
  const currentTitle = candidateData?.profile?.currentTitle || candidateData?.profile?.headline;
  const experienceYears = candidateData?.profile?.yearsOfExperience || candidateData?.experienceYears;
  const location = candidateData?.profile?.location || candidateData?.location;
  
  // Availability Check
  const availabilityText = candidateData?.availability || (candidateData?.redrob_signals?.noticePeriodDays !== undefined ? `${candidateData.redrob_signals.noticePeriodDays} Days` : null);

  // Recommendations
  const verdict = rankedInfo.verdict || rankedInfo.fit_verdict || "Evaluated";
  const recommendationSummary = rankedInfo.summary || rankedInfo.explanation?.summary;

  let recIconColor = "text-blue-400";
  let recBg = "from-blue-500/10 to-indigo-500/5 border-blue-500/20";
  if (verdict.toLowerCase().includes("highly")) {
    recIconColor = "text-emerald-400";
    recBg = "from-emerald-500/10 to-teal-500/5 border-emerald-500/20";
  } else if (verdict.toLowerCase().includes("reservation")) {
    recIconColor = "text-amber-400";
    recBg = "from-amber-500/10 to-orange-500/5 border-amber-500/20";
  }

  // Real Subscores (If available)
  const scoreDetails = rankedInfo.scoreDetails || candidateData?.scoreDetails;
  const technicalScore = scoreDetails?.technicalScore ? Math.round(scoreDetails.technicalScore * 100) : null;
  const behavioralScore = scoreDetails?.behavioralScore ? Math.round(scoreDetails.behavioralScore * 100) : null;
  const reliabilityScore = candidateData?.reliabilityProfile?.reliabilityScore ? Math.round(candidateData.reliabilityProfile.reliabilityScore * 100) : scoreDetails?.trustScore ? Math.round(scoreDetails.trustScore * 100) : null;
  const leadershipScore = scoreDetails?.leadershipScore ? Math.round(scoreDetails.leadershipScore * 100) : null;

  // Verification Signals
  const redrobSignals = candidateData?.redrob_signals;

  // Real Explanations
  const strengths = rankedInfo.explanation?.strengths || [];

  // Skills
  const rawSkills = candidateData?.skills || [];
  const displaySkills = rawSkills.slice(0, 6);

  // Profile Image Fallback Generator
  const initial = name ? name.substring(0, 1).toUpperCase() : "?";

  // Rank Badge Style
  const getRankBadge = (rank: number) => {
    if (rank === 1) return { label: "🥇 #1 Top Match", cls: "bg-gradient-to-r from-amber-200 to-amber-500 text-amber-900 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]" };
    if (rank === 2) return { label: "🥈 #2 Strong Match", cls: "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 border-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.4)]" };
    if (rank === 3) return { label: "🥉 #3 Recommended", cls: "bg-gradient-to-r from-orange-200 to-orange-400 text-orange-900 border-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.4)]" };
    return { label: `#${rank} Match`, cls: "bg-white/10 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300" };
  };
  const rankBadge = getRankBadge(rankedInfo.rank);

  return (
    <motion.div
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-3xl p-[1px] group transition-all duration-300 z-10 hover:z-50 focus-ring cursor-pointer"
      tabIndex={0}
      aria-label={`View dossier for ranked ${rankedInfo.rank} candidate ${name}`}
    >
      {/* Animated Gradient Border Layer */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md pointer-events-none" />
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-cyan-500/40 opacity-30 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Main Card Container */}
      <div className="relative h-full flex flex-col bg-white dark:bg-[#0A0F1C] backdrop-blur-3xl rounded-3xl p-5 overflow-visible shadow-lg group-hover:shadow-xl transition-shadow duration-300">
        
        {/* Floating AI Intelligence Layer (Revealed on Hover) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute -right-4 -top-20 w-72 p-4 rounded-2xl bg-white dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 shadow-2xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 pointer-events-none"
            >
              <div className="flex items-center justify-between mb-2 border-b border-slate-200 dark:border-slate-700/50 pb-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">
                  <BrainCircuit size={10} /> AI Insight
                </span>
                <span className="text-[10px] font-black text-slate-900 dark:text-white">Conf: {confidencePct}%</span>
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Top Matching Factors</p>
                {strengths.length > 0 ? (
                  strengths.slice(0, 4).map((str: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] text-slate-700 dark:text-slate-200 leading-tight">
                      <CheckCircle2 size={10} className="text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{str}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-500 italic">Core intelligence details loading...</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header: Rank, Avatar, Score, Identity */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <div className="flex items-start gap-3">
            {/* Intelligent Avatar Fallback */}
            <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[1.5px] shrink-0 shadow-md`}>
              {candidateData?.profileImage ? (
                <img src={candidateData.profileImage} alt={name} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-900">
                  <span className="text-lg font-black text-slate-700 dark:text-white tracking-widest">{initial}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider w-max ${rankBadge.cls}`}>
                {rankBadge.label}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {name}
              </h3>
              {currentTitle && (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {currentTitle}
                </span>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-500">
                {location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {location}</span>}
                {experienceYears !== undefined && <span className="flex items-center gap-0.5"><Briefcase size={10} /> {experienceYears} Yrs</span>}
                {availabilityText && <span className="flex items-center gap-0.5"><Clock size={10} /> {availabilityText}</span>}
              </div>
            </div>
          </div>

          {/* Overall Match Circular Progress */}
          <div className="flex flex-col items-center shrink-0 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <CircularProgress value={finalScorePct} size={48} strokeWidth={5} colorClass="text-blue-500 dark:text-blue-400" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Match Score</span>
          </div>
        </div>

        {/* AI Recommendation Banner */}
        {(verdict || recommendationSummary) && (
          <div className={`flex items-start gap-2.5 p-3 rounded-xl border bg-gradient-to-r ${recBg} mb-4`}>
            <Sparkles size={16} className={`${recIconColor} shrink-0 mt-0.5`} />
            <div className="flex flex-col">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${recIconColor} mb-0.5`}>
                {verdict}
              </span>
              {recommendationSummary && (
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-snug">
                  {recommendationSummary}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Real Metrics Visualization (Only rendered if present in backend) */}
          {(technicalScore !== null || behavioralScore !== null || reliabilityScore !== null || leadershipScore !== null) && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">Intelligence Metrics</h4>
              <div className="space-y-2">
                {technicalScore !== null && <PremiumMetricBar label="Technical Fit" score={technicalScore} colorFrom="from-blue-400" colorTo="to-indigo-500" tooltip="Backend score for technical alignment" />}
                {behavioralScore !== null && <PremiumMetricBar label="Behavioral Fit" score={behavioralScore} colorFrom="from-purple-400" colorTo="to-pink-500" tooltip="Backend score for behavioral alignment" />}
                {reliabilityScore !== null && <PremiumMetricBar label="Profile Reliability" score={reliabilityScore} colorFrom="from-teal-400" colorTo="to-emerald-500" tooltip="Backend score for candidate profile trust" />}
                {leadershipScore !== null && <PremiumMetricBar label="Leadership Potential" score={leadershipScore} colorFrom="from-amber-400" colorTo="to-orange-500" tooltip="Backend score for leadership signals" />}
              </div>
            </div>
          )}

          {/* Verification Module (Only if redrob_signals exist) */}
          {redrobSignals && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">Verification Status</h4>
              <div className="space-y-1.5">
                {redrobSignals.tenure_authenticated !== undefined && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {redrobSignals.tenure_authenticated ? (
                      <><ShieldCheck size={12} className="text-emerald-500" /><span>Tenure Authenticated</span></>
                    ) : (
                      <><AlertCircle size={12} className="text-amber-500" /><span>Tenure Unverified</span></>
                    )}
                  </div>
                )}
                {redrobSignals.timeline_gaps_detected !== undefined && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {redrobSignals.timeline_gaps_detected ? (
                      <><AlertTriangle size={12} className="text-rose-500" /><span>Timeline Gaps Detected</span></>
                    ) : (
                      <><ShieldCheck size={12} className="text-emerald-500" /><span>No Career Gaps Detected</span></>
                    )}
                  </div>
                )}
                {/* Fallback if no specific signal matched but object exists */}
                {redrobSignals.tenure_authenticated === undefined && redrobSignals.timeline_gaps_detected === undefined && (
                  <div className="text-[11px] text-slate-500 italic">No specific verifications found.</div>
                )}
              </div>
            </div>
          )}

          {/* Explainable AI Panel (If no metrics but strengths exist) */}
          {strengths.length > 0 && !(technicalScore !== null || behavioralScore !== null) && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">Why This Candidate?</h4>
              <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                {strengths.slice(0, 5).map((str: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-tight">{str}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Real Skills Visualization */}
        {displaySkills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {displaySkills.map((skillObj: any, idx: number) => {
                const skillName = typeof skillObj === "string" ? skillObj : skillObj.name;
                const proficiency = typeof skillObj === "object" && skillObj.proficiency ? skillObj.proficiency : null;
                
                return (
                  <div 
                    key={idx}
                    className="group/skill relative px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-default overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover/skill:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{skillName}</span>
                      {proficiency && (
                        <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 capitalize">{proficiency}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Card Footer / Actions */}
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={onSelect}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95 outline-none focus-ring"
            >
              <BarChart size={12} /> Full Intelligence
            </button>
            <button 
              onClick={handleOpenCopilot}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all active:scale-95 outline-none focus-ring"
            >
              <MessagesSquare size={12} /> Generate Q's
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label 
              className="flex items-center gap-1.5 cursor-pointer group/compare"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isCompared ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-400 dark:border-slate-600 text-transparent group-hover/compare:border-blue-400'}`}>
                <CheckCircle2 size={10} />
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={isCompared}
                disabled={!isCompared && isCompareDisabled}
                onChange={(e) => onToggleComparison(e.target.checked)}
              />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover/compare:text-slate-900 dark:group-hover/compare:text-slate-200">
                Compare
              </span>
            </label>
            <button 
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-all active:scale-95 ml-2 outline-none focus-ring" 
              title="Shortlist"
              onClick={(e) => e.stopPropagation()}
            >
              <UserPlus size={14} />
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
});

export default CandidateCard;
