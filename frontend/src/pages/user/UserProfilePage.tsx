import { useState, useEffect } from "react";
import { User, Mail, Phone, Link2, Github, Briefcase, Award, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { apiClient } from "../../api/client";
import { ENDPOINTS } from "../../api/endpoints";

export default function UserProfilePage() {
  const [profileData, setProfileData] = useState<any | null>(null);

  useEffect(() => {
    // Read parsed resume data from local storage optimistically
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("recruiter_user_resume_data");
      if (savedData) {
        try {
          setProfileData(JSON.parse(savedData));
        } catch (e) {
          console.error("Failed to load profile data");
        }
      }
    }
    
    // Fetch from backend
    apiClient.get(ENDPOINTS.USER_PROFILE)
      .then(res => {
        if (res.data?.resume_data) {
          setProfileData(res.data.resume_data);
          localStorage.setItem("recruiter_user_resume_data", JSON.stringify(res.data.resume_data));
        }
      })
      .catch(err => {
        console.error("Failed to fetch profile", err);
      });
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">User Profile</h1>
        <p className="text-slate-600 dark:text-gray-400">View your auto-generated profile based on your uploaded resume.</p>
      </div>

      {!profileData ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col items-center justify-center py-20 px-4 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700/50 border-4 border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Your Profile is Empty</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
            Upload your latest resume to automatically generate a comprehensive profile showcasing your skills and experience.
          </p>
          <Link 
            to="/resume" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm shadow-blue-500/20"
          >
            Upload Resume
            <ChevronRight size={18} />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center"
            >
              <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-1 mb-6 shadow-md shadow-blue-500/20">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-blue-500 dark:text-blue-400">
                  <User size={48} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {(profileData.name || "Unknown Candidate").replace(/^contact\s+/i, '')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">
                Candidate Profile
              </p>

              <div className="space-y-4 text-left border-t border-slate-100 dark:border-slate-700/50 pt-6">
                {profileData.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 shrink-0">
                      <Mail size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{profileData.email}</span>
                  </div>
                )}
                {profileData.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 shrink-0">
                      <Phone size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{profileData.phone}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Links Section */}
            {(profileData.linkedin || profileData.github) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-5">Web Links</h3>
                <div className="space-y-3">
                  {profileData.linkedin && (
                    <a href={profileData.linkedin.startsWith("http") ? profileData.linkedin : `https://${profileData.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                      <Link2 size={18} className="text-blue-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">LinkedIn Profile</span>
                    </a>
                  )}
                  {profileData.github && (
                    <a href={profileData.github.startsWith("http") ? profileData.github : `https://${profileData.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                      <Github size={18} className="text-slate-800 dark:text-white" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">GitHub Profile</span>
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Skills & Content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8"
            >
              <div className="flex items-center gap-3 mb-6">

                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Award size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Technical Skills</h3>
              </div>
              
              {profileData.skills && profileData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {profileData.skills.map((skill: string, index: number) => (
                    <span 
                      key={index} 
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No specific technical skills were automatically detected from the resume.</p>
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Briefcase size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Experience & Education</h3>
              </div>
              
              <div className="space-y-8">
                {/* Experience Section */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-2">Experience</h4>
                  {profileData.experience && profileData.experience.length > 0 ? (
                    <div className="space-y-4">
                      {profileData.experience.map((exp: any, i: number) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                          <h5 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">{exp.title}</h5>
                          <ul className="list-disc pl-5 space-y-1 mt-2">
                            {exp.description.split('\n').filter((item: string) => item.trim()).map((item: string, idx: number) => (
                              <li key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                                {item.replace(/^[-•*]\s*/, '')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-500 text-sm italic">No experience blocks automatically detected.</p>
                  )}
                </div>

                {/* Education Section */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-2">Education</h4>
                  {profileData.education && profileData.education.length > 0 ? (
                    <div className="space-y-4">
                      {profileData.education.map((edu: any, i: number) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                          <h5 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">{edu.institution}</h5>
                          <ul className="list-disc pl-5 space-y-1 mt-2">
                            {edu.description.split('\n').filter((item: string) => item.trim()).map((item: string, idx: number) => (
                              <li key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                                {item.replace(/^[-•*]\s*/, '')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-500 text-sm italic">No education blocks automatically detected.</p>
                  )}
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 text-center">
                <Link 
                  to="/candidate/resume" 
                  className="inline-block text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                >
                  Manage Resume
                </Link>
              </div>
            </motion.div>
          </div>
          
        </div>
      )}
    </div>
  );
}
