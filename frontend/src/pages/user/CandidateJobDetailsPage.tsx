import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Briefcase, MapPin, Clock, Building, ArrowLeft, Send, CheckCircle2, 
  XCircle, Zap, Target
} from "lucide-react";
import { candidatePortalService } from "../../services/candidatePortalService";
import { JobPosting } from "../../types/common"; // updated import
import { GlobalLoader } from "../../components/common/GlobalLoader";

export const CandidateJobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobData = await candidatePortalService.getJobDetails(id!);
        setJob(jobData);
        // Fetch AI Match
        const matchRes = await candidatePortalService.getJobMatch(id!);
        setMatchData(matchRes);
      } catch (error) {
        console.error("Failed to fetch job details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    setApplyError("");
    try {
      await candidatePortalService.applyToJob(id!);
      setApplied(true);
    } catch (err: any) {
      setApplyError(err.response?.data?.error || "Failed to apply.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <GlobalLoader />;
  if (!job) return <div className="p-8 text-center">Job not found.</div>;

  const score = Math.round((matchData?.score || 0) * 100);
  const verdict = matchData?.verdict || "Evaluating...";

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      {/* Back navigation */}
      <button 
        onClick={() => navigate("/portal/jobs")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            <Building className="w-10 h-10 text-slate-400" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">{job.title}</h1>
            <p className="text-lg text-slate-500">{job.company || "Company Name"}</p>
            
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full">
                <MapPin className="w-4 h-4 text-blue-500" /> {job.location} • {job.work_mode}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full">
                <Briefcase className="w-4 h-4 text-purple-500" /> {job.experience?.min ?? 0}-{job.experience?.max ?? 0} yrs
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4 text-emerald-500" /> {job.employment_type}
              </div>
            </div>
          </div>
          
          <div className="shrink-0 w-full md:w-auto flex flex-col gap-3">
            {applied ? (
              <button disabled className="w-full md:w-48 py-3.5 px-6 rounded-xl font-bold bg-emerald-500 text-white flex items-center justify-center gap-2 opacity-90 cursor-not-allowed">
                <CheckCircle2 className="w-5 h-5" /> Applied
              </button>
            ) : (
              <button 
                onClick={handleApply}
                disabled={applying}
                className="w-full md:w-48 py-3.5 px-6 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                {applying ? "Submitting..." : (
                  <>Apply Now <Send className="w-4 h-4" /></>
                )}
              </button>
            )}
            {applyError && (
              <p className="text-red-500 text-sm font-medium text-center">{applyError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Details */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">About the Role</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.required_skills?.map((s: string, i: number) => (
                <span key={`req-${i}`} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-medium border border-blue-200 dark:border-blue-800/50">
                  {s}
                </span>
              ))}
              {job.preferred_skills?.map((s: string, i: number) => (
                <span key={`pref-${i}`} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium border border-slate-200 dark:border-slate-700">
                  {s}
                </span>
              ))}
              {(!job.required_skills?.length && !job.preferred_skills?.length) && (
                <span className="text-slate-500 italic">No specific skills listed.</span>
              )}
            </div>
          </section>
          
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Benefits</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Comprehensive Health Insurance', 'Annual Bonus', 'Flexible WFH', 'Learning & Development Budget'].map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{b}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: AI Match Score */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" /> AI Match Score
            </h2>

            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative flex items-center justify-center w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * score) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{score}%</span>
                </div>
              </div>
              <div className="mt-4 px-4 py-1.5 bg-slate-100 dark:bg-white/10 rounded-full border border-slate-200 dark:border-white/20">
                <span className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">{verdict}</span>
              </div>
            </div>

            {matchData?.summary && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
                <div className="flex gap-3">
                  <Target className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{matchData.summary}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Matching Skills</h3>
              <div className="flex flex-wrap gap-2">
                {matchData?.strengths?.map((skill: string, i: number) => (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium border border-emerald-500/20 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> {skill}
                  </motion.span>
                ))}
              </div>

              {matchData?.gaps && matchData.gaps.length > 0 && (
                <>
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-6">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchData.gaps.map((skill: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-rose-500/10 text-rose-400 rounded-lg text-sm font-medium border border-rose-500/20 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CandidateJobDetailsPage;
