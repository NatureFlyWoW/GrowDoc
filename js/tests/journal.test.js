// GrowDoc Companion — Journal _aggregateNotes Tests

import { _aggregateNotes } from '../views/journal.js';

/**
 * Build a minimal store object accepted by _aggregateNotes.
 *
 * @param {Object} opts
 * @param {Array}  [opts.plants=[]]   — grow.plants array
 * @param {Object} [opts.profile={}]  — store.state.profile
 */
function makeStore({ plants = [], profile = {} } = {}) {
  return {
    state: {
      grow: { plants },
      profile,
    },
  };
}

/**
 * Build a log entry that _aggregateNotes will include (has details.notes).
 *
 * @param {Object} overrides
 */
function makeLog({ id = 'log-1', type = 'observe', timestamp = '2026-04-10T12:00:00Z', notes = 'some note text', ...rest } = {}) {
  return {
    id,
    type,
    timestamp,
    details: { notes, ...rest.details },
    ...rest,
  };
}

export async function runTests() {
  const results = [];
  const assert = (cond, msg) => {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  };

  // 1. Empty logs returns empty array
  {
    const store = makeStore();
    const entries = _aggregateNotes(store);
    assert(Array.isArray(entries), '_aggregateNotes: returns an array');
    assert(entries.length === 0, '_aggregateNotes: empty grow returns empty array');
  }

  // 2. Null / missing grow returns empty array
  {
    const store = { state: { grow: null, profile: {} } };
    const entries = _aggregateNotes(store);
    assert(Array.isArray(entries) && entries.length === 0, '_aggregateNotes: null grow → empty array');
  }

  // 3. A log missing details.notes is excluded
  {
    const logWithoutNotes = { id: 'no-note', type: 'water', timestamp: '2026-04-10T10:00:00Z', details: { amount: 500 } };
    const store = makeStore({
      plants: [{ id: 'p1', name: 'Plant 1', logs: [logWithoutNotes] }],
    });
    const entries = _aggregateNotes(store);
    assert(entries.length === 0, '_aggregateNotes: log without details.notes is excluded');
  }

  // 4. A log with empty string notes is excluded
  {
    const store = makeStore({
      plants: [{ id: 'p1', name: 'Plant 1', logs: [makeLog({ notes: '   ' })] }],
    });
    const entries = _aggregateNotes(store);
    assert(entries.length === 0, '_aggregateNotes: log with whitespace-only notes is excluded');
  }

  // 5. A log with details.notes is included
  {
    const store = makeStore({
      plants: [{ id: 'p1', name: 'Plant 1', logs: [makeLog({ id: 'l1', notes: 'looking healthy' })] }],
    });
    const entries = _aggregateNotes(store);
    assert(entries.length === 1, '_aggregateNotes: log with notes is included');
  }

  // 6. Each returned entry has required fields: id, timestamp, source, body
  {
    const store = makeStore({
      plants: [{
        id: 'p1',
        name: 'Plant 1',
        logs: [makeLog({ id: 'l-req', timestamp: '2026-04-11T08:00:00Z', notes: 'required fields check' })],
      }],
    });
    const entries = _aggregateNotes(store);
    assert(entries.length === 1, '_aggregateNotes: required-fields: one entry returned');
    const e = entries[0];
    assert('id' in e,        '_aggregateNotes: entry has id field');
    assert('timestamp' in e, '_aggregateNotes: entry has timestamp field');
    assert('source' in e,    '_aggregateNotes: entry has source field');
    assert('body' in e,      '_aggregateNotes: entry has body field');
    assert(e.id === 'l-req', `_aggregateNotes: entry.id matches log id (got '${e.id}')`);
    assert(e.body === 'required fields check', `_aggregateNotes: entry.body matches notes text (got '${e.body}')`);
    assert(e.timestamp === '2026-04-11T08:00:00Z', `_aggregateNotes: entry.timestamp matches (got '${e.timestamp}')`);
  }

  // 7. Two entries with different timestamps are sorted newest-first
  {
    const older = makeLog({ id: 'older', timestamp: '2026-04-09T06:00:00Z', notes: 'older note' });
    const newer = makeLog({ id: 'newer', timestamp: '2026-04-11T18:00:00Z', notes: 'newer note' });
    const store = makeStore({
      plants: [{ id: 'p1', name: 'Plant 1', logs: [older, newer] }],
    });
    const entries = _aggregateNotes(store);
    assert(entries.length === 2, '_aggregateNotes: sort: two entries returned');
    assert(entries[0].id === 'newer', `_aggregateNotes: newest entry is first (got '${entries[0].id}')`);
    assert(entries[1].id === 'older', `_aggregateNotes: oldest entry is second (got '${entries[1].id}')`);
  }

  // 8. Entries from multiple plants are all collected
  {
    const store = makeStore({
      plants: [
        { id: 'p1', name: 'Plant 1', logs: [makeLog({ id: 'p1-log', notes: 'plant 1 note' })] },
        { id: 'p2', name: 'Plant 2', logs: [makeLog({ id: 'p2-log', notes: 'plant 2 note' })] },
      ],
    });
    const entries = _aggregateNotes(store);
    assert(entries.length === 2, '_aggregateNotes: collects logs from multiple plants');
    const ids = entries.map(e => e.id);
    assert(ids.includes('p1-log'), '_aggregateNotes: p1 log present');
    assert(ids.includes('p2-log'), '_aggregateNotes: p2 log present');
  }

  // 9. Log type 'stage-note' maps source to 'stage-note'
  {
    const store = makeStore({
      plants: [{ id: 'p1', name: 'Plant 1', logs: [makeLog({ id: 'sn', type: 'stage-note', notes: 'transition note' })] }],
    });
    const entries = _aggregateNotes(store);
    assert(entries[0]?.source === 'stage-note', `_aggregateNotes: stage-note type → source 'stage-note' (got '${entries[0]?.source}')`);
  }

  // 10. Log type 'decision' maps source to 'decision'
  {
    const store = makeStore({
      plants: [{ id: 'p1', name: 'Plant 1', logs: [makeLog({ id: 'dec', type: 'decision', notes: 'topping decision' })] }],
    });
    const entries = _aggregateNotes(store);
    assert(entries[0]?.source === 'decision', `_aggregateNotes: decision type → source 'decision' (got '${entries[0]?.source}')`);
  }

  // 11. Log type 'stage-question' maps source to 'question'
  {
    const store = makeStore({
      plants: [{ id: 'p1', name: 'Plant 1', logs: [makeLog({ id: 'q1', type: 'stage-question', notes: 'should I top?' })] }],
    });
    const entries = _aggregateNotes(store);
    assert(entries[0]?.source === 'question', `_aggregateNotes: stage-question type → source 'question' (got '${entries[0]?.source}')`);
  }

  // 12. Profile wizard notes are included as source 'wizard'
  {
    const store = makeStore({
      plants: [],
      profile: { notes: { grow_goals: 'maximise yield' } },
    });
    const entries = _aggregateNotes(store);
    assert(entries.length === 1, '_aggregateNotes: wizard: profile notes included');
    assert(entries[0].source === 'wizard', `_aggregateNotes: wizard: source is 'wizard' (got '${entries[0]?.source}')`);
    assert(entries[0].body === 'maximise yield', `_aggregateNotes: wizard: body matches (got '${entries[0]?.body}')`);
  }

  // 13. Plant diagnoses with notes are included as source 'diagnosis'
  {
    const dx = { id: 'dx1', timestamp: '2026-04-10T10:00:00Z', notes: 'nitrogen deficiency suspected' };
    const store = makeStore({
      plants: [{ id: 'p1', name: 'Plant 1', logs: [], diagnoses: [dx] }],
    });
    const entries = _aggregateNotes(store);
    assert(entries.length === 1, '_aggregateNotes: diagnosis: entry included');
    assert(entries[0].source === 'diagnosis', `_aggregateNotes: diagnosis: source is 'diagnosis' (got '${entries[0]?.source}')`);
  }

  return results;
}
