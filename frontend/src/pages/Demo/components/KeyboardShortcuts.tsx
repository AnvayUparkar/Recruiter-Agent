import React, { useEffect } from "react";
import { HelpCircle, Keyboard, X } from "lucide-react";
import { useDemoStore } from "../../../store/demoStore";
import { motion, AnimatePresence } from "framer-motion";

export const KeyboardShortcuts: React.FC = () => {
  const {
    isPlaying,
    showHelp,
    nextStep,
    prevStep,
    setPlaying,
    exitDemo,
    toggleHelp
  } = useDemoStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in inputs or textareas
      const activeEl = document.activeElement?.tagName.toLowerCase();
      if (activeEl === "input" || activeEl === "textarea" || document.activeElement?.getAttribute("contenteditable") === "true") {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          nextStep();
          break;
        case "b":
          e.preventDefault();
          prevStep();
          break;
        case "p":
          e.preventDefault();
          setPlaying(!isPlaying);
          break;
        case "escape":
          e.preventDefault();
          exitDemo();
          break;
        case "?":
        case "/":
          e.preventDefault();
          toggleHelp();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, nextStep, prevStep, setPlaying, exitDemo, toggleHelp]);

  const shortcutsList = [
    { key: "N", description: "Advance to Next Stage" },
    { key: "B", description: "Return to Previous Stage" },
    { key: "P", description: "Play / Pause Autoplay Loop" },
    { key: "Esc", description: "Exit Guided Tour" },
    { key: "?", description: "Toggle Shortcuts Helper Legend" },
  ];

  return (
    <>
      {/* Floating help indicator bubble */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={toggleHelp}
          className="w-10 h-10 rounded-full bg-slate-900/90 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors shadow-lg outline-none focus-ring"
          title="Keyboard Shortcuts Guide (?)"
          aria-label="Toggle keyboard shortcuts menu"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Help Modal Overlay */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              onClick={toggleHelp}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel p-6 rounded-3xl border border-slate-200/10 dark:border-slate-800/80 shadow-2xl w-full max-w-sm relative z-10 space-y-5 bg-slate-950/90 backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200/10 dark:border-slate-800/50 pb-3">
                <div className="flex items-center gap-2 text-blue-500">
                  <Keyboard size={18} />
                  <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 font-sans tracking-wide">
                    Keyboard Hotkeys Guide
                  </span>
                </div>
                <button
                  onClick={toggleHelp}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                  aria-label="Close shortcuts help"
                >
                  <X size={16} />
                </button>
              </div>

              {/* List */}
              <div className="space-y-3.5">
                {shortcutsList.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 font-medium">{item.description}</span>
                    <kbd className="px-2.5 py-1 bg-slate-900/60 dark:bg-slate-950/80 border border-slate-200/10 dark:border-slate-800/80 rounded-lg text-[10px] text-blue-500 font-mono shadow-sm tracking-wider font-extrabold select-none">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KeyboardShortcuts;
