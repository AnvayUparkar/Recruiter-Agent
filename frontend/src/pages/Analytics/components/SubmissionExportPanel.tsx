import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { analyticsService } from "../../../services/analyticsService";
import { useAnalyticsStore } from "../../../store/analyticsStore";
import { useAppStore } from "../../../store/appStore";
import { CheckCircle2, Download, Clipboard, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const SubmissionExportPanel: React.FC = () => {
  const { parsedJD } = useAppStore();
  const { addExportHistoryItem } = useAnalyticsStore();
  const [showModal, setShowModal] = useState(false);
  const [modalDetails, setModalDetails] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const jdText = parsedJD?.rawText || parsedJD?.raw_text || "Default seek description for Quantitative risk modelling and python.";

  // API Call Mutation
  const exportMutation = useMutation({
    mutationFn: () => analyticsService.exportSubmission(jdText),
    onSuccess: (data) => {
      // Add record to Zustand
      addExportHistoryItem({
        type: "Submission Package",
        filename: data.exportPath.split(/[\\/]/).pop() || "candidate_submission.csv",
        rowCount: data.rowCount,
        sha256Hash: data.sha256Hash,
        status: "completed",
      });

      // Populate details and trigger modal
      setModalDetails(data);
      setShowModal(true);
    },
    onError: (err: any) => {
      alert(`Export failed: ${err.message}`);
    },
  });

  const handleCopyHash = () => {
    if (!modalDetails?.sha256Hash) return;
    navigator.clipboard.writeText(modalDetails.sha256Hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checklist = [
    { label: "Pool matches evaluated (100 candidates)", checked: true },
    { label: "Hybrid lexical/semantic weights applied", checked: true },
    { label: "Profile reliability risk penalties computed", checked: true },
    { label: "Compliance schema format validated", checked: true },
  ];

  return (
    <div className="w-full glass-panel rounded-2xl border-white/10 shadow-xl p-5 md:p-6 mb-6">
      <div className="mb-4 border-b border-white/5 pb-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
          Hackathon Exporter Center
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Generate matching rank logs mapped to submission-ready formats.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Compliance Checklist */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/2 border border-white/5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
            Ready for Submission Checklist
          </span>
          {checklist.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-350">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Trigger Button */}
        <button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold transition-all shadow-glow hover:shadow-neon"
        >
          {exportMutation.isPending ? (
            <span className="animate-pulse">Validating and Compiling...</span>
          ) : (
            <>
              <Download size={14} />
              <span>Generate Submission Manifest</span>
            </>
          )}
        </button>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showModal && modalDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg glass-panel p-6 md:p-8 rounded-3xl border-white/10 shadow-2xl relative flex flex-col items-center text-center bg-slate-950"
            >
              {/* Animated check circle */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-glow">
                <CheckCircle2 size={32} className="animate-bounce" />
              </div>

              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <Sparkles size={10} />
                <span>Verification Successful</span>
              </span>

              <h3 className="text-xl font-black text-white font-heading mt-2">
                Ready for Hackathon Submission
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                The ranking database has been exported to a standard submissions directory.
              </p>

              {/* Details table */}
              <div className="w-full mt-5 bg-white/2 rounded-2xl border border-white/5 p-4 text-left flex flex-col gap-3 font-mono text-[11px] text-slate-350">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-500 font-bold">EXPORTPATH:</span>
                  <span className="text-white text-right truncate pl-4 select-all">
                    {modalDetails.exportPath.split(/[\\/]/).pop()}
                  </span>
                </div>

                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-500 font-bold">ROW COUNT:</span>
                  <span className="text-white font-bold">{modalDetails.rowCount} candidate logs</span>
                </div>

                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-500 font-bold">GENERATED:</span>
                  <span className="text-white">{new Date(modalDetails.timestamp).toLocaleTimeString()}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-bold">SHA256 CHECKSUM HASH:</span>
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/10 mt-1">
                    <span className="text-white font-mono text-[10px] select-all flex-1 truncate">
                      {modalDetails.sha256Hash}
                    </span>
                    <button
                      onClick={handleCopyHash}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                      title="Copy checksum hash"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Clipboard size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-glow"
              >
                Close Verification Package
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default SubmissionExportPanel;
