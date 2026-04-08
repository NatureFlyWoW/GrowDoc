// GrowDoc Companion — Plant Detail View

import { getDaysInStage } from '../data/stage-rules.js';
import { renderTimeline } from '../components/timeline-bar.js';
import { escapeHtml } from '../utils.js';
import { navigate } from '../router.js';

/**
 * renderPlantDetail(container, store, plantId) — Single plant detail view.
 */
export function renderPlantDetail(container, store, plantId) {
  container.innerHTML = '';
  const grow = store.state.grow;
  if (!grow) return;

  const plant = grow.plants.find(p => p.id === plantId);
  if (!plant) {
    container.innerHTML = '<p class="text-muted">Plant not found.</p>';
    return;
  }

  // Header
  const header = document.createElement('div');
  header.className = 'plant-detail-header';

  const nameEl = document.createElement('h1');
  nameEl.textContent = plant.name;
  nameEl.style.cursor = 'pointer';
  nameEl.title = 'Click to rename';
  nameEl.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input';
    input.value = plant.name;
    input.style.fontSize = '1.5rem';
    nameEl.replaceWith(input);
    input.focus();
    input.addEventListener('blur', () => _saveName(store, plant, input.value, container, plantId));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') { renderPlantDetail(container, store, plantId); }
    });
  });
  header.appendChild(nameEl);

  const stageBadge = document.createElement('div');
  stageBadge.className = 'stage-badge';
  stageBadge.textContent = `${plant.stage.replace(/-/g, ' ')} — Day ${getDaysInStage(plant)}`;
  header.appendChild(stageBadge);

  if (plant.potSize) {
    const pot = document.createElement('div');
    pot.className = 'text-muted';
    pot.textContent = `${plant.potSize}L pot`;
    header.appendChild(pot);
  }

  container.appendChild(header);

  // Mini timeline
  const timelineSection = document.createElement('div');
  timelineSection.style.margin = 'var(--space-4) 0';
  renderTimeline(timelineSection, {
    currentStage: plant.stage,
    daysInStage: getDaysInStage(plant),
    stageHistory: grow.stageHistory || [],
    mode: 'compact',
  });
  container.appendChild(timelineSection);

  // Tabs
  const tabs = ['Overview', 'Log History', 'Diagnoses', 'Training'];
  let activeTab = 'Overview';

  const tabBar = document.createElement('div');
  tabBar.className = 'tab-bar';
  const tabContent = document.createElement('div');
  tabContent.className = 'tab-content';

  function renderTab(name) {
    activeTab = name;
    tabBar.innerHTML = '';
    for (const t of tabs) {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (t === activeTab ? ' active' : '');
      btn.textContent = t;
      btn.addEventListener('click', () => renderTab(t));
      tabBar.appendChild(btn);
    }
    tabContent.innerHTML = '';
    if (name === 'Overview') _renderOverview(tabContent, plant, store);
    else if (name === 'Log History') _renderLogHistory(tabContent, plant);
    else if (name === 'Diagnoses') _renderDiagnoses(tabContent, plant);
    else if (name === 'Training') _renderTraining(tabContent, plant);
  }

  container.appendChild(tabBar);
  container.appendChild(tabContent);
  renderTab('Overview');
}

function _saveName(store, plant, newName, container, plantId) {
  const sanitized = escapeHtml(newName.trim()) || plant.name;
  const growSnap = store.getSnapshot().grow;
  const p = growSnap.plants.find(pp => pp.id === plant.id);
  if (p) { p.name = sanitized; store.commit('grow', growSnap); }
  renderPlantDetail(container, store, plantId);
}

function _renderOverview(container, plant, store) {
  const stats = document.createElement('div');
  stats.className = 'plant-stats';

  const logs = plant.logs || [];
  const lastWater = _daysSince(logs, 'water');
  const lastFeed = _daysSince(logs, 'feed');

  stats.innerHTML = `
    <div>Days in stage: ${getDaysInStage(plant)}</div>
    <div>Last water: ${lastWater !== null ? lastWater + ' days ago' : 'Never'}</div>
    <div>Last feed: ${lastFeed !== null ? lastFeed + ' days ago' : 'Never'}</div>
  `;
  container.appendChild(stats);

  // Active tasks for this plant
  const tasks = (store.state.grow.tasks || []).filter(t => t.plantId === plant.id && t.status === 'pending');
  if (tasks.length > 0) {
    const taskSection = document.createElement('div');
    taskSection.style.marginTop = 'var(--space-4)';
    const h4 = document.createElement('h4');
    h4.textContent = 'Active Tasks';
    taskSection.appendChild(h4);
    for (const t of tasks) {
      const item = document.createElement('div');
      item.className = 'text-muted';
      item.textContent = `• ${t.title}`;
      taskSection.appendChild(item);
    }
    container.appendChild(taskSection);
  }
}

function _renderLogHistory(container, plant) {
  const logs = [...(plant.logs || [])].reverse();
  if (logs.length === 0) {
    container.innerHTML = '<p class="text-muted">No logs yet. Use quick actions to start logging.</p>';
    return;
  }

  // Filter buttons
  const filterBar = document.createElement('div');
  filterBar.style.display = 'flex';
  filterBar.style.gap = 'var(--space-2)';
  filterBar.style.marginBottom = 'var(--space-3)';

  let filter = null;
  function renderLogs() {
    const list = container.querySelector('.log-list');
    if (list) list.remove();
    const logList = document.createElement('div');
    logList.className = 'log-list';
    const filtered = filter ? logs.filter(l => l.type === filter) : logs;
    for (const log of filtered.slice(0, 50)) {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      const date = new Date(log.date || log.timestamp).toLocaleDateString();
      let text = `${date} — ${log.type}`;
      if (log.details) {
        if (log.details.pH) text += ` | pH ${log.details.pH}`;
        if (log.details.ec) text += ` | EC ${log.details.ec}`;
        if (log.details.notes) text += ` | ${log.details.notes}`;
      }
      entry.textContent = text;
      logList.appendChild(entry);
    }
    container.appendChild(logList);
  }

  for (const type of [null, 'water', 'feed', 'train', 'observe']) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm' + (filter === type ? ' btn-primary' : '');
    btn.textContent = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All';
    btn.addEventListener('click', () => { filter = type; renderLogs(); });
    filterBar.appendChild(btn);
  }

  container.appendChild(filterBar);
  renderLogs();
}

function _renderDiagnoses(container, plant) {
  const diagnoses = plant.diagnoses || [];
  if (diagnoses.length === 0) {
    container.innerHTML = '<p class="text-muted">No diagnoses yet.</p>';
    return;
  }
  for (const dx of diagnoses) {
    const entry = document.createElement('div');
    entry.className = 'diagnosis-entry';
    entry.textContent = `${dx.name || 'Diagnosis'} — ${dx.outcome || 'pending'} (${new Date(dx.date).toLocaleDateString()})`;
    container.appendChild(entry);
  }
}

function _renderTraining(container, plant) {
  const training = plant.training || {};
  const method = training.method || 'none';
  const info = document.createElement('div');
  info.textContent = `Training method: ${method}`;
  container.appendChild(info);

  const milestones = training.milestones || [];
  if (milestones.length > 0) {
    const list = document.createElement('div');
    list.style.marginTop = 'var(--space-3)';
    for (const m of milestones) {
      const item = document.createElement('div');
      item.textContent = `${m.completed ? '✓' : '○'} ${m.name}`;
      list.appendChild(item);
    }
    container.appendChild(list);
  }
}

function _daysSince(logs, type) {
  const filtered = logs.filter(l => l.type === type);
  if (filtered.length === 0) return null;
  const last = filtered[filtered.length - 1];
  return Math.floor((Date.now() - new Date(last.date || last.timestamp)) / 86400000);
}
