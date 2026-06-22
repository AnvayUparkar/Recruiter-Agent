import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { usePWAStore } from "../../store/pwaStore";
import { useToastStore } from "../../store/toastStore";

export const OfflineStatusBanner: React.FC = () => {
  const { isOnline, syncQueue, removeQueuedNote } = usePWAStore();
  const toastStore = useToastStore();
  const shouldReduceMotion = useReducedMotion();
  const [showRestored, setShowRestored] = useState(false);

  // Monitor online status transitions to show temporary "Restored" indicator
  useEffect(() => {
    if (isOnline) {
      // Sync queue items if any notes are stored
      if (syncQueue.length > 0) {
        setShowRestored(true);
        toastStore.info(`Syncing ${syncQueue.length} queued note(s) offline...`);
        
        // Mock syncing notes back to the backend
        setTimeout(() => {
          syncQueue.forEach((note) => {
            console.log(`[Offline Sync] Sending queued note for candidate ${note.candidateId}:`, note.noteText);
            removeQueuedNote(note.id);
          });
          toastStore.success("Recruiter database sync completed successfully!");
          setTimeout(() => setShowRestored(false), 3000);
        }, 1500);
      } else {
        // Just show online confirmation for a brief second if it transitioned
        setShowRestored(true);
        const timer = setTimeout(() => setShowRestored(false), 2000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowRestored(false);
      toastStore.warning("You are currently offline. Viewing cached recruiter profiles.");
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {/* Offline Alert Banner */}
      {!isOnline && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { y: -50, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed top-0 left-0 right-0 z-[10000] bg-rose-500 text-white py-2 px-6 shadow-lg flex items-center justify-center gap-3 text-xs font-semibold tracking-wide"
        >
          <WifiOff size={15} className="animate-pulse" />
          <span>You are offline. Viewing cached recruiter insights & profiles.</span>
          {syncQueue.length > 0 && (
            <span className="px-2 py-0.5 rounded bg-rose-700 text-[10px] font-bold">
              {syncQueue.length} notes queued
            </span>
          )}
        </motion.div>
      )}

      {/* Connection Restored Success Banner */}
      {isOnline && showRestored && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { y: -50, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed top-0 left-0 right-0 z-[10000] bg-emerald-500 text-white py-2 px-6 shadow-lg flex items-center justify-center gap-3 text-xs font-semibold tracking-wide"
        >
          {syncQueue.length > 0 ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Network restored. Synchronizing recruiter notes...</span>
            </>
          ) : (
            <>
              <Wifi size={15} />
              <span>Back online! Synchronized with live database.</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineStatusBanner;
