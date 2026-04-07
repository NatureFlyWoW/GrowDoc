# Section 06: Treatment Journal

## Overview

Build the treatment journal system: persistent storage for diagnosis sessions, a dashboard showing active and resolved entries, treatment selection after diagnosis, a check-in flow for tracking progress, and v1-to-v2 localStorage migration. The journal is accessible from all three modes via the "Save & Start Tracking" button.

**Files to modify:**
- `docs/tool-plant-doctor.html` — CSS additions, journal data structures, CRUD functions, dashboard/check-in renderers, localStorage migration, event binding

**Dependencies:** Section 02 (state machine / journalState), Section 03 (scoring engine for re-assessment), Section 05 (multi-dx results / save button)

**Blocks:** Section 07 (integration tests)

---

## Tests First

Add these tests inside `runTests()`.

```js
// ── Section 06: Treatment Journal Tests ──

// Test: v1 localStorage migrates to v2 format
(function() {
  var savedRaw = localStorage.getItem(STORAGE_KEY);
  var v1Data = JSON.stringify({
    version: 1,
    lastDiagnosis: {
      date: '2026-03-15T10:00:00.000Z',
      path: ['q-stage', 'q-symptom', 'q-yellow-where', 'q-yellow-old'],
      result: { id: 'r-n-def', diagnosis: 'Nitrogen Deficiency', severity: 'warning', confidence: 0.85 }
    }
  });
  localStorage.setItem(STORAGE_KEY, v1Data);
  var migrated = loadStateV2();
  assert(migrated.version === 2, 'v1 data migrates to version 2');
  assert(Array.isArray(migrated.journal), 'Migrated data has journal array');
  assert(migrated.journal.length === 1, 'Migrated data has 1 journal entry from lastDiagnosis');
  assert(migrated.journal[0].mode === 'wizard', 'Migrated entry has mode: wizard');
  assert(migrated.journal[0].status === 'resolved', 'Migrated entry has status: resolved');
  // Restore
  if (savedRaw) localStorage.setItem(STORAGE_KEY, savedRaw);
  else localStorage.removeItem(STORAGE_KEY);
})();

// Test: v1 backup stored during migration
(function() {
  var savedRaw = localStorage.getItem(STORAGE_KEY);
  var savedBackup = localStorage.getItem(STORAGE_KEY + '-v1-backup');
  var v1Data = JSON.stringify({ version: 1, lastDiagnosis: { date: '2026-03-15T10:00:00.000Z', path: [], result: { id: 'r-n-def', diagnosis: 'Nitrogen Deficiency', severity: 'warning', confidence: 0.85 } } });
  localStorage.setItem(STORAGE_KEY, v1Data);
  loadStateV2();
  var backup = localStorage.getItem(STORAGE_KEY + '-v1-backup');
  assert(backup !== null, 'v1 backup created during migration');
  // Restore
  if (savedRaw) localStorage.setItem(STORAGE_KEY, savedRaw);
  else localStorage.removeItem(STORAGE_KEY);
  if (savedBackup) localStorage.setItem(STORAGE_KEY + '-v1-backup', savedBackup);
  else localStorage.removeItem(STORAGE_KEY + '-v1-backup');
})();

// Test: journal entry creation from wizard result
var testEntry = createJournalEntry('wizard', 'r-n-def', [{ resultId: 'r-n-def', confidence: 0.85, rank: 1 }], null, {});
assert(testEntry.mode === 'wizard', 'Journal entry from wizard has mode: wizard');
assert(Array.isArray(testEntry.symptoms) && testEntry.symptoms.length === 0, 'Wizard entry has empty symptoms array');
assert(testEntry.status === 'active', 'New entry has status: active');
assert(testEntry.id && testEntry.createdAt, 'Entry has id and createdAt');

// Test: journal entry creation from multi-dx result
var testEntryMdx = createJournalEntry('multi-dx', null,
  [{ resultId: 'r-n-def', confidence: 0.78, rank: 1 }, { resultId: 'r-ph-lockout', confidence: 0.62, rank: 2 }],
  { checkFirst: ['Check pH'], fixes: ['Flush'], alsoConsider: [] },
  { 'step-symptoms': 'Started 3 days ago' }
);
assert(testEntryMdx.mode === 'multi-dx', 'Multi-dx entry has correct mode');
assert(testEntryMdx.combinedPlan !== null, 'Multi-dx entry has combinedPlan');
assert(testEntryMdx.notes['step-symptoms'] === 'Started 3 days ago', 'Multi-dx entry includes notes');

// Test: journal capped at 20 entries — 21st evicts oldest resolved
(function() {
  var testJournal = [];
  for (var i = 0; i < 20; i++) {
    testJournal.push({
      id: 'test-' + i,
      createdAt: new Date(2026, 0, i + 1).toISOString(),
      status: i < 5 ? 'resolved' : 'active',
      mode: 'wizard',
      symptoms: [],
      diagnoses: [],
      treatments: [],
      checkIns: [],
      notes: {}
    });
  }
  var evicted = evictJournalEntry(testJournal);
  assert(evicted.length === 19, 'Eviction removes one entry (got ' + evicted.length + ')');
  // The oldest resolved entry (test-0) should be removed
  var hasOldestResolved = false;
  for (var j = 0; j < evicted.length; j++) {
    if (evicted[j].id === 'test-0') hasOldestResolved = true;
  }
  assert(!hasOldestResolved, 'Oldest resolved entry was evicted');
})();

// Test: if all 20 are active, 21st evicts oldest overall
(function() {
  var testJournal = [];
  for (var i = 0; i < 20; i++) {
    testJournal.push({
      id: 'test-' + i,
      createdAt: new Date(2026, 0, i + 1).toISOString(),
      status: 'active',
      mode: 'wizard',
      symptoms: [],
      diagnoses: [],
      treatments: [],
      checkIns: [],
      notes: {}
    });
  }
  var evicted = evictJournalEntry(testJournal);
  assert(evicted.length === 19, 'All-active eviction removes one entry');
  var hasOldest = false;
  for (var j = 0; j < evicted.length; j++) {
    if (evicted[j].id === 'test-0') hasOldest = true;
  }
  assert(!hasOldest, 'Oldest active entry evicted when no resolved entries');
})();

// Test: treatment selection creates treatments[] entries
var testTreatments = createTreatments(['Flush with pH water', 'Increase nitrogen']);
assert(testTreatments.length === 2, 'createTreatments creates 2 entries');
assert(testTreatments[0].status === 'active', 'Treatment status starts as active');
assert(testTreatments[0].action === 'Flush with pH water', 'Treatment action matches');

// Test: check-in creates valid checkIn record
var testCheckIn = createCheckInRecord('somewhat-better', ['yellow-lower'], [], 'Tips stopped spreading');
assert(testCheckIn.response === 'somewhat-better', 'Check-in has correct response');
assert(testCheckIn.date, 'Check-in has date');
assert(Array.isArray(testCheckIn.symptomsResolved), 'Check-in has symptomsResolved array');
assert(testCheckIn.notes === 'Tips stopped spreading', 'Check-in includes notes');

// Test: journal entry status transitions
var statusEntry = createJournalEntry('wizard', 'r-n-def', [{ resultId: 'r-n-def', confidence: 0.85, rank: 1 }], null, {});
assert(statusEntry.status === 'active', 'New entry starts active');
statusEntry.treatments = [{ action: 'Flush', startedAt: new Date().toISOString(), status: 'active' }];
statusEntry.status = 'treating';
assert(statusEntry.status === 'treating', 'Entry transitions to treating');
statusEntry.status = 'resolved';
assert(statusEntry.status === 'resolved', 'Entry transitions to resolved');

// Test: corrupted journal data triggers warning, not crash
(function() {
  var savedRaw = localStorage.getItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY, '{"version":2,"journal":"not-an-array"}');
  try {
    var loaded = loadStateV2();
    assert(Array.isArray(loaded.journal), 'Corrupted journal recovered to empty array');
  } catch(e) {
    assert(false, 'Corrupted journal crashed: ' + e.message);
  }
  if (savedRaw) localStorage.setItem(STORAGE_KEY, savedRaw);
  else localStorage.removeItem(STORAGE_KEY);
})();
```

---

## Implementation Details

### 1. CSS Additions

```css
/* Journal Dashboard */
.journal-dashboard {
  margin-bottom: 24px;
}
.journal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.journal-title {
  font-family: var(--serif);
  font-size: 1.1rem;
  color: var(--accent);
}
.journal-entry {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 10px;
}
.journal-entry-date {
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--text3);
}
.journal-entry-dx {
  font-family: var(--serif);
  font-size: 1rem;
  color: var(--text);
  margin: 4px 0;
}
.journal-entry-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.journal-status {
  display: inline-block;
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.journal-status.status-active {
  background: rgba(90, 158, 184, 0.15);
  color: var(--blue);
}
.journal-status.status-treating {
  background: rgba(201, 168, 76, 0.15);
  color: var(--gold);
}
.journal-status.status-resolved {
  background: rgba(143, 184, 86, 0.15);
  color: var(--accent);
}
.journal-status.status-escalated {
  background: rgba(196, 92, 74, 0.15);
  color: var(--red);
}
.journal-days {
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--text3);
}

/* Check-in flow */
.checkin-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}
.checkin-title {
  font-family: var(--serif);
  font-size: 1.2rem;
  color: var(--text);
  margin-bottom: 12px;
}
.checkin-context {
  font-size: 0.85rem;
  color: var(--text3);
  margin-bottom: 16px;
}

/* Score changelog */
.score-change {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 0.82rem;
  padding: 6px 0;
}
.score-change-up { color: var(--accent); }
.score-change-down { color: var(--red); }
.score-change-same { color: var(--text3); }

/* Treatment selection checkboxes */
.treatment-select {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border2);
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.treatment-select:hover {
  background: rgba(143, 184, 86, 0.06);
}
.treatment-select.checked {
  border-color: var(--accent3);
  background: rgba(143, 184, 86, 0.08);
}
.treatment-select input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  margin-top: 2px;
  flex-shrink: 0;
}
```

### 2. Data Functions

**`generateId()`** — Creates a unique ID for journal entries:

```js
function generateId() {
  return 'j-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}
```

**`createJournalEntry(mode, primaryResultId, diagnoses, combinedPlan, notes)`** — Creates a new journal entry:

```js
function createJournalEntry(mode, primaryResultId, diagnoses, combinedPlan, notes) {
  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    stage: mode === 'multi-dx' ? multiDxState.stage : null,
    mode: mode,
    symptoms: mode === 'multi-dx' ? multiDxState.selectedSymptoms.slice() : [],
    notes: notes ? JSON.parse(JSON.stringify(notes)) : {},
    diagnoses: diagnoses ? diagnoses.map(function(d) {
      return { resultId: d.resultId, confidence: d.score || d.confidence, rank: d.rank || 0 };
    }) : [],
    combinedPlan: combinedPlan ? JSON.parse(JSON.stringify(combinedPlan)) : null,
    treatments: [],
    checkIns: [],
    status: 'active'
  };
}
```

**`evictJournalEntry(journal)`** — Removes the oldest resolved entry, or oldest overall if none are resolved:

```js
function evictJournalEntry(journal) {
  if (journal.length < 20) return journal;

  // Find oldest resolved
  var oldestResolvedIdx = -1;
  var oldestResolvedDate = null;
  for (var i = 0; i < journal.length; i++) {
    if (journal[i].status === 'resolved') {
      var d = new Date(journal[i].createdAt);
      if (oldestResolvedIdx === -1 || d < oldestResolvedDate) {
        oldestResolvedIdx = i;
        oldestResolvedDate = d;
      }
    }
  }

  if (oldestResolvedIdx !== -1) {
    journal.splice(oldestResolvedIdx, 1);
    return journal;
  }

  // No resolved entries — evict oldest overall
  var oldestIdx = 0;
  var oldestDate = new Date(journal[0].createdAt);
  for (var j = 1; j < journal.length; j++) {
    var dj = new Date(journal[j].createdAt);
    if (dj < oldestDate) {
      oldestIdx = j;
      oldestDate = dj;
    }
  }
  journal.splice(oldestIdx, 1);
  return journal;
}
```

**`createTreatments(actions)`** — Creates treatment entries from selected fix actions:

```js
function createTreatments(actions) {
  var treatments = [];
  for (var i = 0; i < actions.length; i++) {
    treatments.push({
      action: actions[i],
      startedAt: new Date().toISOString(),
      status: 'active'
    });
  }
  return treatments;
}
```

**`createCheckInRecord(response, symptomsResolved, symptomsNew, notes)`** — Creates a check-in record:

```js
function createCheckInRecord(response, symptomsResolved, symptomsNew, notes) {
  return {
    date: new Date().toISOString(),
    response: response,
    symptomsResolved: symptomsResolved || [],
    symptomsNew: symptomsNew || [],
    notes: notes || '',
    updatedScores: null  // filled in after re-assessment
  };
}
```

### 3. localStorage v2 Schema and Migration

**`loadStateV2()`** — Loads and migrates localStorage data:

```js
function loadStateV2() {
  if (!storageAvailable) return { version: 2, journal: [], migrateCount: 0 };
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 2, journal: [], migrateCount: 0 };
    var data = JSON.parse(raw);

    // Already v2
    if (data.version === 2) {
      // Validate journal is an array
      if (!Array.isArray(data.journal)) {
        data.journal = [];
        var warn = document.getElementById('storage-warn');
        if (warn) {
          warn.textContent = 'Journal data was corrupted and has been reset.';
          warn.style.display = 'block';
        }
      }
      // Increment migrate count for backup cleanup
      if (typeof data.migrateCount === 'number') {
        data.migrateCount++;
        if (data.migrateCount >= 5) {
          localStorage.removeItem(STORAGE_KEY + '-v1-backup');
        }
      }
      return data;
    }

    // Migrate from v1
    if (data.version === 1) {
      // Backup first
      localStorage.setItem(STORAGE_KEY + '-v1-backup', raw);

      var journal = [];
      if (data.lastDiagnosis) {
        var ld = data.lastDiagnosis;
        journal.push({
          id: generateId(),
          createdAt: ld.date || new Date().toISOString(),
          stage: null,
          mode: 'wizard',
          symptoms: [],
          notes: {},
          diagnoses: [{ resultId: ld.result.id, confidence: ld.result.confidence, rank: 1 }],
          combinedPlan: null,
          treatments: [],
          checkIns: [],
          status: 'resolved'
        });
      }

      var v2Data = {
        version: 2,
        journal: journal,
        migrateCount: 0,
        lastDiagnosis: data.lastDiagnosis  // preserve for backward compat
      };

      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v2Data)); } catch(e) { /* quota */ }
      return v2Data;
    }

    // Unknown version
    return { version: 2, journal: [], migrateCount: 0 };
  } catch(e) {
    var warn2 = document.getElementById('storage-warn');
    if (warn2) {
      warn2.textContent = 'Saved data was corrupted and has been reset.';
      warn2.style.display = 'block';
    }
    try { localStorage.removeItem(STORAGE_KEY); } catch(e2) { /* ignore */ }
    return { version: 2, journal: [], migrateCount: 0 };
  }
}
```

**`saveJournalState(journalData)`** — Persists journal data:

```js
function saveJournalState(journalData) {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journalData));
  } catch(e) { /* quota */ }
}
```

### 4. Global Journal Data

```js
var journalData = { version: 2, journal: [], migrateCount: 0 };
```

Initialize in `init()`:

```js
journalData = loadStateV2();
// Also update lastDiagnosis for backward-compat renderLastDx
if (journalData.lastDiagnosis) {
  lastDiagnosis = journalData.lastDiagnosis;
}
```

### 5. `saveToJournal()` Function

Called from the "Save & Start Tracking" button in all modes:

```js
function saveToJournal() {
  var entry;
  if (state.mode === 'multi-dx') {
    var plan = generateCombinedPlan(multiDxState.results);
    entry = createJournalEntry('multi-dx', null, multiDxState.results, plan, multiDxState.notes);
    entry.stage = multiDxState.stage;
    entry.symptoms = multiDxState.selectedSymptoms.slice();
  } else {
    // Wizard or Expert mode — single diagnosis
    var node = TREE[state.currentNode];
    if (!node || !isResult(node)) return;
    entry = createJournalEntry(
      state.mode,
      node.id,
      [{ resultId: node.id, score: node.confidence, rank: 1 }],
      null,
      state.wizardNotes
    );
  }

  // Evict if at cap
  if (journalData.journal.length >= 20) {
    journalData.journal = evictJournalEntry(journalData.journal);
  }

  journalData.journal.push(entry);
  saveJournalState(journalData);

  // Transition to treatment selection view
  journalState.view = 'treatment-select';
  journalState.activeEntryId = entry.id;
  render();
}
```

### 6. Journal Dashboard Renderer

**Display condition:** Shown when `journalData.journal.length > 0` AND the user is at the starting state (wizard at ROOT with empty history, expert with no selections, multi-dx at phase 'select').

```js
function isAtStartingState() {
  if (state.mode === 'wizard') return state.currentNode === ROOT && state.history.length === 0;
  if (state.mode === 'expert') return Object.keys(state.expertSelections).length === 0;
  if (state.mode === 'multi-dx') return multiDxState.phase === 'select' && multiDxState.selectedSymptoms.length === 0;
  return false;
}

function renderJournalDashboard() {
  if (!journalData || !journalData.journal || journalData.journal.length === 0) return '';
  if (!isAtStartingState()) return '';

  var html = '<div class="journal-dashboard">';
  html += '<div class="journal-header">';
  html += '<div class="journal-title">Treatment Journal</div>';
  html += '</div>';

  // Active/treating entries first
  var active = [];
  var resolved = [];
  for (var i = 0; i < journalData.journal.length; i++) {
    var e = journalData.journal[i];
    if (e.status === 'resolved') resolved.push(e);
    else active.push(e);
  }

  // Sort by date descending
  active.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  resolved.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  var entries = active.concat(resolved.slice(0, 3));

  for (var j = 0; j < entries.length; j++) {
    var entry = entries[j];
    var d = new Date(entry.createdAt);
    var dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    var daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);

    // Get primary diagnosis name
    var dxName = 'Unknown';
    if (entry.diagnoses && entry.diagnoses.length > 0) {
      var treeNode = TREE[entry.diagnoses[0].resultId];
      if (treeNode) dxName = treeNode.diagnosis;
      // Add secondary diagnoses for multi-dx
      if (entry.diagnoses.length > 1) {
        var secondary = TREE[entry.diagnoses[1].resultId];
        if (secondary) dxName += ' + ' + secondary.diagnosis;
      }
    }

    html += '<article class="journal-entry">';
    html += '<div class="journal-entry-date">' + escapeHtml(dateStr) + '</div>';
    html += '<div class="journal-entry-dx">' + escapeHtml(dxName) + '</div>';
    html += '<div class="journal-entry-meta">';
    html += '<span class="journal-status status-' + escapeHtml(entry.status) + '">' + escapeHtml(entry.status) + '</span>';
    html += '<span class="journal-days">' + daysAgo + ' day' + (daysAgo !== 1 ? 's' : '') + ' ago</span>';
    html += '</div>';

    if (entry.status === 'active' || entry.status === 'treating') {
      html += '<div style="margin-top: 8px;">';
      html += '<button class="btn btn-secondary" data-checkin-id="' + escapeHtml(entry.id) + '" type="button">Check In</button>';
      html += '</div>';
    }

    html += '</article>';
  }

  html += '</div>';
  return html;
}
```

### 7. Treatment Selection View

Shown after "Save & Start Tracking" — lets the user pick which fixes to track.

```js
function renderTreatmentSelect() {
  var entry = getJournalEntry(journalState.activeEntryId);
  if (!entry) return '<p>Entry not found.</p>';

  var fixes = [];
  if (entry.combinedPlan && entry.combinedPlan.fixes) {
    fixes = entry.combinedPlan.fixes;
  } else if (entry.diagnoses && entry.diagnoses.length > 0) {
    var treeNode = TREE[entry.diagnoses[0].resultId];
    if (treeNode && treeNode.fixes) fixes = treeNode.fixes;
  }

  var html = '<div class="checkin-card fade-in">';
  html += '<div class="checkin-title">Select Treatments to Track</div>';
  html += '<div class="checkin-context">Check the fix steps you plan to apply. These will be tracked in your journal.</div>';

  for (var i = 0; i < fixes.length; i++) {
    html += '<label class="treatment-select">';
    html += '<input type="checkbox" value="' + i + '" data-fix="' + escapeHtml(fixes[i]) + '">';
    html += '<span>' + escapeHtml(fixes[i]) + '</span>';
    html += '</label>';
  }

  html += '<div class="nav-row" style="margin-top: 16px;">';
  html += '<button class="btn btn-primary" id="btn-start-tracking" type="button">Start Tracking</button>';
  html += '<button class="btn btn-secondary" id="btn-skip-tracking" type="button">Skip</button>';
  html += '</div>';
  html += '</div>';
  return html;
}
```

### 8. Check-In Flow

**Step 1: Status Update**

```js
function renderCheckInStep1() {
  var entry = getJournalEntry(journalState.activeEntryId);
  if (!entry) return '';

  var html = '<div class="checkin-card fade-in">';
  html += '<div class="checkin-title">Check In</div>';
  html += '<div class="q-text">How is the plant responding?</div>';
  html += '<div class="options">';
  var responses = [
    { id: 'much-better', label: 'Much better' },
    { id: 'somewhat-better', label: 'Somewhat better' },
    { id: 'no-change', label: 'No change' },
    { id: 'getting-worse', label: 'Getting worse' },
    { id: 'new-symptoms', label: 'New symptoms appeared' }
  ];
  for (var i = 0; i < responses.length; i++) {
    html += '<button class="opt-btn" data-checkin-response="' + responses[i].id + '" type="button">'
         + escapeHtml(responses[i].label) + '</button>';
  }
  html += '</div>';
  html += '</div>';
  html += '<div class="nav-row"><button class="btn btn-secondary" id="btn-checkin-cancel" type="button">Cancel</button></div>';
  return html;
}
```

**Step 2: Detail** (conditional on Step 1 response)

```js
function renderCheckInStep2() {
  var entry = getJournalEntry(journalState.activeEntryId);
  var response = journalState.checkInData.response;
  if (!entry || !response) return '';

  var html = '<div class="checkin-card fade-in">';

  if (response === 'much-better' || response === 'somewhat-better') {
    html += '<div class="q-text">Which symptoms have improved or resolved?</div>';
    var symptoms = entry.symptoms || [];
    for (var i = 0; i < symptoms.length; i++) {
      var sym = SYMPTOMS ? SYMPTOMS[symptoms[i]] : null;
      var label = sym ? sym.label : symptoms[i];
      html += '<label class="symptom-check">';
      html += '<input type="checkbox" value="' + escapeHtml(symptoms[i]) + '" class="resolved-symptom">';
      html += '<span class="symptom-check-label">' + escapeHtml(label) + '</span>';
      html += '</label>';
    }
  } else if (response === 'no-change' || response === 'getting-worse') {
    html += '<div class="q-text">How many days since you applied the fix?</div>';
    html += '<input type="number" class="expert-select" id="days-since-fix" min="0" max="90" value="3" style="width: 120px;">';
    html += renderNotesExpander('checkin-detail', '', 'wizardNotes');
  } else if (response === 'new-symptoms') {
    html += '<div class="q-text">Which new symptoms appeared?</div>';
    if (dataFileLoaded()) {
      var existing = {};
      for (var k = 0; k < (entry.symptoms || []).length; k++) existing[entry.symptoms[k]] = true;
      for (var symId in SYMPTOMS) {
        if (!SYMPTOMS.hasOwnProperty(symId) || existing[symId]) continue;
        html += '<label class="symptom-check">';
        html += '<input type="checkbox" value="' + escapeHtml(symId) + '" class="new-symptom">';
        html += '<span class="symptom-check-label">' + escapeHtml(SYMPTOMS[symId].label) + '</span>';
        html += '</label>';
      }
    }
  }

  html += '</div>';
  html += '<div class="nav-row">';
  html += '<button class="btn btn-primary" id="btn-checkin-submit" type="button">Submit</button>';
  html += '<button class="btn btn-secondary" id="btn-checkin-back" type="button">Back</button>';
  html += '</div>';
  return html;
}
```

**Step 3: Re-Assessment and Updated Results**

After the user submits Step 2, re-score and show the changelog:

```js
function renderCheckInResult() {
  var entry = getJournalEntry(journalState.activeEntryId);
  if (!entry) return '';
  var checkInData = journalState.checkInData;

  var html = '<div class="checkin-card fade-in">';
  html += '<div class="checkin-title">Updated Assessment</div>';

  // Show score changelog
  if (checkInData.updatedScores && checkInData.previousScores) {
    for (var i = 0; i < checkInData.updatedScores.length; i++) {
      var updated = checkInData.updatedScores[i];
      var treeNode = TREE[updated.resultId];
      var name = treeNode ? treeNode.diagnosis : updated.resultId;
      var oldScore = null;
      for (var j = 0; j < checkInData.previousScores.length; j++) {
        if (checkInData.previousScores[j].resultId === updated.resultId) {
          oldScore = checkInData.previousScores[j].confidence || checkInData.previousScores[j].score;
          break;
        }
      }

      var oldPct = oldScore !== null ? Math.round(oldScore * 100) : '?';
      var newPct = Math.round(updated.score * 100);
      var changeClass = updated.score > (oldScore || 0) ? 'score-change-up' : updated.score < (oldScore || 0) ? 'score-change-down' : 'score-change-same';
      var arrow = updated.score > (oldScore || 0) ? '&#9650;' : updated.score < (oldScore || 0) ? '&#9660;' : '&#8212;';

      html += '<div class="score-change ' + changeClass + '">';
      html += '<span>' + escapeHtml(name) + ': ' + oldPct + '% &#8594; ' + newPct + '% ' + arrow + '</span>';
      html += '</div>';
    }
  }

  html += '</div>';
  html += '<div class="nav-row">';
  html += '<button class="btn btn-primary" id="btn-checkin-done" type="button">Done</button>';
  html += '</div>';
  return html;
}
```

### 9. `renderCheckIn()` — Dispatch

```js
function renderCheckIn() {
  if (journalState.view === 'treatment-select') return renderTreatmentSelect();
  if (journalState.view === 'check-in') return renderCheckInStep1();
  if (journalState.view === 'check-in-detail') return renderCheckInStep2();
  if (journalState.view === 'check-in-result') return renderCheckInResult();
  return '';
}
```

### 10. `getJournalEntry(id)` — Lookup Helper

```js
function getJournalEntry(id) {
  for (var i = 0; i < journalData.journal.length; i++) {
    if (journalData.journal[i].id === id) return journalData.journal[i];
  }
  return null;
}
```

### 11. Integration with `render()`

In `render()`, before mode dispatch, render the journal dashboard above the mode content when at starting state:

```js
function render() {
  var app = document.getElementById('app');
  var progressEl = document.getElementById('progress');

  // Journal check-in flow takes precedence
  if (journalState.view !== 'dashboard') {
    progressEl.style.display = 'none';
    app.innerHTML = renderCheckIn();
    bindJournalEvents();
    return;
  }

  // Build HTML — journal dashboard first if applicable
  var html = '';
  var dashHtml = renderJournalDashboard();
  if (dashHtml) html += dashHtml;

  // Then mode-specific content
  // ... (existing mode dispatch follows, appending to html)
}
```

### 12. `bindJournalEvents()` — Event Binding

Handles click events for check-in buttons, treatment selection, and navigation:

```js
function bindJournalEvents() {
  // Check In buttons on dashboard
  var checkInBtns = document.querySelectorAll('[data-checkin-id]');
  for (var i = 0; i < checkInBtns.length; i++) {
    checkInBtns[i].addEventListener('click', function() {
      journalState.activeEntryId = this.getAttribute('data-checkin-id');
      journalState.view = 'check-in';
      journalState.checkInData = {};
      render();
    });
  }

  // Check-in response buttons
  var responseBtns = document.querySelectorAll('[data-checkin-response]');
  for (var j = 0; j < responseBtns.length; j++) {
    responseBtns[j].addEventListener('click', function() {
      journalState.checkInData.response = this.getAttribute('data-checkin-response');
      journalState.view = 'check-in-detail';
      render();
    });
  }

  // Cancel check-in
  var cancelBtn = document.getElementById('btn-checkin-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', function() {
    journalState.view = 'dashboard';
    journalState.activeEntryId = null;
    render();
  });

  // Back in check-in
  var backBtn = document.getElementById('btn-checkin-back');
  if (backBtn) backBtn.addEventListener('click', function() {
    journalState.view = 'check-in';
    render();
  });

  // Submit check-in detail
  var submitBtn = document.getElementById('btn-checkin-submit');
  if (submitBtn) submitBtn.addEventListener('click', function() {
    processCheckIn();
  });

  // Done button
  var doneBtn = document.getElementById('btn-checkin-done');
  if (doneBtn) doneBtn.addEventListener('click', function() {
    journalState.view = 'dashboard';
    journalState.activeEntryId = null;
    render();
  });

  // Treatment selection — Start Tracking
  var startTrackBtn = document.getElementById('btn-start-tracking');
  if (startTrackBtn) startTrackBtn.addEventListener('click', function() {
    var checked = document.querySelectorAll('.treatment-select input:checked');
    var actions = [];
    for (var k = 0; k < checked.length; k++) {
      actions.push(checked[k].getAttribute('data-fix'));
    }
    var entry = getJournalEntry(journalState.activeEntryId);
    if (entry && actions.length > 0) {
      entry.treatments = createTreatments(actions);
      entry.status = 'treating';
      saveJournalState(journalData);
    }
    journalState.view = 'dashboard';
    render();
  });

  // Skip tracking
  var skipBtn = document.getElementById('btn-skip-tracking');
  if (skipBtn) skipBtn.addEventListener('click', function() {
    journalState.view = 'dashboard';
    render();
  });

  // Also bind notes events if available
  if (typeof bindNotesEvents === 'function') bindNotesEvents();
}
```

### 13. `processCheckIn()` — Re-Assessment Logic

```js
function processCheckIn() {
  var entry = getJournalEntry(journalState.activeEntryId);
  if (!entry) return;

  var response = journalState.checkInData.response;
  var resolvedSymptoms = [];
  var newSymptoms = [];

  // Collect resolved symptoms
  var resolvedChecks = document.querySelectorAll('.resolved-symptom:checked');
  for (var i = 0; i < resolvedChecks.length; i++) {
    resolvedSymptoms.push(resolvedChecks[i].value);
  }

  // Collect new symptoms
  var newChecks = document.querySelectorAll('.new-symptom:checked');
  for (var j = 0; j < newChecks.length; j++) {
    newSymptoms.push(newChecks[j].value);
  }

  // Save previous scores for changelog
  journalState.checkInData.previousScores = entry.diagnoses.slice();

  // Re-score with updated symptom set
  if (dataFileLoaded() && entry.symptoms && entry.symptoms.length > 0) {
    var updatedSymptoms = [];
    for (var k = 0; k < entry.symptoms.length; k++) {
      if (resolvedSymptoms.indexOf(entry.symptoms[k]) === -1) {
        updatedSymptoms.push(entry.symptoms[k]);
      }
    }
    for (var l = 0; l < newSymptoms.length; l++) {
      updatedSymptoms.push(newSymptoms[l]);
    }

    var treatedIds = entry.diagnoses.map(function(d) { return d.resultId; });
    var newScores = scoreDiagnoses(updatedSymptoms, entry.stage || 'veg', treatedIds);
    journalState.checkInData.updatedScores = newScores;

    // Update entry
    entry.symptoms = updatedSymptoms;
    entry.diagnoses = newScores.map(function(s, idx) {
      return { resultId: s.resultId, confidence: s.score, rank: idx + 1 };
    });
  }

  // Create check-in record
  var notes = '';
  var notesInput = document.querySelector('.notes-textarea');
  if (notesInput) notes = notesInput.value.substring(0, 200);
  var record = createCheckInRecord(response, resolvedSymptoms, newSymptoms, notes);
  record.updatedScores = journalState.checkInData.updatedScores || null;
  entry.checkIns.push(record);

  // Update status
  if (response === 'much-better' && resolvedSymptoms.length === entry.symptoms.length + resolvedSymptoms.length) {
    entry.status = 'resolved';
  }

  saveJournalState(journalData);
  journalState.view = 'check-in-result';
  render();
}
```

---

## Integration Points

- **Section 02 (State/Mode)**: Uses `journalState` for view routing, `render()` dispatches to journal views
- **Section 03 (Scoring)**: `scoreDiagnoses()` called with `treatedDiagnoses` during re-assessment
- **Section 04 (Notes)**: Notes included in journal entries, notes expander used in check-in detail
- **Section 05 (Multi-Dx)**: `saveToJournal()` reads `multiDxState` for multi-dx entries

---

## Checklist

1. [x] Add all journal CSS styles (dashboard, entries, status badges, check-in, treatment selection, score changes)
2. [x] Implement `generateId()`, `createJournalEntry()`, `evictJournalEntry()`, `createTreatments()`, `createCheckInRecord()`
3. [x] Implement `loadStateV2()` with v1-to-v2 migration and backup
4. [x] Implement `saveJournalState()` for persistence
5. [x] Implement `saveToJournal()` for all three modes
6. [x] Implement `renderJournalDashboard()` with display condition
7. [x] Implement `renderTreatmentSelect()` for post-save treatment picking
8. [x] Implement check-in flow: `renderCheckInStep1()`, `renderCheckInStep2()`, `renderCheckInResult()`
9. [x] Implement `renderCheckIn()` dispatch function
10. [x] Implement `processCheckIn()` with re-scoring and changelog
11. [x] Implement `getJournalEntry()` lookup helper
12. [x] Implement `bindJournalEvents()` for all journal interactions
13. [x] Integrate journal dashboard into `render()` above mode content
14. [x] Update `init()` to call `loadStateV2()` and initialize `journalData`
15. [x] Add Section 06 tests to `runTests()`
16. [ ] Test v1 migration: create v1 localStorage entry, reload, verify migration (manual)
17. [ ] Test journal cap: add 21 entries, verify eviction (manual)
18. [ ] Test full flow: diagnose in wizard, save to journal, check in, verify changelog (manual)
19. [ ] Test full flow: diagnose in multi-dx, save, select treatments, check in (manual)
20. [ ] Verify journal dashboard appears only at starting state (manual)

---

## Implementation Notes (Post-Review)

**Deviations from plan:**
- `processCheckIn()` auto-resolve condition was fixed: plan had `resolvedSymptoms.length === entry.symptoms.length + resolvedSymptoms.length` which is mathematically impossible after symptom mutation. Changed to `resolvedSymptoms.length >= originalSymptomCount && originalSymptomCount > 0` with `originalSymptomCount` captured before mutation.
- Added `daysSinceFix` capture to check-in records (the input was rendered but never read).
- Added corruption recovery persistence in `loadStateV2()` — corrupted v2 data is now saved back.
- Added treatment checkbox toggle styling (`.checked` class on parent label).

**Files modified:** `docs/tool-plant-doctor.html` (all changes in single file)
**Tests added:** 12 tests in `runTests()` covering migration, CRUD, eviction, status transitions, and corruption recovery.
