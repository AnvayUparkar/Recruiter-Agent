# Frontend Foundational Architecture Guide

This document describes the high-level architectural decisions and styling guidelines selected to support the LinkedIn AI Recruiter Platform interface.

---

## 1. Architectural Strategy

The frontend application uses a **Modular service-driven architecture** built on top of React 19, Vite, TailwindCSS, TanStack React Query, React Router v7, and Zustand.

```
┌────────────────────────────────────────────────────────┐
│                        VIEW LAYER                      │
│     React 19 Components / Pages / Tailwind Layouts    │
└───────────────────────────┬────────────────────────────┘
                            │ (useQuery / useMutation)
┌───────────────────────────▼────────────────────────────┐
│                    SERVER STATE CACHE                  │
│            TanStack Query Cache (QueryKey)             │
└───────────────────────────┬────────────────────────────┘
                            │ (Service Layer invokes Client)
┌───────────────────────────▼────────────────────────────┐
│                     SERVICE & API LAYER                │
│       jdService, rankingService / Axios Client         │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON REST payloads)
┌───────────────────────────▼────────────────────────────┐
│                       BACKEND API                      │
│                  Flask Routing Gateway                 │
└────────────────────────────────────────────────────────┘
```

---

## 2. Key Modules & Technology Stack

### Core Foundation
- **Vite & TypeScript**: Standard toolchain configured for rapid feedback, strict type verification, and tree-shaking exports.
- **React Router v7**: Declarative routing with lazy-loaded route chunks, code-splitting boundary handling, and layout context routing.
- **TailwindCSS**: Utilitarian styles tied to a centralized token set (`theme/tokens.ts`).

### State & Networking
- **Axios HTTP Client**: Encapsulates request timeouts (15s), interceptors for global logging, headers, normalized error objects (`ApiError`), and retry attempts.
- **TanStack Query (React Query)**: Separates network state from UI state. Automatically handles caching, optimistic UI updates, loading states, and automatic window-refetch behaviors.
- **Zustand Stores**: Lightweight, atomic, and persistent reactive client stores that manage selected candidate states, theme configurations, comparisons, and active dashboard filters.

---

## 3. Design Aesthetics Guidelines

The visual design system implements a **premium dark glassmorphic styling system** designed to mimic LinkedIn Premium TA features:
- **Curated Palettes**: Curated slate and indigo-blue accents combined with HSL tailored alert colors (Emerald for Strong Hire, Amber for Interview, Rose for Reject).
- **Typography**: Imports Google Fonts Outfit and Inter to establish professional hierarchy.
- **Glassmorphic Tokens**: Utilizes `backdrop-filter: blur(12px)` and thin semi-transparent borders (`rgba(240, 246, 252, 0.1)`) to establish visual depth.
- **Micro-Animations**: Framer Motion presets for page transitions, interactive hover lifts, and list item reveal cascading.
