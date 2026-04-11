# Interview Transcript — Note Contextualizer

Conducted 2026-04-11. The initial spec in `index.md` → `07-open-questions.md` already captured 8 locked decisions. This interview focuses on remaining arbitration items: rollout order, scope of the cure feedback loop, UX edge cases, failure modes, and schema for derived state.

## Round 1 — Rollout, Cure Scope, Legacy, Override UX

### Q1. Rollout order — strict 1→9 or thin-slice MVP or parallel tracks?

**A.** **Parallel tracks.** Sections 1–3 (data layer: schema + rule port + merge/weighting) run in parallel with Section 7 (UI affordances), merging at Section 4 (Plant Doctor wiring).

**Implication.** Section 7 cannot consume real parsed output until Section 1's schema + stub contextualizer lands. The plan must define a minimal stub API that Section 7 can render against while Sections 2–3 fill in the real rule base and weighting. Parallelism is cross-batch: first batch = {S1, S7-stub}, second batch = {S2, S3}, third batch = {S4, S5, S6}, fourth batch = {S7-final, S8, S9}.

### Q2. Cure Tracker scope — minimal wrap, full feedback loop, or schema+capture only?

**A.** **Full feedback loop.** Cure notes feed back into a new cure-advisor that adjusts burp frequency, target RH range, dry-time recommendation, and builds strain-specific cure profiles from historical notes.

**Implication.** Section 9 grows from S to L. New file: `js/data/cure-advisor.js`. New `js/components/cure-note-form.js` for severity + parsed-signal chip UI. Must also touch `docs/tool-cure-tracker.html` to surface the new advice.

### Q3. Legacy file deletion timing?

**A.** **Delete in Section 2 after parity tests pass.** `docs/note-context-rules.js` and `docs/tool-plant-doctor.html` go away. `docs.json` entries for the v3 tool also removed.

**Implication.** Section 2 scope grows slightly — adds a parity-test harness (loads legacy file via temporary `<script>` tag, runs both parsers against ~20 fixture notes, asserts identical output), a final grep for stray references, and the actual delete + docs.json update.

### Q4. Override UX when user taps "Water anyway" on a suppressed task?

**A.** **Silent log + unblock.** Auto-create an Observation with `source:'override'`, `rawText:'Manual override of suppression at <time>'`, `domains:['action-taken']`, `severity:'info'`. Task becomes actionable. No prompt.

**Implication.** Section 5 (task engine) adds an override API. Section 7 wires the "Water anyway" button to the override API. Section 8 debug panel surfaces override observations distinctly so the waterfall reads naturally.

---

## Round 2 — Cure Advisor Details, Debug Panel, Franco List, Scale

### Q5. Cure advisor — which parameters does it adjust from past cure notes?

**A.** **All four.** Burp frequency, target RH range, dry-time recommendation, and strain-specific cure profiles.

**Cure-advisor v1 contract:**
```js
export function getCureAdvice({ strainSlug, currentDay, currentRH, currentTemp, recentNotes }) {
  return {
    recommendedAction: 'burp-now' | 'wait' | 'open-longer' | 'seal' | 'stop',
    confidence: 0..1,
    reasoning: string[],      // human-readable, cites observation ids
    suggestedRH: { min, max }, // personalized if strain profile exists
    nextBurpInHours: number,
    strainProfileApplied: boolean,
  };
}
```

**Strain profile shape (stored at `growdoc-companion-cure-profiles[strainSlug]`):**
```js
{
  version: 1,
  strainSlug: 'citron-givre',
  sampleCount: 3,                 // number of past cures in the training data
  preferredRH: { min, max, p50 }, // derived from "ideal" notes
  typicalDryDays: number,         // from dry-timeline notes
  typicalCureDays: number,
  avgBurpIntervalHours: number,
  commonIssues: ['too-wet-day-3', 'aroma-peaks-week-4'],
  lastUpdated: ISO,
}
```

### Q6. Debug panel depth?

**A.** **Full waterfall.** Source note → parsed signals → merged ctx → weight applied → advisor output. Shows exactly why a task was or wasn't created, and which observation drove which decision.

### Q7. Franco override rule IDs?

**A.** **All four.** Heat stress (tent >30°C, leaves curling up), overwatering / root rot, severe wilt / drought stress, hermaphrodite / bananas.

**Concrete `FRANCO_OVERRIDE_RULE_IDS` set** (to be confirmed against actual rule ids during Section 2 port):
- `stress-heat-*` (all heat-stress rules)
- `stress-overwater-*`, `root-rot-*`
- `stress-drought-*`, `wilt-severe`
- `hermie-*`, `bananas-spotted`

### Q8. Expected scale?

**A.** **Hundreds per grow** (~50–500 observations over a 12-week cycle). In-memory projection is trivially fast at this scale. No need for persisted indexes or incremental rebuilds.

**Implication.** The design in `03-design.md` can be simplified: no dirty-flag incremental rebuild, no worker offload, no IndexedDB escape hatch. Projection + 300ms debounce is sufficient.

---

## Round 3 — Cure Storage, Parse Failure, Obs Widget

### Q9. Cure profile storage?

**A.** **New localStorage key `growdoc-companion-cure-profiles`.** Keyed by strain slug. Built incrementally from historical cure notes (walked from `archive` + `outcomes`). Survives grow/archive cycles. One profile per strain.

**Implication.** Section 9 adds a 7th `STORAGE_KEYS` entry. This is the first new persistent key added by this plan (everything else is projection). Needs a tiny migration stub in `storage.js` for forward-compat.

### Q10. Parse failure behavior?

**A.** **Graceful fallback.** `parsed = null`, `rawText` preserved. Consumers check `if (obs.parsed) { ... }` before using. Error is logged to the debug panel if `?debugNotes=1`.

**Implication.** Every downstream consumer (Section 4, 5, 6) needs a `parsed ?? {}` guard. Add a `parseErrors[]` array to the observation index with `{obsId, error, timestamp}` entries for the debug panel.

### Q11. Plant Detail "Recent observations" widget default display?

**A.** **Last 5 across all sources, collapsible.** Shows log + task + plant + stage-transition. One tap to expand full history. Chips on each item showing domain + severity.

---

## Summary of new design constraints from the interview

1. **Parallel section execution.** Plan must support 4 batches: {S1,S7-stub} → {S2,S3} → {S4,S5,S6} → {S7-final,S8,S9}.
2. **Cure advisor is its own module** — `js/data/cure-advisor.js` plus `js/components/cure-note-form.js` plus `js/views/cure-view.js` (or integration into existing cure view).
3. **New persistent key** `growdoc-companion-cure-profiles` — adds a migration stub.
4. **Override API** on task engine for silent unblock + counter-observation logging.
5. **Parity-test harness** in Section 2 — load legacy file via temporary script tag, run both parsers, assert JSON equality.
6. **Hundreds-scale optimization** — no need for incremental rebuild or worker offload.
7. **Graceful parse failures** — every consumer must handle `obs.parsed === null`.
8. **Debug waterfall format** is the canonical debugging tool for this feature.
