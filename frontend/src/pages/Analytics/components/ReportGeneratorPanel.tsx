import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Play, CheckCircle } from "lucide-react";

interface ReportGeneratorPanelProps {
  candidates: Array<{ id: string; name: string }>;
  onReportGenerated: (type: string, filename: string) => void;
}

export const ReportGeneratorPanel: React.FC<ReportGeneratorPanelProps> = ({
  candidates,
  onReportGenerated,
}) => {
  const [reportType, setReportType] = useState("executive");
  const [targetCandidateId, setTargetCandidateId] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [readyFile, setReadyFile] = useState<string | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
    setReadyFile(null);

    const steps = [
      { p: 15, m: "Hydrating candidate profiles..." },
      { p: 40, m: "Running hybrid semantic calculations..." },
      { p: 70, m: "Synthesizing advisor justification texts..." },
      { p: 90, m: "Finalizing markdown layout formatting..." },
      { p: 100, m: "Report generated successfully!" },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setProgressMessage(steps[currentStep].m);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsGenerating(false);
          const filename = `${reportType}_report_${targetCandidateId}.md`;
          setReadyFile(filename);
          onReportGenerated(
            reportType === "executive" ? "Executive Summary" : "Candidate Briefing",
            filename
          );
        }, 600);
      }
    }, 800);
  };

  const handleDownload = () => {
    if (!readyFile) return;
    alert(`Downloading ${readyFile} to local storage output/reports/ directory.`);
    setReadyFile(null);
  };

  return (
    <div className="w-full glass-panel rounded-2xl border-border shadow-xl p-5 md:p-6 mb-6">
      <div className="mb-4 border-b border-border pb-3">
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-heading">
          Executive Report Builder
        </h2>
        <p className="text-[11px] text-muted mt-0.5">
          Compile and download briefing dossiers and comparison summaries.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Type Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Report Format</span>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-surface border border-border text-primary text-xs outline-none focus:border-blue-500"
          >
            <option value="executive">Executive Hiring Summary Report</option>
            <option value="dossier">Detailed Candidate Evaluation Dossier</option>
            <option value="comparison">Side-by-Side Finalist Comparison Log</option>
            <option value="chat">Recruiter Copilot Chat Logs Manifest</option>
          </select>
        </div>

        {/* Target Candidate */}
        {reportType === "dossier" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Candidate</span>
            <select
              value={targetCandidateId}
              onChange={(e) => setTargetCandidateId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-surface border border-border text-primary text-xs outline-none focus:border-blue-500"
            >
              <option value="all">All Finalists</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Generate Controls */}
        <div className="pt-2">
          {!isGenerating && !readyFile && (
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-glow hover:shadow-neon"
            >
              <Play size={14} fill="currentColor" />
              <span>Compile Executive Report</span>
            </button>
          )}

          {/* Progress Indicator */}
          {isGenerating && (
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-surface border border-border">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-medium animate-pulse">{progressMessage}</span>
                <span className="font-mono font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Download trigger */}
          {readyFile && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            >
              <CheckCircle size={20} className="shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold font-heading truncate">{readyFile}</p>
                <p className="text-[10px] text-emerald-500">Report compilation finished.</p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all"
              >
                <Download size={12} />
                <span>Save</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ReportGeneratorPanel;
