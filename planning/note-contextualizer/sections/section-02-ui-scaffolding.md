# section-02-ui-scaffolding — Severity Chip + Parsed-Signal Strip Scaffolding

**Original plan section:** S7-stub (Severity chip + strip scaffolding, Small)
**Batch:** 1 (parallel with section-01)

Lands the UI scaffolding for the Note Contextualizer as a parallel Batch 1 task with section-01. Introduces two reusable components — `severity-chip` and `parsed-signal-strip` — wires them into the three note input surfaces (log form, task card, Plant Detail Context Notes), creates a new dedicated CSS file, and imports it from `index.html`.

The strip is **intentionally a placeholder** — it renders `[parsing soon…]` until section-08 upgrades it. Section-08 has a regression test asserting the placeholder is gone. Do not remove that canary.

The chip **writes the LEGACY enum** (`'urgent' | 'concern' | null`) to `log.details.severity` for backwards compatibility. The 3-label display (`alert | watch | info`) is presentation-only. Auto-infer uses a small placeholder heuristic; the full `SEVERITY_HEURISTICS` regex set arrives in section-03.

This section has **no code dependency on section-01** — components never import from `js/data/observation-schema.js` or the contextualizer. Both sections can land in any order within Batch 1.

## Project reminders

- Vanilla JS only. ES modules load directly in the browser.
- Tests run in the browser at `/test-runner`. New test files register in `js/main.js:298`, export `async function runTests() → Array<{pass, msg}>`.
- Design tokens live in `css/variables.css`.
- `index.html` currently imports `/css/variables.css` at line 24. New `/css/note-contextualizer.css` import goes immediately after it.

## Enum Mapping (critical)

The chip displays three buttons: `info`, `watch`, `alert`. On click they write the LEGACY on-disk enum:

| Display label | Legacy enum value |
|---|---|
| `alert`  | `'urgent'`  |
| `watch`  | `'concern'` |
| `info`   | `null`      |

Reversible: callers hydrate a chip from `details.severity` mapping `'urgent' → alert`, `'concern' → watch`, `null → info`.

## Files to create

### 1. `js/components/severity-chip.js` (NEW)

```js
/**
 * Render a severity chip row. Writes legacy enum to target[targetKey] on click.
 * @returns {{ getValue, setValue, isAutoInferred }}
 */
export function mountSeverityChip(container, { target, targetKey = 'severity', initial, autoInferFrom });

/**
 * Placeholder heuristic — returns 'urgent' for critical phrases,
 * 'concern' for warning words, else null. Real SEVERITY_HEURISTICS in section-03.
 */
export function autoInferSeverity(text);
```

**Behavioral requirements:**
- Three clickable elements labeled `info`, `watch`, `alert` in DOM order (info first, alert last).
- Only one selected at a time via `aria-checked` / `data-selected`.
- `autoInferFrom` binding: on textarea `blur`, if chip value is still `null`, call `autoInferSeverity(textarea.value)` and apply via `setValue(v, true)` with internal `severityAutoInferred` flag = true. Flag clears on manual click.
- `data-auto-inferred="true"` on container when auto-populated; removed on override.
- Mutating `target[targetKey]` happens on every value change — never on mount.

### 2. `js/components/parsed-signal-strip.js` (NEW)

```js
/**
 * Placeholder in section-02; upgraded in section-08.
 */
export function mountParsedSignalStrip(anchor, options);
```

**Section-02 behavior:**
- Appends `<div class="nc-parsed-strip" data-placeholder="true">[parsing soon…]</div>` after anchor.
- `refresh()` is a no-op stub.
- `destroy()` removes from DOM.
- Do NOT import from `js/data/note-contextualizer/*` — that module may be stubbed in this batch.

### 3. `css/note-contextualizer.css` (NEW)

Required classes:
- `.nc-severity-chip-row` — flex row, 6–8px gap.
- `.nc-severity-chip` — pill button; default uses `var(--color-bg-elevated)` / `var(--color-border)`.
- `.nc-severity-chip[aria-checked="true"]` — selected state per severity:
  - alert → `var(--status-urgent)` / its bg alias
  - watch → `var(--status-action)` / its bg alias
  - info → `var(--status-good)` or muted
- `.nc-severity-chip-row[data-auto-inferred="true"]::after` — small "auto-detected" label, `var(--font-size-xs)`, `var(--color-text-muted)`.
- `.nc-parsed-strip` — block, margin-top 4px, `var(--font-size-xs)`, muted color.
- `.nc-parsed-strip[data-placeholder="true"]` — italic, lower opacity.

All values use existing custom properties from `css/variables.css`. Do not introduce new variables.

## Files to modify

### 4. `index.html`

Add one `<link>` immediately after `/css/variables.css` at line 24:
```html
<link rel="stylesheet" href="/css/note-contextualizer.css">
```

### 5. `js/components/log-form.js`

- Import `mountSeverityChip` and `mountParsedSignalStrip`.
- After notes textarea render, mount both against `details` (the same reference the form uses when building save payload).
- On form close, call `destroy()` on mounted strip.

### 6. `js/components/task-card.js`

- Import both mount functions.
- After task-card notes textarea, mount both against the task-save `details` object.
- Override button + quoted-note banner are NOT in this section (section-07).

### 7. `js/views/plant-detail.js`

- Import both mount functions.
- Mount chip against plant.notesSeverity (or create `plant.details.severity` if absent).
- Mount strip against Context Notes textarea.
- Recent Observations widget and timeline parsed-chips are NOT in this section (section-08).

## Tests

New file `js/tests/severity-chip.test.js`, register in `js/main.js:298`:

```
# Test: severity-chip renders three options: info, watch, alert (DOM order)
# Test: clicking 'alert' chip sets target.severity to 'urgent'
# Test: clicking 'watch' chip sets target.severity to 'concern'
# Test: clicking 'info' chip sets target.severity to null
# Test: auto-infer returns 'urgent' for 'dying' and sets severityAutoInferred=true
# Test: auto-infer returns null for 'looks fine' and sets severityAutoInferred=false
# Test: user override of auto-inferred chip clears severityAutoInferred flag
# Test: mountSeverityChip with initial='urgent' hydrates alert button as selected
# Test: mountParsedSignalStrip renders literal placeholder '[parsing soon…]'
```

Notes:
- Each test uses scratch `document.createElement('div')` containers, torn down between tests.
- Do NOT test against real form elements.
- Auto-infer tests assert against the placeholder heuristic — section-03's regex port must preserve `'dying' → urgent`, `'looks fine' → null`.
- The placeholder string test is a **deliberate canary** for section-08. Leave a comment noting it will be updated.

## Manual verification

1. `vercel dev`, open `http://localhost:3000/test-runner` with hard reload.
2. Confirm all `severity-chip.test.js` cases pass.
3. Open log form — chip row renders under notes textarea; clicks toggle selected state.
4. `[parsing soon…]` placeholder appears under each note textarea (log, task card, plant detail).
5. No console errors.
6. Existing tests still pass.

## Out of scope (do NOT do in this section)

- Real parsing in the strip — stays `[parsing soon…]`.
- Full `SEVERITY_HEURISTICS` regex port (section-03).
- Override button / quoted-note banner in task card (section-07).
- Recent Observations widget (section-08).
- Parsed-keyword chips on timeline (section-08).
- Imports from `js/data/note-contextualizer/*` or `js/data/observation-schema.js`.
- `sw.js` VERSION bump (section-10).

## Commit

`section-02: severity chip + parsed-signal strip scaffolding`

---

## Implementation log

**Files created:**
- `js/components/severity-chip.js` — `mountSeverityChip`, `autoInferSeverity`; DOM order info/watch/alert; writes legacy enum (`'urgent'|'concern'|null`); optional `autoInferFrom` textarea blur hook; `data-auto-inferred` attr cleared on manual click.
- `js/components/parsed-signal-strip.js` — `mountParsedSignalStrip` renders the `[parsing soon…]` placeholder canary (section-08 will replace).
- `css/note-contextualizer.css` — chip row + parsed strip styles, ALL values from `variables.css` tokens (`--status-urgent`, `--status-action`, `--status-good`, `--bg-elevated`, `--text-muted`, `--text-primary`, `--text-secondary`, `--space-*`, `--radius-full`, `--transition-fast`).
- `js/tests/severity-chip.test.js` — 11 behavioral tests.

**Files modified:**
- `index.html` — `<link>` for `note-contextualizer.css` immediately after `variables.css`.
- `js/main.js` — registered `severity-chip` test module.
- `js/components/log-form.js` — imports both mount functions; `formState = { severity: null }` closed over `_renderDetails` and `_buildEntry`; chip + strip mount immediately below notes textarea; `_buildEntry` writes `details.severity` when non-null.
- `js/components/task-card.js` — imports mount functions; inside `_toggleNotesInput`, mounts chip writing to `task.details.severity`; `onNotes` callback signature extended to `(id, notes, severity)`.
- `js/views/dashboard.js` — `_saveNotes(store, taskId, notes, severity)` now persists severity into `task.details.severity` on the snapshot before commit.
- `js/views/plant-detail.js` — imports mount functions; chip + strip mount registered BEFORE the notes blur listener so the chip's own blur handler runs first and the store commit captures the freshly-inferred severity.

**Review fixes applied in response to blocking items:**
1. CSS used invented token names (`--color-border`, `--status-urgent-bg` etc.) — rewritten to use the real tokens in `variables.css`. Dark-theme-correct.
2. `mountSeverityChip` hydration no longer mutates `target` on mount (spec: "never on mount"). The initial value still drives `aria-checked` rendering but the target field is only touched on user interaction / auto-infer.
3. `plant-detail.js` blur event ordering fixed — chip mount now happens BEFORE the notes blur listener is registered, so on textarea blur the chip listener fires first (updating `notesSeverityState.severity`) and the subsequent notes blur handler commits the fresh value.
4. `task-card.js` severity persistence — `onNotes` callback now forwards severity; `dashboard.js:_saveNotes` was extended to write it into `task.details.severity` on the snapshot before committing. Previously severity was silently dropped.

**Deviations from plan:**
- No `log-form` destroy-on-close hook; the spec mentioned `destroy()` on close. Current log-form doesn't have a formal close lifecycle — the mounted elements get removed with the form DOM when the caller clears the container. If this becomes a leak later, a lifecycle hook can be added.

**Section-boundary compliance:** no imports from `js/data/note-contextualizer/*` or `js/data/observation-schema.js`, no `sw.js` bump, no override UI, no real parsing.

**Manual verification pending:** user must `vercel dev`, open `/test-runner` with hard reload, confirm severity-chip tests pass and no regressions; open log form / task card / plant detail and visually confirm the chip row + `[parsing soon…]` strip render below each notes textarea.
