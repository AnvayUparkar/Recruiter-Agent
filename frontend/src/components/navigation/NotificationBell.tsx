import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bell, Check, Trash2, AlertCircle, Calendar, ShieldCheck, Sparkles } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "success" | "warning" | "ai";
  isRead: boolean;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Calibration Analysis Complete",
    message: "Candidate leaderboard updated for Senior Machine Learning Engineer role.",
    time: "5m ago",
    type: "ai",
    isRead: false,
  },
  {
    id: "2",
    title: "New Talent Profiles Calibrated",
    message: "3 new resumes successfully parsed and indexed into the talent pool.",
    time: "20m ago",
    type: "success",
    isRead: false,
  },
  {
    id: "3",
    title: "API Gateway Re-synchronized",
    message: "FAISS vector database sync completed successfully on local port.",
    time: "1h ago",
    type: "info",
    isRead: true,
  },
  {
    id: "4",
    title: "Weight Overrides Warning",
    message: "Calibration weights currently sum to 90%. Adjust settings to ensure standard distribution.",
    time: "2h ago",
    type: "warning",
    isRead: true,
  },
];

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard Escape to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const getTypeIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "ai":
        return <Sparkles size={14} className="text-purple-500" />;
      case "success":
        return <ShieldCheck size={14} className="text-emerald-500" />;
      case "warning":
        return <AlertCircle size={14} className="text-amber-500" />;
      default:
        return <Calendar size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl border border-slate-200/10 dark:border-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-650 dark:text-slate-400 transition-all duration-300 relative focus-ring outline-none
          ${isOpen ? "bg-slate-200/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100" : ""}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Open notifications menu. ${unreadCount} unread items.`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-blue-600 dark:bg-blue-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel shadow-2xl rounded-2xl border border-slate-250/20 dark:border-slate-800/60 overflow-hidden z-50 focus-ring"
            role="dialog"
            aria-modal="true"
          >
            {/* Dropdown Header */}
            <div className="p-4 border-b border-slate-200/10 dark:border-slate-800/50 flex justify-between items-center bg-slate-200/30 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Notification Center
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[9px] font-black tracking-wide rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllRead}
                      className="text-[10px] text-blue-500 hover:text-blue-400 font-bold transition-colors flex items-center gap-0.5 outline-none focus:underline"
                      title="Mark all as read"
                    >
                      <Check size={11} />
                      <span>All Read</span>
                    </button>
                    <button
                      onClick={clearAll}
                      className="text-[10px] text-rose-500 hover:text-rose-455 font-bold transition-colors flex items-center gap-0.5 outline-none focus:underline"
                      title="Clear all"
                    >
                      <Trash2 size={11} />
                      <span>Clear</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-250/10 dark:divide-slate-800/30">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 hover:bg-slate-200/20 dark:hover:bg-slate-800/10 transition-colors flex gap-3 relative group
                      ${!n.isRead ? "bg-blue-500/5 dark:bg-blue-500/3" : ""}`}
                  >
                    {/* Read indicator line */}
                    {!n.isRead && (
                      <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 dark:bg-blue-400" />
                    )}

                    {/* Icon Column */}
                    <div className="w-7 h-7 rounded-lg bg-slate-200/50 dark:bg-slate-900 flex items-center justify-center border border-slate-300/10 shrink-0">
                      {getTypeIcon(n.type)}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex justify-between items-start gap-1">
                        <span className={`text-xs font-semibold truncate text-slate-900 dark:text-slate-100
                          ${!n.isRead ? "font-bold" : ""}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                        {n.message}
                      </p>
                    </div>

                    {/* Actions Column */}
                    <button
                      onClick={() => toggleRead(n.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 self-center transition-all outline-none focus:opacity-100"
                      title={n.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      <Check size={12} className={n.isRead ? "text-slate-400" : "text-blue-500"} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 px-4 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                  <Bell size={28} className="text-slate-300 dark:text-slate-700 animate-pulse" />
                  <span className="text-xs font-semibold">You're all caught up!</span>
                  <span className="text-[11px] text-slate-400">No new alerts to review.</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
