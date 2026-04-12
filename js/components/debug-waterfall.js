// GrowDoc Companion — Debug Waterfall (section-08)
//
// Hidden behind `?debugNotes=1`, persisted in sessionStorage. Renders a
// table of raw text → parsed keywords → merged ctx → weight → citations
// per observation. Row count capped at 200 (oldest pruned).
//
// Activation hook in js/main.js:
//   if (new URLSearchParams(location.search).get('debugNotes') === '1') {
//     sessionStorage.setItem('growdoc-debug-notes', '1');
//   }
//   if (sessionStorage.getItem('growdoc-debug-notes') === '1') {
//     import('./components/debug-waterfall.js').then(({ renderDebugWaterfall }) => {
//       const el = document.createElement('div');
//       el.id = 'nc-debug-waterfall-panel';
//       document.body.appendChild(el);
//       renderDebugWaterfall(el);
//     });
//   }

import { getObservationIndex, mergeNoteContext, getCitationsFor } from '../data/note-contextualizer/index.js';

export const MAX_WATERFALL_ROWS = 200;

/**
 * Render the debug waterfall into `mountEl`. Idempotent — wipes and redraws
 * the mount on each call.
 */
export function renderDebugWaterfall(mountEl) {
  if (!mountEl) return;
  mountEl.innerHTML = '';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'nc-waterfall-close';
  closeBtn.textContent = '×';
  closeBtn.title = 'Close waterfall';
  closeBtn.addEventListener('click', () => {
    try { sessionStorage.removeItem('growdoc-debug-notes'); } catch (err) { console.error('[debug-waterfall:session-clear]', err); }
    if (mountEl.parentNode) mountEl.parentNode.removeChild(mountEl);
  });
  mountEl.appendChild(closeBtn);

  const title = document.createElement('div');
  title.className = 'nc-waterfall-title';
  title.textContent = 'Note Contextualizer Debug Waterfall';
  mountEl.appendChild(title);

  let index;
  try { index = getObservationIndex(); } catch (err) { console.error('[debug-waterfall:observation-index]', err); index = null; }
  const all = (index && Array.isArray(index.all)) ? index.all.slice() : [];

  all.sort((a, b) => (Date.parse(b.observedAt) || 0) - (Date.parse(a.observedAt) || 0));
  const rows = all.slice(0, MAX_WATERFALL_ROWS);

  const table = document.createElement('table');
  table.className = 'nc-waterfall';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const label of ['Raw text', 'Parsed keywords', 'Merged ctx', 'Weight', 'Cited by']) {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const obs of rows) {
    const tr = document.createElement('tr');
    tr.className = 'waterfall-row';
    tr.dataset.obsId = obs.id;

    const tdRaw = document.createElement('td');
    const raw = typeof obs.rawText === 'string' ? obs.rawText : '';
    tdRaw.textContent = raw.length > 120 ? raw.slice(0, 119) + '…' : raw;
    tr.appendChild(tdRaw);

    const tdKw = document.createElement('td');
    const kws = (obs.parsed && Array.isArray(obs.parsed.keywords)) ? obs.parsed.keywords : [];
    tdKw.textContent = kws.length > 0 ? kws.join(', ') : '—';
    tr.appendChild(tdKw);

    const tdCtx = document.createElement('td');
    try {
      const merged = mergeNoteContext([obs]);
      tdCtx.textContent = JSON.stringify(merged.ctx || {});
    } catch (err) { console.error('[debug-waterfall:context]', err); tdCtx.textContent = '—'; }
    tr.appendChild(tdCtx);

    const tdWeight = document.createElement('td');
    const ageH = Math.max(0, Math.floor((Date.now() - Date.parse(obs.observedAt)) / 3_600_000));
    tdWeight.textContent = `${obs.severity || 'info'} · ${ageH}h`;
    tr.appendChild(tdWeight);

    const tdCited = document.createElement('td');
    let cites;
    try { cites = getCitationsFor(obs.id); } catch (err) { console.error('[debug-waterfall:citations]', err); cites = []; }
    tdCited.textContent = (Array.isArray(cites) && cites.length > 0) ? cites.join(', ') : '—';
    tr.appendChild(tdCited);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  mountEl.appendChild(table);
}
