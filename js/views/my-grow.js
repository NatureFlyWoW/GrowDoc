// GrowDoc Companion — My Grow Hub & Plant List

import { getDaysInStage } from '../data/stage-rules.js';
import { escapeHtml, generateId } from '../utils.js';
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

  header.appendChild(name);
  header.appendChild(stageBadge);
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

  const form = document.createElement('div');
  form.className = 'add-plant-form';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'input';
  nameInput.placeholder = 'Plant name';

  const potSelect = document.createElement('select');
  potSelect.className = 'input';
  for (const size of [1, 3, 5, 7, 10, 15, 20]) {
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = `${size}L`;
    potSelect.appendChild(opt);
  }
  potSelect.value = '5';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary btn-sm';
  saveBtn.textContent = 'Add';
  saveBtn.addEventListener('click', () => {
    const plantName = escapeHtml(nameInput.value.trim()) || `Plant ${(store.state.grow.plants || []).length + 1}`;
    const growSnap = store.getSnapshot().grow;
    growSnap.plants.push({
      id: generateId(),
      name: plantName,
      strainId: null,
      strainCustom: null,
      potSize: parseInt(potSelect.value, 10),
      stage: growSnap.currentStage || 'early-veg',
      stageStartDate: new Date().toISOString(),
      logs: [],
      diagnoses: [],
      training: { method: 'none', milestones: [] },
    });
    store.commit('grow', growSnap);
    renderMyGrow(container, store);
  });

  form.appendChild(nameInput);
  form.appendChild(potSelect);
  form.appendChild(saveBtn);
  container.appendChild(form);
}

function _quickLog(store, plantId, type) {
  const growSnap = store.getSnapshot().grow;
  const plant = growSnap.plants.find(p => p.id === plantId);
  if (!plant) return;
  if (!plant.logs) plant.logs = [];
  plant.logs.push({
    id: generateId(),
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    type,
    details: {},
  });
  store.commit('grow', growSnap);
}

export function daysSince(plant, logType) {
  return _daysSince(plant, logType);
}

function _daysSince(plant, type) {
  const logs = (plant.logs || []).filter(l => l.type === type);
  if (logs.length === 0) return null;
  const last = logs[logs.length - 1];
  return Math.floor((Date.now() - new Date(last.date || last.timestamp)) / 86400000);
}

function _urgencyClass(days, threshold) {
  if (days === null) return 'text-muted';
  if (days >= threshold * 2) return 'text-urgent';
  if (days >= threshold) return 'text-warning';
  return '';
}
