diff --git a/docs/tool-plant-doctor.html b/docs/tool-plant-doctor.html
index df21d34..e965896 100644
--- a/docs/tool-plant-doctor.html
+++ b/docs/tool-plant-doctor.html
@@ -432,6 +432,137 @@ h1 { font-family: var(--serif); font-size: 1.8rem; color: var(--accent); margin-
   margin-bottom: 16px;
 }
 
+/* Journal Dashboard */
+.journal-dashboard {
+  margin-bottom: 24px;
+}
+.journal-header {
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  margin-bottom: 12px;
+}
+.journal-title {
+  font-family: var(--serif);
+  font-size: 1.1rem;
+  color: var(--accent);
+}
+.journal-entry {
+  background: var(--bg2);
+  border: 1px solid var(--border);
+  border-radius: 10px;
+  padding: 14px 18px;
+  margin-bottom: 10px;
+}
+.journal-entry-date {
+  font-family: var(--mono);
+  font-size: 0.72rem;
+  color: var(--text3);
+}
+.journal-entry-dx {
+  font-family: var(--serif);
+  font-size: 1rem;
+  color: var(--text);
+  margin: 4px 0;
+}
+.journal-entry-meta {
+  display: flex;
+  align-items: center;
+  gap: 10px;
+  flex-wrap: wrap;
+}
+.journal-status {
+  display: inline-block;
+  font-family: var(--mono);
+  font-size: 0.7rem;
+  font-weight: 600;
+  padding: 2px 8px;
+  border-radius: 4px;
+  text-transform: uppercase;
+  letter-spacing: 0.5px;
+}
+.journal-status.status-active {
+  background: rgba(90, 158, 184, 0.15);
+  color: var(--blue);
+}
+.journal-status.status-treating {
+  background: rgba(201, 168, 76, 0.15);
+  color: var(--gold);
+}
+.journal-status.status-resolved {
+  background: rgba(143, 184, 86, 0.15);
+  color: var(--accent);
+}
+.journal-status.status-escalated {
+  background: rgba(196, 92, 74, 0.15);
+  color: var(--red);
+}
+.journal-days {
+  font-family: var(--mono);
+  font-size: 0.72rem;
+  color: var(--text3);
+}
+
+/* Check-in flow */
+.checkin-card {
+  background: var(--bg2);
+  border: 1px solid var(--border);
+  border-radius: 12px;
+  padding: 24px;
+  margin-bottom: 20px;
+}
+.checkin-title {
+  font-family: var(--serif);
+  font-size: 1.2rem;
+  color: var(--text);
+  margin-bottom: 12px;
+}
+.checkin-context {
+  font-size: 0.85rem;
+  color: var(--text3);
+  margin-bottom: 16px;
+}
+
+/* Score changelog */
+.score-change {
+  display: flex;
+  align-items: center;
+  gap: 8px;
+  font-family: var(--mono);
+  font-size: 0.82rem;
+  padding: 6px 0;
+}
+.score-change-up { color: var(--accent); }
+.score-change-down { color: var(--red); }
+.score-change-same { color: var(--text3); }
+
+/* Treatment selection checkboxes */
+.treatment-select {
+  display: flex;
+  align-items: flex-start;
+  gap: 10px;
+  padding: 10px 12px;
+  border: 1px solid var(--border2);
+  border-radius: 8px;
+  margin-bottom: 6px;
+  cursor: pointer;
+  transition: background 0.15s, border-color 0.15s;
+}
+.treatment-select:hover {
+  background: rgba(143, 184, 86, 0.06);
+}
+.treatment-select.checked {
+  border-color: var(--accent3);
+  background: rgba(143, 184, 86, 0.08);
+}
+.treatment-select input[type="checkbox"] {
+  width: 18px;
+  height: 18px;
+  accent-color: var(--accent);
+  margin-top: 2px;
+  flex-shrink: 0;
+}
+
 /* Responsive */
 @media (max-width: 640px) {
   body { padding: 14px; }
@@ -1242,6 +1373,202 @@ function loadState() {
   }
 }
 
+/* ── Journal Data Functions ── */
+var journalData = { version: 2, journal: [], migrateCount: 0 };
+
+function generateId() {
+  return 'j-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
+}
+
+function createJournalEntry(mode, primaryResultId, diagnoses, combinedPlan, notes) {
+  return {
+    id: generateId(),
+    createdAt: new Date().toISOString(),
+    stage: mode === 'multi-dx' ? multiDxState.stage : null,
+    mode: mode,
+    symptoms: mode === 'multi-dx' ? multiDxState.selectedSymptoms.slice() : [],
+    notes: notes ? JSON.parse(JSON.stringify(notes)) : {},
+    diagnoses: diagnoses ? diagnoses.map(function(d) {
+      return { resultId: d.resultId, confidence: d.score || d.confidence, rank: d.rank || 0 };
+    }) : [],
+    combinedPlan: combinedPlan ? JSON.parse(JSON.stringify(combinedPlan)) : null,
+    treatments: [],
+    checkIns: [],
+    status: 'active'
+  };
+}
+
+function evictJournalEntry(journal) {
+  if (journal.length < 20) return journal;
+
+  var oldestResolvedIdx = -1;
+  var oldestResolvedDate = null;
+  for (var i = 0; i < journal.length; i++) {
+    if (journal[i].status === 'resolved') {
+      var d = new Date(journal[i].createdAt);
+      if (oldestResolvedIdx === -1 || d < oldestResolvedDate) {
+        oldestResolvedIdx = i;
+        oldestResolvedDate = d;
+      }
+    }
+  }
+
+  if (oldestResolvedIdx !== -1) {
+    journal.splice(oldestResolvedIdx, 1);
+    return journal;
+  }
+
+  var oldestIdx = 0;
+  var oldestDate = new Date(journal[0].createdAt);
+  for (var j = 1; j < journal.length; j++) {
+    var dj = new Date(journal[j].createdAt);
+    if (dj < oldestDate) {
+      oldestIdx = j;
+      oldestDate = dj;
+    }
+  }
+  journal.splice(oldestIdx, 1);
+  return journal;
+}
+
+function createTreatments(actions) {
+  var treatments = [];
+  for (var i = 0; i < actions.length; i++) {
+    treatments.push({
+      action: actions[i],
+      startedAt: new Date().toISOString(),
+      status: 'active'
+    });
+  }
+  return treatments;
+}
+
+function createCheckInRecord(response, symptomsResolved, symptomsNew, notes) {
+  return {
+    date: new Date().toISOString(),
+    response: response,
+    symptomsResolved: symptomsResolved || [],
+    symptomsNew: symptomsNew || [],
+    notes: notes || '',
+    updatedScores: null
+  };
+}
+
+function getJournalEntry(id) {
+  for (var i = 0; i < journalData.journal.length; i++) {
+    if (journalData.journal[i].id === id) return journalData.journal[i];
+  }
+  return null;
+}
+
+/* ── localStorage v2 Schema and Migration ── */
+function loadStateV2() {
+  if (!storageAvailable) return { version: 2, journal: [], migrateCount: 0 };
+  try {
+    var raw = localStorage.getItem(STORAGE_KEY);
+    if (!raw) return { version: 2, journal: [], migrateCount: 0 };
+    var data = JSON.parse(raw);
+
+    if (data.version === 2) {
+      if (!Array.isArray(data.journal)) {
+        data.journal = [];
+        var warn = document.getElementById('storage-warn');
+        if (warn) {
+          warn.textContent = 'Journal data was corrupted and has been reset.';
+          warn.style.display = 'block';
+        }
+      }
+      if (typeof data.migrateCount === 'number') {
+        data.migrateCount++;
+        if (data.migrateCount >= 5) {
+          localStorage.removeItem(STORAGE_KEY + '-v1-backup');
+        }
+      }
+      return data;
+    }
+
+    if (data.version === 1) {
+      localStorage.setItem(STORAGE_KEY + '-v1-backup', raw);
+
+      var journal = [];
+      if (data.lastDiagnosis) {
+        var ld = data.lastDiagnosis;
+        journal.push({
+          id: generateId(),
+          createdAt: ld.date || new Date().toISOString(),
+          stage: null,
+          mode: 'wizard',
+          symptoms: [],
+          notes: {},
+          diagnoses: [{ resultId: ld.result.id, confidence: ld.result.confidence, rank: 1 }],
+          combinedPlan: null,
+          treatments: [],
+          checkIns: [],
+          status: 'resolved'
+        });
+      }
+
+      var v2Data = {
+        version: 2,
+        journal: journal,
+        migrateCount: 0,
+        lastDiagnosis: data.lastDiagnosis
+      };
+
+      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v2Data)); } catch(e) { /* quota */ }
+      return v2Data;
+    }
+
+    return { version: 2, journal: [], migrateCount: 0 };
+  } catch(e) {
+    var warn2 = document.getElementById('storage-warn');
+    if (warn2) {
+      warn2.textContent = 'Saved data was corrupted and has been reset.';
+      warn2.style.display = 'block';
+    }
+    try { localStorage.removeItem(STORAGE_KEY); } catch(e2) { /* ignore */ }
+    return { version: 2, journal: [], migrateCount: 0 };
+  }
+}
+
+function saveJournalState(jData) {
+  if (!storageAvailable) return;
+  try {
+    localStorage.setItem(STORAGE_KEY, JSON.stringify(jData));
+  } catch(e) { /* quota */ }
+}
+
+function saveToJournal() {
+  var entry;
+  if (state.mode === 'multi-dx') {
+    var plan = generateCombinedPlan(multiDxState.results);
+    entry = createJournalEntry('multi-dx', null, multiDxState.results, plan, multiDxState.notes);
+    entry.stage = multiDxState.stage;
+    entry.symptoms = multiDxState.selectedSymptoms.slice();
+  } else {
+    var node = TREE[state.currentNode];
+    if (!node || !isResult(node)) return;
+    entry = createJournalEntry(
+      state.mode,
+      node.id,
+      [{ resultId: node.id, score: node.confidence, rank: 1 }],
+      null,
+      state.wizardNotes
+    );
+  }
+
+  if (journalData.journal.length >= 20) {
+    journalData.journal = evictJournalEntry(journalData.journal);
+  }
+
+  journalData.journal.push(entry);
+  saveJournalState(journalData);
+
+  journalState.view = 'treatment-select';
+  journalState.activeEntryId = entry.id;
+  render();
+}
+
 /* ── Node Helpers ── */
 function isResult(node) {
   return node && typeof node.diagnosis === 'string';
@@ -1660,6 +1987,353 @@ function renderLastDx() {
   el.style.display = 'block';
 }
 
+/* ── Rendering: Journal Dashboard ── */
+function isAtStartingState() {
+  if (state.mode === 'wizard') return state.currentNode === ROOT && state.history.length === 0;
+  if (state.mode === 'expert') return Object.keys(state.expertSelections).length === 0;
+  if (state.mode === 'multi-dx') return multiDxState.phase === 'select' && multiDxState.selectedSymptoms.length === 0;
+  return false;
+}
+
+function renderJournalDashboard() {
+  if (!journalData || !journalData.journal || journalData.journal.length === 0) return '';
+  if (!isAtStartingState()) return '';
+
+  var html = '<div class="journal-dashboard">';
+  html += '<div class="journal-header">';
+  html += '<div class="journal-title">Treatment Journal</div>';
+  html += '</div>';
+
+  var active = [];
+  var resolved = [];
+  for (var i = 0; i < journalData.journal.length; i++) {
+    var e = journalData.journal[i];
+    if (e.status === 'resolved') resolved.push(e);
+    else active.push(e);
+  }
+
+  active.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
+  resolved.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
+
+  var entries = active.concat(resolved.slice(0, 3));
+
+  for (var j = 0; j < entries.length; j++) {
+    var entry = entries[j];
+    var d = new Date(entry.createdAt);
+    var dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
+    var daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
+
+    var dxName = 'Unknown';
+    if (entry.diagnoses && entry.diagnoses.length > 0) {
+      var treeNode = TREE[entry.diagnoses[0].resultId];
+      if (treeNode) dxName = treeNode.diagnosis;
+      if (entry.diagnoses.length > 1) {
+        var secondary = TREE[entry.diagnoses[1].resultId];
+        if (secondary) dxName += ' + ' + secondary.diagnosis;
+      }
+    }
+
+    html += '<article class="journal-entry">';
+    html += '<div class="journal-entry-date">' + escapeHtml(dateStr) + '</div>';
+    html += '<div class="journal-entry-dx">' + escapeHtml(dxName) + '</div>';
+    html += '<div class="journal-entry-meta">';
+    html += '<span class="journal-status status-' + escapeHtml(entry.status) + '">' + escapeHtml(entry.status) + '</span>';
+    html += '<span class="journal-days">' + daysAgo + ' day' + (daysAgo !== 1 ? 's' : '') + ' ago</span>';
+    html += '</div>';
+
+    if (entry.status === 'active' || entry.status === 'treating') {
+      html += '<div style="margin-top: 8px;">';
+      html += '<button class="btn btn-secondary" data-checkin-id="' + escapeHtml(entry.id) + '" type="button">Check In</button>';
+      html += '</div>';
+    }
+
+    html += '</article>';
+  }
+
+  html += '</div>';
+  return html;
+}
+
+/* ── Rendering: Treatment Selection ── */
+function renderTreatmentSelect() {
+  var entry = getJournalEntry(journalState.activeEntryId);
+  if (!entry) return '<p>Entry not found.</p>';
+
+  var fixes = [];
+  if (entry.combinedPlan && entry.combinedPlan.fixes) {
+    fixes = entry.combinedPlan.fixes;
+  } else if (entry.diagnoses && entry.diagnoses.length > 0) {
+    var treeNode = TREE[entry.diagnoses[0].resultId];
+    if (treeNode && treeNode.fixes) fixes = treeNode.fixes;
+  }
+
+  var html = '<div class="checkin-card fade-in">';
+  html += '<div class="checkin-title">Select Treatments to Track</div>';
+  html += '<div class="checkin-context">Check the fix steps you plan to apply. These will be tracked in your journal.</div>';
+
+  for (var i = 0; i < fixes.length; i++) {
+    html += '<label class="treatment-select">';
+    html += '<input type="checkbox" value="' + i + '" data-fix="' + escapeHtml(fixes[i]) + '">';
+    html += '<span>' + escapeHtml(fixes[i]) + '</span>';
+    html += '</label>';
+  }
+
+  html += '<div class="nav-row" style="margin-top: 16px;">';
+  html += '<button class="btn btn-primary" id="btn-start-tracking" type="button">Start Tracking</button>';
+  html += '<button class="btn btn-secondary" id="btn-skip-tracking" type="button">Skip</button>';
+  html += '</div>';
+  html += '</div>';
+  return html;
+}
+
+/* ── Rendering: Check-In Flow ── */
+function renderCheckInStep1() {
+  var entry = getJournalEntry(journalState.activeEntryId);
+  if (!entry) return '';
+
+  var html = '<div class="checkin-card fade-in">';
+  html += '<div class="checkin-title">Check In</div>';
+  html += '<div class="q-text">How is the plant responding?</div>';
+  html += '<div class="options">';
+  var responses = [
+    { id: 'much-better', label: 'Much better' },
+    { id: 'somewhat-better', label: 'Somewhat better' },
+    { id: 'no-change', label: 'No change' },
+    { id: 'getting-worse', label: 'Getting worse' },
+    { id: 'new-symptoms', label: 'New symptoms appeared' }
+  ];
+  for (var i = 0; i < responses.length; i++) {
+    html += '<button class="opt-btn" data-checkin-response="' + responses[i].id + '" type="button">'
+         + escapeHtml(responses[i].label) + '</button>';
+  }
+  html += '</div>';
+  html += '</div>';
+  html += '<div class="nav-row"><button class="btn btn-secondary" id="btn-checkin-cancel" type="button">Cancel</button></div>';
+  return html;
+}
+
+function renderCheckInStep2() {
+  var entry = getJournalEntry(journalState.activeEntryId);
+  var response = journalState.checkInData.response;
+  if (!entry || !response) return '';
+
+  var html = '<div class="checkin-card fade-in">';
+
+  if (response === 'much-better' || response === 'somewhat-better') {
+    html += '<div class="q-text">Which symptoms have improved or resolved?</div>';
+    var symptoms = entry.symptoms || [];
+    for (var i = 0; i < symptoms.length; i++) {
+      var sym = typeof SYMPTOMS !== 'undefined' ? SYMPTOMS[symptoms[i]] : null;
+      var label = sym ? sym.label : symptoms[i];
+      html += '<label class="symptom-check">';
+      html += '<input type="checkbox" value="' + escapeHtml(symptoms[i]) + '" class="resolved-symptom">';
+      html += '<span class="symptom-check-label">' + escapeHtml(label) + '</span>';
+      html += '</label>';
+    }
+  } else if (response === 'no-change' || response === 'getting-worse') {
+    html += '<div class="q-text">How many days since you applied the fix?</div>';
+    html += '<input type="number" class="expert-select" id="days-since-fix" min="0" max="90" value="3" style="width: 120px;">';
+    html += renderNotesExpander('checkin-detail', '', 'wizardNotes');
+  } else if (response === 'new-symptoms') {
+    html += '<div class="q-text">Which new symptoms appeared?</div>';
+    if (dataFileLoaded()) {
+      var existing = {};
+      for (var k = 0; k < (entry.symptoms || []).length; k++) existing[entry.symptoms[k]] = true;
+      for (var symId in SYMPTOMS) {
+        if (!SYMPTOMS.hasOwnProperty(symId) || existing[symId]) continue;
+        html += '<label class="symptom-check">';
+        html += '<input type="checkbox" value="' + escapeHtml(symId) + '" class="new-symptom">';
+        html += '<span class="symptom-check-label">' + escapeHtml(SYMPTOMS[symId].label) + '</span>';
+        html += '</label>';
+      }
+    }
+  }
+
+  html += '</div>';
+  html += '<div class="nav-row">';
+  html += '<button class="btn btn-primary" id="btn-checkin-submit" type="button">Submit</button>';
+  html += '<button class="btn btn-secondary" id="btn-checkin-back" type="button">Back</button>';
+  html += '</div>';
+  return html;
+}
+
+function renderCheckInResult() {
+  var entry = getJournalEntry(journalState.activeEntryId);
+  if (!entry) return '';
+  var checkInData = journalState.checkInData;
+
+  var html = '<div class="checkin-card fade-in">';
+  html += '<div class="checkin-title">Updated Assessment</div>';
+
+  if (checkInData.updatedScores && checkInData.previousScores) {
+    for (var i = 0; i < checkInData.updatedScores.length; i++) {
+      var updated = checkInData.updatedScores[i];
+      var treeNode = TREE[updated.resultId];
+      var name = treeNode ? treeNode.diagnosis : updated.resultId;
+      var oldScore = null;
+      for (var j = 0; j < checkInData.previousScores.length; j++) {
+        if (checkInData.previousScores[j].resultId === updated.resultId) {
+          oldScore = checkInData.previousScores[j].confidence || checkInData.previousScores[j].score;
+          break;
+        }
+      }
+
+      var oldPct = oldScore !== null ? Math.round(oldScore * 100) : '?';
+      var newPct = Math.round(updated.score * 100);
+      var changeClass = updated.score > (oldScore || 0) ? 'score-change-up' : updated.score < (oldScore || 0) ? 'score-change-down' : 'score-change-same';
+      var arrow = updated.score > (oldScore || 0) ? '&#9650;' : updated.score < (oldScore || 0) ? '&#9660;' : '&#8212;';
+
+      html += '<div class="score-change ' + changeClass + '">';
+      html += '<span>' + escapeHtml(name) + ': ' + oldPct + '% &#8594; ' + newPct + '% ' + arrow + '</span>';
+      html += '</div>';
+    }
+  }
+
+  html += '</div>';
+  html += '<div class="nav-row">';
+  html += '<button class="btn btn-primary" id="btn-checkin-done" type="button">Done</button>';
+  html += '</div>';
+  return html;
+}
+
+function renderCheckIn() {
+  if (journalState.view === 'treatment-select') return renderTreatmentSelect();
+  if (journalState.view === 'check-in') return renderCheckInStep1();
+  if (journalState.view === 'check-in-detail') return renderCheckInStep2();
+  if (journalState.view === 'check-in-result') return renderCheckInResult();
+  return '';
+}
+
+/* ── Check-In Processing ── */
+function processCheckIn() {
+  var entry = getJournalEntry(journalState.activeEntryId);
+  if (!entry) return;
+
+  var response = journalState.checkInData.response;
+  var resolvedSymptoms = [];
+  var newSymptoms = [];
+
+  var resolvedChecks = document.querySelectorAll('.resolved-symptom:checked');
+  for (var i = 0; i < resolvedChecks.length; i++) {
+    resolvedSymptoms.push(resolvedChecks[i].value);
+  }
+
+  var newChecks = document.querySelectorAll('.new-symptom:checked');
+  for (var j = 0; j < newChecks.length; j++) {
+    newSymptoms.push(newChecks[j].value);
+  }
+
+  journalState.checkInData.previousScores = entry.diagnoses.slice();
+
+  if (dataFileLoaded() && entry.symptoms && entry.symptoms.length > 0) {
+    var updatedSymptoms = [];
+    for (var k = 0; k < entry.symptoms.length; k++) {
+      if (resolvedSymptoms.indexOf(entry.symptoms[k]) === -1) {
+        updatedSymptoms.push(entry.symptoms[k]);
+      }
+    }
+    for (var l = 0; l < newSymptoms.length; l++) {
+      updatedSymptoms.push(newSymptoms[l]);
+    }
+
+    var treatedIds = entry.diagnoses.map(function(d) { return d.resultId; });
+    var newScores = scoreDiagnoses(updatedSymptoms, entry.stage || 'veg', treatedIds);
+    journalState.checkInData.updatedScores = newScores;
+
+    entry.symptoms = updatedSymptoms;
+    entry.diagnoses = newScores.map(function(s, idx) {
+      return { resultId: s.resultId, confidence: s.score, rank: idx + 1 };
+    });
+  }
+
+  var notes = '';
+  var notesInput = document.querySelector('.notes-textarea');
+  if (notesInput) notes = notesInput.value.substring(0, 200);
+  var record = createCheckInRecord(response, resolvedSymptoms, newSymptoms, notes);
+  record.updatedScores = journalState.checkInData.updatedScores || null;
+  entry.checkIns.push(record);
+
+  if (response === 'much-better' && resolvedSymptoms.length === entry.symptoms.length + resolvedSymptoms.length) {
+    entry.status = 'resolved';
+  }
+
+  saveJournalState(journalData);
+  journalState.view = 'check-in-result';
+  render();
+}
+
+/* ── Journal Event Binding ── */
+function bindJournalEvents() {
+  var checkInBtns = document.querySelectorAll('[data-checkin-id]');
+  for (var i = 0; i < checkInBtns.length; i++) {
+    checkInBtns[i].addEventListener('click', function() {
+      journalState.activeEntryId = this.getAttribute('data-checkin-id');
+      journalState.view = 'check-in';
+      journalState.checkInData = {};
+      render();
+    });
+  }
+
+  var responseBtns = document.querySelectorAll('[data-checkin-response]');
+  for (var j = 0; j < responseBtns.length; j++) {
+    responseBtns[j].addEventListener('click', function() {
+      journalState.checkInData.response = this.getAttribute('data-checkin-response');
+      journalState.view = 'check-in-detail';
+      render();
+    });
+  }
+
+  var cancelBtn = document.getElementById('btn-checkin-cancel');
+  if (cancelBtn) cancelBtn.addEventListener('click', function() {
+    journalState.view = 'dashboard';
+    journalState.activeEntryId = null;
+    render();
+  });
+
+  var backBtn = document.getElementById('btn-checkin-back');
+  if (backBtn) backBtn.addEventListener('click', function() {
+    journalState.view = 'check-in';
+    render();
+  });
+
+  var submitBtn = document.getElementById('btn-checkin-submit');
+  if (submitBtn) submitBtn.addEventListener('click', function() {
+    processCheckIn();
+  });
+
+  var doneBtn = document.getElementById('btn-checkin-done');
+  if (doneBtn) doneBtn.addEventListener('click', function() {
+    journalState.view = 'dashboard';
+    journalState.activeEntryId = null;
+    render();
+  });
+
+  var startTrackBtn = document.getElementById('btn-start-tracking');
+  if (startTrackBtn) startTrackBtn.addEventListener('click', function() {
+    var checked = document.querySelectorAll('.treatment-select input:checked');
+    var actions = [];
+    for (var k = 0; k < checked.length; k++) {
+      actions.push(checked[k].getAttribute('data-fix'));
+    }
+    var entry = getJournalEntry(journalState.activeEntryId);
+    if (entry && actions.length > 0) {
+      entry.treatments = createTreatments(actions);
+      entry.status = 'treating';
+      saveJournalState(journalData);
+    }
+    journalState.view = 'dashboard';
+    render();
+  });
+
+  var skipBtn = document.getElementById('btn-skip-tracking');
+  if (skipBtn) skipBtn.addEventListener('click', function() {
+    journalState.view = 'dashboard';
+    render();
+  });
+
+  if (typeof bindNotesEvents === 'function') bindNotesEvents();
+}
+
 /* ── Rendering: Notes Expander ── */
 function renderNotesExpander(stepId, existingContent, storageKey) {
   var content = existingContent || '';
@@ -1748,32 +2422,35 @@ function render() {
 
   if (journalState.view !== 'dashboard') {
     progressEl.style.display = 'none';
-    if (typeof renderCheckIn === 'function') {
-      app.innerHTML = renderCheckIn();
-    }
+    app.innerHTML = renderCheckIn();
+    bindJournalEvents();
     return;
   }
 
+  var dashHtml = renderJournalDashboard();
+
   if (state.mode === 'wizard') {
     var node = TREE[state.currentNode];
     if (isResult(node)) {
-      app.innerHTML = renderResultCard(node);
+      app.innerHTML = dashHtml + renderResultCard(node);
       saveLastDiagnosis(node);
       lastDiagnosis = { date: new Date().toISOString(), result: { id: node.id, diagnosis: node.diagnosis, severity: node.severity, confidence: node.confidence }, path: state.history.concat([node.id]) };
       renderLastDx();
       setTimeout(function() { var rc = document.getElementById('result-card'); if (rc) rc.focus(); }, 50);
     } else {
-      app.innerHTML = renderWizardQuestion(node);
+      app.innerHTML = dashHtml + renderWizardQuestion(node);
     }
     bindWizardEvents();
     bindNotesEvents();
+    bindJournalEvents();
     progressEl.style.display = '';
     renderProgress();
 
   } else if (state.mode === 'expert') {
-    app.innerHTML = renderExpert();
+    app.innerHTML = dashHtml + renderExpert();
     bindExpertEvents();
     bindNotesEvents();
+    bindJournalEvents();
     var expertResult = getExpertResult();
     if (expertResult && (!lastDiagnosis || lastDiagnosis.result.id !== expertResult.id)) {
       saveLastDiagnosis(expertResult);
@@ -1787,13 +2464,14 @@ function render() {
 
   } else if (state.mode === 'multi-dx') {
     if (multiDxState.phase === 'select') {
-      app.innerHTML = renderMultiDxSelect();
+      app.innerHTML = dashHtml + renderMultiDxSelect();
     } else if (multiDxState.phase === 'refining') {
       app.innerHTML = renderMultiDxRefine();
     } else if (multiDxState.phase === 'results') {
       app.innerHTML = renderMultiDxResults();
     }
     bindMultiDxEvents();
+    bindJournalEvents();
     progressEl.style.display = 'none';
   }
 }
@@ -2076,7 +2754,12 @@ function init() {
     warn.textContent = 'localStorage is unavailable. Your diagnosis will not be saved.';
     warn.style.display = 'block';
   }
-  loadState();
+  journalData = loadStateV2();
+  if (journalData.lastDiagnosis) {
+    lastDiagnosis = journalData.lastDiagnosis;
+  } else {
+    loadState();
+  }
   renderLastDx();
   bindModeSelector();
   render();
@@ -2094,6 +2777,8 @@ function runTests() {
 
   var savedState = { currentNode: state.currentNode, history: state.history.slice(), mode: state.mode, expertSelections: JSON.parse(JSON.stringify(state.expertSelections)), wizardNotes: JSON.parse(JSON.stringify(state.wizardNotes)) };
   var savedDx = lastDiagnosis;
+  var savedJournalData = JSON.parse(JSON.stringify(journalData));
+  var savedJournalState = JSON.parse(JSON.stringify(journalState));
 
   // Test: tree traversal reaches result node for every valid path combination
   var allPaths = 0, deadEnds = 0;
@@ -2676,6 +3361,148 @@ function runTests() {
     console.log('SKIP: Multi-Dx tests (data file not loaded)');
   }
 
+  // ── Section 06: Treatment Journal Tests ──
+
+  // Test: v1 localStorage migrates to v2 format
+  (function() {
+    var savedRaw = localStorage.getItem(STORAGE_KEY);
+    var v1Data = JSON.stringify({
+      version: 1,
+      lastDiagnosis: {
+        date: '2026-03-15T10:00:00.000Z',
+        path: ['q-stage', 'q-symptom', 'q-yellow-where', 'q-yellow-old'],
+        result: { id: 'r-n-def', diagnosis: 'Nitrogen Deficiency', severity: 'warning', confidence: 0.85 }
+      }
+    });
+    localStorage.setItem(STORAGE_KEY, v1Data);
+    var migrated = loadStateV2();
+    assert(migrated.version === 2, 'v1 data migrates to version 2');
+    assert(Array.isArray(migrated.journal), 'Migrated data has journal array');
+    assert(migrated.journal.length === 1, 'Migrated data has 1 journal entry from lastDiagnosis');
+    assert(migrated.journal[0].mode === 'wizard', 'Migrated entry has mode: wizard');
+    assert(migrated.journal[0].status === 'resolved', 'Migrated entry has status: resolved');
+    if (savedRaw) localStorage.setItem(STORAGE_KEY, savedRaw);
+    else localStorage.removeItem(STORAGE_KEY);
+  })();
+
+  // Test: v1 backup stored during migration
+  (function() {
+    var savedRaw = localStorage.getItem(STORAGE_KEY);
+    var savedBackup = localStorage.getItem(STORAGE_KEY + '-v1-backup');
+    var v1Data = JSON.stringify({ version: 1, lastDiagnosis: { date: '2026-03-15T10:00:00.000Z', path: [], result: { id: 'r-n-def', diagnosis: 'Nitrogen Deficiency', severity: 'warning', confidence: 0.85 } } });
+    localStorage.setItem(STORAGE_KEY, v1Data);
+    loadStateV2();
+    var backup = localStorage.getItem(STORAGE_KEY + '-v1-backup');
+    assert(backup !== null, 'v1 backup created during migration');
+    if (savedRaw) localStorage.setItem(STORAGE_KEY, savedRaw);
+    else localStorage.removeItem(STORAGE_KEY);
+    if (savedBackup) localStorage.setItem(STORAGE_KEY + '-v1-backup', savedBackup);
+    else localStorage.removeItem(STORAGE_KEY + '-v1-backup');
+  })();
+
+  // Test: journal entry creation from wizard result
+  var testEntry = createJournalEntry('wizard', 'r-n-def', [{ resultId: 'r-n-def', confidence: 0.85, rank: 1 }], null, {});
+  assert(testEntry.mode === 'wizard', 'Journal entry from wizard has mode: wizard');
+  assert(Array.isArray(testEntry.symptoms) && testEntry.symptoms.length === 0, 'Wizard entry has empty symptoms array');
+  assert(testEntry.status === 'active', 'New entry has status: active');
+  assert(testEntry.id && testEntry.createdAt, 'Entry has id and createdAt');
+
+  // Test: journal entry creation from multi-dx result
+  var testEntryMdx = createJournalEntry('multi-dx', null,
+    [{ resultId: 'r-n-def', confidence: 0.78, rank: 1 }, { resultId: 'r-ph-lockout', confidence: 0.62, rank: 2 }],
+    { checkFirst: ['Check pH'], fixes: ['Flush'], alsoConsider: [] },
+    { 'step-symptoms': 'Started 3 days ago' }
+  );
+  assert(testEntryMdx.mode === 'multi-dx', 'Multi-dx entry has correct mode');
+  assert(testEntryMdx.combinedPlan !== null, 'Multi-dx entry has combinedPlan');
+  assert(testEntryMdx.notes['step-symptoms'] === 'Started 3 days ago', 'Multi-dx entry includes notes');
+
+  // Test: journal capped at 20 entries — 21st evicts oldest resolved
+  (function() {
+    var testJournal = [];
+    for (var i = 0; i < 20; i++) {
+      testJournal.push({
+        id: 'test-' + i,
+        createdAt: new Date(2026, 0, i + 1).toISOString(),
+        status: i < 5 ? 'resolved' : 'active',
+        mode: 'wizard',
+        symptoms: [],
+        diagnoses: [],
+        treatments: [],
+        checkIns: [],
+        notes: {}
+      });
+    }
+    var evicted = evictJournalEntry(testJournal);
+    assert(evicted.length === 19, 'Eviction removes one entry (got ' + evicted.length + ')');
+    var hasOldestResolved = false;
+    for (var j = 0; j < evicted.length; j++) {
+      if (evicted[j].id === 'test-0') hasOldestResolved = true;
+    }
+    assert(!hasOldestResolved, 'Oldest resolved entry was evicted');
+  })();
+
+  // Test: if all 20 are active, 21st evicts oldest overall
+  (function() {
+    var testJournal = [];
+    for (var i = 0; i < 20; i++) {
+      testJournal.push({
+        id: 'test-' + i,
+        createdAt: new Date(2026, 0, i + 1).toISOString(),
+        status: 'active',
+        mode: 'wizard',
+        symptoms: [],
+        diagnoses: [],
+        treatments: [],
+        checkIns: [],
+        notes: {}
+      });
+    }
+    var evicted = evictJournalEntry(testJournal);
+    assert(evicted.length === 19, 'All-active eviction removes one entry');
+    var hasOldest = false;
+    for (var j = 0; j < evicted.length; j++) {
+      if (evicted[j].id === 'test-0') hasOldest = true;
+    }
+    assert(!hasOldest, 'Oldest active entry evicted when no resolved entries');
+  })();
+
+  // Test: treatment selection creates treatments[] entries
+  var testTreatments = createTreatments(['Flush with pH water', 'Increase nitrogen']);
+  assert(testTreatments.length === 2, 'createTreatments creates 2 entries');
+  assert(testTreatments[0].status === 'active', 'Treatment status starts as active');
+  assert(testTreatments[0].action === 'Flush with pH water', 'Treatment action matches');
+
+  // Test: check-in creates valid checkIn record
+  var testCheckIn = createCheckInRecord('somewhat-better', ['yellow-lower'], [], 'Tips stopped spreading');
+  assert(testCheckIn.response === 'somewhat-better', 'Check-in has correct response');
+  assert(testCheckIn.date, 'Check-in has date');
+  assert(Array.isArray(testCheckIn.symptomsResolved), 'Check-in has symptomsResolved array');
+  assert(testCheckIn.notes === 'Tips stopped spreading', 'Check-in includes notes');
+
+  // Test: journal entry status transitions
+  var statusEntry = createJournalEntry('wizard', 'r-n-def', [{ resultId: 'r-n-def', confidence: 0.85, rank: 1 }], null, {});
+  assert(statusEntry.status === 'active', 'New entry starts active');
+  statusEntry.treatments = [{ action: 'Flush', startedAt: new Date().toISOString(), status: 'active' }];
+  statusEntry.status = 'treating';
+  assert(statusEntry.status === 'treating', 'Entry transitions to treating');
+  statusEntry.status = 'resolved';
+  assert(statusEntry.status === 'resolved', 'Entry transitions to resolved');
+
+  // Test: corrupted journal data triggers warning, not crash
+  (function() {
+    var savedRaw = localStorage.getItem(STORAGE_KEY);
+    localStorage.setItem(STORAGE_KEY, '{"version":2,"journal":"not-an-array"}');
+    try {
+      var loaded = loadStateV2();
+      assert(Array.isArray(loaded.journal), 'Corrupted journal recovered to empty array');
+    } catch(e) {
+      assert(false, 'Corrupted journal crashed: ' + e.message);
+    }
+    if (savedRaw) localStorage.setItem(STORAGE_KEY, savedRaw);
+    else localStorage.removeItem(STORAGE_KEY);
+  })();
+
   // Restore state
   state.currentNode = savedState.currentNode;
   state.history = savedState.history;
@@ -2683,6 +3510,10 @@ function runTests() {
   state.expertSelections = savedState.expertSelections;
   state.wizardNotes = savedState.wizardNotes;
   lastDiagnosis = savedDx;
+  journalData = savedJournalData;
+  journalState.view = savedJournalState.view;
+  journalState.activeEntryId = savedJournalState.activeEntryId;
+  journalState.checkInData = savedJournalState.checkInData;
   render();
 
   console.log('\n' + passed + ' passed, ' + failed + ' failed');
diff --git a/planning/plant-doctor-v2/implementation/deep_implement_config.json b/planning/plant-doctor-v2/implementation/deep_implement_config.json
index adff747..8038d90 100644
--- a/planning/plant-doctor-v2/implementation/deep_implement_config.json
+++ b/planning/plant-doctor-v2/implementation/deep_implement_config.json
@@ -27,6 +27,14 @@
     "section-03-scoring-engine": {
       "status": "complete",
       "commit_hash": "177a3f3"
+    },
+    "section-04-notes-input": {
+      "status": "complete",
+      "commit_hash": "5f0cbfb"
+    },
+    "section-05-multi-dx-mode": {
+      "status": "complete",
+      "commit_hash": "abd6abb"
     }
   },
   "pre_commit": {
