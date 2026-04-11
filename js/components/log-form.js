// GrowDoc Companion — Quick Log Form Component

import { generateId } from '../utils.js';

const LOG_TYPES = [
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'feed', label: 'Feed', icon: '🧪' },
  { id: 'train', label: 'Train', icon: '✂️' },
  { id: 'observe', label: 'Observe', icon: '👁' },
];

/**
 * renderLogForm(container, options) — Renders the quick log form.
 */
export function renderLogForm(container, options) {
  const { plantId, logType = null, taskRef = null, onSubmit, onCancel, store } = options;

  const form = document.createElement('div');
  form.className = 'log-form';

  let selectedType = logType;

  // Type selector
  const typeBar = document.createElement('div');
  typeBar.className = 'log-type-bar';
  for (const lt of LOG_TYPES) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm' + (selectedType === lt.id ? ' btn-primary' : '');
    btn.textContent = `${lt.icon} ${lt.label}`;
    btn.addEventListener('click', () => {
      selectedType = lt.id;
      _renderDetails(detailArea, selectedType, plantId, store);
      typeBar.querySelectorAll('.btn').forEach(b => b.classList.remove('btn-primary'));
      btn.classList.add('btn-primary');
    });
    typeBar.appendChild(btn);
  }
  form.appendChild(typeBar);

  // Detail area (expandable)
  const detailArea = document.createElement('div');
  detailArea.className = 'log-details';
  if (selectedType) _renderDetails(detailArea, selectedType, plantId, store);
  form.appendChild(detailArea);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'log-form-actions';

  const logBtn = document.createElement('button');
  logBtn.className = 'btn btn-primary';
  logBtn.textContent = 'Log it';
  logBtn.addEventListener('click', () => {
    if (!selectedType) return;
    const entry = _buildEntry(selectedType, detailArea, taskRef);
    if (onSubmit) onSubmit(entry);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => { if (onCancel) onCancel(); });

  actions.appendChild(logBtn);
  actions.appendChild(cancelBtn);
  form.appendChild(actions);

  container.appendChild(form);
}

function _renderDetails(container, type, plantId, store) {
  container.innerHTML = '';
  const expand = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Add details (optional)';
  summary.style.cursor = 'pointer';
  summary.style.color = 'var(--text-muted)';
  summary.style.fontSize = '0.82rem';
  expand.appendChild(summary);

  const fields = document.createElement('div');
  fields.style.marginTop = 'var(--space-2)';

  if (type === 'water' || type === 'feed') {
    fields.appendChild(_inputField('log-ph', 'pH', 'number', '0.1'));
    fields.appendChild(_inputField('log-ec', 'EC', 'number', '0.1'));
    fields.appendChild(_inputField('log-volume', 'Volume (L)', 'number', '0.5'));
  }

  if (type === 'feed') {
    // Same as last time
    const plant = _getPlant(store, plantId);
    const lastFeed = getLastLog(plant, 'feed');
    if (lastFeed && lastFeed.details) {
      const prefill = document.createElement('div');
      prefill.className = 'prefill-banner';
      const date = new Date(lastFeed.date || lastFeed.timestamp).toLocaleDateString();
      prefill.textContent = `Pre-fill from last feed (${date})?`;
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm';
      btn.textContent = 'Same as last time';
      btn.addEventListener('click', () => {
        const phIn = fields.querySelector('#log-ph');
        const ecIn = fields.querySelector('#log-ec');
        const volIn = fields.querySelector('#log-volume');
        if (phIn && lastFeed.details.pH) phIn.value = lastFeed.details.pH;
        if (ecIn && lastFeed.details.ec) ecIn.value = lastFeed.details.ec;
        if (volIn && lastFeed.details.volume) volIn.value = lastFeed.details.volume;
        expand.open = true;
      });
      prefill.appendChild(btn);
      container.appendChild(prefill);
    }

    fields.appendChild(_textareaField('log-nutrients', 'Nutrient notes'));
  }

  if (type === 'train') {
    const actions = ['Topped', 'LST adjusted', 'Defoliated', 'Lollipoped', 'ScrOG tucked', 'Other'];
    fields.appendChild(_selectField('log-action', 'Action', actions));
  }

  if (type === 'observe') {
    const conditions = ['Healthy', 'Concern', 'Pest spotted', 'Deficiency noticed', 'Milestone reached', 'Other'];
    fields.appendChild(_selectField('log-condition', 'Condition', conditions));
  }

  fields.appendChild(_textareaField('log-notes', 'Notes'));
  expand.appendChild(fields);
  container.appendChild(expand);
}

function _buildEntry(type, detailArea, taskRef) {
  const details = {};
  const phEl = detailArea.querySelector('#log-ph');
  const ecEl = detailArea.querySelector('#log-ec');
  const volEl = detailArea.querySelector('#log-volume');
  const notesEl = detailArea.querySelector('#log-notes');
  const actionEl = detailArea.querySelector('#log-action');
  const condEl = detailArea.querySelector('#log-condition');
  const nutrEl = detailArea.querySelector('#log-nutrients');

  if (phEl?.value) details.pH = parseFloat(phEl.value);
  if (ecEl?.value) details.ec = parseFloat(ecEl.value);
  if (volEl?.value) details.volume = parseFloat(volEl.value);
  if (notesEl?.value) details.notes = notesEl.value;
  if (actionEl?.value) details.action = actionEl.value;
  if (condEl?.value) details.condition = condEl.value;
  if (nutrEl?.value) details.nutrients = nutrEl.value;

  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    date: new Date().toISOString(),
    type,
    details,
    taskRef: taskRef || null,
  };
}

/**
 * getLastLog(plant, logType) — Returns the most recent log of the given type.
 */
export function getLastLog(plant, logType) {
  if (!plant || !plant.logs) return null;
  const filtered = plant.logs.filter(l => l.type === logType);
  return filtered.length > 0 ? filtered[filtered.length - 1] : null;
}

function _getPlant(store, plantId) {
  if (!store) return null;
  const grow = store.state.grow;
  if (!grow || !grow.plants) return null;
  return grow.plants.find(p => p.id === plantId) || null;
}

function _inputField(id, label, type, step) {
  const group = document.createElement('div');
  group.className = 'form-field';
  const lbl = document.createElement('label');
  lbl.setAttribute('for', id);
  lbl.textContent = label;
  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.className = 'input';
  input.step = step;
  input.style.maxWidth = '100px';
  group.appendChild(lbl);
  group.appendChild(input);
  return group;
}

function _selectField(id, label, options) {
  const group = document.createElement('div');
  group.className = 'form-field';
  const lbl = document.createElement('label');
  lbl.setAttribute('for', id);
  lbl.textContent = label;
  const select = document.createElement('select');
  select.id = id;
  select.className = 'input';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = 'Select...';
  select.appendChild(empty);
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = opt.toLowerCase().replace(/\s+/g, '-');
    o.textContent = opt;
    select.appendChild(o);
  }
  group.appendChild(lbl);
  group.appendChild(select);
  return group;
}

function _textareaField(id, label) {
  const group = document.createElement('div');
  group.className = 'form-field';
  const lbl = document.createElement('label');
  lbl.setAttribute('for', id);
  lbl.textContent = label;
  const textarea = document.createElement('textarea');
  textarea.id = id;
  textarea.className = 'input';
  textarea.rows = 2;
  group.appendChild(lbl);
  group.appendChild(textarea);
  return group;
}
