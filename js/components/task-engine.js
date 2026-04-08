// GrowDoc Companion — Task Engine (Core Logic)
// Generates dynamic, per-plant, context-aware task recommendations.

import { WATERING_FREQUENCY, VPD_TARGETS, DLI_TARGETS, NUTRIENT_TARGETS } from '../data/grow-knowledge.js';
import { calculateWeights, blendTarget, getRecommendation } from '../data/priority-engine.js';
import { STAGE_TRANSITIONS, getDaysInStage, shouldAutoAdvance, getCureBurpSchedule } from '../data/stage-rules.js';
import { generateId } from '../utils.js';

/**
 * generateTasks(store) — Main entry point. Evaluates all triggers, deduplicates, returns new tasks.
 */
export function generateTasks(store) {
  const profile = store.state.profile || {};
  const context = profile.context || {};
  const grow = store.state.grow;
  const envData = store.state.environment || {};

  if (!grow || !grow.plants || grow.plants.length === 0) return [];

  const existingTasks = grow.tasks || [];
  const newTasks = [];

  for (const plant of grow.plants) {
    newTasks.push(...evaluateTimeTriggers(plant, profile, existingTasks));
    newTasks.push(...evaluateStageTriggers(plant, profile, existingTasks));
    newTasks.push(...evaluateTrainingTriggers(plant, existingTasks));
    newTasks.push(...evaluateDiagnosisTriggers(plant, existingTasks));
  }

  newTasks.push(...evaluateEnvironmentTriggers(envData.readings || [], profile, existingTasks));

  // Final dedup pass
  return newTasks.filter(t => !isDuplicate(t, existingTasks));
}

// ── Time-Based Triggers ──────────────────────────────────────────────

export function evaluateTimeTriggers(plant, profile, existingTasks) {
  const tasks = [];
  const medium = profile.medium || 'soil';
  const potSize = _potSizeCategory(plant.potSize);
  const stage = plant.stage;
  const days = getDaysInStage(plant);
  const logs = plant.logs || [];
  const weights = calculateWeights(profile.priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 });

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
      beginner: `Strategic fan leaf removal on ${plant.name}. Remove large fan leaves shading buds. This is the last heavy defoliation before harvest. Focus on opening up airflow.`,
      intermediate: `Day 21 defol on ${plant.name} — strategic fan leaf removal for airflow and light penetration.`,
      expert: `Day 21 defol — ${plant.name}`,
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

  // Cure burp reminders
  if (stage === 'curing') {
    const schedule = getCureBurpSchedule(days);
    tasks.push(_createTask(plant.id, 'check', 'recommended', `Burp jars — ${plant.name}`, {
      beginner: `Burp curing jars for ${plant.name}. Open jars for 10-15 minutes. Schedule: ${schedule.label}. Check for ammonia smell (bad — too moist) or hay smell (normal early cure).`,
      intermediate: `Burp jars for ${plant.name} — ${schedule.label}. Check smell and jar RH.`,
      expert: `Burp — ${plant.name} (${schedule.label})`,
    }));
  }

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

export function evaluateEnvironmentTriggers(readings, profile, existingTasks) {
  const tasks = [];
  if (!readings || readings.length === 0) return tasks;

  const latest = readings[readings.length - 1];
  const stage = profile.currentStage || 'early-veg';
  const targets = VPD_TARGETS[stage];
  if (!targets || !latest.vpd) return tasks;

  const vpd = latest.vpd;
  if (vpd < targets.vpdRange.min) {
    tasks.push(_createTask('env', 'check', 'recommended', 'VPD too low',
      _simpleDetail(`VPD is ${vpd} kPa — below target ${targets.vpdRange.min}-${targets.vpdRange.max} kPa. Raise temperature or lower humidity.`)));
  } else if (vpd > targets.vpdRange.max) {
    tasks.push(_createTask('env', 'check', 'recommended', 'VPD too high',
      _simpleDetail(`VPD is ${vpd} kPa — above target ${targets.vpdRange.min}-${targets.vpdRange.max} kPa. Lower temperature or raise humidity.`)));
  }

  return tasks.filter(t => !isDuplicate(t, existingTasks));
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
