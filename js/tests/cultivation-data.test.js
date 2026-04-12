// GrowDoc Companion — Cultivation Data Consistency Tests
//
// Validates cultivation data correctness across advice rules, drying/stage
// targets, knowledge articles, and environment targets.
// Browser-native ESM — no npm, no Node.
//
// Usage: import { runTests } from './cultivation-data.test.js';
//        const results = await runTests();
//        // results: Array<{ pass: boolean, msg: string }>

import { ADVICE_RULES } from '../data/note-contextualizer/rules-advice.js';
import { DRYING_TARGETS } from '../data/stage-rules.js';
import { STAGE_CONTENT } from '../data/stage-content.js';
import { KNOWLEDGE_ARTICLES } from '../data/knowledge-articles.js';
import { VPD_TARGETS } from '../data/grow-knowledge.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the advice rule with the given id, or undefined.
 * @param {string} id
 * @returns {{ id: string, condition: (ctx: object) => boolean }|undefined}
 */
function findRule(id) {
  return ADVICE_RULES.find((r) => r.id === id);
}

/**
 * Returns the knowledge article with the given id, or undefined.
 * @param {string} id
 * @returns {{ id: string, layer1?: string, layer2?: string }|undefined}
 */
function findArticle(id) {
  return KNOWLEDGE_ARTICLES.find((a) => a.id === id);
}

// ── Test runner ───────────────────────────────────────────────────────────────

/**
 * Runs all cultivation data consistency tests.
 * @returns {Promise<Array<{ pass: boolean, msg: string }>>}
 */
export async function runTests() {
  /** @type {Array<{ pass: boolean, msg: string }>} */
  const results = [];

  /**
   * @param {boolean|unknown} cond
   * @param {string} msg
   */
  function assert(cond, msg) {
    const pass = Boolean(cond);
    results.push({ pass, msg });
    if (!pass) console.error(`FAIL: ${msg}`);
  }

  // ── Group A: advice-mites-raise-rh stage filter ─────────────────────────
  //
  // Rule fires only when stage is in ['seedling', 'early-veg', 'late-veg']
  // AND rhExtracted < 40.  Using rhExtracted: 30 satisfies the RH condition;
  // so the stage filter is the decisive factor in every assertion below.

  {
    const rule = findRule('advice-mites-raise-rh');
    assert(rule !== undefined, 'Group A: advice-mites-raise-rh rule exists');

    if (rule) {
      const rhCtx = { rhExtracted: 30 };

      // Should NOT fire in late-stage flower / ripening
      for (const stage of ['mid-flower', 'late-flower', 'ripening']) {
        const fires = rule.condition({ ...rhCtx, stage });
        assert(!fires, `Group A: advice-mites-raise-rh does NOT fire for stage='${stage}'`);
      }

      // SHOULD fire in veg / seedling
      for (const stage of ['seedling', 'early-veg', 'late-veg']) {
        const fires = rule.condition({ ...rhCtx, stage });
        assert(fires, `Group A: advice-mites-raise-rh fires for stage='${stage}'`);
      }
    }
  }

  // ── Group B: advice-mites-spray stage filter ─────────────────────────────
  //
  // Rule fires when stage is absent OR in ['seedling', 'early-veg', 'late-veg'].

  {
    const rule = findRule('advice-mites-spray');
    assert(rule !== undefined, 'Group B: advice-mites-spray rule exists');

    if (rule) {
      // Should NOT fire in flower stages
      for (const stage of ['mid-flower', 'late-flower']) {
        const fires = rule.condition({ stage });
        assert(!fires, `Group B: advice-mites-spray does NOT fire for stage='${stage}'`);
      }

      // SHOULD fire in early-veg
      {
        const fires = rule.condition({ stage: 'early-veg' });
        assert(fires, "Group B: advice-mites-spray fires for stage='early-veg'");
      }
    }
  }

  // ── Group C: Data consistency ─────────────────────────────────────────────

  // C1: DRYING_TARGETS temp range
  {
    assert(
      DRYING_TARGETS?.temp?.min === 15,
      'Group C: DRYING_TARGETS temp min is 15',
    );
    assert(
      DRYING_TARGETS?.temp?.max === 18,
      'Group C: DRYING_TARGETS temp max is 18',
    );
  }

  // C2: Seedling VPD string in STAGE_CONTENT
  {
    const seedling = STAGE_CONTENT?.seedling;
    const whatToDo = Array.isArray(seedling?.whatToDo) ? seedling.whatToDo : [];
    const hasVpdString = whatToDo.some((line) => line.includes('0.4-0.8'));
    assert(hasVpdString, "Group C: seedling STAGE_CONTENT whatToDo includes '0.4-0.8'");
  }

  // C3: harvest-timing article includes amber percentage
  {
    const article = findArticle('harvest-timing');
    assert(article !== undefined, 'Group C: harvest-timing article exists');
    if (article) {
      const body = [article.summary, article.layer1, article.layer2]
        .filter(Boolean)
        .join(' ');
      const hasAmber = body.includes('20-30% amber') || body.includes('20\u201330% amber');
      assert(hasAmber, "Group C: harvest-timing article includes '20-30% amber' or '20\u201330% amber'");
    }
  }

  // C4: advice-mg-def-epsom detail includes 'before lights-on'
  {
    const rule = findRule('advice-mg-def-epsom');
    assert(rule !== undefined, 'Group C: advice-mg-def-epsom rule exists');
    if (rule) {
      assert(
        rule.detail.includes('before lights-on'),
        "Group C: advice-mg-def-epsom detail includes 'before lights-on'",
      );
    }
  }

  // C5: curing-protocol article includes 'three times daily' or '3x daily'
  {
    const article = findArticle('curing-protocol');
    assert(article !== undefined, 'Group C: curing-protocol article exists');
    if (article) {
      const body = [article.summary, article.layer1, article.layer2]
        .filter(Boolean)
        .join(' ');
      const hasBurp = body.includes('three times daily') || body.includes('3x daily');
      assert(hasBurp, "Group C: curing-protocol article includes 'three times daily' or '3x daily'");
    }
  }

  // C6: late-flower dayRH is 45–50 (from VPD_TARGETS in grow-knowledge.js)
  //
  // ENVIRONMENT_TARGETS is not directly exported; the equivalent data lives
  // in VPD_TARGETS['late-flower'].dayRH.
  {
    const lf = VPD_TARGETS?.['late-flower'];
    assert(
      lf?.dayRH?.min === 45,
      'Group C: late-flower VPD_TARGETS dayRH min is 45',
    );
    assert(
      lf?.dayRH?.max === 50,
      'Group C: late-flower VPD_TARGETS dayRH max is 50',
    );
  }

  return results;
}
