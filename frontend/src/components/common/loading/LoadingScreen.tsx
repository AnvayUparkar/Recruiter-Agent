import React from "react";
import PageLoader from "./PageLoader";

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 p-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          {/* LinkedIn premium-like style badge indicator */}
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            LINKEDIN CO-PILOT
          </span>
        </div>
        
        <PageLoader />
        
        <div className="text-xs text-slate-500 mt-4 font-mono select-none">
          Talent Intelligence Platform • Phase 16 Ready
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
