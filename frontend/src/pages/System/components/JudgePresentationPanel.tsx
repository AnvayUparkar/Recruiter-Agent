import React from "react";
import { useNavigate } from "react-router-dom";
import { Play, Compass, Award, ArrowRight } from "lucide-react";

interface PresentationTrack {
  step: number;
  name: string;
  description: string;
  route: string;
  duration: string;
  focus: string;
}

export const JudgePresentationPanel: React.FC = () => {
  const navigate = useNavigate();

  const tracks: PresentationTrack[] = [
    {
      step: 1,
      name: "Interactive Scenario Showcase",
      description: "Auto-pilot demo experience loading preset hiring scenarios.",
      route: "/demo",
      duration: "2 min",
      focus: "Cinematic Tour"
    },
    {
      step: 2,
      name: "Job Description Parser",
      description: "AI-powered skill extraction and keyword profiling.",
      route: "/jd-analysis",
      duration: "1.5 min",
      focus: "Skills Engine"
    },
    {
      step: 3,
      name: "Candidate Ranking Board",
      description: "Real-time vector rankings, matching, and semantic matching.",
      route: "/dashboard",
      duration: "2 min",
      focus: "Vector Search"
    },
    {
      step: 4,
      name: "Recruiter AI Copilot",
      description: "Natural language query interface filtering candidates.",
      route: "/copilot",
      duration: "1.5 min",
      focus: "Llama Index"
    },
    {
      step: 5,
      name: "Head-to-Head Comparison",
      description: "Visual skill grids comparing selected finalists side-by-side.",
      route: "/comparison",
      duration: "1 min",
      focus: "Visual Diff"
    },
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Compass size={16} className="text-blue-500" />
          <span>Judge Presentation Suite</span>
        </h3>
        <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-blue-500/10 border border-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full">
          <Award size={10} className="text-blue-500" />
          <span>Interactive Showcase</span>
        </span>
      </div>

      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Recommended presentation flow for judges and recruiters. Click any step to immediately teleport to that phase of the evaluation.
      </p>

      <div className="flex flex-col gap-3">
        {tracks.map((track) => (
          <div
            key={track.step}
            onClick={() => navigate(track.route)}
            className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-250/20 dark:border-slate-805 bg-slate-200/25 dark:bg-slate-950/20 hover:bg-slate-200/50 dark:hover:bg-slate-950/50 hover:border-blue-500/30 dark:hover:border-blue-500/30 cursor-pointer transition-all duration-200 active:scale-[0.99]"
          >
            <div className="flex gap-3 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-600/10 dark:bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-600 dark:text-blue-450 shrink-0">
                {track.step}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                  {track.name}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5 truncate leading-relaxed">
                  {track.description}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-4">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-bold text-slate-550 dark:text-slate-400">
                  {track.duration}
                </span>
                <span className="text-[7px] font-black uppercase text-blue-650 dark:text-blue-400 tracking-wider">
                  {track.focus}
                </span>
              </div>
              <ArrowRight size={12} className="text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-500 transition-all" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-colors">
        <button
          onClick={() => navigate("/demo")}
          className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-350 hover:text-slate-800 dark:hover:text-slate-200 transition-colors outline-none focus-ring"
        >
          <Play size={12} fill="currentColor" className="text-emerald-500 animate-pulse" />
          <span>Launch Autoplay Guided Demo Presentation Mode</span>
        </button>
      </div>
    </div>
  );
};

export default JudgePresentationPanel;
