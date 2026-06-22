import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, Loader2, X } from "lucide-react";
import { useToastStore, Toast } from "../../store/toastStore";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();
  const shouldReduceMotion = useReducedMotion();

  const getToastStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-950/20 dark:border-emerald-500/30",
          text: "text-emerald-800 dark:text-emerald-300",
          icon: <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />,
        };
      case "error":
        return {
          bg: "bg-rose-500/10 border-rose-500/20 dark:bg-rose-950/20 dark:border-rose-500/30",
          text: "text-rose-800 dark:text-rose-300",
          icon: <AlertOctagon className="text-rose-500 shrink-0" size={18} />,
        };
      case "warning":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-950/20 dark:border-amber-500/30",
          text: "text-amber-800 dark:text-amber-300",
          icon: <AlertTriangle className="text-amber-500 shrink-0" size={18} />,
        };
      case "info":
        return {
          bg: "bg-blue-500/10 border-blue-500/20 dark:bg-blue-950/20 dark:border-blue-500/30",
          text: "text-blue-800 dark:text-blue-300",
          icon: <Info className="text-blue-500 shrink-0" size={18} />,
        };
      case "loading":
      default:
        return {
          bg: "bg-slate-500/10 border-slate-200/10 dark:bg-slate-900/30 dark:border-slate-800/60",
          text: "text-slate-800 dark:text-slate-200",
          icon: <Loader2 className="text-blue-500 animate-spin shrink-0" size={18} />,
        };
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3.5 w-full max-w-sm pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast: Toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <motion.div
              key={toast.id}
              layout
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`pointer-events-auto flex flex-col gap-2 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${styles.bg}`}
            >
              <div className="flex items-start gap-3.5">
                {styles.icon}
                <div className="flex-1 flex flex-col gap-1">
                  <p className={`text-xs font-semibold leading-relaxed ${styles.text}`}>
                    {toast.message}
                  </p>
                  
                  {/* Optional action CTA */}
                  {toast.action && (
                    <button
                      onClick={() => {
                        toast.action?.onClick();
                        removeToast(toast.id);
                      }}
                      className="mt-2.5 px-3 py-1.5 self-start rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shadow-sm transition-all focus-ring outline-none"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
                
                {/* Dismiss Button */}
                {toast.type !== "loading" && (
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-1 rounded-lg hover:bg-slate-500/10 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 transition-colors focus-ring outline-none"
                    aria-label="Dismiss notification"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {/* Optional progress tracker for auto-dismissible toasts */}
              {toast.type !== "loading" && toast.duration && toast.duration > 0 && (
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: toast.duration / 1000, ease: "linear" }}
                  className={`h-1 w-full rounded-full self-start opacity-35 ${
                    toast.type === "success" ? "bg-emerald-500" :
                    toast.type === "error" ? "bg-rose-500" :
                    toast.type === "warning" ? "bg-amber-500" : "bg-blue-500"
                  }`}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
