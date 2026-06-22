# AI Demo Mode & Guided Product Tour Documentation (Phase 12)

This module implements a self-guided product tour and hackathon presentation experience for Antigravity Talent Agent, guiding judges and recruiters across 10 stages of the candidate retrieval and scoring system.

---

## 1. Component Hierarchy

```
[DemoPage] (Root Entry & Splash Dispatcher)
 ├── [DemoWelcome] (Animated splash screen with gradient mesh, floaters)
 │    └── [DemoScenarioSelector] (Preset selectors: SWE, AI Researcher, PM, etc.)
 └── [DemoCompletionScreen] (Success checklist with canvas confetti pieces)
      └── [DemoCelebration] (Framer Motion falling confetti particle generator)

[GuidedTour] (Global Tour Manager - rendered inside AppLayout and EmptyLayout)
 ├── [DemoProgressBar] (Top HUD: active stage index, progress %, remaining time)
 ├── [HighlightOverlay] (SVG mask overlay dimming the screen with a spotlight cutout)
 ├── [FeatureCallout] (Floating tooltips showing value badges and navigation)
 │    └── [JudgeModePanel] (Toggleable specs card: why it matters, pipelines, value)
 └── [Tour Controls Dock] (Bottom Center Floating Bar)
      ├── [TourNavigation] (Quick Prev/Next step actions buttons)
      ├── [AutoPlayController] (Play/Pause triggers, countdown circular progress, speeds)
      └── [KeyboardShortcuts] (Document event listeners for hotkeys N, B, P, Esc, ?)
```

---

## 2. Autoplay Ticker Logic

Autoplay runs a `useEffect` loop that coordinates transitions:
1. **Ticker Interval:** Updates every 100ms, incrementing the timer progress.
2. **Dynamic Duration:** Each step has a base duration of 6,500ms, divided by the active `playbackSpeed` (0.5x, 1x, or 2x).
3. **Route Navigation:** When the timer reaches 100%, the store triggers `nextStep()`. The tour manager intercepts this, check if the upcoming step is on a different route, and calls `useNavigate()` to transition routes smoothly.
4. **Hydration Buffer:** Ticks wait for route load hydration before drawing spotlights to prevent layout jumps.

---

## 3. Spotlight Cutout Mask

The dimming spotlight utilizes SVG clipping masks:
- An SVG `<mask id="spotlight-mask">` covers the viewport.
- A `<rect>` element fills the mask with white (opaque backdrop).
- A `<motion.rect>` element fills the cutout coordinates with black (transparent spotlight hole).
- The cutout bounds (`top`, `left`, `width`, `height`) are evaluated dynamically from `document.querySelector(selector).getBoundingClientRect()`.
- Resize and Scroll listeners dynamically update bounding client rects.

---

## 4. State Management (Zustand Persist)

Managed in `demoStore.ts` under the persistent key `demo-store`:
- `demoActive` (boolean): Activates the global `GuidedTour` overlay wrapper.
- `currentStep` (number): Active stage index.
- `isPlaying` (boolean): Autoplay timer status.
- `playbackSpeed` (number): Speed coefficient (0.5, 1, 2).
- `scenario` (DemoScenario): Selected scenario preset.
- `judgeMode` (boolean): Show advanced architecture specifications.
- `reducedMotion` (boolean): Disables coordinate spring easing.
- `isCompleted` (boolean): Shows the final confetti checklist page.

---

## 5. Accessibility & Hotkeys

- **Keyboard Hotkeys:**
  - `N` -> Advance to Next Stage
  - `B` -> Return to Previous Stage
  - `P` -> Play / Pause Autoplay Ticker
  - `Esc` -> Exit Guided Tour
  - `?` -> Toggle Shortcuts Helper Legend
- **Focus Indicators:** Interactive sliders and navigation arrows have explicit focus ring offsets.
- **ARIA Guides:** Backdrop elements use `aria-hidden="true"`, and the progress HUD has standard `progressbar` role definitions.
- **Reduced Motion:** If `reducedMotion` is active, spotlight rect movements transition instantly without spring easing, preventing motion sickness.
