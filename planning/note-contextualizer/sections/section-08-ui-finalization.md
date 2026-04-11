# section-08-ui-finalization

**Original plan section:** S7-final (UI finalization + debug waterfall, M)
**Batch:** 4 (parallel with section-09)
**Depends on:** sections 01, 02, 03, 04, 05, 07
**Blocks:** section-10

## Goal

Replace the Batch-1 placeholder UI with the final contextualizer surface: real parsed-signal preview, contradiction banner, Recent Observations widget, journal domain filter, plant-detail timeline chips, debug waterfall behind `?debugNotes=1`. **UI-only** — all data-layer APIs already exist.

## Background

GrowDoc is vanilla JS, no frameworks. Tests run in-browser at `/test-runner`, registered in `js/main.js:298`. Design tokens in `css/variables.css`. `css/note-contextualizer.css` already exists from section-02 — append new styles.

APIs available from `js/data/note-contextualizer/index.js`:
- `collectObservations`, `getObservationIndex`, `parseObservation`, `mergeNoteContext`, `getRelevantObservations`
- `recordReferencedIn`, `getCitationsFor` (sidecar Map)
- `initContextualizer(store)` — already called in `js/main.js`
- `__resetForTests()`

Severity on data layer: legacy enum `'urgent'|'concern'|null`. Display alias: `urgent→alert`, `concern→watch`, `null→info`.

From section-05: `store.state.ui.activePlantId` available.

## Files

**Modify:**
- `js/components/parsed-signal-strip.js` — replace `[parsing soon…]` with real output.
- `js/components/log-form.js` — add contradiction banner above note textarea.
- `js/views/plant-detail.js` — mount Recent Observations widget, render parsed-keyword chips under log notes, mount journal domain filter.
- `js/components/task-card.js` — render suppressed state DOM (quoted-note banner, relative timestamp, Override button).
- `js/main.js` — hook `?debugNotes=1`, persist in `sessionStorage['growdoc-debug-notes']`, mount debug waterfall.
- `css/note-contextualizer.css` — styles for chips, banner, widget, waterfall.

**Create:**
- `js/components/recent-observations-widget.js`
- `js/components/journal-domain-filter.js`
- `js/components/contradiction-banner.js`
- `js/components/debug-waterfall.js`
- `js/tests/ui-note-contextualizer.test.js` — register in `js/main.js:298`.

## Tests FIRST

Use `__resetForTests()` between tests. Mount components into detached DOM nodes. Push `{pass, msg}`.

```
# parsed-signal strip upgrades from '[parsing soon…]' to real parsed output (regression canary)
# parsed-signal strip renders domain-colored chips for top 3 keywords
# parsed-signal strip updates on textarea blur (not every keystroke)
# contradiction banner renders when draft 'ph was 5.0' and recent log pH === 6.2
# contradiction banner does NOT render when values agree
# Recent Observations widget renders last 5 for active plant
# Recent Observations widget is collapsible, default collapsed
# Recent Observations widget items show domain + severity chips
# Journal domain filter renders dropdown with all observed domains
# Journal domain filter hides observations not matching selection
# Debug waterfall renders when ?debugNotes=1 is in URL
# Debug waterfall renders one row per observation for seeded grow with 3 obs
# Debug waterfall row shows raw text, parsed keywords, merged ctx, weight, citations
# Debug waterfall row count capped at 200 (oldest pruned) — seed 250, assert 200
# ?debugNotes=1 persists across SPA route changes via sessionStorage
# Task card suppressed state renders quoted-note banner with relative timestamp
# Task card suppressed state renders 'Override' button
# Task card 'Override' click calls taskEngine.overrideSuppression
```

Notes:
- Stub→final regression: assert `parsed-signal-strip.js` output does NOT contain `'[parsing soon…]'` for non-empty input.
- Contradiction test: seed plant with recent log `details.pH === 6.2`. Feed `'ph was 5.0'` into draft. Positive case asserts banner with both values. Negative feeds `'ph was 6.2'`.
- Debug waterfall count cap: seed 250 obs, assert `querySelectorAll('tr.waterfall-row').length === 200`, oldest 50 pruned.
- `?debugNotes=1` persistence: set `location.search='?debugNotes=1'`, invoke init hook, assert `sessionStorage.getItem('growdoc-debug-notes') === '1'`. Clear search, invoke again, assert waterfall still mounts.
- Citations (debug waterfall column): manually call `recordReferencedIn([obsId], 'test-consumer')` in fixture — full wiring from advisors lands in section-10.

## Implementation

### 1. `parsed-signal-strip.js` upgrade

```js
export function renderParsedSignalStrip(mountEl, draftText);
export function attachStripToTextarea(textarea, stripMountEl);
```

- Parse draft via synthetic `parseObservation({id:'draft', rawText:draftText, source:'draft', ...})`.
- Take top 3 `parsed.keywords` by severity then position.
- Render as `<span class="nc-keyword-chip nc-domain-${domain}">${matchedText}</span>`.
- Empty draft → clear mount.
- Update on textarea `blur`, NOT keystroke.

### 2. `contradiction-banner.js`

```js
export function detectContradiction(draftText, plant);
// Returns null | {message, fieldName, draftValue, recordedValue}

export function renderContradictionBanner(mountEl, contradiction);
```

Logic:
- Parse draft via `parseObservation`, extract scalars (phExtracted, tempExtracted, rhExtracted, ecExtracted).
- For each extracted scalar, check plant's most recent log (last 24h) with matching `details.<field>`.
- Tolerance: pH 0.3, temp 2°, humidity 5%, EC 0.2. If exceeded, return contradiction.
- Banner message: `"Your note says pH was 5.0 but today's log recorded pH 6.2. Double-check which is right."`
- Mount above note textarea in log-form.js. Close button clears mount.

### 3. `recent-observations-widget.js`

```js
export function mountRecentObservationsWidget(mountEl, activePlantId);
// Returns { destroy }
```

- `getRelevantObservations(getObservationIndex(), { plantId: activePlantId })`.
- Sort by observedAt desc, take 5.
- `<details>` element, collapsed by default.
- Summary: `"Recent observations (${n})"`.
- Each item: row with `rawText` (80-char truncate), domain chip, severity chip (display-only variant of `severity-chip.js`).
- Mount between plant header and log timeline.

### 4. `journal-domain-filter.js`

```js
export function mountJournalDomainFilter(mountEl, onChange);
```

- Reads `getObservationIndex().byDomain` keys.
- Options: `all` + one per observed domain. Default `all`.
- `onChange(selectedDomain)` fires on selection change.
- Plant-detail timeline hides log entries whose parsed observations have no keyword matching selected domain.
- View-state only, no store mutation.

### 5. `plant-detail.js` edits

Under each log's notes, render parsed-keyword chip row:
```
<div class="nc-log-chip-row">
  <span class="nc-keyword-chip nc-domain-${domain}">${matchedText}</span>
  ...
</div>
```

Mount order:
1. Plant header (existing)
2. Recent Observations widget (new)
3. Journal domain filter (new)
4. Log timeline (existing, with chips + filter hiding)

### 6. `debug-waterfall.js`

```js
export function renderDebugWaterfall(mountEl);
```

- Read `getObservationIndex().all`, sort observedAt desc.
- Take first 200 (`MAX_WATERFALL_ROWS = 200`).
- Render `<table class="nc-waterfall">` columns:
  - **Raw text** (120-char truncate)
  - **Parsed keywords** (list of ruleIds)
  - **Merged ctx** (`JSON.stringify(mergeNoteContext([obs]))`)
  - **Applied weight** (severity + ageHours, or `resolveScalar` if practical)
  - **Cited by** (`Array.from(getCitationsFor(obs.id) || []).join(', ') || '—'`)
- Fixed-position overlay, bottom 40vh, draggable close button, semi-transparent bg.
- Re-render on 300ms debounced store subscription.

### 7. `?debugNotes=1` hook in `js/main.js`

```js
if (new URLSearchParams(location.search).get('debugNotes') === '1') {
  sessionStorage.setItem('growdoc-debug-notes', '1');
}
if (sessionStorage.getItem('growdoc-debug-notes') === '1') {
  import('./components/debug-waterfall.js').then(({ renderDebugWaterfall }) => {
    const panel = document.createElement('div');
    panel.id = 'nc-debug-waterfall-panel';
    document.body.appendChild(panel);
    renderDebugWaterfall(panel);
  });
}
```

Dynamic import keeps debug code out of normal-user bundles. Close button clears sessionStorage + removes element.

### 8. Task card suppressed-state rendering

When `task.suppressedBy?.length`:
- `.nc-suppressed-banner` containing blockquote with `task.suppressedNoteRef.rawText`, relative-time label, `<button class="nc-override-btn">Override (re-blocks for 12h)</button>`.
- Click handler: `taskEngine.overrideSuppression(task.id, task.plantId, task.type)` (API from section-07).
- Button label explicit: `Override (re-blocks for 12h)` for water, `24h` for feed, etc.

File edit: `js/components/task-card.js`. Extend existing render to detect `suppressedBy`.

## CSS additions

Append to `css/note-contextualizer.css` using `var(--color-*)`:

- `.nc-keyword-chip` — pill, small padding, rounded, `font-size: 0.75rem`.
- `.nc-domain-chip` — similar.
- `.nc-domain-water`, `.nc-domain-ph`, `.nc-domain-nutrient`, `.nc-domain-pest`, `.nc-domain-light`, `.nc-domain-temp`, `.nc-domain-humidity`, `.nc-domain-aroma`, `.nc-domain-trichome`, `.nc-domain-cure-burp`, `.nc-domain-cure-dry`, `.nc-domain-stress`, fallback `.nc-domain-unknown`.
- `.nc-contradiction-banner` — `var(--color-warning-bg)`, icon, close button.
- `.nc-recent-observations-widget details > summary` — pointer cursor, chevron.
- `.nc-waterfall` — table layout, monospace raw-text, overflow-auto, max-height 40vh.
- `#nc-debug-waterfall-panel` — fixed bottom 0, 40vh, backdrop-filter blur, high z-index.
- `.nc-suppressed-banner` — muted background, quoted-note style, indented.
- `.nc-override-btn` — secondary button.

## Edge cases

- Empty index → all widgets render graceful empty states.
- Active plant switch → Recent Observations + journal filter re-render. Subscribe to store, unsubscribe on destroy.
- Draft with no parseable content → strip empty, banner hidden.
- Severity chip write-through unchanged (locked in section-02).
- Debug waterfall without citations → rows still render, "Cited by" shows `—`. Section-10 populates.
- No new store slots. No new env vars.

## Register test file in `js/main.js:298`

```js
import { runTests as runUiNoteContextTests } from './tests/ui-note-contextualizer.test.js';
// Inside registry:
{ name: 'ui-note-contextualizer', run: runUiNoteContextTests },
```

## Manual verification

1. `vercel dev`, `/test-runner` hard reload. All `ui-note-contextualizer` tests pass.
2. Log note `"ph was 5.0"` on plant with recent log `pH 6.2` → contradiction banner appears.
3. Type `"leaves drooping, flushed yesterday with 6.0"` in log form → strip shows 2–3 keyword chips on blur.
4. Plant Detail → Recent Observations widget collapsed; click reveals last 5.
5. Journal filter set to `water` → timeline hides non-water logs.
6. Add `?debugNotes=1` to URL → waterfall panel at bottom. Navigate SPA → panel persists.
7. Trigger suppressed task via log → task card shows banner + "Override (re-blocks for 12h)" button.
8. Click Override → task re-blocks via section-07 API.

## Out of scope

- `recordReferencedIn` call-site wiring from advisors — section-10.
- `sw.js` VERSION bump — section-10.
- Full test suite against production — section-10.
- Cure tracker severity chip + strip — section-09.

Commit: `section-08: note contextualizer UI finalization + debug waterfall`
