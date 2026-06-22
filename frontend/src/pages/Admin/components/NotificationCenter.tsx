import React from "react";
import { Bell, X, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { useAdminStore, AdminNotification } from "../../../store/adminStore";
import { AnimatePresence, motion } from "framer-motion";

export const NotificationCenter: React.FC = () => {
  const { notifications, dismissNotification, clearNotifications } = useAdminStore();

  const getIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="text-emerald-500" size={16} />;
      case "warning": return <AlertTriangle className="text-amber-500" size={16} />;
      case "error": return <AlertCircle className="text-rose-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  const getBorderColor = (type: AdminNotification["type"]) => {
    switch (type) {
      case "success": return "border-emerald-500/10 hover:border-emerald-500/30";
      case "warning": return "border-amber-500/10 hover:border-amber-500/30";
      case "error": return "border-rose-500/10 hover:border-rose-500/30";
      default: return "border-blue-500/10 hover:border-blue-500/30";
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Bell className="text-blue-500" size={20} />
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Notification Center
            </h3>
            <p className="text-xs text-slate-400">Live operational alerts and notifications feed</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="text-[10px] text-slate-400 hover:text-slate-200 font-extrabold transition-colors select-none"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold select-none">
              No active warnings or alerts. System status stable.
            </div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={`p-3 rounded-xl border bg-slate-500/5 ${getBorderColor(
                  notif.type
                )} flex items-start gap-3 transition-all`}
              >
                <div className="shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate leading-normal">
                      {notif.title}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold shrink-0 self-center">
                      {formatTime(notif.timestamp)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-medium">
                    {notif.message}
                  </p>
                </div>

                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="shrink-0 p-0.5 hover:bg-slate-500/10 rounded text-slate-400 hover:text-slate-200 transition-all outline-none"
                  aria-label="Dismiss notification"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationCenter;
