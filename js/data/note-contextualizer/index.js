// GrowDoc Companion — Note Contextualizer (public API, section-01)
//
// Pure projection over every existing note source in GrowDoc state.
// No serialization — Observations are built on demand and cached in
// a module-scoped singleton invalidated by a cheap composite hash.
//
// Stubs in this section: `parseObservation` (empty parsed) and
// `mergeNoteContext` (empty ctx) — real implementations land in
// sections 03 and 04 respectively.

import {
  mergeNoteContext as _mergeNoteContext,
  getRelevantObservations as _getRelevantObservations,
  findActionsTakenSince as _findActionsTakenSince,
} from './merge.js';

const INDEX_VERSION = 1;

// ── Module state (singleton + sidecar) ─────────────────────────────
// Note: the rebuild is synchronous, so there is no single-flight window
// to track. If that changes (async parser, worker thread) add an
// in-flight promise here.
/** @type {import('../observation-schema.js').ObservationIndex | null} */
let cache = null;
/** @type {Map<string, Set<string>>} obsId -> Set<consumerId> */
const citations = new Map();
let storeRef = null;
let subscribed = false;
let debounceTimer = null;

// ── Severity mapping ──────────────────────────────────────────────
function mapSeverity(rawInput) {
  if (rawInput === 'urgent') return { severityRaw: 'urgent', severity: 'alert' };
  if (rawInput === 'concern') return { severityRaw: 'concern', severity: 'watch' };
  return { severityRaw: null, severity: 'info' };
}

// ── Deterministic string hash (FNV-1a 32-bit → hex) ───────────────
function stringHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function makeObservationId(source, sourceRefId, rawText) {
  return stringHash(`${source}:${sourceRefId ?? ''}:${rawText ?? ''}`);
}

function nowIso() {
  return new Date().toISOString();
}

function isNonEmpty(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

// ── Stub parseObservation (real impl in section-03) ───────────────

/**
 * STUB (section-01). Assigns an empty `ParsedNote` to `obs.parsed`.
 * Real KEYWORD_PATTERNS matching arrives in section-03. Must not throw.
 * Mutates `obs` in place and returns the same reference.
 * @param {import('../observation-schema.js').Observation} obs
 * @returns {import('../observation-schema.js').Observation}
 */
export function parseObservation(obs) {
  if (!obs) return obs;
  obs.parsed = {
    ctx: {},
    observations: [],
    actionsTaken: [],
    questions: [],
    keywords: [],
    frankoOverrides: [],
  };
  return obs;
}

/**
 * Stub bulk-parser — mutates and returns the same array for section-01.
 * @param {import('../observation-schema.js').Observation[]} obsArr
 */
export function parseAllObservations(obsArr) {
  if (!Array.isArray(obsArr)) return [];
  for (const o of obsArr) parseObservation(o);
  return obsArr;
}

// ── Pure projection walker ────────────────────────────────────────

/**
 * Walks grow + profile and emits Observation[]. Pure: no store access,
 * no singleton reads, no side effects.
 *
 * @param {Object} grow
 * @param {Object} profile
 * @param {{plantId?:string, since?:string, domains?:string[], limit?:number, minSeverity?:string}} [opts]
 * @returns {import('../observation-schema.js').Observation[]}
 */
export function collectObservations(grow, profile, opts = {}) {
  const out = [];
  // createdAt = time of projection, NOT time of authorship. Do not rely on
  // this being stable across rebuilds of the same store state.
  const createdAt = nowIso();

  // 1. profile.notes — wizard-step free text
  if (profile && profile.notes && typeof profile.notes === 'object') {
    const profileObservedAt = profile.updatedAt || createdAt;
    for (const [wizardStep, rawText] of Object.entries(profile.notes)) {
      if (!isNonEmpty(rawText)) continue;
      out.push({
        id: makeObservationId('profile', wizardStep, rawText),
        createdAt,
        observedAt: profileObservedAt,
        // no plantId, no sourceRefId for profile sources
        source: 'profile',
        wizardStep,
        domains: [],
        ...mapSeverity(null),
        severityAutoInferred: false,
        rawText,
        parsed: null,
        tags: [],
      });
    }
  }

  const plants = (grow && Array.isArray(grow.plants)) ? grow.plants : [];

  for (const plant of plants) {
    if (!plant || !plant.id) continue;

    // 2. plant.notes
    if (isNonEmpty(plant.notes)) {
      const observedAt = plant.stageStartDate || plant.createdAt || createdAt;
      out.push({
        id: makeObservationId('plant', plant.id, plant.notes),
        createdAt,
        observedAt,
        plantId: plant.id,
        source: 'plant',
        sourceRefId: plant.id,
        domains: [],
        ...mapSeverity(null),
        severityAutoInferred: false,
        rawText: plant.notes,
        parsed: null,
        tags: [],
      });
    }

    // 3 + 5. plant.logs[*]
    const logs = Array.isArray(plant.logs) ? plant.logs : [];
    for (const log of logs) {
      if (!log || !log.id) continue;
      const notes = log.details && log.details.notes;
      if (!isNonEmpty(notes)) continue;

      const isStageTransition = log.type === 'stage-transition';
      const source = isStageTransition ? 'stage-transition' : 'log';
      const rawSeverity = log.details ? log.details.severity : null;
      out.push({
        id: makeObservationId(source, log.id, notes),
        createdAt,
        observedAt: log.timestamp || createdAt,
        plantId: plant.id,
        source,
        sourceRefId: log.id,
        domains: [],
        ...mapSeverity(rawSeverity),
        severityAutoInferred: false,
        rawText: notes,
        parsed: null,
        tags: [],
      });
    }
  }

  // 4. grow.tasks[*]
  const tasks = (grow && Array.isArray(grow.tasks)) ? grow.tasks : [];
  for (const task of tasks) {
    if (!task || !task.id) continue;
    if (!isNonEmpty(task.notes)) continue;
    out.push({
      id: makeObservationId('task', task.id, task.notes),
      createdAt,
      observedAt: task.updatedAt || task.createdAt || createdAt,
      plantId: task.plantId,
      source: 'task',
      sourceRefId: task.id,
      domains: [],
      ...mapSeverity(null),
      severityAutoInferred: false,
      rawText: task.notes,
      parsed: null,
      tags: [],
    });
  }

  // Apply opts filters (domains/minSeverity pass-through in section-01)
  let filtered = out;
  if (opts.plantId) {
    filtered = filtered.filter(o => o.plantId === opts.plantId);
  }
  if (opts.since) {
    const sinceMs = Date.parse(opts.since);
    if (!Number.isNaN(sinceMs)) {
      filtered = filtered.filter(o => Date.parse(o.observedAt) >= sinceMs);
    }
  }
  if (Array.isArray(opts.domains) && opts.domains.length > 0) {
    const wanted = new Set(opts.domains);
    // Section-01 observations all have empty domains, so this returns []
    filtered = filtered.filter(o => o.domains.some(d => wanted.has(d)));
  }
  if (typeof opts.limit === 'number' && opts.limit >= 0) {
    filtered = filtered.slice(0, opts.limit);
  }

  return filtered;
}

// ── Cheap composite hash for staleness detection ──────────────────
function computeHash(grow, profile) {
  const plantCount = (grow && Array.isArray(grow.plants)) ? grow.plants.length : 0;
  const taskCount = (grow && Array.isArray(grow.tasks)) ? grow.tasks.length : 0;
  let logTotal = 0;
  if (grow && Array.isArray(grow.plants)) {
    for (const p of grow.plants) {
      if (p && Array.isArray(p.logs)) logTotal += p.logs.length;
    }
  }
  const growJson = (() => {
    try { return JSON.stringify(grow); } catch { return ''; }
  })();
  const profileJson = (() => {
    try { return JSON.stringify(profile); } catch { return ''; }
  })();
  return [
    plantCount,
    taskCount,
    logTotal,
    growJson.length,
    profileJson.length,
    profile && profile.updatedAt,
    stringHash(growJson),
    stringHash(profileJson),
  ].join('|');
}

function buildIndex(grow, profile) {
  const all = parseAllObservations(collectObservations(grow, profile));
  const byPlant = {};
  const byDomain = {};
  for (const o of all) {
    if (o.plantId) {
      (byPlant[o.plantId] = byPlant[o.plantId] || []).push(o);
    }
    for (const d of o.domains) {
      (byDomain[d] = byDomain[d] || []).push(o);
    }
  }
  const index = {
    version: INDEX_VERSION,
    builtAt: nowIso(),
    fromHash: computeHash(grow, profile),
    byPlant,
    byDomain,
    all: Object.freeze(all),
    ruleErrors: [],
  };
  return index;
}

function emptyIndex() {
  return {
    version: INDEX_VERSION,
    builtAt: nowIso(),
    fromHash: '',
    byPlant: {},
    byDomain: {},
    all: Object.freeze([]),
    ruleErrors: [],
  };
}

// ── Store hook ────────────────────────────────────────────────────

/**
 * Idempotent store subscription. Subscribes a 300ms-debounced invalidator
 * to both `grow` and `profile` commits. The invalidator clears the cache;
 * the next `getObservationIndex()` call does the rebuild synchronously.
 *
 * @param {Object} store — createStore() instance from store.js
 */
export function initContextualizer(store) {
  if (subscribed) {
    if (store && store !== storeRef) {
      console.warn('initContextualizer: re-init with a different store ignored — call __resetForTests first.');
    }
    return;
  }
  storeRef = store;
  const invalidate = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      cache = null;
      debounceTimer = null;
    }, 300);
  };
  store.subscribe('grow', invalidate);
  store.subscribe('profile', invalidate);
  subscribed = true;
}

/**
 * Synchronous index accessor with hash-check rebuild. Safe to call
 * before `initContextualizer` — returns an empty frozen index.
 *
 * @returns {import('../observation-schema.js').ObservationIndex}
 */
export function getObservationIndex() {
  if (!storeRef) return emptyIndex();
  const grow = storeRef.state.grow;
  const profile = storeRef.state.profile;
  const currentHash = computeHash(grow, profile);
  if (cache && cache.fromHash === currentHash) return cache;
  cache = buildIndex(grow, profile);
  return cache;
}

/**
 * Query helper. In section-01 this delegates to the `merge.js` helper,
 * which applies plantId/since/domains/limit filters client-side.
 * minSeverity is a pass-through until section-04.
 *
 * @param {Object} store
 * @param {{plantId?:string, since?:string, domains?:string[], limit?:number, minSeverity?:string}} [opts]
 */
export function getRelevantObservations(_store, opts = {}) {
  // Note: `_store` is accepted for API symmetry with the rest of GrowDoc's
  // getX(store, opts) convention, but the singleton is owned by
  // `initContextualizer`. Passing a different store here is a no-op.
  if (!storeRef) return [];
  const index = getObservationIndex();
  return _getRelevantObservations(index.all, opts);
}

/**
 * Re-export stubs so callers can import everything from index.js.
 * Real bodies arrive in section-04.
 */
export function mergeNoteContext(observations) {
  return _mergeNoteContext(observations);
}

export function findActionsTakenSince(observations, taskType, sinceHours) {
  return _findActionsTakenSince(observations, taskType, sinceHours);
}

// ── Sidecar citations ─────────────────────────────────────────────

/**
 * Record that `consumerId` cited these observation IDs. The sidecar
 * is a plain in-memory Map<obsId, Set<consumerId>> — not serialized.
 *
 * @param {string[]} obsIds
 * @param {string}   consumerId
 */
export function recordReferencedIn(obsIds, consumerId) {
  if (!Array.isArray(obsIds) || !consumerId) return;
  for (const id of obsIds) {
    if (!id) continue;
    let set = citations.get(id);
    if (!set) {
      set = new Set();
      citations.set(id, set);
    }
    set.add(consumerId);
  }
}

/**
 * Read consumers for an observation id.
 * @param {string} obsId
 * @returns {string[]}
 */
export function getCitationsFor(obsId) {
  const set = citations.get(obsId);
  return set ? Array.from(set) : [];
}

// ── Test helper ───────────────────────────────────────────────────

/**
 * Clears singleton cache, in-flight promise, sidecar, debounce timer
 * and store reference. Tests MUST call this before each case so the
 * module has no leaked state between runs.
 */
export function __resetForTests() {
  cache = null;
  citations.clear();
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  storeRef = null;
  subscribed = false;
}
