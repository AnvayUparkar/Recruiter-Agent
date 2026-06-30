import React, { useState } from "react";

import { ApplicantCard } from "./ApplicantCard";

interface PipelineBoardProps {
  applicants: any[];
  stages: string[];
  onStageChange: (candidateId: string, newStage: string) => void;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({ applicants, stages, onStageChange }) => {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId);
    e.dataTransfer.setData("text/plain", appId);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("text/plain");
    if (appId) {
      onStageChange(appId, stage);
    }
    setDraggedAppId(null);
  };

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 snap-x">
      {stages.map((stage) => {
        const stageApplicants = applicants.filter(
          (a) => (a.application_status || "Applied") === stage
        );

        return (
          <div 
            key={stage} 
            className="flex-shrink-0 w-80 flex flex-col snap-start"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider flex items-center gap-2">
                {stage}
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-0.5 px-2 rounded-full text-xs">
                  {stageApplicants.length}
                </span>
              </h3>
            </div>
            
            {/* Drop Zone */}
            <div className="flex-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-3 overflow-y-auto border border-transparent transition-colors hover:border-blue-500/20">
              <div className="space-y-3 min-h-[50px]">
                {stageApplicants.map((app) => (
                  <div
                    key={app.candidate_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.candidate_id)}
                    className={`cursor-grab active:cursor-grabbing ${draggedAppId === app.candidate_id ? 'opacity-50' : ''}`}
                  >
                    <ApplicantCard applicant={app} viewMode="kanban" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
