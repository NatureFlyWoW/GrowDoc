# 08 — Locked Decisions

User arbitration received 2026-04-11. These override the defaults in `07-open-questions.md` where they conflict.

## Q8 — v3 standalone tool is DEPRECATED

The Companion's embedded plant doctor (`js/plant-doctor/*`) is the real app. `docs/tool-plant-doctor.html` was a proof-of-concept only.

**Implication.** We are free to delete `docs/note-context-rules.js` and break the standalone tool after porting, or retire the standalone tool entirely. No bridge work needed.

## Q1 — FORK (copy the rule base)

Port the 2947-line rule base out of `docs/note-context-rules.js` into ES module files under `js/data/note-contextualizer/`. The old file can be deleted in Section 2 (or Section 9 cleanup) after tests confirm parity.

**Implication.** Section 2 scope grows slightly — includes a delete + a final grep for stray `window.KEYWORD_PATTERNS` references.

## Q7 — CURE TRACKER IS IN SCOPE

Fold `docs/tool-cure-tracker.html` notes into the observation pipeline. Adds **new Section 9 — Cure Tracker integration (S)**. Cure notes become Observations with `source:'cure'` and domains like `aroma`, `mold-risk`, `burp-interval`.

**Implication.** Plan grows from 8 sections to 9. The cure tracker also becomes the first consumer outside the living-plant loop, which validates the schema's portability.

## Q2 — PROJECTION-ONLY observation index

No new localStorage key. `grow._observationIndex` is rebuilt in memory on every `grow` / `profile` commit via store subscription. Carries `{version, builtAt, fromHash}` for staleness detection. No migration required.

## Q3 — KILL the old `parseProfileNotes` parser

Delete `js/data/profile-context-rules.js` (267 lines) entirely. Merge its rules into `rules-keywords.js` with a `source-step` tag so the onboarding wizard step (`stage`/`medium`/`lighting`/`strain`/`space`/`priorities`) is preserved as metadata. All existing call sites (`onboarding.js`, `settings.js`, `plant-detail.js`, `my-grow.js`) switch to the unified contextualizer API.

**Implication.** Section 2 is slightly bigger (merge step). Section 1 schema adds a `wizardStep` field on Observation for wizard-sourced notes.

## Q4 — Severity enum alias

On-disk values stay `urgent`/`concern`/`null`. Contextualizer maps them invisibly:

```js
const SEVERITY_ALIAS = { urgent: 'alert', concern: 'watch', null: 'info', undefined: 'info' };
```

Zero migration of existing log data.

## Q5 — Auto-guess severity from text

When a note is typed, the contextualizer scans for severity keywords and pre-selects a chip. User can override with one tap.

**Rule sketch (lives in `rules-keywords.js`):**

```js
export const SEVERITY_HEURISTICS = [
  { level: 'alert', pattern: /\b(dying|dead|crashing|wilting hard|burned to a crisp|hermie|infestation|root rot|collapse)\b/i },
  { level: 'alert', pattern: /\b(emergency|urgent|help|bad|terrible|worst)\b/i },
  { level: 'watch', pattern: /\b(concerned|worried|off|slight|minor|small|not sure|mild)\b/i },
  { level: 'watch', pattern: /\b(yellowing|spots|curling|drooping|slow)\b/i },
  { level: 'info',  pattern: /\b(looks good|happy|healthy|thriving|great|perfect|normal)\b/i },
];
// default: info
```

User override always wins. The auto-selection is stored with a `severityAutoInferred: true` flag so the UI can show a subtle "auto-detected" hint.

## Q6 — Task suppression UX: Option (c) PLUS context

When an observation suppresses a task, render it as:

```
✓ Water NL#3 — done by you
  You said 2h ago: "already flushed with 6.0 pH today"
  [Show details] [Override — water anyway]
```

Additional context to include:
- **Exact timestamp** (relative: "2h ago")
- **The full quoted note** (not truncated)
- **Domain chip** showing what signal fired (e.g. `[action-taken: flushed]`)
- **An "Override" affordance** — if the user wants to force the task, one tap unblocks it and logs a counter-observation
- **A "Why?" link** that opens the debug panel (`?debugNotes=1`) scoped to this suppression

**Section 7 scope grows** to include the override flow and the Why? link.
