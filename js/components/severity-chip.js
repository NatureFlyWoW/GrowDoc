// GrowDoc Companion — Severity Chip Component (section-02)
//
// Three-way note severity selector. DISPLAY labels are info / watch / alert
// (alphabetical by severity ascending in the ordering requested by the plan).
// On click we write the LEGACY on-disk enum ('urgent' | 'concern' | null) to
// `target[targetKey]` for backwards compatibility with every existing GrowDoc
// caller that already reads `log.details.severity` as the legacy enum.
//
// Real auto-infer lives in section-03's SEVERITY_HEURISTICS. This module
// ships a small placeholder heuristic so blurring a textarea with clearly
// urgent or clearly cautious words nudges the chip without breaking the
// caller's severity field if the user never touches the chip.

const OPTIONS = ['info', 'watch', 'alert']; // DOM order: low → high

const DISPLAY_TO_LEGACY = {
  info: null,
  watch: 'concern',
  alert: 'urgent',
};

const LEGACY_TO_DISPLAY = {
  urgent: 'alert',
  concern: 'watch',
};

/**
 * Placeholder heuristic. Returns the legacy enum value. The real keyword
 * matcher with proper boundaries and grouping lands in section-03.
 * Section-02 tests assert `'dying' → urgent`, `'looks fine' → null`.
 *
 * @param {string} text
 * @returns {'urgent'|'concern'|null}
 */
export function autoInferSeverity(text) {
  if (typeof text !== 'string' || text.trim().length === 0) return null;
  const t = text.toLowerCase();
  const urgent = /\b(dying|dead|crashing|emergency|wilted?|rotting|root\s?rot|burning|burnt)\b/;
  const concern = /\b(worried|concerned?|slight|drooping?|yellow(ing)?|curling?|stressed?|sluggish|slow)\b/;
  if (urgent.test(t)) return 'urgent';
  if (concern.test(t)) return 'concern';
  return null;
}

/**
 * Mount a severity chip row into `container`. Writes the legacy enum
 * value to `target[targetKey]` on every change.
 *
 * @param {HTMLElement} container
 * @param {{
 *   target?: Object,
 *   targetKey?: string,
 *   initial?: 'urgent'|'concern'|null,
 *   autoInferFrom?: HTMLTextAreaElement|HTMLInputElement|null
 * }} options
 */
export function mountSeverityChip(container, options = {}) {
  const {
    target = null,
    targetKey = 'severity',
    initial = null,
    autoInferFrom = null,
  } = options;

  const row = document.createElement('div');
  row.className = 'nc-severity-chip-row';
  row.setAttribute('role', 'radiogroup');
  row.setAttribute('aria-label', 'Severity');

  const buttons = new Map(); // display-label -> button element
  let currentLegacy = null;
  let autoInferred = false;

  for (const display of OPTIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `nc-severity-chip nc-severity-chip-${display}`;
    btn.textContent = display;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.dataset.severity = display;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setValue(DISPLAY_TO_LEGACY[display], false);
    });
    buttons.set(display, btn);
    row.appendChild(btn);
  }

  container.appendChild(row);

  function _syncRow() {
    const displayForCurrent = currentLegacy === null ? 'info' : LEGACY_TO_DISPLAY[currentLegacy];
    for (const [d, btn] of buttons) {
      const selected = d === displayForCurrent && currentLegacy !== null;
      // When nothing is selected (initial null), no button carries the
      // aria-checked="true" state. We still highlight once the user picks.
      btn.setAttribute('aria-checked', selected ? 'true' : 'false');
      if (selected) btn.dataset.selected = 'true';
      else delete btn.dataset.selected;
    }
    if (autoInferred) row.dataset.autoInferred = 'true';
    else delete row.dataset.autoInferred;
  }

  function setValue(legacy, fromAutoInfer) {
    currentLegacy = legacy;
    autoInferred = !!fromAutoInfer;
    if (target) target[targetKey] = legacy;
    _syncRow();
  }

  function getValue() {
    return currentLegacy;
  }

  function isAutoInferred() {
    return autoInferred;
  }

  // Hydrate from initial WITHOUT mutating target (spec: never on mount).
  if (initial === 'urgent' || initial === 'concern') {
    currentLegacy = initial;
    autoInferred = false;
  }
  _syncRow();

  // Auto-infer binding: only fires on blur when the chip is still null
  // (i.e., user did not pick one explicitly). Manual clicks clear the
  // auto-inferred flag via setValue(..., false) above.
  if (autoInferFrom && typeof autoInferFrom.addEventListener === 'function') {
    autoInferFrom.addEventListener('blur', () => {
      if (currentLegacy !== null) return;
      const inferred = autoInferSeverity(autoInferFrom.value);
      if (inferred !== null) setValue(inferred, true);
    });
  }

  return { element: row, getValue, setValue, isAutoInferred };
}
