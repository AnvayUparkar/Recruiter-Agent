import React, { useState, useRef } from "react";
import { UploadCloud, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jdService } from "../../services/jdService";

interface JDUploadCardProps {
  onTextLoaded: (text: string) => void;
  onUploadingStateChange: (uploading: boolean) => void;
  disabled?: boolean;
}



export const JDUploadCard: React.FC<JDUploadCardProps> = ({
  onTextLoaded,
  onUploadingStateChange,
  disabled = false,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ["txt", "pdf", "doc", "docx"];

  const processFile = async (file: File) => {
    const name = file.name;
    const extension = name.split(".").pop()?.toLowerCase() || "";

    if (!allowedExtensions.includes(extension)) {
      setErrorMsg(`Unsupported file type (.${extension}). Only .txt, .pdf, .doc, and .docx are supported.`);
      return;
    }

    setErrorMsg(null);
    setFileName(name);
    onUploadingStateChange(true);
    setUploadProgress(15);

    // Simulate progress starting to show activity
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 85) return prev; // Hold at 85% until network completes
        return prev + 10;
      });
    }, 100);

    try {
      const extractedText = await jdService.extractText(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      onTextLoaded(extractedText);
      completeUpload();
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadProgress(null);
      setFileName(null);
      onUploadingStateChange(false);
      const errMsg = err.response?.data?.error || err.message || "Failed to extract text from the file.";
      setErrorMsg(errMsg);
    }
  };

  const completeUpload = () => {
    setTimeout(() => {
      setUploadProgress(null);
      setFileName(null);
      onUploadingStateChange(false);
    }, 300);
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

    if (disabled || uploadProgress !== null) return;

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
    if (disabled || uploadProgress !== null) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Upload Zone Panel */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFilePicker}
        className={`w-full py-8 px-5 rounded-2xl border-2 border-dashed flex flex-col items-center gap-4.5 cursor-pointer transition-all duration-300 relative overflow-hidden select-none outline-none focus-ring
          ${
            isDragActive
              ? "border-blue-500 bg-blue-500/5 shadow-inner-glow dark:bg-blue-500/3"
              : "border-slate-300 dark:border-slate-800 bg-slate-200/20 dark:bg-slate-900/10 hover:border-blue-500/50 hover:bg-slate-200/30 dark:hover:bg-slate-900/20"
          }
          ${disabled ? "opacity-55 cursor-not-allowed" : ""}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload job description file. Drag and drop text, PDF, or Word files, or click to pick from disk."
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          onChange={handleFileInput}
          disabled={disabled || uploadProgress !== null}
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
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/35 flex items-center justify-center text-blue-500 animate-spin">
                <RefreshCw size={18} />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-850 dark:text-slate-200 block truncate max-w-[200px]">
                  {fileName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-450 block">
                  Parsing file structures ({uploadProgress}%)
                </span>
              </div>
              {/* Progress bar container */}
              <div className="w-48 h-1 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
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
              className="flex flex-col items-center gap-2.5 text-center"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 dark:border-blue-400/20 flex items-center justify-center text-blue-500 dark:text-blue-450">
                <UploadCloud size={20} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Drag and drop your file here
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-450 block leading-normal">
                  Support formats: .txt, .pdf, .doc, .docx
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
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-semibold flex items-start gap-2.5 shadow-sm"
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JDUploadCard;
