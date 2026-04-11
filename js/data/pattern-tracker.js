// GrowDoc Companion — Pattern Tracker
//
// Pure data module — no DOM, no storage I/O. Reads from
// grow.taskStats.intervals and returns numbers. Used by the task
// engine to override hardcoded watering / feeding intervals with
// per-plant learned cadence.
//
// Rules:
//   - Need ≥3 data points to override the default (so cold-start
//     uses defaults).
//   - Interval = median of day-deltas between consecutive completions.
//   - Discard any individual delta > 2x the current median (vacation
//     skips, etc.).
//   - Scoped per (plantId, type, stage) — no cross-contamination.

/**
 * Internal: median of a numeric array. Returns NaN for empty.
 */
function _median(arr) {
  if (!arr || arr.length === 0) return NaN;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Compute day-deltas between consecutive ISO date strings in an array.
 * Returns an array of numbers (length = input.length - 1) or [].
 */
function _deltasFromDates(dates) {
  if (!Array.isArray(dates) || dates.length < 2) return [];
  const sorted = [...dates].sort();
  const deltas = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1]).getTime();
    const b = new Date(sorted[i]).getTime();
    if (Number.isFinite(a) && Number.isFinite(b)) {
      deltas.push((b - a) / 86400000);
    }
  }
  return deltas;
}

/**
 * Compute the learned interval (in days) for a given plant/type/stage
 * from historical completion dates. Falls back to the supplied default
 * when there is insufficient data.
 *
 * @param {object} plant - Plant record (must have id)
 * @param {string} type - Task type, e.g. 'water', 'feed'
 * @param {string} stage - Current stage id
 * @param {object} grow - Full grow object (reads taskStats.intervals)
 * @param {number} defaultInterval - Fallback when insufficient data
 * @returns {number} interval in days
 */
export function getLearnedInterval(plant, type, stage, grow, defaultInterval) {
  const dates = grow?.taskStats?.intervals?.[plant?.id]?.[type]?.[stage];
  if (!Array.isArray(dates) || dates.length < 3) return defaultInterval;

  const deltas = _deltasFromDates(dates);
  if (deltas.length < 2) return defaultInterval;

  // First-pass median
  const m1 = _median(deltas);
  if (!Number.isFinite(m1) || m1 <= 0) return defaultInterval;

  // Discard outliers > 2x median, then recompute
  const filtered = deltas.filter(d => d <= 2 * m1);
  if (filtered.length < 2) return defaultInterval;

  const m2 = _median(filtered);
  return Number.isFinite(m2) && m2 > 0 ? Math.round(m2 * 10) / 10 : defaultInterval;
}

// ── Tests ────────────────────────────────────────────────────────────

export function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // Test: insufficient data returns default
  {
    const plant = { id: 'p1' };
    const grow = { taskStats: { intervals: { p1: { water: { veg: ['2026-01-01'] } } } } };
    assert(getLearnedInterval(plant, 'water', 'veg', grow, 3) === 3,
      'insufficient data (1 point) returns default');
  }
  {
    const plant = { id: 'p1' };
    const grow = { taskStats: { intervals: { p1: { water: { veg: ['2026-01-01', '2026-01-04'] } } } } };
    assert(getLearnedInterval(plant, 'water', 'veg', grow, 3) === 3,
      'insufficient data (2 points = 1 delta) returns default');
  }

  // Test: median of [3, 3, 4, 3, 3] = 3
  {
    const plant = { id: 'p1' };
    const dates = ['2026-01-01', '2026-01-04', '2026-01-07', '2026-01-11', '2026-01-14', '2026-01-17'];
    // Deltas: 3, 3, 4, 3, 3 -> median 3
    const grow = { taskStats: { intervals: { p1: { water: { veg: dates } } } } };
    assert(getLearnedInterval(plant, 'water', 'veg', grow, 999) === 3,
      'median of [3,3,4,3,3] returns 3');
  }

  // Test: outlier rejection — [3,3,3,3,15] should drop the 15
  {
    const plant = { id: 'p1' };
    // Deltas: 3, 3, 3, 3, 15. Median = 3. 15 > 2*3, dropped.
    const dates = ['2026-01-01', '2026-01-04', '2026-01-07', '2026-01-10', '2026-01-13', '2026-01-28'];
    const grow = { taskStats: { intervals: { p1: { water: { veg: dates } } } } };
    assert(getLearnedInterval(plant, 'water', 'veg', grow, 999) === 3,
      'outlier (15 days) discarded, median stays 3');
  }

  // Test: per-stage scoping — seedling data does not pollute flower
  {
    const plant = { id: 'p1' };
    const grow = {
      taskStats: {
        intervals: {
          p1: {
            water: {
              seedling: ['2026-01-01', '2026-01-03', '2026-01-05', '2026-01-07'], // 2-day intervals
              'mid-flower': [], // empty
            },
          },
        },
      },
    };
    assert(getLearnedInterval(plant, 'water', 'mid-flower', grow, 5) === 5,
      'empty stage history returns default, not other-stage data');
    assert(getLearnedInterval(plant, 'water', 'seedling', grow, 999) === 2,
      'seedling-scoped median returns 2');
  }

  // Test: per-plant scoping
  {
    const grow = {
      taskStats: {
        intervals: {
          p1: { water: { veg: ['2026-01-01', '2026-01-04', '2026-01-07', '2026-01-10'] } },
          p2: { water: { veg: [] } },
        },
      },
    };
    assert(getLearnedInterval({ id: 'p2' }, 'water', 'veg', grow, 5) === 5,
      'plant 2 with no history returns default, not plant 1 data');
  }

  return results;
}
