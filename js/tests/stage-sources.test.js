// GrowDoc Companion — stage-sources Tests
//
// Tests for js/data/note-contextualizer/stage-sources.js
// Exercises createStageNote, createStageQuestion, and getStageObservations
// using a plain-object store mock that mirrors the real store's commit API.

import {
  createStageNote,
  createStageQuestion,
  getStageObservations,
} from '../data/note-contextualizer/stage-sources.js';

// ── Store mock factory ────────────────────────────────────────────────────────
//
// The source module reads the grow object via:
//   store.getSnapshot?.() ?? { grow: store.state?.grow }
// and writes back via store.commit('grow', grow).
//
// We expose state.grow directly so both read paths resolve to the same object.

function makeStore({ plants = [] } = {}) {
  const state = {
    grow: { plants },
  };

  return {
    state,
    commit(key, value) {
      if (key === 'grow') state.grow = value;
    },
  };
}

function makePlant(overrides = {}) {
  return {
    id: 'plant-1',
    name: 'Test Plant',
    stage: 'veg',
    stageStartDate: new Date().toISOString(),
    logs: [],
    ...overrides,
  };
}

// ── Test runner ───────────────────────────────────────────────────────────────

export async function runTests() {
  const results = [];

  function assert(cond, msg) {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  }

  // ── createStageNote ───────────────────────────────────────────────────────

  // 1. Returns an object with required fields: id, text (via details.notes), timestamp
  {
    const store = makeStore({ plants: [makePlant()] });
    const note = createStageNote(store, {
      plantId: 'plant-1',
      stageId: 'veg',
      text: 'Leaves are a healthy dark green',
    });
    assert(note !== null && typeof note === 'object', 'createStageNote: returns an object for valid input');
    assert(typeof note.id === 'string' && note.id.length > 0, 'createStageNote: returned object has a non-empty id');
    assert(note.details && note.details.notes === 'Leaves are a healthy dark green', 'createStageNote: details.notes contains the trimmed text');
    assert(typeof note.timestamp === 'string' && note.timestamp.length > 0, 'createStageNote: returned object has a timestamp string');
  }

  // 2. Empty text returns null (falsy)
  {
    const store = makeStore({ plants: [makePlant()] });
    const note = createStageNote(store, { plantId: 'plant-1', stageId: 'veg', text: '' });
    assert(!note, 'createStageNote: empty text returns null');
  }

  // 3. Whitespace-only text returns null
  {
    const store = makeStore({ plants: [makePlant()] });
    const note = createStageNote(store, { plantId: 'plant-1', stageId: 'veg', text: '   ' });
    assert(!note, 'createStageNote: whitespace-only text returns null');
  }

  // 4. Missing stageId returns null
  {
    const store = makeStore({ plants: [makePlant()] });
    const note = createStageNote(store, { plantId: 'plant-1', stageId: '', text: 'Valid text' });
    assert(!note, 'createStageNote: missing stageId returns null');
  }

  // 5. Unknown plantId returns null
  {
    const store = makeStore({ plants: [makePlant()] });
    const note = createStageNote(store, { plantId: 'no-such-plant', stageId: 'veg', text: 'Valid text' });
    assert(!note, 'createStageNote: unknown plantId returns null');
  }

  // 6. Returned log has type 'stage-note'
  {
    const store = makeStore({ plants: [makePlant()] });
    const note = createStageNote(store, { plantId: 'plant-1', stageId: 'veg', text: 'Some note' });
    assert(note && note.type === 'stage-note', 'createStageNote: returned object has type "stage-note"');
  }

  // 7. Store commit is called — plant.logs grows by 1
  {
    const plant = makePlant();
    const store = makeStore({ plants: [plant] });
    createStageNote(store, { plantId: 'plant-1', stageId: 'veg', text: 'Committed note' });
    assert(store.state.grow.plants[0].logs.length === 1, 'createStageNote: store.commit is called; plant logs array grows');
  }

  // ── createStageQuestion ───────────────────────────────────────────────────

  // 8. Returns an object with type 'stage-question'
  {
    const store = makeStore({ plants: [makePlant()] });
    const q = createStageQuestion(store, {
      plantId: 'plant-1',
      stageId: 'veg',
      text: 'Why is the top fading',
    });
    assert(q && typeof q === 'object', 'createStageQuestion: returns an object for valid input');
    assert(q.type === 'stage-question', 'createStageQuestion: returned object has type "stage-question"');
  }

  // 9. details.kind === 'question'
  {
    const store = makeStore({ plants: [makePlant()] });
    const q = createStageQuestion(store, { plantId: 'plant-1', stageId: 'veg', text: 'Any deficiency?' });
    assert(q && q.details && q.details.kind === 'question', 'createStageQuestion: details.kind is "question"');
  }

  // 10. details.status starts as 'open'
  {
    const store = makeStore({ plants: [makePlant()] });
    const q = createStageQuestion(store, { plantId: 'plant-1', stageId: 'veg', text: 'Is this normal?' });
    assert(q && q.details && q.details.status === 'open', 'createStageQuestion: details.status starts as "open"');
  }

  // 11. Question body is guaranteed to end with '?'
  {
    const store = makeStore({ plants: [makePlant()] });
    const q = createStageQuestion(store, { plantId: 'plant-1', stageId: 'veg', text: 'Why are leaves curling' });
    assert(q && q.details && q.details.notes.endsWith('?'), 'createStageQuestion: notes body ends with "?" even when input lacks it');
  }

  // 12. Body already ending with '?' is not double-suffixed
  {
    const store = makeStore({ plants: [makePlant()] });
    const q = createStageQuestion(store, { plantId: 'plant-1', stageId: 'veg', text: 'Is this overwatered?' });
    assert(q && !q.details.notes.endsWith('??'), 'createStageQuestion: does not double-suffix "?" when already present');
  }

  // 13. Empty text returns null (falsy)
  {
    const store = makeStore({ plants: [makePlant()] });
    const q = createStageQuestion(store, { plantId: 'plant-1', stageId: 'veg', text: '' });
    assert(!q, 'createStageQuestion: empty text returns null');
  }

  // 14. Has required timestamp field
  {
    const store = makeStore({ plants: [makePlant()] });
    const q = createStageQuestion(store, { plantId: 'plant-1', stageId: 'veg', text: 'Valid?' });
    assert(q && typeof q.timestamp === 'string' && q.timestamp.length > 0, 'createStageQuestion: returned object has a timestamp string');
  }

  // ── getStageObservations ──────────────────────────────────────────────────

  // 15. Returns an object with notes, questions, openQuestions arrays for valid input
  {
    const store = makeStore({ plants: [makePlant()] });
    const out = getStageObservations(store, { plantId: 'plant-1', stageId: 'veg' });
    assert(Array.isArray(out.notes), 'getStageObservations: returns .notes array');
    assert(Array.isArray(out.questions), 'getStageObservations: returns .questions array');
    assert(Array.isArray(out.openQuestions), 'getStageObservations: returns .openQuestions array');
  }

  // 16. Returns empty shape for missing plantId
  {
    const store = makeStore({ plants: [makePlant()] });
    const out = getStageObservations(store, { plantId: '', stageId: 'veg' });
    assert(out.notes.length === 0 && out.questions.length === 0, 'getStageObservations: empty result when plantId is missing');
  }

  // 17. Returns empty shape for missing stageId
  {
    const store = makeStore({ plants: [makePlant()] });
    const out = getStageObservations(store, { plantId: 'plant-1', stageId: '' });
    assert(out.notes.length === 0 && out.questions.length === 0, 'getStageObservations: empty result when stageId is missing');
  }

  // 18. Returns empty shape for unknown plant
  {
    const store = makeStore({ plants: [makePlant()] });
    const out = getStageObservations(store, { plantId: 'ghost', stageId: 'veg' });
    assert(out.notes.length === 0 && out.questions.length === 0, 'getStageObservations: empty result for unknown plantId');
  }

  // 19. After createStageNote, getStageObservations includes the created note
  {
    const store = makeStore({ plants: [makePlant()] });
    const note = createStageNote(store, { plantId: 'plant-1', stageId: 'veg', text: 'Node created for retrieval test' });
    const out = getStageObservations(store, { plantId: 'plant-1', stageId: 'veg' });
    assert(out.notes.length === 1, 'getStageObservations: includes note created via createStageNote (length)');
    assert(note && out.notes[0] && out.notes[0].id === note.id, 'getStageObservations: retrieved note matches created note by id');
  }

  // 20. After createStageQuestion, getStageObservations includes it in both questions and openQuestions
  {
    const store = makeStore({ plants: [makePlant()] });
    const q = createStageQuestion(store, { plantId: 'plant-1', stageId: 'veg', text: 'Should I defoliate?' });
    const out = getStageObservations(store, { plantId: 'plant-1', stageId: 'veg' });
    assert(out.questions.length === 1, 'getStageObservations: includes question created via createStageQuestion');
    assert(out.openQuestions.length === 1, 'getStageObservations: open question appears in openQuestions');
    assert(q && out.openQuestions[0] && out.openQuestions[0].id === q.id, 'getStageObservations: openQuestions entry matches created question by id');
  }

  // 21. Notes and questions for a different stageId are not returned
  {
    const store = makeStore({ plants: [makePlant()] });
    createStageNote(store, { plantId: 'plant-1', stageId: 'flower', text: 'Note in flower stage' });
    const out = getStageObservations(store, { plantId: 'plant-1', stageId: 'veg' });
    assert(out.notes.length === 0, 'getStageObservations: notes from a different stageId are excluded');
  }

  // 22. Multiple notes are returned sorted by timestamp ascending
  {
    const plant = makePlant();
    // Pre-seed two logs with controlled timestamps so order is deterministic
    const early = new Date(Date.now() - 5000).toISOString();
    const late  = new Date(Date.now()).toISOString();
    plant.logs.push({
      id: 'first',
      date: early,
      timestamp: early,
      type: 'stage-note',
      details: { stageId: 'veg', notes: 'Earlier note', kind: 'observation', milestoneId: null },
    });
    plant.logs.push({
      id: 'second',
      date: late,
      timestamp: late,
      type: 'stage-note',
      details: { stageId: 'veg', notes: 'Later note', kind: 'observation', milestoneId: null },
    });
    const store = makeStore({ plants: [plant] });
    const out = getStageObservations(store, { plantId: 'plant-1', stageId: 'veg' });
    assert(out.notes.length === 2 && out.notes[0].id === 'first', 'getStageObservations: notes sorted by timestamp ascending (oldest first)');
  }

  return results;
}
