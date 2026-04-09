// GrowDoc Companion — Priority System Tests (Section 06)

import { calculateWeights, blendTarget, getRecommendation } from '../data/priority-engine.js';
import { renderStarRating, renderEffectSelector } from '../components/star-rating.js';

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // ── Star Rating Tests ──────────────────────────────────────────────

  // Click sets rating
  {
    const container = document.createElement('div');
    let lastValue = 0;
    const inst = renderStarRating(container, {
      name: 'yield', label: 'Yield', color: 'var(--priority-yield)',
      value: 3, onChange: (v) => { lastValue = v; }
    });

    const stars = container.querySelectorAll('.star-btn');
    assert(stars.length === 5, 'star-rating renders 5 stars');

    // Click star 4
    stars[3].click();
    assert(lastValue === 4, 'clicking star 4 sets rating to 4');
    assert(inst.getValue() === 4, 'getValue() returns 4 after click');
  }

  // Toggle deselect
  {
    const container = document.createElement('div');
    let lastValue = 3;
    renderStarRating(container, {
      name: 'quality', label: 'Quality', color: 'var(--priority-quality)',
      value: 3, onChange: (v) => { lastValue = v; }
    });

    const stars = container.querySelectorAll('.star-btn');
    // Click star 3 (currently selected) should toggle to 2
    stars[2].click();
    assert(lastValue === 2, 'clicking same star toggles to N-1 (3 -> 2)');

    // Click star 1 when rating is 1 should go to 0
    stars[0].click(); // sets to 1
    stars[0].click(); // toggles to 0
    assert(lastValue === 0, 'clicking star 1 when rating=1 goes to 0');
  }

  // Store update (onChange fires)
  {
    const container = document.createElement('div');
    const changes = [];
    renderStarRating(container, {
      name: 'terpenes', label: 'Terpenes', color: 'var(--priority-terpenes)',
      value: 2, onChange: (v) => { changes.push(v); }
    });

    const stars = container.querySelectorAll('.star-btn');
    stars[4].click(); // set to 5
    stars[0].click(); // set to 1
    assert(changes.length === 2, 'onChange fires on each rating change');
    assert(changes[0] === 5, 'first change is 5');
    assert(changes[1] === 1, 'second change is 1');
  }

  // Effect type selector: visible when Effect >= 3
  {
    const container = document.createElement('div');
    const selector = renderEffectSelector(container, { value: null, onChange: () => {}, visible: true });
    assert(container.querySelector('#effect-type') !== null, 'effect selector renders when visible=true');
    assert(selector.element.style.display !== 'none', 'effect selector is visible');
  }

  // Effect type selector: hidden when Effect < 3
  {
    const container = document.createElement('div');
    const selector = renderEffectSelector(container, { value: null, onChange: () => {}, visible: false });
    assert(selector.element.style.display === 'none', 'effect selector hidden when visible=false');

    selector.show();
    assert(selector.element.style.display !== 'none', 'show() makes selector visible');

    let cleared = false;
    const container2 = document.createElement('div');
    const selector2 = renderEffectSelector(container2, { value: 'relaxing', onChange: (v) => { cleared = v === null; }, visible: true });
    selector2.hide();
    assert(selector2.element.style.display === 'none', 'hide() hides selector');
    assert(cleared, 'hide() clears selection (onChange called with null)');
  }

  // ── Weight Calculation Tests ──────────────────────────────────────

  // Equal stars = equal weights
  {
    const w = calculateWeights({ yield: 3, quality: 3, terpenes: 3, effect: 3 });
    assert(Math.abs(w.yield - 0.25) < 0.001, 'equal stars: yield weight is 0.25');
    assert(Math.abs(w.quality - 0.25) < 0.001, 'equal stars: quality weight is 0.25');
    assert(Math.abs(w.terpenes - 0.25) < 0.001, 'equal stars: terpenes weight is 0.25');
    assert(Math.abs(w.effect - 0.25) < 0.001, 'equal stars: effect weight is 0.25');
  }

  // All-zero handling
  {
    const w = calculateWeights({ yield: 0, quality: 0, terpenes: 0, effect: 0 });
    assert(Math.abs(w.yield - 0.25) < 0.001, 'all-zero: defaults to equal yield weight');
    assert(Math.abs(w.quality - 0.25) < 0.001, 'all-zero: defaults to equal quality weight');
  }

  // Weights sum to 1.0
  {
    const w = calculateWeights({ yield: 5, quality: 2, terpenes: 4, effect: 1 });
    const sum = w.yield + w.quality + w.terpenes + w.effect;
    assert(Math.abs(sum - 1.0) < 0.001, `weights sum to 1.0 (got ${sum})`);
  }

  // Dominant weight
  {
    const w = calculateWeights({ yield: 5, quality: 1, terpenes: 1, effect: 1 });
    // 5 / 8 = 0.625
    assert(Math.abs(w.yield - 0.625) < 0.001, `dominant weight: yield at 5/8 = 0.625 (got ${w.yield})`);
    // 1 / 8 = 0.125
    assert(Math.abs(w.quality - 0.125) < 0.001, `non-dominant: quality at 1/8 = 0.125 (got ${w.quality})`);
  }

  // ── blendTarget Tests ────────────────────────────────────────────

  // Basic blending
  {
    const params = { yield: 45, quality: 40, terpenes: 35 };
    const weights = { yield: 0.357, quality: 0.214, terpenes: 0.357, effect: 0.071 };
    const result = blendTarget(params, weights);
    // Effect weight redistributed: yield_adj = 0.357/(0.357+0.214+0.357) = 0.3845
    // quality_adj = 0.214/0.928 = 0.2306, terpenes_adj = 0.357/0.928 = 0.3845
    // result = 45*0.3845 + 40*0.2306 + 35*0.3845 = 17.3025 + 9.224 + 13.4575 = 39.984
    assert(Math.abs(result - 39.98) < 0.1, `blendTarget redistributes effect weight correctly (got ${result})`);
  }

  // ── getRecommendation Tests ──────────────────────────────────────

  // DLI recommendation
  {
    const rec = getRecommendation('dli', 'mid-flower', 'soil', { yield: 5, quality: 3, terpenes: 3, effect: 1 });
    assert(rec.value > 0, `DLI recommendation returns a value (got ${rec.value})`);
    assert(rec.range.min > 0, 'DLI recommendation has min range');
    assert(rec.range.max > rec.range.min, 'DLI recommendation max > min');
  }

  // Temp differential recommendation
  {
    const rec = getRecommendation('temp_dif', null, null, { yield: 3, quality: 3, terpenes: 5, effect: 1 });
    assert(rec.value > 0, `temp_dif recommendation returns a value (got ${rec.value})`);
    assert(rec.range.min >= 5, 'temp_dif min is at least 5');
    assert(rec.range.max <= 10, 'temp_dif max is at most 10');
  }

  // Unknown param returns zeroes
  {
    const rec = getRecommendation('unknown', 'veg', 'soil', { yield: 3, quality: 3, terpenes: 3, effect: 3 });
    assert(rec.value === 0, 'unknown param returns 0');
  }

  return results;
}
