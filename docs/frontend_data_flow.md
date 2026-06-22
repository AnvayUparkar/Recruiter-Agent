# Frontend Data Flow & State Synchronization Specification

This document details the distinct flow loops for managing server-backed data (TanStack Query) and local client UI adjustments (Zustand).

---

## 1. Server State vs. Client State

To prevent race conditions and redundant network operations, state is strictly divided:
- **Server State (TanStack Query)**: Data that originates from the backend Flask server (candidate details, parsed JDs, fit scoring, system metrics).
- **Client State (Zustand Stores)**: UI configuration flags (light/dark theme toggle, active candidate selection ID, head-to-head comparison lists, search filters).

---

## 2. Ingestion & Ranking Data Flow

```
[JD Input View] --(1. Submit)--> [Service POST /jd/analyze]
                                          │
                                      (2. Return ParsedJD)
                                          ▼
[Zustand Store] <=============== Update `activeJD`
      │
      ├─────────────────────────┐
      ▼ (3. Trigger Query)       ▼ (4. Trigger Query)
[useRetrievalQuery]        [useRankingQuery]
      │                          │
(Hybrid Fetch)             (Score & Rank Pool)
      │                          │
      ▼                          ▼
[Render Match list]        [Render Leaderboard Table]
```

1. **Upload/Analysis**: User enters a job description. The `useJDAnalysis` mutation handles request submission and updates the local Zustand `appStore` with the resulting `ParsedJD`.
2. **Leaderboard Fetching**: The dashboard detects the updated `activeJD` and triggers `useRanking` query to POST to `/api/v1/rank`.
3. **Caching & Re-fetch**: TanStack Query caches the result. Changing filters (e.g. strategy from `balanced` to `technical_first`) triggers a cached re-fetch, avoiding redundant parser executions.

---

## 3. Pairing and Comparison Logic Flow

Pairwise comparisons are managed entirely within `candidateStore` on the client:
1. Recruiter clicks "Compare Candidate A".
2. Store validates limit (maximum 2 candidates) and appends Candidate A ID.
3. Recruiter clicks "Compare Candidate B" and appends Candidate B ID.
4. Route navigates to `/comparison`.
5. Comparison view triggers `useCandidateComparison` query, passing IDs to the service mapping `/api/v1/explain` (for single data loads) or custom pairwise calculations.
6. Returns side-by-side feature differences, detailing exact score deltas.
