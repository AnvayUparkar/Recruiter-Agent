import React from "react";
import { ApplicantCard } from "./ApplicantCard";

interface ApplicantListProps {
  applicants: any[];
  stages: string[];
  onStageChange: (candidateId: string, newStage: string) => void;
}

export const ApplicantList: React.FC<ApplicantListProps> = ({ applicants, stages, onStageChange }) => {
  if (applicants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <p>No applicants found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full pb-8">
      {applicants.map((app) => (
        <ApplicantCard 
          key={app.candidate_id} 
          applicant={app} 
          viewMode="list" 
          stages={stages}
          onStageChange={(newStage: string) => onStageChange(app.candidate_id, newStage)}
        />
      ))}
    </div>
  );
};
