import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Building, MapPin, Calendar, ArrowRight, Activity, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { candidatePortalService, CandidateApplication } from "../../services/candidatePortalService";
import { GlobalLoader } from "../../components/common/GlobalLoader";

export const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await candidatePortalService.getMyApplications();
        setApplications(data);
      } catch (error) {
        console.error("Failed to fetch applications", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Applications</h1>
          <p className="text-slate-500 mt-2">Track the status of jobs you've applied to.</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="p-12 text-center bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-900 dark:text-white">No applications yet</h3>
          <p className="text-slate-500 mt-2">Start exploring jobs and apply to find your next great role.</p>
          <button 
            onClick={() => navigate("/portal/jobs")}
            className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Explore Jobs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app, idx) => {
            const score = Math.round((app.match_score_snapshot || 0) * 100);
            return (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row gap-6 md:items-center hover:border-blue-500/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/portal/jobs/${app.job_id}`)}
              >
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  <Building className="w-8 h-8 text-slate-500" />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{app.job_title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {app.company}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {app.location}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-8">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5 ${
                      app.status === 'Applied' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                      app.status === 'Viewed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' :
                      app.status === 'Interview Scheduled' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {app.status === 'Applied' && <Activity className="w-4 h-4" />}
                      {app.status === 'Interview Scheduled' && <CheckCircle2 className="w-4 h-4" />}
                      {app.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Match Score</span>
                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
                      <svg className="w-full h-full absolute top-0 left-0 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-blue-500" strokeWidth="10" strokeDasharray="283" strokeDashoffset={283 - (283 * score) / 100} />
                      </svg>
                      <span className="text-xs font-bold text-slate-900 dark:text-white relative z-10">{score}%</span>
                    </div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-slate-400 hidden lg:block" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default MyApplicationsPage;
