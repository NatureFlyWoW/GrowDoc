diff --git a/docs/tool-env-dashboard.html b/docs/tool-env-dashboard.html
index 6171226..e8cb7be 100644
--- a/docs/tool-env-dashboard.html
+++ b/docs/tool-env-dashboard.html
@@ -3,20 +3,848 @@
 <head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
-<title>Environment Dashboard</title>
+<title>Environment Dashboard — GrowDoc</title>
+<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Serif+4:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
 <style>
-  body { font-family: Georgia, serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f0e8; color: #4a3728; }
-  .placeholder { text-align: center; }
-  .placeholder .icon { font-size: 3rem; }
-  .placeholder h1 { font-size: 1.3rem; margin: 12px 0 4px; }
-  .placeholder p { font-size: 0.9rem; color: #6b5540; }
+:root {
+  --bg: #f5f0e8;
+  --surface: #fff;
+  --border: #d4c4a0;
+  --green-dark: #2d5016;
+  --green-mid: #4a7c23;
+  --green-light: #6da544;
+  --gold: #c8a415;
+  --red: #c0392b;
+  --text-dark: #4a3728;
+  --text-muted: #6b5540;
+  --accent: #4a7c23;
+  --font-display: 'DM Serif Display', Georgia, serif;
+  --font-body: 'Source Serif 4', Georgia, serif;
+  --font-mono: 'IBM Plex Mono', monospace;
+}
+
+*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
+
+body {
+  font-family: var(--font-body);
+  background: var(--bg);
+  color: var(--text-dark);
+  line-height: 1.5;
+  padding: 24px;
+  max-width: 900px;
+  margin: 0 auto;
+}
+
+h1 {
+  font-family: var(--font-display);
+  font-size: 1.8rem;
+  color: var(--green-dark);
+  margin-bottom: 4px;
+}
+
+.subtitle {
+  font-size: 0.9rem;
+  color: var(--text-muted);
+  margin-bottom: 20px;
+}
+
+/* Health summary badges */
+.health-summary {
+  display: flex;
+  gap: 12px;
+  margin-bottom: 24px;
+  flex-wrap: wrap;
+}
+
+.health-badge {
+  display: flex;
+  align-items: center;
+  gap: 8px;
+  padding: 10px 16px;
+  border-radius: 10px;
+  background: var(--surface);
+  border: 1px solid var(--border);
+  font-size: 0.85rem;
+  font-weight: 600;
+  min-width: 180px;
+  transition: border-color 0.3s;
+}
+
+.health-badge .dot {
+  width: 12px;
+  height: 12px;
+  border-radius: 50%;
+  flex-shrink: 0;
+}
+
+/* Sections */
+.calc-section {
+  background: var(--surface);
+  border: 1px solid var(--border);
+  border-radius: 12px;
+  padding: 24px;
+  margin-bottom: 24px;
+}
+
+.calc-section h2 {
+  font-family: var(--font-display);
+  font-size: 1.3rem;
+  color: var(--green-dark);
+  margin-bottom: 16px;
+}
+
+/* Input grid */
+.input-grid {
+  display: grid;
+  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
+  gap: 16px;
+  margin-bottom: 20px;
+}
+
+.input-group {
+  display: flex;
+  flex-direction: column;
+  gap: 4px;
+}
+
+.input-group label {
+  font-size: 0.78rem;
+  font-weight: 600;
+  color: var(--text-muted);
+  text-transform: uppercase;
+  letter-spacing: 0.5px;
+  font-family: var(--font-mono);
+}
+
+.input-group .hint {
+  font-size: 0.72rem;
+  color: var(--text-muted);
+  font-style: italic;
+}
+
+.input-group input,
+.input-group select {
+  padding: 10px 12px;
+  border: 1px solid var(--border);
+  border-radius: 8px;
+  font-size: 1rem;
+  font-family: var(--font-mono);
+  background: var(--bg);
+  color: var(--text-dark);
+  min-height: 44px;
+  transition: border-color 0.2s, box-shadow 0.2s;
+}
+
+.input-group input:focus,
+.input-group select:focus {
+  outline: none;
+  border-color: var(--accent);
+  box-shadow: 0 0 0 3px rgba(74, 124, 35, 0.2);
+}
+
+/* VPD result */
+.vpd-result {
+  display: flex;
+  align-items: center;
+  gap: 16px;
+  padding: 16px 20px;
+  border-radius: 10px;
+  margin-bottom: 20px;
+  transition: background 0.3s;
+}
+
+.vpd-value {
+  font-family: var(--font-mono);
+  font-size: 2.2rem;
+  font-weight: 700;
+  line-height: 1;
+}
+
+.vpd-unit {
+  font-size: 0.9rem;
+  opacity: 0.8;
+}
+
+.vpd-zone {
+  font-size: 1rem;
+  font-weight: 600;
+}
+
+.vpd-advice {
+  font-size: 0.88rem;
+  color: var(--text-muted);
+  padding: 12px 16px;
+  background: var(--bg);
+  border-radius: 8px;
+  margin-bottom: 20px;
+  line-height: 1.5;
+}
+
+/* Pulse animation */
+@keyframes pulse-value {
+  0% { transform: scale(1); }
+  50% { transform: scale(1.05); }
+  100% { transform: scale(1); }
+}
+
+.vpd-value.pulse {
+  animation: pulse-value 0.3s ease-out;
+}
+
+/* Zone colors */
+.zone-optimal { background: rgba(74, 124, 35, 0.15); }
+.zone-acceptable { background: rgba(200, 164, 21, 0.15); }
+.zone-danger { background: rgba(192, 57, 43, 0.15); }
+
+/* VPD Heatmap */
+.vpd-chart-container {
+  overflow-x: auto;
+  -webkit-overflow-scrolling: touch;
+}
+
+.vpd-chart {
+  display: grid;
+  grid-template-columns: 50px repeat(13, 1fr);
+  grid-template-rows: repeat(6, auto);
+  gap: 2px;
+  min-width: 600px;
+  position: relative;
+}
+
+.vpd-header {
+  font-family: var(--font-mono);
+  font-size: 0.68rem;
+  font-weight: 600;
+  color: var(--text-muted);
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  padding: 6px 2px;
+}
+
+.vpd-row-label {
+  font-family: var(--font-mono);
+  font-size: 0.72rem;
+  font-weight: 600;
+  color: var(--text-dark);
+  display: flex;
+  align-items: center;
+  justify-content: flex-end;
+  padding-right: 8px;
+}
+
+.vpd-cell {
+  padding: 8px 2px;
+  text-align: center;
+  font-family: var(--font-mono);
+  font-size: 0.65rem;
+  border-radius: 4px;
+  transition: background 0.3s;
+  position: relative;
+  min-height: 36px;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+}
+
+/* Marker */
+@keyframes pulse-marker {
+  0%, 100% { box-shadow: 0 0 0 0 rgba(74, 124, 35, 0.6); }
+  50% { box-shadow: 0 0 0 6px rgba(74, 124, 35, 0); }
+}
+
+.vpd-marker {
+  position: absolute;
+  width: 14px;
+  height: 14px;
+  border-radius: 50%;
+  background: var(--accent);
+  border: 2px solid var(--surface);
+  z-index: 2;
+  pointer-events: none;
+  animation: pulse-marker 1.5s infinite;
+  transform: translate(-50%, -50%);
+  transition: top 0.3s, left 0.3s;
+}
+
+/* DLI Gauge */
+.dli-result {
+  display: flex;
+  align-items: center;
+  gap: 16px;
+  margin-bottom: 16px;
+}
+
+.dli-value {
+  font-family: var(--font-mono);
+  font-size: 2rem;
+  font-weight: 700;
+  color: var(--green-dark);
+}
+
+.dli-unit {
+  font-size: 0.85rem;
+  color: var(--text-muted);
+}
+
+.gauge-container {
+  margin-bottom: 16px;
+}
+
+.gauge-track {
+  height: 24px;
+  background: #3a2e22;
+  border-radius: 12px;
+  position: relative;
+  overflow: hidden;
+}
+
+.gauge-fill {
+  height: 100%;
+  border-radius: 12px;
+  background: linear-gradient(90deg, var(--red), var(--gold), var(--green-mid));
+  transition: width 0.4s;
+  min-width: 4px;
+}
+
+.gauge-markers {
+  display: flex;
+  justify-content: space-between;
+  padding: 4px 0;
+  font-family: var(--font-mono);
+  font-size: 0.68rem;
+  color: var(--text-muted);
+  position: relative;
+}
+
+.gauge-marker {
+  position: absolute;
+  transform: translateX(-50%);
+}
+
+.dli-advice {
+  font-size: 0.88rem;
+  color: var(--text-muted);
+  padding: 12px 16px;
+  background: var(--bg);
+  border-radius: 8px;
+  line-height: 1.5;
+}
+
+/* Mobile table for chart */
+.vpd-table-mobile {
+  display: none;
+  width: 100%;
+  border-collapse: collapse;
+  font-family: var(--font-mono);
+  font-size: 0.65rem;
+}
+
+.vpd-table-mobile th,
+.vpd-table-mobile td {
+  padding: 6px 4px;
+  text-align: center;
+  border: 1px solid var(--border);
+}
+
+.vpd-table-mobile th {
+  background: var(--bg);
+  font-weight: 600;
+  color: var(--text-muted);
+}
+
+/* localStorage warning */
+.storage-warn {
+  background: rgba(200, 164, 21, 0.15);
+  border: 1px solid var(--gold);
+  border-radius: 8px;
+  padding: 10px 14px;
+  font-size: 0.82rem;
+  margin-bottom: 16px;
+  display: none;
+}
+
+@media (max-width: 640px) {
+  body { padding: 14px; }
+  h1 { font-size: 1.4rem; }
+  .calc-section { padding: 16px; }
+  .vpd-chart-container { display: none; }
+  .vpd-table-mobile { display: table; }
+  .vpd-value { font-size: 1.8rem; }
+  .dli-value { font-size: 1.6rem; }
+  .health-badge { min-width: unset; flex: 1; }
+}
 </style>
 </head>
 <body>
-<div class="placeholder">
-  <div class="icon">🌡️</div>
-  <h1>Environment Dashboard</h1>
-  <p>Coming soon &mdash; VPD + DLI calculator &amp; chart</p>
+
+<h1>Environment Dashboard</h1>
+<p class="subtitle">VPD + DLI calculator &mdash; real-time grow environment analysis</p>
+
+<div class="storage-warn" id="storage-warn"></div>
+
+<div class="health-summary" aria-label="Environment health overview">
+  <div class="health-badge" id="vpd-badge">
+    <span class="dot" id="vpd-dot"></span>
+    <span>VPD: <strong id="vpd-badge-val">--</strong></span>
+  </div>
+  <div class="health-badge" id="dli-badge">
+    <span class="dot" id="dli-dot"></span>
+    <span>DLI: <strong id="dli-badge-val">--</strong></span>
+  </div>
 </div>
+
+<!-- VPD Section -->
+<div class="calc-section">
+  <h2>VPD Calculator</h2>
+
+  <div class="input-grid">
+    <div class="input-group">
+      <label for="inp-temp">Air Temperature</label>
+      <input type="number" id="inp-temp" min="10" max="45" step="0.5" value="25" aria-describedby="hint-temp">
+      <span class="hint" id="hint-temp">10 &ndash; 45 &deg;C</span>
+    </div>
+    <div class="input-group">
+      <label for="inp-rh">Relative Humidity</label>
+      <input type="number" id="inp-rh" min="10" max="100" step="1" value="60" aria-describedby="hint-rh">
+      <span class="hint" id="hint-rh">10 &ndash; 100 %</span>
+    </div>
+    <div class="input-group">
+      <label for="inp-offset">Leaf Temp Offset</label>
+      <input type="number" id="inp-offset" min="-5" max="5" step="0.5" value="-2" aria-describedby="hint-offset">
+      <span class="hint" id="hint-offset">&minus;5 to +5 &deg;C (LED default: &minus;2)</span>
+    </div>
+    <div class="input-group">
+      <label for="inp-stage">Growth Stage</label>
+      <select id="inp-stage" aria-describedby="hint-stage">
+        <option value="seedling">Seedling / Clone</option>
+        <option value="veg" selected>Veg</option>
+        <option value="early_flower">Early Flower</option>
+        <option value="late_flower">Late Flower</option>
+      </select>
+      <span class="hint" id="hint-stage">Affects optimal VPD zone</span>
+    </div>
+  </div>
+
+  <div class="vpd-result zone-optimal" id="vpd-result" aria-live="polite">
+    <div>
+      <span class="vpd-value" id="vpd-val">0.91</span>
+      <span class="vpd-unit">kPa</span>
+    </div>
+    <span class="vpd-zone" id="vpd-zone-label">Optimal</span>
+  </div>
+
+  <div class="vpd-advice" id="vpd-advice" aria-live="polite"></div>
+
+  <div class="vpd-chart-container">
+    <div class="vpd-chart" id="vpd-chart" role="img" aria-label="VPD heatmap showing values across temperature and humidity ranges">
+      <div class="vpd-marker" id="vpd-marker"></div>
+    </div>
+  </div>
+
+  <table class="vpd-table-mobile" id="vpd-table-mobile" aria-label="VPD values across temperature and humidity">
+    <!-- Generated by JS -->
+  </table>
+</div>
+
+<!-- DLI Section -->
+<div class="calc-section">
+  <h2>DLI Calculator</h2>
+
+  <div class="input-grid">
+    <div class="input-group">
+      <label for="inp-ppfd">PPFD</label>
+      <input type="number" id="inp-ppfd" min="0" max="2000" step="10" value="400" aria-describedby="hint-ppfd">
+      <span class="hint" id="hint-ppfd">0 &ndash; 2000 &mu;mol/m&sup2;/s</span>
+    </div>
+    <div class="input-group">
+      <label for="inp-photoperiod">Photoperiod</label>
+      <input type="number" id="inp-photoperiod" min="1" max="24" step="0.5" value="18" aria-describedby="hint-photo">
+      <span class="hint" id="hint-photo">Hours of light per day</span>
+    </div>
+  </div>
+
+  <div class="dli-result">
+    <span class="dli-value" id="dli-val">25.92</span>
+    <span class="dli-unit">mol/m&sup2;/day</span>
+  </div>
+
+  <div class="gauge-container">
+    <div class="gauge-track">
+      <div class="gauge-fill" id="dli-fill" style="width: 50%"></div>
+    </div>
+    <div class="gauge-markers">
+      <span class="gauge-marker" style="left: 0%">0</span>
+      <span class="gauge-marker" style="left: 25%">15</span>
+      <span class="gauge-marker" style="left: 50%">30</span>
+      <span class="gauge-marker" style="left: 67%">40</span>
+      <span class="gauge-marker" style="left: 83%">50</span>
+      <span class="gauge-marker" style="left: 100%">60</span>
+    </div>
+  </div>
+
+  <div class="dli-advice" id="dli-advice" aria-live="polite"></div>
+</div>
+
+<script>
+/* ── VPD Calculation ── */
+function calcSVP(t) {
+  return 0.6108 * Math.exp((17.27 * t) / (t + 237.3));
+}
+
+function calcVPD(airTemp, rh, leafOffset) {
+  const leafTemp = airTemp + leafOffset;
+  return Math.max(0, calcSVP(leafTemp) - (calcSVP(airTemp) * rh / 100));
+}
+
+/* ── DLI Calculation ── */
+function calcDLI(ppfd, hours) {
+  return ppfd * hours * 0.0036;
+}
+
+/* ── Zone Ranges ── */
+const ZONES = {
+  seedling:     { optimal: [0.4, 0.8], acceptable: [0.3, 1.0] },
+  veg:          { optimal: [0.8, 1.2], acceptable: [0.6, 1.4] },
+  early_flower: { optimal: [1.0, 1.4], acceptable: [0.8, 1.6] },
+  late_flower:  { optimal: [1.2, 1.6], acceptable: [1.0, 1.8] }
+};
+
+const STAGE_PHOTOPERIOD = { seedling: 18, veg: 18, early_flower: 12, late_flower: 12 };
+
+function getZone(vpd, stage) {
+  const z = ZONES[stage] || ZONES.veg;
+  if (vpd >= z.optimal[0] && vpd <= z.optimal[1]) return 'optimal';
+  if (vpd >= z.acceptable[0] && vpd <= z.acceptable[1]) return 'acceptable';
+  return 'danger';
+}
+
+function getZoneColor(zone) {
+  if (zone === 'optimal') return 'rgba(74, 124, 35, 0.35)';
+  if (zone === 'acceptable') return 'rgba(200, 164, 21, 0.3)';
+  return 'rgba(192, 57, 43, 0.25)';
+}
+
+function getZoneDotColor(zone) {
+  if (zone === 'optimal') return '#4a7c23';
+  if (zone === 'acceptable') return '#c8a415';
+  return '#c0392b';
+}
+
+/* ── Chart Setup ── */
+const TEMPS = [15, 20, 25, 30, 35];
+const RHS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
+
+function buildChart(stage) {
+  const chart = document.getElementById('vpd-chart');
+  const marker = document.getElementById('vpd-marker');
+  // Remove old cells but keep marker
+  chart.querySelectorAll('.vpd-header, .vpd-row-label, .vpd-cell').forEach(el => el.remove());
+
+  // Corner cell
+  const corner = document.createElement('div');
+  corner.className = 'vpd-header';
+  corner.textContent = '\u00B0C\\RH';
+  chart.prepend(corner);
+
+  // Column headers (RH)
+  RHS.forEach(rh => {
+    const h = document.createElement('div');
+    h.className = 'vpd-header';
+    h.textContent = rh + '%';
+    chart.insertBefore(h, marker);
+  });
+
+  // Rows
+  TEMPS.forEach(temp => {
+    const label = document.createElement('div');
+    label.className = 'vpd-row-label';
+    label.textContent = temp + '\u00B0C';
+    chart.insertBefore(label, marker);
+
+    RHS.forEach(rh => {
+      const vpd = calcVPD(temp, rh, 0); // offset=0 for chart
+      const zone = getZone(vpd, stage);
+      const cell = document.createElement('div');
+      cell.className = 'vpd-cell';
+      cell.style.background = getZoneColor(zone);
+      cell.textContent = vpd.toFixed(1);
+      cell.dataset.temp = temp;
+      cell.dataset.rh = rh;
+      chart.insertBefore(cell, marker);
+    });
+  });
+
+  // Mobile table
+  buildMobileTable(stage);
+}
+
+function buildMobileTable(stage) {
+  const table = document.getElementById('vpd-table-mobile');
+  let html = '<thead><tr><th>\u00B0C\\RH</th>';
+  RHS.forEach(rh => { html += '<th>' + rh + '%</th>'; });
+  html += '</tr></thead><tbody>';
+  TEMPS.forEach(temp => {
+    html += '<tr><th>' + temp + '\u00B0C</th>';
+    RHS.forEach(rh => {
+      const vpd = calcVPD(temp, rh, 0);
+      const zone = getZone(vpd, stage);
+      html += '<td style="background:' + getZoneColor(zone) + '">' + vpd.toFixed(1) + '</td>';
+    });
+    html += '</tr>';
+  });
+  html += '</tbody>';
+  table.innerHTML = html;
+}
+
+function updateMarker(airTemp, rh) {
+  const marker = document.getElementById('vpd-marker');
+  const chart = document.getElementById('vpd-chart');
+  const cells = chart.querySelectorAll('.vpd-cell');
+  if (cells.length === 0) return;
+
+  // Find nearest cell
+  let nearestTemp = TEMPS.reduce((a, b) => Math.abs(b - airTemp) < Math.abs(a - airTemp) ? b : a);
+  let nearestRH = RHS.reduce((a, b) => Math.abs(b - rh) < Math.abs(a - rh) ? b : a);
+
+  const targetCell = chart.querySelector(`.vpd-cell[data-temp="${nearestTemp}"][data-rh="${nearestRH}"]`);
+  if (!targetCell) return;
+
+  const chartRect = chart.getBoundingClientRect();
+  const cellRect = targetCell.getBoundingClientRect();
+
+  marker.style.top = (cellRect.top - chartRect.top + cellRect.height / 2) + 'px';
+  marker.style.left = (cellRect.left - chartRect.left + cellRect.width / 2) + 'px';
+}
+
+/* ── VPD Advice ── */
+function getVPDAdvice(vpd, zone, stage) {
+  const stageNames = { seedling: 'seedlings/clones', veg: 'vegetative growth', early_flower: 'early flower', late_flower: 'late flower' };
+  const sn = stageNames[stage] || 'this stage';
+
+  if (zone === 'optimal') return 'VPD is in the optimal range for ' + sn + '. Transpiration and nutrient uptake are well balanced.';
+  if (zone === 'acceptable') {
+    if (vpd < ZONES[stage].optimal[0]) return 'VPD is low for ' + sn + '. Consider raising temperature or lowering humidity to increase transpiration.';
+    return 'VPD is slightly high for ' + sn + '. Consider lowering temperature or raising humidity to reduce plant stress.';
+  }
+  if (vpd < ZONES[stage].acceptable[0]) return 'VPD is too low for ' + sn + '. Risk of mold, slow transpiration, and nutrient lockout. Increase temp or decrease RH urgently.';
+  return 'VPD is dangerously high for ' + sn + '. Plants are likely stressed with stomata closing. Lower temp and/or raise RH immediately.';
+}
+
+/* ── DLI Advice ── */
+function getDLIAdvice(dli) {
+  if (dli < 15) return 'DLI is very low. Plants will stretch and yield poorly. Increase light intensity or photoperiod.';
+  if (dli < 25) return 'DLI is moderate. Acceptable for veg but below optimal for flowering. At DLI <30, canopy management matters MORE than watts.';
+  if (dli < 40) return 'DLI is in the sweet spot for cannabis. Good balance of light energy and plant health.';
+  if (dli < 50) return 'DLI is high. Excellent for experienced growers with CO2 supplementation. Watch for light stress without CO2.';
+  return 'DLI is very high. Only sustainable with CO2 enrichment (>1000ppm). Risk of bleaching and light burn without it.';
+}
+
+function getDLIZone(dli) {
+  if (dli < 15) return 'danger';
+  if (dli < 25) return 'acceptable';
+  if (dli < 50) return 'optimal';
+  return 'acceptable';
+}
+
+/* ── State ── */
+const STORAGE_KEY = 'growdoc-env-dashboard';
+let photoperiodManuallySet = false;
+let saveTimer = null;
+let lastVPD = null;
+
+function getInputs() {
+  return {
+    temp: parseFloat(document.getElementById('inp-temp').value) || 25,
+    rh: parseFloat(document.getElementById('inp-rh').value) || 60,
+    offset: parseFloat(document.getElementById('inp-offset').value) || -2,
+    stage: document.getElementById('inp-stage').value || 'veg',
+    ppfd: parseFloat(document.getElementById('inp-ppfd').value) || 400,
+    photoperiod: parseFloat(document.getElementById('inp-photoperiod').value) || 18
+  };
+}
+
+function update() {
+  const inp = getInputs();
+
+  // VPD
+  const vpd = calcVPD(inp.temp, inp.rh, inp.offset);
+  const zone = getZone(vpd, inp.stage);
+  const vpdEl = document.getElementById('vpd-val');
+  const vpdStr = vpd.toFixed(2);
+
+  if (lastVPD !== vpdStr) {
+    vpdEl.textContent = vpdStr;
+    vpdEl.classList.remove('pulse');
+    void vpdEl.offsetWidth; // reflow
+    vpdEl.classList.add('pulse');
+    lastVPD = vpdStr;
+  }
+
+  // Zone styling
+  const resultEl = document.getElementById('vpd-result');
+  resultEl.className = 'vpd-result zone-' + zone;
+  document.getElementById('vpd-zone-label').textContent =
+    zone === 'optimal' ? 'Optimal' : zone === 'acceptable' ? 'Acceptable' : 'Danger';
+
+  // Advice
+  document.getElementById('vpd-advice').textContent = getVPDAdvice(vpd, zone, inp.stage);
+
+  // Badge
+  document.getElementById('vpd-badge-val').textContent = vpdStr + ' kPa';
+  document.getElementById('vpd-dot').style.background = getZoneDotColor(zone);
+  document.getElementById('vpd-badge').style.borderColor = getZoneDotColor(zone);
+
+  // Marker
+  updateMarker(inp.temp, inp.rh);
+
+  // DLI
+  const dli = calcDLI(inp.ppfd, inp.photoperiod);
+  const dliZone = getDLIZone(dli);
+  document.getElementById('dli-val').textContent = dli.toFixed(2);
+  document.getElementById('dli-advice').textContent = getDLIAdvice(dli);
+
+  // Gauge fill (max 60 DLI for scale)
+  const pct = Math.min(100, (dli / 60) * 100);
+  document.getElementById('dli-fill').style.width = pct + '%';
+
+  // DLI badge
+  document.getElementById('dli-badge-val').textContent = dli.toFixed(1) + ' mol';
+  document.getElementById('dli-dot').style.background = getZoneDotColor(dliZone);
+  document.getElementById('dli-badge').style.borderColor = getZoneDotColor(dliZone);
+
+  // Save
+  scheduleSave(inp);
+}
+
+/* ── localStorage ── */
+function loadState() {
+  try {
+    const raw = localStorage.getItem(STORAGE_KEY);
+    if (!raw) return;
+    const data = JSON.parse(raw);
+    if (data.version !== 1) {
+      showStorageWarn('Stored data version mismatch. Using defaults. Raw: ' + raw);
+      return;
+    }
+    const li = data.lastInputs;
+    if (li.temp != null) document.getElementById('inp-temp').value = li.temp;
+    if (li.rh != null) document.getElementById('inp-rh').value = li.rh;
+    if (li.offset != null) document.getElementById('inp-offset').value = li.offset;
+    if (li.stage) document.getElementById('inp-stage').value = li.stage;
+    if (li.ppfd != null) document.getElementById('inp-ppfd').value = li.ppfd;
+    if (li.photoperiod != null) {
+      document.getElementById('inp-photoperiod').value = li.photoperiod;
+      photoperiodManuallySet = true; // Respect saved value
+    }
+  } catch (e) {
+    showStorageWarn('Could not load saved inputs: ' + e.message);
+  }
+}
+
+function scheduleSave(inp) {
+  clearTimeout(saveTimer);
+  saveTimer = setTimeout(function() {
+    try {
+      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, lastInputs: inp }));
+    } catch (e) { /* silent */ }
+  }, 1000);
+}
+
+function showStorageWarn(msg) {
+  const el = document.getElementById('storage-warn');
+  el.textContent = msg;
+  el.style.display = 'block';
+}
+
+/* ── Init ── */
+let currentStage = 'veg';
+
+function init() {
+  // Check localStorage
+  try { localStorage.setItem('__test__', '1'); localStorage.removeItem('__test__'); }
+  catch (e) { showStorageWarn('localStorage unavailable. Inputs will not persist across reloads.'); }
+
+  loadState();
+  currentStage = document.getElementById('inp-stage').value;
+  buildChart(currentStage);
+  update();
+
+  // Input listeners
+  ['inp-temp', 'inp-rh', 'inp-offset', 'inp-ppfd'].forEach(function(id) {
+    document.getElementById(id).addEventListener('input', update);
+  });
+
+  document.getElementById('inp-photoperiod').addEventListener('input', function() {
+    photoperiodManuallySet = true;
+    update();
+  });
+
+  document.getElementById('inp-stage').addEventListener('change', function() {
+    const stage = this.value;
+    if (stage !== currentStage) {
+      currentStage = stage;
+      buildChart(stage);
+      // Auto-set photoperiod if not manually set
+      if (!photoperiodManuallySet) {
+        document.getElementById('inp-photoperiod').value = STAGE_PHOTOPERIOD[stage] || 18;
+      }
+    }
+    update();
+  });
+}
+
+document.addEventListener('DOMContentLoaded', init);
+
+/* ── Tests ── */
+function runTests() {
+  let pass = 0, fail = 0;
+  function assert(condition, msg) {
+    if (condition) { pass++; console.log('PASS: ' + msg); }
+    else { fail++; console.error('FAIL: ' + msg); }
+  }
+
+  // VPD at 25C, 60% RH, -2 offset
+  const vpd1 = calcVPD(25, 60, -2);
+  assert(Math.abs(vpd1 - 0.91) < 0.05, 'VPD at 25C/60%/-2 offset ~ 0.91');
+
+  // VPD at 20C, 50% RH, 0 offset
+  const vpd2 = calcVPD(20, 50, 0);
+  assert(Math.abs(vpd2 - 1.17) < 0.05, 'VPD at 20C/50%/0 offset ~ 1.17');
+
+  // Edge: near 0C, 100% RH
+  assert(calcVPD(1, 100, 0) < 0.05, 'VPD near 0 at ~0C/100%RH');
+
+  // Edge: 45C, 10% RH
+  assert(calcVPD(45, 10, -2) > 5, 'VPD high at 45C/10%RH');
+
+  // DLI: 400 PPFD x 18h
+  assert(Math.abs(calcDLI(400, 18) - 25.92) < 0.01, 'DLI 400*18 = 25.92');
+
+  // DLI: 600 PPFD x 12h
+  assert(Math.abs(calcDLI(600, 12) - 25.92) < 0.01, 'DLI 600*12 = 25.92');
+
+  // Zone classification
+  assert(getZone(0.6, 'seedling') === 'optimal', '0.6 optimal for seedling');
+  assert(getZone(1.0, 'veg') === 'optimal', '1.0 optimal for veg');
+  assert(getZone(2.0, 'veg') === 'danger', '2.0 danger for veg');
+
+  // Chart has 65 cells
+  assert(document.querySelectorAll('.vpd-cell').length === 65, '65 VPD cells');
+
+  // Position marker exists
+  assert(document.querySelector('.vpd-marker') !== null, 'Marker exists');
+
+  // localStorage round-trip
+  try {
+    const td = { version: 1, lastInputs: { temp: 25, rh: 60, offset: -2, stage: 'veg', ppfd: 400, photoperiod: 18 } };
+    localStorage.setItem('growdoc-env-dashboard', JSON.stringify(td));
+    const loaded = JSON.parse(localStorage.getItem('growdoc-env-dashboard'));
+    assert(loaded.lastInputs.temp === 25, 'localStorage round-trip');
+  } catch(e) { assert(false, 'localStorage: ' + e.message); }
+
+  console.log('--- ' + pass + ' passed, ' + fail + ' failed ---');
+}
+</script>
 </body>
 </html>
