# DevOps & Launch Center Technical Documentation

This document outlines the architecture, layout, scoring systems, and components of the Phase 14 **DevOps, Observability & Submission Suite** implemented in the Antigravity Recruiter Copilot platform.

---

## 1. Goal & Architectural Overview
The DevOps & Launch Center (`/launch`) serves as the production readiness cockpit for judges and administrators. It consolidates systems health reporting, security compliance checkmarks, performance metrics, data backup/restore capabilities, and a structured judging presentation tour under a unified glassmorphic, responsive interface.

---

## 2. Unification of DevOps Panels (15 Subcomponents)
The cockpit coordinates fifteen specialized React components under `src/pages/System/components/`:

1. **`LaunchChecklist.tsx`:** Expandable layout grid covering Security, QA & Testing, and DevOps infrastructure checks.
2. **`DeploymentStatusCard.tsx`:** Live heartbeat state indicators tracking connection status of Frontend, Python servers, DB instances, cache networks, and active ML models.
3. **`EnvironmentPanel.tsx`:** Control switches for changing target environments (Development, Staging, Production) paired with active Git metadata tags.
4. **`SecurityDashboard.tsx`:** Audit items verifying network configurations (HTTPS enforcement, CORS origin policies, secure cookie options, etc.).
5. **`SecretsValidator.tsx`:** Secret keys validation panel verifying the presence of core credentials (`OPENAI_API_KEY`, `DATABASE_URL`, etc.) masked securely in the UI to prevent credentials exposure.
6. **`MonitoringPanel.tsx`:** Dynamic canvas/SVG line charts displaying real-time API latency (p95), node memory allocation, requests per minute, and error ratios.
7. **`PerformanceOverview.tsx`:** Performance vitals dashboard displaying Lighthouse targets, LCP (Largest Contentful Paint), CLS, and FID scores.
8. **`BackupCenter.tsx`:** Serializes active weights and preferences configurations into JSON files for download, with logging of backup events.
9. **`RestoreCenter.tsx`:** Handles settings restoration via local file uploads or factory resets, displaying warning confirmation modals prior to execution.
10. **`HealthTimeline.tsx`:** Log events timeline displaying chronological deployment histories, backup operations, and FAISS index builds.
11. **`ReleaseNotesPanel.tsx`:** Formatted markdown product release logs explaining current and past phase releases.
12. **`VersionInfoCard.tsx`:** Active specs card containing git branch names, commit hashes, target frameworks (React 19), and bundlers (Vite).
13. **`BuildVerificationPanel.tsx`:** Real-time automated system diagnostics panel running integrity checks upon user clicks.
14. **`JudgePresentationPanel.tsx`:** Guided walkthrough shortcuts routing judges sequentially from guest landing pages to vector dashboards, cops, and comparison grids.
15. **`FinalSubmissionPanel.tsx`:** Deliverables packaging checklist tracking submission files (code repo, READMEs, diagrams, presentation slides, video pitches).

---

## 3. Dynamic Scoring Engine
The circular radial score indicators rendered at the top of the Launch Center calculate state values dynamically using the Zustand store (`launchStore.ts`):

- **Overall Launch Readiness:** Total percentage of checks passed across all checklist sections:
  $$\text{Launch Score} = \frac{\text{Passed Checks}}{\text{Total Checks (13)}} \times 100$$
- **Security Audit:** Scored on HTTPS protocol configurations, key masking, CORS policies, secure tokens, and rate limiting setup.
- **Performance KPI:** Scored on automated testing status, observability logger registration, and offline PWA service worker setups.
- **Accessibility AA:** Scored on WCAG AA audit items and responsive layout verifications.

---

## 4. Motion-Reduction Optimization
To comply with accessibility best practices, all SVG animations (score rings and live sparkline graphs) check user accessibility preferences:
- A `window.matchMedia("(prefers-reduced-motion: reduce)")` listener checks the client's OS preferences.
- If reduced motion is requested, animation transition duration values are forced to `0s` and initial path strokes are rendered statically without drawing slide actions.

---

## 5. Router & Shell Layout Navigation
- **AppRouter Mapping:** `/launch` is lazy loaded and registered in the protected routes collection in [AppRouter.tsx](file:///d:/Engineering/Hackathon%20Projects/Finance%20Agent/frontend/src/routes/AppRouter.tsx).
- **Sidebar Integration:** A `Launch Center` navigation link is mounted under the Preferences category in the desktop [Sidebar.tsx](file:///d:/Engineering/Hackathon%20Projects/Finance%20Agent/frontend/src/layouts/AppLayout/Sidebar.tsx) and the mobile [AppLayout.tsx](file:///d:/Engineering/Hackathon%20Projects/Finance%20Agent/frontend/src/layouts/AppLayout/AppLayout.tsx).
- **Footer Status Link:** A clickable `Readiness Score: X%` widget is embedded inside the global layout [Footer.tsx](file:///d:/Engineering/Hackathon%20Projects/Finance%20Agent/frontend/src/layouts/AppLayout/Footer.tsx) linking directly to the DevOps Cockpit.

---

## 6. Automated Verification Tests
Tests implemented in [Phase14Devops.test.tsx](file:///d:/Engineering/Hackathon%20Projects/Finance%20Agent/frontend/src/tests/Phase14Devops.test.tsx) verify:
1. **Checklist State:** Verifies default settings and user check toggling hooks.
2. **Scoring Engine:** Assures mathematical score percentages scale accurately from baseline values to 100%.
3. **Backup History Logs:** Verifies new configurations exports are appended properly in log arrays.
4. **Environment Controls:** Assures switching active environment parameters updates the Zustand store target values.
