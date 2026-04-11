# Integration Notes — Opus Review Iteration 1

Review at `reviews/iteration-1-opus.md`. Authority on what to integrate rests with me (Claude) after verifying claims against the codebase. Each item below is marked **INTEGRATE**, **MODIFIED**, **DEFER**, or **REJECT**.

---

## Verification pass — checked claims against the real codebase

Before deciding, I verified Opus's biggest claims by reading source:

1. **Taxonomy mismatch — CONFIRMED.** `js/plant-doctor/doctor-data.js` uses human-readable condition strings (`'Nitrogen Deficiency'`, `'Overwatering'`, `'Heat Stress'`, `'Calcium Deficiency'`, `'Spider Mites'`, `'Root Rot'`, etc.). v3 `docs/note-context-rules.js` uses `r-*` IDs (`r-n-def`, `r-overwater`, `r-ph-lockout`, ...). The taxonomies do not overlap. A direct port of `SCORE_ADJUSTMENTS` is a no-op in the Companion.
2. **`activePlantId` does NOT exist** anywhere in `js/` — confirmed via Grep. Fixing `plants[0]` in `doctor-engine.js:76` requires inventing a new store slot.
3. **`sw.js:23 VERSION = 'dev'`** — confirmed. Deploy must bump.
4. **`vercel.json` has NO `redirects` array** — confirmed; only `rewrites`.
5. **`doctor-engine.js:76 buildContext` uses `plants[0]`** — confirmed.
6. **`doctor-data.js` comment at line 4**: "Full 44 conditions × 42 symptoms data will be imported from `/docs/plant-doctor-data.js` at runtime via dynamic import." So the Companion plant doctor has TWO data files: `doctor-data.js` is a placeholder and `docs/plant-doctor-data.js` is the full dataset. Both use condition strings, not `r-*` IDs.

Opus's critical findings are accurate and grounded. Integration proceeds.

---

## BLOCKING items — integrate before plan ships

### O1.1 Section 4 diagnosis-ID bridge — INTEGRATE (Option 3: rewrite)

**Opus recommendation:** three options — (1) mapping table, (2) port full v3 scoring, (3) rewrite `SCORE_ADJUSTMENTS` against Companion conditions.

**My decision:** **Option 3 — rewrite.** Rationale:
- Option 1 forces us to ship BOTH taxonomies and a bridge. Complexity without benefit since v3 is deprecated (Q8).
- Option 2 is a full Plant Doctor rewrite. Out of scope.
- Option 3 is the cleanest — Companion conditions become the single source of truth, and we write `~30–40` condition-targeted adjustment rules from scratch against the 44 real Companion conditions.

**Implication.** Section 2's scope **shrinks** (no closure-port for `ADVICE_RULES` + `SCORE_ADJUSTMENTS`) but Section 4 picks up a new sub-scope: authoring `SCORE_ADJUSTMENTS` and `ADVICE_RULES` as new ES modules targeted at Companion condition names. This is ~30–40 adjustment rules and ~50 advice rules (much less than the 150+ in v3 because we only author what's relevant to the 44 Companion conditions).

**New section ownership:**
- Section 2 owns: `KEYWORD_PATTERNS` port + parity (984 patterns, pure data), `SEVERITY_HEURISTICS`, `ACTION_TAKEN_PATTERNS`, `DOMAIN_BY_RULE_ID`, `FRANCO_OVERRIDE_RULE_IDS`, legacy file deletion. No closure port.
- Section 4 owns: authoring fresh `rules-score.js` and `rules-advice.js` targeted at Companion condition names, plus the Plant Doctor wiring.

### O1.2 Section 2 parity strategy — INTEGRATE (golden fixtures, KEYWORD_PATTERNS only)

Given O1.1, the only thing that needs parity is `KEYWORD_PATTERNS` + `extractNoteContext` equivalence. ADVICE_RULES + SCORE_ADJUSTMENTS are rewritten from scratch (Companion taxonomy) and get behavioral tests but no legacy parity.

**Implementation:** Capture golden fixtures once by running the legacy `extractNoteContext` in a browser against ~25 representative notes, commit the `{input, expected_ctx}` pairs to `js/tests/fixtures/note-context-legacy.json`. Section 2's parity test becomes `import fixtures; for each fixture: assert(parseObservation({rawText:fixture.input}).parsed.ctx === fixture.expected_ctx)`. No `<script>` tag juggling.

### O2.2 Batch 3 parallelism — INTEGRATE (partial serialization)

**My decision:** Batch 3 = `{S4, S6}` parallel, then `S5` serial. Section 5 depends on Section 4's established `getRelevantObservations` + `mergeNoteContext` surface and both touch `task-engine.js`. Section 6 touches different files so is safe to parallel with S4.

### O2.3 Batch 4 — INTEGRATE (S8 serial-last)

**My decision:** Batch 4 = `{S7-final, S9a, S9b}` parallel, then `S8` serial. S8 verifies + deploys; cannot run while files are still landing.

### O2.5 + O3.7 Debounce + sync rebuild — INTEGRATE

This is the one that would cause the success criteria scenario to literally not work. **My decision:** `getObservationIndex()` does a synchronous hash-check and rebuilds inline if the hash has changed since the last rebuild. The 300ms debounce only applies to the UI-reactive `store.subscribe` path (e.g. Plant Detail "Recent observations" widget re-renders on rebuild). Advisors and task-engine callers get fresh state synchronously whenever they call `getRelevantObservations`.

**Implication.** Single-flight coalescing is still valuable for the debounced UI path (multiple panels requesting the index during a 300ms window share a rebuild). But advisors never wait.

### O4.2 Override API persistence — INTEGRATE

**My decision:** Override creates a real `log` entry with `type:'override'`, `details.notes:'Manual override: <task-type>'`, and `details.severity:null`. This survives projection rebuilds because it lives in `grow.plants[i].logs`. The override log's `action-taken` parse matches the original task type's debounce window, re-blocking the task for its normal interval. User sees one log entry, one suppression, no ghost state.

### O3.5 `activePlantId` source — INTEGRATE (new sub-scope in Section 4)

**My decision:** Section 4 introduces `store.state.ui.activePlantId`, set by:
1. Plant Detail view on mount.
2. Plant Doctor launched from a plant card.
3. Defaults to `plants[0]?.id` if never set.

Wires: `js/store.js` constants (`UI_FIELDS` or equivalent), `js/views/plant-detail.js` mount hook, Plant Doctor launch handlers. ~30 lines of additive work.

---

## HIGH priority items — integrate

### O3.1 Service worker VERSION bump — INTEGRATE

**My decision:** Section 8 deploy checklist explicitly bumps `sw.js:23 VERSION` from `'dev'` to a timestamp or incremented value (e.g. `'2026-04-nc1'`). Documented as mandatory.

### O3.2 vercel.json redirect — INTEGRATE (revised)

Since we're deleting `docs/tool-plant-doctor.html` entirely and v3 is deprecated, I **won't add a redirect**. Users who land on the 404 see the standard browser error; in practice nobody deep-links to the deprecated POC. **Decision: delete the file + `docs.json` entry + add a note in the release commit. No vercel.json change.**

### O3.4 Severity chip write-side — INTEGRATE

**My decision:** The severity chip in `log-form.js` writes the LEGACY enum values (`'urgent'|'concern'|null`) to `log.details.severity`. The 3-label display (`alert|watch|info`) is a presentation-only alias resolved in the component. This preserves backwards compatibility and keeps `task-engine.js:222-234` intact. Section 7 specifies this explicitly.

### O3.3 Wizard observations + action-taken guard — INTEGRATE

**My decision:** `findActionsTakenSince` skips observations where `source === 'profile'` (wizard/onboarding). Wizard priors are long-lived preferences, not events. Explicitly documented in Section 3.

### O4.3 Section 9 split — INTEGRATE (9a + 9b)

**My decision:** Split Section 9 into:
- **9a. Cure note projection + severity chip (S).** Walk `docs/tool-cure-tracker.html` localStorage + existing cure logs, wrap into Observations with `source:'cure'`, add severity chip + parsed-signal strip to the existing cure-tracker UI (no full rewrite yet). Feeds into the debug waterfall and general observation index.
- **9b. Cure advisor feedback loop (L, DEFERRED to follow-up plan).** Full advisor module, strain profiles, decision rules. **Requires Franco consultation** for the decision-rule matrix (burp-now / wait / open-longer / seal / stop triggers). Carved out as a separate plan; not part of this deep-plan output.

**Rationale.** The user explicitly chose "full feedback loop" in Q5 of the interview. I'm honoring that intent by locking the full design in `9b-future.md` as a follow-up plan, but not blocking this iteration on it. The immediate note-contextualizer value (9a) ships now.

### O4.4 Section 8 scope bump — INTEGRATE

**My decision:** Section 8 is re-rated S → M. The `recordReferencedIn` wiring across 5–10 call sites is real work, not a one-liner.

---

## MEDIUM items — integrate

### O1.3 Module singleton test-friendliness — INTEGRATE (pure functions)

**My decision:** `collectObservations(grow, profile, opts)` and `mergeNoteContext(observations)` are pure — they take arguments, return values, touch nothing. Only `initContextualizer(store)` + `getObservationIndex()` touch the singleton. Tests call pure functions directly with inline fixtures. `__resetForTests()` exported for the rare test that exercises the subscription path.

### O1.5 `recordReferencedIn` semantics — INTEGRATE (sidecar Map)

**My decision:** `referencedIn[]` does NOT live on the Observation objects themselves. Instead, a module-scoped sidecar `Map<obsId, Set<consumerId>>` tracks citations. `recordReferencedIn(obsIds, consumerId)` writes to this map. The debug waterfall queries the map. Observation objects stay immutable (matching the frozen-view convention). The map survives rebuilds because it's keyed by the stable `Observation.id` hash.

### O1.4 + O1.5 `Observation.id` stability note — INTEGRATE (documentation)

**My decision:** Plan explicitly states that editing a log note's text orphans its citations (the new obs has a new id; the old citations point nowhere). The sidecar Map GC's orphaned entries on rebuild. `sourceRefId` is required non-null for every source type except `profile` (wizard notes).

### O3.6 Rename `parseErrors` → `ruleErrors` — INTEGRATE

**My decision:** The error surface is renamed. `parseObservation()` is essentially bulletproof (regex matching cannot throw for practical inputs). Rule closures in `generateContextualAdvice` / `adjustScoresFromNotes` CAN throw. The `index.ruleErrors[]` collects those.

### O6.2 Weighting pseudocode rewrite — INTEGRATE

**My decision:** Rewrite §6 of claude-plan.md as an unambiguous 4-step algorithm:
1. Partition candidates by severity (alert | watch | info).
2. If any Franco-override candidate exists in ANY partition, take it (weight = 1.0, no decay).
3. Otherwise take the top non-empty partition (severity-first).
4. Within that partition, compute `weight = 0.5^(age/halfLife)` and return the highest-weight candidate.

### O5 Backwards test at line 361 — INTEGRATE (fix)

The test should read: "A fresh **info**-severity note at 2 hours outranks a 6-hour-old **info** from a different rule because within-tier recency dominates." Severity-first ordering means fresh watch never outranks old alert. Fix the test description.

### O7 Rule execution order preservation — INTEGRATE (documentation)

Section 2 explicitly preserves `KEYWORD_PATTERNS` array order in the port. Parity fixtures catch any accidental reordering.

### O7 Wizard merge dedupe — INTEGRATE

Section 3's merge of `profile-context-rules.js` into `rules-keywords.js` MUST dedupe against existing `KEYWORD_PATTERNS`. Wizard rules are tagged with `wizardStep` metadata and only fire when `source === 'profile'`. Section 3 adds a dedupe step.

### O2.4 Section 2 split (2a commit rule-base, 2b delete legacy) — INTEGRATE

**My decision:** Section 2 commits in two steps: `2a. Port rule base + parity tests + dedupe wizard rules` first, `2b. Delete legacy files + docs.json entry + grep for stale refs` second. If a regression lands between Section 4 and Section 8, reverting 2b restores the legacy parser as a fallback without also reverting the port.

---

## LOW items — integrate inline during plan rewrite

- `js/data/profile-context-rules.js # DELETED in Section 2` — fix to Section 3 in directory diagram.
- JSDoc optional syntax inconsistency — use `[name]` form consistently.
- `domains` list: remove `'burp-interval'` typo, use `'cure-burp'` or `'cure-dry'` domains.
- `wilt-severe` Franco override — spell it as `'stress-drought-severe'` with wildcard.
- "984 patterns" count — verify exact count during Section 2 port; update spec if off.
- Advisors "accept notes parameter" — default `notes = []` for backwards compat.
- `?debugNotes=1` persistence — store in `sessionStorage['growdoc-debug-notes']`, cleared on full reload.
- Section 8 "no new env vars" note — add to deploy checklist.

---

## Items REJECTED or DEFERRED

### R1. Section 9 to out-of-scope entirely — REJECTED

User explicitly chose "full feedback loop" in interview Q5. Keeping 9a (cure notes → Observations) in this plan as an S section; 9b (full advisor with decision rules) is carved out as a follow-up plan that I will stub at `planning/note-contextualizer/9b-future.md` so the decision isn't lost.

### R2. Section 2 as its own batch — MODIFIED

Opus suggested Section 2 own a full batch. With O1.1 integrated (rewrite SCORE_ADJUSTMENTS + ADVICE_RULES in Section 4 against Companion conditions), Section 2's scope shrinks meaningfully — it's now "port 984 keyword patterns, add 3 small new rule sets, build golden fixtures, delete legacy." This is a solid M, not XL. Keeping Section 2 in Batch 2 alongside Section 3.

### R3. Memory footprint warning — DEFERRED

Not a blocker at hundreds scale. Noted as a future watch-item in §12 risks.

### R4. Debug waterfall rate-limiting — DEFERRED

Not a blocker. Noted as a §12 risk.

### R5. Regex heuristic issue (`/\bbad|terrible|worst\b/i`) — ACCEPT WITH FIX

Fix the regex to `/\b(bad|terrible|worst)\b/i` in the plan. Also add a regex-lint test in Section 2 that walks `SEVERITY_HEURISTICS` and confirms each regex compiles and matches its expected trigger words.

---

## Plan rewrite scope

After this integration pass, the updated `claude-plan.md` will include:
1. Rewritten Section 2 (pure data port + golden fixtures + no closure port).
2. Rewritten Section 4 (diagnosis bridge — now authors fresh rules-score.js / rules-advice.js against Companion condition names, introduces `store.state.ui.activePlantId`).
3. Corrected batching: Batch 1 = {S1, S7-stub}; Batch 2 = {S2, S3}; Batch 3 = {S4, S6} then S5; Batch 4 = {S7-final, S9a} then S8.
4. Synchronous `getObservationIndex()` hash-check path.
5. Override-via-real-log-entry semantics.
6. Sidecar `referencedIn` map.
7. `ruleErrors` rename.
8. Explicit weighting pseudocode.
9. Legacy-enum severity chip write contract.
10. Wizard-skip for `findActionsTakenSince`.
11. Section 9 split into 9a + 9b-future.
12. `sw.js` VERSION bump in Section 8.
13. Section 8 re-rated S → M.
14. All low-priority nits inlined.

All other Opus recommendations are incorporated or explicitly deferred as above.
