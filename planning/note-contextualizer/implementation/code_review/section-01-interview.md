# Section-01 Code Review Interview

Triage note: none of the review items carry real tradeoffs or security concerns —
all are obvious improvements or test gaps. Applying all as auto-fixes without
interrupting the user. Decisions logged below for traceability.

## Auto-fixes applied

### SHOULD-FIX 1 — Drop hidden storeRef mutation in `getRelevantObservations`
**File:** `js/data/note-contextualizer/index.js`
**Fix:** remove the `if (store && store !== storeRef) storeRef = store;` line. If
`storeRef` is null, return `[]`. `initContextualizer` remains the only
code path that binds the module singleton.

### SHOULD-FIX 2 — Delete dead `rebuildInFlight`
**File:** `js/data/note-contextualizer/index.js`
**Fix:** remove the `rebuildInFlight` declaration and its `__resetForTests` clear.
Rebuild is synchronous, so single-flight is a no-op. Added a short comment
explaining the choice so a future reader understands why.

### SHOULD-FIX 3 — Harden idempotency test with a subscription counter
**File:** `js/tests/note-contextualizer.test.js`
**Fix:** new test wraps `createStore()` in a tiny spy that counts `subscribe()` calls
per path. Double-calls `initContextualizer(wrap)` and asserts `subCount.grow === 1`
and `subCount.profile === 1`. This proves the guard works, not just the hash check.

### SHOULD-FIX 4 — Add profile commit rebuild test
**File:** `js/tests/note-contextualizer.test.js`
**Fix:** new test initializes the contextualizer, primes the cache, commits a new
`profile` snapshot with a wizard note, and asserts `getObservationIndex()` now
contains the profile observation with the right `wizardStep`.

### SHOULD-FIX 5 — Complete severity mapping coverage
**File:** `js/tests/note-contextualizer.test.js`
**Fix:** extend test 4 to build three logs — `severity:'urgent'`, `'concern'`, `null`
— and assert each maps to `'alert'|'watch'|'info'` respectively. Also assert
`severityAutoInferred: false` default.

### SHOULD-FIX 6 — `observedAt` fallback coverage
**File:** `js/tests/note-contextualizer.test.js`
**Fix:** new test for the plant source asserts `observedAt === plant.stageStartDate`
when present; another asserts the task source uses `task.updatedAt`.

### SHOULD-FIX 7 — Full 8-char hash in `computeHash`
**File:** `js/data/note-contextualizer/index.js`
**Fix:** replace `stringHash(growJson).slice(0,4)` with the full 8-char FNV-1a
digest. Same cost, 65k× better collision resistance on same-length note edits.

### SHOULD-FIX 8 — (no code change)
Flag forwarded to section-03: the `ParsedNote.ctx` stub is `{}`; section-03
must preserve non-null identity when the real keyword parser lands so
section-04's merge code can iterate safely.

### NIT 1 — Inline `SEVERITY_DISPLAY` constant
**File:** `js/data/note-contextualizer/index.js`
**Fix:** delete `SEVERITY_DISPLAY` and inline the two literals in `mapSeverity`.

### NIT 2 — JSDoc clarifier on `createdAt`
**File:** `js/data/note-contextualizer/index.js`
**Fix:** add one line explaining `createdAt` is "time of projection, not time of
authorship" so future readers don't treat it as stable across rebuilds.

### NIT 3 — JSDoc note that `parseObservation` mutates its argument
**File:** `js/data/note-contextualizer/index.js`
**Fix:** add `@mutates obs` line.

### NIT 4 — Tighten frozen-array assertion in test 18
**File:** `js/tests/note-contextualizer.test.js`
**Fix:** replace `threw || length === 1` with `threw` — strict mode always throws.

### NIT 6 — `initContextualizer` re-bind guard
**File:** `js/data/note-contextualizer/index.js`
**Fix:** move `storeRef = store` below the `if (subscribed) return` guard. A
second call with the same store is still a no-op; a second call with a
*different* store is rejected with a `console.warn` rather than silent
rebind. GrowDoc has exactly one store, so this is pure defensive hygiene.

## Nits intentionally left

- **NIT 5** (expose `makeObservationId` for direct testing): the existing
  determinism test via `collectObservations` is adequate and avoids widening
  the module surface.

## Files touched during fix pass

- `js/data/note-contextualizer/index.js`
- `js/tests/note-contextualizer.test.js`
