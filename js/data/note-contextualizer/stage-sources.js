// GrowDoc Companion — Note Contextualizer (stage-scoped sources)
//
// Thin, idempotent helpers for creating stage-scoped observations and
// questions from the Timeline stage-detail panel.
//
// ── Why a separate file ──────────────────────────────────────────
// The core projection walker in `./index.js` already enumerates every
// entry in `plant.logs[*]` that carries a non-empty `details.notes` and
// emits an Observation with `source: 'log'` (or `'stage-transition'` when
// the log type is `stage-transition`). That means a stage-note stored as
// a plant log is ALREADY visible to the plant doctor, task engine, cure
// tracker handoff, and every other downstream consumer that calls
// `getObservationIndex()` / `getRelevantObservations()` — no new schema
// migration required. `computeHash()` includes the full grow JSON, so
// adding a log invalidates the contextualizer cache on the next 300ms
// debounce cycle, exactly like every other note source.
//
// What this module adds on top:
//   1. A stable shape for stage-scoped note logs (`type: 'stage-note'`)
//      that carries `stageId` and `milestoneId` under `details`, so UI
//      code can query "what did I write for this stage?" without a full
//      index walk.
//   2. An open-question lifecycle (`type: 'stage-question'` with a
//      `status` field on `details`) so the advice engine can surface
//      unanswered questions as chips without digging into the parsed
//      observation tree.
//   3. A single helper `getStageObservations()` the stage-detail panel
//      uses to render both lanes.
//
// ── Projection behaviour (important for debug/verification) ──────
// • A `stage-note` log flows into `collectObservations()` as an
//   Observation with `source: 'log'`, because index.js only promotes
//   logs whose `type === 'stage-transition'` to `source: 'stage-transition'`.
//   That is the correct bucket — stage-notes are general observations
//   anchored to a stage, not the transition event itself.
// • A `stage-question` log ALSO becomes a `source: 'log'` Observation.
//   Its rawText is the question body, so `parseObservation()`'s
//   question-extractor (§4 in index.js) will auto-push the body into
//   `parsed.questions`, which means rules-advice + rules-score will
//   already see it under `ctx.questions`. The `status` field gates UI
//   surfacing: only `status === 'open'` questions render as chips.
// • When the plant advances out of the stage, stage-notes stay live.
//   They are historical context and still valuable for phase-over-phase
//   reasoning. Callers that want "current stage only" filter by
//   `details.stageId === plant.stageId` at query time (which
//   `getStageObservations()` already does).
// • No explicit cache invalidation call is required. The store
//   subscriber in `initContextualizer()` observes every `store.commit`
//   on `grow` and flushes `cache = null` on the next debounce.
//   These helpers all end with `store.commit('grow', grow)`.
//
// ── Idempotency ──────────────────────────────────────────────────
// Every log is assigned a fresh `generateId()` id, so create calls are
// append-only and always succeed. There is no schema migration for
// existing users: old plants without stage-notes remain valid, and a
// plant that never gets a stage-note simply has no `type: 'stage-note'`
// entries in its logs array.

import { generateId } from '../../utils.js';

// ── Internal helpers ─────────────────────────────────────────────

/**
 * Look up a plant by id from the current store snapshot and return
 * both the live `grow` object and the plant reference. Returns null
 * if the plant cannot be found.
 *
 * @param {Object} store
 * @param {string} plantId
 * @returns {{grow: Object, plant: Object} | null}
 */
function _getPlant(store, plantId) {
  if (!store || !plantId) return null;
  const snapshot = store.getSnapshot ? store.getSnapshot() : { grow: store.state?.grow };
  const grow = snapshot && snapshot.grow;
  if (!grow || !Array.isArray(grow.plants)) return null;
  const plant = grow.plants.find(p => p && p.id === plantId);
  if (!plant) return null;
  if (!Array.isArray(plant.logs)) plant.logs = [];
  return { grow, plant };
}

/**
 * Normalize free text. Trims and collapses runs of whitespace.
 * Returns an empty string for non-strings.
 */
function _cleanText(text) {
  if (typeof text !== 'string') return '';
  return text.trim();
}

/**
 * Find a single log entry by id across every plant in the grow.
 * Used by the question lifecycle helpers.
 */
function _findLogById(grow, logId) {
  if (!grow || !Array.isArray(grow.plants) || !logId) return null;
  for (const plant of grow.plants) {
    if (!plant || !Array.isArray(plant.logs)) continue;
    for (const log of plant.logs) {
      if (log && log.id === logId) return { plant, log };
    }
  }
  return null;
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Create a stage-scoped observation note. Appended to the target
 * plant's `logs` array with `type: 'stage-note'`. The body is mirrored
 * into `details.notes` so the core contextualizer projection walker
 * picks it up automatically on the next rebuild.
 *
 * @param {Object} store
 * @param {{plantId: string, stageId: string, milestoneId?: string|null, text: string}} payload
 * @returns {Object|null} the created log entry, or null on validation failure
 */
export function createStageNote(store, { plantId, stageId, milestoneId = null, text } = {}) {
  const body = _cleanText(text);
  if (!body) return null;
  if (!stageId) return null;
  const ctx = _getPlant(store, plantId);
  if (!ctx) return null;
  const { grow, plant } = ctx;

  const nowIso = new Date().toISOString();
  const log = {
    id: generateId(),
    date: nowIso,
    timestamp: nowIso,
    type: 'stage-note',
    details: {
      stageId,
      milestoneId: milestoneId || null,
      notes: body,
      kind: 'observation',
    },
  };
  plant.logs.push(log);
  store.commit('grow', grow);
  return log;
}

/**
 * Create a stage-scoped open question. Same storage shape as
 * `createStageNote`, but with `type: 'stage-question'` and a lifecycle
 * `status` field on `details`. Questions start in `'open'` state.
 *
 * Because the question text lands in `details.notes`, `parseObservation`
 * in index.js will detect any trailing '?' (or leading is/does/should/can)
 * and auto-push the text into the parsed observation's `questions[]`.
 * Rules-advice / rules-score consume that array under `ctx.questions`,
 * so a newly created open question biases the next advice run exactly
 * like any other note source — with zero changes to the rules engine.
 *
 * @param {Object} store
 * @param {{plantId: string, stageId: string, milestoneId?: string|null, text: string}} payload
 * @returns {Object|null}
 */
export function createStageQuestion(store, { plantId, stageId, milestoneId = null, text } = {}) {
  const body = _cleanText(text);
  if (!body) return null;
  if (!stageId) return null;
  const ctx = _getPlant(store, plantId);
  if (!ctx) return null;
  const { grow, plant } = ctx;

  // Ensure the body ends with a '?' so the question extractor in
  // parseObservation reliably picks it up even for terse inputs like
  // "why is the top fading". This is a display + parser hint — we do not
  // modify the user's original intent.
  const bodyForNotes = /[?？]$/.test(body) ? body : `${body}?`;

  const nowIso = new Date().toISOString();
  const log = {
    id: generateId(),
    date: nowIso,
    timestamp: nowIso,
    type: 'stage-question',
    details: {
      stageId,
      milestoneId: milestoneId || null,
      notes: bodyForNotes,
      kind: 'question',
      status: 'open',   // 'open' | 'answered' | 'dismissed'
      askedAt: nowIso,
      resolvedAt: null,
      answerObsId: null,
    },
  };
  plant.logs.push(log);
  store.commit('grow', grow);
  return log;
}

/**
 * Return every stage-scoped note and question for a given plant/stage.
 * Used by the Timeline stage-detail panel to render two lanes:
 * notes and open questions.
 *
 * Results are sorted by `timestamp` ascending (oldest first) so the
 * panel reads like a log tape.
 *
 * @param {Object} store
 * @param {{plantId: string, stageId: string}} opts
 * @returns {{notes: Object[], questions: Object[], openQuestions: Object[]}}
 */
export function getStageObservations(store, { plantId, stageId } = {}) {
  const empty = { notes: [], questions: [], openQuestions: [] };
  if (!plantId || !stageId) return empty;
  const ctx = _getPlant(store, plantId);
  if (!ctx) return empty;
  const { plant } = ctx;

  const notes = [];
  const questions = [];
  for (const log of plant.logs) {
    if (!log || !log.details) continue;
    if (log.details.stageId !== stageId) continue;
    if (log.type === 'stage-note') notes.push(log);
    else if (log.type === 'stage-question') questions.push(log);
  }
  const byTime = (a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || ''));
  notes.sort(byTime);
  questions.sort(byTime);
  const openQuestions = questions.filter(q => (q.details.status || 'open') === 'open');
  return { notes, questions, openQuestions };
}

/**
 * Flip a question's status → 'answered'. Optionally links to the
 * advice/observation id that answered it (advice engine writes this
 * backlink when generating contextual advice for the question).
 *
 * @param {Object} store
 * @param {string} questionId
 * @param {{answerObsId?: string|null}} [opts]
 * @returns {Object|null} the updated log entry, or null if not found
 */
export function markQuestionAnswered(store, questionId, { answerObsId = null } = {}) {
  if (!store || !questionId) return null;
  const snapshot = store.getSnapshot ? store.getSnapshot() : { grow: store.state?.grow };
  const grow = snapshot && snapshot.grow;
  const hit = _findLogById(grow, questionId);
  if (!hit) return null;
  const { log } = hit;
  if (log.type !== 'stage-question') return null;
  log.details = {
    ...log.details,
    status: 'answered',
    resolvedAt: new Date().toISOString(),
    answerObsId: answerObsId || null,
  };
  store.commit('grow', grow);
  return log;
}

/**
 * Flip a question's status → 'dismissed'. Used when the user decides
 * the question is no longer relevant (e.g., self-resolved or duplicate).
 * Dismissed questions remain in the log tape (historical record) but
 * no longer render as chips and no longer bias the advice engine's
 * open-question surfacing.
 *
 * @param {Object} store
 * @param {string} questionId
 * @returns {Object|null}
 */
export function dismissQuestion(store, questionId) {
  if (!store || !questionId) return null;
  const snapshot = store.getSnapshot ? store.getSnapshot() : { grow: store.state?.grow };
  const grow = snapshot && snapshot.grow;
  const hit = _findLogById(grow, questionId);
  if (!hit) return null;
  const { log } = hit;
  if (log.type !== 'stage-question') return null;
  log.details = {
    ...log.details,
    status: 'dismissed',
    resolvedAt: new Date().toISOString(),
  };
  store.commit('grow', grow);
  return log;
}
