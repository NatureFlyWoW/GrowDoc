// GrowDoc Companion — Grow Knowledge Data Tests

import { STAGES, VPD_TARGETS, DLI_TARGETS, NUTRIENT_TARGETS, TEMP_DIF, WATERING_FREQUENCY } from '../data/grow-knowledge.js';
import { EVIDENCE } from '../data/evidence-data.js';

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // ── STAGES ─────────────────────────────────────────────────────────────

  const expectedStages = [
    'germination', 'seedling', 'early-veg', 'late-veg',
    'transition', 'early-flower', 'mid-flower', 'late-flower',
    'ripening', 'drying', 'curing'
  ];
  assert(Array.isArray(STAGES), 'STAGES is an array');
  assert(STAGES.length === expectedStages.length, `STAGES has ${expectedStages.length} entries`);
  for (const s of expectedStages) {
    assert(STAGES.includes(s), `STAGES includes "${s}"`);
  }

  // ── VPD TARGETS ────────────────────────────────────────────────────────

  const vpdStages = ['germination', 'seedling', 'early-veg', 'late-veg', 'transition',
    'early-flower', 'mid-flower', 'late-flower', 'ripening', 'drying', 'curing'];
  for (const stage of vpdStages) {
    const t = VPD_TARGETS[stage];
    assert(t !== undefined, `VPD_TARGETS has entry for "${stage}"`);
    if (!t) continue;

    // Plausible VPD range
    assert(t.vpdRange.min >= 0.3 && t.vpdRange.max <= 2.0,
      `VPD range for ${stage} is plausible (${t.vpdRange.min}-${t.vpdRange.max} kPa)`);

    // Day temps higher than night temps
    assert(t.dayTemp.min >= t.nightTemp.min,
      `${stage}: day temp min (${t.dayTemp.min}) >= night temp min (${t.nightTemp.min})`);
    assert(t.dayTemp.max >= t.nightTemp.max,
      `${stage}: day temp max (${t.dayTemp.max}) >= night temp max (${t.nightTemp.max})`);
  }

  // ── DLI TARGETS ────────────────────────────────────────────────────────

  const dliStages = ['seedling', 'early-veg', 'late-veg', 'transition',
    'early-flower', 'mid-flower', 'late-flower', 'ripening'];
  const priorities = ['yield', 'quality', 'terpenes'];

  for (const stage of dliStages) {
    assert(DLI_TARGETS[stage] !== undefined, `DLI_TARGETS has entry for "${stage}"`);
    if (!DLI_TARGETS[stage]) continue;

    for (const p of priorities) {
      const d = DLI_TARGETS[stage][p];
      assert(d !== undefined, `DLI_TARGETS["${stage}"]["${p}"] exists`);
      if (!d) continue;

      // Plausible range 10-65
      assert(d.min >= 10 && d.max <= 65,
        `DLI ${stage}/${p} in range 10-65 (${d.min}-${d.max})`);
    }

    // Priority ordering: yield >= quality >= terpenes
    const y = DLI_TARGETS[stage].yield;
    const q = DLI_TARGETS[stage].quality;
    const t = DLI_TARGETS[stage].terpenes;
    if (y && q && t) {
      assert(y.optimal >= q.optimal,
        `DLI ${stage}: yield optimal (${y.optimal}) >= quality optimal (${q.optimal})`);
      assert(q.optimal >= t.optimal,
        `DLI ${stage}: quality optimal (${q.optimal}) >= terpenes optimal (${t.optimal})`);
    }
  }

  // ── NUTRIENT TARGETS ───────────────────────────────────────────────────

  const mediums = ['soil', 'coco', 'hydro', 'soilless'];
  const nutrientStages = ['seedling', 'early-veg', 'late-veg', 'transition',
    'early-flower', 'mid-flower', 'late-flower', 'ripening'];

  for (const med of mediums) {
    assert(NUTRIENT_TARGETS[med] !== undefined, `NUTRIENT_TARGETS has medium "${med}"`);
    if (!NUTRIENT_TARGETS[med]) continue;

    for (const stage of nutrientStages) {
      const n = NUTRIENT_TARGETS[med][stage];
      assert(n !== undefined, `NUTRIENT_TARGETS["${med}"]["${stage}"] exists`);
      if (!n) continue;

      assert(n.ec && typeof n.ec.min === 'number', `${med}/${stage} has EC range`);
      assert(n.ph && typeof n.ph.min === 'number', `${med}/${stage} has pH range`);
      assert(typeof n.npkRatio === 'string', `${med}/${stage} has NPK ratio string`);
    }
  }

  // EC progression: mid-flower > late-flower
  for (const med of mediums) {
    if (!NUTRIENT_TARGETS[med]) continue;
    const mid = NUTRIENT_TARGETS[med]['mid-flower'];
    const late = NUTRIENT_TARGETS[med]['late-flower'];
    if (mid && late) {
      assert(mid.ec.max >= late.ec.max,
        `${med}: mid-flower EC max (${mid.ec.max}) >= late-flower EC max (${late.ec.max})`);
    }
  }

  // pH ranges by medium
  const soilPh = NUTRIENT_TARGETS.soil?.['early-veg']?.ph;
  if (soilPh) {
    assert(soilPh.min >= 6.0 && soilPh.max <= 6.8,
      `Soil pH range is 6.0-6.8 (got ${soilPh.min}-${soilPh.max})`);
  }
  const cocoPh = NUTRIENT_TARGETS.coco?.['early-veg']?.ph;
  if (cocoPh) {
    assert(cocoPh.min >= 5.5 && cocoPh.max <= 6.5,
      `Coco pH range is 5.5-6.5 (got ${cocoPh.min}-${cocoPh.max})`);
  }

  // Coco always has CalMag note (including transition)
  if (NUTRIENT_TARGETS.coco) {
    for (const stage of nutrientStages) {
      const n = NUTRIENT_TARGETS.coco[stage];
      if (n) {
        assert(n.calmagNote !== null && n.calmagNote !== undefined && n.calmagNote.length > 0,
          `Coco/${stage} has CalMag note`);
      }
    }
  }

  // ── TEMP_DIF ───────────────────────────────────────────────────────────

  for (const p of priorities) {
    const td = TEMP_DIF[p];
    assert(td !== undefined, `TEMP_DIF has entry for "${p}"`);
    if (td) {
      assert(td.dayNightDifferential && typeof td.dayNightDifferential.min === 'number',
        `TEMP_DIF["${p}"] has dayNightDifferential range`);
      assert(typeof td.lateFlowerShift === 'string',
        `TEMP_DIF["${p}"] has lateFlowerShift description`);
    }
  }

  // ── WATERING FREQUENCY ─────────────────────────────────────────────────

  const waterMediums = ['soil', 'coco', 'hydro', 'soilless'];
  const potSizes = ['small', 'medium', 'large'];
  const waterStages = ['seedling', 'early-veg', 'late-veg', 'transition',
    'early-flower', 'mid-flower', 'late-flower'];

  for (const med of waterMediums) {
    assert(WATERING_FREQUENCY[med] !== undefined, `WATERING_FREQUENCY has medium "${med}"`);
    if (!WATERING_FREQUENCY[med]) continue;

    for (const size of potSizes) {
      if (!WATERING_FREQUENCY[med][size]) continue;
      for (const stage of waterStages) {
        const w = WATERING_FREQUENCY[med][size][stage];
        assert(w !== undefined,
          `WATERING_FREQUENCY["${med}"]["${size}"]["${stage}"] exists`);
        if (w) {
          assert(typeof w.minDays === 'number' && typeof w.maxDays === 'number',
            `${med}/${size}/${stage} has min/maxDays`);
          assert(w.minDays <= w.maxDays,
            `${med}/${size}/${stage}: minDays <= maxDays`);
        }
      }
    }
  }

  // ── EVIDENCE DATA ──────────────────────────────────────────────────────

  assert(typeof EVIDENCE === 'object' && EVIDENCE !== null, 'EVIDENCE is an object');

  const validLevels = ['established', 'promising', 'speculative', 'practitioner'];
  const evidenceKeys = Object.keys(EVIDENCE);
  assert(evidenceKeys.length > 0, 'EVIDENCE has entries');

  for (const id of evidenceKeys) {
    const e = EVIDENCE[id];
    assert(validLevels.includes(e.level),
      `EVIDENCE["${id}"].level is valid (got "${e.level}")`);

    // Established items must have source citation
    if (e.level === 'established') {
      assert(e.source !== null && e.source !== undefined && e.source.length > 0,
        `EVIDENCE["${id}"] (established) has source citation`);
    }

    assert(typeof e.detail === 'string' && e.detail.length > 0,
      `EVIDENCE["${id}"] has detail description`);
  }

  // Cross-reference: recommendation IDs should follow naming conventions
  const prefixes = ['vpd-', 'dli-', 'nutrient-', 'water-', 'temp-', 'harvest-', 'training-', 'stage-'];
  let hasKnownPrefix = 0;
  for (const id of evidenceKeys) {
    if (prefixes.some(p => id.startsWith(p))) hasKnownPrefix++;
  }
  assert(hasKnownPrefix > 0, 'Evidence entries use kebab-case domain prefixes');

  return results;
}
