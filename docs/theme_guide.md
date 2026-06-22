# Theme Engine Guide

The **AI Recruiter Platform** includes a dynamic Theme Engine supporting Light Theme, Dark Theme, System preference tracking, and on-the-fly customizable Accent colors.

---

## The Theme Provider

Our theme context manages internal states, updates document attributes, and writes configurations to `localStorage`.

### Context API

```typescript
import { useTheme } from "../providers/ThemeProvider";

const {
  theme,             // "light" | "dark" | "system"
  setTheme,          // (mode: "light" | "dark" | "system") => void
  accentColor,       // HEX code (string)
  setAccentColor,    // (hexColor: string) => void
  resolvedTheme      // "light" | "dark"
} = useTheme();
```

---

## How Themes Are Synced

1.  **CSS Classes**: Changing the theme mode from the context updates classes on the root HTML element (`document.documentElement`). It appends either `.light` or `.dark`.
2.  **System Sync**: Selecting `system` triggers a listener targeting `(prefers-color-scheme: dark)`. If your OS settings toggle between dark and light modes, the layout resolves instantly.
3.  **Accent Customization**: When `setAccentColor` is called:
    *   The Hex value is parsed to RGB coordinates (e.g. `#4F7CFF` -> `79, 124, 255`).
    *   Variables `--accent` and `--accent-rgb` are set as inline styles on the HTML root element.
    *   Tailwind utility values (e.g. `bg-accent/10` or `border-accent`) automatically adapt to the updated values.

---

## Tailwind CSS Integration

All style classes pull from the CSS variables mapped by the theme engine.

```tsx
// Accent text and background overlays
<span className="text-accent hover:text-accent-hover bg-accent/10">
  Highlight Info
</span>

// Glassmorphism panels
<div className="bg-glass border-glass-border backdrop-blur-glass shadow-glass">
  Premium Glass Card
</div>

// Custom theme animations
<div className="animate-shimmer bg-surface">
  Loading Placeholder...
</div>
```

---

## Dynamic Accent Color Customization

You can programmatically alter the accent theme color from anywhere in the codebase. Let the user choose their own visual accent:

```tsx
import React from "react";
import { useTheme } from "../../providers/ThemeProvider";

export const CustomAccentPicker: React.FC = () => {
  const { accentColor, setAccentColor } = useTheme();

  return (
    <div className="flex gap-2">
      <button onClick={() => setAccentColor("#4F7CFF")} className="bg-[#4F7CFF] w-6 h-6 rounded-full" />
      <button onClick={() => setAccentColor("#A855F7")} className="bg-[#A855F7] w-6 h-6 rounded-full" />
      <input
        type="color"
        value={accentColor}
        onChange={(e) => setAccentColor(e.target.value)}
        className="w-8 h-8 rounded-full border-0 cursor-pointer"
      />
    </div>
  );
};
```
This updates all active buttons, card borders, icons, text inputs, and badges instantly!
