import React from "react";
import { Candidate } from "../../../types/candidate";
import { Award, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

interface ComparisonRecommendationProps {
  candidate: Candidate;
  report: any; // RecruiterReport or custom synthesized recommendation details
  explanation?: any;
}

export const ComparisonRecommendation: React.FC<ComparisonRecommendationProps> = ({
  candidate,
  report,
  explanation,
}) => {
  // Extract details
  const recommendation = report?.hireRecommendation?.recommendation || 
                         report?.hire_recommendation?.recommendation || 
                         (candidate.rankingScore?.finalScore && candidate.rankingScore.finalScore >= 0.8 ? "Strong Hire" : "Hire");

  const confidence = report?.hireRecommendation?.confidence || 
                     report?.hire_recommendation?.confidence || 
                     candidate.rankingScore?.confidence || 0.85;

  const rationale = report?.overallAssessment || 
                    report?.recruiterSummary || 
                    report?.recruiter_summary || 
                    explanation?.summary ||
                    "Based on skill matches and progression markers, candidate shows solid compatibility with job requirements.";

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case "Strong Hire":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-450",
          icon: <ShieldCheck className="text-emerald-400" size={16} />,
        };
      case "Hire":
        return {
          bg: "bg-blue-500/10 border-blue-500/30 text-blue-450",
          icon: <Award className="text-blue-400" size={16} />,
        };
      case "Interview":
        return {
          bg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-450",
          icon: <HelpCircle className="text-indigo-400" size={16} />,
        };
      case "Consider":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-450",
          icon: <AlertTriangle className="text-amber-400" size={16} />,
        };
      default:
        return {
          bg: "bg-slate-500/10 border-slate-500/30 text-slate-400",
          icon: <AlertTriangle className="text-slate-400" size={16} />,
        };
    }
  };

  const style = getVerdictStyle(recommendation);

  return (
    <div className="p-5 rounded-2xl glass-panel border-white/10 shadow-md flex flex-col gap-4 bg-white/2 h-full">
      <div className="border-b border-white/5 pb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Hiring Verdict
          </h3>
          <p className="text-sm font-semibold text-white mt-0.5">
            {candidate.name}
          </p>
        </div>
        <span className="text-xs text-slate-500">Advisory</span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Recommendation Badge */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-350">Verdict Category:</span>
          <span className={`px-2.5 py-1 rounded-lg border font-bold text-xs flex items-center gap-1.5 ${style.bg}`}>
            {style.icon}
            {recommendation}
          </span>
        </div>

        {/* Confidence Percentage */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-350">Recommendation Confidence:</span>
          <span className="font-mono text-white font-bold">{Math.round(confidence * 100)}%</span>
        </div>

        {/* AI Rationale */}
        <div className="mt-2 flex flex-col gap-1.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Evaluation Summary
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-white/2 p-3 rounded-xl border border-white/5 whitespace-pre-line">
            {rationale}
          </p>
        </div>
      </div>
    </div>
  );
};
export default ComparisonRecommendation;
