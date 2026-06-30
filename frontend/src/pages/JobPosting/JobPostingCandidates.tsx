import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jobService } from "../../services/jobService";
import { useSocket } from "../../hooks/useSocket";
import { motion } from "framer-motion";
import { Check, Sparkles, Filter, Eye, Send } from "lucide-react";

export const JobPostingCandidates: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();

  const fetchCandidates = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const matches = await jobService.getJobCandidates(id);
      setCandidates(matches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [id]);

  useEffect(() => {
    if (socket) {
      socket.on("job_published", (data: any) => {
        if (data.job_id === id) {
          fetchCandidates();
        }
      });
      return () => {
        socket.off("job_published");
      };
    }
  }, [socket, id]);

  const handleRegenerate = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      await jobService.regenerateMatches(id);
      await fetchCandidates();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3 tracking-tight">
            <Sparkles className="text-blue-500" size={28} />
            Matched Candidates
          </h1>
          <p className="text-sm text-slate-500 mt-2">Real-time candidate matches retrieved via Hybrid Search & BM25 Scoring.</p>
        </div>
        <button 
          onClick={handleRegenerate}
          disabled={isLoading}
          className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
        >
          {isLoading ? "Matching..." : "Regenerate Matches"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {/* Filters Sidebar */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-5">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
              <Filter size={16} /> Filters
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500">Match Score</label>
              <input type="range" min="0" max="100" className="w-full accent-blue-500" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500">Availability</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm">
                <option>All</option>
                <option>Immediate</option>
                <option>30 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
              <p>Analyzing candidates in real-time...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-20 text-slate-500 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800">
              No matching candidates found for this position.
            </div>
          ) : (
            candidates.map((cand, idx) => (
              <motion.div
                key={cand.candidate_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-5 relative hover:shadow-lg transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md">
                  {cand.profile?.name?.charAt(0) || "U"}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{cand.profile?.name || "Unknown Candidate"}</h3>
                      <p className="text-sm font-medium text-slate-500">{cand.profile?.title || "Professional"} • {cand.profile?.location || "Remote"}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm">
                        <Sparkles size={14} /> {(cand.score * 100).toFixed(0)}% Match
                      </div>
                      {cand.application_status === "Applied" && cand.applied_score !== undefined && (cand.applied_score !== cand.score) && (
                        <div className="text-xs text-slate-500 font-medium">
                          Applied with: {(cand.applied_score * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {cand.summary}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {cand.profile?.skills?.slice(0, 5).map((skill: any) => (
                      <span key={skill.name} className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-semibold flex items-center gap-1">
                        <Check size={12} /> {skill.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col justify-end md:justify-start gap-2 pt-4 md:pt-0 md:pl-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800">
                  <button className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <Send size={16} /> Invite
                  </button>
                  <button className="flex-1 md:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <Eye size={16} /> View
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
