// GrowDoc Companion — Stage Timeline Bar & Dry/Cure Views

import { STAGES, STAGE_TRANSITIONS, getDaysInStage, getStageById, getStageIndex, getCureBurpSchedule, DRYING_TARGETS, CURING_TARGETS, SMELL_OPTIONS_DRYING, SMELL_OPTIONS_CURING } from '../data/stage-rules.js';

/**
 * renderTimeline(container, options) — Renders a horizontal progress bar timeline.
 *   options.currentStage  — Current stage ID
 *   options.daysInStage   — Days elapsed in current stage
 *   options.stageHistory  — Array of {stage, startDate, endDate}
 *   options.mode          — 'compact' | 'full' (default: 'compact')
 *   options.onStageClick(stageId) — Callback when stage is clicked (full mode)
 *   options.onAdvance(nextStage)  — Callback to advance stage
 */
export function renderTimeline(container, options) {
  const { currentStage, daysInStage = 0, stageHistory = [], mode = 'compact', onStageClick, onAdvance } = options;

  const currentIdx = getStageIndex(currentStage);
  const totalTypical = STAGES.reduce((sum, s) => sum + s.typicalDays, 0);

  const wrapper = document.createElement('div');
  wrapper.className = `timeline timeline-${mode}`;

  // Header: current stage name + day count
  if (mode === 'compact') {
    const header = document.createElement('div');
    header.className = 'timeline-header';
    const stageDef = getStageById(currentStage);
    header.textContent = `${stageDef ? stageDef.name : currentStage} — Day ${daysInStage}`;
    wrapper.appendChild(header);
  }

  // Bar container
  const bar = document.createElement('div');
  bar.className = 'timeline-bar';

  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const widthPct = (stage.typicalDays / totalTypical) * 100;

    const segment = document.createElement('div');
    segment.className = 'timeline-segment';
    segment.style.width = `${widthPct}%`;
    segment.dataset.stage = stage.id;

    if (i < currentIdx) {
      segment.classList.add('completed');
    } else if (i === currentIdx) {
      segment.classList.add('current');
      // Position marker within current stage
      const progress = Math.min(daysInStage / stage.typicalDays, 1);
      const marker = document.createElement('div');
      marker.className = 'timeline-marker';
      marker.style.left = `${progress * 100}%`;
      segment.appendChild(marker);
    } else {
      segment.classList.add('future');
    }

    // Milestone markers
    for (const m of stage.milestones) {
      const mPos = m.triggerDay / stage.typicalDays;
      const mEl = document.createElement('div');
      mEl.className = 'timeline-milestone';
      mEl.style.left = `${mPos * 100}%`;
      mEl.title = m.name;
      mEl.textContent = _milestoneIcon(m.icon);
      segment.appendChild(mEl);
    }

    // Label (full mode only)
    if (mode === 'full') {
      const label = document.createElement('div');
      label.className = 'timeline-label';
      label.textContent = stage.name;
      segment.appendChild(label);

      segment.style.cursor = 'pointer';
      segment.addEventListener('click', () => {
        if (onStageClick) onStageClick(stage.id);
      });
    }

    bar.appendChild(segment);
  }

  wrapper.appendChild(bar);

  // Auto-advance prompt (if applicable)
  if (currentIdx >= 0) {
    const transition = STAGE_TRANSITIONS[currentStage];
    if (transition && daysInStage >= transition.triggerDays) {
      const prompt = document.createElement('div');
      prompt.className = 'timeline-advance-prompt';

      const msg = document.createElement('span');
      msg.textContent = transition.confirmMessage;
      prompt.appendChild(msg);

      // Decision notes field
      const notesRow = document.createElement('div');
      notesRow.className = 'decision-notes';
      const notesToggle = document.createElement('button');
      notesToggle.className = 'decision-notes-toggle';
      notesToggle.textContent = '+ Add context';
      const notesInput = document.createElement('textarea');
      notesInput.className = 'input decision-notes-input';
      notesInput.rows = 2;
      notesInput.placeholder = 'e.g., just transplanted, plant looks stressed, want to wait for recovery...';
      notesInput.style.display = 'none';
      notesToggle.addEventListener('click', () => {
        notesInput.style.display = notesInput.style.display === 'none' ? '' : 'none';
        if (notesInput.style.display !== 'none') notesInput.focus();
      });
      notesRow.appendChild(notesToggle);
      notesRow.appendChild(notesInput);
      prompt.appendChild(notesRow);

      const btnRow = document.createElement('div');
      btnRow.className = 'decision-btn-row';

      const yesBtn = document.createElement('button');
      yesBtn.className = 'btn btn-primary btn-sm';
      yesBtn.textContent = 'Yes, advance';
      yesBtn.addEventListener('click', () => {
        // Save the decision note as a log entry
        const note = notesInput.value.trim();
        if (note && options.plantId) {
          _logDecisionNote(options.plantId, 'stage-advance', `Advanced to ${transition.next}`, note, options._store);
        }
        if (onAdvance) onAdvance(transition.next);
        prompt.remove();
      });

      const noBtn = document.createElement('button');
      noBtn.className = 'btn btn-sm';
      noBtn.textContent = 'Not yet';
      noBtn.addEventListener('click', () => {
        const note = notesInput.value.trim();
        if (note && options.plantId) {
          _logDecisionNote(options.plantId, 'stage-decline', `Declined advance to ${transition.next}`, note, options._store);
        }
        prompt.remove();
      });

      btnRow.appendChild(yesBtn);
      btnRow.appendChild(noBtn);
      prompt.appendChild(btnRow);
      wrapper.appendChild(prompt);
    }
  }

  container.appendChild(wrapper);

  return { element: wrapper };
}

/**
 * renderStageDetail(container, stageId, options) — Detail panel for a specific stage.
 */
export function renderStageDetail(container, stageId, options = {}) {
  const stage = getStageById(stageId);
  if (!stage) return;

  const panel = document.createElement('div');
  panel.className = 'stage-detail-panel';

  const title = document.createElement('h3');
  title.textContent = stage.name;
  panel.appendChild(title);

  const info = document.createElement('div');
  info.className = 'stage-detail-info';
  info.innerHTML = `<div>Typical: ${stage.typicalDays} days (${stage.minDays}-${stage.maxDays})</div>`;
  panel.appendChild(info);

  // Milestones
  if (stage.milestones.length > 0) {
    const mList = document.createElement('div');
    mList.className = 'stage-milestones';
    const mTitle = document.createElement('div');
    mTitle.className = 'stage-detail-subtitle';
    mTitle.textContent = 'Milestones';
    mList.appendChild(mTitle);
    for (const m of stage.milestones) {
      const item = document.createElement('div');
      item.className = 'stage-milestone-item';
      item.textContent = `Day ${m.triggerDay}: ${m.name}`;
      mList.appendChild(item);
    }
    panel.appendChild(mList);
  }

  // Move to stage button (if this is the next stage)
  if (options.currentStage && options.onAdvance) {
    const transition = STAGE_TRANSITIONS[options.currentStage];
    if (transition && transition.next === stageId) {
      const advBtn = document.createElement('button');
      advBtn.className = 'btn btn-primary';
      advBtn.style.marginTop = 'var(--space-4)';
      advBtn.textContent = `Move to ${stage.name}`;
      advBtn.addEventListener('click', () => options.onAdvance(stageId));
      panel.appendChild(advBtn);
    }
  }

  container.appendChild(panel);
}

/**
 * advancePlantStage(store, plantId, nextStageId) — Advance a plant to a new stage.
 * Updates store and emits stage:changed event.
 */
export function advancePlantStage(store, plantId, nextStageId) {
  const grow = store.getSnapshot().grow;
  if (!grow || !grow.plants) return;

  const plant = grow.plants.find(p => p.id === plantId);
  if (!plant) return;

  const now = new Date().toISOString();
  const oldStage = plant.stage;

  // Update plant
  plant.stage = nextStageId;
  plant.stageStartDate = now;

  // Update stage history
  if (!grow.stageHistory) grow.stageHistory = [];
  // End the previous stage entry
  const lastEntry = grow.stageHistory.find(h => h.stage === oldStage && !h.endDate);
  if (lastEntry) lastEntry.endDate = now;
  // Add new stage entry
  grow.stageHistory.push({ stage: nextStageId, startDate: now, endDate: null });

  store.commit('grow', grow);
  store.publish('stage:changed', { plantId, oldStage, newStage: nextStageId });
}

/**
 * renderDryCureView(container, store) — Dry/cure tracking view.
 */
export function renderDryCureView(container, store) {
  container.innerHTML = '';
  const grow = store.state.grow;
  if (!grow || !grow.plants) {
    container.textContent = 'No active grow.';
    return;
  }

  const dryCurePlants = grow.plants.filter(p => p.stage === 'drying' || p.stage === 'curing');
  if (dryCurePlants.length === 0) {
    container.innerHTML = '<p class="text-muted">No plants currently in drying or curing stage.</p>';
    return;
  }

  for (const plant of dryCurePlants) {
    const section = document.createElement('div');
    section.className = 'dry-cure-plant';

    const h3 = document.createElement('h3');
    h3.textContent = `${plant.name} — ${plant.stage === 'drying' ? 'Drying' : 'Curing'}`;
    section.appendChild(h3);

    const days = getDaysInStage(plant);
    const dayInfo = document.createElement('div');
    dayInfo.className = 'text-muted';
    dayInfo.textContent = `Day ${days}`;
    section.appendChild(dayInfo);

    if (plant.stage === 'drying') {
      _renderDryingForm(section, store, plant);
    } else {
      _renderCuringForm(section, store, plant);
    }

    // Log history
    _renderLogHistory(section, plant);

    container.appendChild(section);
  }
}

function _renderDryingForm(container, store, plant) {
  const form = document.createElement('div');
  form.className = 'dry-cure-form';

  // Target conditions
  const targets = document.createElement('div');
  targets.className = 'dry-cure-targets';
  targets.innerHTML = `<strong>Target:</strong> ${DRYING_TARGETS.temp.min}-${DRYING_TARGETS.temp.max}°C, ${DRYING_TARGETS.rh.min}-${DRYING_TARGETS.rh.max}% RH`;
  form.appendChild(targets);

  // Form fields (IDs scoped by plant)
  const pid = plant.id;
  const fields = [
    { id: `dry-temp-${pid}`, label: 'Temperature (°C)', type: 'number', placeholder: '18' },
    { id: `dry-rh-${pid}`, label: 'Humidity (%)', type: 'number', placeholder: '60' },
  ];

  for (const f of fields) {
    const group = _formField(f.id, f.label, f.type, f.placeholder);
    form.appendChild(group);
  }

  // Smell dropdown
  const smellGroup = _selectField(`dry-smell-${pid}`, 'Smell Assessment', SMELL_OPTIONS_DRYING);
  form.appendChild(smellGroup);

  // Snap test
  const snapGroup = document.createElement('div');
  snapGroup.className = 'form-field';
  const snapLabel = document.createElement('label');
  const snapCheck = document.createElement('input');
  snapCheck.type = 'checkbox';
  snapCheck.id = `dry-snap-${pid}`;
  snapLabel.appendChild(snapCheck);
  snapLabel.append(' Stems snap cleanly');
  snapGroup.appendChild(snapLabel);
  form.appendChild(snapGroup);

  // Log button
  const logBtn = document.createElement('button');
  logBtn.className = 'btn btn-primary';
  logBtn.textContent = 'Log Drying Entry';
  logBtn.addEventListener('click', () => {
    const entry = {
      date: new Date().toISOString(),
      type: 'drying',
      temp: parseFloat(document.getElementById(`dry-temp-${pid}`)?.value) || null,
      rh: parseFloat(document.getElementById(`dry-rh-${pid}`)?.value) || null,
      smell: document.getElementById(`dry-smell-${pid}`)?.value || null,
      snapTest: document.getElementById(`dry-snap-${pid}`)?.checked || false,
    };
    _addLog(store, plant.id, entry);
    renderDryCureView(container.closest('#content') || container.parentElement, store);
  });
  form.appendChild(logBtn);

  container.appendChild(form);
}

function _renderCuringForm(container, store, plant) {
  const form = document.createElement('div');
  form.className = 'dry-cure-form';
  const pid = plant.id;

  const days = getDaysInStage(plant);
  const burpSchedule = getCureBurpSchedule(days);

  // Target + burp info
  const targets = document.createElement('div');
  targets.className = 'dry-cure-targets';
  targets.innerHTML = `<strong>Target jar RH:</strong> ${CURING_TARGETS.jarRH.min}-${CURING_TARGETS.jarRH.max}%<br>` +
    `<strong>Burp schedule:</strong> ${burpSchedule.label}`;
  form.appendChild(targets);

  // Form fields (IDs scoped by plant)
  const rhGroup = _formField(`cure-rh-${pid}`, 'Jar RH (%)', 'number', '60');
  form.appendChild(rhGroup);

  const smellGroup = _selectField(`cure-smell-${pid}`, 'Smell Assessment', SMELL_OPTIONS_CURING);
  form.appendChild(smellGroup);

  const burpGroup = _formField(`cure-burps-${pid}`, 'Burps today', 'number', String(burpSchedule.perDay >= 1 ? Math.round(burpSchedule.perDay) : 1));
  form.appendChild(burpGroup);

  // Cure completion prompt (min 2 weeks)
  if (days >= CURING_TARGETS.minWeeks * 7) {
    const completionPrompt = document.createElement('div');
    completionPrompt.className = 'timeline-advance-prompt';
    completionPrompt.style.marginTop = 'var(--space-3)';
    const msg = document.createElement('span');
    msg.textContent = `${plant.name} has been curing for ${days} days. Finish curing?`;
    completionPrompt.appendChild(msg);

    // Decision notes for cure completion
    const cureNotesRow = document.createElement('div');
    cureNotesRow.className = 'decision-notes';
    const cureNotesToggle = document.createElement('button');
    cureNotesToggle.className = 'decision-notes-toggle';
    cureNotesToggle.textContent = '+ Add notes';
    const cureNotesInput = document.createElement('textarea');
    cureNotesInput.className = 'input decision-notes-input';
    cureNotesInput.rows = 2;
    cureNotesInput.placeholder = 'e.g., smells amazing, smooth test burn, jar RH stable at 62%...';
    cureNotesInput.style.display = 'none';
    cureNotesToggle.addEventListener('click', () => {
      cureNotesInput.style.display = cureNotesInput.style.display === 'none' ? '' : 'none';
      if (cureNotesInput.style.display !== 'none') cureNotesInput.focus();
    });
    cureNotesRow.appendChild(cureNotesToggle);
    cureNotesRow.appendChild(cureNotesInput);
    completionPrompt.appendChild(cureNotesRow);

    const finishBtn = document.createElement('button');
    finishBtn.className = 'btn btn-primary btn-sm';
    finishBtn.textContent = 'Finish Curing';
    finishBtn.addEventListener('click', () => {
      const note = cureNotesInput.value.trim();
      if (note) _logDecisionNote(plant.id, 'cure-complete', `Finished curing after ${days} days`, note, store);
      advancePlantStage(store, plant.id, 'done');
      renderDryCureView(container.closest('#content') || container.parentElement, store);
    });
    completionPrompt.appendChild(finishBtn);
    form.appendChild(completionPrompt);
  }

  // Log button
  const logBtn = document.createElement('button');
  logBtn.className = 'btn btn-primary';
  logBtn.textContent = 'Log Curing Entry';
  logBtn.addEventListener('click', () => {
    const jarRH = parseFloat(document.getElementById(`cure-rh-${pid}`)?.value) || null;
    const entry = {
      date: new Date().toISOString(),
      type: 'curing',
      jarRH,
      smell: document.getElementById(`cure-smell-${pid}`)?.value || null,
      burpCount: parseInt(document.getElementById(`cure-burps-${pid}`)?.value, 10) || 0,
    };

    // RH warnings
    if (jarRH && jarRH > CURING_TARGETS.tooMoist) {
      entry.warning = 'Too moist — leave jars open for 30 minutes';
    } else if (jarRH && jarRH < CURING_TARGETS.tooDry) {
      entry.warning = 'Too dry — consider adding a humidity pack';
    }

    _addLog(store, plant.id, entry);
    renderDryCureView(container.closest('#content') || container.parentElement, store);
  });
  form.appendChild(logBtn);

  container.appendChild(form);
}

function _addLog(store, plantId, entry) {
  const grow = store.getSnapshot().grow;
  const plant = grow.plants.find(p => p.id === plantId);
  if (!plant) return;
  if (!plant.logs) plant.logs = [];
  plant.logs.push(entry);
  store.commit('grow', grow);
}

function _renderLogHistory(container, plant) {
  const logs = (plant.logs || []).filter(l => l.type === 'drying' || l.type === 'curing');
  if (logs.length === 0) return;

  const section = document.createElement('div');
  section.className = 'log-history';
  const title = document.createElement('h4');
  title.textContent = 'Log History';
  section.appendChild(title);

  // Show most recent 10
  const recent = logs.slice(-10).reverse();
  for (const log of recent) {
    const row = document.createElement('div');
    row.className = 'log-entry';
    const date = new Date(log.date).toLocaleDateString();
    let details = date;
    if (log.type === 'drying') {
      details += ` | ${log.temp ?? '-'}°C | ${log.rh ?? '-'}% RH | ${log.smell || '-'}`;
      if (log.snapTest) details += ' | Snap ✓';
    } else {
      details += ` | Jar ${log.jarRH ?? '-'}% | ${log.smell || '-'} | ${log.burpCount || 0} burps`;
      if (log.warning) details += ` | ⚠ ${log.warning}`;
    }
    row.textContent = details;
    section.appendChild(row);
  }
  container.appendChild(section);
}

function _formField(id, label, type, placeholder) {
  const group = document.createElement('div');
  group.className = 'form-field';
  const lbl = document.createElement('label');
  lbl.setAttribute('for', id);
  lbl.textContent = label;
  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.className = 'input';
  input.placeholder = placeholder;
  input.style.maxWidth = '120px';
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

function _logDecisionNote(plantId, type, action, note, store) {
  if (!store || !note) return;
  const grow = store.getSnapshot().grow;
  const plant = grow.plants?.find(p => p.id === plantId);
  if (!plant) return;
  if (!plant.logs) plant.logs = [];
  plant.logs.push({
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    type: 'decision',
    details: { action, note, decisionType: type },
  });
  store.commit('grow', grow);
}

function _milestoneIcon(icon) {
  const icons = {
    sprout: '🌱', leaf: '🍃', scissors: '✂', bend: '↪', canopy: '🌿',
    light: '💡', 'arrow-up': '↑', flower: '🌸', bud: '🌼',
    magnify: '🔍', water: '💧', harvest: '🌾', scale: '⚖',
    snap: '💥', jar: '🫙', check: '✓',
  };
  return icons[icon] || '•';
}
