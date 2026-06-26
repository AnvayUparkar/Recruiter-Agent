import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, ArrowLeft } from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import { ChatWindow } from "../../components/chat/ChatWindow";
import { apiClient } from "../../api/client";

export default function RealTimeCandidatesPage() {
  const { socket, isConnected } = useSocket();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  const formatExperience = (expData: any) => {
    if (!expData) return "N/A";
    if (typeof expData === 'string') return expData;
    if (Array.isArray(expData) && expData.length > 0) {
      const firstExp = expData[0];
      return firstExp.title || firstExp.role || firstExp.company || "Experienced";
    }
    return "N/A";
  };

  // Fetch initial candidates from DB
  useEffect(() => {
    apiClient.get("/api/v1/user/candidates")
      .then(res => {
        const data = res.data;
        if (data.candidates) {
          const initialCandidates = data.candidates.map((c: any) => ({
            id: c.candidate_id,
            name: c.resume_data?.name || "Unknown",
            role: "Applicant",
            experience: formatExperience(c.resume_data?.experience),
            location: "Remote",
            skills: Array.isArray(c.resume_data?.skills) ? c.resume_data.skills : [],
            timestamp: new Date().toISOString(),
            score: Math.floor(Math.random() * 40) + 60,
          }));
          setCandidates(initialCandidates);
        }
      })
      .catch(err => console.error("Failed to fetch initial candidates", err));
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for new candidate events
    socket.on("new_candidate", (data: any) => {
      console.log("New candidate received in real-time:", data);
      
      const newCandidate = {
        id: data.candidate_id,
        name: data.resume_data?.name || "Unknown",
        role: "Applicant",
        experience: formatExperience(data.resume_data?.experience),
        location: "Remote", // Defaulting for demo
        skills: Array.isArray(data.resume_data?.skills) ? data.resume_data.skills : [],
        timestamp: new Date().toISOString(),
        score: Math.floor(Math.random() * 40) + 60, // Mock score for demo
      };
      
      setCandidates(prev => {
        if (prev.some(c => c.id === newCandidate.id)) {
          return prev.map(c => c.id === newCandidate.id ? { ...c, ...newCandidate } : c);
        }
        return [newCandidate, ...prev];
      });
    });

    return () => {
      socket.off("new_candidate");
    };
  }, [socket]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {selectedCandidate && (
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-500" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {selectedCandidate ? `Chat with ${selectedCandidate.name}` : "Real-Time Candidates"}
            </h1>
            {!selectedCandidate && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isConnected ? 'Live Connected' : 'Connecting...'}
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selectedCandidate 
              ? "Instantly message this candidate about an open position."
              : "Watch candidates appear instantly as they apply or upload resumes."}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedCandidate ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-[600px]"
        >
          <ChatWindow 
            conversationId="default-demo-convo"
            receiverId={selectedCandidate.id}
            receiverName={selectedCandidate.name}
            receiverRole={selectedCandidate.role}
          />
        </motion.div>
      ) : (
      <div className="space-y-4">
        <AnimatePresence>
          {candidates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-slate-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Waiting for Candidates</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Keep this window open. New candidates will appear here instantly when they upload their resume.
              </p>
            </motion.div>
          ) : (
            candidates.map((cand) => (
              <motion.div
                key={cand.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{cand.name}</h3>
                    <p className="text-sm text-slate-500 mb-3">{cand.role} • {cand.experience}</p>
                    <div className="flex flex-wrap gap-2">
                      {cand.skills.slice(0, 5).map((skill: any, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-semibold">
                          {typeof skill === 'string' ? skill : (skill.name || skill.title || "Skill")}
                        </span>
                      ))}
                      {cand.skills.length > 5 && (
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold">
                          +{cand.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{cand.score}% Match</div>
                      <div className="text-xs text-slate-400">AI Score</div>
                    </div>
                    <button 
                      onClick={() => setSelectedCandidate(cand)}
                      className="p-2 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-500/20 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                    >
                      <MessageCircle size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}
