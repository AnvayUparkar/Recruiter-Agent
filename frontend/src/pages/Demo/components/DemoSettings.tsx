import React from "react";
import { Settings, Eye, FastForward } from "lucide-react";
import { useDemoStore } from "../../../store/demoStore";

export const DemoSettings: React.FC = () => {
  const {
    playbackSpeed,
    judgeMode,
    reducedMotion,
    setSpeed,
    setJudgeMode,
    setReducedMotion,
  } = useDemoStore();

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200/10 dark:border-slate-800/80 shadow-xl space-y-5 max-w-xs select-none">
      <div className="flex items-center gap-2">
        <Settings className="text-blue-500" size={16} />
        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 font-sans">
          Demo Configurations
        </span>
      </div>

      <div className="space-y-4 text-xs font-semibold">
        {/* Speed */}
        <div className="space-y-2">
          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
            <FastForward size={12} />
            Autoplay Interval Speed
          </label>
          <div className="flex bg-slate-900/50 dark:bg-slate-950/60 rounded-xl p-0.5 border border-slate-200/10 dark:border-slate-850">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all outline-none ${
                  playbackSpeed === s
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-450 hover:text-slate-200"
                }`}
              >
                {s}x Speed
              </button>
            ))}
          </div>
        </div>

        {/* Judge Mode toggle */}
        <div className="flex items-center justify-between p-2 bg-slate-500/5 border border-slate-200/5 rounded-xl">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-700 dark:text-slate-250 block">Architecture Explanations</span>
            <span className="text-[8px] text-slate-500 block leading-none">Show technical blueprints card overlays</span>
          </div>
          <button
            onClick={() => setJudgeMode(!judgeMode)}
            className={`w-9 h-5 rounded-full transition-colors duration-250 p-0.5 flex outline-none relative shrink-0 ${
              judgeMode ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
            }`}
            aria-label="Toggle architecture notes"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 shadow-sm ${
                judgeMode ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Reduce Animations */}
        <div className="flex items-center justify-between p-2 bg-slate-500/5 border border-slate-200/5 rounded-xl">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-700 dark:text-slate-250 block">Reduce Animations</span>
            <span className="text-[8px] text-slate-500 block leading-none">Switches off coordinate transitions spring easing</span>
          </div>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`w-9 h-5 rounded-full transition-colors duration-250 p-0.5 flex outline-none relative shrink-0 ${
              reducedMotion ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
            }`}
            aria-label="Toggle reduced animations"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 shadow-sm ${
                reducedMotion ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Voice Narration placeholder */}
        <div className="flex items-center justify-between p-2 bg-slate-500/5 border border-slate-200/5 rounded-xl opacity-50">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-750 dark:text-slate-350 block flex items-center gap-1.5">
              <Eye size={12} className="text-slate-500" />
              Voice Narration (Narrator)
            </span>
            <span className="text-[8px] text-slate-500 block leading-none">Synthesizes tooltips explanations orally</span>
          </div>
          <span className="text-[8px] font-black uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">Disabled</span>
        </div>
      </div>
    </div>
  );
};

export default DemoSettings;
