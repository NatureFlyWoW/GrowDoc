# Section 02: State Machine & Mode Selector

## Overview

Replace the binary Expert Mode toggle switch with a 3-option segmented control (Wizard / Expert / Multi-Dx). Refactor the state machine so `state.mode` replaces `state.expertMode`. Add the `multiDxState` and `journalState` objects. Update `render()` to dispatch by mode. Gracefully disable Multi-Dx if the data file is missing.

**Files to modify:**
- `docs/tool-plant-doctor.html` — CSS additions, HTML changes, JS refactoring

**Dependencies:** None (parallelizable with Section 01)

**Blocks:** Sections 03, 04, 05, 06

---

## Tests First

Add these tests inside `runTests()`. They replace the v1 expert toggle tests where applicable and add new mode-selector tests.

```js
// ── Section 02: State Machine & Mode Selector Tests ──

// Test: state.mode defaults to 'wizard'
assert(state.mode === 'wizard', 'state.mode defaults to wizard');

// Test: setMode('expert') updates state.mode
var _prevMode = state.mode;
setMode('expert');
assert(state.mode === 'expert', 'setMode(expert) updates state.mode');
setMode('wizard');
assert(state.mode === 'wizard', 'setMode(wizard) restores wizard mode');
state.mode = _prevMode;

// Test: setMode('multi-dx') updates state.mode and initializes multiDxState
setMode('multi-dx');
assert(state.mode === 'multi-dx', 'setMode(multi-dx) updates state.mode');
assert(multiDxState.phase === 'select', 'multiDxState initialized to select phase');
assert(Array.isArray(multiDxState.selectedSymptoms), 'multiDxState.selectedSymptoms is array');
assert(multiDxState.selectedSymptoms.length === 0, 'multiDxState.selectedSymptoms starts empty');
setMode('wizard');

// Test: mode selector element has role="radiogroup" with 3 role="radio" children
var modeGroup = document.querySelector('[role="radiogroup"]');
assert(modeGroup !== null, 'Mode selector has role=radiogroup');
var radios = modeGroup ? modeGroup.querySelectorAll('[role="radio"]') : [];
assert(radios.length === 3, 'Mode selector has 3 radio options (found ' + radios.length + ')');

// Test: aria-checked updates correctly on mode switch
setMode('expert');
var expertRadio = document.querySelector('[role="radio"][data-mode="expert"]');
assert(expertRadio && expertRadio.getAttribute('aria-checked') === 'true', 'Expert radio has aria-checked=true when active');
var wizardRadio = document.querySelector('[role="radio"][data-mode="wizard"]');
assert(wizardRadio && wizardRadio.getAttribute('aria-checked') === 'false', 'Wizard radio has aria-checked=false when inactive');
setMode('wizard');

// Test: if SYMPTOMS is undefined, multi-dx tab is disabled
// (This test is conditional — only meaningful if data file is intentionally absent)
var multiDxRadio = document.querySelector('[role="radio"][data-mode="multi-dx"]');
if (typeof SYMPTOMS === 'undefined') {
  assert(multiDxRadio && multiDxRadio.getAttribute('aria-disabled') === 'true', 'Multi-Dx disabled when SYMPTOMS undefined');
} else {
  assert(multiDxRadio && multiDxRadio.getAttribute('aria-disabled') !== 'true', 'Multi-Dx enabled when SYMPTOMS defined');
}

// Test: mode switch preserves wizard history when switching to expert
state.mode = 'wizard';
state.currentNode = 'q-symptom';
state.history = [ROOT];
setMode('expert');
assert(state.expertSelections[ROOT] !== undefined, 'Expert mode populated selections from wizard history on switch');
setMode('wizard');
state.currentNode = ROOT;
state.history = [];

// Test: mode switch to multi-dx resets multiDxState
setMode('multi-dx');
multiDxState.selectedSymptoms = ['yellow-lower'];
multiDxState.phase = 'results';
setMode('wizard');
setMode('multi-dx');
assert(multiDxState.phase === 'select', 'Switching to multi-dx resets phase to select');
assert(multiDxState.selectedSymptoms.length === 0, 'Switching to multi-dx resets selectedSymptoms');
setMode('wizard');

// Test: render() dispatches to correct renderer based on state.mode
// (Verify by checking DOM content differs per mode)
setMode('wizard');
render();
var wizardContent = document.getElementById('app').innerHTML;
setMode('expert');
render();
var expertContent = document.getElementById('app').innerHTML;
assert(wizardContent !== expertContent, 'render() produces different output for wizard vs expert');
setMode('wizard');
render();

// Test: journalState defaults are correct
assert(journalState.view === 'dashboard', 'journalState.view defaults to dashboard');
assert(journalState.activeEntryId === null, 'journalState.activeEntryId defaults to null');
```

---

## Implementation Details

### 1. HTML Changes

**Remove** the existing toggle markup:

```html
<!-- REMOVE THIS -->
<div class="toggle-wrap">
  <span class="toggle-label" id="toggle-text">Expert Mode</span>
  <div class="toggle-track" id="expert-toggle" role="switch" ...>
    <div class="toggle-thumb"></div>
  </div>
</div>
```

**Replace with** the segmented control:

```html
<div class="mode-selector" role="radiogroup" aria-label="Diagnosis mode">
  <button class="mode-btn active" role="radio" aria-checked="true"
          data-mode="wizard" tabindex="0" type="button">Wizard</button>
  <button class="mode-btn" role="radio" aria-checked="false"
          data-mode="expert" tabindex="-1" type="button">Expert</button>
  <button class="mode-btn" role="radio" aria-checked="false"
          data-mode="multi-dx" tabindex="-1" type="button">Multi-Dx</button>
</div>
```

### 2. CSS Additions

Add these styles to the existing `<style>` block. Remove the `.toggle-wrap`, `.toggle-label`, `.toggle-track`, `.toggle-thumb` rules (keep them commented out or delete them — they are no longer used).

```css
/* Mode selector (segmented control) */
.mode-selector {
  display: flex;
  gap: 0;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 8px;
  padding: 3px;
  flex-shrink: 0;
}
.mode-btn {
  font-family: var(--mono);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text2);
  cursor: pointer;
  min-height: 36px;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.mode-btn:hover {
  background: rgba(143, 184, 86, 0.08);
  color: var(--text);
}
.mode-btn.active {
  background: var(--accent3);
  color: var(--text);
}
.mode-btn:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
.mode-btn[aria-disabled="true"] {
  opacity: 0.35;
  cursor: not-allowed;
}
.mode-btn[aria-disabled="true"]:hover {
  background: transparent;
  color: var(--text2);
}
```

### 3. State Object Changes

**Replace** the v1 state object:

```js
// v1 (REMOVE):
var state = {
  currentNode: ROOT,
  history: [],
  expertMode: false,         // REMOVE
  expertSelections: {}
};

// v2 (NEW):
var state = {
  mode: 'wizard',            // 'wizard' | 'expert' | 'multi-dx'
  currentNode: ROOT,
  history: [],
  expertSelections: {},
  wizardNotes: {}             // { nodeId: noteText } — used by Section 04
};
```

**Add** the multiDxState object:

```js
var multiDxState = {
  stage: null,
  selectedSymptoms: [],
  notes: {},
  refineStep: 0,
  refineQuestions: [],
  refineAnswers: [],
  scores: {},
  results: [],
  phase: 'select'            // 'select' | 'refining' | 'results'
};
```

**Add** the journalState object:

```js
var journalState = {
  view: 'dashboard',          // 'dashboard' | 'check-in' | 'check-in-detail' | 'check-in-result'
  activeEntryId: null,
  checkInData: {}
};
```

### 4. Helper Functions

**`resetMultiDxState()`** — resets multiDxState to initial values:

```js
function resetMultiDxState() {
  multiDxState.stage = null;
  multiDxState.selectedSymptoms = [];
  multiDxState.notes = {};
  multiDxState.refineStep = 0;
  multiDxState.refineQuestions = [];
  multiDxState.refineAnswers = [];
  multiDxState.scores = {};
  multiDxState.results = [];
  multiDxState.phase = 'select';
}
```

**`dataFileLoaded()`** — checks if the external data file was successfully loaded:

```js
function dataFileLoaded() {
  return typeof SYMPTOMS !== 'undefined' && typeof SCORING !== 'undefined' && typeof REFINE_RULES !== 'undefined';
}
```

### 5. `setMode(mode)` Function

Replaces `toggleExpertMode()`. Handles mode transitions with state preservation.

```js
function setMode(mode) {
  // If multi-dx is requested but data file is missing, do nothing
  if (mode === 'multi-dx' && !dataFileLoaded()) return;

  var prevMode = state.mode;
  state.mode = mode;

  // Transitioning FROM wizard TO expert: preserve wizard path as expertSelections
  if (prevMode === 'wizard' && mode === 'expert') {
    state.expertSelections = {};
    var currentId = ROOT;
    for (var i = 0; i < state.history.length; i++) {
      var node = TREE[currentId];
      if (!node || isResult(node)) break;
      for (var j = 0; j < node.options.length; j++) {
        if (node.options[j].next === state.history[i + 1] ||
            (i === state.history.length - 1 && node.options[j].next === state.currentNode)) {
          state.expertSelections[currentId] = j;
          currentId = node.options[j].next;
          break;
        }
      }
    }
  }

  // Transitioning TO multi-dx: always start fresh
  if (mode === 'multi-dx') {
    resetMultiDxState();
  }

  // Update the mode selector UI
  updateModeSelector();
  render();
}
```

### 6. `updateModeSelector()` Function

Updates the visual state of the segmented control buttons:

```js
function updateModeSelector() {
  var buttons = document.querySelectorAll('.mode-btn');
  for (var i = 0; i < buttons.length; i++) {
    var btn = buttons[i];
    var isActive = btn.getAttribute('data-mode') === state.mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    btn.setAttribute('tabindex', isActive ? '0' : '-1');
  }
}
```

### 7. `bindModeSelector()` Function

Replaces `bindToggle()`. Handles click and keyboard events per ARIA radiogroup spec.

```js
function bindModeSelector() {
  var container = document.querySelector('.mode-selector');
  if (!container) return;

  // Disable multi-dx button if data file not loaded
  if (!dataFileLoaded()) {
    var multiBtn = container.querySelector('[data-mode="multi-dx"]');
    if (multiBtn) {
      multiBtn.setAttribute('aria-disabled', 'true');
      multiBtn.setAttribute('title', 'Data unavailable — load plant-doctor-data.js');
    }
  }

  // Click handler
  container.addEventListener('click', function(e) {
    var btn = e.target.closest('.mode-btn');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    setMode(btn.getAttribute('data-mode'));
  });

  // Keyboard navigation (ARIA radiogroup pattern)
  container.addEventListener('keydown', function(e) {
    var modes = ['wizard', 'expert'];
    if (dataFileLoaded()) modes.push('multi-dx');

    var currentIdx = modes.indexOf(state.mode);
    var newIdx = currentIdx;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIdx = (currentIdx + 1) % modes.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIdx = (currentIdx - 1 + modes.length) % modes.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIdx = modes.length - 1;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      return; // Already on the active button
    } else {
      return;
    }

    setMode(modes[newIdx]);
    var newBtn = container.querySelector('[data-mode="' + modes[newIdx] + '"]');
    if (newBtn) newBtn.focus();
  });
}
```

### 8. Updated `render()` Function

Replace the existing `render()` to dispatch by `state.mode`:

```js
function render() {
  var app = document.getElementById('app');
  var progressEl = document.getElementById('progress');

  // State precedence: check-in flow overrides mode rendering
  if (journalState.view !== 'dashboard') {
    // Render check-in flow — implemented in Section 06
    progressEl.style.display = 'none';
    // renderCheckIn() will be added by Section 06
    if (typeof renderCheckIn === 'function') {
      app.innerHTML = renderCheckIn();
    }
    return;
  }

  if (state.mode === 'wizard') {
    var node = TREE[state.currentNode];
    if (isResult(node)) {
      app.innerHTML = renderResultCard(node);
      saveLastDiagnosis(node);
      lastDiagnosis = { /* ... same as v1 ... */ };
      renderLastDx();
      setTimeout(function() {
        var rc = document.getElementById('result-card');
        if (rc) rc.focus();
      }, 50);
    } else {
      app.innerHTML = renderWizardQuestion(node);
    }
    bindWizardEvents();
    progressEl.style.display = '';
    renderProgress();

  } else if (state.mode === 'expert') {
    app.innerHTML = renderExpert();
    bindExpertEvents();
    var expertResult = getExpertResult();
    if (expertResult && (!lastDiagnosis || lastDiagnosis.result.id !== expertResult.id)) {
      saveLastDiagnosis(expertResult);
      lastDiagnosis = { /* ... same as v1 ... */ };
      renderLastDx();
    }
    if (expertResult) {
      setTimeout(function() { var rc = document.getElementById('result-card'); if (rc) rc.focus(); }, 50);
    }
    progressEl.style.display = 'none';

  } else if (state.mode === 'multi-dx') {
    // Dispatch by multiDxState.phase — implemented in Section 05
    if (multiDxState.phase === 'select') {
      app.innerHTML = typeof renderMultiDxSelect === 'function' ? renderMultiDxSelect() : '<p>Multi-Dx mode loading...</p>';
    } else if (multiDxState.phase === 'refining') {
      app.innerHTML = typeof renderMultiDxRefine === 'function' ? renderMultiDxRefine() : '';
    } else if (multiDxState.phase === 'results') {
      app.innerHTML = typeof renderMultiDxResults === 'function' ? renderMultiDxResults() : '';
    }
    progressEl.style.display = 'none';
  }
}
```

### 9. Updated `init()` Function

Replace the existing `init()`:

```js
function init() {
  storageAvailable = checkStorage();
  if (!storageAvailable) {
    var warn = document.getElementById('storage-warn');
    warn.textContent = 'localStorage is unavailable. Your diagnosis will not be saved.';
    warn.style.display = 'block';
  }
  loadState();           // with v1→v2 migration (Section 06 adds migration logic)
  renderLastDx();
  bindModeSelector();    // replaces bindToggle()
  render();
}
```

### 10. Backward Compatibility

- All references to `state.expertMode` must be replaced with `state.mode === 'expert'`
- `toggleExpertMode()` is removed entirely; replaced by `setMode(mode)`
- `bindToggle()` is removed; replaced by `bindModeSelector()`
- v1 localStorage has no `mode` field — `loadState()` defaults `state.mode` to `'wizard'`
- The existing `renderExpert()`, `renderWizardQuestion()`, `renderResultCard()`, `renderProgress()` functions are unchanged
- The existing event binding functions (`bindWizardEvents`, `bindExpertEvents`) are unchanged

### 11. Removing v1 Toggle Tests

The following v1 tests reference `state.expertMode` and `toggleExpertMode()` and must be updated:

- "toggleExpertMode() enables expert mode" → change to use `setMode('expert')` and check `state.mode === 'expert'`
- "toggleExpertMode() disables expert mode" → change to `setMode('wizard')` and check `state.mode === 'wizard'`
- "Expert mode populated selections from wizard history" → same logic, triggered by `setMode('expert')`
- Cascade/dependent dropdown tests remain the same (they test `expertSelections`, not the toggle)

---

## Integration Points

- **Section 01 (Knowledge Base)**: `dataFileLoaded()` checks for SYMPTOMS/SCORING/REFINE_RULES
- **Section 03 (Scoring Engine)**: Uses `multiDxState` to pass data to scoring functions
- **Section 04 (Notes)**: Uses `state.wizardNotes` and `multiDxState.notes`
- **Section 05 (Multi-Dx)**: Provides `renderMultiDxSelect()`, `renderMultiDxRefine()`, `renderMultiDxResults()` called by `render()`
- **Section 06 (Journal)**: Uses `journalState` for check-in flow override in `render()`

---

## Checklist

1. Remove the `.toggle-wrap` HTML and replace with `.mode-selector` radiogroup
2. Add `.mode-selector` and `.mode-btn` CSS styles
3. Remove `.toggle-wrap`, `.toggle-track`, `.toggle-thumb`, `.toggle-label` CSS (or comment out)
4. Replace `state.expertMode` with `state.mode` in the state object
5. Add `state.wizardNotes` to state object
6. Create `multiDxState` object with all fields
7. Create `journalState` object with all fields
8. Implement `resetMultiDxState()` function
9. Implement `dataFileLoaded()` function
10. Implement `setMode(mode)` replacing `toggleExpertMode()`
11. Implement `updateModeSelector()` function
12. Implement `bindModeSelector()` with click + keyboard (arrows, Home, End)
13. Update `render()` to dispatch by `state.mode` with journal precedence
14. Update `init()` to call `bindModeSelector()` instead of `bindToggle()`
15. Replace all `state.expertMode` references throughout the file
16. Remove `toggleExpertMode()` and `bindToggle()` functions
17. Update existing tests to use `setMode()` instead of `toggleExpertMode()`
18. Add Section 02 tests to `runTests()`
19. Open in browser, verify Wizard/Expert tabs work identically to v1
20. Verify Multi-Dx tab is disabled if data file is not loaded, enabled if it is
21. Verify keyboard navigation (arrows, Home, End) on mode selector
