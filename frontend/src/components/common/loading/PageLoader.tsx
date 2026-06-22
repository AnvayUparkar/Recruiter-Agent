import React from "react";

export const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
      <div className="relative w-12 h-12">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
        {/* Spin Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
      <p className="text-sm text-slate-400 font-medium tracking-wide animate-pulse">
        Retrieving Recruiter Intelligence...
      </p>
    </div>
  );
};

export default PageLoader;
