import React, { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { StickyNote, Trash2, Save } from "lucide-react";

interface RecruiterNotesProps {
  candidateId: string;
}

const STORAGE_KEY = (id: string) => `recruiter_notes_${id}`;

const RecruiterNotes: React.FC<RecruiterNotesProps> = ({ candidateId }) => {
  const [notes, setNotes] = React.useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY(candidateId)) ?? "";
    } catch {
      return "";
    }
  });
  const [saved, setSaved] = React.useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save after 800ms of inactivity
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setNotes(val);
      setSaved(false);

      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY(candidateId), val);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } catch {
          // storage quota exceeded
        }
      }, 800);
    },
    [candidateId]
  );

  const handleClear = () => {
    setNotes("");
    try {
      localStorage.removeItem(STORAGE_KEY(candidateId));
    } catch {
      /* noop */
    }
  };

  const handleSaveNow = () => {
    try {
      localStorage.setItem(STORAGE_KEY(candidateId), notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* noop */
    }
  };

  // Cleanup timer on unmount
  useEffect(
    () => () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    },
    []
  );

  const charCount = notes.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.35 }}
      className="rounded-2xl border border-slate-200/20 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200/40 dark:border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <StickyNote size={14} className="text-amber-500 dark:text-amber-400" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Recruiter Notes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold"
            >
              Saved ✓
            </motion.span>
          )}
          <button
            onClick={handleSaveNow}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/8 bg-slate-100 dark:bg-white/4 hover:bg-slate-200 dark:hover:bg-white/8 text-[11px] font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all"
            aria-label="Save notes"
          >
            <Save size={11} />
            Save
          </button>
          {notes.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-500/20 bg-rose-500/8 hover:bg-rose-500/15 text-[11px] font-semibold text-rose-600 dark:text-rose-400 transition-all"
              aria-label="Clear notes"
            >
              <Trash2 size={11} />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col gap-2">
        <textarea
          id={`recruiter-notes-${candidateId}`}
          value={notes}
          onChange={handleChange}
          placeholder="Add private recruiter notes about this candidate…&#10;&#10;• Assessment impressions&#10;• Red flags to investigate&#10;• Compensation expectations&#10;• Interview scheduling notes"
          className="w-full min-h-[180px] bg-white dark:bg-white/2 border border-slate-300 dark:border-white/6 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-300 placeholder-slate-500 dark:placeholder-slate-600 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-colors leading-relaxed font-sans"
          spellCheck
        />
        <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-600">
          <span>Auto-saves to local storage</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </motion.div>
  );
};

export default RecruiterNotes;
