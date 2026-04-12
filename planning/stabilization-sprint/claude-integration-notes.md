# Integration Notes — Opus Review Feedback

## Issues Integrated (19 of 26)

### Section 1: Top-Level Awaits

**Issue 3 (CRITICAL) — sync vs async getActiveEdgeCases.** Integrating. The timeline view calls `getActiveEdgeCases()` synchronously at main.js:116. After lazy-loading, `_getEngine()` returns a Promise, so the function can't be naively made async. Fix: keep `getActiveEdgeCases` sync — it returns `[]` until the engine loads. On first `_getEngine()` resolution, replace the function with the real one. The first timeline render may miss edge cases (acceptable graceful degradation); subsequent renders get them.

**Issue 4 — .catch(() => null) should log.** Integrating. The memoized loader's catch must include `console.error` to avoid contradicting Section 2's goal of eliminating silent failures.

**Issue 1 — second await in doctor-ui.js fallback.** NOT integrating. Verified: line 29 is `await import(...)` inside `async function _loadEdgeCasesDoctor()` — a function-body await, not a top-level await. The reviewer misread the code.

**Issue 2 — task-engine.js fallback nested await.** NOT integrating. The plan already says the fallback path stays as-is. This was a clarification, not an error.

### Section 2: Error Handling

**Issue 5 — grep pattern for empty catches.** Integrating as a note. The `catch\s*{` grep is a quick verification, not comprehensive. Plan updated to also grep for catch blocks lacking `console.error`.

**Issue 6 — fixed position vs pushes content down.** Integrating. These are contradictory. Choosing fixed position + dynamic padding-top on `#app-shell` when banner is visible, removed on dismiss.

**Issue 7 — showCriticalError during early boot.** Integrating. `showCriticalError` must handle `#app-shell` not yet existing — fall back to `document.body.prepend()`.

**Issue 8 (CRITICAL) — debounced auto-save ignores save() return.** Integrating. The debounced callback in main.js:65 wraps `save()` in an arrow function whose return is discarded. Fix: the debounced callback must capture the return value and call `showCriticalError()` on false.

### Section 3: Cultivation

**Issue 9 — ctx.stage availability in advice rules.** Partially integrating. Verified `ctx.stage` IS populated by rules-keywords.js:515-518, but plan should note that implementer must verify the stage field name matches between the contextualizer pipeline and the condition function.

**Issue 10 — edge-case-knowledge-supplemental.js has stale values.** Integrating. Verified: the supplemental file contains epsom timing guidance (line 426-440) and harvest amber references (line 216-218) that may conflict with canonical values. Added to files-to-update list.

### Section 4: Tests

**Issue 11-13** — NOT integrating. The 900+ target is aspirational; DOM test cleanup is standard practice; line numbers are inherently approximate.

### Section 5: Playwright

**Issue 14 — update CLAUDE.md.** Integrating. Document the Playwright exception to the "no npm deps" rule.

**Issue 15 — node_modules in .gitignore.** Integrating. Verified `.gitignore` does NOT have node_modules. Must add it.

**Issue 16 — use Playwright webServer config.** Integrating. Better than the vague "python or npx serve" suggestion. Playwright's `webServer` config starts/stops the server automatically.

**Issue 17 — "zero console errors" false positives.** Integrating. After Section 2, non-critical catches will log to console.error. The smoke test must filter for critical/unexpected errors only, not treat any console.error as a failure.

**Issue 26 — production URL support.** Integrating. Add `BASE_URL` env var to Playwright config so it can run against production.

### Section 6: localStorage

**Issue 18 (CRITICAL) — backup namespace mismatch explicit fix.** Integrating with explicit direction. Verified: `migration.js:49` writes `growdoc-legacy-backup-{key}`, `main.js:345` searches `growdoc-companion-backup`. Fix: update `main.js` to search for `growdoc-legacy-backup-` prefix.

**Issue 19 (CRITICAL) — restoreBackup must clear both migration flags.** Integrating. Verified: `main.js:367` only clears V1_FLAG. `_alreadyMigrated()` checks both V1 and V2 flags. Must clear both.

**Issue 20 (CRITICAL) — lastSavedAt infinite loop.** Integrating. Storing lastSavedAt in the reactive `ui` store key triggers a commit -> save -> update lastSavedAt -> commit loop. Fix: use a module-level variable (`let _lastSavedAt = null`) outside the reactive store. Settings view reads it directly from the exported variable.

### Cross-cutting

**Issue 22 — Section 2 and 6 share main.js in parallel.** Integrating as batching note. Both sections touch `main.js` — specify ownership boundaries (Section 2 owns boot/error paths, Section 6 owns backup/restore/auto-save).

**Issue 23 (CRITICAL) — service worker cache.** Integrating. Verified: `sw.js` uses `VERSION = '2026-04-nc2'` for cache names. After this sprint deploys, returning users will get stale cached JS. Plan updated: bump `sw.js VERSION` string as the final deploy step.

## Issues NOT Integrated (7 of 26)

| Issue | Reason |
|-------|--------|
| 1 (doctor-ui fallback) | Reviewer misread — line 29 is a function-body await, not top-level |
| 2 (task-engine fallback) | Plan already handles correctly; clarification only |
| 11 (900+ target basis) | Aspirational target is fine |
| 12 (error-banner test side effects) | Standard DOM test cleanup; not plan-level detail |
| 13 (line number drift) | Line numbers are inherently approximate in plans |
| 21 (spec vs plan parallelization) | Plan already has correct batching |
| 24 (rollback strategy) | Deploy-after-each-section IS the rollback strategy |
| 25 (aggressive grep pattern) | The grep is a verification step; implementer adjusts as needed |
