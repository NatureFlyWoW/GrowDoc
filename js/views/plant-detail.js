// GrowDoc Companion — Plant Detail View

import { getDaysInStage, STAGES } from '../data/stage-rules.js';
import { TRAINING_METHODS, generateMilestones } from '../data/training-protocols.js';
import { parseProfileText } from '../data/note-contextualizer/index.js';
import { renderTimeline, advancePlantStage } from '../components/timeline-bar.js';
import { POT_SIZES } from '../data/constants.js';
import { daysSinceLog as _daysSince } from '../utils.js';
import { loadPhoto } from '../photos.js';
import { navigate } from '../router.js';
import { mountSeverityChip } from '../components/severity-chip.js';
import { mountParsedSignalStrip } from '../components/parsed-signal-strip.js';
import { mountRecentObservationsWidget } from '../components/recent-observations-widget.js';

/**
 * renderPlantDetail(container, store, plantId) — Single plant detail view.
 */
export function renderPlantDetail(container, store, plantId, initialTab) {
  container.innerHTML = '';
  const grow = store.state.grow;
  if (!grow) return;

  const plant = grow.plants.find(p => p.id === plantId);
  if (!plant) {
    container.innerHTML = '<p class="text-muted">Plant not found.</p>';
    return;
  }

  // Section-05: commit the active plant id BEFORE any Plant Doctor launch
  // button renders so downstream diagnosis runs against the right plant
  // even if the user taps "Diagnose" immediately.
  if (store.state.ui?.activePlantId !== plant.id) {
    store.commit('ui', { ...store.state.ui, activePlantId: plant.id });
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

  // Tabs — check for pre-selected tab (from hash or parameter)
  const tabs = ['Overview', 'Log History', 'Photos', 'Diagnoses', 'Training', 'Edit'];
  const hashTab = initialTab || window.location.hash.replace('#', '');
  let activeTab = hashTab === 'edit' ? 'Edit' : hashTab === 'training' ? 'Training' : hashTab === 'logs' ? 'Log History' : hashTab === 'photos' ? 'Photos' : 'Overview';

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
    else if (name === 'Photos') _renderPhotosTab(tabContent, plant);
    else if (name === 'Diagnoses') _renderDiagnoses(tabContent, plant);
    else if (name === 'Training') _renderTraining(tabContent, plant);
    else if (name === 'Edit') _renderEditTab(tabContent, plant, store, container, plantId);
  }

  container.appendChild(tabBar);
  container.appendChild(tabContent);
  renderTab('Overview');
}

function _saveName(store, plant, newName, container, plantId) {
  const trimmed = newName.trim() || plant.name;
  const growSnap = store.getSnapshot().grow;
  const p = growSnap.plants.find(pp => pp.id === plant.id);
  if (p) { p.name = trimmed; store.commit('grow', growSnap); }
  renderPlantDetail(container, store, plantId);
}

function _renderOverview(container, plant, store) {
  // Diagnose action — top of overview, prominent
  const diagnoseRow = document.createElement('div');
  diagnoseRow.style.marginBottom = 'var(--space-4)';

  const diagnoseBtn = document.createElement('button');
  diagnoseBtn.className = 'btn btn-primary';
  diagnoseBtn.textContent = '🩺 Diagnose this plant';
  diagnoseBtn.style.width = '100%';
  diagnoseBtn.style.padding = '12px';
  diagnoseBtn.addEventListener('click', () => {
    // Section-05: ensure the doctor opens on THIS plant even when the
    // user bounced between plants via quick-actions since the last mount.
    if (store.state.ui?.activePlantId !== plant.id) {
      store.commit('ui', { ...store.state.ui, activePlantId: plant.id });
    }
    const profile = store.state.profile || {};
    const url = buildDiagnoseUrl(plant, profile);
    navigate(url);
  });
  diagnoseRow.appendChild(diagnoseBtn);
  container.appendChild(diagnoseRow);

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

function _renderPhotosTab(container, plant) {
  const photoLogs = (plant.logs || []).filter(l => l.photoId);
  if (photoLogs.length === 0) {
    container.innerHTML = '<p class="text-muted">No photos yet. Tap 📷 Photo on a plant card to capture one.</p>';
    return;
  }

  // Reverse-chronological grid
  photoLogs.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
  grid.style.gap = '12px';
  grid.style.marginTop = '12px';

  for (const log of photoLogs) {
    const dataUrl = loadPhoto(log.photoId);
    const tile = document.createElement('div');
    tile.style.position = 'relative';
    tile.style.cursor = 'pointer';
    tile.style.borderRadius = '6px';
    tile.style.overflow = 'hidden';
    tile.style.background = 'var(--bg-elevated, #fafafa)';
    tile.style.aspectRatio = '1';

    if (dataUrl) {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.loading = 'lazy';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.alt = `${plant.name} photo`;
      tile.appendChild(img);
      tile.addEventListener('click', () => _openLightbox(dataUrl, log, plant));
    } else {
      // Photo was pruned or storage cleared
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '100%';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.fontSize = '0.75rem';
      placeholder.style.color = 'var(--text-muted)';
      placeholder.textContent = 'photo removed';
      tile.appendChild(placeholder);
    }

    const dateLabel = document.createElement('div');
    dateLabel.style.position = 'absolute';
    dateLabel.style.bottom = '0';
    dateLabel.style.left = '0';
    dateLabel.style.right = '0';
    dateLabel.style.background = 'rgba(0,0,0,0.6)';
    dateLabel.style.color = '#fff';
    dateLabel.style.fontSize = '0.7rem';
    dateLabel.style.padding = '2px 6px';
    dateLabel.textContent = new Date(log.timestamp || log.date).toLocaleDateString();
    tile.appendChild(dateLabel);

    grid.appendChild(tile);
  }

  container.appendChild(grid);
}

function _openLightbox(dataUrl, log, plant) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.9)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '10001';
  overlay.style.padding = '16px';
  overlay.addEventListener('click', () => overlay.remove());

  const img = document.createElement('img');
  img.src = dataUrl;
  img.style.maxWidth = '100%';
  img.style.maxHeight = '80vh';
  img.style.objectFit = 'contain';
  overlay.appendChild(img);

  const caption = document.createElement('div');
  caption.style.color = '#fff';
  caption.style.marginTop = '12px';
  caption.style.textAlign = 'center';
  caption.style.fontSize = '0.85rem';
  caption.textContent = `${plant.name} — ${new Date(log.timestamp || log.date).toLocaleString()} · ${plant.stage}`;
  overlay.appendChild(caption);

  document.body.appendChild(overlay);
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

function _renderEditTab(container, plant, store, pageContainer, plantId) {
  const profile = store.state.profile || {};

  // Helper: save a single field and flash confirmation
  function saveField(field, value) {
    const growSnap = store.getSnapshot().grow;
    const p = growSnap.plants.find(pp => pp.id === plant.id);
    if (!p) return;
    p[field] = value;
    store.commit('grow', growSnap);
  }

  function flashSaved(el) {
    el.style.outline = '2px solid var(--accent-green)';
    setTimeout(() => { el.style.outline = ''; }, 600);
  }

  // ── Name ──
  const nameGroup = _editField('Name');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'input';
  nameInput.value = plant.name;
  nameInput.addEventListener('blur', () => {
    const val = nameInput.value.trim() || plant.name;
    saveField('name', val);
    flashSaved(nameInput);
  });
  nameGroup.appendChild(nameInput);
  container.appendChild(nameGroup);

  // ── Strain ──
  const strainGroup = _editField('Strain');
  const strainInput = document.createElement('input');
  strainInput.type = 'text';
  strainInput.className = 'input';
  strainInput.placeholder = 'Strain name or "Unknown"';
  strainInput.value = plant.strainCustom?.name || '';
  strainInput.addEventListener('blur', () => {
    const val = strainInput.value.trim();
    saveField('strainCustom', val ? { name: val } : null);
    flashSaved(strainInput);
  });
  strainGroup.appendChild(strainInput);
  container.appendChild(strainGroup);

  // ── Pot Size ──
  const potGroup = _editField('Pot Size');
  const potSelect = document.createElement('select');
  potSelect.className = 'input';
  for (const size of POT_SIZES) {
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = `${size}L`;
    if (plant.potSize === size) opt.selected = true;
    potSelect.appendChild(opt);
  }
  potSelect.addEventListener('change', () => {
    saveField('potSize', parseInt(potSelect.value, 10));
    flashSaved(potSelect);
  });
  potGroup.appendChild(potSelect);
  container.appendChild(potGroup);

  // ── Stage ──
  const stageGroup = _editField('Growth Stage');
  const stageSelect = document.createElement('select');
  stageSelect.className = 'input';
  for (const s of STAGES) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    if (plant.stage === s.id) opt.selected = true;
    stageSelect.appendChild(opt);
  }

  const daysGroup = document.createElement('div');
  daysGroup.className = 'edit-days-group';
  daysGroup.style.marginTop = 'var(--space-2)';
  const daysLabel = document.createElement('label');
  daysLabel.textContent = 'Days in this stage:';
  daysLabel.style.fontSize = '0.82rem';
  daysLabel.style.color = 'var(--text-muted)';
  const daysInput = document.createElement('input');
  daysInput.type = 'number';
  daysInput.className = 'input';
  daysInput.min = '0';
  daysInput.max = '999';
  daysInput.style.maxWidth = '80px';
  daysInput.value = getDaysInStage(plant);
  daysGroup.appendChild(daysLabel);
  daysGroup.appendChild(daysInput);

  stageSelect.addEventListener('change', () => {
    const newStage = stageSelect.value;
    const days = parseInt(daysInput.value, 10) || 0;
    _applyStageChange(store, plant.id, newStage, days);
    flashSaved(stageSelect);
    // Refresh the page to update header/timeline
    renderPlantDetail(pageContainer, store, plantId);
  });

  daysInput.addEventListener('blur', () => {
    const days = parseInt(daysInput.value, 10) || 0;
    // Recalculate stageStartDate from days
    const growSnap = store.getSnapshot().grow;
    const p = growSnap.plants.find(pp => pp.id === plant.id);
    if (p) {
      p.stageStartDate = new Date(Date.now() - days * 86400000).toISOString();
      store.commit('grow', growSnap);
      flashSaved(daysInput);
    }
  });

  stageGroup.appendChild(stageSelect);
  stageGroup.appendChild(daysGroup);
  container.appendChild(stageGroup);

  // ── Medium Override ──
  const mediumGroup = _editField('Medium');
  const hasMediumOverride = plant.mediumOverride != null;

  const overrideCheck = document.createElement('label');
  overrideCheck.style.display = 'flex';
  overrideCheck.style.alignItems = 'center';
  overrideCheck.style.gap = 'var(--space-2)';
  overrideCheck.style.fontSize = '0.85rem';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = hasMediumOverride;
  overrideCheck.appendChild(checkbox);
  overrideCheck.append(`Uses different medium (profile default: ${profile.medium || 'soil'})`);

  const mediumSelect = document.createElement('select');
  mediumSelect.className = 'input';
  mediumSelect.style.marginTop = 'var(--space-2)';
  mediumSelect.style.display = hasMediumOverride ? '' : 'none';
  for (const m of ['soil', 'coco', 'hydro', 'soilless']) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m.charAt(0).toUpperCase() + m.slice(1);
    if (plant.mediumOverride === m) opt.selected = true;
    mediumSelect.appendChild(opt);
  }

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      mediumSelect.style.display = '';
      saveField('mediumOverride', mediumSelect.value);
    } else {
      mediumSelect.style.display = 'none';
      saveField('mediumOverride', null);
    }
    flashSaved(checkbox);
  });

  mediumSelect.addEventListener('change', () => {
    saveField('mediumOverride', mediumSelect.value);
    flashSaved(mediumSelect);
  });

  mediumGroup.appendChild(overrideCheck);
  mediumGroup.appendChild(mediumSelect);
  container.appendChild(mediumGroup);

  // ── Training Method ──
  const trainGroup = _editField('Training Method');
  const trainSelect = document.createElement('select');
  trainSelect.className = 'input';
  for (const m of TRAINING_METHODS) {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.name} (Difficulty: ${m.difficulty}/3)`;
    if ((plant.training?.method || 'none') === m.id) opt.selected = true;
    trainSelect.appendChild(opt);
  }
  trainSelect.addEventListener('change', () => {
    const growSnap = store.getSnapshot().grow;
    const p = growSnap.plants.find(pp => pp.id === plant.id);
    if (p) {
      p.training = { method: trainSelect.value, milestones: generateMilestones(trainSelect.value) };
      store.commit('grow', growSnap);
      flashSaved(trainSelect);
    }
  });
  trainGroup.appendChild(trainSelect);
  container.appendChild(trainGroup);

  // ── Context Notes ──
  const notesGroup = _editField('Context Notes');
  const notesHint = document.createElement('div');
  notesHint.className = 'text-muted';
  notesHint.style.fontSize = '0.78rem';
  notesHint.textContent = 'e.g., autoflower, sensitive to nitrogen, running in coco with perlite';
  const notesArea = document.createElement('textarea');
  notesArea.className = 'input';
  notesArea.rows = 3;
  notesArea.value = plant.notes || '';

  // Local severity state, persisted to plant.details.severity on blur.
  const notesSeverityState = { severity: (plant.details && plant.details.severity) || null };

  notesGroup.appendChild(notesHint);
  notesGroup.appendChild(notesArea);

  // Note contextualizer scaffolding — chip + placeholder strip.
  // MUST be mounted BEFORE the notes blur listener below so that the
  // chip's autoInferFrom handler fires first on textarea blur and the
  // subsequent store commit captures the freshly-inferred severity.
  const ncHolder = document.createElement('div');
  notesGroup.appendChild(ncHolder);
  mountSeverityChip(ncHolder, {
    target: notesSeverityState,
    targetKey: 'severity',
    initial: notesSeverityState.severity,
    autoInferFrom: notesArea,
  });
  mountParsedSignalStrip(ncHolder, { textarea: notesArea });

  // Section-08: Recent Observations widget mounts above the notes section.
  const recentHolder = document.createElement('div');
  recentHolder.className = 'nc-recent-holder';
  notesGroup.parentNode.insertBefore(recentHolder, notesGroup);
  mountRecentObservationsWidget(recentHolder, plant.id);

  notesArea.addEventListener('blur', () => {
    const raw = notesArea.value;
    const growSnap = store.getSnapshot().grow;
    const p = growSnap.plants.find(pp => pp.id === plant.id);
    if (p) {
      p.notes = raw;
      // `plant` is not a wizard step — parseProfileText returns the default
      // ctx shape (same no-op behavior as the legacy parseProfileNotes call).
      p.context = parseProfileText({ plant: raw });
      if (!p.details) p.details = {};
      p.details.severity = notesSeverityState.severity;
      store.commit('grow', growSnap);
      flashSaved(notesArea);
    }
  });

  container.appendChild(notesGroup);
}

function _editField(label) {
  const group = document.createElement('div');
  group.className = 'edit-field';
  group.style.marginBottom = 'var(--space-4)';
  const lbl = document.createElement('label');
  lbl.className = 'edit-field-label';
  lbl.textContent = label;
  lbl.style.display = 'block';
  lbl.style.marginBottom = 'var(--space-2)';
  lbl.style.fontWeight = '600';
  lbl.style.fontSize = '0.85rem';
  lbl.style.color = 'var(--text-secondary)';
  group.appendChild(lbl);
  return group;
}

function _applyStageChange(store, plantId, newStage, daysInStage) {
  const growSnap = store.getSnapshot().grow;
  const plant = growSnap.plants.find(p => p.id === plantId);
  if (!plant) return;

  const now = new Date().toISOString();
  const oldStage = plant.stage;

  plant.stage = newStage;
  plant.stageStartDate = new Date(Date.now() - daysInStage * 86400000).toISOString();

  if (!growSnap.stageHistory) growSnap.stageHistory = [];
  const lastEntry = growSnap.stageHistory.find(h => h.stage === oldStage && !h.endDate);
  if (lastEntry) lastEntry.endDate = now;
  growSnap.stageHistory.push({ stage: newStage, startDate: plant.stageStartDate, endDate: null });

  store.commit('grow', growSnap);
  store.publish('stage:changed', { plantId, oldStage, newStage });
}

/**
 * Build a Plant Doctor route URL with plant context as query params.
 * Section 06 — exported for unit testing.
 *
 * Omits any params whose values are null/undefined so the URL is clean.
 *
 * @param {Object} plant - Plant record
 * @param {Object} profile - User profile (for medium/lighting fallback)
 * @returns {string} Hash route, e.g. '/tools/doctor?plantId=p1&medium=soil&lighting=led&stage=mid-flower'
 */
export function buildDiagnoseUrl(plant, profile) {
  const params = new URLSearchParams();
  if (plant?.id) params.set('plantId', plant.id);
  const medium = plant?.mediumOverride || profile?.medium;
  if (medium) params.set('medium', medium);
  if (profile?.lighting) params.set('lighting', profile.lighting);
  if (plant?.stage) params.set('stage', plant.stage);
  const qs = params.toString();
  return qs ? `/tools/doctor?${qs}` : '/tools/doctor';
}
