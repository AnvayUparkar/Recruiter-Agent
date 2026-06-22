import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Download, Sparkles, X } from "lucide-react";
import { usePWAStore } from "../../store/pwaStore";
import { useToastStore } from "../../store/toastStore";

export const PwaInstallPrompt: React.FC = () => {
  const { installPrompt, setInstalled } = usePWAStore();
  const toastStore = useToastStore();
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the installation banner only when the deferred prompt is captured
    if (installPrompt) {
      setIsVisible(true);
    }
  }, [installPrompt]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Trigger browser prompt
    installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`[PWA Install] User choice outcome: ${outcome}`);

    if (outcome === "accepted") {
      setInstalled(true);
      toastStore.success("Successfully installed Antigravity Recruiter Copilot!");
    }

    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && installPrompt && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 50 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-6 z-[9990] max-w-sm w-full bg-slate-900/90 dark:bg-slate-950/90 border border-slate-200/10 dark:border-slate-800/60 backdrop-blur-xl rounded-2xl p-5 shadow-2xl pointer-events-auto select-none"
        >
          <div className="flex flex-col gap-4">
            {/* Header / Brand details */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-inner">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-100 tracking-wide">
                    Install Recruiter Copilot
                  </span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500">
                    Standalone Desktop/Mobile Application
                  </span>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-slate-200 transition-colors focus-ring outline-none"
                aria-label="Close installation prompt"
              >
                <X size={14} />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-350 dark:text-slate-400 leading-relaxed font-medium">
              Add the platform directly to your desktop dock or home screen. Access profiles instantly with full offline search, JD mapping, and quick load speeds.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/15 transition-all focus-ring outline-none"
              >
                <Download size={13} />
                <span>Install Application</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-slate-250 transition-colors text-xs font-semibold focus-ring outline-none"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaInstallPrompt;
