export const spacing = {
  none: "0rem",         // 0px
  xs: "0.25rem",       // 4px
  sm: "0.5rem",        // 8px
  md: "0.75rem",       // 12px
  lg: "1rem",          // 16px
  xl: "1.5rem",        // 24px
  "2xl": "2rem",       // 32px
  "3xl": "3rem",       // 48px
  "4xl": "4rem",       // 64px
  "5xl": "6rem",       // 96px
} as const;

export type ThemeSpacing = typeof spacing;
export default spacing;
