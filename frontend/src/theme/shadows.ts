export const shadows = {
  // Layered soft depth (Apple/Stripe style)
  soft: "0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)",
  medium: "0 10px 20px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
  strong: "0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.05)",
  
  // Translucent panel glass shadow
  glass: "0 8px 32px 0 rgba(0, 0, 0, 0.16)",
  
  // Glow shadows for AI features
  glow: "0 0 15px 0 rgba(79, 124, 255, 0.25)",
  neonGlow: "0 0 25px 0 rgba(79, 124, 255, 0.45), 0 0 10px 0 rgba(79, 124, 255, 0.25)",
  secondaryGlow: "0 0 20px 0 rgba(168, 85, 247, 0.35)",

  // Component specific alias
  card: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
  cardHover: "0 20px 40px -10px rgba(79, 124, 255, 0.15)",
  floating: "0 30px 60px -15px rgba(0, 0, 0, 0.25)",
  hero: "0 0 80px -10px rgba(79, 124, 255, 0.3)",
} as const;

export type ThemeShadows = typeof shadows;
export default shadows;
