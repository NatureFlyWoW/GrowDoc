// GrowDoc Companion — Journal View
//
// Reverse-chronological log feed across all plants in the current grow,
// with filters for plant, type, and date range. The router has the
// /grow/journal route already; this is the missing view handler.

import { navigate } from '../router.js';
import { markQuestionAnswered, dismissQuestion } from '../data/note-contextualizer/stage-sources.js';
import { getStageById } from '../data/stage-rules.js';

const TYPE_LABELS = {
  water: '💧 Water',
  feed: '🧪 Feed',
  train: '✂️ Train',
  observe: '👁 Observe',
  decision: '📌 Decision',
  diagnosis: '🩺 Diagnosis',
  curing: '🫙 Curing',
};

const PLANT_COLORS = [
  'var(--color-accent-1, #2d5016)',
  'var(--color-accent-2, #d97706)',
  'var(--color-accent-3, #1d4ed8)',
  'var(--color-accent-4, #be185d)',
  'var(--color-accent-5, #047857)',
  'var(--color-accent-6, #7c3aed)',
];

// Active filter for the "All observations" feed — module-level, persists across re-renders
let _activeFilter = 'all';

// Local state for filters — kept module-level since journal is a single view
let _filterState = {
  plantId: 'all',
  type: 'all',
  fromDate: '',
  toDate: '',
};

export function renderJournal(container, store) {
  container.innerHTML = '';
  const grow = store.state.grow;

  const h1 = document.createElement('h1');
  h1.textContent = 'Journal';
  container.appendChild(h1);

  if (!grow || !grow.plants || grow.plants.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-muted';
    p.textContent = 'No plants yet. Add a plant to start logging.';
    container.appendChild(p);
    return;
  }

  // ── "All observations" aggregated notes feed ─────────────────────
  const feedSection = _renderNotesFeed(store);
  container.appendChild(feedSection);

  // Build a unified, plant-tagged log feed
  const allLogs = _collectLogs(grow);

  // Filter controls
  const controls = _renderFilters(grow.plants, () => {
    // Re-render the list section only
    const listSection = container.querySelector('.journal-list');
    if (listSection) {
      listSection.innerHTML = '';
      _renderLogList(listSection, allLogs, grow.plants);
    }
  });
  container.appendChild(controls);

  // Stats line
  const stats = document.createElement('p');
  stats.className = 'text-muted';
  stats.style.fontSize = '0.85rem';
  stats.textContent = `${allLogs.length} log entries across ${grow.plants.length} plant(s).`;
  container.appendChild(stats);

  // Log list
  const list = document.createElement('div');
  list.className = 'journal-list';
  _renderLogList(list, allLogs, grow.plants);
  container.appendChild(list);
}

function _collectLogs(grow) {
  const result = [];
  for (const plant of grow.plants || []) {
    for (const log of plant.logs || []) {
      result.push({
        ...log,
        plantId: plant.id,
        plantName: plant.name,
        timestamp: log.timestamp || log.date,
      });
    }
  }
  // Reverse-chronological
  result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return result;
}

function _renderFilters(plants, onChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'journal-filters';
  wrapper.style.display = 'flex';
  wrapper.style.flexWrap = 'wrap';
  wrapper.style.gap = '12px';
  wrapper.style.marginBottom = '16px';
  wrapper.style.padding = '12px';
  wrapper.style.background = 'var(--bg-elevated, #f5f5f5)';
  wrapper.style.borderRadius = '6px';

  // Plant filter
  const plantSelect = document.createElement('select');
  plantSelect.className = 'input';
  plantSelect.style.minWidth = '120px';
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All plants';
  plantSelect.appendChild(allOpt);
  for (const p of plants) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if (_filterState.plantId === p.id) opt.selected = true;
    plantSelect.appendChild(opt);
  }
  plantSelect.addEventListener('change', () => {
    _filterState.plantId = plantSelect.value;
    onChange();
  });
  wrapper.appendChild(_labelWrap('Plant', plantSelect));

  // Type filter
  const typeSelect = document.createElement('select');
  typeSelect.className = 'input';
  typeSelect.style.minWidth = '120px';
  const allTypeOpt = document.createElement('option');
  allTypeOpt.value = 'all';
  allTypeOpt.textContent = 'All types';
  typeSelect.appendChild(allTypeOpt);
  for (const t of Object.keys(TYPE_LABELS)) {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = TYPE_LABELS[t];
    if (_filterState.type === t) opt.selected = true;
    typeSelect.appendChild(opt);
  }
  typeSelect.addEventListener('change', () => {
    _filterState.type = typeSelect.value;
    onChange();
  });
  wrapper.appendChild(_labelWrap('Type', typeSelect));

  // Date range
  const fromInput = document.createElement('input');
  fromInput.type = 'date';
  fromInput.className = 'input';
  fromInput.value = _filterState.fromDate;
  fromInput.addEventListener('change', () => {
    _filterState.fromDate = fromInput.value;
    onChange();
  });
  wrapper.appendChild(_labelWrap('From', fromInput));

  const toInput = document.createElement('input');
  toInput.type = 'date';
  toInput.className = 'input';
  toInput.value = _filterState.toDate;
  toInput.addEventListener('change', () => {
    _filterState.toDate = toInput.value;
    onChange();
  });
  wrapper.appendChild(_labelWrap('To', toInput));

  // Reset
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-sm';
  resetBtn.textContent = 'Reset';
  resetBtn.style.alignSelf = 'flex-end';
  resetBtn.addEventListener('click', () => {
    _filterState = { plantId: 'all', type: 'all', fromDate: '', toDate: '' };
    plantSelect.value = 'all';
    typeSelect.value = 'all';
    fromInput.value = '';
    toInput.value = '';
    onChange();
  });
  wrapper.appendChild(resetBtn);

  return wrapper;
}

function _labelWrap(label, control) {
  const group = document.createElement('div');
  group.style.display = 'flex';
  group.style.flexDirection = 'column';
  const lbl = document.createElement('label');
  lbl.textContent = label;
  lbl.style.fontSize = '0.75rem';
  lbl.style.color = 'var(--text-muted)';
  group.appendChild(lbl);
  group.appendChild(control);
  return group;
}

function _renderLogList(container, allLogs, plants) {
  // Apply filters
  const filtered = allLogs.filter(log => {
    if (_filterState.plantId !== 'all' && log.plantId !== _filterState.plantId) return false;
    if (_filterState.type !== 'all' && log.type !== _filterState.type) return false;
    if (_filterState.fromDate) {
      const logDate = new Date(log.timestamp);
      const from = new Date(_filterState.fromDate);
      if (logDate < from) return false;
    }
    if (_filterState.toDate) {
      const logDate = new Date(log.timestamp);
      const to = new Date(_filterState.toDate);
      to.setHours(23, 59, 59, 999); // inclusive end-of-day
      if (logDate > to) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-muted';
    p.textContent = 'No log entries match the current filters.';
    container.appendChild(p);
    return;
  }

  // Build a plantId -> color map (stable per render)
  const colorMap = {};
  plants.forEach((p, i) => {
    colorMap[p.id] = PLANT_COLORS[i % PLANT_COLORS.length];
  });

  for (const log of filtered) {
    container.appendChild(_renderLogEntry(log, colorMap[log.plantId]));
  }
}

function _renderLogEntry(log, color) {
  const entry = document.createElement('div');
  entry.className = 'journal-entry';
  entry.style.borderLeft = `3px solid ${color}`;
  entry.style.padding = '8px 12px';
  entry.style.marginBottom = '8px';
  entry.style.background = 'var(--bg-elevated, #fafafa)';
  entry.style.borderRadius = '4px';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'baseline';
  header.style.gap = '8px';

  const plantName = document.createElement('span');
  plantName.style.fontWeight = '600';
  plantName.style.color = color;
  plantName.textContent = log.plantName;

  const typeLabel = document.createElement('span');
  typeLabel.style.fontSize = '0.85rem';
  typeLabel.textContent = TYPE_LABELS[log.type] || log.type;

  const dateLabel = document.createElement('span');
  dateLabel.style.fontSize = '0.75rem';
  dateLabel.style.color = 'var(--text-muted)';
  dateLabel.textContent = _formatDate(log.timestamp);

  header.appendChild(plantName);
  header.appendChild(typeLabel);
  header.appendChild(dateLabel);
  entry.appendChild(header);

  // Detail summary
  if (log.details && Object.keys(log.details).length > 0) {
    const details = document.createElement('div');
    details.style.fontSize = '0.85rem';
    details.style.color = 'var(--text-muted)';
    details.style.marginTop = '4px';
    details.textContent = _summarizeDetails(log.details);
    entry.appendChild(details);
  }

  return entry;
}

function _summarizeDetails(details) {
  const parts = [];
  if (details.amount != null) parts.push(`${details.amount}mL`);
  if (details.pH != null) parts.push(`pH ${details.pH}`);
  if (details.ec != null) parts.push(`EC ${details.ec}`);
  if (details.runoffPh != null) parts.push(`runoff pH ${details.runoffPh}`);
  if (details.runoffEc != null) parts.push(`runoff EC ${details.runoffEc}`);
  if (details.product) parts.push(details.product);
  if (details.concentration != null) parts.push(`${details.concentration}ml/L`);
  if (details.actions && Array.isArray(details.actions) && details.actions.length > 0) {
    parts.push(details.actions.join(', '));
  }
  if (details.text) parts.push(details.text);
  if (details.notes) parts.push(details.notes);
  if (details.severity && details.severity !== 'info') parts.push(`[${details.severity}]`);
  if (details.action) parts.push(details.action);
  return parts.join(' · ');
}

function _formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  // Local short date + time
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── "All observations" notes feed ────────────────────────────────────

/**
 * Relative time formatter. Returns "just now", "5m ago", "2h ago",
 * "3d ago", "2w ago", "1mo ago". No deps.
 *
 * @param {string} iso
 * @returns {string}
 */
function _relativeTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0 || isNaN(ms)) return '';
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  if (ms < 30 * 86_400_000) return `${Math.floor(ms / (7 * 86_400_000))}w ago`;
  return `${Math.floor(ms / (30 * 86_400_000))}mo ago`;
}

/**
 * Walk all store sources and return a flat, sorted-desc array of
 * note-bearing entries.
 *
 * @param {Object} store
 * @returns {Array}
 */
export function _aggregateNotes(store) {
  const grow = store.state.grow;
  const profile = store.state.profile;
  const entries = [];

  // 1. Plant logs (stage-note, stage-question, decision, any log with details.notes)
  for (const plant of (grow && grow.plants) || []) {
    for (const log of plant.logs || []) {
      if (!log || !log.details || !log.details.notes) continue;
      const text = typeof log.details.notes === 'string' ? log.details.notes.trim() : '';
      if (!text) continue;
      entries.push({
        id: log.id,
        plantId: plant.id,
        plantName: plant.name || plant.id,
        stageId: log.details.stageId || plant.stage || null,
        timestamp: log.timestamp || log.date || null,
        source: log.type === 'stage-note'     ? 'stage-note'
              : log.type === 'stage-question' ? 'question'
              : log.type === 'decision'       ? 'decision'
              : 'log',
        body: text,
        questionStatus: (log.type === 'stage-question') ? (log.details.status || 'open') : null,
        milestoneId: log.details.milestoneId || null,
        raw: log,
      });
    }
    // 2. Plant-level diagnoses with free text
    for (const dx of plant.diagnoses || []) {
      if (!dx) continue;
      const body = (typeof dx.notes === 'string' ? dx.notes.trim() : '')
                || (typeof dx.body  === 'string' ? dx.body.trim()  : '');
      if (!body) continue;
      entries.push({
        id: dx.id || `dx-${plant.id}-${dx.timestamp || ''}`,
        plantId: plant.id,
        plantName: plant.name || plant.id,
        stageId: dx.stageId || plant.stage || null,
        timestamp: dx.timestamp || dx.date || null,
        source: 'diagnosis',
        body,
        questionStatus: null,
        milestoneId: null,
        raw: dx,
      });
    }
  }

  // 3. Profile wizard context notes
  if (profile && profile.notes && typeof profile.notes === 'object') {
    for (const [key, text] of Object.entries(profile.notes)) {
      if (!text || typeof text !== 'string' || !text.trim()) continue;
      entries.push({
        id: `wizard-${key}`,
        plantId: null,
        plantName: null,
        stageId: null,
        timestamp: profile.updatedAt || profile.createdAt || null,
        source: 'wizard',
        body: text.trim(),
        questionStatus: null,
        milestoneId: null,
        raw: { key },
      });
    }
  }

  // Sort newest first
  entries.sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
  return entries;
}

/** Map a source token to a filter chip category. */
function _sourceToFilterCategory(source) {
  if (source === 'stage-note' || source === 'log' || source === 'wizard') return 'observations';
  if (source === 'question') return 'questions';
  if (source === 'decision') return 'decisions';
  if (source === 'diagnosis') return 'diagnoses';
  return 'observations';
}

/**
 * Render the full "All observations" section including header, filters, and list.
 *
 * @param {Object} store
 * @returns {HTMLElement}
 */
function _renderNotesFeed(store) {
  const section = document.createElement('section');
  section.className = 'journal-notes-feed';

  // Header row
  const header = document.createElement('div');
  header.className = 'journal-notes-feed-header';

  const heading = document.createElement('h2');
  heading.textContent = 'All observations';
  header.appendChild(heading);

  // Filter chips
  const filtersRow = document.createElement('div');
  filtersRow.className = 'journal-notes-feed-filters';

  const filterDefs = [
    { key: 'all',          label: 'All' },
    { key: 'observations', label: 'Observations' },
    { key: 'questions',    label: 'Questions' },
    { key: 'decisions',    label: 'Decisions' },
    { key: 'diagnoses',    label: 'Diagnoses' },
  ];

  // The list UL — created first so filter chips can reference it
  const list = document.createElement('ul');
  list.className = 'journal-notes-feed-list';

  function _rebuildList() {
    list.innerHTML = '';
    const entries = _aggregateNotes(store);
    const filtered = _activeFilter === 'all'
      ? entries
      : entries.filter(e => _sourceToFilterCategory(e.source) === _activeFilter);

    if (filtered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'journal-notes-empty';
      empty.textContent = 'No observations yet. Start logging from the dashboard or any plant detail view.';
      list.appendChild(empty);
      return;
    }

    for (const entry of filtered) {
      list.appendChild(_renderFeedEntry(entry, store, _rebuildList));
    }
  }

  for (const def of filterDefs) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'filter-chip';
    chip.textContent = def.label;
    chip.setAttribute('aria-pressed', _activeFilter === def.key ? 'true' : 'false');

    chip.addEventListener('click', () => {
      _activeFilter = def.key;
      // Update aria-pressed on all chips in this row
      filtersRow.querySelectorAll('.filter-chip').forEach(c => {
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      _rebuildList();
    });
    filtersRow.appendChild(chip);
  }

  header.appendChild(filtersRow);
  section.appendChild(header);
  section.appendChild(list);

  // Initial population
  _rebuildList();

  return section;
}

/**
 * Render a single feed entry <li>.
 *
 * @param {Object} entry
 * @param {Object} store
 * @param {Function} rebuildList - callback to refresh the feed list after mutation
 * @returns {HTMLLIElement}
 */
function _renderFeedEntry(entry, store, rebuildList) {
  const li = document.createElement('li');
  li.className = 'journal-note-entry';

  // Meta row
  const meta = document.createElement('div');
  meta.className = 'journal-note-meta';

  const time = document.createElement('span');
  time.className = 'journal-note-time';
  time.textContent = _relativeTime(entry.timestamp) || _formatDate(entry.timestamp) || 'unknown date';
  meta.appendChild(time);

  const sourceBadge = document.createElement('span');
  sourceBadge.className = `journal-note-source-badge journal-note-source-badge--${entry.source}`;
  sourceBadge.textContent = entry.source;
  meta.appendChild(sourceBadge);

  if (entry.stageId) {
    const stageDef = getStageById(entry.stageId);
    const stageName = stageDef ? stageDef.name : entry.stageId;
    const stageChip = document.createElement('span');
    stageChip.className = 'journal-note-stage-chip';
    stageChip.textContent = stageName;
    meta.appendChild(stageChip);
  }

  if (entry.plantName) {
    const plantChip = document.createElement('span');
    plantChip.className = 'journal-note-plant-chip';
    plantChip.textContent = entry.plantName;
    meta.appendChild(plantChip);
  }

  li.appendChild(meta);

  // Body
  const body = document.createElement('div');
  body.className = 'journal-note-body';
  body.textContent = entry.body;
  li.appendChild(body);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'journal-note-actions';

  if (entry.source === 'question') {
    const status = entry.questionStatus || 'open';
    if (status === 'open') {
      const answerBtn = document.createElement('button');
      answerBtn.type = 'button';
      answerBtn.className = 'btn btn-sm';
      answerBtn.textContent = 'Mark answered';
      answerBtn.addEventListener('click', () => {
        markQuestionAnswered(store, entry.id);
        rebuildList();
      });
      actions.appendChild(answerBtn);

      const dismissBtn = document.createElement('button');
      dismissBtn.type = 'button';
      dismissBtn.className = 'btn btn-sm';
      dismissBtn.textContent = 'Dismiss';
      dismissBtn.addEventListener('click', () => {
        dismissQuestion(store, entry.id);
        rebuildList();
      });
      actions.appendChild(dismissBtn);
    } else {
      const statusNote = document.createElement('span');
      statusNote.className = 'journal-note-question-status text-muted';
      statusNote.textContent = status === 'answered' ? 'Answered' : 'Dismissed';
      actions.appendChild(statusNote);
    }
  } else if (entry.stageId && entry.plantId) {
    const timelineLink = document.createElement('a');
    timelineLink.href = '#';
    timelineLink.className = 'journal-note-timeline-link';
    timelineLink.textContent = 'View in timeline';
    timelineLink.addEventListener('click', (e) => {
      e.preventDefault();
      const ui = { ...(store.state.ui || {}), selectedTimelinePlantId: entry.plantId };
      store.commit('ui', ui);
      navigate('/grow/timeline');
    });
    actions.appendChild(timelineLink);
  }

  if (actions.children.length > 0) {
    li.appendChild(actions);
  }

  return li;
}
