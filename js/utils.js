// GrowDoc Companion — Shared Utilities

/**
 * Escape HTML special characters to prevent XSS.
 * All user-provided strings MUST pass through this before innerHTML insertion.
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Format an ISO date string to a human-readable date. */
export function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

/** Return the number of whole days since the given ISO date string. */
export function daysSince(isoString) {
  if (!isoString) return 0;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

/** Generate a short unique ID (8 hex chars). */
export function generateId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Standard debounce — delays fn execution until ms after last call. */
export function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Return whole days since the most recent log entry of the given type,
 * or null if no matching log exists. Accepts either a plant object (with
 * .logs) OR a logs array directly.
 *
 * @param {{logs?: Array}|Array} plantOrLogs
 * @param {string} type - Log type e.g. 'water', 'feed'
 * @returns {number|null}
 */
export function daysSinceLog(plantOrLogs, type) {
  const logs = Array.isArray(plantOrLogs) ? plantOrLogs : (plantOrLogs?.logs || []);
  const filtered = logs.filter(l => l.type === type);
  if (filtered.length === 0) return null;
  const last = filtered[filtered.length - 1];
  return Math.floor((Date.now() - new Date(last.date || last.timestamp)) / 86400000);
}


// ── Tests ──────────────────────────────────────────────────────────────

export function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // escapeHtml
  assert(escapeHtml('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    'escapeHtml escapes tags and quotes');
  assert(escapeHtml("it's & done") === "it&#x27;s &amp; done",
    'escapeHtml escapes apostrophes and ampersands');
  assert(escapeHtml('') === '', 'escapeHtml handles empty string');
  assert(escapeHtml(null) === '', 'escapeHtml handles null');
  assert(escapeHtml(123) === '', 'escapeHtml handles non-string');

  // formatDate
  assert(formatDate('2024-06-15T12:00:00Z').includes('Jun'), 'formatDate returns month name');
  assert(formatDate('2024-06-15T12:00:00Z').includes('15'), 'formatDate returns day');
  assert(formatDate('') === '', 'formatDate handles empty string');
  assert(formatDate('not-a-date') === '', 'formatDate handles invalid date');

  // daysSince
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  assert(daysSince(yesterday) === 1, 'daysSince returns 1 for yesterday');
  assert(daysSince('') === 0, 'daysSince handles empty string');

  // generateId
  const id1 = generateId();
  const id2 = generateId();
  assert(id1.length === 8, 'generateId returns 8-char string');
  assert(/^[0-9a-f]{8}$/.test(id1), 'generateId returns hex string');
  assert(id1 !== id2, 'generateId returns unique IDs');

  // debounce
  assert(typeof debounce(() => {}, 100) === 'function', 'debounce returns a function');

  return results;
}
