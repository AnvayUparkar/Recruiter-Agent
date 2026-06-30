import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { jobService } from "../../services/jobService";
import { 
  Briefcase, Plus, MapPin, DollarSign, Users, 
  MoreVertical, Activity
} from "lucide-react";

export const JobPostingsList: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const data = await jobService.getJobs();
      setJobs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getStatusColor = (status: string) => {
    if (status === "Published") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
    if (status === "Draft") return "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400";
    return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3 tracking-tight">
            <Briefcase className="text-blue-500" size={28} />
            Job Postings
          </h1>
          <p className="text-sm text-slate-500 mt-2">Manage all your open positions and view ATS pipelines.</p>
        </div>
        <button 
          onClick={() => navigate("/jobs/create")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
        >
          <Plus size={18} /> Create Job Posting
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : jobs.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm"
        >
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No jobs posted yet</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Create your first job posting to start matching with top AI-ranked candidates instantly.</p>
          <button 
            onClick={() => navigate("/jobs/create")}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105"
          >
            Create Job Posting
          </button>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {jobs.map((job) => (
              <motion.div 
                key={job._id}
                variants={itemVariants}
                className="group glass-panel bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all cursor-pointer flex flex-col h-full"
                onClick={() => navigate(`/recruiter/jobs/${job._id}`)}
              >
                {/* Status & Menu */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(job.status || 'Draft')}`}>
                    {job.status || 'Draft'}
                  </span>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* show menu logic */ }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
                
                {/* Title & Company */}
                <div className="mb-6 flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{job.title}</h3>
                  <p className="text-slate-500 text-sm font-medium">{job.company || 'Your Company'}</p>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                    <Briefcase size={16} className="text-slate-400" />
                    <span>{job.employment_type || 'Full-time'}</span>
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                      <DollarSign size={16} className="text-slate-400" />
                      <span>
                        {job.salary_min ? `$${job.salary_min.toLocaleString()}` : ''}
                        {job.salary_min && job.salary_max ? ' - ' : ''}
                        {job.salary_max ? `$${job.salary_max.toLocaleString()}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats Footer */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                      {job.applications || 0}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Users size={12} /> Applicants
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3">
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-1">
                      {job.matched_candidates?.length || 0}
                    </div>
                    <div className="text-xs font-semibold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider flex items-center gap-1">
                      <Activity size={12} /> AI Matches
                    </div>
                  </div>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default JobPostingsList;
