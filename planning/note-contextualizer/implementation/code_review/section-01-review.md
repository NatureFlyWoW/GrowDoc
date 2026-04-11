# Section-01 Code Review

## Blocking

None — the implementation compiles and the public API is present. No data-loss or crash bugs spotted.

## Should fix

1. **`getRelevantObservations` hidden storeRef mutation** (`js/data/note-contextualizer/index.js:348`): silently rewires the module singleton when a caller passes a different store. Defeats the `initContextualizer` contract. Drop the mutation; if storeRef is null return empty.

2. **Dead code `rebuildInFlight`** (`index.js:29`): declared and cleared in `__resetForTests` but never assigned. Because the rebuild is synchronous there is no concurrency window. Delete it or document the sync-rebuild no-op.

3. **Idempotency assertion too weak** (test 17): double-calls `initContextualizer(store)` and then confirms the index rebuilds after a commit, but the rebuild would happen via hash check regardless. Does not prove the subscriber fired or that only ONE was installed.

4. **No test proves `profile` subscription exists** — test 17 only commits `grow`. Add a `store.commit('profile', ...)` assertion.

5. **Severity mapping only tests one of three branches**: test 4 asserts `'urgent' → 'alert'` but not `'concern' → 'watch'` or `null → 'info'`.

6. **`observedAt` inference coverage gap**: test 4 asserts log.timestamp. Nothing asserts `plant.stageStartDate || plant.createdAt` fallback for plant source, nor `task.updatedAt || task.createdAt` for task source.

7. **`computeHash` relies on JSON length + 16-bit suffix** (`index.js:236-261`): `stringHash(growJson).slice(0,4)` is 16 bits — 1-in-65k miss rate when a same-length edit changes a note. Use the full 8-char `stringHash` digest.

8. **`ctx` stub is `{}`** — downstream merge code in section-04 will probably iterate it. Flag for section-03 reviewer.

## Nits

1. `SEVERITY_DISPLAY` lookup table is unused dead code inside `mapSeverity`.
2. `createdAt` inside `collectObservations` is "time of projection" not "time of authorship" — needs a JSDoc clarifier.
3. `parseObservation` stub mutates the argument in place — clarify in JSDoc.
4. Test 18 uses `try { idx.all.push({}) } catch { threw = true }` with a `|| idx.all.length === 1` escape hatch — tighten to require `threw`.
5. `makeObservationId` is module-private; exposing via test namespace would let the deterministic-id test cover hash behavior directly.
6. `initContextualizer` re-assigns `storeRef = store` before the `subscribed` short-circuit — a second call with a different store silently rebinds.

## Test gaps vs the 18 spec bullets

| Spec bullet | Covered? | Note |
|---|---|---|
| empty grow → empty array | yes (test 1) | |
| profile.notes per wizardStep | yes (test 2) | |
| plant.notes per plant | yes (test 3) | |
| log.details.notes observedAt | yes (test 4) | |
| tasks[*].notes plantId | yes (test 5) | |
| id deterministic | yes (test 7) | |
| id differs on rawText change | yes (test 8) | |
| observedAt inference log/plant/task | **partial** — only log branch asserted |
| profile has wizardStep, no sourceRefId | yes (test 2) | |
| non-profile has sourceRefId | yes (test 9) | |
| opts.plantId | yes (test 10) | |
| opts.since | yes (test 11) | |
| opts.domains empty | yes (test 12) | |
| initContextualizer subscribes, fires on grow commits | **weak** — no subscriber proof, no profile commit |
| initContextualizer idempotent | **weak** — does not prove single subscription |
| __resetForTests clears | yes (test 22) | |
| pre-init empty | yes (test 16) | |
| .all frozen | yes (tests 16, 18) | |

## Section-boundary compliance

Clean — no leaks into `ui.activePlantId`, CSS, HTML, `sw.js`. `main.js` edits are limited to the import, the startup call, and the test registration.
