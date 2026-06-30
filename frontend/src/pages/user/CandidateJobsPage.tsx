import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, Users, Building, ArrowRight, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { candidatePortalService } from "../../services/candidatePortalService";
import { JobPosting } from "../../types/common";
import { GlobalLoader } from "../../components/common/GlobalLoader";

export const CandidateJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await candidatePortalService.getJobs();
        setJobs(data);
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Discover Opportunities</h1>
          <p className="text-slate-500 mt-2">Find your next role matching your skills and experience.</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="p-12 text-center bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-900 dark:text-white">No jobs available</h3>
          <p className="text-slate-500 mt-2">Check back later for new opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, idx) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/portal/jobs/${job._id}`)}
              className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  <Building className="w-6 h-6 text-slate-500" />
                </div>
                <button
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                  onClick={(e) => { e.stopPropagation(); candidatePortalService.saveJob(job._id!); }}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{job.title}</h3>
                <p className="text-slate-500 text-sm mt-1">{job.company || "Company Name"}</p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location} • {job.work_mode}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Briefcase className="w-4 h-4" />
                  <span>{job.experience?.min ?? 0} - {job.experience?.max ?? 0} years</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>{job.employment_type}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Users className="w-4 h-4" />
                  {job.applications_count || 0} applicants
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                  View details <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
export default CandidateJobsPage;
