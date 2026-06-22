import React from "react";
import { Code2, BrainCircuit, MonitorPlay, Database, Briefcase, HeartHandshake } from "lucide-react";
import { useDemoStore, DemoScenario } from "../../../store/demoStore";

interface ScenarioCard {
  id: DemoScenario;
  label: string;
  tags: string[];
  icon: React.ComponentType<{ className?: string; size?: number }>;
  summary: string;
}

export const DemoScenarioSelector: React.FC = () => {
  const { scenario: activeScenario, setScenario } = useDemoStore();

  const scenarios: ScenarioCard[] = [
    {
      id: "swe",
      label: "Software Engineer",
      tags: ["Python", "Docker", "Backend"],
      icon: Code2,
      summary: "Evaluates algorithms architecture, API scaling, and database indexing checks.",
    },
    {
      id: "ai_research",
      label: "AI Researcher",
      tags: ["PyTorch", "RAG", "LLMs"],
      icon: BrainCircuit,
      summary: "Filters vector pipelines, neural layer scaling, and model weights calibrations.",
    },
    {
      id: "frontend",
      label: "Frontend Developer",
      tags: ["React", "CSS", "Vite"],
      icon: MonitorPlay,
      summary: "Validates visual design layers, state persistence, and responsive UI matrices.",
    },
    {
      id: "data_science",
      label: "Data Scientist",
      tags: ["Pandas", "Scikit", "SQL"],
      icon: Database,
      summary: "Checks predictive modeling heuristics and data processing pipelines.",
    },
    {
      id: "product_manager",
      label: "Product Manager",
      tags: ["Roadmaps", "Agile", "PRDs"],
      icon: Briefcase,
      summary: "Analyzes product telemetry maps, feature flows, and system delivery metrics.",
    },
    {
      id: "healthcare",
      label: "Healthcare AI",
      tags: ["HIPAA", "Imaging", "CNNs"],
      icon: HeartHandshake,
      summary: "Reviews high compliance medical datasets and signal analysis protocols.",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left select-none">
      {scenarios.map((sc) => {
        const Icon = sc.icon;
        const isActive = activeScenario === sc.id;

        return (
          <button
            key={sc.id}
            onClick={() => setScenario(sc.id)}
            className={`p-4 rounded-2xl border transition-all text-xs flex flex-col justify-between h-[150px] group text-left outline-none ${
              isActive
                ? "bg-blue-600/10 border-blue-500 shadow-md shadow-blue-600/10"
                : "bg-slate-900/40 border-slate-200/5 hover:border-slate-800/80 hover:bg-slate-900/60"
            }`}
            aria-selected={isActive}
            role="radio"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${
                  isActive ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-slate-800/50 border-slate-200/5 text-slate-400 group-hover:text-slate-200"
                }`}>
                  <Icon size={16} />
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                  {sc.tags.slice(0, 2).map(t => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[8px] bg-slate-500/10 text-slate-400 font-bold border border-slate-200/5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-slate-200">
                {sc.label}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
              {sc.summary}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default DemoScenarioSelector;
