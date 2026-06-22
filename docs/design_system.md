# Design System Guide

This guide details the design token values and styling guidelines of the **AI Recruiter Platform**. It enforces a premium dark-first aesthetic combined with smooth, responsive glassmorphism and ambient glows.

---

## Color System

All colors are semantic and dynamically linked to CSS Custom Properties. Do not hardcode hexadecimal strings inside components.

| Token | CSS Variable | Light Hex | Dark Hex | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Accent** | `--accent` | Dynamic (`#4F7CFF`) | Dynamic (`#4F7CFF`) | Primary highlights & focus indicators |
| **Accent Hover** | `--accent-hover` | Dynamic | Dynamic | Hover shade of the primary color |
| **Background** | `--background` | `#FAFAFA` | `#09090B` | System backdrop color |
| **Surface** | `--surface` | `#FFFFFF` | `#18181B` | Standard card and container fills |
| **Surface Hover** | `--surface-hover` | `#F4F4F5` | `#27272A` | Background color for hovered list items |
| **Text Primary** | `--text-primary` | `#09090B` | `#FAFAFA` | Base body text and headings |
| **Text Muted** | `--text-muted` | `#71717A` | `#A1A1AA` | Secondary descriptions and labels |
| **Border** | `--border` | `rgba(9, 9, 11, 0.08)` | `rgba(255, 255, 255, 0.08)` | Card outlines, dividers, line breaks |
| **Glass BG** | `--glass` | `rgba(255, 255, 255, 0.65)`| `rgba(9, 9, 11, 0.65)` | Glassmorphism card backgrounds |
| **Glass Border** | `--glass-border` | `rgba(9, 9, 11, 0.06)` | `rgba(255, 255, 255, 0.08)`| Transparent card outer border |

---

## Typography Scale

The headings use **Space Grotesk** or **Inter Tight** for futuristic geometry. Body text relies on **Inter** for clean readability.

| Type Class | Size Token | Base Size | Font Family | Weight |
| :--- | :--- | :--- | :--- | :--- |
| `.font-display-xl` | `sizes.displayXl` | `3.75rem` (60px) | Heading | 700 (Bold) |
| `.font-display-lg` | `sizes.displayLg` | `3.00rem` (48px) | Heading | 700 (Bold) |
| `.font-display-md` | `sizes.displayMd` | `2.25rem` (36px) | Heading | 700 (Bold) |
| `.font-heading-xl` | `sizes.headingXl` | `1.875rem` (30px)| Heading | 600 (SemiBold) |
| `.font-heading-lg` | `sizes.headingLg` | `1.50rem` (24px) | Heading | 600 (SemiBold) |
| `.font-heading-md` | `sizes.headingMd` | `1.25rem` (20px) | Heading | 600 (SemiBold) |
| `.font-body-lg` | `sizes.bodyLg` | `1.125rem` (18px)| Body | 400 (Regular) |
| `.font-body-md` | `sizes.bodyMd` | `1.00rem` (16px) | Body | 400 (Regular) |
| `.font-body-sm` | `sizes.bodySm` | `0.875rem` (14px)| Body | 400 (Regular) |
| `.font-caption` | `sizes.caption` | `0.75rem` (12px) | Body | 500 (Medium) |
| `.font-code` | `sizes.code` | `0.875rem` (14px)| Mono | 400 (Regular) |

---

## Corner Radii

Use standard rounded classes to maintain visual consistency.

-   `sm` (`--radius-sm`): `0.25rem` (4px) — Buttons (small), tags, tags list items.
-   `md` (`--radius-md`): `0.50rem` (8px) — Buttons, text inputs, selects.
-   `lg` (`--radius-lg`): `0.75rem` (12px) — Tooltips, dropdown lists.
-   `xl` (`--radius-xl`): `1.00rem` (16px) — Side sheets, dialogs.
-   `2xl` (`--radius-2xl`): `1.50rem` (24px) — Cards, large containers.

---

## Shadow Depth

All shadow values are designed to convey elevation levels:

*   `--shadow-sm` (`shadow-sm`): Soft boundary separator.
*   `--shadow-md` (`shadow-md`): Standard card elevation.
*   `--shadow-lg` (`shadow-lg`): Focus overlays and drawer elevation.
*   `--shadow-glow` (`shadow-glow`): Radial neon glow centering on active inputs or tabs.
*   `--shadow-neon` (`shadow-neon`): Ambient aura used for spotlight highlights.
*   `--shadow-glass` (`shadow-glass`): Depth shadow mapping inside backdrop blurs.

---

## Z-Index Stacking Layers

We define explicit stacking variables to prevent UI layering overlaps:

*   `zIndex.base`: `0`
*   `zIndex.dropdown`: `10`
*   `zIndex.sticky`: `20`
*   `zIndex.fixed`: `30`
*   `zIndex.overlay`: `40`
*   `zIndex.modal`: `50`
*   `zIndex.drawer`: `55`
*   `zIndex.popover`: `60`
*   `zIndex.tooltip`: `70`
*   `zIndex.toast`: `85`
