// GrowDoc Companion — Data Schema Validation Tests
// Validates structural integrity of all data-only modules.
// No business logic tested here — only schema shape, required fields,
// value constraints, and cross-module uniqueness.

export async function runTests() {
  const results = [];

  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // ── STAGE_CONTENT ────────────────────────────────────────────────────────

  let STAGE_CONTENT;
  try {
    const mod = await import('../data/stage-content.js');
    STAGE_CONTENT = mod.STAGE_CONTENT;
    assert(true, 'stage-content.js loaded successfully');
  } catch (err) {
    assert(false, `stage-content.js failed to load: ${err.message}`);
    return results;
  }

  assert(STAGE_CONTENT !== null && typeof STAGE_CONTENT === 'object', 'STAGE_CONTENT is a non-null object');

  const stageKeys = Object.keys(STAGE_CONTENT);
  assert(stageKeys.length >= 5, `STAGE_CONTENT has 5+ stage keys (got ${stageKeys.length})`);

  const expectedStages = [
    'germination', 'seedling', 'early-veg', 'late-veg', 'transition',
    'early-flower', 'mid-flower', 'late-flower', 'ripening', 'drying',
    'curing', 'done',
  ];
  for (const key of expectedStages) {
    assert(key in STAGE_CONTENT, `STAGE_CONTENT has stage key '${key}'`);
  }

  // Per-stage required field shape
  const stageArrayFields = ['whatToDo', 'whatToWatch', 'commonMistakes'];
  let missingWhatsHappening = 0;
  let missingReadyToAdvance = 0;
  let emptyArrayField = 0;
  let nonStringScalar = 0;

  for (const key of stageKeys) {
    const stage = STAGE_CONTENT[key];

    // whatsHappening: non-empty string
    if (typeof stage.whatsHappening !== 'string' || stage.whatsHappening.trim() === '') {
      missingWhatsHappening++;
    }

    // readyToAdvance: non-empty string
    if (typeof stage.readyToAdvance !== 'string' || stage.readyToAdvance.trim() === '') {
      missingReadyToAdvance++;
    }

    // Array fields: must be non-empty arrays of strings
    for (const field of stageArrayFields) {
      const val = stage[field];
      if (!Array.isArray(val) || val.length === 0) {
        emptyArrayField++;
      } else if (val.some(item => typeof item !== 'string' || item.trim() === '')) {
        nonStringScalar++;
      }
    }
  }

  assert(missingWhatsHappening === 0,
    `All stages have non-empty 'whatsHappening' string — ${missingWhatsHappening} missing`);
  assert(missingReadyToAdvance === 0,
    `All stages have non-empty 'readyToAdvance' string — ${missingReadyToAdvance} missing`);
  assert(emptyArrayField === 0,
    `All stages have non-empty arrays for whatToDo/whatToWatch/commonMistakes — ${emptyArrayField} empty`);
  assert(nonStringScalar === 0,
    `All array items inside stages are non-empty strings — ${nonStringScalar} invalid`);

  // milestones: must be an object (may be empty for terminal stages)
  let badMilestones = 0;
  for (const key of stageKeys) {
    const stage = STAGE_CONTENT[key];
    if (stage.milestones === undefined || typeof stage.milestones !== 'object' || Array.isArray(stage.milestones)) {
      badMilestones++;
    }
  }
  assert(badMilestones === 0,
    `All stages have a milestones object — ${badMilestones} missing or wrong type`);

  // milestone entries each have detail (string) and tip (string)
  let badMilestoneShape = 0;
  for (const key of stageKeys) {
    const milestones = STAGE_CONTENT[key].milestones;
    for (const mKey of Object.keys(milestones)) {
      const m = milestones[mKey];
      if (typeof m.detail !== 'string' || m.detail.trim() === '') badMilestoneShape++;
      if (typeof m.tip !== 'string' || m.tip.trim() === '') badMilestoneShape++;
    }
  }
  assert(badMilestoneShape === 0,
    `All milestone entries have non-empty 'detail' and 'tip' strings — ${badMilestoneShape} invalid`);

  // ── STRAINS (strain-database.js) ─────────────────────────────────────────

  let STRAINS;
  try {
    const mod = await import('../data/strain-database.js');
    STRAINS = mod.STRAINS;
    assert(true, 'strain-database.js loaded successfully');
  } catch (err) {
    assert(false, `strain-database.js failed to load: ${err.message}`);
    // non-fatal: continue with remaining modules
    STRAINS = null;
  }

  if (STRAINS !== null) {
    const strainIds = Object.keys(STRAINS);
    assert(strainIds.length >= 500, `STRAINS has 500+ entries (got ${strainIds.length})`);

    // Every strain has name, breeder, type, flowerWeeks, stretchRatio, sensitivities
    let missingCoreFields = 0;
    const validTypes = new Set(['indica-dom', 'hybrid', 'sativa-dom']);
    let badType = 0;

    for (const id of strainIds) {
      const strain = STRAINS[id];
      if (!strain.name || !strain.breeder || !strain.type ||
          !strain.flowerWeeks || !strain.stretchRatio ||
          !Array.isArray(strain.sensitivities)) {
        missingCoreFields++;
      }
      if (!validTypes.has(strain.type)) badType++;
    }

    assert(missingCoreFields === 0,
      `All strains have name, breeder, type, flowerWeeks, stretchRatio, sensitivities — ${missingCoreFields} missing`);
    assert(badType === 0,
      `All strains have a valid type (indica-dom/hybrid/sativa-dom) — ${badType} invalid`);

    // flowerWeeks shape: {min, max} where min <= max and values in [4, 20]
    let badFlowerWeeks = 0;
    for (const id of strainIds) {
      const fw = STRAINS[id].flowerWeeks;
      if (!fw || typeof fw.min !== 'number' || typeof fw.max !== 'number' ||
          fw.min > fw.max || fw.min < 4 || fw.max > 20) {
        badFlowerWeeks++;
      }
    }
    assert(badFlowerWeeks === 0,
      `All strains have valid flowerWeeks {min, max} in [4-20] range — ${badFlowerWeeks} invalid`);

    // stretchRatio shape: {min, max} where min <= max and values in [1.0, 5.0]
    let badStretch = 0;
    for (const id of strainIds) {
      const sr = STRAINS[id].stretchRatio;
      if (!sr || typeof sr.min !== 'number' || typeof sr.max !== 'number' ||
          sr.min > sr.max || sr.min < 1.0 || sr.max > 5.0) {
        badStretch++;
      }
    }
    assert(badStretch === 0,
      `All strains have valid stretchRatio {min, max} in [1.0-5.0] range — ${badStretch} invalid`);

    // Autoflower entries: isAuto === true implies totalDays {min, max}
    const autoIds = strainIds.filter(id => STRAINS[id].isAuto === true);
    assert(autoIds.length >= 1,
      `STRAINS contains at least one autoflower entry (isAuto:true) — found ${autoIds.length}`);

    let badTotalDays = 0;
    for (const id of autoIds) {
      const td = STRAINS[id].totalDays;
      if (!td || typeof td.min !== 'number' || typeof td.max !== 'number' ||
          td.min > td.max || td.min < 50) {
        badTotalDays++;
      }
    }
    assert(badTotalDays === 0,
      `All autoflower entries have valid totalDays {min, max} (min>=50) — ${badTotalDays} invalid`);

    // Non-auto entries must NOT have isAuto set to true
    const nonAutoIds = strainIds.filter(id => STRAINS[id].isAuto !== true);
    assert(nonAutoIds.length > autoIds.length,
      `Majority of strains are non-autoflower (${nonAutoIds.length} photo vs ${autoIds.length} auto)`);

    // All strain IDs are kebab-case (lowercase, letters/digits/hyphens only)
    let badIdFormat = 0;
    for (const id of strainIds) {
      if (id !== id.toLowerCase() || /[^a-z0-9-]/.test(id)) badIdFormat++;
    }
    assert(badIdFormat === 0,
      `All strain IDs are kebab-case — ${badIdFormat} invalid`);

    // Strain names are unique
    const nameSet = new Set(strainIds.map(id => STRAINS[id].name.toLowerCase()));
    assert(nameSet.size === strainIds.length,
      `All strain names are unique — ${strainIds.length} entries, ${nameSet.size} unique names`);
  }

  // ── ADVISOR_MICROCOPY ────────────────────────────────────────────────────

  let ADVISOR_MICROCOPY;
  try {
    const mod = await import('../data/advisor-microcopy.js');
    ADVISOR_MICROCOPY = mod.ADVISOR_MICROCOPY;
    assert(true, 'advisor-microcopy.js loaded successfully');
  } catch (err) {
    assert(false, `advisor-microcopy.js failed to load: ${err.message}`);
    ADVISOR_MICROCOPY = null;
  }

  if (ADVISOR_MICROCOPY !== null) {
    const microcopyKeys = Object.keys(ADVISOR_MICROCOPY);
    assert(microcopyKeys.length >= 5,
      `ADVISOR_MICROCOPY has 5+ entries (got ${microcopyKeys.length})`);

    const validSeverities = new Set(['info', 'warning', 'urgent']);
    let badSeverity = 0;
    let missingTitle = 0;
    let titleTooLong = 0;
    let missingBody = 0;
    let bodyTooLong = 0;
    let missingAction = 0;

    for (const key of microcopyKeys) {
      const entry = ADVISOR_MICROCOPY[key];

      if (!validSeverities.has(entry.severity)) badSeverity++;

      if (typeof entry.title !== 'string' || entry.title.trim() === '') {
        missingTitle++;
      } else if (entry.title.length > 35) {
        titleTooLong++;
      }

      if (typeof entry.body !== 'string' || entry.body.trim() === '') {
        missingBody++;
      } else if (entry.body.length > 130) {
        bodyTooLong++;
      }

      if (typeof entry.action !== 'string' || entry.action.trim() === '') {
        missingAction++;
      }
    }

    assert(badSeverity === 0,
      `All microcopy entries have valid severity (info/warning/urgent) — ${badSeverity} invalid`);
    assert(missingTitle === 0,
      `All microcopy entries have a non-empty title — ${missingTitle} missing`);
    assert(titleTooLong === 0,
      `All microcopy titles are <= 35 chars — ${titleTooLong} too long`);
    assert(missingBody === 0,
      `All microcopy entries have a non-empty body — ${missingBody} missing`);
    assert(bodyTooLong === 0,
      `All microcopy bodies are <= 130 chars — ${bodyTooLong} too long`);
    assert(missingAction === 0,
      `All microcopy entries have a non-empty action — ${missingAction} missing`);

    // All microcopy IDs are kebab-case
    let badMicrocopyId = 0;
    for (const key of microcopyKeys) {
      if (key !== key.toLowerCase() || /[^a-z0-9-]/.test(key)) badMicrocopyId++;
    }
    assert(badMicrocopyId === 0,
      `All microcopy IDs are kebab-case — ${badMicrocopyId} invalid`);

    // All three severity levels are represented
    const severitiesUsed = new Set(microcopyKeys.map(k => ADVISOR_MICROCOPY[k].severity));
    assert(severitiesUsed.has('info'), 'ADVISOR_MICROCOPY contains at least one "info" entry');
    assert(severitiesUsed.has('warning'), 'ADVISOR_MICROCOPY contains at least one "warning" entry');
    assert(severitiesUsed.has('urgent'), 'ADVISOR_MICROCOPY contains at least one "urgent" entry');
  }

  // ── EDGE_CASES (primary) ─────────────────────────────────────────────────

  let EDGE_CASES;
  try {
    const mod = await import('../data/edge-case-knowledge.js');
    EDGE_CASES = mod.EDGE_CASES;
    assert(true, 'edge-case-knowledge.js loaded successfully');
  } catch (err) {
    assert(false, `edge-case-knowledge.js failed to load: ${err.message}`);
    EDGE_CASES = null;
  }

  if (EDGE_CASES !== null) {
    assert(Array.isArray(EDGE_CASES), 'EDGE_CASES is an array');
    assert(EDGE_CASES.length >= 5,
      `EDGE_CASES has 5+ entries (got ${EDGE_CASES.length})`);

    const validEdgeSeverities = new Set(['critical', 'high', 'medium']);
    const validEdgeConfidences = new Set(['high', 'medium', 'low']);
    let missingId = 0;
    let missingTrigger = 0;
    let missingGeneralAdvice = 0;
    let missingCorrectAction = 0;
    let badEdgeSeverity = 0;
    let badEdgeConfidence = 0;
    let missingBlockActions = 0;
    let missingRecommendActions = 0;

    for (const entry of EDGE_CASES) {
      if (typeof entry.id !== 'string' || entry.id.trim() === '') missingId++;

      if (!entry.trigger || typeof entry.trigger !== 'object' ||
          !Array.isArray(entry.trigger.stage) ||
          !Array.isArray(entry.trigger.recentEvents)) {
        missingTrigger++;
      }

      if (typeof entry.generalAdvice !== 'string' || entry.generalAdvice.trim() === '') missingGeneralAdvice++;
      if (typeof entry.correctAction !== 'string' || entry.correctAction.trim() === '') missingCorrectAction++;

      if (!validEdgeSeverities.has(entry.severity)) badEdgeSeverity++;
      if (!validEdgeConfidences.has(entry.confidence)) badEdgeConfidence++;

      if (!Array.isArray(entry.blockActions)) missingBlockActions++;
      if (!Array.isArray(entry.recommendActions)) missingRecommendActions++;
    }

    assert(missingId === 0,
      `All EDGE_CASES entries have a non-empty 'id' string — ${missingId} missing`);
    assert(missingTrigger === 0,
      `All EDGE_CASES entries have a valid 'trigger' {stage[], recentEvents[]} — ${missingTrigger} invalid`);
    assert(missingGeneralAdvice === 0,
      `All EDGE_CASES entries have non-empty 'generalAdvice' — ${missingGeneralAdvice} missing`);
    assert(missingCorrectAction === 0,
      `All EDGE_CASES entries have non-empty 'correctAction' — ${missingCorrectAction} missing`);
    assert(badEdgeSeverity === 0,
      `All EDGE_CASES entries have valid 'severity' (critical/high/medium) — ${badEdgeSeverity} invalid`);
    assert(badEdgeConfidence === 0,
      `All EDGE_CASES entries have valid 'confidence' (high/medium/low) — ${badEdgeConfidence} invalid`);
    assert(missingBlockActions === 0,
      `All EDGE_CASES entries have 'blockActions' array — ${missingBlockActions} missing`);
    assert(missingRecommendActions === 0,
      `All EDGE_CASES entries have 'recommendActions' array — ${missingRecommendActions} missing`);

    // IDs are unique within primary set
    const primaryIds = EDGE_CASES.map(e => e.id);
    const uniquePrimaryIds = new Set(primaryIds);
    assert(uniquePrimaryIds.size === primaryIds.length,
      `All EDGE_CASES ids are unique — ${primaryIds.length} entries, ${uniquePrimaryIds.size} unique`);

    // IDs are kebab-case
    let badEdgeId = 0;
    for (const id of primaryIds) {
      if (id !== id.toLowerCase() || /[^a-z0-9-]/.test(id)) badEdgeId++;
    }
    assert(badEdgeId === 0,
      `All EDGE_CASES ids are kebab-case — ${badEdgeId} invalid`);

    // trigger.stage values reference known stage ids
    const knownStageIds = new Set([
      'germination', 'seedling', 'early-veg', 'late-veg', 'transition',
      'early-flower', 'mid-flower', 'late-flower', 'ripening', 'drying',
      'curing', 'done',
    ]);
    let unknownStageRef = 0;
    for (const entry of EDGE_CASES) {
      for (const stageRef of entry.trigger.stage) {
        if (!knownStageIds.has(stageRef)) unknownStageRef++;
      }
    }
    assert(unknownStageRef === 0,
      `All EDGE_CASES trigger.stage values reference known stage ids — ${unknownStageRef} unknown`);

    // ── EDGE_CASES_SUPPLEMENTAL ────────────────────────────────────────────

    let EDGE_CASES_SUPPLEMENTAL;
    try {
      const suppMod = await import('../data/edge-case-knowledge-supplemental.js');
      EDGE_CASES_SUPPLEMENTAL = suppMod.EDGE_CASES_SUPPLEMENTAL;
      assert(true, 'edge-case-knowledge-supplemental.js loaded successfully');
    } catch (err) {
      assert(false, `edge-case-knowledge-supplemental.js failed to load: ${err.message}`);
      EDGE_CASES_SUPPLEMENTAL = null;
    }

    if (EDGE_CASES_SUPPLEMENTAL !== null) {
      assert(Array.isArray(EDGE_CASES_SUPPLEMENTAL), 'EDGE_CASES_SUPPLEMENTAL is an array');
      assert(EDGE_CASES_SUPPLEMENTAL.length >= 5,
        `EDGE_CASES_SUPPLEMENTAL has 5+ entries (got ${EDGE_CASES_SUPPLEMENTAL.length})`);

      let suppMissingId = 0;
      let suppMissingTrigger = 0;
      let suppMissingGeneralAdvice = 0;
      let suppMissingCorrectAction = 0;
      let suppBadSeverity = 0;
      let suppBadConfidence = 0;
      let suppMissingBlockActions = 0;
      let suppMissingRecommendActions = 0;

      for (const entry of EDGE_CASES_SUPPLEMENTAL) {
        if (typeof entry.id !== 'string' || entry.id.trim() === '') suppMissingId++;

        if (!entry.trigger || typeof entry.trigger !== 'object' ||
            !Array.isArray(entry.trigger.stage) ||
            !Array.isArray(entry.trigger.recentEvents)) {
          suppMissingTrigger++;
        }

        if (typeof entry.generalAdvice !== 'string' || entry.generalAdvice.trim() === '') suppMissingGeneralAdvice++;
        if (typeof entry.correctAction !== 'string' || entry.correctAction.trim() === '') suppMissingCorrectAction++;

        if (!validEdgeSeverities.has(entry.severity)) suppBadSeverity++;
        if (!validEdgeConfidences.has(entry.confidence)) suppBadConfidence++;

        if (!Array.isArray(entry.blockActions)) suppMissingBlockActions++;
        if (!Array.isArray(entry.recommendActions)) suppMissingRecommendActions++;
      }

      assert(suppMissingId === 0,
        `All EDGE_CASES_SUPPLEMENTAL entries have a non-empty 'id' — ${suppMissingId} missing`);
      assert(suppMissingTrigger === 0,
        `All EDGE_CASES_SUPPLEMENTAL entries have a valid 'trigger' — ${suppMissingTrigger} invalid`);
      assert(suppMissingGeneralAdvice === 0,
        `All EDGE_CASES_SUPPLEMENTAL entries have 'generalAdvice' — ${suppMissingGeneralAdvice} missing`);
      assert(suppMissingCorrectAction === 0,
        `All EDGE_CASES_SUPPLEMENTAL entries have 'correctAction' — ${suppMissingCorrectAction} missing`);
      assert(suppBadSeverity === 0,
        `All EDGE_CASES_SUPPLEMENTAL entries have valid 'severity' — ${suppBadSeverity} invalid`);
      assert(suppBadConfidence === 0,
        `All EDGE_CASES_SUPPLEMENTAL entries have valid 'confidence' — ${suppBadConfidence} invalid`);
      assert(suppMissingBlockActions === 0,
        `All EDGE_CASES_SUPPLEMENTAL entries have 'blockActions' array — ${suppMissingBlockActions} missing`);
      assert(suppMissingRecommendActions === 0,
        `All EDGE_CASES_SUPPLEMENTAL entries have 'recommendActions' array — ${suppMissingRecommendActions} missing`);

      // Supplemental IDs are unique within their own set
      const suppIds = EDGE_CASES_SUPPLEMENTAL.map(e => e.id);
      const uniqueSuppIds = new Set(suppIds);
      assert(uniqueSuppIds.size === suppIds.length,
        `All EDGE_CASES_SUPPLEMENTAL ids are unique — ${suppIds.length} entries, ${uniqueSuppIds.size} unique`);

      // IDs are kebab-case
      let badSuppId = 0;
      for (const id of suppIds) {
        if (id !== id.toLowerCase() || /[^a-z0-9-]/.test(id)) badSuppId++;
      }
      assert(badSuppId === 0,
        `All EDGE_CASES_SUPPLEMENTAL ids are kebab-case — ${badSuppId} invalid`);

      // trigger.stage values reference known stage ids
      let suppUnknownStage = 0;
      for (const entry of EDGE_CASES_SUPPLEMENTAL) {
        for (const stageRef of entry.trigger.stage) {
          if (!knownStageIds.has(stageRef)) suppUnknownStage++;
        }
      }
      assert(suppUnknownStage === 0,
        `All EDGE_CASES_SUPPLEMENTAL trigger.stage values are known stage ids — ${suppUnknownStage} unknown`);

      // Cross-module uniqueness: no id collision between primary and supplemental
      const allIds = [...primaryIds, ...suppIds];
      const allUniqueIds = new Set(allIds);
      assert(allUniqueIds.size === allIds.length,
        `No id collisions between EDGE_CASES and EDGE_CASES_SUPPLEMENTAL — ${allIds.length} total, ${allUniqueIds.size} unique`);
    }
  }

  return results;
}
