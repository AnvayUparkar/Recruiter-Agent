# Production Polish & Performance Hardening Documentation (Phase 13)

This document details the architectural additions, performance enhancements, PWA configurations, and accessibility hardeners implemented during Phase 13.

---

## 1. PWA & Service Worker Caching Architecture

The platform is configured with full Progressive Web App support to enable local installation and seamless offline capability.

### Web App Manifest (`public/manifest.json`)
Allows the application to be installed on Android, iOS, Windows, macOS, and Linux as a standalone web application.
- **Display Mode:** `standalone` (removes address bar for custom app feel).
- **Theme Color:** `#4F7CFF` (Electric Blue brand accent).
- **Icons:** Configured with SVG branding vector `logo.svg` which offers scalable support for all device resolutions.

### Service Worker (`public/sw.js`)
Manages cache controls to guarantee speed and offline fallback:
1. **Static Assets Caching:** Pre-caches the HTML shell (`/index.html`), PWA manifest, vector logos, and uses a **Stale-While-Revalidate** policy for CSS/JS chunk assets. Once a chunk is loaded, it caches in `antigravity-static-v1` to load instantly on repeat visits.
2. **API Request Caching:** Employs a **Network-First-with-Cache-Fallback** policy for endpoint paths (e.g. `/api/v1/candidates/*`, `/api/v1/ranking/*`). If the network is active, requests load live and update the cache. If offline, the service worker returns the most recently cached copy.

---

## 2. Offline Experience & Sync Queue

When connection is lost, the application handles states dynamically without breaking the UI flow.

### Zustand Connectivity Store (`src/store/pwaStore.ts`)
Tracks connection status via `navigator.onLine` and updates the app layout.
- **Offline Indicator Banner:** If `isOnline === false`, an animated, warning bar (`OfflineStatusBanner.tsx`) slides in from the top: *"You are offline. Viewing cached recruiter insights & profiles."*
- **Feature Disabling:** Interactive buttons that mutate remote databases (like launching a new JD analysis) automatically disable and show context tooltips ("Unavailable offline").
- **Offline Synchronization Queue:** Notes written by recruiters on candidates while offline are saved to a `syncQueue` in localStorage. Once the browser returns online:
  - The banner changes to a success state.
  - The queue automatically syncs notes back to the database in order of creation.
  - A success toast is displayed.

---

## 3. Centralized Toast System (`src/store/toastStore.ts`)

Replaced standard alerts and indicators with a centralized toast feed:
- **Types Supported:** `success` (green), `error` (rose), `warning` (amber), `info` (blue), and `loading` (blue spinning ticker).
- **Update Capabilities:** The store allows updating an existing toast in-place (e.g. converting a "loading" toast to a "success" or "error" toast upon API resolution).
- **Dismissal & Progress:** Triggers smooth Framer Motion exit animations. Auto-dismissing toasts display a matching countdown progress line indicator.

---

## 4. Performance & Render Optimizations

### Bundle Splitting & Prefetching (`src/utils/prefetch.ts`)
- All page entries are loaded dynamically via `React.lazy`.
- Sidebar menu items track mouse-hover events (`onMouseEnter`). Hovering over a link triggers a pre-fetch call for the page chunk in the background, preparing the bundle before the click event executes.

### Render Memoization
- Wrapped major dashboard rows and candidate overview cards in `React.memo` (specifically `CandidateCard` and `TableRow`/`CandidateTable` lists).
- Callback methods (`handleSelectCandidate`, `handleToggleComparison`) are enclosed in `useCallback` inside page layouts to guarantee stable reference identities.

### Viewport Virtualization (`src/components/common/VirtualList.tsx`)
- Provides a reusable `VirtualList` windowing wrapper that absolutely positions only the elements visible in the scroll viewport, preventing DOM bloating when rendering up to 100 candidate rows.

---

## 5. Accessibility Hardening Checklist (WCAG AA)

- **Semantic Landmarks:** Re-aligned shells to use structural landmarks (`<header>`, `<aside>`, `<main>`, `<footer>`).
- **Keyboard Traps:** Keyboard focus loops are trapped inside overlay menus. Added `Escape` key capture listeners to close the Command Palette and modal settings.
- **Focus Rings:** Interactive elements are styled with high-contrast outlines (`focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`).
- **Screen Reader Navigation:** A hidden "Skip to main content" link is mounted at the top of pages to bypass sidebar navigation.
- **Reduced Motion:** Checked browser preferences using `useReducedMotion()`. Spring scale/slides are swapped for instantaneous opacity fades if prefers-reduced-motion is active.

---

## 6. Testing Strategy & Verification

Tests are written in `frontend/src/tests/Phase13Polish.test.tsx` and can be executed with standard test frameworks (Vitest/Jest).

### Verifications Covered:
1. **Accessibility/Loading:** Checks skeleton element styles and pulse animation tags.
2. **Route Prefetching:** Asserts that prefetching registers target routes and logs bundle fetches.
3. **Error Boundaries:** Verifies that component crashes produce an incident ID label (`ERR-TA-XXXX`).
4. **Offline Behaviors:** Validates store queue tracking and notes collection.
5. **Toast Alerts:** Confirms toast queues dismiss and load alerts.
