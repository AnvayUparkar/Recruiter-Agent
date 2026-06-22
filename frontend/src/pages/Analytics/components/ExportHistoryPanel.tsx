import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalyticsStore } from "../../../store/analyticsStore";
import { Download, CheckCircle, Clock } from "lucide-react";

export const ExportHistoryPanel: React.FC = () => {
  const { exportHistory, clearExportHistory } = useAnalyticsStore();

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) + 
      ", " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDownload = (filename: string) => {
    alert(`Retrieving exported file: ${filename} from local outputs manifest.`);
  };

  return (
    <div className="w-full glass-panel rounded-2xl border-white/10 shadow-xl p-5 md:p-6 mb-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
            Export & Verification Logs
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Previous submissions and dossiers processed by the dashboard.
          </p>
        </div>
        {exportHistory.length > 0 && (
          <button
            onClick={clearExportHistory}
            className="p-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-450 hover:text-rose-400 transition-colors text-[10px] uppercase font-bold px-2 py-1"
          >
            Clear Log
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {exportHistory.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">
              No export records logged.
            </div>
          ) : (
            exportHistory.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
                className="p-3 rounded-xl bg-white/2 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white truncate font-heading leading-none">
                      {item.filename}
                    </span>
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded uppercase">
                      {item.type}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono truncate">
                    HASH: {item.sha256Hash}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    <span>{formatDate(item.created)}</span>
                  </span>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                    <CheckCircle size={10} />
                    <span>Active</span>
                  </span>
                  <button
                    onClick={() => handleDownload(item.filename)}
                    className="p-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 hover:text-white"
                    title="Retrieve local file"
                  >
                    <Download size={12} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default ExportHistoryPanel;
