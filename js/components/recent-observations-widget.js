// GrowDoc Companion — Recent Observations Widget (section-08)
//
// Collapsible "last 5 observations for this plant" widget. Uses the
// singleton observation index; no store mutation, no direct DOM coupling
// beyond the provided mount element.

import { getObservationIndex } from '../data/note-contextualizer/index.js';

const MAX_ITEMS = 5;
const SEVERITY_LABEL = { alert: 'alert', watch: 'watch', info: 'info' };

/**
 * Mount the widget into `mountEl`. Re-renders on demand via `refresh()`.
 * @param {HTMLElement} mountEl
 * @param {string}      activePlantId
 * @returns {{ element: HTMLElement, refresh: () => void, destroy: () => void }}
 */
export function mountRecentObservationsWidget(mountEl, activePlantId) {
  const details = document.createElement('details');
  details.className = 'nc-recent-observations-widget';

  const summary = document.createElement('summary');
  summary.className = 'nc-recent-summary';
  details.appendChild(summary);

  const list = document.createElement('div');
  list.className = 'nc-recent-list';
  details.appendChild(list);

  if (mountEl) mountEl.appendChild(details);

  function refresh() {
    let index;
    try { index = getObservationIndex(); } catch (err) { console.error('[recent-obs:observation-index]', err); index = null; }
    const all = (index && Array.isArray(index.all)) ? index.all : [];
    const relevant = all
      .filter(o => o && o.plantId === activePlantId)
      .sort((a, b) => (Date.parse(b.observedAt) || 0) - (Date.parse(a.observedAt) || 0))
      .slice(0, MAX_ITEMS);

    summary.textContent = `Recent observations (${relevant.length})`;
    list.innerHTML = '';

    if (relevant.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'nc-recent-empty';
      empty.textContent = 'No recent observations for this plant.';
      list.appendChild(empty);
      return;
    }

    for (const obs of relevant) {
      const row = document.createElement('div');
      row.className = 'nc-recent-row';
      row.dataset.obsId = obs.id;
      row.dataset.severity = obs.severity || 'info';

      const text = document.createElement('span');
      text.className = 'nc-recent-text';
      const raw = typeof obs.rawText === 'string' ? obs.rawText : '';
      text.textContent = raw.length > 80 ? raw.slice(0, 79) + '…' : raw;
      row.appendChild(text);

      if (Array.isArray(obs.domains) && obs.domains.length > 0) {
        const domChip = document.createElement('span');
        domChip.className = 'nc-domain-chip';
        domChip.textContent = obs.domains[0];
        row.appendChild(domChip);
      }

      const sevChip = document.createElement('span');
      sevChip.className = 'nc-severity-chip-display nc-severity-chip-' + (obs.severity || 'info');
      sevChip.textContent = SEVERITY_LABEL[obs.severity] || 'info';
      row.appendChild(sevChip);

      list.appendChild(row);
    }
  }

  refresh();

  function destroy() {
    if (details.parentNode) details.parentNode.removeChild(details);
  }

  return { element: details, refresh, destroy };
}
