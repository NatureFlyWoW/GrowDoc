// GrowDoc Companion — My Grow Hub & Plant List

import { getDaysInStage, STAGES } from '../data/stage-rules.js';
import { TRAINING_METHODS, generateMilestones } from '../data/training-protocols.js';
import { POT_SIZES } from '../data/constants.js';
import { generateId, daysSinceLog as _daysSince } from '../utils.js';
import { navigate } from '../router.js';

/**
 * renderMyGrow(container, store) — My Grow hub view with plant cards.
 */
export function renderMyGrow(container, store) {
  container.innerHTML = '';
  const grow = store.state.grow;
  if (!grow || !grow.active) {
    container.innerHTML = '<p class="text-muted">No active grow. Start one from the dashboard.</p>';
    return;
  }

  const h1 = document.createElement('h1');
  h1.textContent = 'My Grow';
  container.appendChild(h1);

  const plants = grow.plants || [];

  for (const plant of plants) {
    const card = _renderPlantCard(plant, store);
    container.appendChild(card);
  }

  // Add plant button
  if (plants.length < 20) {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn';
    addBtn.textContent = '+ Add Plant';
    addBtn.style.marginTop = 'var(--space-4)';
    addBtn.addEventListener('click', () => _showAddPlantForm(container, store));
    container.appendChild(addBtn);
  } else {
    const limit = document.createElement('p');
    limit.className = 'text-muted';
    limit.textContent = 'Maximum 20 plants reached.';
    container.appendChild(limit);
  }
}

function _renderPlantCard(plant, store) {
  const card = document.createElement('div');
  card.className = 'plant-card';

  const header = document.createElement('div');
  header.className = 'plant-card-header';
  header.style.cursor = 'pointer';
  header.addEventListener('click', () => navigate(`/grow/plant/${plant.id}`));

  const name = document.createElement('span');
  name.className = 'plant-name';
  name.textContent = plant.name;

  const stageBadge = document.createElement('span');
  stageBadge.className = 'stage-badge';
  stageBadge.textContent = `${plant.stage.replace(/-/g, ' ')} — Day ${getDaysInStage(plant)}`;

  const editIcon = document.createElement('button');
  editIcon.className = 'btn btn-sm plant-edit-icon';
  editIcon.textContent = '✎';
  editIcon.title = 'Edit plant';
  editIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    navigate(`/grow/plant/${plant.id}#edit`);
  });

  header.appendChild(name);
  header.appendChild(stageBadge);
  header.appendChild(editIcon);
  card.appendChild(header);

  // Days-since counters
  const counters = document.createElement('div');
  counters.className = 'plant-counters';
  const waterDays = _daysSince(plant, 'water');
  const feedDays = _daysSince(plant, 'feed');
  counters.innerHTML = `<span class="${_urgencyClass(waterDays, 3)}">Water: ${waterDays !== null ? waterDays + 'd' : '-'}</span> ` +
    `<span class="${_urgencyClass(feedDays, 5)}">Feed: ${feedDays !== null ? feedDays + 'd' : '-'}</span>`;
  card.appendChild(counters);

  // Quick action buttons
  const actions = document.createElement('div');
  actions.className = 'plant-actions';
  for (const type of ['water', 'feed', 'train', 'observe']) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm';
    btn.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      _quickLog(store, plant.id, type);
      renderMyGrow(card.closest('#content') || card.parentElement, store);
    });
    actions.appendChild(btn);
  }
  card.appendChild(actions);

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn btn-sm';
  removeBtn.style.color = 'var(--status-urgent)';
  removeBtn.style.fontSize = '0.75rem';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`Remove ${plant.name}? This will delete all logs and history for this plant.`)) {
      const growSnap = store.getSnapshot().grow;
      growSnap.plants = growSnap.plants.filter(p => p.id !== plant.id);
      store.commit('grow', growSnap);
      renderMyGrow(card.closest('#content') || card.parentElement, store);
    }
  });
  card.appendChild(removeBtn);

  return card;
}

function _showAddPlantForm(container, store) {
  const existing = container.querySelector('.add-plant-form');
  if (existing) { existing.remove(); return; }

  const profile = store.state.profile || {};
  const form = document.createElement('div');
  form.className = 'add-plant-form';

  const title = document.createElement('h3');
  title.textContent = 'Add Plant';
  title.style.marginBottom = 'var(--space-3)';
  form.appendChild(title);

  // Name
  const nameInput = _addFormField(form, 'Name', 'text', 'Plant name');

  // Stage selector
  const stageSelect = document.createElement('select');
  stageSelect.className = 'input';
  for (const s of STAGES) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    if (s.id === (store.state.grow?.currentStage || 'early-veg')) opt.selected = true;
    stageSelect.appendChild(opt);
  }
  const stageGroup = document.createElement('div');
  stageGroup.className = 'add-form-field';
  const stageLabel = document.createElement('label');
  stageLabel.textContent = 'Stage';
  stageLabel.style.fontSize = '0.82rem';
  stageLabel.style.color = 'var(--text-muted)';
  stageGroup.appendChild(stageLabel);
  stageGroup.appendChild(stageSelect);
  form.appendChild(stageGroup);

  // Days in stage
  const daysInput = _addFormField(form, 'Days in stage', 'number', '0');
  daysInput.value = '0';
  daysInput.min = '0';
  daysInput.style.maxWidth = '80px';

  // Pot size
  const potSelect = document.createElement('select');
  potSelect.className = 'input';
  for (const size of POT_SIZES) {
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = `${size}L`;
    potSelect.appendChild(opt);
  }
  potSelect.value = '5';
  const potGroup = document.createElement('div');
  potGroup.className = 'add-form-field';
  const potLabel = document.createElement('label');
  potLabel.textContent = 'Pot size';
  potLabel.style.fontSize = '0.82rem';
  potLabel.style.color = 'var(--text-muted)';
  potGroup.appendChild(potLabel);
  potGroup.appendChild(potSelect);
  form.appendChild(potGroup);

  // Strain
  const strainInput = _addFormField(form, 'Strain (optional)', 'text', 'e.g., Northern Lights');

  // Training method
  const trainSelect = document.createElement('select');
  trainSelect.className = 'input';
  for (const m of TRAINING_METHODS) {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    trainSelect.appendChild(opt);
  }
  const trainGroup = document.createElement('div');
  trainGroup.className = 'add-form-field';
  const trainLabel = document.createElement('label');
  trainLabel.textContent = 'Training';
  trainLabel.style.fontSize = '0.82rem';
  trainLabel.style.color = 'var(--text-muted)';
  trainGroup.appendChild(trainLabel);
  trainGroup.appendChild(trainSelect);
  form.appendChild(trainGroup);

  // Context notes
  const notesArea = document.createElement('textarea');
  notesArea.className = 'input';
  notesArea.rows = 2;
  notesArea.placeholder = 'e.g., autoflower, clone, sensitive to N';
  const notesGroup = document.createElement('div');
  notesGroup.className = 'add-form-field';
  const notesLabel = document.createElement('label');
  notesLabel.textContent = 'Context notes (optional)';
  notesLabel.style.fontSize = '0.82rem';
  notesLabel.style.color = 'var(--text-muted)';
  notesGroup.appendChild(notesLabel);
  notesGroup.appendChild(notesArea);
  form.appendChild(notesGroup);

  // Add button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Add Plant';
  saveBtn.style.marginTop = 'var(--space-3)';
  saveBtn.addEventListener('click', () => {
    const plantName = nameInput.value.trim() || `Plant ${(store.state.grow.plants || []).length + 1}`;
    const days = parseInt(daysInput.value, 10) || 0;
    const strainName = strainInput.value.trim();
    const notes = notesArea.value;

    const growSnap = store.getSnapshot().grow;
    growSnap.plants.push({
      id: generateId(),
      name: plantName,
      strainId: null,
      strainCustom: strainName ? { name: strainName } : null,
      potSize: parseInt(potSelect.value, 10),
      stage: stageSelect.value,
      stageStartDate: new Date(Date.now() - days * 86400000).toISOString(),
      logs: [],
      diagnoses: [],
      training: { method: trainSelect.value, milestones: generateMilestones(trainSelect.value) },
      mediumOverride: null,
      notes: notes || '',
      context: {},
    });
    store.commit('grow', growSnap);
    renderMyGrow(container, store);
  });
  form.appendChild(saveBtn);

  container.appendChild(form);
}

function _addFormField(container, label, type, placeholder) {
  const group = document.createElement('div');
  group.className = 'add-form-field';
  const lbl = document.createElement('label');
  lbl.textContent = label;
  lbl.style.fontSize = '0.82rem';
  lbl.style.color = 'var(--text-muted)';
  const input = document.createElement('input');
  input.type = type;
  input.className = 'input';
  input.placeholder = placeholder;
  group.appendChild(lbl);
  group.appendChild(input);
  container.appendChild(group);
  return input;
}

function _quickLog(store, plantId, type) {
  const growSnap = store.getSnapshot().grow;
  const plant = growSnap.plants.find(p => p.id === plantId);
  if (!plant) return;
  if (!plant.logs) plant.logs = [];

  const logId = generateId();
  const logEntry = {
    id: logId,
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    type,
    details: {},
    photoId: null, // Section 08 forward-compat
  };
  plant.logs.push(logEntry);

  // Auto-complete the SINGLE oldest pending task of the same type for
  // this plant. Other pending tasks of the same type remain.
  let autoCompletedTaskId = null;
  if (Array.isArray(growSnap.tasks)) {
    const matching = growSnap.tasks.filter(t =>
      t.plantId === plantId && t.type === type && t.status === 'pending'
    );
    matching.sort((a, b) => new Date(a.generatedDate || 0) - new Date(b.generatedDate || 0));
    if (matching.length > 0) {
      const target = matching[0];
      target.status = 'done';
      target.completedDate = new Date().toISOString();
      target.stageAtCompletion = plant.stage;
      autoCompletedTaskId = target.id;
    }
  }

  store.commit('grow', growSnap);

  // 5-second undo toast — slide in, auto-dismiss
  _showUndoToast(`${type.charAt(0).toUpperCase() + type.slice(1)} logged for ${plant.name}`, () => {
    // Undo: remove the log entry and revert the auto-completed task
    const undoSnap = store.getSnapshot().grow;
    const undoPlant = undoSnap.plants.find(p => p.id === plantId);
    if (undoPlant && undoPlant.logs) {
      undoPlant.logs = undoPlant.logs.filter(l => l.id !== logId);
    }
    if (autoCompletedTaskId && Array.isArray(undoSnap.tasks)) {
      const restored = undoSnap.tasks.find(t => t.id === autoCompletedTaskId);
      if (restored) {
        restored.status = 'pending';
        restored.completedDate = null;
        delete restored.stageAtCompletion;
      }
    }
    store.commit('grow', undoSnap);
    // Re-render My Grow if currently mounted
    const content = document.getElementById('content');
    if (content) renderMyGrow(content, store);
  });
}

/**
 * Slide-in toast at the bottom of the viewport with a 5-second undo button.
 * If the user does nothing, the toast auto-dismisses and the action is final.
 * If the user taps Undo, the supplied callback runs.
 */
function _showUndoToast(message, onUndo) {
  // Remove any existing toast first
  const existing = document.getElementById('quick-log-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'quick-log-toast';
  toast.setAttribute('role', 'status');
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = 'var(--bg-elevated, #2d3748)';
  toast.style.color = 'var(--text-on-elevated, #fff)';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '16px';
  toast.style.zIndex = '9999';
  toast.style.maxWidth = 'calc(100vw - 32px)';

  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(text);

  const undoBtn = document.createElement('button');
  undoBtn.textContent = 'Undo';
  undoBtn.style.background = 'transparent';
  undoBtn.style.border = '1px solid currentColor';
  undoBtn.style.color = 'inherit';
  undoBtn.style.padding = '4px 12px';
  undoBtn.style.borderRadius = '4px';
  undoBtn.style.cursor = 'pointer';
  undoBtn.style.fontSize = '0.85rem';
  toast.appendChild(undoBtn);

  document.body.appendChild(toast);

  let undone = false;
  const timer = setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 5000);

  undoBtn.addEventListener('click', () => {
    if (undone) return;
    undone = true;
    clearTimeout(timer);
    if (toast.parentNode) toast.parentNode.removeChild(toast);
    if (typeof onUndo === 'function') onUndo();
  });
}

export function daysSince(plant, logType) {
  return _daysSince(plant, logType);
}

function _urgencyClass(days, threshold) {
  if (days === null) return 'text-muted';
  if (days >= threshold * 2) return 'text-urgent';
  if (days >= threshold) return 'text-warning';
  return '';
}
