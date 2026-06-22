import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoStore } from "../../store/demoStore";

import DemoWelcome from "./components/DemoWelcome";
import DemoCompletionScreen from "./components/DemoCompletionScreen";

export const DemoPage: React.FC = () => {
  const { demoActive, isCompleted, steps } = useDemoStore();
  const navigate = useNavigate();

  // If tour starts, immediately redirect the user to the start stage path
  useEffect(() => {
    if (demoActive && !isCompleted) {
      const startPath = steps[0]?.route || "/";
      navigate(startPath);
    }
  }, [demoActive, isCompleted, steps, navigate]);

  if (isCompleted) {
    return <DemoCompletionScreen />;
  }

  // Welcome splash screen is rendered if tour is inactive
  return <DemoWelcome />;
};

export default DemoPage;
