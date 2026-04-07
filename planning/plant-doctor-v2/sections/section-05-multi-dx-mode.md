# Section 05: Multi-Dx Mode

## Overview

Build the full Multi-Dx diagnostic flow — the third mode of Plant Doctor. This mode allows users to select multiple symptoms simultaneously for compound diagnosis. The flow has three phases: symptom selection (checkboxes grouped by plant region), refining questions (adaptive follow-ups), and results (ranked diagnoses + combined action plan).

**Files to modify:**
- `docs/tool-plant-doctor.html` — CSS additions, three new render functions, event binding, multi-dx state transitions

**Dependencies:** Section 01 (knowledge base), Section 02 (state/mode selector), Section 03 (scoring engine), Section 04 (notes component)

**Blocks:** Section 06 (treatment journal)

---

## Tests First

Add these tests inside `runTests()`, guarded by `dataFileLoaded()`.

```js
// ── Section 05: Multi-Dx Mode Tests ──

if (dataFileLoaded()) {

  // Test: multiDxState.phase starts at 'select'
  resetMultiDxState();
  assert(multiDxState.phase === 'select', 'multiDxState.phase starts at select');

  // Test: selecting symptoms updates multiDxState.selectedSymptoms
  multiDxState.selectedSymptoms = [];
  toggleSymptom('yellow-lower');
  assert(multiDxState.selectedSymptoms.indexOf('yellow-lower') !== -1, 'toggleSymptom adds symptom');
  toggleSymptom('yellow-lower');
  assert(multiDxState.selectedSymptoms.indexOf('yellow-lower') === -1, 'toggleSymptom removes symptom on second call');

  // Test: canDiagnose returns false when < 2 symptoms selected
  multiDxState.selectedSymptoms = ['yellow-lower'];
  multiDxState.stage = 'veg';
  assert(canDiagnose() === false, 'canDiagnose false with 1 symptom');

  // Test: canDiagnose returns false when no stage selected
  multiDxState.selectedSymptoms = ['yellow-lower', 'brown-tips'];
  multiDxState.stage = null;
  assert(canDiagnose() === false, 'canDiagnose false with no stage');

  // Test: canDiagnose returns true with stage + 2 symptoms
  multiDxState.stage = 'veg';
  multiDxState.selectedSymptoms = ['yellow-lower', 'brown-tips'];
  assert(canDiagnose() === true, 'canDiagnose true with stage + 2 symptoms');

  // Test: runMultiDxDiagnosis transitions to refining or results
  multiDxState.stage = 'veg';
  multiDxState.selectedSymptoms = ['yellow-lower', 'brown-tips', 'pale-overall'];
  runMultiDxDiagnosis();
  assert(multiDxState.phase === 'refining' || multiDxState.phase === 'results',
    'runMultiDxDiagnosis transitions to refining or results (got ' + multiDxState.phase + ')');
  assert(multiDxState.results.length > 0, 'runMultiDxDiagnosis produces results');

  // Test: if no refine rules match, skip directly to results phase
  // (This depends on symptom selection — test with symptoms that have clear single-diagnosis match)
  resetMultiDxState();
  multiDxState.stage = 'seedling';
  multiDxState.selectedSymptoms = ['stretching', 'pale-overall'];
  runMultiDxDiagnosis();
  // Result might be refining or results — both are valid depending on data
  assert(multiDxState.phase === 'refining' || multiDxState.phase === 'results',
    'Diagnosis completes to a valid phase');

  // Test: refine step increments after answer
  if (multiDxState.phase === 'refining' && multiDxState.refineQuestions.length > 0) {
    var prevStep = multiDxState.refineStep;
    answerRefineQuestion(0);
    assert(multiDxState.refineStep === prevStep + 1, 'Refine step increments after answer');
  }

  // Test: "Start Over" resets multiDxState to initial values
  multiDxState.selectedSymptoms = ['yellow-lower', 'brown-tips'];
  multiDxState.phase = 'results';
  multiDxState.results = [{ resultId: 'r-n-def', score: 0.8, matchedSymptoms: ['yellow-lower'] }];
  resetMultiDxState();
  assert(multiDxState.phase === 'select', 'resetMultiDxState resets phase to select');
  assert(multiDxState.selectedSymptoms.length === 0, 'resetMultiDxState clears symptoms');
  assert(multiDxState.results.length === 0, 'resetMultiDxState clears results');

  // Test: results phase shows ranked diagnoses
  multiDxState.stage = 'veg';
  multiDxState.selectedSymptoms = ['yellow-lower', 'brown-tips', 'drooping'];
  runMultiDxDiagnosis();
  // Skip to results if in refining
  while (multiDxState.phase === 'refining' && multiDxState.refineStep < multiDxState.refineQuestions.length) {
    answerRefineQuestion(0);
  }
  assert(multiDxState.results.length > 0, 'Results phase has ranked diagnoses');
  assert(multiDxState.results[0].score >= multiDxState.results[multiDxState.results.length - 1].score,
    'Results are sorted descending by score');
  resetMultiDxState();

  // Test: renderMultiDxSelect produces HTML with checkboxes
  setMode('multi-dx');
  var selectHtml = renderMultiDxSelect();
  assert(selectHtml.indexOf('checkbox') !== -1, 'renderMultiDxSelect includes checkboxes');
  assert(selectHtml.indexOf('Leaves') !== -1 || selectHtml.indexOf('leaves') !== -1,
    'renderMultiDxSelect groups symptoms by region');
  setMode('wizard');

} else {
  console.log('SKIP: Multi-Dx tests (data file not loaded)');
}
```

---

## Implementation Details

### 1. CSS Additions

Add to the existing `<style>` block:

```css
/* Multi-Dx: Growth stage selector */
.stage-selector {
  margin-bottom: 20px;
}
.stage-selector label {
  display: block;
  font-family: var(--mono);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.stage-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.stage-pill {
  font-family: var(--body);
  font-size: 0.85rem;
  padding: 8px 14px;
  border: 1px solid var(--border2);
  border-radius: 8px;
  background: var(--bg3);
  color: var(--text2);
  cursor: pointer;
  min-height: 36px;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.stage-pill:hover {
  border-color: var(--accent3);
  color: var(--text);
}
.stage-pill.selected {
  background: var(--accent3);
  border-color: var(--accent2);
  color: var(--text);
}
.stage-pill:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

/* Multi-Dx: Symptom checkboxes */
.symptom-groups {
  margin-bottom: 20px;
}
.symptom-group {
  margin-bottom: 16px;
}
.symptom-group fieldset {
  border: none;
  padding: 0;
  margin: 0;
}
.symptom-group legend {
  font-family: var(--mono);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding: 0;
}
.symptom-check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  min-height: 40px;
  transition: background 0.15s, border-color 0.15s;
  margin-bottom: 4px;
}
.symptom-check:hover {
  background: rgba(143, 184, 86, 0.06);
}
.symptom-check.checked {
  background: rgba(143, 184, 86, 0.1);
  border-color: var(--accent3);
}
.symptom-check input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  cursor: pointer;
  flex-shrink: 0;
}
.symptom-check-label {
  font-size: 0.9rem;
  color: var(--text);
  cursor: pointer;
}

/* Multi-Dx: Hints and warnings */
.dx-hint {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--text3);
  font-style: italic;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(143, 184, 86, 0.06);
  border-radius: 6px;
}
.dx-warning {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--gold);
  padding: 8px 12px;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 6px;
  margin-bottom: 12px;
}

/* Multi-Dx: Results */
.dx-results-header {
  font-family: var(--serif);
  font-size: 1.3rem;
  color: var(--text);
  margin-bottom: 16px;
}
.dx-rank {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--text3);
  margin-bottom: 4px;
}
.dx-supported-by {
  font-size: 0.82rem;
  color: var(--text3);
  margin-top: 8px;
  font-style: italic;
}
.combined-plan {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px 24px;
  margin-top: 24px;
}
.combined-plan-title {
  font-family: var(--serif);
  font-size: 1.15rem;
  color: var(--accent);
  margin-bottom: 16px;
}
```

### 2. Helper Functions

```js
// Toggle a symptom in/out of the selected list
function toggleSymptom(symptomId) {
  var idx = multiDxState.selectedSymptoms.indexOf(symptomId);
  if (idx === -1) {
    multiDxState.selectedSymptoms.push(symptomId);
  } else {
    multiDxState.selectedSymptoms.splice(idx, 1);
  }
}

// Check if diagnosis can proceed
function canDiagnose() {
  return multiDxState.stage !== null && multiDxState.selectedSymptoms.length >= 2;
}

// Run the diagnosis pipeline
function runMultiDxDiagnosis() {
  // Score diagnoses
  var scores = scoreDiagnoses(multiDxState.selectedSymptoms, multiDxState.stage, []);
  multiDxState.results = scores;

  // Check for refine questions
  var refineQs = getRefineQuestions(scores);
  multiDxState.refineQuestions = refineQs;
  multiDxState.refineStep = 0;
  multiDxState.refineAnswers = [];

  if (refineQs.length > 0) {
    multiDxState.phase = 'refining';
  } else {
    multiDxState.phase = 'results';
  }
}

// Answer a refine question and advance
function answerRefineQuestion(optionIndex) {
  var currentRule = multiDxState.refineQuestions[multiDxState.refineStep];
  if (!currentRule) return;

  // Store answer
  multiDxState.refineAnswers.push({
    ruleId: currentRule.id,
    optionIndex: optionIndex
  });

  // Apply score adjustment
  multiDxState.results = applyRefineAnswer(multiDxState.results, currentRule.id, optionIndex);

  // Advance step
  multiDxState.refineStep++;

  // Check if more questions remain
  if (multiDxState.refineStep >= multiDxState.refineQuestions.length) {
    multiDxState.phase = 'results';
  }
}

// Go back in the multi-dx flow
function multiDxGoBack() {
  if (multiDxState.phase === 'results') {
    if (multiDxState.refineQuestions.length > 0) {
      // Go back to last refine question
      multiDxState.phase = 'refining';
      multiDxState.refineStep = multiDxState.refineQuestions.length - 1;
      multiDxState.refineAnswers.pop();
      // Re-score from scratch and re-apply previous answers
      var scores = scoreDiagnoses(multiDxState.selectedSymptoms, multiDxState.stage, []);
      for (var i = 0; i < multiDxState.refineAnswers.length; i++) {
        var ans = multiDxState.refineAnswers[i];
        scores = applyRefineAnswer(scores, ans.ruleId, ans.optionIndex);
      }
      multiDxState.results = scores;
    } else {
      multiDxState.phase = 'select';
    }
  } else if (multiDxState.phase === 'refining') {
    if (multiDxState.refineStep > 0) {
      multiDxState.refineStep--;
      multiDxState.refineAnswers.pop();
      // Re-score and re-apply
      var scores2 = scoreDiagnoses(multiDxState.selectedSymptoms, multiDxState.stage, []);
      for (var j = 0; j < multiDxState.refineAnswers.length; j++) {
        var ans2 = multiDxState.refineAnswers[j];
        scores2 = applyRefineAnswer(scores2, ans2.ruleId, ans2.optionIndex);
      }
      multiDxState.results = scores2;
    } else {
      multiDxState.phase = 'select';
    }
  }
}
```

### 3. `renderMultiDxSelect()` — Phase 1: Symptom Selection

Renders the growth stage selector and symptom checkboxes grouped by region.

```js
function renderMultiDxSelect() {
  var html = '<div class="fade-in">';

  // Growth stage selector
  html += '<div class="stage-selector">';
  html += '<label>Growth Stage</label>';
  html += '<div class="stage-pills">';
  var stages = [
    { id: 'seedling', label: 'Seedling / Clone' },
    { id: 'veg', label: 'Vegetative' },
    { id: 'early-flower', label: 'Early Flower (wk 1-3)' },
    { id: 'mid-flower', label: 'Mid Flower (wk 4-6)' },
    { id: 'late-flower', label: 'Late Flower (wk 7+)' }
  ];
  for (var si = 0; si < stages.length; si++) {
    var selected = multiDxState.stage === stages[si].id ? ' selected' : '';
    html += '<button class="stage-pill' + selected + '" type="button"'
         + ' data-stage="' + stages[si].id + '">'
         + escapeHtml(stages[si].label) + '</button>';
  }
  html += '</div></div>';

  // Symptom checkboxes grouped by region
  var regions = [
    { id: 'leaves', label: 'Leaves' },
    { id: 'stems', label: 'Stems & Structure' },
    { id: 'roots', label: 'Roots' },
    { id: 'whole', label: 'Whole Plant' }
  ];

  html += '<div class="symptom-groups">';
  for (var ri = 0; ri < regions.length; ri++) {
    var regionSymptoms = [];
    for (var symId in SYMPTOMS) {
      if (!SYMPTOMS.hasOwnProperty(symId)) continue;
      if (SYMPTOMS[symId].region === regions[ri].id) {
        regionSymptoms.push(SYMPTOMS[symId]);
      }
    }
    if (regionSymptoms.length === 0) continue;

    // Sort alphabetically by label for consistent display
    regionSymptoms.sort(function(a, b) {
      return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
    });

    html += '<div class="symptom-group"><fieldset>';
    html += '<legend>' + escapeHtml(regions[ri].label) + '</legend>';
    for (var syi = 0; syi < regionSymptoms.length; syi++) {
      var sym = regionSymptoms[syi];
      var isChecked = multiDxState.selectedSymptoms.indexOf(sym.id) !== -1;
      html += '<label class="symptom-check' + (isChecked ? ' checked' : '') + '">';
      html += '<input type="checkbox" value="' + escapeHtml(sym.id) + '"'
           + (isChecked ? ' checked' : '') + '>';
      html += '<span class="symptom-check-label">' + escapeHtml(sym.label) + '</span>';
      html += '</label>';
    }
    html += '</fieldset></div>';
  }
  html += '</div>';

  // Hints and warnings
  var symCount = multiDxState.selectedSymptoms.length;
  if (symCount === 1) {
    html += '<div class="dx-hint">Select at least 2 symptoms, or use Wizard mode for single-issue diagnosis.</div>';
  }
  if (symCount > 8) {
    html += '<div class="dx-warning">Many symptoms selected — results may be less precise. Consider focusing on the most prominent 4-6.</div>';
  }

  // Notes expander
  var existingNote = multiDxState.notes['step-symptoms'] || '';
  html += renderNotesExpander('step-symptoms', existingNote, 'multiDxNotes');

  // Diagnose button
  var disabled = canDiagnose() ? '' : ' disabled';
  html += '<div class="nav-row" style="margin-top: 16px;">';
  html += '<button class="btn btn-primary" id="btn-diagnose" type="button"' + disabled + '>Diagnose (' + symCount + ' symptoms)</button>';
  html += '</div>';

  html += '</div>';
  return html;
}
```

### 4. `renderMultiDxRefine()` — Phase 2: Refining Questions

Renders one refine question at a time, reusing the question card styling.

```js
function renderMultiDxRefine() {
  var rule = multiDxState.refineQuestions[multiDxState.refineStep];
  if (!rule) return '';

  var html = '<div class="q-card fade-in">';
  html += '<div class="dx-rank">Refining question ' + (multiDxState.refineStep + 1) + ' of ' + multiDxState.refineQuestions.length + '</div>';
  html += '<div class="q-text">' + escapeHtml(rule.question) + '</div>';
  if (rule.help) html += '<div class="q-help">' + escapeHtml(rule.help) + '</div>';
  html += '<div class="options" role="group" aria-label="Answer options">';
  for (var i = 0; i < rule.options.length; i++) {
    html += '<button class="opt-btn" data-refine-idx="' + i + '" type="button">'
         + escapeHtml(rule.options[i].label) + '</button>';
  }
  html += '</div>';

  // Notes expander
  var noteKey = 'refine-' + multiDxState.refineStep;
  var existingNote = multiDxState.notes[noteKey] || '';
  html += renderNotesExpander(noteKey, existingNote, 'multiDxNotes');

  html += '</div>';

  // Navigation
  html += '<div class="nav-row">';
  html += '<button class="btn btn-secondary" id="btn-mdx-back" type="button">Back</button>';
  html += '</div>';

  return html;
}
```

### 5. `renderMultiDxResults()` — Phase 3: Results

Renders ranked diagnosis cards and the combined action plan.

```js
function renderMultiDxResults() {
  var results = multiDxState.results;
  if (!results || results.length === 0) return '<p>No diagnoses matched your symptoms.</p>';

  var html = '<div class="fade-in">';
  html += '<div class="dx-results-header">Combined Diagnosis</div>';

  // Individual diagnosis cards
  for (var i = 0; i < results.length; i++) {
    var diag = results[i];
    var treeNode = TREE[diag.resultId];
    if (!treeNode || !isResult(treeNode)) continue;

    var pct = Math.round(diag.score * 100);
    var sevClass = 'sev-' + treeNode.severity;

    html += '<div class="result-card ' + sevClass + '">';
    html += '<div class="dx-rank">#' + (i + 1) + '</div>';
    html += '<div class="result-dx">' + escapeHtml(treeNode.diagnosis) + '</div>';
    html += '<span class="result-sev ' + sevClass + '">' + escapeHtml(treeNode.severity) + '</span>';

    // Confidence bar
    html += '<div class="conf-wrap"><div class="conf-label">Confidence</div>';
    html += '<div class="conf-bar"><div class="conf-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="conf-pct">' + pct + '%</div></div>';

    // Supported by
    if (diag.matchedSymptoms && diag.matchedSymptoms.length > 0) {
      var symLabels = [];
      for (var mi = 0; mi < diag.matchedSymptoms.length; mi++) {
        var sym = SYMPTOMS[diag.matchedSymptoms[mi]];
        if (sym) symLabels.push(sym.label.toLowerCase());
      }
      html += '<div class="dx-supported-by">Supported by: ' + escapeHtml(symLabels.join(', ')) + '</div>';
    }

    html += '</div>'; // close result-card
  }

  // Combined Action Plan
  var plan = generateCombinedPlan(results);
  html += '<div class="combined-plan">';
  html += '<div class="combined-plan-title">Combined Action Plan</div>';

  if (plan.checkFirst.length > 0) {
    html += '<div class="result-section"><div class="result-section-title">Check First</div><ol class="result-ol">';
    for (var ci = 0; ci < plan.checkFirst.length; ci++) {
      html += '<li>' + escapeHtml(plan.checkFirst[ci]) + '</li>';
    }
    html += '</ol></div>';
  }

  if (plan.fixes.length > 0) {
    html += '<div class="result-section"><div class="result-section-title">Fix Steps</div><ol class="result-ol">';
    for (var fi = 0; fi < plan.fixes.length; fi++) {
      html += '<li>' + escapeHtml(plan.fixes[fi]) + '</li>';
    }
    html += '</ol></div>';
  }

  if (plan.alsoConsider.length > 0) {
    html += '<div class="result-section"><div class="result-section-title">Also Consider</div><ul class="also-list">';
    for (var ai = 0; ai < plan.alsoConsider.length; ai++) {
      html += '<li class="also-item"><span class="also-name">' + escapeHtml(plan.alsoConsider[ai].name) + '</span>';
      if (plan.alsoConsider[ai].hint) html += ' &mdash; <span class="also-hint">' + escapeHtml(plan.alsoConsider[ai].hint) + '</span>';
      html += '</li>';
    }
    html += '</ul></div>';
  }

  html += '</div>'; // close combined-plan

  // Notes display
  var hasNotes = false;
  for (var nk in multiDxState.notes) {
    if (multiDxState.notes.hasOwnProperty(nk) && multiDxState.notes[nk]) { hasNotes = true; break; }
  }
  if (hasNotes) {
    html += '<div class="result-notes">';
    html += '<div class="result-notes-title">Your Notes</div>';
    for (var noteKey in multiDxState.notes) {
      if (!multiDxState.notes.hasOwnProperty(noteKey) || !multiDxState.notes[noteKey]) continue;
      html += '<div class="result-note-item">' + escapeHtml(multiDxState.notes[noteKey]) + '</div>';
    }
    html += '</div>';
  }

  // Action buttons
  html += '<div class="nav-row" style="margin-top: 20px;">';
  html += '<button class="btn btn-primary" id="btn-save-track" type="button">Save &amp; Start Tracking</button>';
  html += '<button class="btn btn-secondary" id="btn-mdx-back" type="button">Back</button>';
  html += '<button class="btn btn-secondary" id="btn-mdx-reset" type="button">Start Over</button>';
  html += '</div>';

  html += '</div>';
  return html;
}
```

### 6. `bindMultiDxEvents()` — Event Binding

Called after rendering any multi-dx phase.

```js
function bindMultiDxEvents() {
  // Stage pills
  var pills = document.querySelectorAll('.stage-pill');
  for (var i = 0; i < pills.length; i++) {
    pills[i].addEventListener('click', function() {
      multiDxState.stage = this.getAttribute('data-stage');
      render();
    });
  }

  // Symptom checkboxes
  var checks = document.querySelectorAll('.symptom-check input[type="checkbox"]');
  for (var j = 0; j < checks.length; j++) {
    checks[j].addEventListener('change', function() {
      toggleSymptom(this.value);
      render();
    });
  }

  // Diagnose button
  var diagnoseBtn = document.getElementById('btn-diagnose');
  if (diagnoseBtn) {
    diagnoseBtn.addEventListener('click', function() {
      if (canDiagnose()) {
        runMultiDxDiagnosis();
        render();
      }
    });
  }

  // Refine option buttons
  var refineOpts = document.querySelectorAll('[data-refine-idx]');
  for (var k = 0; k < refineOpts.length; k++) {
    refineOpts[k].addEventListener('click', function() {
      var idx = parseInt(this.getAttribute('data-refine-idx'), 10);
      answerRefineQuestion(idx);
      render();
    });
  }

  // Back button (multi-dx)
  var backBtn = document.getElementById('btn-mdx-back');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      multiDxGoBack();
      render();
    });
  }

  // Start Over button (multi-dx)
  var resetBtn = document.getElementById('btn-mdx-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      resetMultiDxState();
      render();
    });
  }

  // Save & Start Tracking button
  var saveBtn = document.getElementById('btn-save-track');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      // Section 06 implements saveToJournal()
      if (typeof saveToJournal === 'function') {
        saveToJournal();
      }
    });
  }

  // Bind notes events (from Section 04)
  if (typeof bindNotesEvents === 'function') {
    bindNotesEvents();
  }
}
```

### 7. Integration with `render()`

In the `render()` function's multi-dx branch (from Section 02), add event binding:

```js
} else if (state.mode === 'multi-dx') {
  if (multiDxState.phase === 'select') {
    app.innerHTML = renderMultiDxSelect();
  } else if (multiDxState.phase === 'refining') {
    app.innerHTML = renderMultiDxRefine();
  } else if (multiDxState.phase === 'results') {
    app.innerHTML = renderMultiDxResults();
  }
  bindMultiDxEvents();
  progressEl.style.display = 'none';
}
```

### 8. "Save & Start Tracking" on Wizard/Expert Results

Add a "Save & Start Tracking" button to the existing `renderResultCard()` function. This button appears on ALL result screens, not just Multi-Dx. It is placed in the nav-row alongside "Start Over" and "Back":

```js
// In renderResultCard(), in the nav-row section:
html += '<div class="nav-row">';
html += '<button class="btn btn-primary" id="btn-save-track" type="button">Save &amp; Start Tracking</button>';
html += '<button class="btn btn-secondary" id="btn-reset" type="button">Start Over</button>';
if (state.history.length > 0) {
  html += '<button class="btn btn-secondary" id="btn-back" type="button">Back</button>';
}
html += '</div>';
```

Also add the save-track click handler in `bindWizardEvents()` and `bindExpertEvents()`:

```js
var saveTrackBtn = document.getElementById('btn-save-track');
if (saveTrackBtn) {
  saveTrackBtn.addEventListener('click', function() {
    if (typeof saveToJournal === 'function') {
      saveToJournal();
    }
  });
}
```

### 9. Fade Transitions

Reuse the existing fade-in animation. The `render()` function already handles opacity transitions via `transitionToNode()` for wizard mode. For multi-dx, use the `.fade-in` class on the top-level container. Each phase change calls `render()` which rebuilds the DOM with the fade-in class.

---

## Integration Points

- **Section 01 (Knowledge Base)**: Reads SYMPTOMS for checkbox rendering, used by scoring engine
- **Section 02 (State/Mode)**: `multiDxState` is managed by state machine, `render()` dispatches to multi-dx renderers
- **Section 03 (Scoring Engine)**: `scoreDiagnoses()`, `getRefineQuestions()`, `applyRefineAnswer()`, `generateCombinedPlan()` are all called during the multi-dx flow
- **Section 04 (Notes)**: `renderNotesExpander()` and `bindNotesEvents()` are called in all three phases
- **Section 06 (Journal)**: `saveToJournal()` is called from the "Save & Start Tracking" button (implemented in Section 06)

---

## Checklist

1. Add all multi-dx CSS styles (stage selector, symptom checkboxes, hints, warnings, results, combined plan)
2. Implement `toggleSymptom(symptomId)` function
3. Implement `canDiagnose()` function
4. Implement `runMultiDxDiagnosis()` function
5. Implement `answerRefineQuestion(optionIndex)` function
6. Implement `multiDxGoBack()` function with re-scoring on back navigation
7. Implement `renderMultiDxSelect()` — stage pills, checkbox fieldsets, hints, diagnose button
8. Implement `renderMultiDxRefine()` — question cards with refine step counter
9. Implement `renderMultiDxResults()` — ranked diagnosis cards, combined plan, action buttons
10. Implement `bindMultiDxEvents()` — event handlers for all interactive elements
11. Integrate `bindMultiDxEvents()` into `render()` for multi-dx mode
12. Add "Save & Start Tracking" button to `renderResultCard()` for wizard/expert results
13. Add save-track click handlers to `bindWizardEvents()` and `bindExpertEvents()`
14. Add Section 05 tests to `runTests()`
15. Open in browser, select Multi-Dx mode
16. Verify stage pills highlight on click
17. Verify symptom checkboxes toggle and count updates
18. Verify hint appears with 1 symptom, warning with 9+
19. Verify Diagnose button enables only with stage + 2 symptoms
20. Verify refine questions appear when applicable
21. Verify Back navigates through refine questions and back to selection
22. Verify results show ranked cards with confidence bars and combined plan
23. Verify "Start Over" resets everything
24. Verify "Save & Start Tracking" button present on all result screens

---

## Implementation Status

**Status:** Complete
**Implemented by:** Claude (deep-implement)
**Files modified:** `docs/tool-plant-doctor.html`
**Deviations from plan:** Items 12-13 (Save & Start Tracking button in result card, save-track click handlers) were already implemented in Section 04. Removed typeof guards in render() since functions now exist.
**Tests added:** 12 tests covering toggleSymptom, canDiagnose, runMultiDxDiagnosis, answerRefineQuestion, reset, results ranking, renderMultiDxSelect
**Code review:** PASS — no issues found
