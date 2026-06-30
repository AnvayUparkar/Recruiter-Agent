import React from "react";
import { 
  Briefcase, ChevronRight, Sparkles 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ApplicantCardProps {
  applicant: any;
  viewMode: "kanban" | "list";
  stages?: string[];
  onStageChange?: (newStage: string) => void;
}

export const ApplicantCard: React.FC<ApplicantCardProps> = ({ 
  applicant, 
  viewMode,
  stages,
  onStageChange
}) => {
  const navigate = useNavigate();
  const score = applicant.score || 0;
  const matchPercentage = Math.round(score * 100);
  const profile = applicant.profile || {};
  
  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
    if (pct >= 60) return "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
    if (pct >= 40) return "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20";
    return "text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20";
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (viewMode === "list") {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        {/* Avatar & Score */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-500 shrink-0">
            {getInitials(profile.name)}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{profile.name || "Unknown Applicant"}</h3>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border mt-1 ${getScoreColor(matchPercentage)}`}>
              <Sparkles size={12} /> {matchPercentage}% Match
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Briefcase size={16} className="shrink-0" />
            <span className="line-clamp-1">{profile.headline || "Applicant"}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(profile.skills || []).slice(0, 5).map((skill: any, idx: number) => (
              <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-medium border border-slate-200 dark:border-slate-700">
                {typeof skill === 'string' ? skill : skill.name}
              </span>
            ))}
            {(profile.skills || []).length > 5 && (
              <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-md text-[10px] font-medium">
                +{(profile.skills || []).length - 5}
              </span>
            )}
          </div>
        </div>

        {/* Actions & Stage Dropdown */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          {stages && onStageChange && (
            <select 
              value={applicant.application_status || "Applied"}
              onChange={(e) => onStageChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {stages.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          <button 
            onClick={() => navigate(`/candidates/${applicant.candidate_id}`)}
            className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            View Full Profile <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Kanban view
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
          {getInitials(profile.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{profile.name || "Unknown Applicant"}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{profile.headline || "Applicant"}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${getScoreColor(matchPercentage)}`}>
          <Sparkles size={12} /> {matchPercentage}%
        </div>
        <button 
          onClick={() => navigate(`/candidates/${applicant.candidate_id}`)}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-500/20 rounded-lg transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
