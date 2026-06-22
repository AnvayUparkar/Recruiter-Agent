import React from "react";
import { LandingHero } from "./LandingHero";
import { FeatureSection } from "./FeatureSection";
import { WorkflowSection } from "./WorkflowSection";
import { DemoPreview } from "./DemoPreview";
import { MetricsSection } from "./MetricsSection";
import { WhySection } from "./WhySection";
import { CTASection } from "./CTASection";
import { FooterSection } from "./FooterSection";

export const LandingPage: React.FC = () => {
  return (
    <div className="relative w-full overflow-x-hidden min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-blue-500/20 selection:text-blue-900 dark:selection:text-blue-200">
      
      {/* Immersive Background Decorative Layers */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft glowing neon background blobs */}
        <div className="absolute top-[10%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 blur-[130px] animate-pulse duration-[8000ms]" />
        <div className="absolute top-[45%] right-[-15%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-purple-500/10 to-emerald-500/5 blur-[130px] animate-pulse duration-[9000ms]" />
        <div className="absolute bottom-[5%] left-[5%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-tr from-blue-600/5 to-teal-500/10 blur-[120px] animate-pulse duration-[7000ms]" />
      </div>

      {/* Landing Viewport Content Sections */}
      <div className="w-full relative z-10 flex flex-col flex-1">
        {/* 1. Hero Experience (Full height) */}
        <LandingHero />

        {/* 2. Feature Spotlight Cards */}
        <FeatureSection />

        {/* 3. Steps Workflow Timeline */}
        <WorkflowSection />

        {/* 4. Mini Dashboard Live Preview */}
        <DemoPreview />

        {/* 5. Metrics Counters */}
        <MetricsSection />

        {/* 6. Strategic Why It's Different comparison */}
        <WhySection />

        {/* 7. Final Conversion Call-to-action */}
        <CTASection />

        {/* 8. Landing Page Footer */}
        <FooterSection />
      </div>
    </div>
  );
};

export default LandingPage;
