diff --git a/css/note-contextualizer.css b/css/note-contextualizer.css
new file mode 100644
index 0000000..ed8a6b0
--- /dev/null
+++ b/css/note-contextualizer.css
@@ -0,0 +1,74 @@
+/* GrowDoc Companion — Note Contextualizer UI (section-02)
+ *
+ * All values pull from css/variables.css. No new custom properties.
+ * Upgraded in section-08 with real parsed-signal chips. */
+
+.nc-severity-chip-row {
+  display: flex;
+  flex-direction: row;
+  flex-wrap: wrap;
+  gap: 8px;
+  align-items: center;
+  margin: 6px 0 4px 0;
+}
+
+.nc-severity-chip {
+  appearance: none;
+  border: 1px solid var(--color-border, #d6d4cb);
+  background: var(--color-bg-elevated, #f3f1e9);
+  color: var(--text-primary, #2a2a28);
+  border-radius: 999px;
+  padding: 2px 10px;
+  font-size: var(--font-size-xs, 0.75rem);
+  font-family: inherit;
+  line-height: 1.4;
+  cursor: pointer;
+  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
+}
+
+.nc-severity-chip:hover {
+  border-color: var(--text-muted, #8a8876);
+}
+
+.nc-severity-chip-alert[aria-checked="true"] {
+  background: var(--status-urgent-bg, rgba(196, 74, 74, 0.18));
+  border-color: var(--status-urgent, #c44a4a);
+  color: var(--status-urgent, #c44a4a);
+  font-weight: 600;
+}
+
+.nc-severity-chip-watch[aria-checked="true"] {
+  background: var(--status-action-bg, rgba(204, 136, 52, 0.18));
+  border-color: var(--status-action, #cc8834);
+  color: var(--status-action, #cc8834);
+  font-weight: 600;
+}
+
+.nc-severity-chip-info[aria-checked="true"] {
+  background: var(--status-good-bg, rgba(90, 138, 73, 0.15));
+  border-color: var(--status-good, #5a8a49);
+  color: var(--status-good, #5a8a49);
+  font-weight: 600;
+}
+
+.nc-severity-chip-row[data-auto-inferred="true"]::after {
+  content: 'auto-detected';
+  font-size: var(--font-size-xs, 0.72rem);
+  color: var(--text-muted, #8a8876);
+  font-style: italic;
+  margin-left: 4px;
+}
+
+.nc-parsed-strip {
+  display: block;
+  margin-top: 4px;
+  margin-bottom: 6px;
+  font-size: var(--font-size-xs, 0.75rem);
+  color: var(--text-muted, #8a8876);
+  line-height: 1.4;
+}
+
+.nc-parsed-strip[data-placeholder="true"] {
+  font-style: italic;
+  opacity: 0.65;
+}
diff --git a/index.html b/index.html
index b69dc3b..7ac48d5 100644
--- a/index.html
+++ b/index.html
@@ -22,6 +22,7 @@
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=IBM+Plex+Mono:wght@400;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..900;1,8..60,300..900&display=swap" rel="stylesheet">
   <link rel="stylesheet" href="/css/variables.css">
+  <link rel="stylesheet" href="/css/note-contextualizer.css">
   <link rel="stylesheet" href="/css/layout.css">
   <link rel="stylesheet" href="/css/components.css">
   <link rel="stylesheet" href="/css/onboarding.css">
diff --git a/js/components/log-form.js b/js/components/log-form.js
index 7ee99e6..9f73342 100644
--- a/js/components/log-form.js
+++ b/js/components/log-form.js
@@ -1,6 +1,8 @@
 // GrowDoc Companion — Quick Log Form Component
 
 import { generateId } from '../utils.js';
+import { mountSeverityChip } from './severity-chip.js';
+import { mountParsedSignalStrip } from './parsed-signal-strip.js';
 
 const LOG_TYPES = [
   { id: 'water', label: 'Water', icon: '💧' },
@@ -19,6 +21,9 @@ export function renderLogForm(container, options) {
   form.className = 'log-form';
 
   let selectedType = logType;
+  // Note contextualizer: captured across _renderDetails re-renders so the
+  // severity chip survives a log-type change and _buildEntry can read it.
+  const formState = { severity: null };
 
   // Type selector
   const typeBar = document.createElement('div');
@@ -29,7 +34,7 @@ export function renderLogForm(container, options) {
     btn.textContent = `${lt.icon} ${lt.label}`;
     btn.addEventListener('click', () => {
       selectedType = lt.id;
-      _renderDetails(detailArea, selectedType, plantId, store);
+      _renderDetails(detailArea, selectedType, plantId, store, formState);
       typeBar.querySelectorAll('.btn').forEach(b => b.classList.remove('btn-primary'));
       btn.classList.add('btn-primary');
     });
@@ -40,7 +45,7 @@ export function renderLogForm(container, options) {
   // Detail area (expandable)
   const detailArea = document.createElement('div');
   detailArea.className = 'log-details';
-  if (selectedType) _renderDetails(detailArea, selectedType, plantId, store);
+  if (selectedType) _renderDetails(detailArea, selectedType, plantId, store, formState);
   form.appendChild(detailArea);
 
   // Action buttons
@@ -52,7 +57,7 @@ export function renderLogForm(container, options) {
   logBtn.textContent = 'Log it';
   logBtn.addEventListener('click', () => {
     if (!selectedType) return;
-    const entry = _buildEntry(selectedType, detailArea, taskRef);
+    const entry = _buildEntry(selectedType, detailArea, taskRef, formState);
     if (onSubmit) onSubmit(entry);
   });
 
@@ -68,7 +73,7 @@ export function renderLogForm(container, options) {
   container.appendChild(form);
 }
 
-function _renderDetails(container, type, plantId, store) {
+function _renderDetails(container, type, plantId, store, formState) {
   container.innerHTML = '';
   const expand = document.createElement('details');
   const summary = document.createElement('summary');
@@ -128,9 +133,23 @@ function _renderDetails(container, type, plantId, store) {
   fields.appendChild(_textareaField('log-notes', 'Notes'));
   expand.appendChild(fields);
   container.appendChild(expand);
+
+  // Note contextualizer scaffolding — mount chip + parsed strip under notes.
+  const notesField = fields.querySelector('#log-notes');
+  if (notesField) {
+    const chipHolder = document.createElement('div');
+    notesField.parentNode.insertBefore(chipHolder, notesField.nextSibling);
+    mountSeverityChip(chipHolder, {
+      target: formState || {},
+      targetKey: 'severity',
+      initial: (formState && formState.severity) || null,
+      autoInferFrom: notesField,
+    });
+    mountParsedSignalStrip(chipHolder);
+  }
 }
 
-function _buildEntry(type, detailArea, taskRef) {
+function _buildEntry(type, detailArea, taskRef, formState) {
   const details = {};
   const phEl = detailArea.querySelector('#log-ph');
   const ecEl = detailArea.querySelector('#log-ec');
@@ -147,6 +166,9 @@ function _buildEntry(type, detailArea, taskRef) {
   if (actionEl?.value) details.action = actionEl.value;
   if (condEl?.value) details.condition = condEl.value;
   if (nutrEl?.value) details.nutrients = nutrEl.value;
+  if (formState && (formState.severity === 'urgent' || formState.severity === 'concern')) {
+    details.severity = formState.severity;
+  }
 
   return {
     id: generateId(),
diff --git a/js/components/parsed-signal-strip.js b/js/components/parsed-signal-strip.js
new file mode 100644
index 0000000..d90bfdb
--- /dev/null
+++ b/js/components/parsed-signal-strip.js
@@ -0,0 +1,39 @@
+// GrowDoc Companion — Parsed Signal Strip (section-02 placeholder)
+//
+// Section-02 ships the scaffold and the literal placeholder "[parsing soon…]".
+// Section-08 upgrades `refresh()` to render real parsed keyword chips from
+// the observation index. Section-08 has a regression test asserting the
+// placeholder string is gone — do NOT remove the canary in section-02 tests.
+//
+// This module deliberately does NOT import from js/data/note-contextualizer/*
+// or js/data/observation-schema.js. Section-01 may ship in parallel, and the
+// strip must not care whether the schema module has landed yet.
+
+/**
+ * Mount a parsed-signal strip immediately after the anchor element.
+ *
+ * @param {HTMLElement} anchor    Element to insert the strip after.
+ * @param {Object}       [_options] Reserved for section-08.
+ * @returns {{ element: HTMLElement, refresh: () => void, destroy: () => void }}
+ */
+export function mountParsedSignalStrip(anchor, _options = {}) {
+  const strip = document.createElement('div');
+  strip.className = 'nc-parsed-strip';
+  strip.dataset.placeholder = 'true';
+  strip.textContent = '[parsing soon…]';
+
+  if (anchor && anchor.parentNode) {
+    anchor.parentNode.insertBefore(strip, anchor.nextSibling);
+  }
+
+  function refresh() {
+    // No-op until section-08. Keeping the stable export surface so
+    // callers can install once at mount time and never check versions.
+  }
+
+  function destroy() {
+    if (strip.parentNode) strip.parentNode.removeChild(strip);
+  }
+
+  return { element: strip, refresh, destroy };
+}
diff --git a/js/components/severity-chip.js b/js/components/severity-chip.js
new file mode 100644
index 0000000..b32d965
--- /dev/null
+++ b/js/components/severity-chip.js
@@ -0,0 +1,147 @@
+// GrowDoc Companion — Severity Chip Component (section-02)
+//
+// Three-way note severity selector. DISPLAY labels are info / watch / alert
+// (alphabetical by severity ascending in the ordering requested by the plan).
+// On click we write the LEGACY on-disk enum ('urgent' | 'concern' | null) to
+// `target[targetKey]` for backwards compatibility with every existing GrowDoc
+// caller that already reads `log.details.severity` as the legacy enum.
+//
+// Real auto-infer lives in section-03's SEVERITY_HEURISTICS. This module
+// ships a small placeholder heuristic so blurring a textarea with clearly
+// urgent or clearly cautious words nudges the chip without breaking the
+// caller's severity field if the user never touches the chip.
+
+const OPTIONS = ['info', 'watch', 'alert']; // DOM order: low → high
+
+const DISPLAY_TO_LEGACY = {
+  info: null,
+  watch: 'concern',
+  alert: 'urgent',
+};
+
+const LEGACY_TO_DISPLAY = {
+  urgent: 'alert',
+  concern: 'watch',
+};
+
+/**
+ * Placeholder heuristic. Returns the legacy enum value. The real keyword
+ * matcher with proper boundaries and grouping lands in section-03.
+ * Section-02 tests assert `'dying' → urgent`, `'looks fine' → null`.
+ *
+ * @param {string} text
+ * @returns {'urgent'|'concern'|null}
+ */
+export function autoInferSeverity(text) {
+  if (typeof text !== 'string' || text.trim().length === 0) return null;
+  const t = text.toLowerCase();
+  const urgent = /\b(dying|dead|crashing|emergency|wilted?|rotting|root\s?rot|burning|burnt)\b/;
+  const concern = /\b(worried|concerned?|slight|drooping?|yellow(ing)?|curling?|stressed?|sluggish|slow)\b/;
+  if (urgent.test(t)) return 'urgent';
+  if (concern.test(t)) return 'concern';
+  return null;
+}
+
+/**
+ * Mount a severity chip row into `container`. Writes the legacy enum
+ * value to `target[targetKey]` on every change.
+ *
+ * @param {HTMLElement} container
+ * @param {{
+ *   target?: Object,
+ *   targetKey?: string,
+ *   initial?: 'urgent'|'concern'|null,
+ *   autoInferFrom?: HTMLTextAreaElement|HTMLInputElement|null
+ * }} options
+ */
+export function mountSeverityChip(container, options = {}) {
+  const {
+    target = null,
+    targetKey = 'severity',
+    initial = null,
+    autoInferFrom = null,
+  } = options;
+
+  const row = document.createElement('div');
+  row.className = 'nc-severity-chip-row';
+  row.setAttribute('role', 'radiogroup');
+  row.setAttribute('aria-label', 'Severity');
+
+  const buttons = new Map(); // display-label -> button element
+  let currentLegacy = null;
+  let autoInferred = false;
+
+  for (const display of OPTIONS) {
+    const btn = document.createElement('button');
+    btn.type = 'button';
+    btn.className = `nc-severity-chip nc-severity-chip-${display}`;
+    btn.textContent = display;
+    btn.setAttribute('role', 'radio');
+    btn.setAttribute('aria-checked', 'false');
+    btn.dataset.severity = display;
+    btn.addEventListener('click', (e) => {
+      e.preventDefault();
+      e.stopPropagation();
+      setValue(DISPLAY_TO_LEGACY[display], false);
+    });
+    buttons.set(display, btn);
+    row.appendChild(btn);
+  }
+
+  container.appendChild(row);
+
+  function _syncRow() {
+    const displayForCurrent = currentLegacy === null ? 'info' : LEGACY_TO_DISPLAY[currentLegacy];
+    for (const [d, btn] of buttons) {
+      const selected = d === displayForCurrent && currentLegacy !== null;
+      // When nothing is selected (initial null), no button carries the
+      // aria-checked="true" state. We still highlight once the user picks.
+      btn.setAttribute('aria-checked', selected ? 'true' : 'false');
+      if (selected) btn.dataset.selected = 'true';
+      else delete btn.dataset.selected;
+    }
+    if (autoInferred) row.dataset.autoInferred = 'true';
+    else delete row.dataset.autoInferred;
+  }
+
+  function setValue(legacy, fromAutoInfer) {
+    currentLegacy = legacy;
+    autoInferred = !!fromAutoInfer;
+    if (target) target[targetKey] = legacy;
+    _syncRow();
+  }
+
+  function getValue() {
+    return currentLegacy;
+  }
+
+  function isAutoInferred() {
+    return autoInferred;
+  }
+
+  // Hydrate from initial without marking the target mutated on mount.
+  if (initial === 'urgent' || initial === 'concern') {
+    currentLegacy = initial;
+    autoInferred = false;
+    _syncRow();
+    if (target && target[targetKey] === undefined) {
+      // Establish the field so downstream code can read it safely.
+      target[targetKey] = initial;
+    }
+  } else {
+    _syncRow();
+  }
+
+  // Auto-infer binding: only fires on blur when the chip is still null
+  // (i.e., user did not pick one explicitly). Manual clicks clear the
+  // auto-inferred flag via setValue(..., false) above.
+  if (autoInferFrom && typeof autoInferFrom.addEventListener === 'function') {
+    autoInferFrom.addEventListener('blur', () => {
+      if (currentLegacy !== null) return;
+      const inferred = autoInferSeverity(autoInferFrom.value);
+      if (inferred !== null) setValue(inferred, true);
+    });
+  }
+
+  return { element: row, getValue, setValue, isAutoInferred };
+}
diff --git a/js/components/task-card.js b/js/components/task-card.js
index 3834f3c..60c24eb 100644
--- a/js/components/task-card.js
+++ b/js/components/task-card.js
@@ -1,6 +1,8 @@
 // GrowDoc Companion — Task Card UI Component
 
 import { getExperienceDetail, TASK_KNOWLEDGE_MAP } from './task-engine.js';
+import { mountSeverityChip } from './severity-chip.js';
+import { mountParsedSignalStrip } from './parsed-signal-strip.js';
 
 const PRIORITY_COLORS = { urgent: 'var(--status-urgent)', recommended: 'var(--status-action)', optional: 'var(--status-good)' };
 const EVIDENCE_COLORS = { established: 'var(--evidence-strong)', promising: 'var(--evidence-moderate)', speculative: 'var(--evidence-emerging)', practitioner: 'var(--evidence-anecdotal)' };
@@ -147,6 +149,21 @@ function _toggleNotesInput(expandable, task, onNotes) {
   input.rows = 2;
   input.value = task.notes || '';
   input.placeholder = 'Add a note...';
+  group.appendChild(input);
+
+  // Note contextualizer: severity chip + parsed-signal placeholder strip.
+  // Chip writes the legacy enum to task.details.severity (new slot); full
+  // override/quoted-note UI lands in section-07.
+  if (!task.details) task.details = {};
+  const ncHolder = document.createElement('div');
+  group.appendChild(ncHolder);
+  mountSeverityChip(ncHolder, {
+    target: task.details,
+    targetKey: 'severity',
+    initial: task.details.severity || null,
+    autoInferFrom: input,
+  });
+  mountParsedSignalStrip(ncHolder);
 
   const saveBtn = document.createElement('button');
   saveBtn.className = 'btn btn-primary btn-sm';
@@ -157,7 +174,6 @@ function _toggleNotesInput(expandable, task, onNotes) {
     if (onNotes) onNotes(task.id, raw);
   });
 
-  group.appendChild(input);
   group.appendChild(saveBtn);
   expandable.appendChild(group);
   input.focus();
diff --git a/js/main.js b/js/main.js
index 3da025e..a10a95a 100644
--- a/js/main.js
+++ b/js/main.js
@@ -318,6 +318,7 @@ async function renderTestRunner(container) {
     { name: 'stage-timeline', path: './tests/stage-timeline.test.js' },
     { name: 'task-engine', path: './tests/task-engine.test.js' },
     { name: 'note-contextualizer', path: './tests/note-contextualizer.test.js' },
+    { name: 'severity-chip', path: './tests/severity-chip.test.js' },
     { name: 'dashboard', path: './views/dashboard.js' },
     { name: 'vpd-widget', path: './components/vpd-widget.js' },
     { name: 'feeding-calculator', path: './data/feeding-calculator.js' },
diff --git a/js/tests/severity-chip.test.js b/js/tests/severity-chip.test.js
new file mode 100644
index 0000000..44742dd
--- /dev/null
+++ b/js/tests/severity-chip.test.js
@@ -0,0 +1,154 @@
+// GrowDoc Companion — Severity Chip Tests (section-02)
+//
+// DOM tests use scratch containers per case, torn down between tests.
+// Canary: the "parsing soon…" placeholder string MUST match the one
+// section-08 rewrites, so updating it here without updating that test
+// will break the regression fence.
+
+import {
+  mountSeverityChip,
+  autoInferSeverity,
+} from '../components/severity-chip.js';
+import { mountParsedSignalStrip } from '../components/parsed-signal-strip.js';
+
+function scratch() {
+  const d = document.createElement('div');
+  document.body.appendChild(d);
+  return d;
+}
+
+function cleanup(...els) {
+  for (const el of els) if (el && el.parentNode) el.parentNode.removeChild(el);
+}
+
+export async function runTests() {
+  const results = [];
+  const assert = (cond, msg) => {
+    results.push({ pass: !!cond, msg });
+    if (!cond) console.error(`FAIL: ${msg}`);
+  };
+
+  // 1 — renders three chips in DOM order: info, watch, alert
+  {
+    const box = scratch();
+    mountSeverityChip(box, {});
+    const chips = box.querySelectorAll('.nc-severity-chip');
+    assert(chips.length === 3, 'severity-chip: renders 3 chips');
+    assert(chips[0].textContent === 'info', 'severity-chip: order[0] === info');
+    assert(chips[1].textContent === 'watch', 'severity-chip: order[1] === watch');
+    assert(chips[2].textContent === 'alert', 'severity-chip: order[2] === alert');
+    cleanup(box);
+  }
+
+  // 2 — clicking alert writes 'urgent' to target
+  {
+    const box = scratch();
+    const target = {};
+    mountSeverityChip(box, { target, targetKey: 'severity' });
+    box.querySelector('.nc-severity-chip-alert').click();
+    assert(target.severity === 'urgent', 'click alert → target.severity === urgent');
+    cleanup(box);
+  }
+
+  // 3 — clicking watch writes 'concern'
+  {
+    const box = scratch();
+    const target = {};
+    mountSeverityChip(box, { target });
+    box.querySelector('.nc-severity-chip-watch').click();
+    assert(target.severity === 'concern', 'click watch → target.severity === concern');
+    cleanup(box);
+  }
+
+  // 4 — clicking info writes null
+  {
+    const box = scratch();
+    const target = { severity: 'urgent' };
+    mountSeverityChip(box, { target, initial: 'urgent' });
+    box.querySelector('.nc-severity-chip-info').click();
+    assert(target.severity === null, 'click info → target.severity === null');
+    cleanup(box);
+  }
+
+  // 5 — autoInferSeverity: 'dying' → urgent
+  {
+    assert(autoInferSeverity('the plant is dying') === 'urgent', "autoInferSeverity('dying') → urgent");
+  }
+
+  // 6 — autoInferSeverity: 'looks fine' → null
+  {
+    assert(autoInferSeverity('looks fine') === null, "autoInferSeverity('looks fine') → null");
+  }
+
+  // 7 — auto-infer via textarea blur sets severityAutoInferred flag
+  {
+    const box = scratch();
+    const ta = document.createElement('textarea');
+    box.appendChild(ta);
+    const target = {};
+    const chip = mountSeverityChip(box, { target, autoInferFrom: ta });
+    ta.value = 'the plant is dying';
+    ta.dispatchEvent(new Event('blur'));
+    assert(chip.getValue() === 'urgent', 'auto-infer on blur: urgent detected');
+    assert(chip.isAutoInferred() === true, 'auto-infer on blur: flag set');
+    assert(target.severity === 'urgent', 'auto-infer on blur: target updated');
+    assert(chip.element.dataset.autoInferred === 'true', 'auto-infer on blur: data attribute set');
+    cleanup(box);
+  }
+
+  // 8 — user override clears severityAutoInferred flag
+  {
+    const box = scratch();
+    const ta = document.createElement('textarea');
+    box.appendChild(ta);
+    const chip = mountSeverityChip(box, { target: {}, autoInferFrom: ta });
+    ta.value = 'rotting at the base';
+    ta.dispatchEvent(new Event('blur'));
+    assert(chip.isAutoInferred() === true, 'pre-override: flag set');
+    box.querySelector('.nc-severity-chip-watch').click();
+    assert(chip.isAutoInferred() === false, 'manual click clears autoInferred flag');
+    assert(chip.element.dataset.autoInferred === undefined, 'manual click removes data attribute');
+    cleanup(box);
+  }
+
+  // 9 — initial='urgent' hydrates alert as aria-checked
+  {
+    const box = scratch();
+    mountSeverityChip(box, { initial: 'urgent' });
+    const alertBtn = box.querySelector('.nc-severity-chip-alert');
+    assert(alertBtn.getAttribute('aria-checked') === 'true', 'initial=urgent hydrates alert button');
+    cleanup(box);
+  }
+
+  // 10 — mountParsedSignalStrip renders the literal placeholder canary
+  //      Section-08 has a regression test that asserts this string is GONE.
+  {
+    const box = scratch();
+    const anchor = document.createElement('textarea');
+    box.appendChild(anchor);
+    const strip = mountParsedSignalStrip(anchor);
+    assert(strip.element.textContent === '[parsing soon…]', 'parsed-signal-strip: placeholder text canary');
+    assert(strip.element.dataset.placeholder === 'true', 'parsed-signal-strip: placeholder data attr');
+    strip.destroy();
+    assert(!strip.element.parentNode, 'parsed-signal-strip: destroy removes from DOM');
+    cleanup(box);
+  }
+
+  // 11 — mount twice in the same container: independent instances
+  {
+    const box = scratch();
+    const t1 = {};
+    const t2 = {};
+    mountSeverityChip(box, { target: t1 });
+    mountSeverityChip(box, { target: t2 });
+    const rows = box.querySelectorAll('.nc-severity-chip-row');
+    assert(rows.length === 2, 'two mounts create two rows');
+    rows[0].querySelector('.nc-severity-chip-alert').click();
+    rows[1].querySelector('.nc-severity-chip-watch').click();
+    assert(t1.severity === 'urgent', 'first mount writes to first target');
+    assert(t2.severity === 'concern', 'second mount writes to second target');
+    cleanup(box);
+  }
+
+  return results;
+}
diff --git a/js/views/plant-detail.js b/js/views/plant-detail.js
index 0e58f8b..a1e4b02 100644
--- a/js/views/plant-detail.js
+++ b/js/views/plant-detail.js
@@ -8,6 +8,8 @@ import { POT_SIZES } from '../data/constants.js';
 import { daysSinceLog as _daysSince } from '../utils.js';
 import { loadPhoto } from '../photos.js';
 import { navigate } from '../router.js';
+import { mountSeverityChip } from '../components/severity-chip.js';
+import { mountParsedSignalStrip } from '../components/parsed-signal-strip.js';
 
 /**
  * renderPlantDetail(container, store, plantId) — Single plant detail view.
@@ -543,6 +545,10 @@ function _renderEditTab(container, plant, store, pageContainer, plantId) {
   notesArea.className = 'input';
   notesArea.rows = 3;
   notesArea.value = plant.notes || '';
+
+  // Local severity state, persisted to plant.details.severity on blur.
+  const notesSeverityState = { severity: (plant.details && plant.details.severity) || null };
+
   notesArea.addEventListener('blur', () => {
     const raw = notesArea.value;
     const growSnap = store.getSnapshot().grow;
@@ -550,12 +556,26 @@ function _renderEditTab(container, plant, store, pageContainer, plantId) {
     if (p) {
       p.notes = raw;
       p.context = parseProfileNotes({ plant: raw });
+      if (!p.details) p.details = {};
+      p.details.severity = notesSeverityState.severity;
       store.commit('grow', growSnap);
       flashSaved(notesArea);
     }
   });
   notesGroup.appendChild(notesHint);
   notesGroup.appendChild(notesArea);
+
+  // Note contextualizer scaffolding — chip + placeholder strip.
+  const ncHolder = document.createElement('div');
+  notesGroup.appendChild(ncHolder);
+  mountSeverityChip(ncHolder, {
+    target: notesSeverityState,
+    targetKey: 'severity',
+    initial: notesSeverityState.severity,
+    autoInferFrom: notesArea,
+  });
+  mountParsedSignalStrip(ncHolder);
+
   container.appendChild(notesGroup);
 }
 
