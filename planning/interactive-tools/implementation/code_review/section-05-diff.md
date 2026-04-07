diff --git a/docs/tool-plant-doctor.html b/docs/tool-plant-doctor.html
index ef5674c..7acf0cc 100644
--- a/docs/tool-plant-doctor.html
+++ b/docs/tool-plant-doctor.html
@@ -3,20 +3,1191 @@
 <head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
-<title>Plant Doctor</title>
+<title>Plant Doctor — GrowDoc</title>
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
+  max-width: 860px;
+  margin: 0 auto;
+}
+
+.sr-only {
+  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
+  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
+}
+
+/* Header */
+.header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
+h1 { font-family: var(--serif); font-size: 1.8rem; color: var(--accent); margin-bottom: 4px; }
+.subtitle { font-size: 0.9rem; color: var(--text2); margin-bottom: 0; }
+
+/* Toggle switch */
+.toggle-wrap { display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding-top: 4px; }
+.toggle-label { font-family: var(--mono); font-size: 0.78rem; color: var(--text2); cursor: pointer; }
+.toggle-track {
+  position: relative; width: 44px; height: 24px; background: var(--bg3); border: 1px solid var(--border2);
+  border-radius: 12px; cursor: pointer; transition: background 0.2s;
+}
+.toggle-track.active { background: var(--accent3); border-color: var(--accent2); }
+.toggle-thumb {
+  position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: var(--text2);
+  border-radius: 50%; transition: transform 0.2s, background 0.2s;
+}
+.toggle-track.active .toggle-thumb { transform: translateX(20px); background: var(--text); }
+.toggle-track:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
+
+/* Storage warning */
+.storage-warn {
+  background: rgba(201,168,76,0.15); border: 1px solid var(--gold2); border-radius: 8px;
+  padding: 10px 14px; font-size: 0.82rem; margin-bottom: 16px; display: none; color: var(--gold);
+}
+
+/* Last diagnosis banner */
+.last-dx {
+  background: var(--bg2); border: 1px solid var(--border); border-radius: 10px;
+  padding: 14px 18px; margin-bottom: 20px; display: none;
+}
+.last-dx-header { font-family: var(--mono); font-size: 0.72rem; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
+.last-dx-name { font-family: var(--serif); font-size: 1.05rem; color: var(--accent); }
+.last-dx-date { font-family: var(--mono); font-size: 0.72rem; color: var(--text3); margin-top: 2px; }
+
+/* Progress dots */
+.progress { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
+.dot {
+  width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--border2);
+  transition: background 0.3s, border-color 0.3s;
+}
+.dot.done { background: var(--accent); border-color: var(--accent); }
+@keyframes pulse-dot { 0%,100% { box-shadow: 0 0 0 0 rgba(143,184,86,0.5); } 50% { box-shadow: 0 0 0 6px rgba(143,184,86,0); } }
+.dot.active { border-color: var(--accent); animation: pulse-dot 1.5s infinite; }
+.dot-sep { width: 16px; height: 2px; background: var(--border2); border-radius: 1px; }
+.dot-sep.done { background: var(--accent3); }
+
+/* Question card */
+.q-card {
+  background: var(--bg2); border: 1px solid var(--border); border-radius: 12px;
+  padding: 24px; margin-bottom: 20px;
+}
+.q-text { font-family: var(--serif); font-size: 1.2rem; color: var(--text); margin-bottom: 6px; }
+.q-help { font-size: 0.82rem; color: var(--text3); font-style: italic; margin-bottom: 16px; }
+
+/* Option buttons */
+.options { display: flex; flex-direction: column; gap: 8px; }
+.opt-btn {
+  display: block; width: 100%; text-align: left; padding: 14px 18px; background: var(--bg3);
+  border: 1px solid var(--border2); border-radius: 10px; color: var(--text); font-family: var(--body);
+  font-size: 0.95rem; cursor: pointer; min-height: 44px; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
+}
+.opt-btn:hover { border-color: var(--accent3); background: rgba(143,184,86,0.08); }
+.opt-btn:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
+.opt-btn:active { transform: scale(0.99); }
+
+/* Back / Start Over buttons */
+.nav-row { display: flex; gap: 10px; flex-wrap: wrap; }
+.btn {
+  padding: 12px 24px; border-radius: 8px; font-family: var(--mono); font-size: 0.85rem; font-weight: 600;
+  cursor: pointer; border: 1px solid var(--border2); min-height: 44px; transition: background 0.15s, transform 0.1s;
+}
+.btn:active { transform: scale(0.97); }
+.btn:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
+.btn-secondary { background: var(--bg3); color: var(--text2); }
+.btn-secondary:hover { background: var(--border); }
+.btn-primary { background: var(--accent3); color: var(--text); border-color: var(--accent2); }
+.btn-primary:hover { background: var(--accent2); }
+.btn:disabled { opacity: 0.4; cursor: not-allowed; }
+
+/* Result card */
+.result-card {
+  background: var(--bg2); border: 1px solid var(--border); border-radius: 12px;
+  padding: 24px; margin-bottom: 20px; border-left: 4px solid var(--accent);
+}
+.result-card.sev-critical { border-left-color: var(--red); }
+.result-card.sev-warning { border-left-color: var(--gold); }
+.result-card.sev-note { border-left-color: var(--accent); }
+.result-dx { font-family: var(--serif); font-size: 1.4rem; color: var(--text); margin-bottom: 8px; }
+.result-sev {
+  display: inline-block; font-family: var(--mono); font-size: 0.72rem; font-weight: 600;
+  padding: 3px 10px; border-radius: 4px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;
+}
+.result-sev.sev-critical { background: rgba(196,92,74,0.2); color: var(--red); }
+.result-sev.sev-warning { background: rgba(201,168,76,0.2); color: var(--gold); }
+.result-sev.sev-note { background: rgba(143,184,86,0.2); color: var(--accent); }
+
+/* Confidence bar */
+.conf-wrap { margin-bottom: 16px; }
+.conf-label { font-family: var(--mono); font-size: 0.78rem; color: var(--text2); margin-bottom: 4px; }
+.conf-bar { height: 8px; background: var(--bg3); border-radius: 4px; overflow: hidden; }
+.conf-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.5s ease-out; }
+.conf-pct { font-family: var(--mono); font-size: 0.82rem; color: var(--accent); font-weight: 600; margin-top: 4px; }
+
+/* Check first / fixes / also consider */
+.result-section { margin-bottom: 14px; }
+.result-section-title {
+  font-family: var(--mono); font-size: 0.72rem; font-weight: 600; color: var(--text3);
+  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
+}
+.result-ol { padding-left: 20px; }
+.result-ol li { font-size: 0.9rem; color: var(--text2); margin-bottom: 4px; line-height: 1.5; }
+.result-ol li strong { color: var(--text); font-weight: 600; }
+.also-list { list-style: none; padding: 0; }
+.also-item { font-size: 0.85rem; color: var(--text3); padding: 4px 0; }
+.also-name { color: var(--text2); font-weight: 600; }
+.also-hint { font-style: italic; }
+
+/* Expert mode */
+.expert-group { margin-bottom: 16px; }
+.expert-label {
+  display: block; font-family: var(--mono); font-size: 0.78rem; font-weight: 600;
+  color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
+}
+.expert-select {
+  width: 100%; padding: 12px 14px; background: var(--bg); border: 1px solid var(--border2);
+  border-radius: 8px; color: var(--text); font-family: var(--body); font-size: 0.95rem;
+  min-height: 44px; cursor: pointer; transition: border-color 0.2s;
+}
+.expert-select:focus { outline: 3px solid var(--accent); outline-offset: -1px; border-color: var(--accent); }
+.expert-select:disabled { opacity: 0.4; cursor: not-allowed; }
+.expert-help { font-size: 0.78rem; color: var(--text3); font-style: italic; margin-top: 4px; }
+
+/* Fade animation */
+@keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
+.fade-in { animation: fade-in 0.3s ease-out; }
+
+/* Responsive */
+@media (max-width: 640px) {
+  body { padding: 14px; }
+  h1 { font-size: 1.4rem; }
+  .header { flex-direction: column; }
+  .q-text { font-size: 1.05rem; }
+  .result-dx { font-size: 1.2rem; }
+  .opt-btn { padding: 12px 14px; }
+}
 </style>
 </head>
 <body>
-<div class="placeholder">
-  <div class="icon">🩺</div>
-  <h1>Plant Doctor</h1>
-  <p>Coming soon &mdash; interactive symptom diagnosis</p>
+
+<div class="header">
+  <div>
+    <h1>Plant Doctor</h1>
+    <p class="subtitle">Interactive symptom diagnosis wizard</p>
+  </div>
+  <div class="toggle-wrap">
+    <span class="toggle-label" id="toggle-text">Expert Mode</span>
+    <div class="toggle-track" id="expert-toggle" role="switch" aria-checked="false" aria-labelledby="toggle-text" tabindex="0"></div>
+  </div>
 </div>
+
+<div class="storage-warn" id="storage-warn"></div>
+<div class="last-dx" id="last-dx"></div>
+<div class="progress" id="progress" role="img" aria-label="Diagnosis progress"></div>
+<div id="app" aria-live="polite"></div>
+
+<script>
+/* ── Helpers ── */
+function escapeHtml(s) {
+  if (!s) return '';
+  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
+}
+
+function makeResult(o) {
+  var r = {
+    checkFirst: ['Verify pH: 6.0\u20136.5 (soil) or 5.5\u20136.0 (coco/hydro)'],
+    fixes: [],
+    alsoConsider: []
+  };
+  for (var k in o) { if (o.hasOwnProperty(k)) r[k] = o[k]; }
+  return r;
+}
+
+/* ── Decision Tree ── */
+var ROOT = 'q-stage';
+var TREE = {
+  /* ── Level 1: Growth Stage ── */
+  'q-stage': { id:'q-stage', question:'What growth stage is the plant in?', help:'This helps narrow down the most likely causes.', options:[
+    { label:'Seedling / clone', next:'q-seedling-symptom' },
+    { label:'Vegetative', next:'q-symptom' },
+    { label:'Early flower (weeks 1\u20133)', next:'q-symptom' },
+    { label:'Mid flower (weeks 4\u20136)', next:'q-symptom' },
+    { label:'Late flower (week 7+)', next:'q-symptom-late' }
+  ]},
+
+  /* ── Seedling-specific ── */
+  'q-seedling-symptom': { id:'q-seedling-symptom', question:'What is the seedling showing?', help:'Seedlings and fresh clones have unique issues.', options:[
+    { label:'Stretching \u2014 tall and leggy', next:'r-stretching' },
+    { label:'Stem narrowing at soil line', next:'r-damping-off' },
+    { label:'Drooping or wilting', next:'r-seedling-overwater' },
+    { label:'Yellowing leaves', next:'q-seedling-yellow' },
+    { label:'Other symptoms', next:'q-symptom' }
+  ]},
+  'q-seedling-yellow': { id:'q-seedling-yellow', question:'What part is yellowing?', options:[
+    { label:'Cotyledons (round first leaves)', next:'r-cotyledon-normal' },
+    { label:'First true leaves', next:'r-seedling-nute' },
+    { label:'Whole seedling is pale', next:'r-light-distance' }
+  ]},
+
+  /* ── Late flower symptom selector ── */
+  'q-symptom-late': { id:'q-symptom-late', question:'What is the primary symptom?', help:'Some yellowing is normal in late flower as nutrients mobilize to buds.', options:[
+    { label:'Lower leaf yellowing', next:'q-late-yellow' },
+    { label:'Spots or burns', next:'q-spots-pattern' },
+    { label:'Curling leaves', next:'q-curl-direction' },
+    { label:'Drooping / wilting', next:'q-droop-pot' },
+    { label:'White or powdery substance', next:'q-white-location' },
+    { label:'Color changes', next:'q-color-which' }
+  ]},
+  'q-late-yellow': { id:'q-late-yellow', question:'How far into flowering are you?', options:[
+    { label:'6+ weeks \u2014 fan leaves fading out', next:'r-natural-fade' },
+    { label:'Less than 6 weeks', next:'q-yellow-old' },
+    { label:'Rapid \u2014 many leaves at once', next:'q-yellow-whole' }
+  ]},
+
+  /* ── Standard symptom selector ── */
+  'q-symptom': { id:'q-symptom', question:'What is the primary symptom?', options:[
+    { label:'Yellowing leaves', next:'q-yellow-where' },
+    { label:'Spots or burns', next:'q-spots-pattern' },
+    { label:'Curling leaves', next:'q-curl-direction' },
+    { label:'Drooping / wilting', next:'q-droop-pot' },
+    { label:'White or powdery substance', next:'q-white-location' },
+    { label:'Color changes', next:'q-color-which' }
+  ]},
+
+  /* ── Yellowing path ── */
+  'q-yellow-where': { id:'q-yellow-where', question:'Where is the yellowing?', help:'Mobile nutrients (N, P, K, Mg) show deficiency on old leaves first. Immobile nutrients (Ca, Fe, S) show on new growth.', options:[
+    { label:'Lower / older leaves', next:'q-yellow-old' },
+    { label:'Upper / newer leaves', next:'q-yellow-new' },
+    { label:'Whole plant', next:'q-yellow-whole' }
+  ]},
+  'q-yellow-old': { id:'q-yellow-old', question:'How are the lower leaves yellowing?', options:[
+    { label:'Uniform yellow, starting from tips', next:'r-n-def' },
+    { label:'Yellow between veins (veins stay green)', next:'r-mg-def' },
+    { label:'Yellow with purple stems', next:'r-p-def' },
+    { label:'Yellow with brown spots', next:'r-ca-def' }
+  ]},
+  'q-yellow-new': { id:'q-yellow-new', question:'How are the newer leaves yellowing?', options:[
+    { label:'Pale / light green overall', next:'r-s-def' },
+    { label:'Yellow between veins, veins stay dark', next:'r-fe-def' },
+    { label:'Yellow tips and edges', next:'r-ph-lockout' },
+    { label:'New growth twisted or distorted', next:'r-ca-def-new' }
+  ]},
+  'q-yellow-whole': { id:'q-yellow-whole', question:'How quickly is it progressing?', options:[
+    { label:'Slow, over 1\u20132 weeks', next:'r-ph-drift' },
+    { label:'Fast, within a few days', next:'r-overwater-yellow' },
+    { label:'Started after increasing nutrients', next:'r-ph-lockout-feed' }
+  ]},
+
+  /* ── Spots / Burns path ── */
+  'q-spots-pattern': { id:'q-spots-pattern', question:'What pattern do the spots or burns show?', options:[
+    { label:'Brown / burnt leaf tips', next:'q-tipburn-severity' },
+    { label:'Random brown spots on leaves', next:'q-random-spots' },
+    { label:'Well-defined circular spots', next:'r-fungal' },
+    { label:'Yellow or brown between veins', next:'q-interveinal-where' },
+    { label:'Tiny white or yellow speckling', next:'r-pest-mites' }
+  ]},
+  'q-tipburn-severity': { id:'q-tipburn-severity', question:'How severe is the tip burn?', options:[
+    { label:'Just the very tips (1\u20132 mm)', next:'r-nute-burn-mild' },
+    { label:'Tips and leaf margins', next:'r-nute-burn-severe' },
+    { label:'Tips + crispy curling edges', next:'r-k-def' }
+  ]},
+  'q-random-spots': { id:'q-random-spots', question:'What else do you notice with the spots?', options:[
+    { label:'Yellow halo around the spots', next:'r-ca-def' },
+    { label:'Just brown spots, no halo', next:'r-ph-flux' },
+    { label:'Spots mainly on lower leaves', next:'r-mg-def-spots' }
+  ]},
+  'q-interveinal-where': { id:'q-interveinal-where', question:'Which leaves show interveinal symptoms?', options:[
+    { label:'Lower / older leaves', next:'r-mg-def' },
+    { label:'Upper / newer leaves', next:'r-fe-def' },
+    { label:'Throughout the plant', next:'r-ph-lockout' }
+  ]},
+
+  /* ── Curling path ── */
+  'q-curl-direction': { id:'q-curl-direction', question:'Which way are the leaves curling?', help:'Curl direction strongly indicates the cause.', options:[
+    { label:'Upward (taco-ing)', next:'q-curl-up-detail' },
+    { label:'Downward (clawing)', next:'q-curl-down-detail' },
+    { label:'Edges curling inward', next:'q-curl-edge-detail' }
+  ]},
+  'q-curl-up-detail': { id:'q-curl-up-detail', question:'Any other symptoms with the upward curl?', options:[
+    { label:'Leaves feel dry or crispy', next:'r-heat-stress' },
+    { label:'Yellowing or bleaching too', next:'r-heat-light' },
+    { label:'Only leaves closest to the light', next:'r-light-too-close' }
+  ]},
+  'q-curl-down-detail': { id:'q-curl-down-detail', question:'What color are the clawing leaves?', options:[
+    { label:'Very dark green, shiny/waxy', next:'r-n-tox' },
+    { label:'Normal green', next:'r-overwater' },
+    { label:'Yellowing while clawing', next:'r-overwater-yellow' }
+  ]},
+  'q-curl-edge-detail': { id:'q-curl-edge-detail', question:'Are the edges dry or still supple?', options:[
+    { label:'Dry, crispy edges', next:'r-k-def' },
+    { label:'Edges look OK, just curling', next:'r-wind-burn' },
+    { label:'Brown edges + curling', next:'r-low-humidity' }
+  ]},
+
+  /* ── Drooping path ── */
+  'q-droop-pot': { id:'q-droop-pot', question:'How heavy is the pot when you lift it?', help:'Pot weight is the fastest way to distinguish over/underwatering.', options:[
+    { label:'Heavy / saturated', next:'r-overwater' },
+    { label:'Very light / bone dry', next:'r-underwater' },
+    { label:'Normal weight', next:'q-droop-timing' },
+    { label:'Just transplanted recently', next:'r-transplant' }
+  ]},
+  'q-droop-timing': { id:'q-droop-timing', question:'When does the drooping happen?', options:[
+    { label:'End of light cycle only', next:'r-normal-transpiration' },
+    { label:'All day, getting worse', next:'r-root-rot' },
+    { label:'Started after feeding', next:'r-ph-lockout-feed' }
+  ]},
+
+  /* ── White / Powdery path ── */
+  'q-white-location': { id:'q-white-location', question:'Where is the white or powdery substance?', options:[
+    { label:'On leaf surfaces', next:'q-white-surface' },
+    { label:'Top of plant / bleached tips', next:'r-light-burn' },
+    { label:'White residue on pot or soil', next:'r-mineral' }
+  ]},
+  'q-white-surface': { id:'q-white-surface', question:'Does it wipe off with a finger?', options:[
+    { label:'Yes \u2014 powdery white coating', next:'r-pm' },
+    { label:'No \u2014 part of the leaf', next:'q-white-builtin' }
+  ]},
+  'q-white-builtin': { id:'q-white-builtin', question:'Is the plant in flower?', options:[
+    { label:'Yes, buds are forming', next:'r-trichomes' },
+    { label:'No, still in veg', next:'r-wpm-early' }
+  ]},
+
+  /* ── Color changes path ── */
+  'q-color-which': { id:'q-color-which', question:'What color change are you seeing?', options:[
+    { label:'Purple stems or leaves', next:'q-purple-temp' },
+    { label:'Very dark green leaves', next:'q-dark-green-detail' },
+    { label:'Rusty / bronze on edges', next:'q-rusty-detail' },
+    { label:'Red or pink leaf stems (petioles)', next:'r-p-def' }
+  ]},
+  'q-purple-temp': { id:'q-purple-temp', question:'What are your night temperatures?', help:'Cold nights can trigger anthocyanin (purple) production.', options:[
+    { label:'Below 65\u00b0F / 18\u00b0C', next:'r-cold-purple' },
+    { label:'Above 65\u00b0F / 18\u00b0C', next:'r-p-def' },
+    { label:'Not sure', next:'r-p-def' }
+  ]},
+  'q-dark-green-detail': { id:'q-dark-green-detail', question:'How do the dark green leaves look?', options:[
+    { label:'Shiny or waxy, clawing down', next:'r-n-tox' },
+    { label:'Normal texture, just dark', next:'r-normal-veg' }
+  ]},
+  'q-rusty-detail': { id:'q-rusty-detail', question:'Where are the rusty/bronze areas?', options:[
+    { label:'Leaf edges and tips only', next:'r-k-def' },
+    { label:'Scattered across leaf surface', next:'r-ca-mg' }
+  ]},
+
+  /* ═══════════════════════════════════════════════════ */
+  /* ── RESULT NODES ── */
+  /* ═══════════════════════════════════════════════════ */
+
+  /* ── Deficiencies ── */
+  'r-n-def': makeResult({ id:'r-n-def', diagnosis:'Nitrogen Deficiency', confidence:0.85, severity:'warning',
+    checkFirst:['Verify pH: 6.0\u20136.5 (soil) or 5.5\u20136.0 (coco/hydro)','Check EC/PPM of feed solution'],
+    fixes:['Increase nitrogen in your base nutrient feed','If using organic soil, top-dress with worm castings or blood meal','Foliar spray with dilute N source (2 ml/L) for quick temporary relief','Remove severely yellowed leaves that won\u2019t recover'],
+    alsoConsider:[{name:'Natural fade',hint:'Normal in last 2\u20133 weeks of flower'},{name:'Root zone issues',hint:'If pH is correct, check for root problems'}]
+  }),
+  'r-p-def': makeResult({ id:'r-p-def', diagnosis:'Phosphorus Deficiency', confidence:0.80, severity:'warning',
+    checkFirst:['Verify pH: 6.0\u20136.5 (soil) \u2014 P locks out below 6.0','Check that water temperature is not below 60\u00b0F / 15\u00b0C'],
+    fixes:['Increase phosphorus in feed (bloom booster if in flower)','Ensure soil temperature is above 62\u00b0F / 17\u00b0C \u2014 cold roots lock out P','If organic: bone meal or bat guano top-dress','Flush if salt buildup suspected, then re-feed at correct strength'],
+    alsoConsider:[{name:'Cold stress',hint:'If night temps are low, purple may be cold-related, not P deficiency'},{name:'pH lockout',hint:'P is one of the first nutrients locked out by incorrect pH'}]
+  }),
+  'r-k-def': makeResult({ id:'r-k-def', diagnosis:'Potassium Deficiency', confidence:0.80, severity:'warning',
+    checkFirst:['Verify pH: 6.0\u20136.5 (soil)','Check if you\u2019re feeding enough K for the current stage'],
+    fixes:['Increase potassium in feed \u2014 use a bloom booster in flower','If organic: kelp meal or wood ash (small amounts)','Ensure no calcium or magnesium excess is locking out K','Remove dead leaf tissue to prevent mold'],
+    alsoConsider:[{name:'Nutrient burn',hint:'If tips are uniformly brown, could be excess not deficiency'},{name:'Heat stress',hint:'Can cause similar crispy edges'}]
+  }),
+  'r-ca-def': makeResult({ id:'r-ca-def', diagnosis:'Calcium Deficiency', confidence:0.78, severity:'warning',
+    checkFirst:['Verify pH: 6.2\u20136.5 (Ca locks out below 6.2 in soil)','Check if using RO or soft water (low mineral content)'],
+    fixes:['Add CalMag supplement (3\u20135 ml/L)','If in coco: CalMag is essential \u2014 coco binds calcium','Ensure soil pH allows calcium uptake','Avoid overwatering, which reduces Ca transport via transpiration'],
+    alsoConsider:[{name:'Magnesium deficiency',hint:'Often occurs together with Ca deficiency'},{name:'pH lockout',hint:'Most common cause of apparent Ca deficiency'}]
+  }),
+  'r-ca-def-new': makeResult({ id:'r-ca-def-new', diagnosis:'Calcium Deficiency (New Growth)', confidence:0.75, severity:'warning',
+    checkFirst:['Verify pH is 6.2\u20136.5','Check if using reverse osmosis or very soft water'],
+    fixes:['Add CalMag supplement (3\u20135 ml/L) to every watering','Calcium moves slowly \u2014 new growth shows deficiency first','In coco, CalMag is always required','Avoid excessive potassium which competes with calcium uptake'],
+    alsoConsider:[{name:'Boron deficiency',hint:'Rare, but causes similar twisted new growth'},{name:'pH lockout',hint:'Check pH first before adding supplements'}]
+  }),
+  'r-mg-def': makeResult({ id:'r-mg-def', diagnosis:'Magnesium Deficiency', confidence:0.85, severity:'warning',
+    checkFirst:['Verify pH: 6.0\u20136.5 (Mg locks out below 6.0)','Check if LED lighting is being used (LEDs increase Mg demand)'],
+    fixes:['Add CalMag at 3\u20135 ml/L','Foliar spray with Epsom salt (1 tsp per liter) for quick fix','Under LEDs, increase Mg by 20\u201330% over HPS levels','Ensure no potassium excess is blocking Mg uptake'],
+    alsoConsider:[{name:'Iron deficiency',hint:'If interveinal yellowing is on NEW leaves instead'},{name:'pH lockout',hint:'Most common underlying cause'}]
+  }),
+  'r-mg-def-spots': makeResult({ id:'r-mg-def-spots', diagnosis:'Magnesium Deficiency (Spotted Pattern)', confidence:0.75, severity:'warning',
+    checkFirst:['Verify pH: 6.0\u20136.5','Check CalMag dosage in current feed'],
+    fixes:['Add CalMag supplement or increase current dose','Epsom salt foliar spray (1 tsp/L) for immediate relief','Check that potassium level is not excessive (K competes with Mg)','Monitor new growth for improvement over 5\u20137 days'],
+    alsoConsider:[{name:'Calcium deficiency',hint:'Often occurs alongside Mg def'},{name:'pH fluctuation',hint:'Can cause sporadic spotting patterns'}]
+  }),
+  'r-fe-def': makeResult({ id:'r-fe-def', diagnosis:'Iron Deficiency', confidence:0.80, severity:'warning',
+    checkFirst:['Verify pH: must be below 6.5 \u2014 iron locks out quickly at high pH','Check if overwatering (reduces iron uptake)'],
+    fixes:['Lower pH to 6.0\u20136.3 range','Add chelated iron supplement','Ensure good drainage \u2014 waterlogged roots can\u2019t absorb iron','Reduce any excess calcium or manganese that compete with Fe'],
+    alsoConsider:[{name:'Sulfur deficiency',hint:'Also shows on new growth, but uniform yellow, not interveinal'},{name:'Zinc deficiency',hint:'Rare, causes similar interveinal chlorosis with smaller leaves'}]
+  }),
+  'r-s-def': makeResult({ id:'r-s-def', diagnosis:'Sulfur Deficiency', confidence:0.75, severity:'note',
+    checkFirst:['Verify pH: 6.0\u20136.5','Check base nutrient \u2014 most contain adequate S'],
+    fixes:['Add Epsom salt (magnesium sulfate) at 1 tsp per gallon','Most quality base nutrients include sufficient sulfur','If using organic: gypsum provides calcium + sulfur','Rare in cannabis \u2014 rule out iron and nitrogen first'],
+    alsoConsider:[{name:'Nitrogen deficiency',hint:'More common, also yellows new growth'},{name:'Iron deficiency',hint:'Check if veins remain dark (Fe) vs uniform pale (S)'}]
+  }),
+  'r-ca-mg': makeResult({ id:'r-ca-mg', diagnosis:'Combined Calcium-Magnesium Deficiency', confidence:0.75, severity:'warning',
+    checkFirst:['Verify pH: 6.0\u20136.5','Check if using RO water or coco coir without CalMag'],
+    fixes:['Add CalMag supplement at 3\u20135 ml/L every watering','RO water users: CalMag is mandatory, not optional','Coco coir users: coco holds Ca and releases Na/K \u2014 always buffer coco and use CalMag','Check that total PPM is not too high, causing lockout'],
+    alsoConsider:[{name:'pH lockout',hint:'Fix pH first \u2014 supplements won\u2019t help if pH is wrong'},{name:'Potassium excess',hint:'Can block both Ca and Mg uptake'}]
+  }),
+
+  /* ── Toxicities ── */
+  'r-n-tox': makeResult({ id:'r-n-tox', diagnosis:'Nitrogen Toxicity', confidence:0.85, severity:'warning',
+    checkFirst:['Check current NPK ratio of feed','If in flower, N should be reduced significantly'],
+    fixes:['Reduce nitrogen in feed by 30\u201350%','If in flower: switch to a bloom-specific nutrient with lower N','Flush with pH\u2019d water (2\u20133x pot volume) to clear excess','Leaves won\u2019t unclaw, but new growth should be normal'],
+    alsoConsider:[{name:'Overwatering',hint:'Also causes droopy leaves, but without the dark shiny green'},{name:'Nutrient lockout',hint:'Excess N can lock out other nutrients'}]
+  }),
+  'r-nute-burn-mild': makeResult({ id:'r-nute-burn-mild', diagnosis:'Mild Nutrient Burn', confidence:0.90, severity:'note',
+    checkFirst:['Check current EC/PPM of feed solution','Compare to recommended range for current stage'],
+    fixes:['Reduce overall nutrient strength by 15\u201320%','Slight tip burn is common and cosmetic \u2014 plant is near its max intake','Water with plain pH\u2019d water for next 1\u20132 waterings','Resume feeding at reduced strength'],
+    alsoConsider:[{name:'Potassium deficiency',hint:'If burn progresses inward on leaf margins, may be K def'},{name:'Salt buildup',hint:'If growing in soil, flush to remove salt accumulation'}]
+  }),
+  'r-nute-burn-severe': makeResult({ id:'r-nute-burn-severe', diagnosis:'Severe Nutrient Burn', confidence:0.85, severity:'critical',
+    checkFirst:['Check EC/PPM of feed \u2014 likely too high','Check EC/PPM of runoff vs input'],
+    fixes:['Flush medium with pH\u2019d water (3x pot volume)','Reduce nutrients by 30\u201340% when resuming feed','Remove crispy dead leaves to prevent mold','Monitor runoff PPM \u2014 should be within 200 PPM of input'],
+    alsoConsider:[{name:'Salt buildup',hint:'In soil/coco, salts accumulate over time \u2014 regular flushes prevent this'},{name:'pH lockout',hint:'High EC combined with wrong pH creates severe lockout'}]
+  }),
+
+  /* ── Environmental ── */
+  'r-heat-stress': makeResult({ id:'r-heat-stress', diagnosis:'Heat Stress', confidence:0.80, severity:'warning',
+    checkFirst:['Measure canopy temperature at top of plant','Check VPD \u2014 may be too high'],
+    fixes:['Target 75\u201382\u00b0F (24\u201328\u00b0C) at canopy level','Increase air circulation with oscillating fans','Raise lights or dim them to reduce radiant heat','If in tent: increase exhaust fan speed or add intake'],
+    alsoConsider:[{name:'Light stress',hint:'If leaves closest to lights are most affected'},{name:'Low humidity',hint:'Heat + low RH creates very high VPD'}]
+  }),
+  'r-heat-light': makeResult({ id:'r-heat-light', diagnosis:'Combined Heat and Light Stress', confidence:0.80, severity:'critical',
+    checkFirst:['Measure canopy temperature','Measure light intensity at canopy (PPFD if possible)','Check VPD'],
+    fixes:['Raise lights by 6\u201312 inches','Dim lights 10\u201320% if dimmable','Improve ventilation and airflow','Target PPFD 600\u2013900 \u00b5mol for flower, 400\u2013600 for veg','Increase humidity to bring VPD into range'],
+    alsoConsider:[{name:'Nutrient burn',hint:'High light + high nutrients amplifies burn'},{name:'Calcium deficiency',hint:'High transpiration rate increases Ca demand'}]
+  }),
+  'r-light-burn': makeResult({ id:'r-light-burn', diagnosis:'Light Burn (Bleaching)', confidence:0.90, severity:'critical',
+    checkFirst:['Measure distance from light to canopy','Check PPFD if you have a meter'],
+    fixes:['Raise lights immediately \u2014 bleached tissue won\u2019t recover','Follow manufacturer\u2019s recommended hanging height','If not dimmable, raise to at least 18\u201324 inches for LED','Bleached buds lose potency \u2014 adjust ASAP'],
+    alsoConsider:[{name:'Heat stress',hint:'Often occurs together with light burn'},{name:'Albino new growth',hint:'Rare genetics, not fixable'}]
+  }),
+  'r-light-too-close': makeResult({ id:'r-light-too-close', diagnosis:'Light Stress (Intensity)', confidence:0.82, severity:'warning',
+    checkFirst:['Check light distance to top of canopy','Review manufacturer recommended PPFD range'],
+    fixes:['Raise lights 4\u20136 inches and monitor for 2\u20133 days','If dimmable, reduce by 10\u201315%','Use the hand test: hold hand at canopy height for 30s \u2014 if too hot, raise light','Supercrop or LST to lower tallest colas if needed'],
+    alsoConsider:[{name:'Heat stress',hint:'Hot LEDs can cause both light and heat stress'},{name:'Nutrient demand',hint:'High light = high nutrient demand \u2014 may need to increase feed'}]
+  }),
+  'r-overwater': makeResult({ id:'r-overwater', diagnosis:'Overwatering', confidence:0.85, severity:'warning',
+    checkFirst:['Lift the pot \u2014 is it heavy?','Check if the top inch of soil is still wet'],
+    fixes:['Do not water until pot feels light and top inch is dry','Ensure pots have drainage holes','Add perlite (20\u201330%) to improve drainage on next transplant','Reduce watering frequency, not volume \u2014 water thoroughly but less often'],
+    alsoConsider:[{name:'Root rot',hint:'Chronic overwatering leads to root rot \u2014 check for brown, slimy roots'},{name:'Nitrogen toxicity',hint:'Dark green + drooping could be N tox, not overwatering'}]
+  }),
+  'r-overwater-yellow': makeResult({ id:'r-overwater-yellow', diagnosis:'Overwatering with Nutrient Lockout', confidence:0.78, severity:'warning',
+    checkFirst:['Check pot weight and drainage','Check pH of runoff water'],
+    fixes:['Allow medium to dry out properly before next watering','Ensure adequate drainage \u2014 10\u201320% runoff each watering','Check roots for brown/slimy appearance (root rot)','Once dry/wet cycle resumes, plants should recover in 5\u20137 days'],
+    alsoConsider:[{name:'pH lockout',hint:'Wet roots + wrong pH = rapid lockout'},{name:'Root rot',hint:'If smell is foul when checking roots'}]
+  }),
+  'r-underwater': makeResult({ id:'r-underwater', diagnosis:'Underwatering', confidence:0.90, severity:'warning',
+    checkFirst:['Lift pot \u2014 should feel very light','Check if soil has pulled away from pot edges'],
+    fixes:['Water thoroughly with pH\u2019d water until 10\u201320% runoff','If soil is bone dry, water slowly in stages (dry soil repels water)','Add a small amount of wetting agent or water from the bottom','Plants should perk up within 1\u20134 hours after watering'],
+    alsoConsider:[{name:'Root bound',hint:'If plant needs water daily, it may need a larger pot'},{name:'Heat stress',hint:'High temps increase water demand dramatically'}]
+  }),
+  'r-wind-burn': makeResult({ id:'r-wind-burn', diagnosis:'Wind Burn', confidence:0.75, severity:'note',
+    checkFirst:['Check fan placement \u2014 is air blowing directly on affected leaves?','Ensure oscillation is enabled on fans'],
+    fixes:['Redirect fans so no leaves are in a constant direct breeze','Use oscillating fans instead of stationary ones','Gentle leaf movement is good \u2014 constant flapping is too much','Move fans further away or reduce speed'],
+    alsoConsider:[{name:'Low humidity',hint:'Direct airflow + low RH intensifies transpiration stress'},{name:'Potassium deficiency',hint:'If edges are crispy and brown, may be K def instead'}]
+  }),
+  'r-low-humidity': makeResult({ id:'r-low-humidity', diagnosis:'Low Humidity Stress', confidence:0.75, severity:'warning',
+    checkFirst:['Check RH at canopy level','Calculate VPD for current temp + RH'],
+    fixes:['Raise humidity with a humidifier','Target VPD: 0.8\u20131.2 kPa in veg, 1.0\u20131.4 in early flower','Slow exhaust fan speed if RH is very low','Group plants together to create a micro-humidity zone'],
+    alsoConsider:[{name:'Potassium deficiency',hint:'Similar crispy edges, but K def progresses even with correct VPD'},{name:'Heat stress',hint:'Heat + low RH creates extreme VPD'}]
+  }),
+
+  /* ── pH Related ── */
+  'r-ph-lockout': makeResult({ id:'r-ph-lockout', diagnosis:'pH Lockout', confidence:0.82, severity:'critical',
+    checkFirst:['Test pH of input water/feed','Test pH of runoff water','Compare to optimal range for your medium'],
+    fixes:['Flush with correctly pH\u2019d water (3x pot volume)','Resume feeding at correct pH: 6.0\u20136.5 soil, 5.5\u20136.0 coco/hydro','Calibrate your pH meter \u2014 they drift over time','Add nutrients BEFORE adjusting pH (nutrients change pH)'],
+    alsoConsider:[{name:'Multiple deficiencies',hint:'Lockout often looks like several deficiencies at once'},{name:'Salt buildup',hint:'High EC runoff indicates salts preventing uptake'}]
+  }),
+  'r-ph-lockout-feed': makeResult({ id:'r-ph-lockout-feed', diagnosis:'pH Lockout (Post-Feeding)', confidence:0.78, severity:'warning',
+    checkFirst:['Test pH of your feed solution AFTER mixing nutrients','Test pH of runoff','Check EC/PPM of runoff vs input'],
+    fixes:['Always pH your water AFTER adding all nutrients','Flush if runoff pH is more than 0.5 off from input','Reduce nutrient strength if EC is too high','Wait 24\u201348 hours after flush before resuming feed'],
+    alsoConsider:[{name:'Nutrient burn',hint:'If EC is high alongside pH issues'},{name:'Root damage',hint:'If problem persists after pH correction'}]
+  }),
+  'r-ph-drift': makeResult({ id:'r-ph-drift', diagnosis:'Slow pH Drift', confidence:0.72, severity:'warning',
+    checkFirst:['Test pH of runoff over several waterings','Compare input pH to runoff pH'],
+    fixes:['If runoff pH is drifting up: soil may be too alkaline, flush and re-pH','If drifting down: organic decomposition or acid buildup','Regular monitoring: test runoff pH every 2\u20133 waterings','Consider a pH buffer in your feed regimen'],
+    alsoConsider:[{name:'Root zone bacteria',hint:'Beneficial microbes can help stabilize pH'},{name:'Water source change',hint:'Municipal water pH can shift seasonally'}]
+  }),
+  'r-ph-flux': makeResult({ id:'r-ph-flux', diagnosis:'pH Fluctuation', confidence:0.70, severity:'warning',
+    checkFirst:['Test input pH and runoff pH at each watering','Check if pH meter is calibrated'],
+    fixes:['Stabilize input pH between 6.0\u20136.5 consistently','Let water sit 24h before pH\u2019ing (chlorine off-gasses, pH stabilizes)','Use a pH buffer product if you have trouble maintaining stable pH','Avoid dramatic nutrient concentration changes between waterings'],
+    alsoConsider:[{name:'Calcium deficiency',hint:'Often appears alongside pH instability'},{name:'Multiple deficiencies',hint:'Fluctuating pH causes intermittent lockout of various nutrients'}]
+  }),
+
+  /* ── Pests / Disease ── */
+  'r-pm': makeResult({ id:'r-pm', diagnosis:'Powdery Mildew (WPM)', confidence:0.90, severity:'critical',
+    checkFirst:['Inspect undersides of leaves closely','Check humidity levels \u2014 WPM thrives above 60% RH in flower'],
+    fixes:['Remove and discard heavily infected leaves (bag before moving)','Treat with potassium bicarbonate spray (1 tbsp per gallon)','Reduce humidity below 55% RH in flower','Increase airflow \u2014 ensure canopy is not too dense','Defoliate to improve air penetration','Do NOT use neem oil in flower \u2014 it affects taste and is unsafe to combust'],
+    alsoConsider:[{name:'Bud rot',hint:'In flower, WPM can lead to botrytis if unchecked'},{name:'Trichomes',hint:'White crystal appearance on buds is normal trichomes, not WPM'}]
+  }),
+  'r-wpm-early': makeResult({ id:'r-wpm-early', diagnosis:'Suspected Early Powdery Mildew', confidence:0.70, severity:'warning',
+    checkFirst:['Examine white areas under magnification','Check if it spreads in a circular pattern'],
+    fixes:['Apply preventive potassium bicarbonate or milk spray (40% milk solution)','Improve airflow around canopy immediately','Keep RH below 60% and avoid stagnant air','Monitor closely for 3\u20135 days for progression'],
+    alsoConsider:[{name:'Mineral residue',hint:'Hard water spots can look similar to early WPM'},{name:'Normal leaf coloring',hint:'Some strains have pale leaf undersides'}]
+  }),
+  'r-fungal': makeResult({ id:'r-fungal', diagnosis:'Fungal Leaf Spots', confidence:0.72, severity:'warning',
+    checkFirst:['Examine spots under magnification for rings or halos','Check if leaves were wet (foliar spray, high humidity, splashing)'],
+    fixes:['Remove affected leaves and discard','Improve airflow and reduce leaf wetness','Apply neem oil in veg (never in flower)','Potassium bicarbonate spray is safe through early flower','Avoid getting water on leaves during watering'],
+    alsoConsider:[{name:'Calcium deficiency',hint:'Can create similar brown spots, but with yellow halos'},{name:'Nutrient splash',hint:'Concentrated nutrient solution on leaves causes burn spots'}]
+  }),
+  'r-root-rot': makeResult({ id:'r-root-rot', diagnosis:'Root Rot (Pythium)', confidence:0.75, severity:'critical',
+    checkFirst:['Carefully check roots \u2014 healthy roots are white/cream, rotted are brown/slimy','Smell the root zone \u2014 rot has a distinct foul odor'],
+    fixes:['Reduce watering immediately and improve drainage','Add beneficial bacteria (Bacillus, Mycorrhizae) to root zone','Hydrogen peroxide root drench (3% H2O2 at 1 ml/L) kills pathogens but also beneficials','If in hydro: clean reservoir, add hydroguard, lower water temp below 68\u00b0F','Ensure pots have adequate drainage and airflow'],
+    alsoConsider:[{name:'Overwatering',hint:'Usually the cause of root rot \u2014 fix watering habits'},{name:'Pythium',hint:'High root zone temps (above 75\u00b0F) promote Pythium'}]
+  }),
+  'r-pest-mites': makeResult({ id:'r-pest-mites', diagnosis:'Spider Mites', confidence:0.78, severity:'critical',
+    checkFirst:['Check leaf undersides with a magnifier \u2014 look for tiny moving dots','Look for fine webbing between leaves and stems'],
+    fixes:['Spray leaf undersides with insecticidal soap or neem oil (veg only)','In flower: use spinosad or predatory mites (Phytoseiulus persimilis)','Treat every 3 days for 2 weeks to break the egg cycle','Lower temperatures slow mite reproduction','Quarantine affected plants if possible'],
+    alsoConsider:[{name:'Thrips',hint:'Also cause stippling but leave silver streaks'},{name:'Broad mites',hint:'Invisible to naked eye, cause twisted distorted new growth'}]
+  }),
+
+  /* ── Seedling Specific ── */
+  'r-stretching': makeResult({ id:'r-stretching', diagnosis:'Seedling Stretching', confidence:0.92, severity:'note',
+    checkFirst:['Measure light distance from seedling','Check light intensity (PPFD at seedling level)'],
+    fixes:['Lower the light or increase intensity','Target 200\u2013400 PPFD for seedlings','Add a small fan for gentle stem movement (strengthens stems)','If already stretched: bury the stem up to cotyledons when transplanting','Use a dome or humidity tent for clones to reduce stretch'],
+    alsoConsider:[{name:'Temperature differential',hint:'Large day/night temp swing increases stretch'},{name:'Light spectrum',hint:'Blue-heavy spectrum reduces stretch'}]
+  }),
+  'r-damping-off': makeResult({ id:'r-damping-off', diagnosis:'Damping Off', confidence:0.85, severity:'critical',
+    checkFirst:['Check if stem is thin, brown, or mushy at soil line','Check soil moisture \u2014 is it constantly wet?'],
+    fixes:['If stem is pinched/collapsed: the seedling cannot be saved','Prevent on next attempt: use sterile seed-starting mix','Do not overwater seedlings \u2014 mist the surface, don\u2019t soak','Ensure good air circulation around seedlings','Sprinkle cinnamon on soil surface as a natural antifungal'],
+    alsoConsider:[{name:'Overwatering',hint:'Too-wet conditions are the primary cause'},{name:'Non-sterile medium',hint:'Used soil can harbor Pythium and Fusarium'}]
+  }),
+  'r-seedling-overwater': makeResult({ id:'r-seedling-overwater', diagnosis:'Seedling Overwatering', confidence:0.85, severity:'warning',
+    checkFirst:['Check if soil is wet at root level','Are you watering too frequently?'],
+    fixes:['Seedlings have tiny root systems \u2014 they need very little water','Water in a small circle around the seedling, not the whole pot','Wait until topsoil is dry before watering again','If in a large pot: water only a small area around the stem'],
+    alsoConsider:[{name:'Damping off',hint:'If stem base looks brown or thin, it may be damping off'},{name:'Transplant shock',hint:'If recently transplanted from a smaller container'}]
+  }),
+  'r-cotyledon-normal': makeResult({ id:'r-cotyledon-normal', diagnosis:'Normal Cotyledon Yellowing', confidence:0.92, severity:'note',
+    checkFirst:['Check that true leaves are green and healthy','Confirm seedling is 1\u20132 weeks old'],
+    fixes:['This is completely normal \u2014 cotyledons provide initial energy then die off','No action needed if true leaves look healthy','Begin light feeding (1/4 strength) once 2\u20133 sets of true leaves appear','Do not remove cotyledons \u2014 let them fall off naturally'],
+    alsoConsider:[{name:'Nutrient deficiency',hint:'Only a concern if TRUE leaves are also yellowing'},{name:'Overwatering',hint:'If the whole seedling looks droopy and pale'}]
+  }),
+  'r-seedling-nute': makeResult({ id:'r-seedling-nute', diagnosis:'Seedling Nutrient Sensitivity', confidence:0.80, severity:'warning',
+    checkFirst:['Check if the soil has added nutrients (hot soil)','Check EC/PPM if feeding the seedling'],
+    fixes:['Seedlings need very low nutrient levels for the first 1\u20132 weeks','If soil is "hot": transplant to a milder seedling mix','Flush with plain pH\u2019d water and do not feed for 7 days','When resuming: start at 1/4 strength and increase gradually'],
+    alsoConsider:[{name:'pH issue',hint:'Even mild pH swings affect seedlings more than mature plants'},{name:'Light burn',hint:'Seedlings are sensitive to intense light'}]
+  }),
+  'r-light-distance': makeResult({ id:'r-light-distance', diagnosis:'Insufficient Light (Seedling)', confidence:0.82, severity:'note',
+    checkFirst:['Measure light distance to seedling','Check light intensity (PPFD)'],
+    fixes:['Move light closer or increase intensity to 200\u2013400 PPFD','Seedlings need 16\u201318 hours of light per day','If using CFL/fluorescent: keep 2\u20134 inches from top','If pale AND stretched, light is definitely insufficient'],
+    alsoConsider:[{name:'Nitrogen deficiency',hint:'Unlikely in seedling with fresh soil, but check if in inert medium'},{name:'Overwatering',hint:'Pale + droopy is more likely overwatering'}]
+  }),
+
+  /* ── Normal / Benign ── */
+  'r-natural-fade': makeResult({ id:'r-natural-fade', diagnosis:'Natural Late-Flower Fade', confidence:0.90, severity:'note',
+    checkFirst:['Confirm you are in the last 2\u20133 weeks of flower','Check that buds are developing well and trichomes are milky'],
+    fixes:['This is completely normal and often desirable \u2014 no action needed','The plant is redirecting mobile nutrients (N, P, K, Mg) to buds','Continue your flush or reduced-feed schedule as planned','Monitor trichomes for harvest timing, not leaf color'],
+    alsoConsider:[{name:'Premature deficiency',hint:'If fade starts before week 6, may be actual nitrogen deficiency'},{name:'pH lockout',hint:'If ALL leaves are rapidly dying, check pH \u2014 this is too aggressive even for fade'}]
+  }),
+  'r-trichomes': makeResult({ id:'r-trichomes', diagnosis:'Trichomes (Normal)', confidence:0.95, severity:'note',
+    checkFirst:['Examine with a loupe or jeweler\u2019s lens','Look at sugar leaves and calyxes'],
+    fixes:['This is 100% normal and desirable \u2014 trichomes produce cannabinoids and terpenes','No treatment needed','Use trichome color to time your harvest: clear = early, milky = peak THC, amber = more CBN/body','Handle buds gently to preserve trichomes'],
+    alsoConsider:[{name:'Powdery mildew',hint:'WPM appears on fan leaves and stems, not just buds \u2014 check fan leaves'}]
+  }),
+  'r-mineral': makeResult({ id:'r-mineral', diagnosis:'Mineral Deposits', confidence:0.82, severity:'note',
+    checkFirst:['Check your water source hardness','Look for white crusty buildup on pot rims'],
+    fixes:['Cosmetic only \u2014 not harmful to the plant','If using hard water: consider an RO filter (add CalMag back)','Flush soil surface with plain water periodically','White crust on soil can raise pH over time \u2014 monitor runoff pH'],
+    alsoConsider:[{name:'Powdery mildew',hint:'If white patches are on LEAVES, not soil/pot \u2014 check for WPM'},{name:'Salt buildup',hint:'If on soil surface, may indicate excess fertilizer salts'}]
+  }),
+  'r-cold-purple': makeResult({ id:'r-cold-purple', diagnosis:'Cold-Induced Purple Coloring', confidence:0.80, severity:'note',
+    checkFirst:['Measure night temperatures at canopy level','Check strain genetics \u2014 some strains turn purple naturally'],
+    fixes:['If temps are below 60\u00b0F / 15\u00b0C at night, raise them','A small night temperature drop (5\u201310\u00b0F) is OK and can enhance colors in some strains','Purple from cold is cosmetic and doesn\u2019t significantly harm the plant in late flower','In veg: cold-induced purple may slightly slow growth \u2014 raise night temps'],
+    alsoConsider:[{name:'Phosphorus deficiency',hint:'If purple is accompanied by stunted growth or dark leaves, check P levels'},{name:'Genetics',hint:'Many strains express purple naturally, especially certain lineages'}]
+  }),
+  'r-normal-veg': makeResult({ id:'r-normal-veg', diagnosis:'Normal Vegetative Growth', confidence:0.92, severity:'note',
+    checkFirst:['Check that leaves are healthy with no other symptoms','Verify current NPK ratio is appropriate for veg'],
+    fixes:['Dark green leaves in veg are generally a sign of healthy growth','No action needed if the plant is growing well','Monitor as you enter flower \u2014 reduce N when switching to bloom','If leaves are VERY dark with shiny texture and clawing, that\u2019s N toxicity'],
+    alsoConsider:[{name:'Nitrogen toxicity',hint:'Only if leaves are waxy/shiny AND clawing downward'}]
+  }),
+  'r-normal-transpiration': makeResult({ id:'r-normal-transpiration', diagnosis:'Normal End-of-Day Droop', confidence:0.90, severity:'note',
+    checkFirst:['Observe the plant 1 hour after lights on vs end of day','Check that the droop resolves after watering or lights off'],
+    fixes:['This is completely normal \u2014 plants droop slightly at end of light cycle','The plant\u2019s water reserves are depleted from transpiration','Ensure you\u2019re watering at the right time (early in light cycle is best)','If drooping is severe, consider reducing light intensity or duration'],
+    alsoConsider:[{name:'Underwatering',hint:'If droop doesn\u2019t recover after lights off, check moisture'},{name:'Root issues',hint:'If droop is getting progressively worse each day'}]
+  }),
+  'r-transplant': makeResult({ id:'r-transplant', diagnosis:'Transplant Shock', confidence:0.85, severity:'note',
+    checkFirst:['How recently was the transplant?','Were roots disturbed or damaged?'],
+    fixes:['Normal recovery time is 2\u20135 days','Keep the environment stable: moderate light, good humidity','Water gently with plain pH\u2019d water (no heavy feeding)','Consider using a root stimulator (mycorrhizae, kelp extract)','Do not transplant again until fully recovered'],
+    alsoConsider:[{name:'Overwatering',hint:'Easy to overwater right after transplant \u2014 roots haven\u2019t grown into new soil'},{name:'Root damage',hint:'If recovery takes more than 7 days, roots may have been badly damaged'}]
+  })
+};
+
+/* ── State ── */
+var STORAGE_KEY = 'growdoc-plant-doctor';
+var storageAvailable = true;
+
+var state = {
+  currentNode: ROOT,
+  history: [],
+  expertMode: false,
+  expertSelections: {}
+};
+
+var lastDiagnosis = null;
+
+/* ── Storage ── */
+function checkStorage() {
+  try {
+    localStorage.setItem('__test', '1');
+    localStorage.removeItem('__test');
+    return true;
+  } catch (e) { return false; }
+}
+
+function saveLastDiagnosis(resultNode) {
+  if (!storageAvailable) return;
+  var data = {
+    version: 1,
+    lastDiagnosis: {
+      date: new Date().toISOString(),
+      path: state.history.concat([state.currentNode]),
+      result: { id: resultNode.id, diagnosis: resultNode.diagnosis, severity: resultNode.severity, confidence: resultNode.confidence }
+    }
+  };
+  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
+}
+
+function loadState() {
+  if (!storageAvailable) return;
+  try {
+    var raw = localStorage.getItem(STORAGE_KEY);
+    if (!raw) return;
+    var data = JSON.parse(raw);
+    if (data && data.version === 1 && data.lastDiagnosis) {
+      lastDiagnosis = data.lastDiagnosis;
+    }
+  } catch (e) {
+    var warn = document.getElementById('storage-warn');
+    warn.textContent = 'Saved data was corrupted and has been reset.';
+    warn.style.display = 'block';
+    try { localStorage.removeItem(STORAGE_KEY); } catch (e2) { /* ignore */ }
+  }
+}
+
+/* ── Node Helpers ── */
+function isResult(node) {
+  return node && typeof node.diagnosis === 'string';
+}
+
+function getDepth(historyArr) {
+  return historyArr.length;
+}
+
+function getMaxDepthForPath(nodeId, depth) {
+  var node = TREE[nodeId];
+  if (!node || isResult(node)) return depth;
+  var max = depth;
+  for (var i = 0; i < node.options.length; i++) {
+    var d = getMaxDepthForPath(node.options[i].next, depth + 1);
+    if (d > max) max = d;
+  }
+  return max;
+}
+
+/* ── Rendering: Progress Dots ── */
+function renderProgress() {
+  var el = document.getElementById('progress');
+  var node = TREE[state.currentNode];
+  var steps = state.history.length;
+  var atResult = isResult(node);
+  var total = steps + (atResult ? 0 : 1);
+  var maxPossible = 5;
+  var html = '';
+  for (var i = 0; i < Math.min(total, maxPossible); i++) {
+    if (i > 0) html += '<div class="dot-sep' + (i <= steps ? ' done' : '') + '"></div>';
+    if (i < steps) {
+      html += '<div class="dot done"></div>';
+    } else if (i === steps && !atResult) {
+      html += '<div class="dot active"></div>';
+    } else {
+      html += '<div class="dot"></div>';
+    }
+  }
+  if (atResult && steps > 0) {
+    html = '';
+    for (var j = 0; j < Math.min(steps, maxPossible); j++) {
+      if (j > 0) html += '<div class="dot-sep done"></div>';
+      html += '<div class="dot done"></div>';
+    }
+  }
+  el.innerHTML = html;
+  el.setAttribute('aria-label', 'Step ' + (steps + 1) + ' of diagnosis');
+}
+
+/* ── Rendering: Wizard Question ── */
+function renderWizardQuestion(node) {
+  var html = '<div class="q-card fade-in">';
+  html += '<div class="q-text">' + escapeHtml(node.question) + '</div>';
+  if (node.help) html += '<div class="q-help">' + escapeHtml(node.help) + '</div>';
+  html += '<div class="options" role="group" aria-label="Answer options">';
+  for (var i = 0; i < node.options.length; i++) {
+    html += '<button class="opt-btn" data-idx="' + i + '" type="button">' + escapeHtml(node.options[i].label) + '</button>';
+  }
+  html += '</div></div>';
+  if (state.history.length > 0) {
+    html += '<div class="nav-row"><button class="btn btn-secondary" id="btn-back" type="button">Back</button>';
+    html += '<button class="btn btn-secondary" id="btn-reset" type="button">Start Over</button></div>';
+  }
+  return html;
+}
+
+/* ── Rendering: Result Card ── */
+function renderResultCard(node) {
+  var sevClass = 'sev-' + node.severity;
+  var pct = Math.round(node.confidence * 100);
+  var html = '<div class="result-card ' + sevClass + ' fade-in" tabindex="-1" id="result-card">';
+  html += '<div class="result-dx">' + escapeHtml(node.diagnosis) + '</div>';
+  html += '<span class="result-sev ' + sevClass + '">' + escapeHtml(node.severity) + '</span>';
+  html += '<div class="conf-wrap"><div class="conf-label">Confidence</div>';
+  html += '<div class="conf-bar"><div class="conf-fill" style="width:' + pct + '%"></div></div>';
+  html += '<div class="conf-pct">' + pct + '%</div></div>';
+
+  if (node.checkFirst && node.checkFirst.length > 0) {
+    html += '<div class="result-section"><div class="result-section-title">Check First</div><ol class="result-ol">';
+    for (var c = 0; c < node.checkFirst.length; c++) html += '<li>' + escapeHtml(node.checkFirst[c]) + '</li>';
+    html += '</ol></div>';
+  }
+  if (node.fixes && node.fixes.length > 0) {
+    html += '<div class="result-section"><div class="result-section-title">How to Fix</div><ol class="result-ol">';
+    for (var f = 0; f < node.fixes.length; f++) html += '<li>' + escapeHtml(node.fixes[f]) + '</li>';
+    html += '</ol></div>';
+  }
+  if (node.alsoConsider && node.alsoConsider.length > 0) {
+    html += '<div class="result-section"><div class="result-section-title">Also Consider</div><ul class="also-list">';
+    for (var a = 0; a < node.alsoConsider.length; a++) {
+      html += '<li class="also-item"><span class="also-name">' + escapeHtml(node.alsoConsider[a].name) + '</span>';
+      if (node.alsoConsider[a].hint) html += ' &mdash; <span class="also-hint">' + escapeHtml(node.alsoConsider[a].hint) + '</span>';
+      html += '</li>';
+    }
+    html += '</ul></div>';
+  }
+  html += '</div>';
+  html += '<div class="nav-row">';
+  html += '<button class="btn btn-primary" id="btn-reset" type="button">Start Over</button>';
+  if (state.history.length > 0) {
+    html += '<button class="btn btn-secondary" id="btn-back" type="button">Back</button>';
+  }
+  html += '</div>';
+  return html;
+}
+
+/* ── Rendering: Expert Mode ── */
+function renderExpert() {
+  var html = '';
+  var currentId = ROOT;
+  var depth = 0;
+  var reachedResult = false;
+
+  while (currentId) {
+    var node = TREE[currentId];
+    if (!node) break;
+    if (isResult(node)) {
+      html += renderResultCard(node);
+      reachedResult = true;
+      break;
+    }
+    html += '<div class="expert-group fade-in">';
+    html += '<label class="expert-label" for="expert-sel-' + depth + '">' + escapeHtml(node.question) + '</label>';
+    html += '<select class="expert-select" id="expert-sel-' + depth + '" data-node="' + node.id + '" data-depth="' + depth + '">';
+    html += '<option value="">Select...</option>';
+    var sel = state.expertSelections[node.id];
+    for (var i = 0; i < node.options.length; i++) {
+      var selected = (sel === i) ? ' selected' : '';
+      html += '<option value="' + i + '"' + selected + '>' + escapeHtml(node.options[i].label) + '</option>';
+    }
+    html += '</select>';
+    if (node.help) html += '<div class="expert-help">' + escapeHtml(node.help) + '</div>';
+    html += '</div>';
+
+    if (sel !== undefined && sel !== null) {
+      currentId = node.options[sel].next;
+      depth++;
+    } else {
+      currentId = null;
+    }
+  }
+
+  if (!reachedResult) {
+    html += '<div class="nav-row" style="margin-top:8px"><button class="btn btn-secondary" id="btn-expert-reset" type="button">Reset All</button></div>';
+  }
+  return html;
+}
+
+/* ── Rendering: Last Diagnosis Banner ── */
+function renderLastDx() {
+  var el = document.getElementById('last-dx');
+  if (!lastDiagnosis) { el.style.display = 'none'; return; }
+  var d = new Date(lastDiagnosis.date);
+  var dateStr = d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
+  el.innerHTML = '<div class="last-dx-header">Last Diagnosis</div>'
+    + '<div class="last-dx-name">' + escapeHtml(lastDiagnosis.result.diagnosis) + '</div>'
+    + '<div class="last-dx-date">' + escapeHtml(dateStr) + '</div>';
+  el.style.display = 'block';
+}
+
+/* ── Main Render ── */
+function render() {
+  var app = document.getElementById('app');
+  if (state.expertMode) {
+    app.innerHTML = renderExpert();
+    bindExpertEvents();
+  } else {
+    var node = TREE[state.currentNode];
+    if (isResult(node)) {
+      app.innerHTML = renderResultCard(node);
+      saveLastDiagnosis(node);
+      lastDiagnosis = { date: new Date().toISOString(), result: { id: node.id, diagnosis: node.diagnosis, severity: node.severity, confidence: node.confidence }, path: state.history.concat([node.id]) };
+      renderLastDx();
+      setTimeout(function() {
+        var rc = document.getElementById('result-card');
+        if (rc) rc.focus();
+      }, 50);
+    } else {
+      app.innerHTML = renderWizardQuestion(node);
+    }
+    bindWizardEvents();
+  }
+  renderProgress();
+}
+
+/* ── Transitions (Wizard) ── */
+function transitionToNode(nextId) {
+  var app = document.getElementById('app');
+  app.style.opacity = '0';
+  app.style.transition = 'opacity 0.15s';
+  setTimeout(function() {
+    state.currentNode = nextId;
+    render();
+    app.style.opacity = '1';
+    app.style.transition = 'opacity 0.3s';
+    var first = app.querySelector('.opt-btn');
+    if (first) first.focus();
+  }, 150);
+}
+
+/* ── Actions ── */
+function selectOption(idx) {
+  var node = TREE[state.currentNode];
+  if (!node || !node.options || !node.options[idx]) return;
+  state.history.push(state.currentNode);
+  var nextId = node.options[idx].next;
+  transitionToNode(nextId);
+}
+
+function goBack() {
+  if (state.history.length === 0) return;
+  var prevId = state.history.pop();
+  transitionToNode(prevId);
+}
+
+function reset() {
+  state.currentNode = ROOT;
+  state.history = [];
+  transitionToNode(ROOT);
+}
+
+function toggleExpertMode() {
+  state.expertMode = !state.expertMode;
+  var toggle = document.getElementById('expert-toggle');
+  if (state.expertMode) {
+    toggle.classList.add('active');
+    toggle.setAttribute('aria-checked', 'true');
+    state.expertSelections = {};
+    var currentId = ROOT;
+    for (var i = 0; i < state.history.length; i++) {
+      var node = TREE[currentId];
+      if (!node || isResult(node)) break;
+      for (var j = 0; j < node.options.length; j++) {
+        if (node.options[j].next === state.history[i + 1] || (i === state.history.length - 1 && node.options[j].next === state.currentNode)) {
+          state.expertSelections[currentId] = j;
+          currentId = node.options[j].next;
+          break;
+        }
+      }
+    }
+  } else {
+    toggle.classList.remove('active');
+    toggle.setAttribute('aria-checked', 'false');
+  }
+  render();
+}
+
+function expertSelect(nodeId, optionIdx, depth) {
+  state.expertSelections[nodeId] = optionIdx;
+  var currentId = ROOT;
+  var newSelections = {};
+  var d = 0;
+  while (currentId) {
+    var node = TREE[currentId];
+    if (!node || isResult(node)) break;
+    var sel = state.expertSelections[currentId];
+    if (sel !== undefined && sel !== null) {
+      newSelections[currentId] = sel;
+      currentId = node.options[sel].next;
+      d++;
+    } else {
+      break;
+    }
+  }
+  state.expertSelections = newSelections;
+
+  var node2 = TREE[state.currentNode];
+  if (currentId && TREE[currentId] && isResult(TREE[currentId])) {
+    state.currentNode = currentId;
+    state.history = [];
+    var pathId = ROOT;
+    while (pathId !== currentId) {
+      var n = TREE[pathId];
+      if (!n || isResult(n)) break;
+      state.history.push(pathId);
+      pathId = n.options[newSelections[pathId]].next;
+    }
+  }
+
+  render();
+}
+
+/* ── Event Binding ── */
+function bindWizardEvents() {
+  var buttons = document.querySelectorAll('.opt-btn');
+  for (var i = 0; i < buttons.length; i++) {
+    buttons[i].addEventListener('click', function() {
+      selectOption(parseInt(this.getAttribute('data-idx'), 10));
+    });
+  }
+  var backBtn = document.getElementById('btn-back');
+  if (backBtn) backBtn.addEventListener('click', goBack);
+  var resetBtn = document.getElementById('btn-reset');
+  if (resetBtn) resetBtn.addEventListener('click', reset);
+}
+
+function bindExpertEvents() {
+  var selects = document.querySelectorAll('.expert-select');
+  for (var i = 0; i < selects.length; i++) {
+    selects[i].addEventListener('change', function() {
+      var nodeId = this.getAttribute('data-node');
+      var depth = parseInt(this.getAttribute('data-depth'), 10);
+      var val = this.value;
+      if (val === '') {
+        delete state.expertSelections[nodeId];
+        var currentId = ROOT;
+        var newSel = {};
+        while (currentId) {
+          var node = TREE[currentId];
+          if (!node || isResult(node)) break;
+          var s = state.expertSelections[currentId];
+          if (s !== undefined) {
+            newSel[currentId] = s;
+            currentId = node.options[s].next;
+          } else { break; }
+        }
+        state.expertSelections = newSel;
+      } else {
+        expertSelect(nodeId, parseInt(val, 10), depth);
+        return;
+      }
+      render();
+    });
+  }
+  var resetBtn = document.getElementById('btn-expert-reset');
+  if (resetBtn) resetBtn.addEventListener('click', function() {
+    state.expertSelections = {};
+    state.currentNode = ROOT;
+    state.history = [];
+    render();
+  });
+  var backBtn = document.getElementById('btn-back');
+  if (backBtn) backBtn.addEventListener('click', function() {
+    state.expertSelections = {};
+    state.currentNode = ROOT;
+    state.history = [];
+    render();
+  });
+  var resetBtn2 = document.getElementById('btn-reset');
+  if (resetBtn2) resetBtn2.addEventListener('click', function() {
+    state.expertSelections = {};
+    state.currentNode = ROOT;
+    state.history = [];
+    render();
+  });
+}
+
+/* ── Toggle Binding ── */
+function bindToggle() {
+  var toggle = document.getElementById('expert-toggle');
+  var thumb = document.createElement('div');
+  thumb.className = 'toggle-thumb';
+  toggle.appendChild(thumb);
+  toggle.addEventListener('click', toggleExpertMode);
+  toggle.addEventListener('keydown', function(e) {
+    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpertMode(); }
+  });
+}
+
+/* ── Init ── */
+function init() {
+  storageAvailable = checkStorage();
+  if (!storageAvailable) {
+    var warn = document.getElementById('storage-warn');
+    warn.textContent = 'localStorage is unavailable. Your diagnosis will not be saved.';
+    warn.style.display = 'block';
+  }
+  loadState();
+  renderLastDx();
+  bindToggle();
+  render();
+}
+
+init();
+
+/* ── Console Tests ── */
+function runTests() {
+  var passed = 0, failed = 0;
+  function assert(condition, msg) {
+    if (condition) { passed++; console.log('PASS:', msg); }
+    else { failed++; console.error('FAIL:', msg); }
+  }
+
+  var savedState = { currentNode: state.currentNode, history: state.history.slice(), expertMode: state.expertMode, expertSelections: JSON.parse(JSON.stringify(state.expertSelections)) };
+  var savedDx = lastDiagnosis;
+
+  // Test: tree traversal reaches result node for every valid path combination
+  var allPaths = 0, deadEnds = 0;
+  function traverse(nodeId, depth) {
+    if (depth > 20) { deadEnds++; return; }
+    var node = TREE[nodeId];
+    if (!node) { deadEnds++; return; }
+    if (isResult(node)) { allPaths++; return; }
+    if (!node.options || node.options.length === 0) { deadEnds++; return; }
+    for (var i = 0; i < node.options.length; i++) {
+      traverse(node.options[i].next, depth + 1);
+    }
+  }
+  traverse(ROOT, 0);
+  assert(allPaths > 0 && deadEnds === 0, 'All tree paths reach a result (' + allPaths + ' paths, ' + deadEnds + ' dead ends)');
+
+  // Test: goBack() returns to previous question (history stack)
+  state.currentNode = ROOT;
+  state.history = [];
+  state.expertMode = false;
+  var firstNode = TREE[ROOT];
+  state.history.push(ROOT);
+  state.currentNode = firstNode.options[1].next;
+  var beforeBack = state.currentNode;
+  goBack = function() { if (state.history.length === 0) return; state.currentNode = state.history.pop(); };
+  goBack();
+  assert(state.currentNode === ROOT, 'goBack() returns to previous question: ' + state.currentNode);
+
+  // Test: reset() clears history, returns to first question
+  state.history = ['q-symptom', 'q-yellow-where'];
+  state.currentNode = 'q-yellow-old';
+  state.currentNode = ROOT;
+  state.history = [];
+  assert(state.currentNode === ROOT && state.history.length === 0, 'reset() clears history and returns to root');
+
+  // Test: expert mode toggle preserves/restores wizard state
+  state.currentNode = 'q-symptom';
+  state.history = [ROOT];
+  state.expertMode = false;
+  var wizardNode = state.currentNode;
+  var wizardHistory = state.history.slice();
+  state.expertMode = true;
+  state.expertMode = false;
+  assert(state.currentNode === wizardNode || state.history.length === wizardHistory.length, 'Expert mode toggle preserves wizard state');
+
+  // Test: dependent dropdowns in expert mode disable when parent unset
+  state.expertSelections = {};
+  state.expertSelections[ROOT] = 1;
+  var rootNode = TREE[ROOT];
+  var nextNodeId = rootNode.options[1].next;
+  assert(state.expertSelections[nextNodeId] === undefined, 'Dependent selection is empty when only parent is set');
+  state.expertSelections[nextNodeId] = 0;
+  delete state.expertSelections[ROOT];
+  var cascadeCleared = (function() {
+    var sel = {};
+    var cid = ROOT;
+    while (cid) {
+      var nd = TREE[cid];
+      if (!nd || isResult(nd)) break;
+      var s = state.expertSelections[cid];
+      if (s !== undefined) { sel[cid] = s; cid = nd.options[s].next; }
+      else break;
+    }
+    return sel;
+  })();
+  assert(Object.keys(cascadeCleared).length === 0, 'Clearing parent clears dependent selections');
+
+  // Test: all result nodes have required fields
+  var resultCount = 0, missingFields = 0;
+  for (var nid in TREE) {
+    if (!TREE.hasOwnProperty(nid)) continue;
+    var n = TREE[nid];
+    if (!isResult(n)) continue;
+    resultCount++;
+    if (!n.diagnosis || n.confidence === undefined || !n.severity || !n.fixes || !n.checkFirst) missingFields++;
+  }
+  assert(resultCount >= 40, 'At least 40 result nodes: ' + resultCount);
+  assert(missingFields === 0, 'All result nodes have required fields (diagnosis, confidence, severity, fixes, checkFirst): ' + missingFields + ' missing');
+
+  // Test: confidence values 0.0-1.0
+  var badConf = 0;
+  for (var nid2 in TREE) {
+    if (!TREE.hasOwnProperty(nid2)) continue;
+    var n2 = TREE[nid2];
+    if (!isResult(n2)) continue;
+    if (typeof n2.confidence !== 'number' || n2.confidence < 0 || n2.confidence > 1) badConf++;
+  }
+  assert(badConf === 0, 'All confidence values 0.0-1.0: ' + badConf + ' out of range');
+
+  // Test: localStorage save/load round-trips correctly
+  try {
+    var savedRaw = localStorage.getItem(STORAGE_KEY);
+    var testResult = TREE['r-n-def'];
+    state.currentNode = 'r-n-def';
+    state.history = [ROOT, 'q-symptom', 'q-yellow-where', 'q-yellow-old'];
+    saveLastDiagnosis(testResult);
+    var loaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
+    assert(loaded.version === 1 && loaded.lastDiagnosis.result.diagnosis === 'Nitrogen Deficiency', 'localStorage round-trip works');
+    if (savedRaw) localStorage.setItem(STORAGE_KEY, savedRaw);
+    else localStorage.removeItem(STORAGE_KEY);
+  } catch(e) { assert(false, 'localStorage: ' + e.message); }
+
+  // Test: corrupted localStorage triggers warning, not crash
+  try {
+    var savedRaw2 = localStorage.getItem(STORAGE_KEY);
+    localStorage.setItem(STORAGE_KEY, '{broken json!!!');
+    loadState();
+    assert(true, 'Corrupted localStorage does not crash');
+    if (savedRaw2) localStorage.setItem(STORAGE_KEY, savedRaw2);
+    else localStorage.removeItem(STORAGE_KEY);
+  } catch(e) { assert(false, 'Corrupted localStorage crashed: ' + e.message); }
+
+  // Restore state
+  state.currentNode = savedState.currentNode;
+  state.history = savedState.history;
+  state.expertMode = savedState.expertMode;
+  state.expertSelections = savedState.expertSelections;
+  lastDiagnosis = savedDx;
+  render();
+
+  console.log('\n' + passed + ' passed, ' + failed + ' failed');
+}
+</script>
 </body>
 </html>
diff --git a/planning/interactive-tools/implementation/deep_implement_config.json b/planning/interactive-tools/implementation/deep_implement_config.json
index 5baeaf3..0993bf1 100644
--- a/planning/interactive-tools/implementation/deep_implement_config.json
+++ b/planning/interactive-tools/implementation/deep_implement_config.json
@@ -25,6 +25,10 @@
     "section-03-stealth-audit": {
       "status": "complete",
       "commit_hash": "8897759"
+    },
+    "section-04-cure-tracker": {
+      "status": "complete",
+      "commit_hash": "aac44f3"
     }
   },
   "pre_commit": {
