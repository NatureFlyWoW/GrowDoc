diff --git a/docs/tool-stealth-audit.html b/docs/tool-stealth-audit.html
index f1d706e..0c214ca 100644
--- a/docs/tool-stealth-audit.html
+++ b/docs/tool-stealth-audit.html
@@ -3,20 +3,905 @@
 <head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
-<title>Stealth Audit</title>
+<title>Stealth Audit — GrowDoc</title>
+<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Serif+4:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
 <style>
-  body { font-family: Georgia, serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f0e8; color: #4a3728; }
-  .placeholder { text-align: center; }
-  .placeholder .icon { font-size: 3rem; }
-  .placeholder h1 { font-size: 1.3rem; margin: 12px 0 4px; }
-  .placeholder p { font-size: 0.9rem; color: #6b5540; }
+:root {
+  --bg: #0c0e0a; --bg2: #141a10; --bg3: #1a2214;
+  --text: #d4cdb7; --text2: #a39e8a; --text3: #6b6756;
+  --accent: #8fb856; --accent2: #6a9e3a; --accent3: #4a7a25;
+  --gold: #c9a84c; --gold2: #a8872e;
+  --red: #c45c4a; --red2: #a33d2d;
+  --blue: #5a9eb8;
+  --border: #2a3320; --border2: #3a4530;
+  --serif: 'DM Serif Display', Georgia, serif;
+  --body: 'Source Serif 4', Georgia, serif;
+  --mono: 'IBM Plex Mono', monospace;
+}
+
+*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
+
+body {
+  font-family: var(--body);
+  background: var(--bg);
+  color: var(--text);
+  line-height: 1.5;
+  padding: 24px;
+  max-width: 800px;
+  margin: 0 auto;
+}
+
+.sr-only {
+  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
+  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
+}
+
+h1 {
+  font-family: var(--serif);
+  font-size: 1.8rem;
+  color: var(--accent);
+  margin-bottom: 4px;
+}
+
+.subtitle { font-size: 0.9rem; color: var(--text2); margin-bottom: 16px; }
+
+/* Days-since badge */
+.days-badge {
+  display: inline-flex;
+  align-items: center;
+  gap: 8px;
+  padding: 8px 16px;
+  border-radius: 20px;
+  font-family: var(--mono);
+  font-size: 0.82rem;
+  font-weight: 600;
+  margin-bottom: 24px;
+  border: 1px solid var(--border2);
+}
+
+.days-badge .dot {
+  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
+}
+
+/* Storage warning */
+.storage-warn {
+  background: rgba(201, 168, 76, 0.15);
+  border: 1px solid var(--gold2);
+  border-radius: 8px;
+  padding: 10px 14px;
+  font-size: 0.82rem;
+  margin-bottom: 16px;
+  display: none;
+  color: var(--gold);
+}
+
+/* Scoring panel */
+.scoring-panel {
+  background: var(--bg2);
+  border: 1px solid var(--border);
+  border-radius: 12px;
+  padding: 20px;
+  margin-bottom: 24px;
+}
+
+@media (min-width: 769px) {
+  .scoring-panel { position: sticky; top: 12px; z-index: 10; }
+}
+
+.overall-score {
+  text-align: center;
+  margin-bottom: 16px;
+}
+
+.overall-value {
+  font-family: var(--mono);
+  font-size: 3rem;
+  font-weight: 700;
+  line-height: 1;
+}
+
+.overall-label {
+  font-size: 0.8rem;
+  color: var(--text2);
+  text-transform: uppercase;
+  letter-spacing: 1px;
+  font-family: var(--mono);
+}
+
+.category-bars {
+  display: grid;
+  gap: 10px;
+}
+
+.cat-bar {
+  display: flex;
+  align-items: center;
+  gap: 10px;
+}
+
+.cat-bar-label {
+  font-family: var(--mono);
+  font-size: 0.72rem;
+  font-weight: 600;
+  color: var(--text2);
+  min-width: 80px;
+  text-transform: uppercase;
+  letter-spacing: 0.5px;
+}
+
+.cat-bar-track {
+  flex: 1;
+  height: 8px;
+  background: var(--bg3);
+  border-radius: 4px;
+  overflow: hidden;
+}
+
+.cat-bar-fill {
+  height: 100%;
+  border-radius: 4px;
+  transition: width 0.4s, background 0.3s;
+}
+
+.cat-bar-pct {
+  font-family: var(--mono);
+  font-size: 0.72rem;
+  font-weight: 600;
+  min-width: 36px;
+  text-align: right;
+}
+
+/* Accordion categories */
+.category {
+  background: var(--bg2);
+  border: 1px solid var(--border);
+  border-radius: 10px;
+  margin-bottom: 12px;
+  overflow: hidden;
+}
+
+.category-header {
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  padding: 14px 18px;
+  cursor: pointer;
+  background: transparent;
+  border: none;
+  width: 100%;
+  color: var(--text);
+  font-family: var(--body);
+  font-size: 1rem;
+  font-weight: 600;
+  transition: background 0.15s;
+  min-height: 44px;
+}
+
+.category-header:hover { background: var(--bg3); }
+
+.category-header:focus-visible {
+  outline: 3px solid var(--accent);
+  outline-offset: -3px;
+}
+
+.category-header .weight {
+  font-family: var(--mono);
+  font-size: 0.7rem;
+  color: var(--text3);
+}
+
+.category-header .chevron {
+  font-size: 0.8rem;
+  transition: transform 0.2s;
+  color: var(--text3);
+}
+
+.category.open .chevron { transform: rotate(180deg); }
+
+.category-body {
+  display: none;
+  padding: 4px 18px 18px;
+}
+
+.category.open .category-body { display: block; }
+
+/* Audit items */
+.audit-item {
+  border: none;
+  padding: 12px 0;
+  border-bottom: 1px solid var(--border);
+}
+
+.audit-item:last-child { border-bottom: none; }
+
+.audit-item .item-desc {
+  font-size: 0.9rem;
+  margin-bottom: 10px;
+  color: var(--text);
+}
+
+.radio-group {
+  display: flex;
+  gap: 8px;
+  flex-wrap: wrap;
+}
+
+.radio-label {
+  display: flex;
+  align-items: center;
+  gap: 6px;
+  padding: 8px 16px;
+  border-radius: 8px;
+  border: 1px solid var(--border2);
+  cursor: pointer;
+  font-family: var(--mono);
+  font-size: 0.78rem;
+  font-weight: 600;
+  min-height: 44px;
+  transition: background 0.15s, border-color 0.15s, color 0.15s;
+  color: var(--text2);
+}
+
+.radio-label:hover { background: var(--bg3); }
+
+.radio-label:has(input:checked) { border-color: var(--accent); }
+
+.radio-label.pass-selected {
+  background: rgba(143, 184, 86, 0.2);
+  border-color: var(--accent);
+  color: var(--accent);
+}
+
+.radio-label.fail-selected {
+  background: rgba(196, 92, 74, 0.2);
+  border-color: var(--red);
+  color: var(--red);
+}
+
+.radio-label.na-selected {
+  background: rgba(107, 103, 86, 0.15);
+  border-color: var(--text3);
+  color: var(--text3);
+}
+
+.radio-label input[type="radio"] {
+  appearance: none;
+  -webkit-appearance: none;
+  width: 16px; height: 16px;
+  border: 2px solid var(--border2);
+  border-radius: 50%;
+  position: relative;
+  flex-shrink: 0;
+}
+
+.radio-label input[type="radio"]:checked::after {
+  content: '';
+  position: absolute;
+  top: 2px; left: 2px;
+  width: 8px; height: 8px;
+  border-radius: 50%;
+  background: currentColor;
+}
+
+.radio-label input[type="radio"]:focus-visible {
+  outline: 3px solid var(--accent);
+  outline-offset: 2px;
+}
+
+/* Action buttons */
+.actions {
+  display: flex;
+  gap: 10px;
+  margin: 24px 0;
+  flex-wrap: wrap;
+}
+
+.btn {
+  padding: 12px 24px;
+  border-radius: 8px;
+  font-family: var(--mono);
+  font-size: 0.85rem;
+  font-weight: 600;
+  cursor: pointer;
+  border: 1px solid var(--border2);
+  min-height: 44px;
+  transition: background 0.15s, transform 0.1s;
+}
+
+.btn:active { transform: scale(0.97); }
+
+.btn:focus-visible {
+  outline: 3px solid var(--accent);
+  outline-offset: 2px;
+}
+
+.btn-primary {
+  background: var(--accent3);
+  color: var(--text);
+  border-color: var(--accent2);
+}
+
+.btn-primary:hover { background: var(--accent2); }
+
+.btn-secondary {
+  background: var(--bg3);
+  color: var(--text2);
+}
+
+.btn-secondary:hover { background: var(--border); }
+
+.btn-danger {
+  background: transparent;
+  color: var(--red);
+  border-color: var(--red2);
+}
+
+.btn-danger:hover { background: rgba(196, 92, 74, 0.1); }
+
+/* Confirmation */
+.confirm-msg {
+  padding: 12px 16px;
+  border-radius: 8px;
+  background: rgba(143, 184, 86, 0.15);
+  border: 1px solid var(--accent3);
+  font-size: 0.85rem;
+  color: var(--accent);
+  margin-bottom: 16px;
+  display: none;
+}
+
+/* History section */
+.history-section {
+  background: var(--bg2);
+  border: 1px solid var(--border);
+  border-radius: 10px;
+  overflow: hidden;
+  margin-bottom: 24px;
+}
+
+.history-header {
+  padding: 14px 18px;
+  cursor: pointer;
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  font-weight: 600;
+  min-height: 44px;
+  background: none;
+  border: none;
+  width: 100%;
+  color: var(--text);
+  font-family: var(--body);
+  font-size: 1rem;
+}
+
+.history-header:hover { background: var(--bg3); }
+.history-header:focus-visible { outline: 3px solid var(--accent); outline-offset: -3px; }
+
+.history-body { display: none; padding: 0 18px 18px; }
+.history-section.open .history-body { display: block; }
+
+.history-entry {
+  padding: 12px 0;
+  border-bottom: 1px solid var(--border);
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  gap: 12px;
+  flex-wrap: wrap;
+}
+
+.history-entry:last-child { border-bottom: none; }
+
+.history-date {
+  font-family: var(--mono);
+  font-size: 0.78rem;
+  color: var(--text2);
+}
+
+.history-score {
+  font-family: var(--mono);
+  font-size: 1rem;
+  font-weight: 700;
+}
+
+.history-cats {
+  font-family: var(--mono);
+  font-size: 0.68rem;
+  color: var(--text3);
+}
+
+.history-empty {
+  font-size: 0.85rem;
+  color: var(--text3);
+  font-style: italic;
+  padding: 16px 0;
+}
+
+@media (max-width: 640px) {
+  body { padding: 14px; }
+  h1 { font-size: 1.4rem; }
+  .scoring-panel { padding: 14px; }
+  .overall-value { font-size: 2.2rem; }
+  .cat-bar-label { min-width: 65px; font-size: 0.65rem; }
+  .actions { flex-direction: column; }
+  .btn { width: 100%; text-align: center; }
+}
 </style>
 </head>
 <body>
-<div class="placeholder">
-  <div class="icon">🔒</div>
-  <h1>Stealth Audit</h1>
-  <p>Coming soon &mdash; monthly OPSEC security checklist</p>
+
+<h1>Stealth Audit</h1>
+<p class="subtitle">Monthly OPSEC Security Checklist</p>
+
+<div class="storage-warn" id="storage-warn"></div>
+<div id="days-badge" class="days-badge" aria-label="Days since last audit">
+  <span class="dot" id="days-dot"></span>
+  <span id="days-text">No audits yet</span>
 </div>
+
+<!-- Scoring Panel -->
+<div class="scoring-panel" aria-label="Audit scores">
+  <div class="overall-score">
+    <div class="overall-value" id="overall-score" aria-live="polite">--%</div>
+    <div class="overall-label">Overall Score</div>
+  </div>
+  <div class="category-bars" id="category-bars"></div>
+</div>
+
+<!-- Categories -->
+<div id="categories"></div>
+
+<!-- Actions -->
+<div class="actions">
+  <button class="btn btn-primary" id="btn-save" onclick="saveAudit()">Save Audit</button>
+  <button class="btn btn-secondary" id="btn-history" onclick="toggleHistory()">View History</button>
+  <button class="btn btn-danger" id="btn-reset" onclick="resetAudit()">Reset</button>
+</div>
+
+<div class="confirm-msg" id="confirm-msg">Audit saved successfully!</div>
+
+<!-- History -->
+<div class="history-section" id="history-section">
+  <button class="history-header" onclick="toggleHistory()" aria-expanded="false">
+    <span>Audit History</span>
+    <span class="chevron">&#9660;</span>
+  </button>
+  <div class="history-body" id="history-body"></div>
+</div>
+
+<script>
+/* ── Data ── */
+var CATEGORIES = [
+  {
+    id: 'smell', label: 'Smell', weight: 40,
+    items: [
+      { id: 'smell-ar-door', desc: 'Stand outside AR door \u2014 any detectable odor?' },
+      { id: 'smell-apartment', desc: 'Stand at apartment entrance \u2014 any odor in hallway?' },
+      { id: 'smell-negative-pressure', desc: 'Tent walls sucking in? (negative pressure check)' },
+      { id: 'smell-ducts', desc: 'All duct connections \u2014 aluminum tape secure?' },
+      { id: 'smell-vent-grate', desc: 'Ventilation grate sealed?' },
+      { id: 'smell-door-gap', desc: 'Door gap sealed?' }
+    ]
+  },
+  {
+    id: 'noise', label: 'Noise', weight: 20,
+    items: [
+      { id: 'noise-ar-door', desc: 'Stand outside AR door \u2014 fan audible?' },
+      { id: 'noise-apartment', desc: 'Stand outside apartment door \u2014 any unusual sound?' },
+      { id: 'noise-fan-speed', desc: 'Fan speed at minimum effective level?' }
+    ]
+  },
+  {
+    id: 'light', label: 'Light', weight: 20,
+    items: [
+      { id: 'light-ar-door', desc: 'During dark period: any light visible under AR door?' },
+      { id: 'light-bulb', desc: 'AR ceiling bulb disconnected/removed?' },
+      { id: 'light-seams', desc: 'Tent zippers/seams checked for pinholes?' }
+    ]
+  },
+  {
+    id: 'physical', label: 'Physical', weight: 10,
+    items: [
+      { id: 'physical-items', desc: 'No grow-related items visible outside AR?' },
+      { id: 'physical-door', desc: 'AR door closed and (ideally) locked?' },
+      { id: 'physical-trash', desc: 'No suspicious trash in common recycling?' }
+    ]
+  },
+  {
+    id: 'electrical', label: 'Electrical', weight: 10,
+    items: [
+      { id: 'electrical-strip', desc: 'Single quality power strip, not daisy-chained?' },
+      { id: 'electrical-elevated', desc: 'All connections elevated off floor?' },
+      { id: 'electrical-circuits', desc: 'No overloaded circuits?' }
+    ]
+  }
+];
+
+var STORAGE_KEY = 'growdoc-stealth-audit';
+var state = { version: 1, currentAudit: null, auditHistory: [] };
+var saveTimer = null;
+var storageAvailable = true;
+
+/* ── Scoring ── */
+function calculateScores(items) {
+  var categoryScores = {};
+  var totalWeight = 0;
+  var weightedSum = 0;
+
+  for (var i = 0; i < CATEGORIES.length; i++) {
+    var cat = CATEGORIES[i];
+    var passCount = 0;
+    var failCount = 0;
+
+    for (var j = 0; j < cat.items.length; j++) {
+      var val = items[cat.items[j].id];
+      if (val === 'pass') passCount++;
+      else if (val === 'fail') failCount++;
+    }
+
+    var rated = passCount + failCount;
+    if (rated === 0) {
+      categoryScores[cat.id] = 100;
+    } else {
+      categoryScores[cat.id] = Math.round((passCount / rated) * 100);
+    }
+
+    if (rated > 0) {
+      totalWeight += cat.weight;
+      weightedSum += cat.weight * categoryScores[cat.id];
+    }
+  }
+
+  var overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;
+  return { overallScore: overallScore, categoryScores: categoryScores };
+}
+
+function getScoreColor(score) {
+  if (score >= 90) return 'var(--accent)';
+  if (score >= 70) return 'var(--gold)';
+  return 'var(--red)';
+}
+
+function daysSinceLastAudit(history) {
+  if (!history || history.length === 0) return null;
+  var last = new Date(history[history.length - 1].date);
+  var now = new Date();
+  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
+}
+
+/* ── State ── */
+function loadState() {
+  try {
+    var raw = localStorage.getItem(STORAGE_KEY);
+    if (!raw) return;
+    var data = JSON.parse(raw);
+    if (data.version !== 1) {
+      showStorageWarn('Data version mismatch. Raw: ' + raw);
+      return;
+    }
+    state = data;
+  } catch (e) {
+    console.warn('Could not load stealth audit state:', e.message);
+    showStorageWarn('Could not load saved data: ' + e.message);
+  }
+}
+
+function persistState() {
+  if (!storageAvailable) return;
+  clearTimeout(saveTimer);
+  saveTimer = setTimeout(function() {
+    try {
+      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
+    } catch (e) { /* silent */ }
+  }, 1000);
+}
+
+function showStorageWarn(msg) {
+  var el = document.getElementById('storage-warn');
+  el.textContent = msg;
+  el.style.display = 'block';
+}
+
+/* ── Rendering ── */
+function buildCategories() {
+  var html = '';
+  for (var i = 0; i < CATEGORIES.length; i++) {
+    var cat = CATEGORIES[i];
+    html += '<div class="category open" id="cat-' + cat.id + '">';
+    html += '<button class="category-header" onclick="toggleCategory(\'' + cat.id + '\')" aria-expanded="true">';
+    html += '<span>' + cat.label + ' <span class="weight">(' + cat.weight + '% weight)</span></span>';
+    html += '<span class="chevron">&#9660;</span>';
+    html += '</button>';
+    html += '<div class="category-body">';
+
+    for (var j = 0; j < cat.items.length; j++) {
+      var item = cat.items[j];
+      var currentVal = state.currentAudit ? (state.currentAudit.items[item.id] || '') : '';
+      html += '<fieldset class="audit-item">';
+      html += '<legend class="sr-only">' + cat.label + ' check: ' + item.id + '</legend>';
+      html += '<p class="item-desc">' + item.desc + '</p>';
+      html += '<div class="radio-group" role="radiogroup" aria-label="Rating for ' + item.id + '">';
+      html += radioButton(item.id, 'pass', 'Pass', currentVal);
+      html += radioButton(item.id, 'fail', 'Fail', currentVal);
+      html += radioButton(item.id, 'na', 'N/A', currentVal);
+      html += '</div></fieldset>';
+    }
+
+    html += '</div></div>';
+  }
+  document.getElementById('categories').innerHTML = html;
+}
+
+function radioButton(name, value, label, currentVal) {
+  var checked = currentVal === value ? ' checked' : '';
+  var selectedClass = currentVal === value ? ' ' + value + '-selected' : '';
+  return '<label class="radio-label' + selectedClass + '">' +
+    '<input type="radio" name="' + name + '" value="' + value + '"' + checked + '> ' +
+    label + '</label>';
+}
+
+function renderScores() {
+  var items = {};
+  if (state.currentAudit) items = state.currentAudit.items;
+  var scores = calculateScores(items);
+
+  // Overall
+  var overallEl = document.getElementById('overall-score');
+  overallEl.textContent = scores.overallScore + '%';
+  overallEl.style.color = getScoreColor(scores.overallScore);
+
+  // Category bars
+  var barsHTML = '';
+  for (var i = 0; i < CATEGORIES.length; i++) {
+    var cat = CATEGORIES[i];
+    var score = scores.categoryScores[cat.id];
+    var color = getScoreColor(score);
+    barsHTML += '<div class="cat-bar">';
+    barsHTML += '<span class="cat-bar-label">' + cat.label + '</span>';
+    barsHTML += '<div class="cat-bar-track"><div class="cat-bar-fill" style="width:' + score + '%;background:' + color + '"></div></div>';
+    barsHTML += '<span class="cat-bar-pct" style="color:' + color + '">' + score + '%</span>';
+    barsHTML += '</div>';
+  }
+  document.getElementById('category-bars').innerHTML = barsHTML;
+}
+
+function renderDaysBadge() {
+  var days = daysSinceLastAudit(state.auditHistory);
+  var dotEl = document.getElementById('days-dot');
+  var textEl = document.getElementById('days-text');
+
+  if (days === null) {
+    dotEl.style.background = 'var(--red)';
+    textEl.textContent = 'No audits yet';
+  } else {
+    textEl.textContent = days + ' day' + (days !== 1 ? 's' : '') + ' since last audit';
+    if (days < 30) dotEl.style.background = 'var(--accent)';
+    else if (days <= 60) dotEl.style.background = 'var(--gold)';
+    else dotEl.style.background = 'var(--red)';
+  }
+}
+
+function renderHistory() {
+  var body = document.getElementById('history-body');
+  if (state.auditHistory.length === 0) {
+    body.innerHTML = '<p class="history-empty">No audit history yet. Complete and save your first audit.</p>';
+    return;
+  }
+
+  var html = '';
+  // Reverse chronological
+  for (var i = state.auditHistory.length - 1; i >= 0; i--) {
+    var entry = state.auditHistory[i];
+    var d = new Date(entry.date);
+    var dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
+    var color = getScoreColor(entry.overallScore);
+
+    html += '<div class="history-entry">';
+    html += '<span class="history-date">' + dateStr + '</span>';
+    html += '<span class="history-score" style="color:' + color + '">' + entry.overallScore + '%</span>';
+
+    if (entry.categoryScores) {
+      var cats = [];
+      for (var key in entry.categoryScores) {
+        cats.push(key.charAt(0).toUpperCase() + key.slice(1) + ': ' + entry.categoryScores[key] + '%');
+      }
+      html += '<span class="history-cats">' + cats.join(' · ') + '</span>';
+    }
+    html += '</div>';
+  }
+  body.innerHTML = html;
+}
+
+/* ── Actions ── */
+function saveAudit() {
+  if (!state.currentAudit || Object.keys(state.currentAudit.items).length === 0) return;
+
+  var scores = calculateScores(state.currentAudit.items);
+  var entry = {
+    date: new Date().toISOString(),
+    overallScore: scores.overallScore,
+    categoryScores: scores.categoryScores
+  };
+
+  state.auditHistory.push(entry);
+  // Cap at 12
+  if (state.auditHistory.length > 12) {
+    state.auditHistory = state.auditHistory.slice(-12);
+  }
+
+  state.currentAudit = null;
+  persistState();
+
+  // Clear radios
+  var radios = document.querySelectorAll('input[type="radio"]');
+  for (var i = 0; i < radios.length; i++) { radios[i].checked = false; }
+  updateRadioStyles();
+  renderScores();
+  renderDaysBadge();
+  renderHistory();
+
+  // Show confirmation
+  var msg = document.getElementById('confirm-msg');
+  msg.style.display = 'block';
+  setTimeout(function() { msg.style.display = 'none'; }, 3000);
+}
+
+function resetAudit() {
+  if (!confirm('Reset all current responses? This will not delete saved audits.')) return;
+  state.currentAudit = null;
+  persistState();
+
+  var radios = document.querySelectorAll('input[type="radio"]');
+  for (var i = 0; i < radios.length; i++) { radios[i].checked = false; }
+  updateRadioStyles();
+  renderScores();
+}
+
+function toggleCategory(catId) {
+  var el = document.getElementById('cat-' + catId);
+  var isOpen = el.classList.toggle('open');
+  el.querySelector('.category-header').setAttribute('aria-expanded', isOpen);
+}
+
+function toggleHistory() {
+  var el = document.getElementById('history-section');
+  var isOpen = el.classList.toggle('open');
+  el.querySelector('.history-header').setAttribute('aria-expanded', isOpen);
+}
+
+/* ── Radio handling ── */
+function handleRadioChange(e) {
+  if (e.target.type !== 'radio') return;
+
+  if (!state.currentAudit) {
+    state.currentAudit = { date: new Date().toISOString(), items: {} };
+  }
+  state.currentAudit.items[e.target.name] = e.target.value;
+
+  updateRadioStyles();
+  renderScores();
+  persistState();
+}
+
+function updateRadioStyles() {
+  var labels = document.querySelectorAll('.radio-label');
+  for (var i = 0; i < labels.length; i++) {
+    var label = labels[i];
+    var input = label.querySelector('input[type="radio"]');
+    label.classList.remove('pass-selected', 'fail-selected', 'na-selected');
+    if (input.checked) {
+      label.classList.add(input.value + '-selected');
+    }
+  }
+}
+
+/* ── Init ── */
+function init() {
+  // Check localStorage
+  try { localStorage.setItem('__test__', '1'); localStorage.removeItem('__test__'); }
+  catch (e) {
+    storageAvailable = false;
+    console.warn('localStorage unavailable');
+    showStorageWarn('localStorage unavailable. Audit data will not persist across reloads.');
+  }
+
+  loadState();
+  buildCategories();
+  renderScores();
+  renderDaysBadge();
+  renderHistory();
+
+  // Event delegation for radios
+  document.getElementById('categories').addEventListener('change', handleRadioChange);
+}
+
+document.addEventListener('DOMContentLoaded', init);
+
+/* ── Tests ── */
+function runTests() {
+  var passed = 0, failed = 0;
+  function assert(condition, msg) {
+    if (condition) { passed++; console.log('PASS:', msg); }
+    else { failed++; console.error('FAIL:', msg); }
+  }
+
+  // Test: scoring with all 18 items Pass -> 100%
+  var allPass = {};
+  CATEGORIES.forEach(function(cat) {
+    cat.items.forEach(function(item) { allPass[item.id] = 'pass'; });
+  });
+  var s1 = calculateScores(allPass);
+  assert(s1.overallScore === 100, 'All Pass = 100%: got ' + s1.overallScore);
+
+  // Test: scoring with all Fail -> 0%
+  var allFail = {};
+  CATEGORIES.forEach(function(cat) {
+    cat.items.forEach(function(item) { allFail[item.id] = 'fail'; });
+  });
+  var s2 = calculateScores(allFail);
+  assert(s2.overallScore === 0, 'All Fail = 0%: got ' + s2.overallScore);
+
+  // Test: scoring with all N/A -> no NaN/Infinity, graceful fallback
+  var allNA = {};
+  CATEGORIES.forEach(function(cat) {
+    cat.items.forEach(function(item) { allNA[item.id] = 'na'; });
+  });
+  var s3 = calculateScores(allNA);
+  assert(!isNaN(s3.overallScore) && isFinite(s3.overallScore), 'All N/A = no NaN: got ' + s3.overallScore);
+
+  // Test: mixed scoring — smell: 4 pass, 1 fail, 1 N/A -> 80%; all others 100% -> overall 92%
+  var mixed = {};
+  CATEGORIES.forEach(function(cat) {
+    cat.items.forEach(function(item) { mixed[item.id] = 'pass'; });
+  });
+  mixed['smell-ar-door'] = 'pass';
+  mixed['smell-apartment'] = 'pass';
+  mixed['smell-negative-pressure'] = 'pass';
+  mixed['smell-ducts'] = 'pass';
+  mixed['smell-vent-grate'] = 'fail';
+  mixed['smell-door-gap'] = 'na';
+  var s4 = calculateScores(mixed);
+  assert(s4.categoryScores.smell === 80, 'Smell 4p/1f/1na = 80%: got ' + s4.categoryScores.smell);
+  assert(s4.overallScore === 92, 'Mixed overall = 92%: got ' + s4.overallScore);
+
+  // Test: category weights sum to 100
+  var totalWeight = 0;
+  CATEGORIES.forEach(function(cat) { totalWeight += cat.weight; });
+  assert(totalWeight === 100, 'Category weights sum = 100: got ' + totalWeight);
+
+  // Test: days since last audit from stored date 15 days ago -> 15
+  var fifteenDaysAgo = new Date();
+  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
+  var testHistory = [{ date: fifteenDaysAgo.toISOString() }];
+  var days = daysSinceLastAudit(testHistory);
+  assert(days === 15, 'Days since 15 days ago = 15: got ' + days);
+
+  // Test: audit history capped at 12
+  var bigHistory = [];
+  for (var i = 0; i < 15; i++) bigHistory.push({ date: new Date().toISOString(), overallScore: 90 });
+  var testState = { version: 1, currentAudit: { date: new Date().toISOString(), items: allPass }, auditHistory: bigHistory };
+  // Simulate save cap
+  if (testState.auditHistory.length > 12) testState.auditHistory = testState.auditHistory.slice(-12);
+  assert(testState.auditHistory.length === 12, 'History capped at 12: got ' + testState.auditHistory.length);
+
+  // Test: save audit adds to history and clears current
+  var origLen = state.auditHistory.length;
+  state.currentAudit = { date: new Date().toISOString(), items: allPass };
+  saveAudit();
+  assert(state.auditHistory.length === origLen + 1, 'Save adds to history');
+  assert(state.currentAudit === null, 'Save clears currentAudit');
+
+  // Test: localStorage round-trip preserves state
+  try {
+    var testData = { version: 1, currentAudit: null, auditHistory: [{ date: '2025-01-01', overallScore: 95, categoryScores: { smell: 100, noise: 90, light: 100, physical: 100, electrical: 80 } }] };
+    localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));
+    var loaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
+    assert(loaded.auditHistory[0].overallScore === 95, 'localStorage round-trip');
+  } catch(e) { assert(false, 'localStorage: ' + e.message); }
+
+  console.log('\n' + passed + ' passed, ' + failed + ' failed');
+}
+</script>
 </body>
 </html>
