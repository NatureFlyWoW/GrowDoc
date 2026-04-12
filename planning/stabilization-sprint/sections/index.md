<!-- PROJECT_CONFIG
runtime: vanilla-js
test_command: open /test route in browser
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-remove-top-level-awaits
section-02-error-handling
section-03-cultivation-contradictions
section-04-test-coverage
section-05-playwright-smoke
section-06-localstorage-hardening
section-07-service-worker-cache
END_MANIFEST -->

# Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable With |
|---------|------------|--------|---------------------|
| section-01-remove-top-level-awaits | - | 02, 04, 05 | 03 |
| section-02-error-handling | 01 | 04, 05 | 06 |
| section-03-cultivation-contradictions | - | 04 | 01 |
| section-04-test-coverage | 01, 02, 03, 06 | 05 | - |
| section-05-playwright-smoke | 01, 02, 04 | 07 | - |
| section-06-localstorage-hardening | 01 | 04 | 02 |
| section-07-service-worker-cache | 01, 02, 03, 04, 05, 06 | - | - |

## Execution Order (Batches)

1. **Batch 1** (parallel): section-01-remove-top-level-awaits, section-03-cultivation-contradictions
2. **Batch 2** (parallel, after Batch 1): section-02-error-handling, section-06-localstorage-hardening
   - File coordination: both touch main.js. Section 02 owns boot/error paths (top half). Section 06 owns backup/restore/auto-save (bottom half).
3. **Batch 3** (parallel, after Batch 2): section-04-test-coverage, section-05-playwright-smoke
4. **Batch 4** (sequential, after all): section-07-service-worker-cache

## Section Summaries

### section-01-remove-top-level-awaits
Replace all top-level `await import()` calls in 4 modules with memoized lazy-loader pattern. Keep `getActiveEdgeCases` synchronous in main.js (fire-and-forget eager load, replace function on resolution). Log import errors in catch handlers.

### section-02-error-handling
Replace 15+ empty catch blocks with labeled `console.error` calls. Create `error-banner.js` component with `showCriticalError()` / `dismissError()`. Fixed-position banner with padding-top adjustment. Handle early-boot calls when `#app-shell` doesn't exist. Wire triggers into storage save failures, boot crashes, migration failures, and debounced auto-save.

### section-03-cultivation-contradictions
Franco resolves 8 cultivation data contradictions across knowledge files. Add stage filters to mites-raise-rh and mites-spray rules (veg only). Unify drying temp (15-18C), seedling VPD (0.4-0.8), harvest amber (20-30%), epsom timing (before lights-on), cure burp (3x week 1), late-flower RH (45-50%). Also update edge-case-knowledge-supplemental.js.

### section-04-test-coverage
Add `runTests()` exports to 10+ untested modules. Schema validation for data modules, happy-path + edge-case tests for logic modules. Register all in test runner module list. Target: ~900+ assertions, ~70%+ file coverage.

### section-05-playwright-smoke
Add Playwright as sole npm devDependency. Create `playwright.config.js` with `webServer` config and `BASE_URL` env var support. One smoke test: store exists, sidebar has children, content has children, zero unexpected console errors. Add `node_modules/` to `.gitignore`. Update CLAUDE.md with Playwright exception.

### section-06-localstorage-hardening
Make `save()` return true/false. Fix debounced auto-save to capture return value and trigger error banner. Fix restore backup namespace mismatch (`growdoc-legacy-backup-` vs `growdoc-companion-backup-`). Clear both V1 and V2 migration flags in `restoreBackup()`. Add `lastSavedAt` as module-level variable (not reactive store) with Settings display.

### section-07-service-worker-cache
Bump `sw.js VERSION` string to force cache invalidation after sprint deploys. Final deploy step to ensure returning users get updated JS.
