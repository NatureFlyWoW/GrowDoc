// GrowDoc Companion — Harvest Advisor Logic

import { calculateWeights } from './priority-engine.js';
import { DRYING_TARGETS, CURING_TARGETS } from './stage-rules.js';
import { mergeNoteContext } from './note-contextualizer/index.js';

/**
 * 3-step confidence enum helper used by the note-override pass.
 * Direction: +1 = bump up, -1 = bump down. Clamped at both ends.
 */
export function bumpConfidence(current, direction) {
  const ORDER = ['low', 'medium', 'high'];
  const idx = ORDER.indexOf(current);
  if (idx === -1) return current;
  const next = idx + (direction > 0 ? 1 : direction < 0 ? -1 : 0);
  if (next < 0) return ORDER[0];
  if (next >= ORDER.length) return ORDER[ORDER.length - 1];
  return ORDER[next];
}

/**
 * getHarvestRecommendation(trichomes, priorities, notes) — Analyze trichome ratios.
 *
 * Section-06: grows a trailing `notes = []` parameter. When notes is empty,
 * output is byte-identical to the pre-section-06 behavior (first regression
 * test case in harvest-advisor.test.js locks that contract).
 *
 * Returns: { recommendation, confidence, tradeoffNote, staggerSuggestion,
 *            dryingProtocol, curingProtocol, citedObsIds }
 */
export function getHarvestRecommendation(trichomes, priorities, notes = []) {
  const { clear, milky, amber } = trichomes;
  const weights = calculateWeights(priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 });

  // Base assessment
  let recommendation = 'keep-waiting';
  let confidence = 'low';
  let tradeoffNote = null;

  if (clear > 50) {
    recommendation = 'keep-waiting';
    confidence = 'high';
    tradeoffNote = 'Trichomes are mostly clear — THC production hasn\'t peaked. Wait for more milky trichomes.';
  } else if (milky >= 60 && amber < 10) {
    // Peak milky — best for terpenes and cerebral effects
    if (weights.terpenes > 0.3 || weights.effect > 0.3) {
      recommendation = 'harvest-now';
      confidence = 'high';
      tradeoffNote = `Peak milky trichomes — ideal for terpene preservation and cerebral effects. Your terpene/effect priority (${priorities.terpenes}/${priorities.effect} stars) aligns with harvesting now.`;
    } else {
      recommendation = 'harvest-soon';
      confidence = 'medium';
      tradeoffNote = 'Mostly milky trichomes — close to peak. Waiting for some amber will increase body effects and yield weight.';
    }
  } else if (milky >= 40 && amber >= 10 && amber <= 30) {
    // Classic harvest window
    recommendation = 'harvest-now';
    confidence = 'high';

    if (weights.yield > 0.3) {
      tradeoffNote = `Good balance of milky and amber. Your yield priority (${priorities.yield} stars) suggests you could wait a bit more for maximum weight.`;
    } else if (weights.terpenes > 0.3) {
      tradeoffNote = `Good harvest window. Your terpene priority (${priorities.terpenes} stars) suggests harvesting sooner rather than later for peak volatile terpene content.`;
    }
  } else if (amber > 30) {
    recommendation = 'harvest-now';
    confidence = 'high';
    tradeoffNote = 'High amber percentage — harvest now to prevent THC degradation. More amber = more sedative/body effects.';
    if (weights.yield > 0.3) {
      tradeoffNote += ` Your yield priority benefits from the extra weight, but quality may be declining.`;
    }
  }

  // Stagger suggestion
  let staggerSuggestion = null;
  if (recommendation === 'harvest-now' || recommendation === 'harvest-soon') {
    staggerSuggestion = 'Consider harvesting top colas first (they ripen fastest), then letting lower buds develop 3-5 more days under the light.';
  }

  // ── Note-aware overrides (section-06) ──────────────────────────────
  //
  // Backwards compat: when `notes` is empty, the block below is fully
  // skipped and citedObsIds defaults to []. Output is byte-identical to
  // the pre-section-06 implementation.
  let citedObsIds = [];
  if (Array.isArray(notes) && notes.length > 0) {
    const merged = mergeNoteContext(notes);
    const ctx = (merged && merged.ctx) || {};
    const keywords = (merged && Array.isArray(merged.keywords)) ? merged.keywords : [];
    const kwSet = new Set(keywords);

    // Grower intent pulled from merged ctx (set by intent-* or priority-* rules)
    const growerIntent = ctx.growerIntent || null;

    // Keyword-driven intent — note-derived intent wins over star priorities.
    // We key on canonical rule ids even when the wizard rule didn't populate
    // ctx.growerIntent directly.
    const intentFromKeywords = (() => {
      if (kwSet.has('user-wants-max-terps') || kwSet.has('intent-max-terps')) return 'max-terps';
      if (kwSet.has('user-wants-max-yield') || kwSet.has('intent-max-yield')) return 'max-yield';
      return null;
    })();
    const effectiveIntent = intentFromKeywords || growerIntent;

    // growerIntent overrides for the two narrow windows this file already
    // knows how to flip between.
    if (effectiveIntent === 'max-terps' && recommendation === 'harvest-soon') {
      // Peak-milky branch: upgrade to harvest-now when the grower explicitly
      // wants terps.
      recommendation = 'harvest-now';
      const note = 'Note-derived intent prefers max terpenes — upgrading to harvest now while milky trichomes are at peak.';
      tradeoffNote = tradeoffNote ? `${tradeoffNote} ${note}` : note;
    } else if (effectiveIntent === 'max-yield' && recommendation === 'harvest-now' && milky >= 40 && amber >= 10 && amber <= 30) {
      // Classic-window branch: downgrade to harvest-soon when the grower
      // explicitly wants max yield (more weight comes from waiting).
      recommendation = 'harvest-soon';
      const note = 'Note-derived intent prefers max yield — downgrading to harvest soon to accumulate more weight.';
      tradeoffNote = tradeoffNote ? `${tradeoffNote} ${note}` : note;
    }

    // Confidence bumps from "user thinks early/late" signals.
    if (kwSet.has('user-thinks-early')) {
      confidence = bumpConfidence(confidence, +1);
    }
    if (kwSet.has('user-thinks-late')) {
      confidence = bumpConfidence(confidence, -1);
    }

    // Aroma enrichment — never flips recommendation, just enriches tradeoff
    // narration with a short quoted snippet (max 60 chars).
    const aromaSignal = keywords.find(k => typeof k === 'string' && (k.startsWith('aroma-') || k === 'aroma-terpene-rich'));
    if (aromaSignal) {
      const sourceObs = notes.find(o => o && o.parsed && Array.isArray(o.parsed.keywords) && o.parsed.keywords.includes(aromaSignal));
      if (sourceObs && typeof sourceObs.rawText === 'string' && sourceObs.rawText.trim()) {
        const raw = sourceObs.rawText.trim();
        const quoted = raw.length > 60 ? raw.slice(0, 57) + '...' : raw;
        const aromaLine = `Aroma cue noted ("${quoted}") — terpene profile currently expressing.`;
        tradeoffNote = tradeoffNote ? `${tradeoffNote} ${aromaLine}` : aromaLine;
      }
    }

    // Collect cited obs ids from the merged _citations map.
    const citationMap = (merged && merged._citations) || {};
    const flattened = Object.values(citationMap).flat();
    citedObsIds = Array.from(new Set(flattened));
  }

  return {
    recommendation,
    confidence,
    tradeoffNote,
    staggerSuggestion,
    dryingProtocol: { ...DRYING_TARGETS },
    curingProtocol: { ...CURING_TARGETS },
    citedObsIds,
  };
}

export const RECOMMENDATION_LABELS = {
  'keep-waiting': { label: 'Keep Waiting', color: 'var(--status-action)' },
  'harvest-soon': { label: 'Harvest Soon', color: 'var(--status-good)' },
  'harvest-now': { label: 'Harvest Now', color: 'var(--accent-green)' },
};
