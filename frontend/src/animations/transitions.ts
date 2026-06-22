export const transitions = {
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 25,
  },
  smooth: {
    type: "tween",
    ease: [0.16, 1, 0.3, 1],
    duration: 0.4,
  },
  fast: {
    type: "tween",
    ease: "easeOut",
    duration: 0.2,
  },
} as const;

export type ThemeTransitions = typeof transitions;
export default transitions;
