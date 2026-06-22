import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDemoStore } from "../../../store/demoStore";

import HighlightOverlay from "./HighlightOverlay";
import FeatureCallout from "./FeatureCallout";
import DemoProgressBar from "./DemoProgressBar";
import AutoPlayController from "./AutoPlayController";
import TourNavigation from "./TourNavigation";
import KeyboardShortcuts from "./KeyboardShortcuts";
import DemoCelebration from "./DemoCelebration";

export const GuidedTour: React.FC = () => {
  const {
    demoActive,
    currentStep,
    steps,
    isPlaying,
    playbackSpeed,
    isCompleted,
    nextStep,
  } = useDemoStore();

  const location = useLocation();
  const navigate = useNavigate();

  // Autoplay countdown timer states
  const [timerProgress, setTimerProgress] = useState(0);

  // 1. Sync active route with the current tour step route
  useEffect(() => {
    if (!demoActive || isCompleted) return;

    const activeStep = steps[currentStep];
    if (activeStep && location.pathname !== activeStep.route) {
      // Navigate to target route
      navigate(activeStep.route);
    }
  }, [demoActive, currentStep, steps, navigate, location.pathname, isCompleted]);

  // 2. Autoplay Loop timer ticking
  useEffect(() => {
    if (!demoActive || !isPlaying || isCompleted) {
      setTimerProgress(0);
      return;
    }

    const baseDurationMs = 6500; // base step delay: 6.5s
    const totalDuration = baseDurationMs / playbackSpeed;
    const intervalMs = 100;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += intervalMs;
      const progress = (elapsed / totalDuration) * 100;
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimerProgress(0);
        nextStep();
      } else {
        setTimerProgress(progress);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [demoActive, isPlaying, currentStep, playbackSpeed, nextStep, isCompleted]);

  // If tour is inactive or completed, do not render overlay layout
  if (!demoActive) {
    if (isCompleted) {
      // Confetti drops on completion even if demoActive toggles false
      return <DemoCelebration />;
    }
    return null;
  }

  const activeStep = steps[currentStep];
  if (!activeStep) return null;

  // Render overlay elements only if current route matches active step route (prevents visual alignment jumps during navigations)
  const isCorrectRoute = location.pathname === activeStep.route;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none font-sans">
      {/* Keyboard listener and bubble trigger */}
      <KeyboardShortcuts />

      {/* Confetti if completed */}
      {isCompleted && <DemoCelebration />}

      {isCorrectRoute && (
        <>
          {/* Top Progress bar HUD */}
          <DemoProgressBar />

          {/* svg cut-out dimming spotlight mask */}
          <HighlightOverlay selector={activeStep.selector} />

          {/* Floating explanations tooltip */}
          <div className="pointer-events-auto select-text">
            <FeatureCallout step={activeStep} totalSteps={steps.length} />
          </div>

          {/* Autoplay & Tour controls dock (bottom center) */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pointer-events-auto select-text">
            <TourNavigation />
            <AutoPlayController countdownPercent={timerProgress} />
          </div>
        </>
      )}
    </div>
  );
};

export default GuidedTour;
