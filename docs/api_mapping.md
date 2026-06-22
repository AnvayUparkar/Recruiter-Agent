# API Client Mapping & Invalidation Specification

This document details the interface schemas, query parameters, invalidate configurations, and side-effects for TanStack Query.

---

## 1. Endpoints & TanStack Integration

### JD Analysis
- **Service Method**: `JdService.analyzeJD(jdText)`
- **HTTP Target**: `POST /api/v1/jd/analyze`
- **Hook**: `useJDAnalysis()` (mutation)
- **Side Effects**:
  - Updates `appStore.activeJD` global Zustand state.
  - Invalidates any active `useRankingQuery` instances to force recalculation against the new JD constraints.

### Ranking Pool
- **Service Method**: `RankingService.rankCandidates(jdText, strategy, limit)`
- **HTTP Target**: `POST /api/v1/rank`
- **Hook**: `useRanking(jdText, strategy, limit)` (query)
- **Caching**:
  - `staleTime`: 5 minutes (`5 * 60 * 1000`).
  - `cacheTime`: 15 minutes.
  - Key query triggers: `[ "ranking", { jdText, strategy, limit } ]`.

### Explain Fit
- **Service Method**: `CandidateService.explainCandidate(candidateId, optionalJdText)`
- **HTTP Target**: `POST /api/v1/explain`
- **Hook**: `useCandidateExplanation(candidateId, jdText)` (query)
- **Key query triggers**: `[ "explanation", candidateId, { jdText } ]`.

### System Telemetry
- **Service Method**: `AnalyticsService.fetchMetrics()`
- **HTTP Target**: `GET /api/v1/metrics`
- **Hook**: `useAnalyticsMetrics()` (query)
- **Caching**:
  - `staleTime`: 1 minute.
  - Query triggers: `[ "metrics" ]`.
  - RefetchInterval: `30 * 1000` (auto-refresh telemetry data every 30 seconds).

### System Health Gate
- **Service Method**: `HealthService.fetchHealth()`
- **HTTP Target**: `GET /api/v1/health`
- **Hook**: `useHealthCheck()` (query)
- **Caching**:
  - `staleTime`: 10 seconds.
  - RefetchInterval: `15 * 1000` (continuous status checks).
