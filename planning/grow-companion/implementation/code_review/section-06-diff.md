diff --git a/js/components/star-rating.js b/js/components/star-rating.js
new file mode 100644
index 0000000..d992c15
--- /dev/null
+++ b/js/components/star-rating.js
@@ -0,0 +1,161 @@
+// GrowDoc Companion — Reusable Star Rating Component
+
+const EFFECT_TYPES = ['Energetic', 'Relaxing', 'Creative', 'Pain Relief', 'Anti-Anxiety', 'Sleep'];
+
+/**
+ * renderStarRating(container, options) — Renders a star rating into the container.
+ *   options.name       — Priority dimension name ('yield', 'quality', 'terpenes', 'effect')
+ *   options.label      — Display label ('Yield', 'Quality', 'Terpenes', 'Effect')
+ *   options.color      — CSS color value (e.g., 'var(--priority-yield)')
+ *   options.value      — Initial value (0-5, default 3)
+ *   options.onChange(value) — Callback when rating changes
+ */
+export function renderStarRating(container, options) {
+  const { name, label, color, value = 3, onChange } = options;
+  let currentValue = value;
+
+  const group = document.createElement('div');
+  group.className = 'star-rating-group';
+
+  const rating = document.createElement('div');
+  rating.className = 'star-rating';
+  rating.setAttribute('role', 'radiogroup');
+  rating.setAttribute('aria-label', `${label} priority`);
+
+  const labelEl = document.createElement('span');
+  labelEl.className = 'star-rating-label';
+  labelEl.style.color = color;
+  labelEl.textContent = label;
+  rating.appendChild(labelEl);
+
+  // Live region for accessibility announcements
+  const liveRegion = document.createElement('span');
+  liveRegion.setAttribute('aria-live', 'polite');
+  liveRegion.className = 'sr-only';
+  liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';
+  rating.appendChild(liveRegion);
+
+  const stars = [];
+
+  function updateStars() {
+    for (let i = 0; i < 5; i++) {
+      const starNum = i + 1;
+      const filled = starNum <= currentValue;
+      stars[i].className = 'star-btn' + (filled ? ' filled' : '');
+      stars[i].style.setProperty('--star-color', color);
+      stars[i].textContent = filled ? '\u2605' : '\u2606';
+      stars[i].setAttribute('aria-checked', String(starNum === currentValue));
+    }
+    liveRegion.textContent = `${label} set to ${currentValue} star${currentValue !== 1 ? 's' : ''}`;
+  }
+
+  function setRating(newValue) {
+    currentValue = newValue;
+    updateStars();
+    if (onChange) onChange(currentValue);
+  }
+
+  for (let i = 1; i <= 5; i++) {
+    const star = document.createElement('button');
+    star.type = 'button';
+    star.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
+    star.setAttribute('role', 'radio');
+    star.setAttribute('tabindex', i === currentValue ? '0' : '-1');
+
+    star.addEventListener('click', () => {
+      // Toggle: clicking same star decrements by 1
+      if (i === currentValue) {
+        setRating(Math.max(0, i - 1));
+      } else {
+        setRating(i);
+      }
+    });
+
+    star.addEventListener('keydown', (e) => {
+      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
+        e.preventDefault();
+        const next = Math.min(5, currentValue + 1);
+        setRating(next);
+        stars[next - 1].focus();
+      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
+        e.preventDefault();
+        const prev = Math.max(1, currentValue - 1);
+        setRating(prev);
+        stars[prev - 1].focus();
+      } else if (e.key === ' ' || e.key === 'Enter') {
+        e.preventDefault();
+        if (i === currentValue) {
+          setRating(Math.max(0, i - 1));
+        } else {
+          setRating(i);
+        }
+      }
+    });
+
+    stars.push(star);
+    rating.appendChild(star);
+  }
+
+  updateStars();
+  group.appendChild(rating);
+  container.appendChild(group);
+
+  return {
+    getValue: () => currentValue,
+    setValue: (v) => { currentValue = v; updateStars(); },
+    element: group,
+  };
+}
+
+/**
+ * renderEffectSelector(container, options) — Renders the effect type dropdown.
+ *   options.value      — Initial selection (string or null)
+ *   options.onChange(value) — Callback when selection changes
+ *   options.visible    — Whether to show the selector initially
+ */
+export function renderEffectSelector(container, options) {
+  const { value = null, onChange, visible = false } = options;
+
+  const field = document.createElement('div');
+  field.className = 'wizard-field effect-selector';
+  field.style.marginTop = 'var(--space-4)';
+  if (!visible) field.style.display = 'none';
+
+  const label = document.createElement('label');
+  label.textContent = 'Target effect';
+  label.setAttribute('for', 'effect-type');
+
+  const select = document.createElement('select');
+  select.id = 'effect-type';
+  select.className = 'input';
+
+  const emptyOpt = document.createElement('option');
+  emptyOpt.value = '';
+  emptyOpt.textContent = 'Select effect type...';
+  select.appendChild(emptyOpt);
+
+  for (const eff of EFFECT_TYPES) {
+    const opt = document.createElement('option');
+    opt.value = eff.toLowerCase().replace(/\s+/g, '-');
+    opt.textContent = eff;
+    if (value === opt.value) opt.selected = true;
+    select.appendChild(opt);
+  }
+
+  select.addEventListener('change', () => {
+    if (onChange) onChange(select.value || null);
+  });
+
+  field.appendChild(label);
+  field.appendChild(select);
+  container.appendChild(field);
+
+  return {
+    show() { field.style.display = ''; },
+    hide() { field.style.display = 'none'; select.value = ''; if (onChange) onChange(null); },
+    getValue() { return select.value || null; },
+    element: field,
+  };
+}
+
+export { EFFECT_TYPES };
diff --git a/js/data/priority-engine.js b/js/data/priority-engine.js
new file mode 100644
index 0000000..fae6f38
--- /dev/null
+++ b/js/data/priority-engine.js
@@ -0,0 +1,188 @@
+// GrowDoc Companion — Priority Weight Calculation & Target Blending
+// Pure functions that convert star ratings into normalized weights and blend targets.
+
+import { DLI_TARGETS, TEMP_DIF } from './grow-knowledge.js';
+
+/**
+ * calculateWeights(priorities) -> { yield, quality, terpenes, effect }
+ *
+ * Normalizes star ratings (0-5) into weights summing to 1.0.
+ * All zeros returns equal weights (0.25 each).
+ */
+export function calculateWeights(priorities) {
+  const { yield: y = 0, quality: q = 0, terpenes: t = 0, effect: e = 0 } = priorities;
+  const total = y + q + t + e;
+
+  if (total === 0) {
+    return { yield: 0.25, quality: 0.25, terpenes: 0.25, effect: 0.25 };
+  }
+
+  return {
+    yield: y / total,
+    quality: q / total,
+    terpenes: t / total,
+    effect: e / total,
+  };
+}
+
+/**
+ * blendTarget(parameterByPriority, weights) -> Number
+ *
+ * Weighted average of parameter values per priority dimension.
+ * If a dimension is absent from parameterByPriority (typically 'effect'),
+ * its weight is redistributed proportionally among the present dimensions.
+ */
+export function blendTarget(parameterByPriority, weights) {
+  const dims = Object.keys(parameterByPriority);
+  if (dims.length === 0) return 0;
+
+  // Sum of weights for present dimensions
+  let presentWeightSum = 0;
+  for (const d of dims) {
+    presentWeightSum += (weights[d] || 0);
+  }
+
+  // If all present dimensions have zero weight, equal-weight them
+  if (presentWeightSum === 0) {
+    let sum = 0;
+    for (const d of dims) sum += parameterByPriority[d];
+    return sum / dims.length;
+  }
+
+  // Weighted average with redistribution
+  let result = 0;
+  for (const d of dims) {
+    const normalizedWeight = (weights[d] || 0) / presentWeightSum;
+    result += parameterByPriority[d] * normalizedWeight;
+  }
+  return result;
+}
+
+/**
+ * getRecommendation(param, stage, medium, priorities) -> {
+ *   value: Number,
+ *   range: { min: Number, max: Number },
+ *   tradeoffNote: String | null
+ * }
+ *
+ * Supported params: 'dli', 'temp_dif'
+ */
+export function getRecommendation(param, stage, medium, priorities) {
+  const weights = calculateWeights(priorities);
+
+  if (param === 'dli') {
+    return _dliRecommendation(stage, priorities, weights);
+  }
+
+  if (param === 'temp_dif') {
+    return _tempDifRecommendation(priorities, weights);
+  }
+
+  return { value: 0, range: { min: 0, max: 0 }, tradeoffNote: null };
+}
+
+function _dliRecommendation(stage, priorities, weights) {
+  const stageData = DLI_TARGETS[stage];
+  if (!stageData) {
+    return { value: 0, range: { min: 0, max: 0 }, tradeoffNote: null };
+  }
+
+  // Blend optimal, min, and max across priority dimensions
+  const optimalByPriority = {};
+  const minByPriority = {};
+  const maxByPriority = {};
+
+  for (const dim of ['yield', 'quality', 'terpenes']) {
+    if (stageData[dim]) {
+      optimalByPriority[dim] = stageData[dim].optimal;
+      minByPriority[dim] = stageData[dim].min;
+      maxByPriority[dim] = stageData[dim].max;
+    }
+  }
+
+  const value = blendTarget(optimalByPriority, weights);
+  const min = blendTarget(minByPriority, weights);
+  const max = blendTarget(maxByPriority, weights);
+
+  const tradeoffNote = _dliTradeoffNote(stageData, priorities);
+
+  return {
+    value: Math.round(value * 10) / 10,
+    range: { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 },
+    tradeoffNote,
+  };
+}
+
+function _dliTradeoffNote(stageData, priorities) {
+  // Only generate when two priorities with >= 3 stars pull in different directions
+  const dims = ['yield', 'quality', 'terpenes'];
+  const highDims = dims.filter(d => priorities[d] >= 3 && stageData[d]);
+
+  if (highDims.length < 2) return null;
+
+  // Find the pair with the largest divergence in optimal values
+  let maxDiff = 0;
+  let highDim = null;
+  let lowDim = null;
+
+  for (let i = 0; i < highDims.length; i++) {
+    for (let j = i + 1; j < highDims.length; j++) {
+      const diff = Math.abs(stageData[highDims[i]].optimal - stageData[highDims[j]].optimal);
+      if (diff > maxDiff) {
+        maxDiff = diff;
+        if (stageData[highDims[i]].optimal > stageData[highDims[j]].optimal) {
+          highDim = highDims[i];
+          lowDim = highDims[j];
+        } else {
+          highDim = highDims[j];
+          lowDim = highDims[i];
+        }
+      }
+    }
+  }
+
+  // Only generate note if difference is significant (> 5 DLI)
+  if (maxDiff <= 5 || !highDim || !lowDim) return null;
+
+  const highLabel = highDim.charAt(0).toUpperCase() + highDim.slice(1);
+  const lowLabel = lowDim.charAt(0).toUpperCase() + lowDim.slice(1);
+
+  return `Higher DLI benefits ${lowLabel === 'Yield' ? 'yield' : highDim} but may reduce ${lowDim} ${lowDim === 'terpenes' ? 'complexity' : 'outcomes'}. ` +
+    `Your ${lowLabel.toLowerCase()} priority (${priorities[lowDim]} stars) suggests keeping DLI below ${stageData[lowDim].max}.`;
+}
+
+function _tempDifRecommendation(priorities, weights) {
+  const minByPriority = {};
+  const maxByPriority = {};
+
+  for (const dim of ['yield', 'quality', 'terpenes']) {
+    if (TEMP_DIF[dim]) {
+      minByPriority[dim] = TEMP_DIF[dim].dayNightDifferential.min;
+      maxByPriority[dim] = TEMP_DIF[dim].dayNightDifferential.max;
+    }
+  }
+
+  const min = blendTarget(minByPriority, weights);
+  const max = blendTarget(maxByPriority, weights);
+  const value = (min + max) / 2;
+
+  const tradeoffNote = _tempDifTradeoffNote(priorities);
+
+  return {
+    value: Math.round(value * 10) / 10,
+    range: { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 },
+    tradeoffNote,
+  };
+}
+
+function _tempDifTradeoffNote(priorities) {
+  const yieldHigh = priorities.yield >= 3;
+  const terpHigh = priorities.terpenes >= 3;
+
+  if (yieldHigh && terpHigh && Math.abs(priorities.yield - priorities.terpenes) <= 2) {
+    return `Larger temperature differentials benefit terpene preservation but may slow metabolism. ` +
+      `Your yield priority (${priorities.yield} stars) suggests keeping differentials moderate (${TEMP_DIF.yield.dayNightDifferential.min}-${TEMP_DIF.yield.dayNightDifferential.max}C).`;
+  }
+
+  return null;
+}
diff --git a/js/main.js b/js/main.js
index 8af1692..e1fefa4 100644
--- a/js/main.js
+++ b/js/main.js
@@ -219,6 +219,7 @@ async function renderTestRunner(container) {
     { name: 'vercel-config', path: './tests/vercel-config.test.js' },
     { name: 'grow-knowledge', path: './tests/grow-knowledge.test.js' },
     { name: 'strain-database', path: './tests/strain-database.test.js' },
+    { name: 'priority-system', path: './tests/priority-system.test.js' },
   ];
 
   let totalPass = 0;
diff --git a/js/tests/priority-system.test.js b/js/tests/priority-system.test.js
new file mode 100644
index 0000000..828cf85
--- /dev/null
+++ b/js/tests/priority-system.test.js
@@ -0,0 +1,167 @@
+// GrowDoc Companion — Priority System Tests (Section 06)
+
+import { calculateWeights, blendTarget, getRecommendation } from '../data/priority-engine.js';
+import { renderStarRating, renderEffectSelector } from '../components/star-rating.js';
+
+export async function runTests() {
+  const results = [];
+  function assert(condition, msg) {
+    results.push({ pass: !!condition, msg });
+    if (!condition) console.error(`FAIL: ${msg}`);
+  }
+
+  // ── Star Rating Tests ──────────────────────────────────────────────
+
+  // Click sets rating
+  {
+    const container = document.createElement('div');
+    let lastValue = 0;
+    const inst = renderStarRating(container, {
+      name: 'yield', label: 'Yield', color: 'var(--priority-yield)',
+      value: 3, onChange: (v) => { lastValue = v; }
+    });
+
+    const stars = container.querySelectorAll('.star-btn');
+    assert(stars.length === 5, 'star-rating renders 5 stars');
+
+    // Click star 4
+    stars[3].click();
+    assert(lastValue === 4, 'clicking star 4 sets rating to 4');
+    assert(inst.getValue() === 4, 'getValue() returns 4 after click');
+  }
+
+  // Toggle deselect
+  {
+    const container = document.createElement('div');
+    let lastValue = 3;
+    renderStarRating(container, {
+      name: 'quality', label: 'Quality', color: 'var(--priority-quality)',
+      value: 3, onChange: (v) => { lastValue = v; }
+    });
+
+    const stars = container.querySelectorAll('.star-btn');
+    // Click star 3 (currently selected) should toggle to 2
+    stars[2].click();
+    assert(lastValue === 2, 'clicking same star toggles to N-1 (3 -> 2)');
+
+    // Click star 1 when rating is 1 should go to 0
+    stars[0].click(); // sets to 1
+    stars[0].click(); // toggles to 0
+    assert(lastValue === 0, 'clicking star 1 when rating=1 goes to 0');
+  }
+
+  // Store update (onChange fires)
+  {
+    const container = document.createElement('div');
+    const changes = [];
+    renderStarRating(container, {
+      name: 'terpenes', label: 'Terpenes', color: 'var(--priority-terpenes)',
+      value: 2, onChange: (v) => { changes.push(v); }
+    });
+
+    const stars = container.querySelectorAll('.star-btn');
+    stars[4].click(); // set to 5
+    stars[0].click(); // set to 1
+    assert(changes.length === 2, 'onChange fires on each rating change');
+    assert(changes[0] === 5, 'first change is 5');
+    assert(changes[1] === 1, 'second change is 1');
+  }
+
+  // Effect type selector: visible when Effect >= 3
+  {
+    const container = document.createElement('div');
+    const selector = renderEffectSelector(container, { value: null, onChange: () => {}, visible: true });
+    assert(container.querySelector('#effect-type') !== null, 'effect selector renders when visible=true');
+    assert(selector.element.style.display !== 'none', 'effect selector is visible');
+  }
+
+  // Effect type selector: hidden when Effect < 3
+  {
+    const container = document.createElement('div');
+    const selector = renderEffectSelector(container, { value: null, onChange: () => {}, visible: false });
+    assert(selector.element.style.display === 'none', 'effect selector hidden when visible=false');
+
+    selector.show();
+    assert(selector.element.style.display !== 'none', 'show() makes selector visible');
+
+    let cleared = false;
+    const container2 = document.createElement('div');
+    const selector2 = renderEffectSelector(container2, { value: 'relaxing', onChange: (v) => { cleared = v === null; }, visible: true });
+    selector2.hide();
+    assert(selector2.element.style.display === 'none', 'hide() hides selector');
+    assert(cleared, 'hide() clears selection (onChange called with null)');
+  }
+
+  // ── Weight Calculation Tests ──────────────────────────────────────
+
+  // Equal stars = equal weights
+  {
+    const w = calculateWeights({ yield: 3, quality: 3, terpenes: 3, effect: 3 });
+    assert(Math.abs(w.yield - 0.25) < 0.001, 'equal stars: yield weight is 0.25');
+    assert(Math.abs(w.quality - 0.25) < 0.001, 'equal stars: quality weight is 0.25');
+    assert(Math.abs(w.terpenes - 0.25) < 0.001, 'equal stars: terpenes weight is 0.25');
+    assert(Math.abs(w.effect - 0.25) < 0.001, 'equal stars: effect weight is 0.25');
+  }
+
+  // All-zero handling
+  {
+    const w = calculateWeights({ yield: 0, quality: 0, terpenes: 0, effect: 0 });
+    assert(Math.abs(w.yield - 0.25) < 0.001, 'all-zero: defaults to equal yield weight');
+    assert(Math.abs(w.quality - 0.25) < 0.001, 'all-zero: defaults to equal quality weight');
+  }
+
+  // Weights sum to 1.0
+  {
+    const w = calculateWeights({ yield: 5, quality: 2, terpenes: 4, effect: 1 });
+    const sum = w.yield + w.quality + w.terpenes + w.effect;
+    assert(Math.abs(sum - 1.0) < 0.001, `weights sum to 1.0 (got ${sum})`);
+  }
+
+  // Dominant weight
+  {
+    const w = calculateWeights({ yield: 5, quality: 1, terpenes: 1, effect: 1 });
+    // 5 / 8 = 0.625
+    assert(Math.abs(w.yield - 0.625) < 0.001, `dominant weight: yield at 5/8 = 0.625 (got ${w.yield})`);
+    // 1 / 8 = 0.125
+    assert(Math.abs(w.quality - 0.125) < 0.001, `non-dominant: quality at 1/8 = 0.125 (got ${w.quality})`);
+  }
+
+  // ── blendTarget Tests ────────────────────────────────────────────
+
+  // Basic blending
+  {
+    const params = { yield: 45, quality: 40, terpenes: 35 };
+    const weights = { yield: 0.357, quality: 0.214, terpenes: 0.357, effect: 0.071 };
+    const result = blendTarget(params, weights);
+    // Effect weight redistributed: yield_adj = 0.357/(0.357+0.214+0.357) = 0.3845
+    // quality_adj = 0.214/0.928 = 0.2306, terpenes_adj = 0.357/0.928 = 0.3845
+    // result = 45*0.3845 + 40*0.2306 + 35*0.3845 = 17.3025 + 9.224 + 13.4575 = 39.984
+    assert(Math.abs(result - 39.98) < 0.1, `blendTarget redistributes effect weight correctly (got ${result})`);
+  }
+
+  // ── getRecommendation Tests ──────────────────────────────────────
+
+  // DLI recommendation
+  {
+    const rec = getRecommendation('dli', 'mid-flower', 'soil', { yield: 5, quality: 3, terpenes: 3, effect: 1 });
+    assert(rec.value > 0, `DLI recommendation returns a value (got ${rec.value})`);
+    assert(rec.range.min > 0, 'DLI recommendation has min range');
+    assert(rec.range.max > rec.range.min, 'DLI recommendation max > min');
+  }
+
+  // Temp differential recommendation
+  {
+    const rec = getRecommendation('temp_dif', null, null, { yield: 3, quality: 3, terpenes: 5, effect: 1 });
+    assert(rec.value > 0, `temp_dif recommendation returns a value (got ${rec.value})`);
+    assert(rec.range.min >= 5, 'temp_dif min is at least 5');
+    assert(rec.range.max <= 10, 'temp_dif max is at most 10');
+  }
+
+  // Unknown param returns zeroes
+  {
+    const rec = getRecommendation('unknown', 'veg', 'soil', { yield: 3, quality: 3, terpenes: 3, effect: 3 });
+    assert(rec.value === 0, 'unknown param returns 0');
+  }
+
+  return results;
+}
diff --git a/js/views/onboarding.js b/js/views/onboarding.js
index 5552256..d2381cf 100644
--- a/js/views/onboarding.js
+++ b/js/views/onboarding.js
@@ -2,6 +2,7 @@
 
 import { navigate } from '../router.js';
 import { escapeHtml, generateId } from '../utils.js';
+import { renderStarRating, renderEffectSelector } from '../components/star-rating.js';
 
 // ── Stage Options ──────────────────────────────────────────────────────
 
@@ -476,70 +477,41 @@ function _renderPriorityStep(container) {
     { key: 'effect', label: 'Effect', color: 'var(--priority-effect)' },
   ];
 
+  // Effect selector (created first so we can wire it to the Effect star rating)
+  let effectSelector = null;
+
   for (const p of priorities) {
     const group = document.createElement('div');
     group.className = 'priority-group-onboarding';
 
-    const rating = document.createElement('div');
-    rating.className = 'star-rating';
-    rating.setAttribute('role', 'radiogroup');
-    rating.setAttribute('aria-label', `${p.label} priority`);
-
-    const labelEl = document.createElement('span');
-    labelEl.className = 'star-rating-label';
-    labelEl.style.color = p.color;
-    labelEl.textContent = p.label;
-    rating.appendChild(labelEl);
-
-    for (let i = 1; i <= 5; i++) {
-      const star = document.createElement('button');
-      star.className = 'star-btn' + (i <= _wizardState.priorities[p.key] ? ' filled' : '');
-      star.style.setProperty('--star-color', p.color);
-      star.textContent = i <= _wizardState.priorities[p.key] ? '\u2605' : '\u2606';
-      star.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
-      star.setAttribute('role', 'radio');
-      star.setAttribute('aria-checked', String(i === _wizardState.priorities[p.key]));
-      star.addEventListener('click', () => {
-        _wizardState.priorities[p.key] = i;
-        container.innerHTML = '';
-        _renderPriorityStep(container);
-      });
-      rating.appendChild(star);
-    }
+    renderStarRating(group, {
+      name: p.key,
+      label: p.label,
+      color: p.color,
+      value: _wizardState.priorities[p.key],
+      onChange: (v) => {
+        _wizardState.priorities[p.key] = v;
+        // Show/hide effect selector based on Effect rating
+        if (p.key === 'effect' && effectSelector) {
+          if (v >= 3) {
+            effectSelector.show();
+          } else {
+            effectSelector.hide();
+            _wizardState.targetEffect = null;
+          }
+        }
+      },
+    });
 
-    group.appendChild(rating);
     container.appendChild(group);
   }
 
-  // Conditional: effect type selector when Effect >= 3
-  if (_wizardState.priorities.effect >= 3) {
-    const field = document.createElement('div');
-    field.className = 'wizard-field';
-    field.style.marginTop = 'var(--space-4)';
-    const label = document.createElement('label');
-    label.textContent = 'Target effect';
-    label.setAttribute('for', 'effect-type');
-    const select = document.createElement('select');
-    select.id = 'effect-type';
-    select.className = 'input';
-    const emptyOpt = document.createElement('option');
-    emptyOpt.value = '';
-    emptyOpt.textContent = 'Select effect type...';
-    select.appendChild(emptyOpt);
-    for (const eff of EFFECT_TYPES) {
-      const opt = document.createElement('option');
-      opt.value = eff.toLowerCase().replace(/\s+/g, '-');
-      opt.textContent = eff;
-      if (_wizardState.targetEffect === opt.value) opt.selected = true;
-      select.appendChild(opt);
-    }
-    select.addEventListener('change', () => {
-      _wizardState.targetEffect = select.value || null;
-    });
-    field.appendChild(label);
-    field.appendChild(select);
-    container.appendChild(field);
-  }
+  // Effect type selector
+  effectSelector = renderEffectSelector(container, {
+    value: _wizardState.targetEffect,
+    onChange: (v) => { _wizardState.targetEffect = v; },
+    visible: _wizardState.priorities.effect >= 3,
+  });
 }
 
 function _renderSummaryStep(container) {
@@ -808,15 +780,15 @@ export async function runTests() {
     document.body.appendChild(testContainer);
     _renderPriorityStep(testContainer);
 
-    const effectSelect = testContainer.querySelector('#effect-type');
-    assert(effectSelect === null, 'effect type selector hidden when effect < 3');
+    const effectField = testContainer.querySelector('.effect-selector');
+    assert(effectField !== null && effectField.style.display === 'none', 'effect type selector hidden when effect < 3');
 
     testContainer.innerHTML = '';
     _wizardState.priorities.effect = 3;
     _renderPriorityStep(testContainer);
 
-    const effectSelect2 = testContainer.querySelector('#effect-type');
-    assert(effectSelect2 !== null, 'effect type selector shown when effect >= 3');
+    const effectField2 = testContainer.querySelector('.effect-selector');
+    assert(effectField2 !== null && effectField2.style.display !== 'none', 'effect type selector shown when effect >= 3');
 
     testContainer.remove();
   }
diff --git a/planning/grow-companion/implementation/deep_implement_config.json b/planning/grow-companion/implementation/deep_implement_config.json
index 921299a..817cace 100644
--- a/planning/grow-companion/implementation/deep_implement_config.json
+++ b/planning/grow-companion/implementation/deep_implement_config.json
@@ -39,6 +39,14 @@
     "section-03-landing-onboarding": {
       "status": "complete",
       "commit_hash": "328def0"
+    },
+    "section-04-grow-knowledge": {
+      "status": "complete",
+      "commit_hash": "5033151"
+    },
+    "section-05-strain-database": {
+      "status": "complete",
+      "commit_hash": "8c2912d"
     }
   },
   "pre_commit": {
