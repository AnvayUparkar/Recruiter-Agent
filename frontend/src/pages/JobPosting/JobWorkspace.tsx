import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { jobService } from "../../services/jobService";
import { useSocket } from "../../hooks/useSocket";
import { 
  AnalyticsPanel, 
  PipelineBoard, 
  ApplicantList, 
  WorkspaceHeader 
} from "./components";

export type ViewMode = "kanban" | "list";
export const KANBAN_STAGES = ["Applied", "Under Review", "Screening", "Technical", "HR", "Offer", "Hired", "Rejected"];

export const JobWorkspace: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const fetchJobData = async () => {
    if (!jobId) return;
    try {
      setIsLoading(true);
      const [jobData, applicantsData] = await Promise.all([
        jobService.getJob(jobId),
        jobService.getJobCandidates(jobId)
      ]);
      setJob(jobData);
      setApplicants(applicantsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, [jobId]);

  useEffect(() => {
    if (socket && jobId) {
      socket.on("job_published", (data: any) => {
        if (data.job_id === jobId) {
          fetchJobData();
        }
      });
      return () => {
        socket.off("job_published");
      };
    }
  }, [socket, jobId]);

  const handleStageChange = async (candidateId: string, newStage: string) => {
    // Optimistic update
    setApplicants(prev => prev.map(app => 
      app.candidate_id === candidateId ? { ...app, application_status: newStage } : app
    ));
    
    if (jobId) {
      try {
        await jobService.updateApplicantStage(jobId, candidateId, newStage);
      } catch (e) {
        console.error("Failed to update stage:", e);
        // Revert on failure
        fetchJobData();
      }
    }
  };

  const filteredApplicants = useMemo(() => {
    let result = applicants;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.profile?.name?.toLowerCase().includes(q) || 
        a.profile?.headline?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [applicants, searchQuery]);

  if (isLoading && !job) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!job) {
    return <div className="p-8 text-center text-slate-500">Job not found</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <WorkspaceHeader 
        job={job} 
        onBack={() => navigate("/recruiter/jobs")}
        viewMode={viewMode}
        setViewMode={setViewMode}
        toggleAnalytics={() => setShowAnalytics(!showAnalytics)}
        isAnalyticsOpen={showAnalytics}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {viewMode === "kanban" ? (
              <motion.div 
                key="kanban"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full"
              >
                <PipelineBoard 
                  applicants={filteredApplicants} 
                  stages={KANBAN_STAGES}
                  onStageChange={handleStageChange}
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full"
              >
                <ApplicantList 
                  applicants={filteredApplicants} 
                  stages={KANBAN_STAGES}
                  onStageChange={handleStageChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analytics Slide Panel */}
        <AnimatePresence>
          {showAnalytics && (
            <AnalyticsPanel 
              jobId={jobId!} 
              onClose={() => setShowAnalytics(false)} 
              applicants={applicants}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JobWorkspace;
