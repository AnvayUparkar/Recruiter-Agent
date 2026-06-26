import React, { useState, useRef } from "react";
import { UploadCloud, AlertCircle, RefreshCw, CheckCircle, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../../api/client";
import { ENDPOINTS } from "../../api/endpoints";

export default function UserResumePage() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recruiter_user_resume_data");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved resume data");
        }
      }
    }
    return null;
  });
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
      // Hardcode candidate_id for demo purposes or pick from auth context if available
      formData.append("candidate_id", "demo-candidate-123");

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
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resume Successfully Parsed</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">We extracted the following information from your resume.</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
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
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Links</h4>
                <div className="space-y-2">
                  {parsedData.linkedin ? (
                    <a href={parsedData.linkedin} target="_blank" rel="noreferrer" className="block text-sm text-blue-500 hover:underline">
                      {parsedData.linkedin}
                    </a>
                  ) : <span className="text-sm text-slate-500">No LinkedIn found</span>}
                  
                  {parsedData.github ? (
                    <a href={parsedData.github} target="_blank" rel="noreferrer" className="block text-sm text-blue-500 hover:underline">
                      {parsedData.github}
                    </a>
                  ) : <span className="text-sm text-slate-500">No GitHub found</span>}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Top Skills Detected</h4>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills && parsedData.skills.length > 0 ? (
                  parsedData.skills.map((skill: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No skills could be extracted automatically.</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
