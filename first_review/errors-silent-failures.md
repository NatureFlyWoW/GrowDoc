# Silent Failure Inventory

Errors that produce zero console output and zero visible feedback — the most dangerous category.

## CRITICAL

- **main.js:38** — `catch { /* engine not ready */ }` on the top-level `await import('./data/edge-case-engine.js')`. If the engine exists but throws for a *different* reason (syntax error, missing transitive dependency) the app boots with no edge-case support and no indication why. The comment text is misleading — "engine not ready" conceals genuine errors.

- **main.js:117** — `catch { /* engine not ready */ }` on `getActiveEdgeCases(...)` inside the `timeline` route handler. Same problem: every runtime failure in the engine is indistinguishable from a missing file.

- **task-engine.js:24** — `catch (_importErr) { /* edge-case-engine.js not yet available */ }` on the top-level `await import('../data/edge-case-engine.js')`. Discards all import errors. A broken engine silently degrades to the fallback without any console trace.

- **doctor-ui.js:18** — Identical pattern: `catch (_importErr) { /* edge-case-engine.js not yet available */ }`. Third independent silent import suppression of the same module.

- **timeline-bar.js:18-20** — Fourth copy: `catch { /* file not yet created */ }`. The comment is stale (the file now exists); errors are permanently hidden.

- **doctor-ui.js:317** — `.catch(() => { ... render original advice ... })` on `applyDoctorSuppression(...)`. The catch swallows the error and renders unsuppressed advice — the user sees no sign of the failure. Not logged.

## HIGH

- **storage.js:55-58** — Inner `catch { }` after compaction retry on `QuotaExceededError`. If the retry write still fails, the block exits silently; outer error path then logs once, but the inner failure path has no logging at all.

- **storage.js:313-316** — `checkQuota()` has `catch { /* Ignore — return zero usage */ }`. If localStorage.getItem throws mid-loop, quota reads zero, the warning threshold never fires, and users get no storage warning until a hard write failure.

- **storage.js:139** — `checkCapacity()` has `catch { }` — capacity returns zero on failure with no logging.

- **note-contextualizer/index.js:414-416** — `_walkCureTracker` call inside `collectObservations` is wrapped in `try { } catch (_err) { }` — all errors from cure-tracker projection silently drop observations.

- **migration.js:45-51** — `_backupLegacyKey()` has `catch { /* Ignore backup failures */ }`. If backup silently fails and migration then corrupts data, the backup users would rely on was never written. No logging.

- **store.js:94-96** — JSON.parse fallback in `_deepClone` has `catch { return obj; }` — returns the original mutable reference. Callers assuming they have an isolated clone can inadvertently share object references, creating hard-to-trace state corruption with zero error signal.

## MEDIUM

- **dashboard.js:134** — `try { recordReferencedIn(...) } catch { /* best-effort */ }` — no logging.
- **task-engine.js:302, 608** — Three `try { recordReferencedIn(...) } catch (_err) { /* best-effort */ }` blocks — all silent.
- **task-engine.js:160-162** — `_collectPlantObservations` catch block: `catch (_err) { return {}; }` — observation collection failure is hidden; tasks silently run with no note context.
