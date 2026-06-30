import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../../api/client";
import { ENDPOINTS } from "../../api/endpoints";

export default function UserResumePage() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);

  React.useEffect(() => {
    // Clear any potentially corrupted localStorage data on first load
    console.log('[UserResumePage] Component mounted, checking for resume data');
    
    // Optimistically load from localStorage first
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recruiter_user_resume_data");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('[UserResumePage] Loaded resume data from localStorage:', parsed);
          setParsedData(parsed);
        } catch (e) {
          console.error("[UserResumePage] Failed to parse saved resume data:", e);
          // Clear corrupted data
          localStorage.removeItem("recruiter_user_resume_data");
        }
      } else {
        console.log('[UserResumePage] No saved resume data in localStorage');
      }
    }
    
    // Fetch fresh from backend
    apiClient.get(ENDPOINTS.USER_PROFILE)
      .then(res => {
        console.log('[UserResumePage] Profile response:', res.data);
        if (res.data?.resume_data) {
          console.log('[UserResumePage] Setting resume data from backend:', res.data.resume_data);
          setParsedData(res.data.resume_data);
          localStorage.setItem("recruiter_user_resume_data", JSON.stringify(res.data.resume_data));
        } else {
          console.log('[UserResumePage] No resume_data in profile response');
        }
      })
      .catch(err => {
        console.error("[UserResumePage] Failed to fetch profile:", err);
      });
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ["pdf", "doc", "docx"];

  const processFile = async (file: File) => {
    const name = file.name;
    const extension = name.split(".").pop()?.toLowerCase() || "";

    if (!allowedExtensions.includes(extension)) {
      setErrorMsg(`Unsupported file type (.${extension}). Only .pdf, .doc, and .docx are supported.`);
      return;
    }

    setErrorMsg(null);
    setFileName(name);
    setUploadProgress(15);
    setParsedData(null);

    // Simulate progress starting to show activity
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 85) return prev; // Hold at 85% until network completes
        return prev + 10;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post(ENDPOINTS.USER_RESUME_UPLOAD, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setParsedData(response.data.data);
      localStorage.setItem("recruiter_user_resume_data", JSON.stringify(response.data.data));
      
      setTimeout(() => {
        setUploadProgress(null);
        setFileName(null);
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadProgress(null);
      setFileName(null);
      const errMsg = err.response?.data?.error || err.message || "Failed to parse resume.";
      setErrorMsg(errMsg);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (uploadProgress !== null) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFilePicker = () => {
    if (uploadProgress !== null) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Resume</h1>
        <p className="text-slate-600 dark:text-gray-400">Upload and manage your resume to enhance your profile.</p>
      </div>

      <div className="w-full flex flex-col gap-5">
        {/* Upload Zone Panel */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFilePicker}
          className={`w-full py-12 px-5 rounded-2xl border-2 border-dashed flex flex-col items-center gap-4.5 cursor-pointer transition-all duration-300 relative overflow-hidden select-none outline-none focus-ring
            ${
              isDragActive
                ? "border-blue-500 bg-blue-500/5 shadow-inner-glow dark:bg-blue-500/3"
                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }
            ${uploadProgress !== null ? "opacity-75 cursor-not-allowed" : ""}`}
          role="button"
          tabIndex={uploadProgress !== null ? -1 : 0}
          aria-label="Upload resume file. Drag and drop PDF or Word files, or click to pick from disk."
        >
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
            disabled={uploadProgress !== null}
            className="hidden"
            tabIndex={-1}
          />

          <AnimatePresence mode="wait">
            {uploadProgress !== null ? (
              /* Upload Progress loader state */
              <motion.div
                key="loader"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center gap-3 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 animate-spin">
                  <RefreshCw size={22} />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]">
                    {fileName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Analyzing skills and experience ({uploadProgress}%)
                  </span>
                </div>
                {/* Progress bar container */}
                <div className="w-64 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </motion.div>
            ) : (
              /* Default prompt state */
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                  <UploadCloud size={28} className="animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100 block">
                    Drag and drop your resume here
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 block leading-normal">
                    Or click to browse files. Supports PDF and DOCX.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Feedback card */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-start gap-3 shadow-sm"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success / Parsed Data View */}
      {parsedData && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resume Successfully Parsed</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">We extracted the following information from your resume.</p>
            </div>
            <button
              onClick={() => {
                console.log('[UserResumePage] Clearing resume data');
                setParsedData(null);
                localStorage.removeItem("recruiter_user_resume_data");
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Clear & Re-upload
            </button>
          </div>
          
          <div className="p-6 grid grid-cols-1 gap-8">
            {/* Debug Info - Remove in production */}
            {import.meta.env.DEV && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs font-mono text-yellow-800 dark:text-yellow-200">
                  Debug: Experience entries: {parsedData.experience ? parsedData.experience.length : 'undefined'}
                  {parsedData.experience && parsedData.experience.length > 0 && (
                    <span> | First entry has: {Object.keys(parsedData.experience[0]).join(', ')}</span>
                  )}
                </p>
              </div>
            )}
            {/* Contact Details Section */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Contact Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Name</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{parsedData.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Email</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{parsedData.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Phone</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{parsedData.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Years of Experience</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{parsedData.years_of_experience || 0} years</span>
                  </div>
                </div>
              </div>
              
              {parsedData.linkedin || parsedData.github ? (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Links</h4>
                  <div className="space-y-2">
                    {parsedData.linkedin && (
                      <a href={parsedData.linkedin.startsWith("http") ? parsedData.linkedin : `https://${parsedData.linkedin}`} target="_blank" rel="noreferrer" className="block text-sm text-blue-500 hover:underline">
                        LinkedIn Profile
                      </a>
                    )}
                    
                    {parsedData.github && (
                      <a href={parsedData.github.startsWith("http") ? parsedData.github : `https://${parsedData.github}`} target="_blank" rel="noreferrer" className="block text-sm text-blue-500 hover:underline">
                        GitHub Profile
                      </a>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* Skills Section */}
            {parsedData.skills && parsedData.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Skills Detected ({parsedData.skills.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Section */}
            {parsedData.experience && Array.isArray(parsedData.experience) && parsedData.experience.length > 0 ? (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Work Experience ({parsedData.experience.length})</h4>
                <div className="space-y-6">
                  {parsedData.experience.map((exp: any, index: number) => {
                    try {
                      // Handle new structured format
                      if (exp?.designation || exp?.company) {
                        const designation = exp.designation || "Position";
                        const company = exp.company || "Company";
                        const duration = exp.duration || "";
                        const location = exp.location || "";
                        const experienceYears = exp.experience_years || 0;
                        
                        let responsibilities: string[] = [];
                        if (Array.isArray(exp.responsibilities)) {
                          responsibilities = exp.responsibilities.filter((r: any) => r && typeof r === 'string' && r.trim());
                        }
                        
                        let technologies: string[] = [];
                        if (Array.isArray(exp.technologies)) {
                          technologies = exp.technologies.filter((t: any) => t && typeof t === 'string');
                        }
                        
                        return (
                          <div key={index} className="border-l-2 border-blue-500 pl-4 pb-4">
                            <div className="mb-2">
                              <h5 className="text-base font-bold text-slate-900 dark:text-white">{designation}</h5>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{company}</p>
                              {(duration || location || experienceYears > 0) && (
                                <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {duration && <span>📅 {duration}</span>}
                                  {location && <span>📍 {location}</span>}
                                  {experienceYears > 0 && <span>⏱️ {experienceYears} years</span>}
                                </div>
                              )}
                            </div>
                            
                            {responsibilities.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Key Responsibilities:</p>
                                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4 list-disc">
                                  {responsibilities.map((resp: string, idx: number) => (
                                    <li key={idx}>{resp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {technologies.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Technologies:</p>
                                <div className="flex flex-wrap gap-1">
                                  {technologies.map((tech: string, idx: number) => (
                                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // Handle old unstructured format
                      else {
                        const title = exp?.title || "";
                        const description = exp?.description || "";
                        
                        if (!title && !description) return null;
                        
                        // Parse the description to extract meaningful content
                        const lines = description ? description.split('\n').map((line: string) => line.trim()).filter(Boolean) : [];
                        
                        // Separate skills/technologies from responsibilities
                        const skillLines = lines.filter((line: string) => 
                          line.toLowerCase().includes('languages:') || 
                          line.toLowerCase().includes('technical skills') ||
                          line.toLowerCase().includes('ai / ml') ||
                          line.toLowerCase().includes('api integrations') ||
                          line.toLowerCase().includes('web & app development') ||
                          line.toLowerCase().includes('cloud & databases')
                        );
                        
                        const responsibilityLines = lines.filter((line: string) => 
                          !skillLines.includes(line) &&
                          !line.toLowerCase().includes('languages:') &&
                          !line.toLowerCase().includes('technical skills') &&
                          !line.toLowerCase().includes('link:') &&
                          !line.startsWith('https://') &&
                          line.length > 10
                        );
                        
                        // Extract technologies from skill lines
                        const extractedTechnologies = new Set<string>();
                        skillLines.forEach((line: string) => {
                          // Extract technologies after colons
                          const colonIndex = line.indexOf(':');
                          if (colonIndex > -1) {
                            const techPart = line.substring(colonIndex + 1);
                            const techs = techPart.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 1);
                            techs.forEach((tech: string) => extractedTechnologies.add(tech));
                          }
                        });
                        
                        return (
                          <div key={index} className="border-l-2 border-blue-500 pl-4 pb-4">
                            <div className="mb-2">
                              <h5 className="text-base font-bold text-slate-900 dark:text-white">
                                {title || "Project Experience"}
                              </h5>
                            </div>
                            
                            {responsibilityLines.length > 0 && (
                              <div className="mt-2">
                                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                  {responsibilityLines.map((resp: string, idx: number) => (
                                    <li key={idx} className="leading-relaxed">
                                      {resp.startsWith('- ') ? resp.substring(2) : resp}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {extractedTechnologies.size > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Technologies:</p>
                                <div className="flex flex-wrap gap-1">
                                  {Array.from(extractedTechnologies).map((tech: string, idx: number) => (
                                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    } catch (error) {
                      console.error('Error rendering experience entry:', error, exp);
                      return null;
                    }
                  })}
                </div>
              </div>
            ) : parsedData.experience && !Array.isArray(parsedData.experience) ? (
              /* Fallback for non-array experience data */
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Work Experience</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{JSON.stringify(parsedData.experience, null, 2)}</p>
                </div>
              </div>
            ) : null}

            {/* Education Section */}
            {parsedData.education && Array.isArray(parsedData.education) && parsedData.education.length > 0 ? (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Education</h4>
                <div className="space-y-4">
                  {parsedData.education.map((edu: any, index: number) => {
                    try {
                      // Handle new structured format
                      if (edu?.degree || edu?.institution) {
                        const degree = edu.degree || "";
                        const institution = edu.institution || "";
                        const university = edu.university || "";
                        const graduationYear = edu.graduation_year || "";
                        const location = edu.location || "";
                        
                        return (
                          <div key={index} className="border-l-2 border-emerald-500 pl-4">
                            {degree && (
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">{degree}</h5>
                            )}
                            {institution && (
                              <p className="text-sm text-slate-700 dark:text-slate-300">{institution}</p>
                            )}
                            {university && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{university}</p>
                            )}
                            
                            {(graduationYear || location) && (
                              <div className="flex gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {graduationYear && <span>🎓 {graduationYear}</span>}
                                {location && <span>📍 {location}</span>}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // Handle old unstructured format
                      else {
                        const title = edu?.title || "";
                        const description = edu?.description || "";
                        
                        if (!title && !description) return null;
                        
                        // Parse date from title (like "Aug-2023-27")
                        let parsedDate = "";
                        let parsedDegree = "";
                        
                        if (title.match(/\w{3}-\d{4}-\d{2}/)) {
                          // Format like "Aug-2023-27"
                          const parts = title.split('-');
                          if (parts.length >= 2) {
                            const month = parts[0];
                            const year = parts[1];
                            parsedDate = `${month} ${year}`;
                          }
                        } else {
                          parsedDegree = title;
                        }
                        
                        // Parse degree from description
                        const lines = description ? description.split('\n').map((line: string) => line.trim()).filter(Boolean) : [];
                        const degreeLines = lines.filter((line: string) => 
                          line.toLowerCase().includes('bachelor') || 
                          line.toLowerCase().includes('master') ||
                          line.toLowerCase().includes('degree') ||
                          line.toLowerCase().includes('b.tech') ||
                          line.toLowerCase().includes('m.tech') ||
                          line.toLowerCase().includes('bsc') ||
                          line.toLowerCase().includes('msc')
                        );
                        
                        const yearLines = lines.filter((line: string) => line.match(/^\d{4}$/));
                        
                        return (
                          <div key={index} className="border-l-2 border-emerald-500 pl-4">
                            {degreeLines.length > 0 ? (
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">{degreeLines[0]}</h5>
                            ) : parsedDegree ? (
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">Education</h5>
                            ) : (
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">Education Entry</h5>
                            )}
                            
                            {lines.filter((line: string) => !degreeLines.includes(line) && !yearLines.includes(line) && line.length > 5).map((line: string, idx: number) => (
                              <p key={idx} className="text-sm text-slate-700 dark:text-slate-300">{line}</p>
                            ))}
                            
                            <div className="flex gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {parsedDate && <span>🎓 {parsedDate}</span>}
                              {yearLines.length > 0 && !parsedDate && <span>🎓 {yearLines[0]}</span>}
                            </div>
                          </div>
                        );
                      }
                    } catch (error) {
                      console.error('Error rendering education entry:', error, edu);
                      return null;
                    }
                  })}
                </div>
              </div>
            ) : parsedData.education && !Array.isArray(parsedData.education) ? (
              /* Fallback for non-array education data */
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Education</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{JSON.stringify(parsedData.education, null, 2)}</p>
                </div>
              </div>
            ) : null}

            {/* Certifications Section */}
            {parsedData.certifications && parsedData.certifications.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Certifications ({parsedData.certifications.length})</h4>
                <ul className="space-y-2">
                  {parsedData.certifications.map((cert: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span>{cert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Languages Section */}
            {parsedData.languages && parsedData.languages.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {parsedData.languages.map((lang: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-800">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Section */}
            {parsedData.projects && Array.isArray(parsedData.projects) && parsedData.projects.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Projects ({parsedData.projects.length})</h4>
                <div className="space-y-4">
                  {parsedData.projects.map((proj: any, index: number) => {
                    try {
                      const title = proj.title || "Project";
                      const description = proj.description || "";
                      const projectLink = proj.project_link || "";
                      const duration = proj.duration || "";
                      const technologies = Array.isArray(proj.technologies) ? proj.technologies : [];
                      
                      return (
                        <div key={index} className="border-l-2 border-amber-500 pl-4 pb-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h5>
                            {duration && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">📅 {duration}</span>
                            )}
                          </div>
                          
                          {projectLink && (
                            <div className="mb-2">
                              <a 
                                href={projectLink.startsWith('http') ? projectLink : `https://${projectLink}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                🔗 Project Link
                              </a>
                            </div>
                          )}
                          
                          {description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed whitespace-pre-line">
                              {description}
                            </p>
                          )}
                          
                          {technologies.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Technologies:</p>
                              <div className="flex flex-wrap gap-1">
                                {technologies.map((tech: string, idx: number) => (
                                  <span key={idx} className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering project entry:', error, proj);
                      return null;
                    }
                  })}
                </div>
              </div>
            )}

            {/* Achievements Section */}
            {parsedData.achievements && parsedData.achievements.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Achievements</h4>
                <ul className="space-y-2">
                  {parsedData.achievements.map((ach: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-yellow-500 mt-0.5">★</span>
                      <span>{ach}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            <Link
              to="/user-dashboard"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm"
            >
              View Job Matches
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
