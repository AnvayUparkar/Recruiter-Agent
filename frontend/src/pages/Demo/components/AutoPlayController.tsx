import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useDemoStore } from "../../../store/demoStore";

interface AutoPlayControllerProps {
  countdownPercent: number; // 0 to 100 representing countdown timer progress
}

export const AutoPlayController: React.FC<AutoPlayControllerProps> = ({ countdownPercent }) => {
  const { isPlaying, playbackSpeed, setPlaying, setSpeed, jumpToStep } = useDemoStore();

  return (
    <div className="flex items-center gap-4 bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur border border-slate-200/10 dark:border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-xl select-none">
      {/* Ticker circular countdown indicator */}
      {isPlaying && (
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="2"
              fill="transparent"
            />
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="#3b82f6"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray={Math.PI * 2 * 8}
              strokeDashoffset={Math.PI * 2 * 8 * (1 - countdownPercent / 100)}
              className="transition-all duration-100 ease-linear"
            />
          </svg>
        </div>
      )}

      {/* Play / Pause */}
      <button
        onClick={() => setPlaying(!isPlaying)}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors outline-none focus-ring ${
          isPlaying ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-850 hover:bg-slate-800 text-slate-200"
        }`}
        aria-label={isPlaying ? "Pause autoplay" : "Start autoplay"}
      >
        {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
      </button>

      {/* Speed Controls */}
      <div className="flex bg-slate-850 rounded-lg p-0.5 border border-slate-200/5">
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wide transition-all ${
              playbackSpeed === s
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-slate-800 shrink-0" />

      {/* Replay */}
      <button
        onClick={() => {
          jumpToStep(0);
          setPlaying(true);
        }}
        className="p-1.5 hover:bg-slate-500/10 rounded-lg text-slate-400 hover:text-slate-250 transition-colors outline-none"
        title="Restart presentation tour"
        aria-label="Restart tour"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
};

export default AutoPlayController;
