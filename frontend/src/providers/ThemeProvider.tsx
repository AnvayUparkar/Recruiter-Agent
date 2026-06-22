import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  accentColor: string; // HEX code
  setAccentColor: (color: string) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to convert HEX to RGB string
function hexToRgb(hex: string): string | null {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return null;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r}, ${g}, ${b}`;
}

// Helper to create a hover shade (darkens/lightens hex)
function adjustColorBrightness(hex: string, percent: number): string {
  let num = parseInt(hex.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = ((num >> 8) & 0x00ff) + amt,
    B = (num & 0x0000ff) + amt;

  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("ui-theme");
    return (saved as ThemeMode) || "dark"; // Default to premium dark mode
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem("ui-accent-color") || "#4F7CFF"; // Electric Blue
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  const setTheme = (newTheme: ThemeMode) => {
    localStorage.setItem("ui-theme", newTheme);
    setThemeState(newTheme);
  };

  const setAccentColor = (newColor: string) => {
    localStorage.setItem("ui-accent-color", newColor);
    setAccentColorState(newColor);
  };

  // Sync theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateThemeClass = () => {
      const activeTheme =
        theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;

      setResolvedTheme(activeTheme);

      if (activeTheme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    };

    updateThemeClass();

    if (theme === "system") {
      mediaQuery.addEventListener("change", updateThemeClass);
      return () => mediaQuery.removeEventListener("change", updateThemeClass);
    }
  }, [theme]);

  // Sync accent color to CSS variables on root
  useEffect(() => {
    const root = window.document.documentElement;
    const rgb = hexToRgb(accentColor);
    const hoverColor = adjustColorBrightness(accentColor, -12); // slightly darker for hover

    if (rgb) {
      root.style.setProperty("--accent", accentColor);
      root.style.setProperty("--accent-rgb", rgb);
      root.style.setProperty("--accent-hover", hoverColor);

      // Generate soft/muted accents for transparent overlays
      root.style.setProperty("--accent-muted", `rgba(${rgb}, 0.15)`);
    }
  }, [accentColor]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        resolvedTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
