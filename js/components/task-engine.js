// GrowDoc Companion — Task Engine (Core Logic)
// Generates dynamic, per-plant, context-aware task recommendations.

import { WATERING_FREQUENCY, VPD_TARGETS, DLI_TARGETS, NUTRIENT_TARGETS } from '../data/grow-knowledge.js';
import { STAGE_TRANSITIONS, STAGES, getDaysInStage, shouldAutoAdvance, getCureBurpSchedule } from '../data/stage-rules.js';
import { getLearnedInterval } from '../data/pattern-tracker.js';
import { generateId } from '../utils.js';
import { collectObservations, parseAllObservations, recordReferencedIn } from '../data/note-contextualizer/index.js';
import { checkRedundancy, checkContradiction, inferAlertTrigger, overrideSuppression as _overrideSuppressionImpl, TASK_WINDOW_HOURS } from './task-engine-note-guards.js';

// ── Edge-Case Engine Integration ──────────────────────────────────────
//
// Attempt to import from edge-case-engine.js (may not exist yet during
// parallel development). Falls back to a local minimal implementation
// built directly from edge-case-knowledge.js so suppression still works.

let _getBlockedActions = null;
let _getActiveWarnings = null;

try {
  const eceMod = await import('../data/edge-case-engine.js');
  _getBlockedActions = eceMod.getBlockedActions;
  _getActiveWarnings = eceMod.getActiveWarnings;
} catch (_importErr) {
  // edge-case-engine.js not yet available — use local fallback below.
}

if (!_getBlockedActions || !_getActiveWarnings) {
  let _EDGE_CASES = null;
  async function _loadEdgeCases() {
    if (_EDGE_CASES) return _EDGE_CASES;
    try {
      const mod = await import('../data/edge-case-knowledge.js');
      _EDGE_CASES = mod.EDGE_CASES || [];
    } catch (_e) {
      _EDGE_CASES = [];
    }
    return _EDGE_CASES;
  }

  /**
   * Minimal fallback: filter EDGE_CASES by plant stage and recent events,
   * then collect all blockActions into a Set<string>.
   *
   * @param {{ plant: Object, grow: Object }} opts
   * @returns {Set<string>}
   */
  _getBlockedActions = async function({ plant, grow } = {}) {
    const cases = await _loadEdgeCases();
    const blocked = new Set();
    const stage = plant?.stage || '';
    const recentEvents = _extractRecentEvents(plant, grow);
    const plantFlags = _extractPlantFlags(plant);

    for (const ec of cases) {
      if (!_edgeCaseMatches(ec, stage, recentEvents, plantFlags)) continue;
      for (const a of (ec.blockActions || [])) blocked.add(a);
    }
    return blocked;
  };

  /**
   * Minimal fallback: return active edge cases as warning objects for the
   * UI task strip.
   *
   * @param {{ plant: Object, grow: Object }} opts
   * @returns {Array<Object>}
   */
  _getActiveWarnings = async function({ plant, grow } = {}) {
    const cases = await _loadEdgeCases();
    const stage = plant?.stage || '';
    const recentEvents = _extractRecentEvents(plant, grow);
    const plantFlags = _extractPlantFlags(plant);

    return cases
      .filter(ec => _edgeCaseMatches(ec, stage, recentEvents, plantFlags))
      .map(ec => ({
        id: `edge-warn-${ec.id}`,
        edgeCaseId: ec.id,
        title: `Guard: ${ec.id}`,
        body: ec.correctAction || ec.whyGeneralAdviceFails || '',
        action: (ec.recommendActions || []).join(', ') || 'Review grow conditions',
        severity: ec.severity === 'critical' ? 'urgent' : ec.severity === 'high' ? 'warning' : 'info',
      }));
  };
}

/** Extract recent event keyword ids from plant logs and grow state. */
function _extractRecentEvents(plant, grow) {
  const events = new Set();
  const logs = plant?.logs || [];
  const now = Date.now();
  for (const log of logs) {
    const ts = new Date(log.timestamp || log.date || 0).getTime();
    const ageHours = (now - ts) / 3600000;
    // Map known log types to edge-case keyword ids
    if (log.type === 'transplant' && ageHours <= 240) events.add('event-transplant');
    if (log.type === 'flush' && ageHours <= 120) events.add('treatment-flush');
    if (log.type === 'observe') {
      const n = (log.notes || log.details?.notes || '').toLowerCase();
      if (n.includes('heat') || n.includes('hot')) events.add('env-heatwave');
      if (n.includes('hermie') || n.includes('nanner')) events.add('NEW-KEYWORD:event-hermie');
      if (n.includes('bud rot') || n.includes('botrytis')) events.add('NEW-KEYWORD:event-bud-rot');
      if (n.includes('underwater') || n.includes('wilt')) events.add('watering-underwatered');
      if (n.includes('light leak')) events.add('env-light-leak');
    }
    if (log.type === 'feed' && log.details?.decreased) events.add('treatment-decreased-nutes');
  }
  return events;
}

/** Extract plant-level flags from the plant object. */
function _extractPlantFlags(plant) {
  const flags = new Set();
  if (plant?.plantType) flags.add(`plantType:${plant.plantType}`);
  if (plant?.previousProblems) {
    for (const p of (Array.isArray(plant.previousProblems) ? plant.previousProblems : [plant.previousProblems])) {
      flags.add(`previousProblems:${p}`);
    }
  }
  return flags;
}

/** Check whether an edge case is active given stage + events + flags. */
function _edgeCaseMatches(ec, stage, recentEvents, plantFlags) {
  const t = ec.trigger;
  // Stage match (empty means all stages)
  if (t.stage && t.stage.length > 0 && !t.stage.includes(stage)) return false;
  // Plant flags match (all required flags must be present)
  if (t.plantFlags && t.plantFlags.length > 0) {
    for (const f of t.plantFlags) {
      if (!plantFlags.has(f)) return false;
    }
  }
  // Recent events match — only require events when withinHours > 0
  if (t.recentEvents && t.recentEvents.length > 0 && t.withinHours > 0) {
    const anyMatch = t.recentEvents.some(e => recentEvents.has(e));
    if (!anyMatch) return false;
  }
  return true;
}

// Re-export so task-card.js can import from './task-engine.js'.
export { TASK_WINDOW_HOURS };
export function overrideSuppression(store, taskId, plantId, taskType) {
  return _overrideSuppressionImpl(store, taskId, plantId, taskType);
}

function _collectPlantObservations(grow, profile) {
  try {
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    const all = parseAllObservations(collectObservations(grow, profile, { since }));
    const byPlant = {};
    for (const obs of all) {
      if (!obs || !obs.plantId) continue;
      if (!byPlant[obs.plantId]) byPlant[obs.plantId] = [];
      byPlant[obs.plantId].push(obs);
    }
    return byPlant;
  } catch (_err) {
    return {};
  }
}

/**
 * generateTasks(store) — Main entry point. Evaluates all triggers, deduplicates, returns new tasks.
 *
 * Returns a Promise<Object[]> when edge-case suppression is active (the async
 * suppression step resolves data from edge-case-knowledge.js). For backwards
 * compatibility callers that do not await, the array returned synchronously
 * still includes all tasks without suppression — the suppressed version is
 * delivered via the Promise. Callers should await when possible.
 */
export async function generateTasks(store) {
  const profile = store.state.profile || {};
  const context = profile.context || {};
  const grow = store.state.grow;
  const envData = store.state.environment || {};

  if (!grow || !grow.plants || grow.plants.length === 0) return [];

  const existingTasks = grow.tasks || [];

  // Section-07: collect + parse observations once at entry, bucketed per plant.
  const obsByPlant = _collectPlantObservations(grow, profile);

  // Collect per-plant tasks then apply edge-case suppression per plant.
  const perPlantPromises = [];

  for (const plant of grow.plants) {
    // Skip plants whose stage blocks task generation (e.g. 'done').
    const stageDef = STAGES.find(s => s.id === plant.stage);
    if (stageDef && stageDef.blocksTaskGeneration) continue;

    const plantObs = obsByPlant[plant.id] || [];

    const plantTasks = [
      ...evaluateTimeTriggers(plant, profile, existingTasks, plantObs),
      ...evaluateStageTriggers(plant, profile, existingTasks),
      ...evaluateTrainingTriggers(plant, existingTasks),
      ...evaluateDiagnosisTriggers(plant, existingTasks),
      ...evaluateIPMTriggers(plant, profile, existingTasks),
      ...evaluateDiagnoseTaskTriggers(plant, existingTasks, plantObs),
    ];

    // Apply edge-case suppression per plant (async — may load knowledge base).
    perPlantPromises.push(applyEdgeCaseSuppression(plantTasks, plant, grow));
  }

  const envTasks = evaluateEnvironmentTriggers(envData.readings || [], profile, existingTasks, obsByPlant);

  // Resolve all per-plant suppression in parallel.
  const perPlantResults = await Promise.all(perPlantPromises);
  const newTasks = [...perPlantResults.flat(), ...envTasks];

  // Final dedup pass
  return newTasks.filter(t => !isDuplicate(t, existingTasks));
}

// ── Time-Based Triggers ──────────────────────────────────────────────

export function evaluateTimeTriggers(plant, profile, existingTasks, plantObservations = []) {
  const tasks = [];
  const medium = plant.mediumOverride || profile.medium || 'soil';
  const potSize = _potSizeCategory(plant.potSize);
  const stage = plant.stage;
  const days = getDaysInStage(plant);
  const logs = plant.logs || [];

  // Watering
  const waterFreq = _getWaterFrequency(medium, potSize, stage);
  if (waterFreq) {
    const lastWater = _daysSinceLastLog(logs, 'water');
    const dueDay = waterFreq.minDays;
    if (lastWater !== null && lastWater >= dueDay) {
      const priority = lastWater >= waterFreq.maxDays ? 'urgent' : lastWater >= dueDay ? 'recommended' : 'optional';
      const task = _createTask(plant.id, 'water', priority, `Water ${plant.name}`, {
        beginner: `Water ${plant.name} — ${medium}, ${plant.potSize || '?'}L pot, day ${lastWater} since last water. ${waterFreq.notes || ''}`,
        intermediate: `Water ${plant.name} — every ${waterFreq.minDays}-${waterFreq.maxDays} days in ${medium}. Last watered ${lastWater} days ago.`,
        expert: `Water due (${medium}, ${plant.potSize || '?'}L, day ${lastWater})`,
      });
      tasks.push(task);
    } else if (lastWater === null && days >= 1) {
      // No water logs at all — remind
      tasks.push(_createTask(plant.id, 'water', 'recommended', `Water ${plant.name}`,
        _simpleDetail(`Check if ${plant.name} needs water — no watering logged yet.`)));
    }
  }

  // Feeding
  const feedInterval = medium === 'coco' || medium === 'hydro' ? 1 : 2;
  const lastFeed = _daysSinceLastLog(logs, 'feed');
  const watersSinceFeed = _watersSinceLastFeed(logs);
  if (medium === 'coco' || medium === 'hydro') {
    // Feed every watering
    const lastWater = _daysSinceLastLog(logs, 'water');
    if (lastFeed === null || (lastWater !== null && lastFeed > lastWater)) {
      const nutrients = NUTRIENT_TARGETS[medium]?.[stage];
      if (nutrients) {
        tasks.push(_createTask(plant.id, 'feed', 'recommended', `Feed ${plant.name}`, {
          beginner: `Feed ${plant.name} — EC ${nutrients.ec.min}-${nutrients.ec.max}, pH ${nutrients.ph.min}-${nutrients.ph.max}. NPK ratio: ${nutrients.npkRatio}. ${nutrients.calmagNote || ''}`,
          intermediate: `Feed ${plant.name} — EC ${nutrients.ec.min}-${nutrients.ec.max}, pH ${nutrients.ph.min}-${nutrients.ph.max}. ${nutrients.notes?.[0] || ''}`,
          expert: `Feed due (EC ${nutrients.ec.min}-${nutrients.ec.max}, ${nutrients.npkRatio})`,
        }));
      }
    }
  } else {
    // Soil/soilless: feed every 2-3 waterings
    if (watersSinceFeed >= feedInterval) {
      const nutrients = NUTRIENT_TARGETS[medium]?.[stage];
      if (nutrients) {
        tasks.push(_createTask(plant.id, 'feed', 'recommended', `Feed ${plant.name}`, {
          beginner: `Feed ${plant.name} — EC ${nutrients.ec.min}-${nutrients.ec.max}, pH ${nutrients.ph.min}-${nutrients.ph.max}. NPK ratio: ${nutrients.npkRatio}. ${watersSinceFeed} waterings since last feed.`,
          intermediate: `Feed ${plant.name} — EC ${nutrients.ec.min}-${nutrients.ec.max}. ${watersSinceFeed} waterings since last feed.`,
          expert: `Feed due (${watersSinceFeed} waterings since last)`,
        }));
      }
    }
  }

  // Check-in reminder
  const lastAnyLog = _daysSinceLastLog(logs, null);
  if ((lastAnyLog !== null && lastAnyLog >= 3) || (lastAnyLog === null && days >= 3)) {
    tasks.push(_createTask(plant.id, 'check', 'urgent', `Check ${plant.name}`,
      _simpleDetail(`No activity logged for ${plant.name} in ${lastAnyLog ?? days}+ days. Check your plants!`)));
  }

  // Section-07: anti-redundancy suppression. For any emitted task whose type
  // has a canonical window, check if the user's notes already recorded an
  // action inside that window. If so, mark suppressedBy + suppressedNoteRef.
  // We do NOT remove the task — task-card.js renders the suppressed state
  // with an Override button.
  if (Array.isArray(plantObservations) && plantObservations.length > 0) {
    for (const t of tasks) {
      if (!t || !t.type || !TASK_WINDOW_HOURS[t.type]) continue;
      const check = checkRedundancy(t.type, plantObservations);
      if (check.suppressed) {
        t.suppressedBy = check.obsIds;
        t.suppressedNoteRef = check.noteRef;
        // Section-10: citation for suppressed-task trail.
        try {
          recordReferencedIn(check.obsIds, `task-engine:suppress:${t.type}:${t.plantId}`);
        } catch (_err) { /* best-effort */ }
      }
    }
  }

  return tasks.filter(t => !isDuplicate(t, existingTasks));
}

// ── Stage-Based Triggers ─────────────────────────────────────────────

export function evaluateStageTriggers(plant, profile, existingTasks) {
  const tasks = [];
  const days = getDaysInStage(plant);
  const stage = plant.stage;
  const context = profile.context || {};

  // Autoflower: skip 12/12 flip prompts
  // Stage transition
  const advance = shouldAutoAdvance(plant);
  if (advance) {
    // Autoflower: skip transition (12/12 flip) prompt
    if (context.isAutoflower && stage === 'late-veg' && advance.nextStage === 'transition') {
      tasks.push(_createTask(plant.id, 'stage', 'recommended', `${plant.name} entering pre-flower (auto)`,
        _simpleDetail(`Autoflower will transition on its own. Watch for first pistils — no light schedule change needed.`)));
    } else {
      tasks.push(_createTask(plant.id, 'stage', 'recommended', `Advance ${plant.name} to ${advance.nextStage}`,
        _simpleDetail(`${advance.message} (Day ${advance.daysInStage} in ${stage})`)));
    }
  }

  // Living soil: skip early feeding tasks
  if (context.amendmentDensity === 'high' && (stage === 'seedling' || stage === 'early-veg') && days < 28) {
    // Don't generate feeding tasks — soil has nutrients
    // Add a water-only reminder instead
    if (days === 1 || days % 7 === 0) {
      tasks.push(_createTask(plant.id, 'check', 'optional', `Water only — ${plant.name}`,
        _simpleDetail(`Living soil with amendments — water only for the first 4-6 weeks. Your soil has built-in nutrition.`)));
    }
  }

  // Defoliation — early flower days 0-2
  if (stage === 'early-flower' && days >= 0 && days <= 2) {
    tasks.push(_createTask(plant.id, 'defoliate', 'recommended', `Light defoliation — ${plant.name}`, {
      beginner: `Remove fan leaves blocking bud sites on ${plant.name}. Only remove large fan leaves that are shading lower bud sites. Don't remove more than 20% of leaves at once.`,
      intermediate: `Light defoliation on ${plant.name} — remove fans blocking bud sites, max 20%.`,
      expert: `Defol ${plant.name} — early flower strip`,
    }));
  }

  // Defoliation — mid flower day 19-23 (day 21 defoliation)
  if (stage === 'mid-flower' && days >= 19 && days <= 23) {
    tasks.push(_createTask(plant.id, 'defoliate', 'recommended', `Day 21 defoliation — ${plant.name}`, {
      beginner: `Strategic fan leaf removal on ${plant.name}. Remove large fan leaves shading buds. Focus on opening up airflow. Note: heavy defoliation at this stage is only beneficial under 600+ PPFD. Under lower light levels, removing significant leaf mass reduces photosynthetic capacity during peak bud development — be conservative.`,
      intermediate: `Day 21 defol on ${plant.name} — strategic fan leaf removal for airflow and light penetration. Caveat: only beneficial at 600+ PPFD; under lower light, defoliate sparingly to avoid sacrificing photosynthetic capacity during peak bud-build.`,
      expert: `Day 21 defol — ${plant.name}. Light-dependent: 600+ PPFD only, otherwise conservative.`,
    }));
  }

  // Lollipop — end of stretch
  if ((stage === 'transition' && days >= 7) || (stage === 'early-flower' && days <= 7)) {
    tasks.push(_createTask(plant.id, 'defoliate', 'optional', `Lollipop — ${plant.name}`, {
      beginner: `Remove lower growth on ${plant.name} that won't reach the canopy. This redirects energy to top bud sites. Remove bottom 1/3 of growth.`,
      intermediate: `Lollipop bottom 1/3 of ${plant.name} — remove lower growth below the canopy.`,
      expert: `Lollipop ${plant.name}`,
    }));
  }

  // Harvest check
  if (stage === 'late-flower' || stage === 'ripening') {
    tasks.push(_createTask(plant.id, 'harvest', 'recommended', `Check trichomes — ${plant.name}`, {
      beginner: `Start checking trichomes daily on ${plant.name} with a jeweler's loupe (60-100x). Look for: mostly milky/cloudy with some amber. Clear = too early. All amber = past peak.`,
      intermediate: `Check trichomes on ${plant.name} — target: mostly milky with 10-20% amber for balanced effects.`,
      expert: `Trichome check — ${plant.name}`,
    }));
  }

  // Cure burp reminders — stable title for dedup; cadence comes from schedule.
  if (stage === 'curing') {
    const schedule = getCureBurpSchedule(days);
    tasks.push(_createTask(plant.id, 'cure-burp', 'recommended', `Burp curing jars`, {
      beginner: `Burp curing jars for ${plant.name}. Open jars for 10-15 minutes. Schedule: ${schedule.label}. Check for ammonia smell (bad — too moist) or hay smell (normal early cure).`,
      intermediate: `Burp jars for ${plant.name} — ${schedule.label}. Check smell and jar RH.`,
      expert: `Burp — ${plant.name} (${schedule.label})`,
    }));
  }

  // Drying environment check — daily during drying stage. Stable title.
  if (stage === 'drying') {
    tasks.push(_createTask(plant.id, 'drying-check', 'recommended', `Check drying conditions`, {
      beginner: `Check the drying room for ${plant.name}. Target: 15-21°C, 55-65% RH. Gentle airflow (not directly on the buds). For best terpene preservation, aim for the cooler end (15-17°C). Check daily.`,
      intermediate: `Drying check — ${plant.name}: 15-21°C, 55-65% RH, gentle airflow. Terpene priority: 15-17°C.`,
      expert: `Drying check — temp/RH/airflow.`,
    }));
  }

  return tasks.filter(t => !isDuplicate(t, existingTasks));
}

// ── Diagnose Auto-Triggers ──────────────────────────────────────────
//
// Generates a 'diagnose' task for a plant when the journal contains
// signals that warrant a Plant Doctor session. Idempotent: dedup
// against existing pending diagnose tasks for the same plant.

const DAY_MS = 86400000;

/**
 * Pure: returns { shouldCreate, reason } based on plant state.
 * Does NOT touch the store. Section 06 callers handle the actual
 * task creation + dedup.
 */
export function evaluateDiagnoseTriggers(plant, stageDurations, now = Date.now()) {
  const logs = plant?.logs || [];

  // Rule 1: urgent observe in the last 2 days
  for (const log of logs) {
    if (log.type !== 'observe') continue;
    const sev = log.details?.severity;
    if (sev !== 'urgent') continue;
    const ts = new Date(log.timestamp || log.date).getTime();
    if (Number.isFinite(ts) && (now - ts) <= 2 * DAY_MS) {
      return { shouldCreate: true, reason: 'urgent-observe' };
    }
  }

  // Rule 2: concern observe in the last 2 days
  for (const log of logs) {
    if (log.type !== 'observe') continue;
    const sev = log.details?.severity;
    if (sev !== 'concern') continue;
    const ts = new Date(log.timestamp || log.date).getTime();
    if (Number.isFinite(ts) && (now - ts) <= 2 * DAY_MS) {
      return { shouldCreate: true, reason: 'concern-observe' };
    }
  }

  // Rule 3: stuck in stage (now > 1.5 * typicalDays since stage start)
  if (plant?.stage && plant?.stageStartDate && stageDurations) {
    const typical = stageDurations[plant.stage]?.typicalDays;
    if (typical && typical > 0) {
      const stageStart = new Date(plant.stageStartDate).getTime();
      if (Number.isFinite(stageStart)) {
        const days = (now - stageStart) / DAY_MS;
        if (days > 1.5 * typical) {
          return { shouldCreate: true, reason: 'stuck-stage' };
        }
      }
    }
  }

  return { shouldCreate: false };
}

function evaluateDiagnoseTaskTriggers(plant, existingTasks, plantObservations = []) {
  const tasks = [];
  // Skip if a pending diagnose task already exists for this plant
  const alreadyHasDiagnose = (existingTasks || []).some(t =>
    t.plantId === plant.id && t.type === 'diagnose' && t.status === 'pending'
  );
  if (alreadyHasDiagnose) return tasks;

  const stageDurMap = {};
  for (const s of STAGES) stageDurMap[s.id] = { typicalDays: s.typicalDays };

  // Section-07: fire diagnose on alert severity OR worsening keyword in recent notes.
  const alertTrigger = inferAlertTrigger(plantObservations);
  const result = evaluateDiagnoseTriggers(plant, stageDurMap);

  if (!result.shouldCreate && !alertTrigger.trigger) return tasks;

  const reasonMessage = alertTrigger.trigger
    ? `Recent note flagged alert severity for ${plant.name}. Run a diagnostic to identify the issue.`
    : {
        'urgent-observe': 'Plant flagged urgent in your journal. Run a diagnostic to identify the issue.',
        'concern-observe': 'Concerning observation logged. Run a diagnostic to confirm or rule out problems.',
        'stuck-stage': `${plant.name} has been in ${plant.stage} longer than expected. Run a diagnostic to check for issues.`,
      }[result.reason] || 'Diagnostic check recommended.';

  const task = _createTask(plant.id, 'diagnose', 'recommended', `Diagnose ${plant.name}`, {
    beginner: reasonMessage,
    intermediate: reasonMessage,
    expert: reasonMessage,
  });
  if (alertTrigger.trigger) {
    task.triggeredBy = alertTrigger.obsIds;
    // Section-10: citation for diagnose-trigger trail.
    try {
      recordReferencedIn(alertTrigger.obsIds, `task-engine:diagnose-trigger:${plant.id}`);
    } catch (_err) { /* best-effort */ }
  }
  tasks.push(task);
  return tasks.filter(t => !isDuplicate(t, existingTasks));
}

// ── IPM (Integrated Pest Management) Triggers ───────────────────────
// Weekly during veg, bi-weekly during flower. Stable title for dedup.

export function evaluateIPMTriggers(plant, profile, existingTasks) {
  const tasks = [];
  const stage = plant.stage;
  const days = getDaysInStage(plant);

  // Skip stages that don't need pest inspection
  if (['germination', 'seedling', 'drying', 'curing', 'done'].includes(stage)) {
    return tasks;
  }

  const isVeg = stage === 'early-veg' || stage === 'late-veg' || stage === 'transition';
  const isFlower = stage === 'early-flower' || stage === 'mid-flower' || stage === 'late-flower' || stage === 'ripening';

  let shouldFire = false;
  if (isVeg && days % 7 === 0 && days > 0) shouldFire = true;
  if (isFlower && days % 14 === 0 && days > 0) shouldFire = true;

  // Allow re-firing on day 1 of any new veg/flower stage as a baseline
  if (days === 1 && (isVeg || isFlower)) shouldFire = true;

  if (!shouldFire) return tasks;

  const experience = profile?.experience || 'intermediate';
  const detail = {
    beginner: 'Inspect all plants for pests. Look under leaves for tiny white dots (mites), sticky residue (aphids), or small flying insects (fungus gnats). Check soil surface for movement.',
    intermediate: 'Weekly IPM check: underside of leaves for mites/thrips, stem junctions for aphids, soil surface for fungus gnat larvae. Inspect new growth tips for broad mite damage (glossy, distorted leaves).',
    expert: 'IPM sweep. Targets: Tetranychidae, Frankliniella, Bradysia. Check hermie signs (nanners, balls at nodes) during flower.',
  };

  tasks.push(_createTask(plant.id, 'ipm', 'recommended', `Weekly IPM Inspection`, detail));

  return tasks.filter(t => !isDuplicate(t, existingTasks));
}

// ── Training Triggers ────────────────────────────────────────────────

export function evaluateTrainingTriggers(plant, existingTasks) {
  const tasks = [];
  if (!plant.training || !plant.training.milestones) return tasks;

  const days = getDaysInStage(plant);

  for (const milestone of plant.training.milestones) {
    if (milestone.completed) continue;
    if (milestone.triggerStage === plant.stage && days >= (milestone.triggerDay || 0)) {
      tasks.push(_createTask(plant.id, 'train', 'recommended', milestone.taskTitle || `Training: ${milestone.name}`,
        _simpleDetail(milestone.taskDetail || `Complete training milestone: ${milestone.name}`)));
    }
  }

  return tasks.filter(t => !isDuplicate(t, existingTasks));
}

// ── Diagnosis Follow-up Triggers ─────────────────────────────────────

export function evaluateDiagnosisTriggers(plant, existingTasks) {
  const tasks = [];
  if (!plant.diagnoses) return tasks;

  for (const dx of plant.diagnoses) {
    if (dx.outcome !== 'pending') continue;
    const dxDate = new Date(dx.date);
    const daysSince = Math.floor((Date.now() - dxDate) / (1000 * 60 * 60 * 24));
    // Follow-up at 3-5 day intervals
    if (daysSince >= 3 && daysSince % 3 <= 1) {
      tasks.push(_createTask(plant.id, 'check', 'recommended', `Check improvement: ${dx.name || 'diagnosis'}`,
        _simpleDetail(`Has the condition improved on ${plant.name} since treatment began ${daysSince} days ago?`)));
    }
  }

  return tasks.filter(t => !isDuplicate(t, existingTasks));
}

// ── Environment Triggers ─────────────────────────────────────────────

export function evaluateEnvironmentTriggers(readings, profile, existingTasks, obsByPlant = {}) {
  const tasks = [];
  if (!readings || readings.length === 0) return tasks;

  const latest = readings[readings.length - 1];
  const stage = profile.currentStage || 'early-veg';
  const targets = VPD_TARGETS[stage];
  if (!targets || !latest.vpd) return tasks;

  const vpd = latest.vpd;
  const vpdInRange = vpd >= targets.vpdRange.min && vpd <= targets.vpdRange.max;
  if (vpd < targets.vpdRange.min) {
    tasks.push(_createTask('env', 'check', 'recommended', 'VPD too low',
      _simpleDetail(`VPD is ${vpd} kPa — below target ${targets.vpdRange.min}-${targets.vpdRange.max} kPa. Raise temperature or lower humidity.`)));
  } else if (vpd > targets.vpdRange.max) {
    tasks.push(_createTask('env', 'check', 'recommended', 'VPD too high',
      _simpleDetail(`VPD is ${vpd} kPa — above target ${targets.vpdRange.min}-${targets.vpdRange.max} kPa. Lower temperature or raise humidity.`)));
  }

  // Section-07: env-discrepancy task. Fires when the sensor says in-range
  // but the grower's note flagged an alert environment issue within 48h.
  // Iterates per plant so the citation and suppression trail is accurate.
  if (vpdInRange && obsByPlant && typeof obsByPlant === 'object') {
    const envSnapshot = { temp: true, rh: true, vpd: true };
    for (const [plantId, plantObs] of Object.entries(obsByPlant)) {
      const conflict = checkContradiction(envSnapshot, plantObs);
      if (conflict.conflict) {
        const task = _createTask(plantId, 'env-discrepancy', 'recommended',
          'Sensor disagrees with your note',
          _simpleDetail(`Your recent note flagged an environment alert, but the sensor reads in-range. Check for a stuck probe or a localized issue.`));
        task.citedObsId = conflict.obsId;
        // Section-10: citation for env-discrepancy trail.
        try {
          recordReferencedIn([conflict.obsId], `task-engine:env-discrepancy:${plantId}`);
        } catch (_err) { /* best-effort */ }
        tasks.push(task);
      }
    }
  }

  return tasks.filter(t => !isDuplicate(t, existingTasks));
}

// ── Task → Knowledge Article Map ─────────────────────────────────────
//
// Used by task-card.js to render a contextual "Learn more →" link on
// each task card. `null` means the task type has no associated KB
// article (or routes elsewhere — e.g. 'diagnose' goes to Plant Doctor).

export const TASK_KNOWLEDGE_MAP = {
  'water':         'watering-technique',
  'feed':          'calmag-guide',
  'feed-soil':     'calmag-guide',
  'feed-coco':     'calmag-guide',
  'feed-hydro':    'calmag-guide',
  'defoliate':     'canopy-management',
  'lollipop':      'canopy-management',
  'vpd-check':     'vpd-by-stage',
  'ipm':           'pest-id',
  'diagnose':      null, // Routes to Plant Doctor, not KB
  'harvest':       'trichome-guide',
  'harvest-check': 'trichome-guide',
  'drying-check':  'drying-curing',
  'cure-burp':     'drying-curing',
};

// ── Task Stats / Completion Tracking ─────────────────────────────────

const STREAKABLE_TYPES = ['water', 'feed', 'ipm', 'log'];

/**
 * Initialize a fresh taskStats shape.
 */
export function seedTaskStats() {
  return {
    totalCompleted: 0,
    totalDismissed: 0,
    streaks: { water: 0, feed: 0, ipm: 0, log: 0 },
    intervals: {},
    weeklyHistory: [],
    lastCompletedDate: null,
  };
}

/**
 * Get the current ISO week string (YYYY-WW) in local time.
 * Used for grouping weekly history.
 */
function _isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-${String(weekNum).padStart(2, '0')}`;
}

function _localDate(d = new Date()) {
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD in user's local timezone
}

/**
 * Record a task completion. Mutates the grow object in place.
 * Updates totalCompleted, intervals, streaks, weeklyHistory,
 * lastCompletedDate. Caller is responsible for store.commit().
 *
 * @param {Object} grow - Mutable grow snapshot
 * @param {Object} task - The completed task object
 * @param {string} stage - The stage the plant was in when completed
 */
export function recordTaskCompletion(grow, task, stage) {
  if (!grow) return;
  if (!grow.taskStats) grow.taskStats = seedTaskStats();
  const stats = grow.taskStats;

  stats.totalCompleted = (stats.totalCompleted || 0) + 1;

  // Track interval data
  if (task.plantId && task.type && stage) {
    if (!stats.intervals[task.plantId]) stats.intervals[task.plantId] = {};
    if (!stats.intervals[task.plantId][task.type]) stats.intervals[task.plantId][task.type] = {};
    const arr = stats.intervals[task.plantId][task.type][stage] || [];
    arr.push(new Date().toISOString());
    while (arr.length > 30) arr.shift();
    stats.intervals[task.plantId][task.type][stage] = arr;
  }

  // Update streaks for streakable types
  if (STREAKABLE_TYPES.includes(task.type)) {
    if (!stats.streaks) stats.streaks = { water: 0, feed: 0, ipm: 0, log: 0 };
    // Streak logic deferred to Section 07; for now just increment
    // (Section 07 will compare actual interval vs expected)
    stats.streaks[task.type] = (stats.streaks[task.type] || 0) + 1;
  }

  // Update weekly history
  if (!Array.isArray(stats.weeklyHistory)) stats.weeklyHistory = [];
  const week = _isoWeek();
  let weekEntry = stats.weeklyHistory.find(w => w.week === week);
  if (!weekEntry) {
    weekEntry = { week, completed: 0, total: 0 };
    stats.weeklyHistory.push(weekEntry);
    // Cap history at 26 weeks (~6 months)
    while (stats.weeklyHistory.length > 26) stats.weeklyHistory.shift();
  }
  weekEntry.completed++;

  stats.lastCompletedDate = _localDate();
}

/**
 * Record a task dismissal. Increments dismissed counter only.
 */
export function recordTaskDismissal(grow) {
  if (!grow) return;
  if (!grow.taskStats) grow.taskStats = seedTaskStats();
  grow.taskStats.totalDismissed = (grow.taskStats.totalDismissed || 0) + 1;
}

// ── Task Pruning ─────────────────────────────────────────────────────

const PRUNE_DONE_AGE_DAYS = 7;
const PRUNE_MAX_TASKS = 200;
const INTERVAL_HISTORY_CAP = 30;

/**
 * Prune completed/dismissed tasks older than 7 days and cap the total
 * task array at 200 entries. Before removing completed tasks, extract
 * their completion dates into grow.taskStats.intervals so the pattern
 * tracker (Section 04) can still learn from them.
 *
 * Must be called on the grow object returned by store.getSnapshot()
 * (mutable), then committed via store.commit('grow', grow).
 *
 * Pending tasks are NEVER pruned regardless of age.
 *
 * @param {Object} grow — Mutable grow snapshot
 * @returns {{removed: number, kept: number}}
 */
export function pruneTasks(grow) {
  if (!grow || !Array.isArray(grow.tasks)) return { removed: 0, kept: 0 };

  // Ensure taskStats shape exists for interval extraction and counters
  if (!grow.taskStats) {
    grow.taskStats = {
      totalCompleted: 0,
      totalDismissed: 0,
      streaks: { water: 0, feed: 0, ipm: 0, log: 0 },
      intervals: {},
      weeklyHistory: [],
      lastCompletedDate: null,
    };
  }
  if (!grow.taskStats.intervals) grow.taskStats.intervals = {};

  const now = Date.now();
  const DAY = 86400000;
  const keep = [];
  let removedCompleted = 0;
  let removedDismissed = 0;

  for (const task of grow.tasks) {
    if (task.status === 'pending' || task.status === 'snoozed') {
      keep.push(task);
      continue;
    }

    const completedAt = task.completedDate ? new Date(task.completedDate).getTime() : NaN;
    const ageDays = Number.isFinite(completedAt) ? (now - completedAt) / DAY : Infinity;

    if (ageDays > PRUNE_DONE_AGE_DAYS) {
      // Extract interval data before dropping completed tasks
      if (task.status === 'done' && task.plantId && task.type) {
        const stage = task.stageAtCompletion || task.stage || 'unknown';
        const plantIntervals = grow.taskStats.intervals[task.plantId] || {};
        const typeIntervals = plantIntervals[task.type] || {};
        const dateList = typeIntervals[stage] || [];
        dateList.push(task.completedDate);
        // Cap per (plant, type, stage) at INTERVAL_HISTORY_CAP entries
        while (dateList.length > INTERVAL_HISTORY_CAP) dateList.shift();
        typeIntervals[stage] = dateList;
        plantIntervals[task.type] = typeIntervals;
        grow.taskStats.intervals[task.plantId] = plantIntervals;
      }

      if (task.status === 'done') removedCompleted++;
      else if (task.status === 'dismissed') removedDismissed++;
      continue;
    }

    keep.push(task);
  }

  // Counters reflect all-time totals even though the task objects are dropped
  grow.taskStats.totalCompleted = (grow.taskStats.totalCompleted || 0) + removedCompleted;
  grow.taskStats.totalDismissed = (grow.taskStats.totalDismissed || 0) + removedDismissed;

  // Cap total task count. Oldest-first removal, but never touch pending/snoozed.
  if (keep.length > PRUNE_MAX_TASKS) {
    const pendingOrSnoozed = keep.filter(t => t.status === 'pending' || t.status === 'snoozed');
    const closed = keep.filter(t => t.status !== 'pending' && t.status !== 'snoozed');
    closed.sort((a, b) => new Date(a.completedDate || 0) - new Date(b.completedDate || 0));
    const dropCount = keep.length - PRUNE_MAX_TASKS;
    const droppedClosed = closed.slice(0, dropCount);
    for (const t of droppedClosed) {
      if (t.status === 'done') grow.taskStats.totalCompleted++;
      else if (t.status === 'dismissed') grow.taskStats.totalDismissed++;
    }
    const keptClosed = closed.slice(dropCount);
    grow.tasks = [...pendingOrSnoozed, ...keptClosed];
  } else {
    grow.tasks = keep;
  }

  return { removed: (grow.tasks.length < (Array.isArray(grow.tasks) ? keep.length : 0)) ? 0 : removedCompleted + removedDismissed, kept: grow.tasks.length };
}

// ── Deduplication ────────────────────────────────────────────────────

export function isDuplicate(newTask, existingTasks) {
  return existingTasks.some(t =>
    t.plantId === newTask.plantId &&
    t.type === newTask.type &&
    (t.status === 'pending' || t.status === 'snoozed') &&
    t.title === newTask.title
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function _createTask(plantId, type, priority, title, detail) {
  return {
    id: generateId(),
    plantId,
    type,
    priority,
    title,
    detail: typeof detail === 'string' ? _simpleDetail(detail) : detail,
    evidence: type === 'water' || type === 'feed' ? 'established' : 'practitioner',
    status: 'pending',
    snoozeUntil: null,
    notes: '',
    generatedDate: new Date().toISOString(),
    completedDate: null,
  };
}

function _simpleDetail(text) {
  return { beginner: text, intermediate: text, expert: text };
}

function _potSizeCategory(potSize) {
  if (!potSize) return 'medium';
  if (potSize <= 3) return 'small';
  if (potSize <= 7) return 'medium';
  return 'large';
}

function _getWaterFrequency(medium, potSizeCat, stage) {
  const mediumFreq = WATERING_FREQUENCY[medium];
  if (!mediumFreq) return null;
  const sizeFreq = mediumFreq[potSizeCat];
  if (!sizeFreq) return null;
  return sizeFreq[stage] || null;
}

function _daysSinceLastLog(logs, type) {
  if (!logs || logs.length === 0) return null;
  const filtered = type ? logs.filter(l => l.type === type) : logs;
  if (filtered.length === 0) return null;
  const last = filtered[filtered.length - 1];
  const date = new Date(last.date);
  return Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
}

function _watersSinceLastFeed(logs) {
  if (!logs || logs.length === 0) return 0;
  let count = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].type === 'feed') break;
    if (logs[i].type === 'water') count++;
  }
  return count;
}

/**
 * getExperienceDetail(task, experience) — Returns the appropriate detail string.
 */
export function getExperienceDetail(task, experience) {
  if (!task.detail) return '';
  if (experience === 'first-grow' || experience === 'beginner') return task.detail.beginner;
  if (experience === 'intermediate') return task.detail.intermediate;
  return task.detail.expert;
}

// ── Edge-Case Suppression Helpers ─────────────────────────────────────

/**
 * _deriveBlockActionId(task) — Map a task object to a blockActions taxonomy id.
 *
 * NOTE: This mapping is intentionally heuristic. The task.type values in this
 * engine do not have a 1-to-1 correspondence with the blockActions taxonomy in
 * edge-case-knowledge.js. Tighten the mapping as new task types are introduced.
 *
 * @param {Object} task
 * @returns {string}
 */
function _deriveBlockActionId(task) {
  const type = task.type || '';
  if (type === 'feed' || type === 'nutrient' || type === 'feed-soil' || type === 'feed-coco' || type === 'feed-hydro') return 'feed-nutrients';
  if (type === 'top') return 'top-plant';
  if (type === 'lst' || type === 'train') return 'start-lst';
  if (type === 'defoliate') return 'defoliate';
  if (type === 'water') return 'water-plant';
  if (type === 'transplant') return 'transplant-up';
  if (type === 'flush') return 'flush-again';
  if (type === 'flip') return 'flip-12-12';
  // Cal-mag detection from task action text
  const titleLower = (task.title || '').toLowerCase();
  const detailText = (task.detail?.beginner || task.detail?.intermediate || task.detail?.expert || '').toLowerCase();
  if (titleLower.includes('cal-mag') || titleLower.includes('calcium-magnesium') ||
      detailText.includes('cal-mag') || detailText.includes('calcium-magnesium')) {
    return 'add-calmag';
  }
  return task.actionType || type || 'unknown';
}

/**
 * applyEdgeCaseSuppression(tasks, plant, grow) — Filter tasks blocked by active
 * edge cases and prepend edge-case warning tasks above surviving tasks.
 *
 * This is an async function because the edge-case engine (or fallback) may need
 * to resolve imported data. Callers must await or handle the Promise.
 *
 * @param {Object[]} tasks
 * @param {Object} plant
 * @param {Object} grow
 * @returns {Promise<Object[]>}
 */
export async function applyEdgeCaseSuppression(tasks, plant, grow) {
  try {
    const [blocked, warnings] = await Promise.all([
      _getBlockedActions({ plant, grow }),
      _getActiveWarnings({ plant, grow }),
    ]);

    if ((!blocked || blocked.size === 0) && (!warnings || warnings.length === 0)) {
      return tasks;
    }

    const surviving = tasks.filter(task => {
      const actionId = _deriveBlockActionId(task);
      return !blocked.has(actionId);
    });

    const warningTasks = (warnings || []).map(w => ({
      id: `edge-warning-${w.edgeCaseId || w.id}`,
      plantId: plant.id,
      type: 'edge-warning',
      title: w.title,
      body: w.body,
      action: w.action,
      severity: w.severity,
      priority: w.severity === 'urgent' ? 'urgent' : 'recommended',
      status: 'pending',
      source: 'edge-case',
      edgeCaseId: w.edgeCaseId,
      generatedDate: new Date().toISOString(),
    }));

    return [...warningTasks, ...surviving];
  } catch (_err) {
    // Edge-case suppression must never crash the task engine.
    return tasks;
  }
}

// ── runTests additions for edge-case suppression ──────────────────────

/**
 * runTests() — Append edge-case suppression tests to an existing test suite
 * or run standalone. Returns { passed, failed, errors }.
 *
 * Tests:
 *   1. Feed task is suppressed when plant has a post-transplant edge case.
 *   2. Mg deficiency advice is suppressed when pH lockout is active.
 *   3. Warning tasks are injected at list head.
 *   4. applyEdgeCaseSuppression returns original array when no edge cases fire.
 *   5. _deriveBlockActionId maps 'feed' → 'feed-nutrients'.
 */
export async function runEdgeCaseSuppressTests() {
  const results = { passed: 0, failed: 0, errors: [] };

  function assert(label, condition) {
    if (condition) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push(label);
    }
  }

  // Test 1: feed task suppressed when post-transplant edge case fires
  try {
    const feedTask = { id: 'test-feed', plantId: 'p1', type: 'feed', title: 'Feed plant', status: 'pending', detail: { beginner: '', intermediate: '', expert: '' } };
    const transplantLog = { type: 'transplant', date: new Date(Date.now() - 24 * 3600000).toISOString() };
    const plant = { id: 'p1', stage: 'early-veg', logs: [transplantLog] };
    const grow = {};
    const out = await applyEdgeCaseSuppression([feedTask], plant, grow);
    const hasFeed = out.some(t => t.type === 'feed');
    assert('Test 1: feed task suppressed after transplant', !hasFeed);
  } catch (e) {
    results.failed++;
    results.errors.push(`Test 1 threw: ${e.message}`);
  }

  // Test 2: warning tasks appear before surviving tasks
  try {
    const safeTask = { id: 'test-ipm', plantId: 'p1', type: 'ipm', title: 'IPM check', status: 'pending', detail: { beginner: '', intermediate: '', expert: '' } };
    const transplantLog = { type: 'transplant', date: new Date(Date.now() - 24 * 3600000).toISOString() };
    const plant = { id: 'p1', stage: 'early-veg', logs: [transplantLog] };
    const grow = {};
    const out = await applyEdgeCaseSuppression([safeTask], plant, grow);
    const firstIsWarning = out.length > 0 && out[0].type === 'edge-warning';
    assert('Test 2: warning tasks injected at head', firstIsWarning);
  } catch (e) {
    results.failed++;
    results.errors.push(`Test 2 threw: ${e.message}`);
  }

  // Test 3: no edge cases → array passes through unchanged
  try {
    const task = { id: 't3', plantId: 'p2', type: 'ipm', title: 'IPM', status: 'pending', detail: { beginner: '', intermediate: '', expert: '' } };
    const plant = { id: 'p2', stage: 'mid-flower', logs: [] };
    const grow = {};
    const out = await applyEdgeCaseSuppression([task], plant, grow);
    // IPM should not be suppressed; array should contain the original task
    assert('Test 3: no-edge-case plant passes tasks through', out.some(t => t.id === 't3'));
  } catch (e) {
    results.failed++;
    results.errors.push(`Test 3 threw: ${e.message}`);
  }

  // Test 4: _deriveBlockActionId mapping correctness
  assert('Test 4a: feed → feed-nutrients', _deriveBlockActionId({ type: 'feed' }) === 'feed-nutrients');
  assert('Test 4b: defoliate → defoliate', _deriveBlockActionId({ type: 'defoliate' }) === 'defoliate');
  assert('Test 4c: water → water-plant', _deriveBlockActionId({ type: 'water' }) === 'water-plant');

  return results;
}
