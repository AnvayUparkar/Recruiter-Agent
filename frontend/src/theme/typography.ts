export const typography = {
  fonts: {
    heading: "'Space Grotesk', 'Inter Tight', 'Inter', -apple-system, sans-serif",
    body: "'Inter', -apple-system, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  sizes: {
    displayXl: "3.75rem",  // 60px
    displayLg: "3rem",     // 48px
    displayMd: "2.25rem",  // 36px
    headingXl: "1.875rem", // 30px
    headingLg: "1.5rem",   // 24px
    headingMd: "1.25rem",  // 20px
    bodyLg: "1.125rem",    // 18px
    bodyMd: "1rem",        // 16px
    bodySm: "0.875rem",    // 14px
    caption: "0.75rem",    // 12px
    code: "0.875rem",      // 14px
  },
  weights: {
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

export type ThemeTypography = typeof typography;
export default typography;
