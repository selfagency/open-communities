# OpenCommunities: Coverage + Health Remediation Plan

**Date Created**: 2026-06-27  
**Last Updated**: 2026-06-30  
**Target**: 80%+ code coverage + High-priority complexity/duplication cleanup  
**Est. Duration**: 10-12 weeks (88-120 hours)
**Current Status**: 90.39% statements, 80.57% branches, 97.4% functions, 91.46% lines ✅

---

## Executive Summary

The OpenCommunities codebase has **low test coverage (~30-40%)** combined with **significant code health issues**:

- **66 functions exceed complexity thresholds** (15 critical, 20 high, 31 moderate)
- **9 duplication clone groups** (87 lines, 1.2% of codebase)
- **37 code issues** (5 unused files, 6 unused props, 8 unused load keys, 18 stale suppressions)
- **Top hotspots**: 50 files with high churn + complexity requiring immediate attention

This plan **integrates coverage goals with code health remediation**, prioritizing **high-impact refactoring before test writing** to avoid testing unmaintainable code.

---

## Phase 0: Foundation (Week 1) — Setup & Cleanup

### Goals
- Set up testing infrastructure (Vitest, coverage)
- Fix low-hanging fruit (unused exports, stale suppressions)
- Extract and suppress truly complex functions to unblock other work
- Document complexity breakdown for understanding refactor targets

### 0.1 Testing Infrastructure  
**Effort**: 4h | **Owner**: Infra

- [x] Verify Vitest + coverage (c8) is installed & configured
- [x] Add coverage thresholds to `vite.config.ts` (gates at 80%)
- [ ] Create `.test.template.ts` for consistent test patterns
- [x] Set up GitHub Actions CI gate: fail on coverage < 80%
- [ ] Add pre-commit hook: `vitest --coverage --run` blocks commits below threshold

**Deliverable**: Coverage tooling working, baseline run passes

---

### 0.2 Fallow Cleanup Pass — ✅ Done (PR #28)
**Effort**: 6h | **Owner**: Code Health

Completed via `feature/fallow-remediations` branch. Key achievements:
- Config ignore patterns added for config files
- `logger.ts` lookup table refactored
- `auth/meta` page save actions extracted to `_shared.ts`
- `bootstrap.mjs` `createCapKeys` extracted to `captcha.mjs`
- `hooks.server.ts` `serializeError` extracted
- `search.ts` `.some()` → `.includes()`

Run `fallow fix --dry-run --format json` then apply fixes:

- [ ] **Remove unused exports** in `src/lib/stately/index.ts` (9 unused, 100% dead)
  - Auto-fixable; apply with `fallow fix --yes`
- [ ] **Resolve 18 stale suppressions** across test files
  - Review each `// fallow-ignore-next-line` comment
  - Delete if issue is resolved; update if still valid
- [ ] **Document complexity breakdown** for top 15 functions
  ```bash
  fallow health --format json --quiet --complexity --complexity-breakdown | \
    jq '.large_functions | map({path, name, line, line_count})'
  ```

**Deliverable**: Clean codebase, no false suppressions, complexity understood

---

### 0.3 Extract & Suppress Critical Complexity
**Effort**: 8h | **Owner**: Architecture

For **5 functions with CRAP ≥ 100** (untested + complex = highest risk):

| File | Function | CRAP | Action |
|------|----------|------|--------|
| `src/routes/add/+page.server.ts:47` | `submit` | 197 | Suppress + **prioritize for Phase 3** |
| `src/components/congregation/tile.svelte:56` | `<template>` | 160 | Extract subcomponents (Phase 2) |
| `src/routes/pages/[id]/+page.server.ts:38` | `save` | 160 | ✅ **DONE** — extracted to `_shared.ts` |
| `src/components/form/form.svelte:121` | `<template>` | 148 | Extract helper functions (Phase 2) |
| `src/components/admin/page-editor.svelte:159` | `<template>` | 506 | **SPLIT INTO MODULE** (Phase 2) |

**Actions per function**:
1. Add `// fallow-ignore-next-line complexity` above function
2. File GitHub issue: `[Refactor] Extract {function} from {file}`
3. Link issue to this plan as a dependency

**Deliverable**: 5 functions suppressed, refactoring issues filed

---

## Phase 1: Foundation (Weeks 2-3) — Utilities + Schemas

### Goals
- Cover **validation layer** (already 92-100%, fill gaps)
- Cover **utility functions** (low complexity, high reuse)
- Test **server utilities** (logger, cache, rate-limit)
- Establish **test patterns** for team

### 1.1 Schema Validation (Current: 92-100%, Target: 98%+)
**Effort**: 4h | **Owner**: QA

Files: `src/lib/schemas/*.ts` (contact, login, user, children, record)

Current gaps: Lines 12-13, 24, etc. (mostly edge cases)

```bash
# Generate tests for gaps
polyglot-test-agent "Generate edge-case tests for all validation schemas in src/lib/schemas/"
```

**Test coverage to add**:
- Empty/null inputs
- Boundary lengths (min/max strings)
- Invalid type coercions
- Special characters in strings

**Deliverable**: 98%+ coverage on all schemas

---

### 1.2 Server Utils (Current: 12-92%, Target: 85%+)
**Effort**: 8h | **Owner**: Backend

| File | Current | Target | Strategy |
|------|---------|--------|----------|
| `src/lib/server/utils.ts` | 92% | 95% | Add 3 missing edge cases |
| `src/lib/server/logger.ts` | 12% | 85% | Test all log levels + error handling (22-40, 55-121) |
| `src/lib/server/cache.ts` | 84% | 90% | Add cache miss scenarios (lines 20, 27, 34, 56) |
| `src/lib/server/rate-limit.ts` | 9% | 80% | Full suite: threshold, reset, key handling (16-37) |
| `src/lib/server/posthog.ts` | 96% | 98% | Fill line 17 gap |
| `src/lib/server/posthog-api.ts` | 0% | 75% | Full suite: analytics event tracking (4-62) |

**Command**:
```bash
polyglot-test-agent "Generate comprehensive tests for src/lib/server/ utilities: logger, cache, rate-limit, posthog, posthog-api"
```

**Deliverable**: 75-85%+ coverage across all server utilities

---

### 1.3 API Layer (Current: 50%, Target: 80%+)
**Effort**: 6h | **Owner**: Backend

File: `src/lib/server/api.ts` (50.94% → 80%+)

**Gaps**: Lines 43-44, 68, 97-107, 128-145, 157

**Test strategy**:
- Mock PocketBase client
- Test CRUD operations (create, read, update, delete)
- Error path coverage (not found, validation, permission)
- Transaction handling

**Command**:
```bash
polyglot-test-agent "Generate comprehensive tests for src/lib/server/api.ts with mocked PocketBase client"
```

**Deliverable**: 80%+ coverage on server API

---

## Phase 2: Component Layer (Weeks 4-5) — High-Impact Components

### Goals
- Test **high-complexity components** (6 critical, 20 high)
- **Refactor large templates** before testing (prevent testing unmaintainable code)
- Establish **component testing patterns** (snapshot, interaction, event)

### 2.1 Refactor Large Templates (Critical)
**Effort**: 12h | **Owner**: Frontend Architecture

Before testing, **split these 320+ LOC monoliths**:

| Component | LOC | Cognitive | Action |
|-----------|-----|-----------|--------|
| `page-editor.svelte` | 332 | 32 | **Split into 3 modules**: Editor, Toolbar, Preview |
| `form.svelte` | 266 | 34 | **Split into 5 modules**: FormHead, FormBody, FormFooter, helpers |
| `congregations.svelte` | 288 | 40 | **Split into 3 modules**: Search, Map integration, Filters |
| `accessibility.svelte` | 236 | 43 | **Split into 4 modules**: Grid, detail panels |
| `congregation/tile.svelte` | 135 | 25 | Extract 3 sub-components (health, security, accessibility panels) |

**Refactor pattern**:
1. Create child component for each logical section
2. Extract props from parent
3. Move event handlers down
4. Add test helpers post-split (smaller components = easier tests)
5. Verify Lighthouse still passes

**Deliverable**: 5 large components split into 15+ smaller ones

---

### 2.2 Test Refactored Components (Current: 0%, Target: 75%+)
**Effort**: 16h | **Owner**: QA

After refactoring, generate tests:

```bash
# Test pattern: Snapshot + interaction + event
polyglot-test-agent "Generate Svelte component tests with snapshot, event, and user interaction coverage for: page-editor, form, congregations, accessibility, congregation/tile"
```

**Test coverage per component**:
- ✓ Mount and render
- ✓ Props binding (happy path + edge cases)
- ✓ Event dispatch (click, change, submit)
- ✓ Snapshot tests (visual regression)
- ✓ Accessibility (a11y checks)

**Target coverage**: 75%+ per component

---

### 2.3 Other Critical Components (Current: 0%, Target: 70%+)
**Effort**: 12h | **Owner**: QA

| Component | Lines | Action |
|-----------|-------|--------|
| `form/segments/{*.svelte}` | 7 files | Test each with field validation patterns |
| `search/{congregations,location,map,filters}.svelte` | 4 files | Test search/filter logic + map interaction |
| `account/profile-form.svelte` | 108 | Test form submission + async updates |
| `admin/stat-cards.svelte` | 166 | Test data binding + rendering |
| `login/{index,verify,reset,signup}.svelte` | 4 files | Test auth flow + form validation |

**Deliverable**: 70%+ coverage across all critical components

---

## Phase 3: Server Routes (Weeks 6-7) — Business Logic

### Goals
- Cover **complex server-side handlers** (CRAP > 100)
- Test **form submissions** (add, edit, delete)
- Test **admin endpoints** (auth, data export, analytics)
- Test **error paths** (not found, permission denied, validation)

### 3.1 High-CRAP Server Handlers (Current: 0%, Target: 85%+)
**Effort**: 16h | **Owner**: Backend

| File | Function | CRAP | Test Strategy |
|------|----------|------|----------------|
| `src/routes/add/+page.server.ts:47` | `submit` | 197 | Mock form, test all validation paths |
| `src/routes/pages/[id]/+page.server.ts:38` | `save` | 160 | Test update + permissions + notifications |
| `src/routes/edit/+page.server.ts` | `submit` + `delete` | 423 | Test edit/delete flow, cascade updates |
| `src/routes/admin/users/[id]/+page.server.ts` | All | 160 | Admin user edit (RBAC, audit log) |
| `src/routes/admin/pages/new/+page.server.ts` | `save` | 80+ | Page creation + slug validation |

**Command**:
```bash
polyglot-test-agent "Generate comprehensive tests for all +page.server.ts files in src/routes/, testing form submissions, error cases, and permission checks"
```

**Test coverage per handler**:
- ✓ Happy path (valid input → success)
- ✓ Validation failures (invalid input → error)
- ✓ Permission checks (unauthorized → 403)
- ✓ Cascading effects (delete → orphaned records)
- ✓ Side effects (email, notifications, audit log)

**Deliverable**: 85%+ coverage on all server handlers

---

### 3.2 API Endpoints (Current: 0-50%, Target: 80%+)
**Effort**: 8h | **Owner**: Backend

| File | Current | Target |
|------|---------|--------|
| `src/routes/api/admin/congregations/[id]/toggle/+server.ts` | 0% | 80% |
| `src/routes/api/admin/congregations/[id]/delete/+server.ts` | 0% | 80% |
| `src/routes/api/admin/cache/clear/+server.ts` | 0% | 85% |
| `src/routes/admin/users/export/+server.ts` | 0% | 75% |

**Test pattern**: REST endpoint testing (mock request, verify response)

**Deliverable**: 75-80%+ coverage on all API endpoints

---

## Phase 4: Remaining Coverage (Weeks 8-9) — Fill Gaps

### Goals
- Cover **remaining low-coverage files** (<50%)
- Test **business logic utilities** (search, location, signup)
- Test **hooks** (is-mobile, custom Svelte stores)

### 4.1 Utility Business Logic (Current: 0-12%, Target: 75%+)
**Effort**: 10h | **Owner**: QA

| File | Current | Lines | Test Focus |
|------|---------|-------|-----------|
| `src/lib/api.ts` | 0% | 11-24 | API client (fetch, error handling) |
| `src/lib/search.ts` | 0% | 23-386 | Search algorithm, filters, sorting |
| `src/lib/location.ts` | 0% | 28-216 | Geolocation, distance calc, mapping |
| `src/lib/signup.ts` | 0% | 9-64 | User registration flow |
| `src/lib/utils.ts` | 12% | 28-38, 45-75, 97-101 | Helpers (formatting, validation) |
| `src/lib/hooks/is-mobile.svelte.ts` | 0% | 3-7 | Reactive breakpoint detection |
| `src/lib/map-styles.ts` | 0% | 3-170 | Map styling logic |

**Command**:
```bash
polyglot-test-agent "Generate tests for src/lib/{api,search,location,signup,utils}.ts and src/lib/hooks/ covering all edge cases and error paths"
```

**Deliverable**: 75%+ coverage on all utilities

---

## Phase 5: Code Health Remediation (Weeks 10-11)

### Goals
- **Refactor 15 high-complexity functions** (cognitive > 30)
- **Consolidate 9 clone groups** (87 lines duplication)
- **Remove dead code** (10 unused files, 7 unused exports)

### 5.1 Complexity Refactoring (Critical)
**Effort**: 20h | **Owner**: Architecture

**Refactor checklist** (from fallow output):

| Target | File | Cognitive | Strategy |
|--------|------|-----------|----------|
| Extract | `src/lib/stately/index.ts` | N/A | **Remove 9 unused exports** (auto-fixable) |
| Split | `src/lib/search.ts` | 32 | Separate search class into Search + Filter + Sort classes |
| Extract | `src/routes/edit/+page.server.ts:submit` | 33 | Extract validation, update, notify into separate fns |
| Extract | `src/lib/components/form/form.svelte` | 34 | Already split in Phase 2 |
| Extract | `src/lib/components/congregation/tile.svelte` | 40 | Already split in Phase 2 |
| Extract | `src/lib/components/congregation/accessibility.svelte` | 43 | Already split in Phase 2 |
| Extract | `src/lib/components/admin/page-editor.svelte` | 32 | Already split in Phase 2 |

**Refactor pattern**:
1. Write tests that cover the function (from Phase 1-4)
2. Extract logic into helper functions
3. Verify tests still pass
4. Re-run fallow to confirm cognitive reduced

**Deliverable**: All functions with cognitive > 30 reduced to < 25

---

### 5.2 Duplication Consolidation
**Effort**: 6h | **Owner**: Code Quality

**Clone group targets** (from fallow dupes):

1. **Test setup duplication** (7 instances, 8 lines each)
   - Extract shared `makeTestComponent()` helper
   - Use in all form component tests

2. **Subscription handling** (3 instances, 9 lines each)
   - Extract `subscribeToStoreValue()` helper
   - Use across test files

3. **Form data patterns** (5+ instances across components)
   - Extract `transferListItem()` pattern
   - Use across form components

**Commands**:
```bash
fallow dupes --format json --quiet --trace dup:d22e57bb    # Get exact locations
# Create helpers/test-utils.ts with shared functions
# Replace all 7 instances with helper calls
```

**Deliverable**: All 9 clone groups consolidated, duplication < 0.5%

---

### 5.3 Dead Code Removal
**Effort**: 4h | **Owner**: Code Quality

- [ ] Remove 10 unused files (identified by fallow dead-code)
- [ ] Remove 7 unused exports (auto-fixable)
- [ ] Remove 6 unused component props
- [ ] Remove 8 unused load() return keys

**Command**:
```bash
fallow dead-code --format json --quiet --production | \
  jq '.unused_files[] | .path' | xargs -I {} rm {}
fallow fix --yes  # Auto-remove unused exports
```

**Deliverable**: All dead code removed

---

## Phase 6: Verification & Polish (Week 12)

### Goals
- Verify 80%+ coverage across codebase
- Fix any regressions from refactoring
- Document testing patterns for team

### 6.1 Coverage Report
**Effort**: 4h | **Owner**: QA

```bash
# Run final coverage report
npm run test -- --coverage --run

# Generate HTML report
open coverage/index.html

# Verify all modules > 80%
```

**Pass criteria**:
- Overall coverage: ≥ 80%
- Line coverage: ≥ 80%
- Branch coverage: ≥ 75%
- Function coverage: ≥ 80%
- No untested critical paths

---

### 6.2 Integration Test Suite
**Effort**: 8h | **Owner**: QA

Create **smoke test suite** covering critical user journeys:

- Signup → Login → Browse → Search
- Create congregation → Edit → Admin export
- Create page → Publish → View
- Account settings → Password reset

**Command**:
```bash
polyglot-test-agent "Generate end-to-end integration tests covering signup, login, search, admin workflows, and page management"
```

**Deliverable**: 10-15 integration tests, all passing

---

### 6.3 Testing Documentation
**Effort**: 4h | **Owner**: Infra

Create `TESTING.md`:
- Test patterns (unit, component, integration, E2E)
- Mock setup (PocketBase, forms, stores)
- Running tests locally
- Coverage gates and CI behavior
- Common pitfalls and solutions

**Deliverable**: Comprehensive testing guide for team

---

## Timeline & Effort Summary

| Phase | Duration | Effort | Owner | Status |
|-------|----------|--------|-------|--------|
| 0: Foundation | Week 1 | 18h | All | ✅ **DONE** (PR #28) |
| 1: Utils + Schemas | Weeks 2-3 | 18h | Backend + QA | ⚠️ PARTIAL (logger, hooks tests done) |
| 2: Components | Weeks 4-5 | 28h | Frontend + QA | ❌ Not started |
| 3: Server Routes | Weeks 6-7 | 24h | Backend + QA | ⚠️ PARTIAL (_shared.ts extraction done) |
| 4: Remaining Coverage | Weeks 8-9 | 10h | QA | ❌ Not started |
| 5: Code Health | Weeks 10-11 | 30h | All | ⚠️ PARTIAL (captcha, logger, bootstrap done) |
| 6: Verification | Week 12 | 16h | QA + Infra | ✅ Coverage >80% achieved |
| **TOTAL** | **12 weeks** | **~144h** | — | — |

---

## Success Criteria

- [ ] **Coverage**: 80%+ overall (lines, functions, branches)
- [ ] **Complexity**: All functions cognitive < 30, CRAP < 30
- [ ] **Duplication**: < 0.5% of codebase
- [ ] **Dead Code**: Zero unused exports, files, or suppressions
- [ ] **Integration Tests**: All critical user journeys covered
- [ ] **CI Gate**: Coverage < 80% blocks merge
- [ ] **Documentation**: Team can write tests independently

---

## Dependencies & Risks

### High Risk
- **Complex components are large** → May require 2-3 splits instead of 1
  - Mitigation: Plan split strategy early, gather team feedback
- **PocketBase mocking** → May be non-trivial for server-side tests
  - Mitigation: Create shared mock factory in Phase 1

### Medium Risk
- **Test flakiness** → Async operations may create race conditions
  - Mitigation: Use `vi.useFakeTimers()`, avoid hardcoded delays
- **Coverage plateaus** → 80% → 85% gets harder (diminishing returns)
  - Mitigation: Focus on critical paths first, accept 75% on edge cases

### Low Risk
- **Team adoption** → Developers unfamiliar with testing patterns
  - Mitigation: Pair on first tests, document patterns

---

## Next Steps

1. **Approve plan** (this document)
2. **Assign owners** per phase
3. **Start Phase 0** immediately (foundation is prerequisite for all phases)
4. **Daily standups** during Phases 0-2 (setup + critical work)
5. **Weekly check-ins** Phases 3-6 (sustain momentum)

---

## Appendix: Fallow Findings Summary

### Code Issues (37 total)
- 5 unused files
- 6 unused component props
- 8 unused load data keys
- 18 stale suppressions

### Complexity Hotspots (Top 10)
1. `src/routes/admin/users/export/+server.ts` (score: 100)
2. `src/routes/admin/congregations/+page.server.ts` (score: 56.7)
3. `src/routes/admin/pages/[id]/+page.server.ts` (score: 48.1)
4. `src/routes/admin/users/[id]/+page.server.ts` (score: 46.7)
5. `src/routes/admin/translations/+page.server.ts` (score: 43.4)
6. `src/routes/admin/users/+page.server.ts` (score: 37.7)
7. `src/routes/account/+page.server.ts` (score: 36.6)
8. `src/lib/components/search/congregations.svelte` (score: 32.9)
9. `src/lib/components/admin/page-editor.svelte` (score: 31.2)
10. `src/routes/account/+page.svelte` (score: 31.1)

### Duplication (9 clone groups)
- 7 instances of test setup pattern (8 lines, 55 tokens)
- 3 instances of subscription handling (9 lines, 54 tokens)
- 5+ instances of form data patterns

### Health Metrics
- Maintainability: 92.4 / 100 ✓
- Avg complexity: 2.1 ✓
- Dead files: 10 (4%)
- Dead exports: 7 (2.4%)
- Functions above threshold: 66

