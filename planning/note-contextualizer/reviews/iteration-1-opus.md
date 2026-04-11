# Opus Review — Iteration 1

**Model:** claude-opus-4 (via deep-plan:opus-plan-reviewer subagent)
**Generated:** 2026-04-11
**Target:** `claude-plan.md` + context files in `planning/note-contextualizer/`

---

# Review: Note Contextualizer Implementation Plan

## Summary

This plan is structurally sound and well-grounded in prior research, but it contains **one show-stopping mismatch** (the Plant Doctor wiring in Section 4 assumes a data model that does not exist in the Companion), **two significant execution risks** (ADVICE_RULES uses closures that cannot be JSON-roundtripped for parity tests, and Section 5 has dependency cycles in parallel Batch 3), and **several under-specified areas** that will block subagents when they try to implement. Several sections are also scoped too tightly for the work they actually contain.

My overall recommendation: **do not ship this plan to parallel subagents as-is**. Section 4's core premise needs to be rewritten, Section 2's parity harness needs to be redesigned, and Batch 3's supposed parallelism needs to be re-examined.

---

## 1. Architectural concerns

### 1.1 BLOCKING: Section 4's Plant Doctor wiring is built on a data-model that does not exist

This is the largest defect in the plan. The plan says:

> "`runDiagnosis` switch from ad-hoc recent-log reading to `getRelevantObservations` + `mergeNoteContext` + `adjustScoresFromNotes`"
> "After scoring, call `adjustScoresFromNotes(scoresMap, ctx)` and re-rank. Mirror `tool-plant-doctor.html:2284`."

But the Companion's actual `runDiagnosis` at `C:/GrowDoc/js/plant-doctor/doctor-engine.js:7` uses a completely different scoring model from the v3 standalone tool:

- v3 `SCORE_ADJUSTMENTS` target diagnosis IDs like `r-ca-def`, `r-n-def`, `r-ph-lockout`, `r-pest-mites`, `r-hermie-stress`, `r-overwater` (~60+ such IDs across `docs/note-context-rules.js:2477-`).
- Companion `doctor-data.js:12` scores by **human-readable condition names**: `'Nitrogen Deficiency'`, `'Calcium Deficiency'`, `'Overwatering'`, `'Heat Stress'`, `'Spider Mites'`, `'Fungus Gnats'`, etc.

These taxonomies do not overlap. `adjustScoresFromNotes` as ported will literally do nothing because no key in the `scoresMap` will match any adjustment's `adjustments['r-*']` key. The re-rank step (I2 in `04-integration-points.md`) becomes a no-op.

You have three choices, none trivial, and the plan does not pick one:

1. **Build a diagnosis-ID mapping table** (`r-n-def` → `'Nitrogen Deficiency'`, etc.) as a new file in Section 2 or 4. This is a 50–80 entry translation layer, has its own parity surface, and requires the implementer to be familiar with both taxonomies. Could be 100–150 extra lines.
2. **Port the v3 tool's entire SCORING system** (not just the note rules) and replace Companion's `doctor-data.js`. Huge scope expansion — essentially a Plant Doctor rewrite.
3. **Rebuild the `SCORE_ADJUSTMENTS` rule bodies** to target Companion's condition strings. This is the fastest path but requires writing 60+ rules by hand and throws away parity testing entirely.

Similarly, v3 `ADVICE_RULES` use `rule.condition(ctx, diagId)` where `diagId` is a v3-flavored ID. The Companion plant doctor has no such ID available to pass. `generateContextualAdvice` in Section 4 will either (a) always receive an undefined `diagId` and bypass diagnosis-specific rules entirely, falling back to only the generic-* rules, or (b) need the same translation layer as #1.

**Action:** Section 4 needs a sub-section called "Diagnosis ID bridge" that explicitly decides the approach, lists the mapping entries, and adds the parity case "ported rules fire for Companion conditions."

### 1.2 Parity test for `ADVICE_RULES` cannot use `JSON.stringify` equality

`ADVICE_RULES` and `SCORE_ADJUSTMENTS` are arrays of objects containing function closures (`condition: function(ctx, diagId) { ... }`). Functions serialize as `undefined` through `JSON.stringify`. A port of these arrays must:

1. Re-write every `condition` closure as a new ES-module function (hundreds of closures).
2. Verify parity by **calling both closures** against fixture ctxs and comparing booleans, not by stringifying the arrays.

**Action:** Rewrite Section 2 to distinguish pure-data port (`KEYWORD_PATTERNS`, `SEVERITY_HEURISTICS`, `ACTION_TAKEN_PATTERNS`) vs closure port (`ADVICE_RULES`, `SCORE_ADJUSTMENTS`). Each rule needs a `for rule of BOTH_RULES: assert(legacy.condition(ctx)===new.condition(ctx))` loop that hits every rule id.

Section 2 is not an M — it is an L/XL and should own a full batch by itself.

### 1.3 Module-scoped singleton is not test-friendly

The cache is a module-scoped `let cache = null`. Tests inside `note-contextualizer.test.js` that trigger a rebuild leave state in the module; the next test inherits it.

**Action:** Either (a) add an explicit `__resetForTests()` export in Section 1 and document that every test `beforeEach` must call it, or (b) make `collectObservations` / `mergeNoteContext` pure functions that accept a `{grow, profile}` argument and only the `initContextualizer` path touches the singleton. The latter is cleaner.

### 1.4 `Observation.id` hashing is unstable across text edits

Hashing `source+sourceRefId+text` means editing a log note's text changes the observation ID. `referencedIn[]` links stored on a prior advisor's output now point to a dead observation.

**Action:** State explicitly that editing a note orphans its citations. Require `sourceRefId` non-null for every source type except `profile`.

### 1.5 `referencedIn[]` is mutation-during-iteration prone

The plan contradicts the frozen-view pattern. Specify whether the index returned by `getObservationIndex()` is frozen or mutable. If frozen, `recordReferencedIn` needs a different mechanism (e.g. a sidecar `Map<obsId, Set<consumerId>>`).

---

## 2. Risks in the parallel-batching execution plan

### 2.1 Batch 1 dependency is fragile

S7-stub needs the Observation shape + severity enum + null-guard convention, which S1 defines. Either make S1 land first, or lock the JSDoc as immutable in `claude-spec.md` as frozen input both subagents treat as pre-committed.

### 2.2 Batch 3 parallelism is broken — S5 depends on S4

Realistic split:
- S4 = Plant Doctor only (`js/plant-doctor/*`).
- S6 = Harvest/stage/priority/dashboard — no file overlap with S5.
- S5 runs *after* S4 lands, because S5's anti-redundancy guards depend on the same `getRelevantObservations` surface S4 establishes.

Batch 3 becomes {S4, S6} parallel, then S5.

Also: S4's `doctor-engine.js:buildContext` uses `plants[0]` today. The plan says "use active plant id" but `activePlantId` may not exist. Pin this before starting S4.

### 2.3 Batch 4 is effectively Section 9 alone

S8 cannot run in parallel with S9 because S9 is still landing new files that S8 needs to verify. S8 must be serial-last. Batch 4 = {S7-final, S9} parallel, then S8 serial.

### 2.4 Rule-base delete in Section 2 breaks rollback profile

If Section 2 deletes 2947 + ~6500+ lines in a single commit and a parity bug is discovered two days later, reverting Section 2 rolls back the rule-base port AND resurrects dead code simultaneously.

**Action:** Split Section 2 into `2a. Port rule base + parity` (commit) and `2b. Delete legacy files` (separate commit, ideally rolled into Section 8 after full integration passes).

### 2.5 Parity test harness via `<script>` tag is brittle

Inside an ES module you cannot easily inject a classic `<script>` and synchronously wait for `var KEYWORD_PATTERNS` to become defined on `window`.

**Action:** Replace with "golden fixtures captured once from the legacy tool, committed to `js/tests/fixtures/note-context-legacy.json`." Parity testing becomes a pure comparison against frozen fixtures.

---

## 3. Missing integration points and edge cases

### 3.1 Service worker cache invalidation

`sw.js` caches `/js/**` with a stale-while-revalidate strategy. After deploying Section 2 (which deletes files), existing PWA installs still serve cached files until VERSION is bumped. Section 8 must bump `sw.js` VERSION as part of the commit.

### 3.2 Vercel rewrites don't catch deleted docs file

The plan says "redirect `/docs/tool-plant-doctor.html` → `/#plant-doctor`" but Vercel redirects cannot target hash fragments server-side.

**Action:** Add `redirects` (not `rewrites`) to `vercel.json`, target `/plant-doctor` or whatever the Companion router recognizes, verify the target route exists in `js/router.js` before adding the redirect.

### 3.3 `findActionsTakenSince` window collisions + wizard observations

Wizard-sourced observations (from `profile-context-rules.js` merged into Section 3) have no `observedAt` that reflects the user's actual activity. A user who wrote "I flush weekly" in onboarding would have a permanent `action-flushed` observation that blocks every flush task forever.

**Action:** Explicitly document that wizard-sourced observations DO NOT participate in `findActionsTakenSince`. Add a `source !== 'profile'` guard.

### 3.4 Severity chip on `task.notes` and `plant.notes` — legacy enum collision

`log.details.severity` is `'urgent' | 'concern' | null` today. Section 7's chip must write the LEGACY enum (aliased in the contextualizer), not `'alert' | 'watch' | 'info'`, or `task-engine.js:222-234` checks will silently stop firing on new logs.

**Action:** Section 7 must specify: "severity chip values are stored as `'urgent'|'concern'|null` on disk; the 3-label display is a presentation-only alias."

### 3.5 `doctor-engine.js:buildContext` uses `plants[0]` — fixing this has ripple effects

Grep before starting S4: if `activePlantId` is not already a canonical value, this becomes an implicit Section 4 sub-scope of ~50–100 lines.

### 3.6 Parse-error surface is under-specified

`parseObservation` cannot meaningfully fail. The only error path is exceptions thrown inside `rule.condition()` closures during `generateContextualAdvice` / `adjustScoresFromNotes`.

**Action:** Rename `parseErrors[]` to `ruleErrors[]`. Collect exceptions thrown inside closures.

### 3.7 Debounce window interacts badly with fast user input — BLOCKING

300ms debounce means: user writes note → clicks Save → task engine runs `generateTasks` immediately → contextualizer index has NOT yet rebuilt → new task is created from stale index. The success-criteria scenario literally does not work.

**Action:** Have `getObservationIndex()` do a hash check and rebuild in-place synchronously if the stored grow/profile hash has changed since the last rebuild, ignoring the debounced rebuild as just a "nice to have" optimization for reactive UI panels.

---

## 4. Under- / over-scoped sections

### 4.1 Section 2 is massively under-scoped

Actual scope is ~5–6 days:
- Port 984 keyword patterns (mechanical, ~1 day).
- Port ~150 ADVICE_RULES closures with individual behavioral parity tests (~2 days).
- Port ~60 SCORE_ADJUSTMENTS closures (~1 day).
- Build parity-test harness OR capture golden fixtures (~0.5 day).
- Merge `profile-context-rules.js` wizard-tagged rules (~0.5 day).
- Add `SEVERITY_HEURISTICS`, `ACTION_TAKEN_PATTERNS`, `FRANCO_OVERRIDE_RULE_IDS` (~0.5 day).
- Delete legacy files + grep + update `docs.json` + add vercel redirect (~0.5 day).

This is L/XL. Also needs an explicit ctx-shape field list (currently "same shape as legacy extractNoteContext output" hand-wave).

### 4.2 Section 5 is correctly L but the "override API" is hand-waved

The override creates a `source:'override'` observation, but synthetic observations that live only in memory contradict the plan's "projection-only" design. On the next store commit the projection rebuilds from scratch and the override is gone.

**Action:** Override must create a real `log` entry with `details.notes = 'Manual override of suppression'` so it's part of `grow.plants[i].logs` and survives projection. Pin this explicitly.

### 4.3 Section 9 is over-scoped at the stated complexity

The cure advisor has FIVE recommended actions but no decision rules are defined. A subagent cannot invent cannabis cure physics. Also the cure tracker rewrite from `docs/tool-cure-tracker.html` → Companion SPA view is a full migration (separate storage key `growdoc-cure-tracker` today), not an "upgrade."

**Action:** Move Section 9 to "out of scope for this plan, tracked as a follow-up" OR split into 9a (integrate cure notes as Observations — easy, S) and 9b (full advisor — deferred with decision rules written separately).

Also: `updateCureProfile` walks "historical cure observations" but backfill strategy isn't specified. Forward-only = every user sees "Using default curve" until their next cure completes.

### 4.4 Section 8 is under-scoped

`recordReferencedIn` has to be called from Plant Doctor, task engine (per-task), harvest advisor, dashboard banner, and cure advisor. ~5–10 new call sites across 5+ files. This is M, not S.

---

## 5. TDD-readiness

~60% of test stubs are concrete enough. The rest are too loose.

**Backwards test (BLOCKING):**
- "A fresh watch-severity note at 2 hours outranks a 6-hour-old alert from a different rule because severity sort is dominant." Severity sort is dominant, so a fresh watch should NOT outrank an old alert. This test is backwards.

**Under-specified:**
- Debug waterfall DOM-output assertion granularity not specified.
- "Shifts suggested RH range upward" has no concrete numeric oracle.

**Missing high-value tests:**
- Debounce + single-flight coalescing.
- `observedAt` inference across all three fallback paths.
- Q6(c) task-card contradiction banner rendering.
- Cross-plant isolation in cure advisor.
- Override cascade mitigation.
- S7-stub → S7-final upgrade path.

---

## 6. Sections that need rewrite for clarity

### 6.1 §4 "Core data shapes" — JSDoc is misleading

- `ParsedNote.ctx` is "same shape as legacy extractNoteContext output" hand-wave. Give a concrete field list.
- `Observation.domains` should be typed as string literal union in JSDoc, not `string[]`.

### 6.2 §6 "Weighting algorithm" — pseudocode is ambiguous

Rewrite as:
```
1. partition candidates by severity (alert | watch | info)
2. take only the top non-empty partition (severity-first)
3. within that partition, compute weight = 0.5^(age/halfLife) per candidate
4. return the highest-weight candidate
```

Also clarify Franco override is applied AFTER severity partition. A Franco-override info-level note still loses to any alert-level note unless we explicitly hoist it.

### 6.3 §8 "Integration points" — paste I# references inline

Paste the I# references from `04-integration-points.md` into the section definitions: "Section 5 owns I4, I5, I6, I7, I11."

### 6.5 §11 "Rollout" — rollback is insufficient

Reverting Section 5 does NOT restore note parsing because Section 2's deletes stand. Restate rollback or split Section 2 into 2a/2b.

---

## 7. Rule-base port (Section 2) — parity failure risks

- Rule execution order matters (`extractNoteContext` iterates in array order; later patterns overwrite earlier).
- `ctx.keywords` array order matters too.
- `profile-context-rules.js` merge in Section 3 has silent overlap (both define `/\bclones?\b/i`). Must dedupe or tag with `wizardStep`.

---

## 8. Cure advisor (Section 9) — impossibility check

At L complexity you cannot hit the listed contract without hardcoded decision rules. The cure tracker rewrite is 3–5 days by itself. The advisor's FIVE recommended actions need a ~20-field decision matrix that a subagent cannot invent without Franco consultation.

**Action:** Move Section 9 to out-of-scope OR split into 9a/9b.

---

## 9. Additional concerns

- Memory footprint at 500 observations is borderline on low-end Android PWAs (~2–5 MB).
- `_resetForTests` + SW caching intersection: test runner in installed PWA loads via SW cache; hard-reload context needed.
- `recordReferencedIn` concurrency across two advisors in the same tick.
- Debug waterfall rate-limiting: no cap on DOM rows in production-with-?debugNotes=1.
- Auto-severity heuristic regex issue: `/\bbad|terrible|worst\b/i` — without parentheses, `\b` only binds `bad`.
- `?debugNotes=1` parameter persistence across SPA route changes not specified.
- CLAUDE.md secrets audit: no new env vars should be explicitly stated in Section 8.
- `docs/tool-cure-tracker.html` has existing `growdoc-cure-tracker` key with stored user data — Section 9 must migrate it.

---

## Specific line-level nits

- `js/data/profile-context-rules.js # DELETED in Section 2` — actually Section 3.
- JSDoc optional syntax inconsistency (`{string=}` vs `{string} [name]`).
- `domains` list has `'burp-interval'` — typo?
- `wilt-severe` Franco override — wildcard or single ID?
- "984 patterns" — exact or approximate?
- Advisors "accept a notes parameter" — default it to `notes = []` to preserve backwards compat.
- `/docs/tool-plant-doctor.html → /#plant-doctor` redirect won't work (hash fragments are client-side).

---

## Recommended plan changes, prioritized

1. **Fix Section 4's core premise** (diagnosis ID mapping) — BLOCKING.
2. **Split Section 2 into pure-data port vs closure port** — BLOCKING for parity.
3. **Fix Batch 3 parallelism** — move S5 serial-after-S4 — HIGH.
4. **Move Section 8 out of Batch 4** into a serial-final step — HIGH.
5. **Pin the `activePlantId` source** — HIGH.
6. **Replace dynamic script-tag parity test with golden fixtures** — HIGH.
7. **Clarify debounce-vs-sync-rebuild semantics** — HIGH.
8. **Pin the override API shape and persistence (real log entry)** — HIGH.
9. **Add SW version bump to Section 8 deploy checklist** — MEDIUM.
10. **Split Section 9 into 9a/9b** or defer decision rules — MEDIUM.
11. **Rewrite §6 weighting pseudocode** — MEDIUM.
12. **Fix the test at line 361 (it's backwards)** — LOW.
13. **Fix vercel.json redirect** (use redirects, not hash fragment) — LOW.
14. **Specify __resetForTests export or make core functions pure** — LOW.
15. **Add cure-tracker data migration step** — LOW.

---

## Bottom line

At the 10,000-foot level the design is correct. At the 100-foot level, it is not implementation-ready. Section 4 is built on a taxonomic mismatch. Section 2 is scoped 3–4× too small. Batch 3 parallelism is wrong. The success-criteria scenario literally cannot work under the 300ms debounce.

Do one more pass on the plan — maybe 2–3 hours with the real codebase open — to fix the blocking items, then ship. Do not start parallel subagents until Section 4 has its diagnosis ID bridge pinned.
