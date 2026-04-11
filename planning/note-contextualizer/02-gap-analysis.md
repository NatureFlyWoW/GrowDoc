# 02 — Gap Analysis

## Where the pain actually lives

- **Companion ↔ contextualizer disconnect.** `js/plant-doctor/doctor-engine.js:72-91` manually reconstructs a tiny "context" object and bypasses both `parseProfileNotes` and the richer `KEYWORD_PATTERNS`/`ADVICE_RULES`/`SCORE_ADJUSTMENTS` engine in `docs/note-context-rules.js`. The mature engine is dead code inside the Companion.
- **Log-level notes are write-only.** `log.details.notes` is captured in `log-form.js:146` and rendered in `plant-detail.js:195`, but no code path converts those strings into signals for the task engine or diagnostic engine. `task-engine.js:222` reads `log.details?.severity` and nothing else from an observation log.
- **Task notes never feedback-loop.** `dashboard.js:344-351 _saveNotes` writes `task.notes` and commits, but no generator re-reads. A note on a water task saying "already flushed with 6.0" will not prevent the next water task.
- **Plant-level context is stale.** `plant.context` is computed once at save time (`plant-detail.js:551-552`). If the user adds "switched from RO to tap yesterday", `parseProfileNotes` runs — but that parser has no `tap/ro` handler for the `plant` slot (only `medium` step), so the signal is dropped. And no downstream code reads `plant.context.waterSource` regardless.
- **`profile.context.rawUnmatched[]` is orphaned.** `profile-context-rules.js:186` captures unmatched fragments — no consumer looks at them. Lost signal.
- **No timestamps on notes.** Neither `profile.notes`, `plant.notes`, nor `task.notes` carry an `observedAt`. Only log notes inherit `log.timestamp`. Precludes recency weighting.
- **No anchoring for wizard notes.** `profile.notes.stage` is typed at onboarding and may be months old, but is still treated as authoritative at task-gen time.

## Schema gaps

| Field | Plant.notes | Log details.notes | Task.notes | Profile.notes |
|---|---|---|---|---|
| Observation timestamp | missing | inherited (log.timestamp) | missing | missing |
| Plant ID link | implicit | implicit (parent log) | `task.plantId` ok | n/a |
| Stage at obs time | missing | missing (inferrable) | missing | missing |
| Domain tag (nutrient/env/pest) | missing | missing | missing | missing |
| Severity/priority | missing | `details.severity` enum (`urgent`/`concern`/null) | missing | missing |
| Parsed signals | computed once to plant.context, then stale | **never** | **never** | parsed once |
| Action-taken flag | missing | sometimes in `details.action` (train only) | missing | missing |
| `referencedIn` backlinks | missing | missing | missing | missing |

## Weighting gaps

No conflict resolution exists. When env dashboard says VPD = 1.8 kPa (healthy) but a user log 30 min ago says "leaves drooping hard, tent feels hot", the task engine fires nothing because `log.details.severity` was not set and the env trigger path (`task-engine.js:364-383`) only reads the (stale) VPD number.

**Per `feedback_franco_priority`, the weighting order must be:**

> Recent user observation (≤24h, severity≠none) > Recent structured log value > Sensor/derived reading > Profile default.

Today the order is effectively reversed — sensor readings and defaults win by default because nothing else is consulted.
