import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Building, MapPin, ExternalLink, Activity, Target, MessageCircle, ArrowLeft, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jobService, RecommendedJob } from "../../services/jobService";
import { ChatWindow } from "../../components/chat/ChatWindow";
import { apiClient } from "../../api/client";
import { ENDPOINTS } from "../../api/endpoints";

export default function UserDashboardPage() {
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSkills, setHasSkills] = useState(false);
  const [activeTab, setActiveTab] = useState<"jobs" | "messages">("jobs");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        // Try fetching profile from backend first
        let parsedData = null;
        try {
          const res = await apiClient.get(ENDPOINTS.USER_PROFILE);
          if (res.data?.resume_data) {
            parsedData = res.data.resume_data;
            localStorage.setItem("recruiter_user_resume_data", JSON.stringify(parsedData));
          }
        } catch (err) {
          console.error("Failed to fetch profile, falling back to local storage", err);
          const savedData = localStorage.getItem("recruiter_user_resume_data");
          if (savedData) parsedData = JSON.parse(savedData);
        }

        if (parsedData && parsedData.skills && parsedData.skills.length > 0) {
          setHasSkills(true);
          const recommendations = await jobService.getRecommendations(parsedData.skills);
          setJobs(recommendations);
        } else {
          setHasSkills(false);
        }
      } catch (error) {
        console.error("Error fetching recommended jobs:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobs();
  }, []);

  useEffect(() => {
    if (activeTab === "messages") {
      apiClient.get("/api/v1/chat/conversations")
        .then(res => {
          console.log("Conversations fetched:", res.data);
          if (res.data && res.data.conversations) {
            setConversations(res.data.conversations);
          }
        })
        .catch(err => {
          console.error("Failed to fetch conversations", err);
        });
    }
  }, [activeTab]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto overflow-x-hidden">
      <div className="mb-6 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Candidate Dashboard</h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-gray-400">Discover job opportunities perfectly tailored to your unique skill set.</p>
      </div>

      <div className="mb-6 md:mb-8 border-b border-slate-200 dark:border-slate-700">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("jobs")}
            className={`pb-4 text-sm font-bold transition-colors relative ${
              activeTab === "jobs"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Target size={18} />
              Recommended Jobs
            </div>
            {activeTab === "jobs" && (
              <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("messages")}
            className={`pb-4 text-sm font-bold transition-colors relative ${
              activeTab === "messages"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              Recruiter Messages
            </div>
            {activeTab === "messages" && (
              <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "jobs" ? (
          <motion.div
            key="jobs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
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
                        <span>
                          {job.salary_min ? `₹${job.salary_min.toLocaleString('en-IN')}` : ""}
                          {job.salary_min && job.salary_max ? " - " : ""}
                          {job.salary_max ? `₹${job.salary_max.toLocaleString('en-IN')}` : ""}
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
        </motion.div>
        ) : (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-[600px] flex flex-col"
          >
            {!selectedConversation ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Messages</h2>
                </div>
                <div className="overflow-y-auto flex-grow p-4 space-y-2">
                  {conversations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                      <MessageCircle size={48} className="mb-4 text-slate-300 dark:text-slate-700" />
                      <p>No messages yet. Check back later!</p>
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <div 
                        key={conv.conversationId}
                        onClick={() => setSelectedConversation(conv)}
                        className="flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          {conv.participantPicture ? (
                            <img src={conv.participantPicture} alt={conv.participantName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="text-slate-500" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                              {conv.participantName}
                            </h3>
                            <span className="text-xs text-slate-400 shrink-0 ml-2">
                              {new Date(conv.lastUpdated).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {conv.lastMessage || "Started a conversation"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-4 px-2 w-fit transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Messages
                </button>
                <div className="flex-grow min-h-0">
                  <ChatWindow 
                    conversationId={selectedConversation.conversationId}
                    receiverId={selectedConversation.recruiterId}
                    receiverName={selectedConversation.participantName}
                    receiverRole={selectedConversation.participantRole}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
