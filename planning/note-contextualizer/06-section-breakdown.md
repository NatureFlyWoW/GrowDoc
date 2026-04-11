# 06 — Proposed /deep-plan Section Breakdown

8 sections. Sections 4–6 are where the user will *feel* the "notes feel ignored" pain disappear.

## Section 1 — Observation schema + projection (S)

**Scope.** Define `Observation` and `ParsedNote` JSDoc types in `js/data/observation-schema.js`. Implement `collectObservations(grow, profile, opts)` walking `profile.notes`, `plant.notes`, `plant.logs[*].details`, `grow.tasks[*].notes` and emitting Observation objects with `source`, `plantId`, `observedAt`, `stageAtObs` inferred from `plant.stageStartDate`. No parsing yet. Pure, deterministic, easy to test.

**Files (new).** `js/data/observation-schema.js`, `js/data/note-contextualizer/index.js` (stub), `js/tests/note-contextualizer.test.js`.

**TDD.** Fixtures of minimal grow states → expected observation arrays. Golden-file snapshot test.

**Complexity.** S.

---

## Section 2 — Port the rule base to ES modules (M)

**Scope.** Split `docs/note-context-rules.js` (2947 lines) into three ES module siblings: `rules-keywords.js`, `rules-advice.js`, `rules-score.js`. Add `DOMAIN_BY_RULE_ID` and `ACTION_TAKEN_PATTERNS`. Decision on bridge-vs-fork is open question #1. Add `parseObservation(obs)` producing `parsed.ctx` identical to `extractNoteContext` output.

**Files (new).** `js/data/note-contextualizer/rules-keywords.js`, `rules-advice.js`, `rules-score.js`, `rules-domains.js`.
**Files (touched).** `docs/note-context-rules.js` only if we bridge.

**TDD.** Round-trip: feed the existing v3 test notes from `tool-plant-doctor.html:6349-6376` through `parseObservation` and assert identical `ctx` output.

**Complexity.** M.

---

## Section 3 — Merge, query, weighting (M)

**Scope.** Implement `mergeNoteContext`, `getRelevantObservations`, `findActionsTakenSince`, and the recency-decay resolver from 03-design.md §Weighting. Introduce the `FRANCO_OVERRIDE_RULE_IDS` set.

**Files (new).** `js/data/note-contextualizer/merge.js`, `weighting.js`. Extended: `index.js`, test file.

**TDD.** Property tests:
- newer alert outranks older alert
- action-taken within 48h blocks corresponding task type
- franco-override list bypasses decay
- sensor-fresh vs note-alert: note wins unless sensor <2h and matches franco-override rule

**Complexity.** M.

---

## Section 4 — Wire Companion Plant Doctor to the contextualizer (M)

**Scope.** Rewrite `js/plant-doctor/doctor-engine.js` `buildContext` and `runDiagnosis` to call `getRelevantObservations`, `mergeNoteContext`, `adjustScoresFromNotes`, `generateContextualAdvice`. Use the *active* plant, not `plants[0]`. Update `doctor-ui.js` to render "Your Action Plan" block with traceability links back to specific observations.

**Files (touched).** `js/plant-doctor/doctor-engine.js`, `js/plant-doctor/doctor-ui.js`.

**TDD.** End-to-end: seed a plant with 2 logs including "ph was 5.0" and "tips burning" → run diagnosis for "yellowing upper leaves" → confirm `r-ph-lockout` score boosted and Your Action Plan includes ph-related advice.

**Complexity.** M.

---

## Section 5 — Task engine note-awareness (L)

**Scope.** Implementation items I4–I7 from 04-integration-points.md. **Biggest impact on the "notes feel ignored" pain.** Anti-redundancy guards. Contradiction detection for env triggers. Diagnose-trigger severity from free text. Add `suppressedBy` metadata on suppressed tasks.

**Files (touched).** `js/components/task-engine.js`.
**Files (new).** `js/components/task-engine-note-guards.js` (split for readability).

**TDD.** Scenarios:
1. Log note "just flushed" within 24h → no water task next cycle
2. Alert observation "leaves drooping" with fresh in-range VPD → env-discrepancy task emitted
3. No observation → existing behavior preserved (regression guard)
4. Task note saved → follow-up "check improvement" task fires

**Complexity.** L.

---

## Section 6 — Note-aware advisors: harvest, stage, priority (M)

**Scope.** Items I8, plus harvest-advisor, stage-rules, and priority-engine consume note context. Folds signals like `aroma-lemon-pine`, `trichomes-milky`, `trichomes-amber-20` into `tradeoffNote`. Adds "user thinks early/late" override that shifts confidence ±10%.

**Files (touched).** `js/data/harvest-advisor.js`, `js/data/stage-rules.js`, `js/data/priority-engine.js`. Possibly `js/components/trichome-sliders.js`.

**TDD.** Given `trichomes={milky:70,amber:10}` + note "smells like fresh lemon, want max terps" → `harvest-now`, confidence high, tradeoffNote cites the aroma observation.

**Complexity.** M.

---

## Section 7 — UI affordances + traceability (M)

**Scope.** Items I10, I11, I13 and all of 05-ui-changes.md. Severity chips, parsed-signal preview, contradiction banner, stage-transition note capture, plant-detail "Recent observations" widget.

**Files (touched).** `js/components/log-form.js`, `js/components/task-card.js`, `js/views/plant-detail.js`, `js/views/my-grow.js`, `js/views/dashboard.js`, `style.css` (new chip styles using `var(--accent)` / `var(--warning)`).

**TDD.** Component tests with fake DOM: severity chip click sets value; parsed-signal preview updates on blur; contradiction banner renders when conflicting note+log exist.

**Complexity.** M.

---

## Section 8 — Traceability, debug panel, deploy (S)

**Scope.** Implement `recordReferencedIn` backlinks. Add a developer-facing "why did this advice show up?" debug panel behind `?debugNotes=1`. Run full test suite. `vercel --prod`. Manual verification script.

**Files (touched).** `js/main.js` (query param hook), `js/views/plant-detail.js` (debug panel), `scripts/verify-notes.mjs` (new manual verification script).

**TDD.** Snapshot the debug panel output for a fixture grow. Assert `referencedIn` arrays populated after advice generation.

**Complexity.** S.
