import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Building, MapPin, DollarSign, ExternalLink, Activity, Target } from "lucide-react";
import { motion } from "framer-motion";
import { jobService, RecommendedJob } from "../../services/jobService";

export default function UserDashboardPage() {
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSkills, setHasSkills] = useState(false);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const savedData = localStorage.getItem("recruiter_user_resume_data");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData && parsedData.skills && parsedData.skills.length > 0) {
            setHasSkills(true);
            const recommendations = await jobService.getRecommendations(parsedData.skills);
            setJobs(recommendations);
          } else {
            setHasSkills(false);
          }
        }
      } catch (error) {
        console.error("Error fetching recommended jobs:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobs();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Candidate Dashboard</h1>
        <p className="text-slate-600 dark:text-gray-400">Discover job opportunities perfectly tailored to your unique skill set.</p>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Target size={20} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recommended For You</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Activity className="animate-spin text-blue-500 mb-4" size={32} />
            <p className="text-slate-500 dark:text-slate-400">Analyzing your profile and searching for matches...</p>
          </div>
        ) : !hasSkills ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col items-center justify-center py-16 px-4 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
              <Briefcase size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Unlock Job Recommendations</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
              Upload your resume to automatically extract your technical skills and receive highly targeted job matches.
            </p>
            <Link 
              to="/resume" 
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Upload Resume
            </Link>
          </motion.div>
        ) : jobs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">No matching jobs found right now. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/50 transition-all flex flex-col overflow-hidden group relative"
              >
                {/* Match Score Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    job.match_score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                    job.match_score >= 50 ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                  }`}>
                    {job.match_score}% Match
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 pr-16">{job.title}</h3>
                  
                  <div className="space-y-2 mb-4 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Building size={16} className="shrink-0" />
                      <span className="truncate">{job.company}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin size={16} className="shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    {(job.salary_min || job.salary_max) && (
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        <DollarSign size={16} className="shrink-0" />
                        <span>
                          {job.salary_min ? `$${job.salary_min.toLocaleString()}` : ""}
                          {job.salary_min && job.salary_max ? " - " : ""}
                          {job.salary_max ? `$${job.salary_max.toLocaleString()}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {job.required_skills.slice(0, 4).map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                    {job.required_skills.length > 4 && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-xs font-medium">
                        +{job.required_skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                  <a 
                    href={job.redirect_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full text-blue-600 dark:text-blue-400 font-medium text-sm"
                  >
                    View Job Details
                    <ExternalLink size={16} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
