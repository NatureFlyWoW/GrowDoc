// GrowDoc Companion — Question Matcher
// Pure-function keyword scoring against the local knowledge base.
// No backend calls, no deps, no frameworks.
//
// Exports:
//   tokenizeQuestion(text)           -> string[]
//   answerQuestion(text, opts)       -> Array<{id, source, title, body, score, matchedTerms}>
//   runTests()                       -> Array<{pass, msg}>

import { EDGE_CASES } from './edge-case-knowledge.js';
import { EDGE_CASES_SUPPLEMENTAL } from './edge-case-knowledge-supplemental.js';
import { STAGE_CONTENT } from './stage-content.js';
import { ADVISOR_MICROCOPY } from './advisor-microcopy.js';
import { STAGE_DEEP_DIVES } from './knowledge-deep-dives.js';
import { STRAIN_CLASS_ADJUSTMENTS } from './strain-class-adjustments.js';

// ── Stopwords ─────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'do', 'does', 'did',
  'should', 'could', 'would', 'can', 'may', 'might', 'will', 'have', 'has',
  'had', 'to', 'from', 'of', 'in', 'on', 'at', 'for', 'with', 'about', 'as',
  'this', 'that', 'it', 'its', 'my', 'i', 'me', 'you', 'your', 'we', 'right',
  'now', 'actually', 'fine', 'just', 'really', 'also', 'any', 'some', 'what',
  'when', 'how', 'so', 'but', 'and', 'or', 'if', 'then', 'like', 'good',
  'bad', 'only', 'there', 'resolve', 'issues', 'due',
]);

// ── Synonym map: phrase/token -> canonical token ───────────────────────────
// Keys are in lowercase, no punctuation. Multi-word phrases are joined with ' '.

const SYNONYM_PHRASES = [
  // Multi-word phrases first (longer matches take priority)
  ['cal mag', 'calmag'],
  ['calcium magnesium', 'calmag'],
  ['hard water', 'hard-water'],
  ['tap water', 'hard-water'],
  ['electrical conductivity', 'ec'],
  ['relative humidity', 'rh'],
  ['vapor pressure', 'vpd'],
  ['low stress training', 'lst'],
  ['pollen sacs', 'hermie'],
];

const SYNONYM_TOKENS = new Map([
  // calmag
  ['calmag', 'calmag'],
  ['calmag', 'calmag'],
  ['cal-mag', 'calmag'],
  // ph
  ['ph', 'ph'],
  ['acidity', 'ph'],
  ['alkalinity', 'ph'],
  // hard water
  ['hardness', 'hard-water'],
  // ec
  ['ec', 'ec'],
  ['tds', 'ec'],
  ['ppm', 'ec'],
  // rh
  ['rh', 'rh'],
  ['humidity', 'rh'],
  // vpd
  ['vpd', 'vpd'],
  // transplant
  ['transplant', 'transplant'],
  ['transplanted', 'transplant'],
  ['repot', 'transplant'],
  // topping
  ['topping', 'topping'],
  ['topped', 'topping'],
  ['fim', 'topping'],
  ['fimmed', 'topping'],
  // lst
  ['lst', 'lst'],
  // defoliation
  ['defoliate', 'defoliation'],
  ['defoliation', 'defoliation'],
  ['defol', 'defoliation'],
  ['schwazz', 'defoliation'],
  // flush
  ['flush', 'flush'],
  ['flushed', 'flush'],
  ['flushing', 'flush'],
  // feed
  ['feed', 'feed'],
  ['feeding', 'feed'],
  ['nutes', 'feed'],
  ['nutrients', 'feed'],
  ['nutrient', 'feed'],
  ['fertilizer', 'feed'],
  // light
  ['light', 'light'],
  ['lights', 'light'],
  ['ppfd', 'light'],
  ['dli', 'light'],
  ['par', 'light'],
  ['led', 'light'],
  ['hps', 'light'],
  // heat
  ['heat', 'heat'],
  ['hot', 'heat'],
  ['temperature', 'heat'],
  ['temp', 'heat'],
  // cold
  ['cold', 'cold'],
  ['cool', 'cold'],
  ['chill', 'cold'],
  // mold-rot
  ['rot', 'mold-rot'],
  ['botrytis', 'mold-rot'],
  ['mold', 'mold-rot'],
  ['mould', 'mold-rot'],
  ['mildew', 'mold-rot'],
  ['pm', 'mold-rot'],
  // hermie
  ['hermie', 'hermie'],
  ['nanners', 'hermie'],
  ['bananas', 'hermie'],
  // deficiency
  ['deficiency', 'deficiency'],
  ['def', 'deficiency'],
  ['yellowing', 'deficiency'],
  ['chlorosis', 'deficiency'],
  // lockout
  ['lockout', 'lockout'],
  // trichomes
  ['trichomes', 'trichomes'],
  ['trichome', 'trichomes'],
  ['cloudy', 'trichomes'],
  ['amber', 'trichomes'],
  ['milky', 'trichomes'],
  // autoflower
  ['auto', 'autoflower'],
  ['autoflower', 'autoflower'],
  ['autoflowering', 'autoflower'],
  // genetics
  ['strain', 'genetics'],
  ['phenotype', 'genetics'],
  ['pheno', 'genetics'],
  ['genetics', 'genetics'],
  // water
  ['water', 'water'],
  ['watering', 'water'],
  // harvest
  ['harvest', 'harvest'],
  ['chop', 'harvest'],
  // drying
  ['dry', 'drying'],
  ['drying', 'drying'],
  // curing
  ['cure', 'curing'],
  ['curing', 'curing'],
  ['burping', 'curing'],
]);

// ── tokenizeQuestion ──────────────────────────────────────────────────────────

/**
 * Tokenize a question string to canonical tokens.
 * Lowercases, strips punctuation, removes stopwords, applies synonym map.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function tokenizeQuestion(text) {
  if (!text || typeof text !== 'string') return [];

  // Lowercase and strip punctuation except hyphens between words
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');

  // Apply multi-word phrase synonyms first
  let phraseReplaced = normalized;
  for (const [phrase, canonical] of SYNONYM_PHRASES) {
    // Replace whole phrase occurrences
    const escaped = phrase.replace(/[-]/g, '\\-');
    phraseReplaced = phraseReplaced.replace(new RegExp(`\\b${escaped}\\b`, 'g'), canonical);
  }

  const words = phraseReplaced.split(/\s+/).filter(Boolean);

  const tokens = [];
  for (const word of words) {
    if (!word) continue;
    // Remove stopwords
    if (STOPWORDS.has(word)) continue;
    // Map to canonical synonym or keep as-is
    const canonical = SYNONYM_TOKENS.get(word) ?? word;
    if (!tokens.includes(canonical)) {
      tokens.push(canonical);
    }
  }

  return tokens;
}

// ── Knowledge index ───────────────────────────────────────────────────────────

/** @type {Array<{id:string, source:string, title:string, body:string, stage:string|null, tags:string[]}>|null} */
let _cachedIndex = null;

/**
 * Convert a kebab-case id to a sentence-case label.
 * @param {string} id
 * @returns {string}
 */
function kebabToSentence(id) {
  return id
    .replace(/-/g, ' ')
    .replace(/^./, c => c.toUpperCase());
}

/**
 * Build a flat array of uniform knowledge items from all sources.
 * Memoized: same reference returned on subsequent calls.
 *
 * @returns {Array<{id:string, source:string, title:string, body:string, stage:string|null, tags:string[]}>}
 */
function buildKnowledgeIndex() {
  if (_cachedIndex !== null) return _cachedIndex;

  const index = [];

  // ── 1. Edge cases (primary) ────────────────────────────────────────
  for (const ec of EDGE_CASES) {
    const stages = Array.isArray(ec.trigger?.stage) ? ec.trigger.stage : [];
    const blockTags = Array.isArray(ec.blockActions) ? ec.blockActions.flatMap(a => tokenizeQuestion(a)) : [];
    const recTags = Array.isArray(ec.recommendActions) ? ec.recommendActions.flatMap(a => tokenizeQuestion(a)) : [];
    const idTags = tokenizeQuestion(ec.id.replace(/-/g, ' '));
    const tags = [...new Set([...idTags, ...stages, ...blockTags, ...recTags])];

    index.push({
      id: `edge-case:${ec.id}`,
      source: 'edge-case',
      title: kebabToSentence(ec.id),
      body: ec.correctAction || '',
      stage: stages[0] ?? null,
      tags,
    });
  }

  // ── 2. Edge cases (supplemental) ─────────────────────────────────
  for (const ec of EDGE_CASES_SUPPLEMENTAL) {
    const stages = Array.isArray(ec.trigger?.stage) ? ec.trigger.stage : [];
    const blockTags = Array.isArray(ec.blockActions) ? ec.blockActions.flatMap(a => tokenizeQuestion(a)) : [];
    const recTags = Array.isArray(ec.recommendActions) ? ec.recommendActions.flatMap(a => tokenizeQuestion(a)) : [];
    const idTags = tokenizeQuestion(ec.id.replace(/-/g, ' '));
    const catTags = ec.category ? [ec.category] : [];
    const tags = [...new Set([...idTags, ...stages, ...blockTags, ...recTags, ...catTags])];

    index.push({
      id: `edge-case:${ec.id}`,
      source: 'edge-case',
      title: kebabToSentence(ec.id),
      body: ec.correctAction || '',
      stage: stages[0] ?? null,
      tags,
    });
  }

  // ── 3. Stage content (one per stage) ──────────────────────────────
  for (const [stageId, content] of Object.entries(STAGE_CONTENT)) {
    if (!content) continue;
    const watchTags = Array.isArray(content.whatToWatch)
      ? content.whatToWatch.flatMap(w => tokenizeQuestion(w))
      : [];
    const whatToDoText = Array.isArray(content.whatToDo) ? content.whatToDo.join(' ') : '';
    const body = [content.whatsHappening || '', whatToDoText].filter(Boolean).join(' ');
    const tags = [...new Set([stageId, ...watchTags])];

    index.push({
      id: `stage-content:${stageId}`,
      source: 'stage-content',
      title: `${kebabToSentence(stageId)} stage`,
      body,
      stage: stageId,
      tags,
    });

    // Milestones (one per milestone)
    if (content.milestones && typeof content.milestones === 'object') {
      for (const [msId, ms] of Object.entries(content.milestones)) {
        if (!ms) continue;
        const msTags = [...new Set([stageId, ...tokenizeQuestion(msId.replace(/-/g, ' '))])];
        index.push({
          id: `milestone:${stageId}:${msId}`,
          source: 'milestone',
          title: kebabToSentence(msId),
          body: ms.detail || '',
          stage: stageId,
          tags: msTags,
        });
      }
    }
  }

  // ── 4. Advisor microcopy (one per entry) ──────────────────────────
  for (const [ruleId, mc] of Object.entries(ADVISOR_MICROCOPY)) {
    if (!mc) continue;
    const idTags = tokenizeQuestion(ruleId.replace(/-/g, ' '));
    const actionTags = mc.action ? tokenizeQuestion(mc.action) : [];
    const tags = [...new Set([...idTags, ...actionTags])];

    index.push({
      id: `advisor:${ruleId}`,
      source: 'advisor',
      title: mc.title || kebabToSentence(ruleId),
      body: mc.body || '',
      stage: null,
      tags,
    });
  }

  // ── 5. Deep dives (one per stage) ────────────────────────────────
  for (const [stageId, dd] of Object.entries(STAGE_DEEP_DIVES)) {
    if (!dd) continue;
    // First paragraph text only
    const firstPara = Array.isArray(dd.body)
      ? (dd.body.find(b => b && b.type === 'paragraph')?.text ?? '')
      : '';
    const titleTags = tokenizeQuestion(dd.title || '');
    const tags = [...new Set([stageId, ...titleTags])];

    index.push({
      id: `deep-dive:${stageId}`,
      source: 'deep-dive',
      title: dd.title || kebabToSentence(stageId),
      body: firstPara,
      stage: stageId,
      tags,
    });
  }

  // ── 6. Strain class adjustments (one per class) ───────────────────
  for (const [classKey, cls] of Object.entries(STRAIN_CLASS_ADJUSTMENTS)) {
    if (!cls) continue;
    const globalNotes = Array.isArray(cls.globalNotes) ? cls.globalNotes : [];
    const body = globalNotes.join(' ');
    const tags = [...new Set([classKey, 'genetics'])];

    index.push({
      id: `strain-class:${classKey}`,
      source: 'strain-class',
      title: cls.label || kebabToSentence(classKey),
      body,
      stage: null,
      tags,
    });
  }

  _cachedIndex = index;
  return _cachedIndex;
}

// ── answerQuestion ────────────────────────────────────────────────────────────

/**
 * Score knowledge items against the question and return the top matches.
 *
 * @param {string} questionText
 * @param {{currentStage?: string, plantFlags?: string[], minScore?: number, limit?: number}} [opts]
 * @returns {Array<{id:string, source:string, title:string, body:string, score:number, matchedTerms:string[]}>}
 */
export function answerQuestion(questionText, opts = {}) {
  const {
    currentStage = null,
    plantFlags = [],
    minScore = 3,
    limit = 3,
  } = opts;

  const tokens = tokenizeQuestion(questionText);
  if (tokens.length === 0) return [];

  const index = buildKnowledgeIndex();
  const results = [];

  for (const item of index) {
    let score = 0;
    const matchedTerms = [];

    const titleTokens = tokenizeQuestion(item.title);
    const bodyTokens = tokenizeQuestion(item.body);

    for (const token of tokens) {
      // +3 exact match in item.tags
      if (item.tags.includes(token)) {
        score += 3;
        if (!matchedTerms.includes(token)) matchedTerms.push(token);
      }
      // +2 token in item.title
      if (titleTokens.includes(token)) {
        score += 2;
        if (!matchedTerms.includes(token)) matchedTerms.push(token);
      }
      // +1 token in item.body
      if (bodyTokens.includes(token)) {
        score += 1;
        if (!matchedTerms.includes(token)) matchedTerms.push(token);
      }
    }

    // +1.5 stage alignment
    if (currentStage && item.stage && item.stage === currentStage) {
      score += 1.5;
    }

    // +1.5 plantFlag alignment: any plantFlag token matches item.tags
    if (Array.isArray(plantFlags) && plantFlags.length > 0) {
      const flagTokens = plantFlags.flatMap(f => tokenizeQuestion(f.replace(/[:/]/g, ' ')));
      for (const ft of flagTokens) {
        if (item.tags.includes(ft)) {
          score += 1.5;
          break; // award once per item
        }
      }
    }

    if (score >= minScore && matchedTerms.length > 0) {
      results.push({
        id: item.id,
        source: item.source,
        title: item.title,
        body: item.body,
        score,
        matchedTerms,
      });
    }
  }

  results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return results.slice(0, limit);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

/**
 * Run built-in self-tests.
 * @returns {Array<{pass: boolean, msg: string}>}
 */
export function runTests() {
  const results = [];

  function assert(pass, msg) {
    results.push({ pass, msg });
  }

  // Test 1: tokenizeQuestion produces calmag, hard-water, ph
  const CALMAG_Q = 'CalMag should be fine due to the hard water in the city, additionally I only use 6.0-6.5 pH Water';
  const tokens1 = tokenizeQuestion(CALMAG_Q);
  assert(
    tokens1.includes('calmag'),
    `T1a: tokenizeQuestion includes 'calmag' — got [${tokens1.join(', ')}]`,
  );
  assert(
    tokens1.includes('hard-water'),
    `T1b: tokenizeQuestion includes 'hard-water' — got [${tokens1.join(', ')}]`,
  );
  assert(
    tokens1.includes('ph'),
    `T1c: tokenizeQuestion includes 'ph' — got [${tokens1.join(', ')}]`,
  );

  // Test 2: answerQuestion returns at least 1 result relevant to calmag/tap-water
  const answers2 = answerQuestion(CALMAG_Q, { currentStage: 'early-veg' });
  const hasCalmagOrTapWater = answers2.some(r =>
    r.id.toLowerCase().includes('calmag') ||
    r.id.toLowerCase().includes('tap-water') ||
    r.matchedTerms.includes('calmag') ||
    r.matchedTerms.includes('hard-water'),
  );
  assert(
    answers2.length >= 1 && hasCalmagOrTapWater,
    `T2: answerQuestion for CalMag/hard-water returns relevant result — got ${answers2.length} result(s): [${answers2.map(r => r.id).join(', ')}]`,
  );

  // Test 3: unrelated query returns []
  const answers3 = answerQuestion('totally unrelated question about cars');
  assert(
    answers3.length === 0,
    `T3: unrelated query returns empty — got ${answers3.length} result(s)`,
  );

  // Test 4: scoring is deterministic (two calls same result)
  const run1 = answerQuestion(CALMAG_Q, { currentStage: 'early-veg' });
  const run2 = answerQuestion(CALMAG_Q, { currentStage: 'early-veg' });
  assert(
    JSON.stringify(run1) === JSON.stringify(run2),
    'T4: scoring is deterministic (two calls produce same result)',
  );

  // Test 5: buildKnowledgeIndex is memoized (same array reference)
  const idx1 = buildKnowledgeIndex();
  const idx2 = buildKnowledgeIndex();
  assert(
    idx1 === idx2,
    'T5: buildKnowledgeIndex returns same reference on second call (memoized)',
  );

  return results;
}
