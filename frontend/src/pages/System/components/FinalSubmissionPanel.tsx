import React, { useState, useEffect } from "react";
import { CheckSquare, Square, Package, FileText, Video, Github, ShieldCheck } from "lucide-react";

interface SubmissionItem {
  id: string;
  label: string;
  description: string;
  category: "Assets" | "Docs" | "Code";
  icon: React.ReactNode;
}

export const FinalSubmissionPanel: React.FC = () => {
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("antigravity-submission-checks");
    return saved ? JSON.parse(saved) : ["sub-1", "sub-2", "sub-4"];
  });

  useEffect(() => {
    localStorage.setItem("antigravity-submission-checks", JSON.stringify(checkedIds));
  }, [checkedIds]);

  const items: SubmissionItem[] = [
    {
      id: "sub-1",
      label: "GitHub Source Code Repository",
      description: "Production-ready build, sanitised commit log, secrets externalised.",
      category: "Code",
      icon: <Github size={12} className="text-slate-800 dark:text-slate-200" />
    },
    {
      id: "sub-2",
      label: "System Readme & Installation Guide",
      description: "Step-by-step setup guides for frontend and vector indexing backends.",
      category: "Docs",
      icon: <FileText size={12} className="text-blue-500" />
    },
    {
      id: "sub-3",
      label: "Architecture & Dataflow Diagrams",
      description: "Visual schema detailing local vector database matching pipelines.",
      category: "Docs",
      icon: <Package size={12} className="text-purple-500" />
    },
    {
      id: "sub-4",
      label: "Diagnostic Verification Reports",
      description: "Automated test suites logs verifying WCAG compliance and bundle sizes.",
      category: "Code",
      icon: <ShieldCheck size={12} className="text-emerald-500" />
    },
    {
      id: "sub-5",
      label: "Cinematic Demo Pitch Video",
      description: "4-minute showcase demonstrating auto-play walkthrough and system alerts.",
      category: "Assets",
      icon: <Video size={12} className="text-rose-500" />
    },
  ];

  const toggleItem = (id: string) => {
    setCheckedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const progress = Math.round((checkedIds.length / items.length) * 100);

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Package size={16} className="text-purple-500 animate-pulse" />
          <span>Deliverables Packager</span>
        </h3>
        <span className="text-[10px] font-black font-mono text-purple-650 dark:text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2.5 py-0.5 rounded-full">
          {progress}% Ready
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-purple-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const isChecked = checkedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="flex gap-3.5 p-3 rounded-xl border border-slate-250/20 dark:border-slate-805 bg-slate-200/20 dark:bg-slate-950/25 cursor-pointer select-none hover:bg-slate-200/40 dark:hover:bg-slate-950/45 transition-all duration-150"
            >
              <div className="pt-0.5 shrink-0 transition-transform duration-250 hover:scale-110">
                {isChecked ? (
                  <CheckSquare size={16} className="text-purple-500 fill-purple-500/10" />
                ) : (
                  <Square size={16} className="text-slate-400 dark:text-slate-600" />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className={`text-[11px] font-bold transition-colors ${isChecked ? "text-slate-850 dark:text-slate-200" : "text-slate-500 dark:text-slate-500"}`}>
                    {item.label}
                  </span>
                  <span className="text-[7px] font-extrabold uppercase px-1 rounded border border-slate-350 dark:border-slate-805 text-slate-550 dark:text-slate-500">
                    {item.category}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 dark:text-slate-500 mt-1 leading-normal">
                  {item.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FinalSubmissionPanel;
