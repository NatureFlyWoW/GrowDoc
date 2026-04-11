// GrowDoc Companion — Task Engine (Core Logic)
// Generates dynamic, per-plant, context-aware task recommendations.

import { WATERING_FREQUENCY, VPD_TARGETS, DLI_TARGETS, NUTRIENT_TARGETS } from '../data/grow-knowledge.js';
import { STAGE_TRANSITIONS, STAGES, getDaysInStage, shouldAutoAdvance, getCureBurpSchedule } from '../data/stage-rules.js';
import { getLearnedInterval } from '../data/pattern-tracker.js';
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
    // Skip plants whose stage blocks task generation (e.g. 'done').
    const stageDef = STAGES.find(s => s.id === plant.stage);
    if (stageDef && stageDef.blocksTaskGeneration) continue;

    newTasks.push(...evaluateTimeTriggers(plant, profile, existingTasks));
    newTasks.push(...evaluateStageTriggers(plant, profile, existingTasks));
    newTasks.push(...evaluateTrainingTriggers(plant, existingTasks));
    newTasks.push(...evaluateDiagnosisTriggers(plant, existingTasks));
    newTasks.push(...evaluateIPMTriggers(plant, profile, existingTasks));
  }

  newTasks.push(...evaluateEnvironmentTriggers(envData.readings || [], profile, existingTasks));

  // Final dedup pass
  return newTasks.filter(t => !isDuplicate(t, existingTasks));
}

// ── Time-Based Triggers ──────────────────────────────────────────────

export function evaluateTimeTriggers(plant, profile, existingTasks) {
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
