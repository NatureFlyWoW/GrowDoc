diff --git a/docs/plant-doctor-data.js b/docs/plant-doctor-data.js
new file mode 100644
index 0000000..9be9835
--- /dev/null
+++ b/docs/plant-doctor-data.js
@@ -0,0 +1,494 @@
+/* ═══════════════════════════════════════════════════════════ */
+/* Plant Doctor v2 — Knowledge Base Data                      */
+/* Loaded before inline script via <script src>               */
+/* ═══════════════════════════════════════════════════════════ */
+
+/* ── Helper: condition factory for REFINE_RULES ── */
+function diagnosesInclude(ids) {
+  return function(topDiagnoses) {
+    var found = {};
+    for (var i = 0; i < topDiagnoses.length; i++) {
+      for (var j = 0; j < ids.length; j++) {
+        if (topDiagnoses[i].resultId === ids[j] && topDiagnoses[i].score >= 0.25) {
+          found[ids[j]] = true;
+        }
+      }
+    }
+    for (var k = 0; k < ids.length; k++) {
+      if (!found[ids[k]]) return false;
+    }
+    return true;
+  };
+}
+
+/* ═══════════════════════════════════════════════════════════ */
+/* SYMPTOMS Registry — 34 entries                             */
+/* ═══════════════════════════════════════════════════════════ */
+var SYMPTOMS = {
+  /* — Leaves (21) — */
+  'yellow-lower':        { id: 'yellow-lower',        label: 'Yellowing on lower/older leaves',                    region: 'leaves', group: 'discoloration' },
+  'yellow-upper':        { id: 'yellow-upper',        label: 'Yellowing on upper/newer leaves',                    region: 'leaves', group: 'discoloration' },
+  'yellow-tips':         { id: 'yellow-tips',         label: 'Uniform yellow, starting from tips',                 region: 'leaves', group: 'discoloration' },
+  'interveinal-lower':   { id: 'interveinal-lower',   label: 'Yellow between veins on lower leaves',               region: 'leaves', group: 'discoloration' },
+  'yellow-purple-stems': { id: 'yellow-purple-stems', label: 'Yellowing with purple stems',                        region: 'leaves', group: 'discoloration' },
+  'yellow-brown-spots':  { id: 'yellow-brown-spots',  label: 'Yellowing with brown spots',                         region: 'leaves', group: 'discoloration' },
+  'pale-overall':        { id: 'pale-overall',        label: 'Pale / light green overall',                         region: 'leaves', group: 'discoloration' },
+  'interveinal-upper':   { id: 'interveinal-upper',   label: 'Yellow between veins, veins stay dark (new growth)', region: 'leaves', group: 'discoloration' },
+  'yellow-tip-edge':     { id: 'yellow-tip-edge',     label: 'Yellow tips and edges',                              region: 'leaves', group: 'discoloration' },
+  'twisted-new-growth':  { id: 'twisted-new-growth',  label: 'New growth twisted or distorted',                    region: 'leaves', group: 'deformation' },
+  'brown-tips':          { id: 'brown-tips',          label: 'Brown / burnt leaf tips',                            region: 'leaves', group: 'damage' },
+  'spots-random':        { id: 'spots-random',        label: 'Random brown spots on leaves',                       region: 'leaves', group: 'damage' },
+  'spots-circular':      { id: 'spots-circular',      label: 'Well-defined circular spots',                        region: 'leaves', group: 'damage' },
+  'speckling':           { id: 'speckling',           label: 'Tiny white or yellow speckling',                     region: 'leaves', group: 'surface' },
+  'curling-up':          { id: 'curling-up',          label: 'Leaves curling upward (taco-ing)',                   region: 'leaves', group: 'deformation' },
+  'curling-down':        { id: 'curling-down',        label: 'Leaves curling downward (clawing)',                  region: 'leaves', group: 'deformation' },
+  'curling-edges':       { id: 'curling-edges',       label: 'Edges curling inward',                              region: 'leaves', group: 'deformation' },
+  'leaves-dry-crispy':   { id: 'leaves-dry-crispy',   label: 'Leaves feel dry or crispy',                          region: 'leaves', group: 'damage' },
+  'dark-green-waxy':     { id: 'dark-green-waxy',     label: 'Very dark green, shiny/waxy leaves',                 region: 'leaves', group: 'surface' },
+  'bleached-tops':       { id: 'bleached-tops',       label: 'Bleached/white tops near light',                     region: 'leaves', group: 'damage' },
+  'white-powder':        { id: 'white-powder',        label: 'White powdery coating on leaf surfaces',             region: 'leaves', group: 'surface' },
+
+  /* — Stems (3) — */
+  'stem-purple':         { id: 'stem-purple',         label: 'Purple stems or leaves',                             region: 'stems', group: 'discoloration' },
+  'red-petioles':        { id: 'red-petioles',        label: 'Red or pink leaf stems (petioles)',                  region: 'stems', group: 'discoloration' },
+  'stem-narrowing':      { id: 'stem-narrowing',      label: 'Stem narrowing at soil line',                        region: 'stems', group: 'structure' },
+
+  /* — Roots (2) — */
+  'root-brown':          { id: 'root-brown',          label: 'Brown/slimy roots',                                  region: 'roots', group: 'root-health' },
+  'root-smell':          { id: 'root-smell',          label: 'Foul smell from root zone',                          region: 'roots', group: 'root-health' },
+
+  /* — Whole Plant (8) — */
+  'yellow-whole':        { id: 'yellow-whole',        label: 'Yellowing across the whole plant',                   region: 'whole', group: 'discoloration' },
+  'drooping':            { id: 'drooping',            label: 'Drooping / wilting',                                 region: 'whole', group: 'structure' },
+  'stunted-growth':      { id: 'stunted-growth',      label: 'Stunted or slow growth',                             region: 'whole', group: 'structure' },
+  'stretching':          { id: 'stretching',          label: 'Tall and leggy (stretching)',                        region: 'whole', group: 'structure' },
+  'dark-green':          { id: 'dark-green',          label: 'Very dark green leaves overall',                     region: 'whole', group: 'discoloration' },
+  'rusty-edges':         { id: 'rusty-edges',         label: 'Rusty / bronze on leaf edges',                       region: 'whole', group: 'damage' },
+  'webbing':             { id: 'webbing',             label: 'Webbing between leaves',                             region: 'whole', group: 'surface' },
+  'white-residue':       { id: 'white-residue',       label: 'White residue on pot or soil surface',               region: 'whole', group: 'surface' }
+};
+
+/* ═══════════════════════════════════════════════════════════ */
+/* SCORING Map — 44 entries (one per TREE result node)        */
+/* ═══════════════════════════════════════════════════════════ */
+var SCORING = {
+
+  /* ── Deficiencies ── */
+
+  'r-n-def': {
+    symptoms: { 'yellow-lower': 0.9, 'yellow-tips': 0.85, 'pale-overall': 0.4, 'yellow-whole': 0.3, 'stunted-growth': 0.2 },
+    stage_modifier: { 'late-flower': -0.3 },
+    base_confidence: 0.85
+  },
+  'r-p-def': {
+    symptoms: { 'yellow-purple-stems': 0.9, 'stem-purple': 0.8, 'red-petioles': 0.7, 'yellow-lower': 0.5, 'dark-green': 0.3, 'stunted-growth': 0.3 },
+    stage_modifier: { 'early-flower': 0.1 },
+    base_confidence: 0.80
+  },
+  'r-k-def': {
+    symptoms: { 'rusty-edges': 0.9, 'brown-tips': 0.8, 'curling-edges': 0.6, 'leaves-dry-crispy': 0.5, 'yellow-tip-edge': 0.4 },
+    stage_modifier: { 'mid-flower': 0.1, 'late-flower': 0.1 },
+    base_confidence: 0.80
+  },
+  'r-ca-def': {
+    symptoms: { 'yellow-brown-spots': 0.85, 'spots-random': 0.8, 'brown-tips': 0.3, 'stunted-growth': 0.3 },
+    base_confidence: 0.78
+  },
+  'r-ca-def-new': {
+    symptoms: { 'twisted-new-growth': 0.9, 'yellow-upper': 0.7, 'yellow-tip-edge': 0.5, 'stunted-growth': 0.4 },
+    base_confidence: 0.75
+  },
+  'r-mg-def': {
+    symptoms: { 'interveinal-lower': 0.9, 'yellow-lower': 0.6, 'yellow-whole': 0.3 },
+    base_confidence: 0.85
+  },
+  'r-mg-def-spots': {
+    symptoms: { 'spots-random': 0.8, 'interveinal-lower': 0.7, 'yellow-lower': 0.5 },
+    base_confidence: 0.75
+  },
+  'r-fe-def': {
+    symptoms: { 'interveinal-upper': 0.9, 'yellow-upper': 0.7, 'pale-overall': 0.4 },
+    base_confidence: 0.80
+  },
+  'r-s-def': {
+    symptoms: { 'pale-overall': 0.85, 'yellow-upper': 0.7, 'stunted-growth': 0.3 },
+    base_confidence: 0.75
+  },
+  'r-ca-mg': {
+    symptoms: { 'rusty-edges': 0.8, 'spots-random': 0.6, 'interveinal-lower': 0.5, 'yellow-brown-spots': 0.5, 'stunted-growth': 0.3 },
+    base_confidence: 0.75
+  },
+
+  /* ── Toxicities ── */
+
+  'r-n-tox': {
+    symptoms: { 'dark-green-waxy': 0.9, 'curling-down': 0.85, 'dark-green': 0.7, 'stunted-growth': 0.3 },
+    stage_modifier: { 'early-flower': 0.1, 'mid-flower': 0.15 },
+    base_confidence: 0.85
+  },
+  'r-nute-burn-mild': {
+    symptoms: { 'brown-tips': 0.9, 'yellow-tip-edge': 0.3 },
+    base_confidence: 0.90
+  },
+  'r-nute-burn-severe': {
+    symptoms: { 'brown-tips': 0.85, 'leaves-dry-crispy': 0.8, 'yellow-tip-edge': 0.6, 'curling-edges': 0.5 },
+    base_confidence: 0.85
+  },
+
+  /* ── Environmental ── */
+
+  'r-heat-stress': {
+    symptoms: { 'curling-up': 0.9, 'leaves-dry-crispy': 0.7, 'drooping': 0.4, 'brown-tips': 0.3 },
+    base_confidence: 0.80
+  },
+  'r-heat-light': {
+    symptoms: { 'curling-up': 0.8, 'bleached-tops': 0.8, 'leaves-dry-crispy': 0.6, 'yellow-upper': 0.5, 'twisted-new-growth': 0.2 },
+    base_confidence: 0.80
+  },
+  'r-light-burn': {
+    symptoms: { 'bleached-tops': 0.95, 'yellow-upper': 0.4, 'leaves-dry-crispy': 0.3 },
+    base_confidence: 0.90
+  },
+  'r-light-too-close': {
+    symptoms: { 'curling-up': 0.8, 'bleached-tops': 0.6, 'leaves-dry-crispy': 0.5 },
+    base_confidence: 0.82
+  },
+  'r-overwater': {
+    symptoms: { 'drooping': 0.9, 'curling-down': 0.5, 'yellow-lower': 0.3, 'root-smell': 0.15 },
+    base_confidence: 0.85
+  },
+  'r-overwater-yellow': {
+    symptoms: { 'drooping': 0.7, 'yellow-whole': 0.7, 'curling-down': 0.5, 'yellow-lower': 0.5, 'root-brown': 0.3 },
+    base_confidence: 0.78
+  },
+  'r-underwater': {
+    symptoms: { 'drooping': 0.9, 'leaves-dry-crispy': 0.7, 'curling-edges': 0.3 },
+    base_confidence: 0.90
+  },
+  'r-wind-burn': {
+    symptoms: { 'curling-edges': 0.9, 'curling-up': 0.3, 'leaves-dry-crispy': 0.3 },
+    base_confidence: 0.75
+  },
+  'r-low-humidity': {
+    symptoms: { 'curling-edges': 0.7, 'brown-tips': 0.6, 'leaves-dry-crispy': 0.6 },
+    base_confidence: 0.75
+  },
+
+  /* ── pH Related ── */
+
+  'r-ph-lockout': {
+    symptoms: { 'yellow-tip-edge': 0.7, 'interveinal-upper': 0.6, 'yellow-whole': 0.5, 'spots-random': 0.4, 'brown-tips': 0.3, 'stunted-growth': 0.3 },
+    base_confidence: 0.82
+  },
+  'r-ph-lockout-feed': {
+    symptoms: { 'yellow-whole': 0.7, 'drooping': 0.5, 'yellow-tip-edge': 0.5, 'brown-tips': 0.3, 'stunted-growth': 0.3 },
+    base_confidence: 0.78
+  },
+  'r-ph-drift': {
+    symptoms: { 'yellow-whole': 0.7, 'yellow-lower': 0.5, 'yellow-tips': 0.2, 'stunted-growth': 0.3 },
+    base_confidence: 0.72
+  },
+  'r-ph-flux': {
+    symptoms: { 'spots-random': 0.7, 'yellow-whole': 0.4, 'brown-tips': 0.3, 'stunted-growth': 0.2 },
+    base_confidence: 0.70
+  },
+
+  /* ── Pests / Disease ── */
+
+  'r-pm': {
+    symptoms: { 'white-powder': 0.95, 'spots-circular': 0.2 },
+    base_confidence: 0.90
+  },
+  'r-wpm-early': {
+    symptoms: { 'white-powder': 0.85, 'speckling': 0.3 },
+    base_confidence: 0.70
+  },
+  'r-fungal': {
+    symptoms: { 'spots-circular': 0.9, 'spots-random': 0.5, 'yellow-brown-spots': 0.3 },
+    base_confidence: 0.72
+  },
+  'r-root-rot': {
+    symptoms: { 'root-brown': 0.9, 'root-smell': 0.9, 'drooping': 0.7, 'yellow-whole': 0.3, 'stunted-growth': 0.3, 'stem-narrowing': 0.1 },
+    base_confidence: 0.75
+  },
+  'r-pest-mites': {
+    symptoms: { 'speckling': 0.9, 'webbing': 0.85, 'spots-random': 0.3 },
+    base_confidence: 0.78
+  },
+
+  /* ── Seedling Specific ── */
+
+  'r-stretching': {
+    symptoms: { 'stretching': 0.95, 'pale-overall': 0.2 },
+    stage_modifier: { 'seedling': 0.1 },
+    base_confidence: 0.92
+  },
+  'r-damping-off': {
+    symptoms: { 'stem-narrowing': 0.95, 'drooping': 0.5 },
+    stage_modifier: { 'seedling': 0.2 },
+    base_confidence: 0.85
+  },
+  'r-seedling-overwater': {
+    symptoms: { 'drooping': 0.8, 'yellow-lower': 0.3, 'pale-overall': 0.3 },
+    stage_modifier: { 'seedling': 0.1 },
+    base_confidence: 0.85
+  },
+  'r-cotyledon-normal': {
+    symptoms: { 'yellow-lower': 0.7, 'pale-overall': 0.3 },
+    stage_modifier: { 'seedling': 0.2 },
+    base_confidence: 0.92
+  },
+  'r-seedling-nute': {
+    symptoms: { 'brown-tips': 0.7, 'yellow-upper': 0.6, 'yellow-tip-edge': 0.5 },
+    stage_modifier: { 'seedling': 0.2 },
+    base_confidence: 0.80
+  },
+  'r-light-distance': {
+    symptoms: { 'stretching': 0.8, 'pale-overall': 0.8 },
+    stage_modifier: { 'seedling': 0.2 },
+    base_confidence: 0.82
+  },
+
+  /* ── Normal / Benign ── */
+
+  'r-natural-fade': {
+    symptoms: { 'yellow-lower': 0.8, 'yellow-whole': 0.6, 'pale-overall': 0.4 },
+    stage_modifier: { 'late-flower': 0.3, 'mid-flower': 0.1, 'seedling': -0.5, 'veg': -0.5 },
+    base_confidence: 0.90
+  },
+  'r-trichomes': {
+    symptoms: { 'white-powder': 0.5, 'speckling': 0.2 },
+    stage_modifier: { 'mid-flower': 0.2, 'late-flower': 0.3 },
+    base_confidence: 0.95
+  },
+  'r-mineral': {
+    symptoms: { 'white-residue': 0.9, 'stunted-growth': 0.1 },
+    base_confidence: 0.82
+  },
+  'r-cold-purple': {
+    symptoms: { 'stem-purple': 0.8, 'red-petioles': 0.3, 'yellow-purple-stems': 0.2 },
+    base_confidence: 0.80
+  },
+  'r-normal-veg': {
+    symptoms: { 'dark-green': 0.8, 'dark-green-waxy': 0.3 },
+    stage_modifier: { 'veg': 0.1 },
+    base_confidence: 0.92
+  },
+  'r-normal-transpiration': {
+    symptoms: { 'drooping': 0.8, 'leaves-dry-crispy': 0.1 },
+    base_confidence: 0.90
+  },
+  'r-transplant': {
+    symptoms: { 'drooping': 0.8, 'stunted-growth': 0.3, 'yellow-lower': 0.2 },
+    base_confidence: 0.85
+  }
+};
+
+/* ═══════════════════════════════════════════════════════════ */
+/* REFINE_RULES — 20 disambiguation rules                     */
+/* ═══════════════════════════════════════════════════════════ */
+var REFINE_RULES = [
+  {
+    id: 'rule-n-vs-fade',
+    condition: diagnosesInclude(['r-n-def', 'r-natural-fade']),
+    question: 'How far into flowering are you?',
+    help: 'Helps distinguish natural late-flower fade from nitrogen deficiency.',
+    options: [
+      { label: 'Week 7+', adjust: { 'r-natural-fade': 0.3, 'r-n-def': -0.2 } },
+      { label: 'Before week 7', adjust: { 'r-natural-fade': -0.4, 'r-n-def': 0.1 } }
+    ]
+  },
+  {
+    id: 'rule-overwater-vs-rootrot',
+    condition: diagnosesInclude(['r-overwater', 'r-root-rot']),
+    question: 'Have you checked the roots? Any foul smell?',
+    help: 'Root rot has a distinct sour/rotten smell. Overwatering alone does not.',
+    options: [
+      { label: 'Yes, roots are brown/slimy with smell', adjust: { 'r-root-rot': 0.3, 'r-overwater': -0.2 } },
+      { label: 'Roots look white, no smell', adjust: { 'r-root-rot': -0.4, 'r-overwater': 0.1 } },
+      { label: 'Haven\'t checked', adjust: { 'r-root-rot': 0.0, 'r-overwater': 0.0 } }
+    ]
+  },
+  {
+    id: 'rule-ph-vs-multi-def',
+    condition: diagnosesInclude(['r-ph-lockout', 'r-ca-def']),
+    question: 'What is your current runoff pH?',
+    help: 'pH lockout mimics multiple deficiencies at once.',
+    options: [
+      { label: 'Below 5.5 or above 7.0', adjust: { 'r-ph-lockout': 0.3, 'r-ca-def': -0.15 } },
+      { label: '5.8\u20136.5 (normal range)', adjust: { 'r-ph-lockout': -0.3, 'r-ca-def': 0.15 } },
+      { label: 'Not sure / no meter', adjust: { 'r-ph-lockout': 0.1, 'r-ca-def': 0.0 } }
+    ]
+  },
+  {
+    id: 'rule-heat-vs-light',
+    condition: diagnosesInclude(['r-heat-stress', 'r-light-burn']),
+    question: 'How close is your light to the canopy?',
+    help: 'Light burn affects the top first; heat stress can affect the whole plant.',
+    options: [
+      { label: 'Very close (under 12 inches)', adjust: { 'r-light-burn': 0.3, 'r-heat-stress': -0.1 } },
+      { label: 'Normal distance (12\u201324 inches)', adjust: { 'r-light-burn': -0.3, 'r-heat-stress': 0.15 } }
+    ]
+  },
+  {
+    id: 'rule-n-tox-vs-overwater',
+    condition: diagnosesInclude(['r-n-tox', 'r-overwater']),
+    question: 'What color are the drooping leaves?',
+    help: 'Nitrogen toxicity produces very dark, shiny leaves. Overwatering leaves stay normal green.',
+    options: [
+      { label: 'Very dark green, shiny/waxy', adjust: { 'r-n-tox': 0.3, 'r-overwater': -0.2 } },
+      { label: 'Normal green, just droopy', adjust: { 'r-n-tox': -0.3, 'r-overwater': 0.2 } }
+    ]
+  },
+  {
+    id: 'rule-ca-vs-mg',
+    condition: diagnosesInclude(['r-ca-def', 'r-mg-def']),
+    question: 'Which leaves are most affected?',
+    help: 'Calcium is immobile (shows on new growth). Magnesium is mobile (shows on old growth).',
+    options: [
+      { label: 'Newer / upper leaves', adjust: { 'r-ca-def': 0.25, 'r-mg-def': -0.2 } },
+      { label: 'Older / lower leaves', adjust: { 'r-ca-def': -0.2, 'r-mg-def': 0.25 } },
+      { label: 'Throughout the plant', adjust: { 'r-ca-def': 0.0, 'r-mg-def': 0.0 } }
+    ]
+  },
+  {
+    id: 'rule-nute-burn-severity',
+    condition: diagnosesInclude(['r-nute-burn-mild', 'r-nute-burn-severe']),
+    question: 'How far has the burn progressed?',
+    help: 'Mild burn stays at the very tip; severe burn moves inward along leaf margins.',
+    options: [
+      { label: 'Just the very tips (1\u20132 mm)', adjust: { 'r-nute-burn-mild': 0.2, 'r-nute-burn-severe': -0.3 } },
+      { label: 'Tips AND margins, some crispy', adjust: { 'r-nute-burn-mild': -0.3, 'r-nute-burn-severe': 0.2 } }
+    ]
+  },
+  {
+    id: 'rule-curl-cause',
+    condition: diagnosesInclude(['r-heat-stress', 'r-wind-burn']),
+    question: 'Are fans blowing directly on the affected leaves?',
+    help: 'Wind burn causes localized curling where airflow hits. Heat stress is more uniform.',
+    options: [
+      { label: 'Yes, direct constant airflow', adjust: { 'r-wind-burn': 0.3, 'r-heat-stress': -0.15 } },
+      { label: 'No, fans are oscillating or distant', adjust: { 'r-wind-burn': -0.3, 'r-heat-stress': 0.15 } }
+    ]
+  },
+  {
+    id: 'rule-spots-cause',
+    condition: diagnosesInclude(['r-fungal', 'r-ca-def']),
+    question: 'What do the spots look like up close?',
+    help: 'Fungal spots have concentric rings. Calcium spots have yellow halos.',
+    options: [
+      { label: 'Circular with rings or fuzzy edges', adjust: { 'r-fungal': 0.3, 'r-ca-def': -0.2 } },
+      { label: 'Brown with yellow halo around them', adjust: { 'r-fungal': -0.25, 'r-ca-def': 0.3 } }
+    ]
+  },
+  {
+    id: 'rule-pm-vs-trichomes',
+    condition: diagnosesInclude(['r-pm', 'r-trichomes']),
+    question: 'Where is the white substance and does it wipe off?',
+    help: 'Powdery mildew wipes off and appears on fan leaves. Trichomes are on buds and sugar leaves.',
+    options: [
+      { label: 'On fan leaves, wipes off easily', adjust: { 'r-pm': 0.3, 'r-trichomes': -0.3 } },
+      { label: 'On buds/sugar leaves, part of the plant', adjust: { 'r-pm': -0.4, 'r-trichomes': 0.2 } }
+    ]
+  },
+  {
+    id: 'rule-ph-lockout-type',
+    condition: diagnosesInclude(['r-ph-lockout', 'r-ph-lockout-feed']),
+    question: 'When did the symptoms start?',
+    help: 'Post-feeding lockout appears within 24\u201348 hours of a feed change.',
+    options: [
+      { label: 'Right after changing feed or dose', adjust: { 'r-ph-lockout-feed': 0.25, 'r-ph-lockout': -0.1 } },
+      { label: 'Gradual, over several waterings', adjust: { 'r-ph-lockout-feed': -0.25, 'r-ph-lockout': 0.15 } }
+    ]
+  },
+  {
+    id: 'rule-seedling-droop',
+    condition: diagnosesInclude(['r-seedling-overwater', 'r-transplant']),
+    question: 'Was the seedling recently transplanted?',
+    help: 'Transplant shock resolves in 2\u20135 days. Overwatering persists until soil dries.',
+    options: [
+      { label: 'Yes, transplanted in last 3 days', adjust: { 'r-transplant': 0.3, 'r-seedling-overwater': -0.2 } },
+      { label: 'No, been in this pot for a while', adjust: { 'r-transplant': -0.35, 'r-seedling-overwater': 0.2 } }
+    ]
+  },
+  {
+    id: 'rule-yellow-speed',
+    condition: diagnosesInclude(['r-ph-drift', 'r-overwater-yellow']),
+    question: 'How fast did the yellowing progress?',
+    help: 'pH drift causes slow yellowing over weeks. Overwater lockout progresses in days.',
+    options: [
+      { label: 'Slowly over 1\u20132 weeks', adjust: { 'r-ph-drift': 0.25, 'r-overwater-yellow': -0.2 } },
+      { label: 'Fast, within a few days', adjust: { 'r-ph-drift': -0.25, 'r-overwater-yellow': 0.2 } }
+    ]
+  },
+  {
+    id: 'rule-dark-green',
+    condition: diagnosesInclude(['r-n-tox', 'r-normal-veg']),
+    question: 'What is the leaf texture like?',
+    help: 'Nitrogen toxicity makes leaves shiny, waxy, and clawing. Normal veg leaves are flat.',
+    options: [
+      { label: 'Shiny/waxy and clawing down', adjust: { 'r-n-tox': 0.3, 'r-normal-veg': -0.3 } },
+      { label: 'Normal texture, flat, healthy', adjust: { 'r-n-tox': -0.35, 'r-normal-veg': 0.2 } }
+    ]
+  },
+  {
+    id: 'rule-interveinal-location',
+    condition: diagnosesInclude(['r-mg-def', 'r-fe-def']),
+    question: 'Which leaves show the interveinal yellowing?',
+    help: 'Magnesium shows on older leaves (mobile). Iron shows on newer leaves (immobile).',
+    options: [
+      { label: 'Older / lower leaves', adjust: { 'r-mg-def': 0.25, 'r-fe-def': -0.2 } },
+      { label: 'Newer / upper leaves', adjust: { 'r-mg-def': -0.2, 'r-fe-def': 0.25 } }
+    ]
+  },
+  {
+    id: 'rule-k-vs-nute-burn',
+    condition: diagnosesInclude(['r-k-def', 'r-nute-burn-severe']),
+    question: 'Are you feeding above the recommended dose?',
+    help: 'Nutrient burn comes from excess feed. K deficiency comes from insufficient potassium.',
+    options: [
+      { label: 'Yes, running hot feed / high EC', adjust: { 'r-nute-burn-severe': 0.25, 'r-k-def': -0.2 } },
+      { label: 'No, feeding at or below recommended', adjust: { 'r-nute-burn-severe': -0.25, 'r-k-def': 0.2 } }
+    ]
+  },
+  {
+    id: 'rule-underwater-vs-overwater',
+    condition: diagnosesInclude(['r-underwater', 'r-overwater']),
+    question: 'How heavy is the pot right now?',
+    help: 'The single best diagnostic: heavy pot = overwatering, light pot = underwatering.',
+    options: [
+      { label: 'Very light / bone dry', adjust: { 'r-underwater': 0.35, 'r-overwater': -0.35 } },
+      { label: 'Heavy / saturated', adjust: { 'r-underwater': -0.35, 'r-overwater': 0.35 } }
+    ]
+  },
+  {
+    id: 'rule-stretching-cause',
+    condition: diagnosesInclude(['r-stretching', 'r-light-distance']),
+    question: 'Is the seedling also pale or just tall?',
+    help: 'Pale + tall suggests insufficient light intensity. Just tall may be light distance or genetics.',
+    options: [
+      { label: 'Pale/yellow AND stretching', adjust: { 'r-light-distance': 0.25, 'r-stretching': -0.1 } },
+      { label: 'Healthy green but tall/leggy', adjust: { 'r-light-distance': -0.15, 'r-stretching': 0.15 } }
+    ]
+  },
+  {
+    id: 'rule-ca-def-location',
+    condition: diagnosesInclude(['r-ca-def', 'r-ca-def-new']),
+    question: 'Is the spotting/damage on new or old growth?',
+    help: 'Calcium is immobile \u2014 deficiency always shows on newest growth first.',
+    options: [
+      { label: 'New growth (twisted, distorted tips)', adjust: { 'r-ca-def-new': 0.25, 'r-ca-def': -0.15 } },
+      { label: 'Older leaves (spots with halos)', adjust: { 'r-ca-def-new': -0.2, 'r-ca-def': 0.2 } }
+    ]
+  },
+  {
+    id: 'rule-humidity-vs-k',
+    condition: diagnosesInclude(['r-low-humidity', 'r-k-def']),
+    question: 'What is your current RH (relative humidity)?',
+    help: 'Low humidity causes crispy edges from excessive transpiration. K deficiency progresses regardless of RH.',
+    options: [
+      { label: 'Below 40% RH', adjust: { 'r-low-humidity': 0.3, 'r-k-def': -0.15 } },
+      { label: '40\u201360% RH (normal range)', adjust: { 'r-low-humidity': -0.3, 'r-k-def': 0.2 } }
+    ]
+  }
+];
diff --git a/docs/tool-plant-doctor.html b/docs/tool-plant-doctor.html
index c41195b..e0018be 100644
--- a/docs/tool-plant-doctor.html
+++ b/docs/tool-plant-doctor.html
@@ -202,6 +202,7 @@ h1 { font-family: var(--serif); font-size: 1.8rem; color: var(--accent); margin-
 <div class="progress" id="progress" role="img" aria-label="Diagnosis progress"></div>
 <div id="app" aria-live="polite"></div>
 
+<script src="plant-doctor-data.js"></script>
 <script>
 /* ── Helpers ── */
 function escapeHtml(s) {
@@ -1200,6 +1201,122 @@ function runTests() {
     else localStorage.removeItem(STORAGE_KEY);
   } catch(e) { assert(false, 'Corrupted localStorage crashed: ' + e.message); }
 
+  // ── Section 01: Knowledge Base Data File Tests ──
+
+  // Test: SYMPTOMS is defined and is an object with at least 25 entries
+  assert(typeof SYMPTOMS === 'object' && SYMPTOMS !== null, 'SYMPTOMS is defined as an object');
+  var symptomCount = Object.keys(SYMPTOMS).length;
+  assert(symptomCount >= 25, 'SYMPTOMS has at least 25 entries (found ' + symptomCount + ')');
+
+  // Test: Every SYMPTOMS entry has required fields: id, label, region, group
+  var symptomMissingFields = 0;
+  for (var sId in SYMPTOMS) {
+    if (!SYMPTOMS.hasOwnProperty(sId)) continue;
+    var sym = SYMPTOMS[sId];
+    if (!sym.id || !sym.label || !sym.region || !sym.group) symptomMissingFields++;
+    if (sym.id !== sId) symptomMissingFields++; // id must match key
+  }
+  assert(symptomMissingFields === 0, 'All SYMPTOMS have id, label, region, group (' + symptomMissingFields + ' missing)');
+
+  // Test: Every SYMPTOMS region is one of the allowed values
+  var validRegions = { leaves: 1, stems: 1, roots: 1, whole: 1 };
+  var badRegionCount = 0;
+  for (var sId2 in SYMPTOMS) {
+    if (!SYMPTOMS.hasOwnProperty(sId2)) continue;
+    if (!validRegions[SYMPTOMS[sId2].region]) badRegionCount++;
+  }
+  assert(badRegionCount === 0, 'All SYMPTOMS regions are valid (' + badRegionCount + ' invalid)');
+
+  // Test: SCORING is defined and is an object with at least 40 entries
+  assert(typeof SCORING === 'object' && SCORING !== null, 'SCORING is defined as an object');
+  var scoringCount = Object.keys(SCORING).length;
+  assert(scoringCount >= 40, 'SCORING has at least 40 entries (found ' + scoringCount + ')');
+
+  // Test: Every SCORING key matches a TREE result node ID
+  var scoringBadKeys = 0;
+  for (var scId in SCORING) {
+    if (!SCORING.hasOwnProperty(scId)) continue;
+    if (!TREE[scId] || !isResult(TREE[scId])) scoringBadKeys++;
+  }
+  assert(scoringBadKeys === 0, 'Every SCORING key matches a TREE result node (' + scoringBadKeys + ' mismatched)');
+
+  // Test: Every symptom ID referenced in SCORING exists in SYMPTOMS
+  var scoringBadSymptoms = 0;
+  var scoringBadSymptomList = [];
+  for (var scId2 in SCORING) {
+    if (!SCORING.hasOwnProperty(scId2)) continue;
+    var syms = SCORING[scId2].symptoms;
+    for (var symRef in syms) {
+      if (!syms.hasOwnProperty(symRef)) continue;
+      if (!SYMPTOMS[symRef]) {
+        scoringBadSymptoms++;
+        scoringBadSymptomList.push(symRef + ' in ' + scId2);
+      }
+    }
+  }
+  assert(scoringBadSymptoms === 0, 'Every symptom in SCORING exists in SYMPTOMS (' + scoringBadSymptoms + ' missing: ' + scoringBadSymptomList.slice(0, 5).join(', ') + ')');
+
+  // Test: All SCORING weight values are between 0.0 and 1.0
+  var badWeights = 0;
+  for (var scId3 in SCORING) {
+    if (!SCORING.hasOwnProperty(scId3)) continue;
+    var syms3 = SCORING[scId3].symptoms;
+    for (var sw in syms3) {
+      if (!syms3.hasOwnProperty(sw)) continue;
+      if (typeof syms3[sw] !== 'number' || syms3[sw] < 0 || syms3[sw] > 1) badWeights++;
+    }
+  }
+  assert(badWeights === 0, 'All SCORING weights are 0.0-1.0 (' + badWeights + ' out of range)');
+
+  // Test: All SCORING entries have base_confidence between 0.0 and 1.0
+  var badBaseConf = 0;
+  for (var scId4 in SCORING) {
+    if (!SCORING.hasOwnProperty(scId4)) continue;
+    var bc = SCORING[scId4].base_confidence;
+    if (typeof bc !== 'number' || bc < 0 || bc > 1) badBaseConf++;
+  }
+  assert(badBaseConf === 0, 'All SCORING base_confidence values are 0.0-1.0 (' + badBaseConf + ' invalid)');
+
+  // Test: REFINE_RULES is defined and is an array with at least 10 entries
+  assert(Array.isArray(REFINE_RULES), 'REFINE_RULES is an array');
+  assert(REFINE_RULES.length >= 10, 'REFINE_RULES has at least 10 entries (found ' + REFINE_RULES.length + ')');
+
+  // Test: Every REFINE_RULES entry has id, condition (function), question (string), options (array)
+  var rulesMissingFields = 0;
+  for (var ri = 0; ri < REFINE_RULES.length; ri++) {
+    var rule = REFINE_RULES[ri];
+    if (!rule.id || typeof rule.condition !== 'function' || typeof rule.question !== 'string' || !Array.isArray(rule.options)) {
+      rulesMissingFields++;
+    }
+  }
+  assert(rulesMissingFields === 0, 'All REFINE_RULES have id, condition, question, options (' + rulesMissingFields + ' missing)');
+
+  // Test: Every REFINE_RULES option has label (string) and adjust (object)
+  var rulesOptionBad = 0;
+  for (var ri2 = 0; ri2 < REFINE_RULES.length; ri2++) {
+    var opts = REFINE_RULES[ri2].options;
+    for (var oi = 0; oi < opts.length; oi++) {
+      if (typeof opts[oi].label !== 'string' || typeof opts[oi].adjust !== 'object') {
+        rulesOptionBad++;
+      }
+    }
+  }
+  assert(rulesOptionBad === 0, 'All REFINE_RULES options have label and adjust (' + rulesOptionBad + ' invalid)');
+
+  // Test: Every diagnosis ID referenced in REFINE_RULES adjust objects exists in SCORING
+  var adjustBadIds = 0;
+  for (var ri3 = 0; ri3 < REFINE_RULES.length; ri3++) {
+    var opts3 = REFINE_RULES[ri3].options;
+    for (var oi3 = 0; oi3 < opts3.length; oi3++) {
+      var adj = opts3[oi3].adjust;
+      for (var adjKey in adj) {
+        if (!adj.hasOwnProperty(adjKey)) continue;
+        if (!SCORING[adjKey]) adjustBadIds++;
+      }
+    }
+  }
+  assert(adjustBadIds === 0, 'All REFINE_RULES adjust IDs reference valid SCORING keys (' + adjustBadIds + ' invalid)');
+
   // Restore state
   state.currentNode = savedState.currentNode;
   state.history = savedState.history;
