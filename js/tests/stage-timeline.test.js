// GrowDoc Companion — Stage Timeline Tests (Section 07)

import { STAGES, STAGE_TRANSITIONS, getDaysInStage, shouldAutoAdvance, getStageById, getStageIndex, getCureBurpSchedule } from '../data/stage-rules.js';
import { renderTimeline, advancePlantStage } from '../components/timeline-bar.js';
import { createStore } from '../store.js';

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // ── Timeline Rendering Tests ────────────────────────────────────

  // All stages rendered
  {
    const container = document.createElement('div');
    renderTimeline(container, { currentStage: 'early-veg', daysInStage: 10, mode: 'compact' });
    const segments = container.querySelectorAll('.timeline-segment');
    assert(segments.length === STAGES.length, `timeline renders all ${STAGES.length} stages (got ${segments.length})`);
  }

  // Current stage marker positioned correctly
  {
    const container = document.createElement('div');
    renderTimeline(container, { currentStage: 'mid-flower', daysInStage: 9, mode: 'compact' });
    const current = container.querySelector('.timeline-segment.current');
    assert(current !== null, 'current stage segment has .current class');
    assert(current.dataset.stage === 'mid-flower', 'current segment is mid-flower');
    const marker = current.querySelector('.timeline-marker');
    assert(marker !== null, 'current segment has position marker');
    // 9 days / 18 typical = 50%
    assert(marker.style.left === '50%', `marker at 50% (got ${marker.style.left})`);
  }

  // Completed stages marked
  {
    const container = document.createElement('div');
    renderTimeline(container, { currentStage: 'transition', daysInStage: 5, mode: 'compact' });
    const completed = container.querySelectorAll('.timeline-segment.completed');
    const transIdx = getStageIndex('transition');
    assert(completed.length === transIdx, `${transIdx} stages marked completed before transition`);
  }

  // Milestone markers appear
  {
    const container = document.createElement('div');
    renderTimeline(container, { currentStage: 'germination', daysInStage: 1, mode: 'full' });
    const milestones = container.querySelectorAll('.timeline-milestone');
    assert(milestones.length > 0, 'milestone markers rendered');
  }

  // ── Stage Data Tests ────────────────────────────────────────────

  // Stage order is correct
  {
    const ids = STAGES.map(s => s.id);
    assert(ids[0] === 'germination', 'first stage is germination');
    // `done` is a sentinel appended after the real cultivation lifecycle —
    // the meaningful "last real stage" is curing.
    const nonSentinel = ids.filter(id => id !== 'done');
    assert(nonSentinel[nonSentinel.length - 1] === 'curing', 'last real stage is curing');
    assert(ids.indexOf('transition') < ids.indexOf('early-flower'), 'transition before early-flower');
  }

  // All stages have valid durations
  {
    let valid = true;
    for (const s of STAGES) {
      if (s.minDays > s.maxDays || s.typicalDays < s.minDays || s.typicalDays > s.maxDays) {
        valid = false;
        break;
      }
    }
    assert(valid, 'all stages have valid min <= typical <= max durations');
  }

  // ── Stage Transition Tests ──────────────────────────────────────

  // Auto-advance prompt appears at typical duration
  {
    const plant = { stage: 'seedling', stageStartDate: new Date(Date.now() - 11 * 86400000).toISOString() };
    const result = shouldAutoAdvance(plant);
    assert(result !== null, 'auto-advance triggers for seedling at 11 days (trigger=10)');
    assert(result.nextStage === 'early-veg', 'next stage is early-veg');
  }

  // No auto-advance before trigger
  {
    const plant = { stage: 'seedling', stageStartDate: new Date(Date.now() - 5 * 86400000).toISOString() };
    const result = shouldAutoAdvance(plant);
    assert(result === null, 'no auto-advance at 5 days (trigger=10)');
  }

  // Confirm advance updates plant stage
  {
    const store = createStore({
      grow: {
        plants: [{ id: 'p1', name: 'Test', stage: 'seedling', stageStartDate: '2026-01-01T00:00:00Z', logs: [] }],
        stageHistory: [{ stage: 'seedling', startDate: '2026-01-01T00:00:00Z', endDate: null }],
      }
    });

    let eventFired = false;
    store.on('stage:changed', (data) => { eventFired = true; });

    advancePlantStage(store, 'p1', 'early-veg');

    assert(store.state.grow.plants[0].stage === 'early-veg', 'plant stage updated to early-veg');
    assert(store.state.grow.plants[0].stageStartDate !== '2026-01-01T00:00:00Z', 'stageStartDate updated');
    assert(eventFired, 'stage:changed event fired');
    assert(store.state.grow.stageHistory.length === 2, 'stage history has new entry');
  }

  // Decline advance does not change stage (auto-advance prompt dismiss)
  {
    const container = document.createElement('div');
    let advanced = false;
    renderTimeline(container, {
      currentStage: 'seedling',
      daysInStage: 15,
      mode: 'compact',
      onAdvance: () => { advanced = true; }
    });
    const noBtn = container.querySelector('.timeline-advance-prompt .btn:not(.btn-primary)');
    assert(noBtn !== null, 'decline button exists');
    if (noBtn) noBtn.click();
    assert(!advanced, 'declining advance does not fire onAdvance');
  }

  // ── Burp Schedule Tests ─────────────────────────────────────────

  {
    const week1 = getCureBurpSchedule(3);
    assert(week1.perDay === 3, 'week 1: 3 burps/day');

    const week2 = getCureBurpSchedule(10);
    assert(week2.perDay === 1, 'week 2: 1 burp/day');

    const week3 = getCureBurpSchedule(20);
    assert(week3.perDay === 0.5, 'week 3-4: every 2-3 days');

    const week5 = getCureBurpSchedule(35);
    assert(week5.perDay < 0.5, 'week 5+: weekly');
  }

  return results;
}
