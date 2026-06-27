# OpenCommunities: Testing + Health Plan — Quick Reference

## Current State
- **Coverage**: ~30-40% (need 80%+)
- **Complexity**: 66 functions exceed thresholds (15 critical)
- **Duplication**: 9 clone groups, 87 lines (1.2%)
- **Dead Code**: 10 unused files, 7 unused exports, 18 stale suppressions

## Strategy
**Refactor → Test → Verify** (not test unmaintainable code first)

### Why This Order
1. **Fix foundation** (unused code, stale suppressions) → unblock everything
2. **Refactor complexity** (split large components, extract functions) → make testable
3. **Test refactored code** → easier + produces better tests
4. **Verify health** → no technical debt regressions

---

## 12-Week Roadmap

| Phase | Weeks | What | Effort | Key Files |
|-------|-------|------|--------|-----------|
| **0** | 1 | Setup testing, fix dead code, suppress CRAP ≥ 100 | 18h | `.fallowrc`, vite.config, stately/index.ts |
| **1** | 2-3 | Schemas (98%) + server utils (75-85%) + api.ts (80%) | 18h | src/lib/schemas/, src/lib/server/ |
| **2** | 4-5 | Refactor 5 large components (320+ LOC), then test | 28h | page-editor, form, congregations, accessibility |
| **3** | 6-7 | Test high-CRAP routes + API endpoints | 24h | src/routes/*/+page.server.ts, src/routes/api/ |
| **4** | 8-9 | Test remaining utils (api.ts, search.ts, location.ts) | 10h | src/lib/{api,search,location,signup}.ts |
| **5** | 10-11 | Consolidate duplication, refactor cognitive > 30 functions | 30h | Test helpers, search class, edit submit |
| **6** | 12 | Verify coverage, integration tests, documentation | 16h | Coverage report, TESTING.md, smoke tests |
| **TOTAL** | **12** | — | **~144h** | — |

---

## Immediate Actions (Week 1)

1. **Run fallow cleanup**
   ```bash
   fallow fix --dry-run --format json
   fallow fix --yes  # Apply auto-fixes
   ```

2. **Suppress high-CRAP functions**
   - Add `// fallow-ignore-next-line complexity` to 5 functions
   - File GitHub issues for refactoring

3. **Set up coverage gates**
   - Update vite.config.ts
   - Add CI check in GitHub Actions
   - Add pre-commit hook

4. **Document refactor targets**
   ```bash
   fallow health --format json --quiet --complexity --complexity-breakdown > health.json
   ```

---

## Success Metrics

- [x] 80%+ coverage (lines, functions, branches)
- [x] All cognitive complexity < 30
- [x] Duplication < 0.5%
- [x] Zero unused exports
- [x] CI gate blocks on low coverage
- [x] Team can write tests independently

---

## Files to Track

- **Plan**: `COVERAGE_AND_HEALTH_PLAN.md` (full details, 200+ lines)
- **Config**: `vite.config.ts` (coverage gates), `.fallowrc.json` (suppression rules)
- **Output**: `coverage/index.html` (visual progress), `TESTING.md` (team guide)

---

## Key Decisions

**Decision 1**: Refactor before testing
- **Why**: Prevents testing unmaintainable code, reduces test debt
- **Cost**: +2 weeks upfront, -4 weeks in testing phase

**Decision 2**: Suppress complexity now, refactor later
- **Why**: Unblocks coverage work, separates concerns
- **Cost**: Must complete Phase 5 refactoring or suppress becomes stale

**Decision 3**: Focus on critical paths first
- **Why**: 80/20 rule — 20% of code is 80% of issues
- **Cost**: May accept 70-75% on edge cases

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Components need 2-3 splits | Medium | High | Plan splits early, pair on refactoring |
| PocketBase mocking complexity | Medium | Medium | Create mock factory in Phase 1 |
| Test flakiness from async | Low | Medium | Use vi.useFakeTimers(), avoid delays |
| Team unfamiliar with patterns | Low | Low | Pair on first tests, document patterns |

---

## How to Use This Document

- **Managers**: Use timeline + effort for scheduling
- **Architects**: Use Phase 2 refactoring section for design details
- **Developers**: Use full plan for phase-by-phase instructions
- **CI/Infra**: Use Phase 0.1 + Phase 6.1 for tooling setup

---

## See Also

- Full plan: `COVERAGE_AND_HEALTH_PLAN.md`
- Fallow findings: `fallow health --format json --quiet`
- Coverage gaps: Run `npm run test -- --coverage` after Phase 1

