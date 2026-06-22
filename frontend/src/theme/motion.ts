export const motionTimings = {
  fast: "100ms",
  medium: "250ms",
  slow: "500ms",
  hero: "800ms",
} as const;

export const motionDurations = {
  fast: 0.1,
  medium: 0.25,
  slow: 0.5,
  hero: 0.8,
} as const;

export const motionEasings = {
  easeOut: [0.16, 1, 0.3, 1],      // Expo easeOut
  easeIn: [0.7, 0, 0.84, 0],       // Expo easeIn
  easeInOut: [0.87, 0, 0.13, 1],   // Expo easeInOut
  springDefault: { type: "spring", stiffness: 300, damping: 30 },
  springSnappy: { type: "spring", stiffness: 400, damping: 25 },
  springBouncy: { type: "spring", stiffness: 450, damping: 20 },
} as const;

// Framer Motion presets that respect reduced motion options
export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: motionDurations.medium, ease: "easeOut" }
  },
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 12 },
    transition: { type: "spring", stiffness: 350, damping: 28 }
  },
  slideDown: {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { type: "spring", stiffness: 350, damping: 28 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 26 }
  },
  heroReveal: {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: motionDurations.hero, ease: [0.16, 1, 0.3, 1] }
  },
  cardReveal: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 260, damping: 20 }
  },
  modalReveal: {
    initial: { opacity: 0, scale: 0.92, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.94, y: 8 },
    transition: { type: "spring", stiffness: 380, damping: 26 }
  },
  listReveal: {
    container: {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
      }
    },
    item: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { type: "spring", stiffness: 350, damping: 25 }
    }
  },
  tooltipReveal: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { type: "spring", stiffness: 450, damping: 24 }
  }
} as const;

export const motion = {
  timings: motionTimings,
  durations: motionDurations,
  easings: motionEasings,
  presets: motionPresets,
} as const;

export type ThemeMotion = typeof motion;
export default motion;
