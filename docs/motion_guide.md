# Motion Design System Guide

The **AI Recruiter Platform** incorporates premium, snappy micro-interactions and transitions inspired by Linear and Framer.

---

## Timings & Easing Tokens

Timing tokens ensure consistency across page transitions and component reactions:

-   `motion.durations.fast` (`100ms`): Used for simple opacity states, checkboxes, active highlights.
-   `motion.durations.medium` (`250ms`): Used for selects, dropdown expanders, and button transitions.
-   `motion.durations.slow` (`500ms`): Used for modals, drawer slide-ins, and complex dashboard elements.
-   `motion.durations.hero` (`800ms`): Used for main page entries and initial AI matching sweeps.

### Spring Configurations

We prefer physics-based **spring** transitions over rigid cubic-bezier curves for premium micro-interactions:

*   **Snappy Spring** (stiffness: 450, damping: 24): Great for tooltips, select menu highlights, and button taps.
*   **Bouncy Spring** (stiffness: 350, damping: 20): Used for dialog confirm prompts, card tilt recoveries, and popovers.

---

## Framer Motion Presets

Import preset variants from the theme system to ensure consistent animations.

### Example: Animating a Container List

```tsx
import { motion } from "framer-motion";
import { motionPresets } from "./theme/motion";

export const StaggeredList = () => {
  return (
    <motion.ul
      variants={motionPresets.listReveal.container}
      initial="initial"
      animate="animate"
    >
      {[1, 2, 3].map((item) => (
        <motion.li
          key={item}
          variants={motionPresets.listReveal.item}
        >
          Candidate Item {item}
        </motion.li>
      ))}
    </motion.ul>
  );
};
```

---

## Reduced Motion Standard

We respect user system preferences regarding accessibility and motion-related triggers.

### Principles:
1.  **Skip Heavy Scaling/Transforms**: Avoid scaling overlays or cards if `prefers-reduced-motion: reduce` is active.
2.  **Slide Bypasses**: Drawers slide in instantly or fade in from `opacity: 0` without position adjustments.
3.  **No 3D Tilting**: Card pointer tilts are completely disabled.

### React Integration

Utilize Framer Motion's `useReducedMotion` hook to adjust transitions dynamically:

```tsx
import { useReducedMotion } from "framer-motion";

const shouldReduceMotion = useReducedMotion();

// Inline conditional setup
const hoverAnimation = shouldReduceMotion 
  ? {} 
  : { scale: 1.02, y: -4 };
```
All design system components automatically check for this state and fall back gracefully.
