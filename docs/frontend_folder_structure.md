# Frontend Directory Structure Reference

This document maps out the organizational structure of the `frontend/` directory, detailing the location and purpose of every module boundary.

---

## 1. Directory Layout

All frontend code lives in the `frontend/` workspace under `src/`:

```
frontend/
├── src/
│   ├── api/             # API clients, Axios configurations, and endpoints config
│   ├── services/        # Decoupled business logic services returning typed responses
│   ├── hooks/           # TanStack Query custom queries and mutations
│   ├── store/           # Zustand atomic global client stores
│   ├── types/           # Strongly-typed domain model interfaces
│   ├── utils/           # Shared utility functions (errors, formatting, normalization)
│   ├── layouts/         # Shared dashboard wrappers, headers, and footer components
│   ├── providers/       # Theme, TanStack Query, and layout context wrappers
│   ├── config/          # Environment configuration variables
│   ├── constants/       # Immutable platform configurations and default settings
│   ├── assets/          # Static logos, icons, and fonts
│   ├── theme/           # Design system tokens, color parameters, and typography
│   ├── animations/      # Framer Motion transition setups and reusable variants
│   ├── components/      # UI components split by sub-domain
│   │   ├── ui/          # Low-level primitives (buttons, modals, input elements)
│   │   ├── forms/       # Input groups (JDUploadForm, FilterSettingsForm)
│   │   ├── cards/       # Profile, strength, and metrics display blocks
│   │   ├── charts/      # Recharts wrappers (NDCG trends, latency distributions)
│   │   ├── dashboard/   # Dashboard grid elements
│   │   ├── candidate/   # Candidate detail panels and lists
│   │   ├── copilot/     # Recruiter Copilot panels and question views
│   │   ├── analytics/   # Telemetry tables and statistics displays
│   │   ├── reports/     # HTML/Markdown generation action buttons
│   │   └── common/      # Shared components (loading skeletons, page loaders)
│   ├── pages/           # High-level route views (Landing, Dashboard, Profiles, etc.)
│   └── routes/          # React Router v7 routes configuration
```

---

## 2. Directory Governance Rules

1. **Domain Isolation**: Code under `components/candidate/` must not import selectors or handlers from `components/analytics/` directly. Share common properties through layouts, context providers, or stores.
2. **UI Primitive Purity**: Low-level elements inside `components/ui/` must be generic, stateless components (no Zustand connections or hooks queries).
3. **Lazy Route Mapping**: All views inside the `pages/` directory must be mapped as default exports to support React Router lazy imports.
