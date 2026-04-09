// GrowDoc Companion — Feeding Schedule View

import { getFeedingSchedule, compareToTarget } from '../data/feeding-calculator.js';
import { NUTRIENT_TARGETS } from '../data/grow-knowledge.js';
import { STAGES } from '../data/stage-rules.js';

/**
 * renderFeedingView(container, store) — Full feeding schedule view.
 */
export function renderFeedingView(container, store) {
  container.innerHTML = '';
  const profile = store.state.profile || {};
  const grow = store.state.grow;
  const medium = profile.medium || 'soil';
  const stage = grow?.plants?.[0]?.stage || 'early-veg';
  const priorities = profile.priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 };

  const h1 = document.createElement('h1');
  h1.textContent = 'Feeding Schedule';
  container.appendChild(h1);

  // Current recommendation card
  _renderCurrentCard(container, medium, stage, priorities);

  // Stage overview table
  _renderStageTable(container, medium, stage);

  // Nutrient calculator
  _renderCalculator(container, medium, stage, priorities);
}

function _renderCurrentCard(container, medium, stage, priorities) {
  const sched = getFeedingSchedule(medium, stage, priorities);
  if (!sched) return;

  const card = document.createElement('div');
  card.className = 'feeding-card';

  const title = document.createElement('h3');
  title.textContent = `Feeding Targets — ${stage.replace(/-/g, ' ')} in ${medium}`;
  card.appendChild(title);

  const targets = document.createElement('div');
  targets.className = 'feeding-targets';
  targets.innerHTML = `
    <div class="feeding-target"><strong>EC:</strong> ${sched.ecTarget.min} - ${sched.ecTarget.max}</div>
    <div class="feeding-target"><strong>pH:</strong> ${sched.phTarget.min} - ${sched.phTarget.max}</div>
    <div class="feeding-target"><strong>N-P-K:</strong> ${sched.npkRatio}</div>
  `;
  card.appendChild(targets);

  if (sched.calmagRequired && sched.calmagDose) {
    const calmag = document.createElement('div');
    calmag.className = 'feeding-callout';
    calmag.textContent = `CalMag: ${sched.calmagDose}`;
    card.appendChild(calmag);
  }

  if (sched.notes.length > 0) {
    const notes = document.createElement('ul');
    notes.className = 'feeding-notes';
    for (const note of sched.notes) {
      const li = document.createElement('li');
      li.textContent = note;
      notes.appendChild(li);
    }
    card.appendChild(notes);
  }

  container.appendChild(card);
}

function _renderStageTable(container, medium, currentStage) {
  const section = document.createElement('div');
  section.className = 'feeding-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Stage Overview';
  section.appendChild(h3);

  const table = document.createElement('table');
  table.className = 'feeding-table';
  table.innerHTML = '<thead><tr><th>Stage</th><th>EC</th><th>pH</th><th>N-P-K</th><th>CalMag</th></tr></thead>';

  const tbody = document.createElement('tbody');
  const mediumTargets = NUTRIENT_TARGETS[medium] || {};

  for (const stageKey of Object.keys(mediumTargets)) {
    const t = mediumTargets[stageKey];
    const tr = document.createElement('tr');
    if (stageKey === currentStage) tr.className = 'current-stage-row';
    tr.innerHTML = `<td>${stageKey.replace(/-/g, ' ')}</td><td>${t.ec.min}-${t.ec.max}</td><td>${t.ph.min}-${t.ph.max}</td><td>${t.npkRatio}</td><td>${t.calmagNote ? 'Yes' : '-'}</td>`;
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  section.appendChild(table);
  container.appendChild(section);
}

function _renderCalculator(container, medium, stage, priorities) {
  const section = document.createElement('div');
  section.className = 'feeding-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Nutrient Calculator';
  section.appendChild(h3);

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = 'var(--space-3)';
  row.style.alignItems = 'center';
  row.style.flexWrap = 'wrap';

  const ecIn = document.createElement('input');
  ecIn.type = 'number';
  ecIn.className = 'input';
  ecIn.placeholder = 'EC';
  ecIn.step = '0.1';
  ecIn.style.maxWidth = '80px';

  const phIn = document.createElement('input');
  phIn.type = 'number';
  phIn.className = 'input';
  phIn.placeholder = 'pH';
  phIn.step = '0.1';
  phIn.style.maxWidth = '80px';

  const resultEl = document.createElement('div');
  resultEl.className = 'calc-result';

  const compareBtn = document.createElement('button');
  compareBtn.className = 'btn btn-primary btn-sm';
  compareBtn.textContent = 'Compare';
  compareBtn.addEventListener('click', () => {
    const ec = parseFloat(ecIn.value);
    const ph = parseFloat(phIn.value);
    if (isNaN(ec) || isNaN(ph)) return;
    const result = compareToTarget(ec, ph, medium, stage, priorities);
    const statusColors = { good: 'var(--status-good)', adjust: 'var(--status-action)', concern: 'var(--status-urgent)' };
    resultEl.innerHTML = `
      <div style="color:${statusColors[result.overallStatus] || 'var(--text-primary)'}">${result.ecAdvice}</div>
      <div style="color:${statusColors[result.overallStatus] || 'var(--text-primary)'}">${result.phAdvice}</div>
    `;
  });

  row.appendChild(ecIn);
  row.appendChild(phIn);
  row.appendChild(compareBtn);
  section.appendChild(row);
  section.appendChild(resultEl);
  container.appendChild(section);
}
