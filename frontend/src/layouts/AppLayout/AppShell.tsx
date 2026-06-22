import React, { useEffect } from "react";
import { useLayoutStore } from "../../store/layoutStore";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell is the root component wrapping the application.
 * It coordinates global hotkeys (like Ctrl+K for search) and
 * implements error boundaries to prevent app crashes.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useLayoutStore();

  // Handle global keybindings
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // Toggle Command Palette (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  return (
    <ErrorBoundary>
      <div className="antialiased selection:bg-blue-500/30 selection:text-blue-900 dark:selection:text-blue-200">
        {children}
      </div>
    </ErrorBoundary>
  );
};

export default AppShell;
