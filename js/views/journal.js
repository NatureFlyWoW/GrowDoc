// GrowDoc Companion — Journal View
//
// Reverse-chronological log feed across all plants in the current grow,
// with filters for plant, type, and date range. The router has the
// /grow/journal route already; this is the missing view handler.

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
