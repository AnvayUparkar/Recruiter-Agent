import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Users, Target, Zap, BarChart2 } from "lucide-react";


interface AnalyticsPanelProps {
  jobId: string;
  onClose: () => void;
  applicants: any[];
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ jobId, onClose, applicants }) => {
  // const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        // Simulating data load, everything is derived from applicants prop
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [jobId]);

  const strongMatches = applicants.filter(a => (a.score || 0) >= 0.8).length;
  const avgScore = applicants.length > 0 
    ? applicants.reduce((acc, a) => acc + (a.score || 0), 0) / applicants.length 
    : 0;

  return (
    <motion.div 
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 350, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden shadow-xl"
    >
      <div className="w-[350px] flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="text-blue-500" size={20} />
            Live Analytics
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Funnel Overview */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Hiring Funnel</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                      <Users size={16} /> <span className="text-xs font-bold uppercase">Total Applied</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{applicants.length}</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                      <Target size={16} /> <span className="text-xs font-bold uppercase">AI Qualified</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{strongMatches}</div>
                  </div>
                </div>
              </div>

              {/* Match Quality */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Match Quality</h4>
                
                <div className="glass-panel bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Zap size={18} /> <span className="text-sm font-bold">Average Match Score</span>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                      {Math.round(avgScore * 100)}%
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-blue-200/50 dark:bg-blue-900/50 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.round(avgScore * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Pipeline Breakdown</h4>
                
                <div className="space-y-3">
                  {["Applied", "Screening", "Interviewing", "Offer", "Hired", "Rejected"].map(stage => {
                    const count = applicants.filter(a => a.application_status === stage).length;
                    const pct = applicants.length ? Math.round((count / applicants.length) * 100) : 0;
                    
                    if (count === 0) return null;
                    
                    return (
                      <div key={stage} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{stage}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 hidden sm:block">
                            <div className="bg-slate-400 dark:bg-slate-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white w-6 text-right">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
