export const colors = {
  // Global Raw Scales
  primary: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#4F7CFF", // Electric Blue default
    600: "#3B62E6",
    700: "#2548C9",
    800: "#1E3A9E",
    900: "#172A70",
  },
  secondary: {
    50: "#FAF5FF",
    100: "#F3E8FF",
    200: "#E9D5FF",
    300: "#D8B4FE",
    400: "#C084FC",
    500: "#A855F7", // Purple default
    600: "#9333EA",
    700: "#7E22CE",
    800: "#6B21A8",
    900: "#581C87",
  },
  success: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981", // Emerald
    600: "#059669",
    700: "#047857",
    800: "#065F46",
    900: "#064E3B",
  },
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B", // Amber
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  error: {
    50: "#FFF1F2",
    100: "#FFE4E6",
    200: "#FECDD3",
    300: "#FDA4AF",
    400: "#FB7185",
    500: "#F43F5E", // Rose
    600: "#E11D48",
    700: "#BE123C",
    800: "#9F1239",
    900: "#881337",
  },
  info: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9", // Sky Info
    600: "#0284C7",
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
  },
  // Semantic themes
  dark: {
    background: "#09090B", // Slate-950/Zinc-950 premium dark
    surface: "#18181B", // Zinc-900 surface
    surfaceHover: "#27272A", // Zinc-800
    textPrimary: "#FAFAFA", // Zinc-50
    textMuted: "#A1A1AA", // Zinc-400
    textDisabled: "#52525B", // Zinc-600
    border: "rgba(255, 255, 255, 0.08)",
    
    // Glassmorphism variants
    glassBg: "rgba(9, 9, 11, 0.65)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
    glassBlur: "16px",
    
    // Accent allocations
    accent: "#4F7CFF",
    accentHover: "#3B62E6",
    accentMuted: "rgba(79, 124, 255, 0.15)",
  },
  light: {
    background: "#FAFAFA", // Zinc-50 light background
    surface: "#FFFFFF", // Pure white card surfaces
    surfaceHover: "#F4F4F5", // Zinc-100
    textPrimary: "#09090B", // Zinc-950
    textMuted: "#71717A", // Zinc-500
    textDisabled: "#D4D4D8", // Zinc-300
    border: "rgba(9, 9, 11, 0.08)",
    
    // Glassmorphism variants
    glassBg: "rgba(255, 255, 255, 0.65)",
    glassBorder: "rgba(9, 9, 11, 0.08)",
    glassBlur: "16px",
    
    // Accent allocations
    accent: "#4F7CFF",
    accentHover: "#3B62E6",
    accentMuted: "rgba(79, 124, 255, 0.1)",
  },
} as const;

export type ThemeColors = typeof colors.dark;
