# Note Contextualizer — Synthesized Spec

**Feature.** Intelligent, contextual note-adding for plant advice in the GrowDoc Companion app. The most important feature of the app — user-written observations must flow end-to-end into Plant Doctor diagnoses, task generation, and all advisors instead of being dropped on the floor.

**Pain signal.** "Notes feel ignored by the AI." **11 of 14 Companion advisor surfaces drop notes today.**

**Project.** Vanilla JS cannabis cultivation Companion app. No frameworks, no npm dependencies, no bundlers. GitHub = docs DB, localStorage = per-user state. Deployed on Vercel.

---

## Scope summary

Build a single unified module `js/data/note-contextualizer/` that:
1. Projects every existing note source into a uniform `Observation` type (no migration).
2. Forks the mature v3 rule base (2947 lines, 984 patterns) into ES modules.
3. Kills the redundant `parseProfileNotes` in `js/data/profile-context-rules.js`.
4. Applies half-life recency decay with severity tiers and Franco-override rules.
5. Wires every Companion advisor (plant doctor, task engine, harvest, stage, priority, dashboard, cure tracker) to consume it.
6. Adds UI affordances on every note input (severity chips, parsed-signal preview, contradiction banner, override).
7. Provides a debug waterfall panel via `?debugNotes=1`.

## Source documents

The full spec lives in `planning/note-contextualizer/` as split files per the `feedback_split_md_files` rule:

- `index.md` — router
- `01-audit.md` — current state: where notes are stored, captured, and dropped
- `02-gap-analysis.md` — code paths that ignore notes + schema gaps + missing weighting
- `03-design.md` — observation schema, projection strategy, merge/weighting algorithm
- `04-integration-points.md` — exact files + functions to wire (I1–I14)
- `05-ui-changes.md` — severity chips, parsed-signal strip, contradiction banner, override UX
- `06-section-breakdown.md` — draft 8-section breakdown (superseded by claude-plan.md after interview)
- `07-open-questions.md` — 8 arbitration items (superseded by 08-decisions.md)
- `08-decisions.md` — **LOCKED** user decisions on the 8 arbitration items
- `claude-research.md` — test infra, store hooks, half-life decay, ES module patterns
- `claude-interview.md` — rollout, cure advisor scope, failure modes, debug panel

## Locked decisions (from 08-decisions.md)

1. **v3 standalone tool is DEPRECATED.** The Companion embedded plant doctor (`js/plant-doctor/*`) is the real app. `docs/tool-plant-doctor.html` was proof-of-concept only.
2. **FORK** the 2947-line rule base into ES modules. Delete the ES5 original after parity tests pass.
3. **Cure Tracker IS in scope** — full feedback loop, new cure-advisor module, new `growdoc-companion-cure-profiles` localStorage key.
4. **Projection-only** observation index. No new persistent key for observations. Rebuilt in memory on commit via store subscription.
5. **KILL** `js/data/profile-context-rules.js` — merge into unified contextualizer with a `source-step` tag for wizard notes.
6. **Severity enum alias** — `urgent→alert, concern→watch, null→info`. Zero migration of on-disk logs.
7. **Auto-guess severity** from note text (user can override with one tap). Auto-inferred severity carries a `severityAutoInferred: true` flag for UI hint.
8. **Task suppression UX option (c)** — task shown with checkmark + quoted note + domain chip + "Override — water anyway" button + "Why?" link to debug panel.

## Decisions from research (`claude-research.md`)

9. **Replace weight buckets with half-life exponential decay.** `HALF_LIFE = {alert:24, watch:48, info:168}` hours. `weight = 0.5 ^ (ageHours / halfLife)`. Severity-first ordering prevents inversion.
10. **Debounce cache rebuild 300ms** on `store.subscribe('grow' | 'profile')`. Single-flight promise for concurrent consumers.
11. **CSS tokens live in `css/variables.css`**, NOT `docs/_design-system.md`. Create `css/note-contextualizer.css` extending `--status-*`, `--evidence-*`, `--space-*`, `--radius-*`, `--transition-*`.
12. **Test file pattern** — new files go in `js/tests/note-contextualizer.test.js`, export `async function runTests()` returning `Array<{pass, msg}>`. Register in `js/main.js:298` module list.
13. **Action-taken debounce windows** — water 12h, feed 24h, IPM 72h, defoliate 168h, flush 48h.
14. **Log `details` shape varies by log type** (`water`/`feed` vs `train` vs `observe`). Contextualizer must handle the union.
15. **`observedAt` inference rules** — log → `log.timestamp`; plant/profile → `plant.stageStartDate` or `Date.now() - 24h` fallback; task → `task.updatedAt || task.createdAt`.

## Decisions from interview (`claude-interview.md`)

16. **Parallel section execution.** Plan delivers in 4 batches: {S1, S7-stub} → {S2, S3} → {S4, S5, S6} → {S7-final, S8, S9}.
17. **Cure advisor adjusts all 4 parameters** — burp frequency, target RH range, dry-time, strain-specific cure profiles. New module `js/data/cure-advisor.js`. New storage key `growdoc-companion-cure-profiles`.
18. **Legacy files deleted in Section 2** — `docs/note-context-rules.js`, `docs/tool-plant-doctor.html`, and their `docs.json` entries.
19. **Override = silent log + unblock.** Auto-create Observation `source:'override'`, `domains:['action-taken']`, `severity:'info'`, `rawText:'Manual override of suppression at <time>'`.
20. **Debug panel = full waterfall.** Source note → parsed signals → merged ctx → weight applied → advisor output.
21. **Franco override rule IDs** — heat stress, overwatering/root rot, severe wilt, hermie. Concrete list confirmed against rule ids during Section 2 port.
22. **Scale target = hundreds of observations per grow.** Projection + 300ms debounce is sufficient. No incremental rebuild, no worker offload.
23. **Graceful parse failures** — `parsed = null`, `rawText` preserved. Every consumer guards with `obs.parsed ?? {}`. Errors pushed to `parseErrors[]` in the index for the debug panel.
24. **Plant Detail "Recent observations" widget** — last 5 across all sources, collapsible, chips show domain + severity.

---

## Success criteria

A user writes a note like "just flushed at 6.0 pH, tips still burning". Within the next render cycle:

1. The Observation is created with `source:'log'`, `domains:['action-taken','nutrients']`, auto-inferred `severity:'watch'`, and parsed signals `action-flushed`, `ph-extracted=6.0`, `tip-burn`.
2. The next water task for that plant is suppressed with "You said 2h ago: 'just flushed at 6.0 pH, tips still burning'" shown as the quoted reason.
3. Plant Doctor, when invoked, boosts `r-ph-lockout` score and surfaces a contextual advice block tied to this observation.
4. The dashboard status banner shows the observation as a second-line alert.
5. The Plant Detail "Recent observations" widget shows it at the top.
6. `?debugNotes=1` shows the full waterfall: raw text → parsed keywords → merged ctx → weight 0.9 (watch severity, age 2h) → suppression decision for "water" task → Plant Doctor score adjustment.

If any of those six things don't happen, the feature is incomplete.

## Out of scope

- IndexedDB migration (explicitly rejected per grow-companion-v2 memory).
- CI / headless test runner — still browser-based.
- Cross-grow historical analysis beyond what strain profiles already capture.
- NLP / embeddings / ML — deterministic rule-based only.
- Separate mobile app behavior — the PWA handles mobile via the existing bottom nav from Section 10 of v2.
