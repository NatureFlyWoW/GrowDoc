// GrowDoc Companion — Note Contextualizer: merge & weighting (section-01 stubs)
//
// Real implementations land in section-04. These stubs exist so that
// sections 03, 05, 07 can import stable names during incremental landing.

/**
 * STUB. Real merge logic arrives in section-04.
 * @param {import('../observation-schema.js').Observation[]} _observations
 * @returns {Object} empty ctx map
 */
export function mergeNoteContext(_observations) {
  return {};
}

/**
 * STUB. Real filtered query arrives in section-04's weighting pass.
 * Section-01 uses a pass-through implementation so the public
 * `getRelevantObservations` export in `index.js` can delegate here.
 * @param {import('../observation-schema.js').Observation[]} observations
 * @param {{plantId?:string, since?:string, domains?:string[], limit?:number, minSeverity?:string}} [opts]
 * @returns {import('../observation-schema.js').Observation[]}
 */
export function getRelevantObservations(observations, opts = {}) {
  if (!Array.isArray(observations)) return [];
  let out = observations;
  if (opts.plantId) out = out.filter(o => o.plantId === opts.plantId);
  if (opts.since) {
    const sinceMs = Date.parse(opts.since);
    if (!Number.isNaN(sinceMs)) {
      out = out.filter(o => Date.parse(o.observedAt) >= sinceMs);
    }
  }
  if (Array.isArray(opts.domains) && opts.domains.length > 0) {
    const wanted = new Set(opts.domains);
    out = out.filter(o => Array.isArray(o.domains) && o.domains.some(d => wanted.has(d)));
  }
  // minSeverity is a pass-through in section-01 (real filter in section-04)
  if (typeof opts.limit === 'number' && opts.limit >= 0) {
    out = out.slice(0, opts.limit);
  }
  return out;
}

/**
 * STUB. Real action-trace logic arrives in section-04.
 * @returns {Array}
 */
export function findActionsTakenSince(_observations, _taskType, _sinceHours) {
  return [];
}
