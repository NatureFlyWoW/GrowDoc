// GrowDoc Companion — Environment Dashboard & Tracking

import { calculateVPD, getVPDStatus, calculateDLI, renderVPDWidget } from '../components/vpd-widget.js';
import { renderTrendChart } from '../components/env-chart.js';
import { VPD_TARGETS, DLI_TARGETS, TEMP_DIF, NUTRIENT_TARGETS } from '../data/grow-knowledge.js';
import { getRecommendation } from '../data/priority-engine.js';

/**
 * renderEnvironmentView(container, store) — Full environment tracking view.
 */
export function renderEnvironmentView(container, store) {
  container.innerHTML = '';
  const profile = store.state.profile || {};
  const env = store.state.environment || {};
  const readings = env.readings || [];
  const grow = store.state.grow;
  const stage = grow?.plants?.[0]?.stage || 'early-veg';

  const h1 = document.createElement('h1');
  h1.textContent = 'Environment';
  container.appendChild(h1);

  // Drift detection
  _renderDriftWarning(container, readings, stage);

  // Daily logging form
  _renderLogForm(container, store, profile);

  // VPD Calculator (live)
  _renderVPDCalc(container, profile, stage);

  // DLI Calculator
  _renderDLICalc(container, stage, profile.priorities);

  // Temperature differential
  _renderTempDif(container, readings, profile.priorities);

  // Nutrient targets (read-only reference)
  _renderNutrientRef(container, profile.medium, stage);

  // Trend charts
  _renderCharts(container, readings, stage);
}

function _renderLogForm(container, store, profile) {
  const section = document.createElement('div');
  section.className = 'env-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Log Today\'s Conditions';
  section.appendChild(h3);

  const form = document.createElement('div');
  form.className = 'env-log-form';

  const fields = [
    { id: 'env-temp-high', label: 'Temp High (°C)', placeholder: '26' },
    { id: 'env-temp-low', label: 'Temp Low (°C)', placeholder: '20' },
    { id: 'env-rh-high', label: 'RH High (%)', placeholder: '60' },
    { id: 'env-rh-low', label: 'RH Low (%)', placeholder: '45' },
  ];

  for (const f of fields) {
    const group = document.createElement('div');
    group.className = 'form-field-inline';
    const label = document.createElement('label');
    label.setAttribute('for', f.id);
    label.textContent = f.label;
    const input = document.createElement('input');
    input.type = 'number';
    input.id = f.id;
    input.className = 'input';
    input.placeholder = f.placeholder;
    input.style.maxWidth = '100px';
    group.appendChild(label);
    group.appendChild(input);
    form.appendChild(group);
  }

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Log Reading';
  saveBtn.addEventListener('click', () => {
    const tempHigh = parseFloat(document.getElementById('env-temp-high')?.value);
    const tempLow = parseFloat(document.getElementById('env-temp-low')?.value);
    const rhHigh = parseFloat(document.getElementById('env-rh-high')?.value);
    const rhLow = parseFloat(document.getElementById('env-rh-low')?.value);
    if (isNaN(tempHigh) || isNaN(tempLow) || isNaN(rhHigh) || isNaN(rhLow)) return;

    const avgRH = (rhHigh + rhLow) / 2;
    const { vpd: vpdDay } = calculateVPD(tempHigh, avgRH, profile.lighting || 'led');
    const { vpd: vpdNight } = calculateVPD(tempLow, avgRH, profile.lighting || 'led');

    const envSnap = store.getSnapshot().environment || { readings: [] };
    if (!envSnap.readings) envSnap.readings = [];
    envSnap.readings.push({
      date: new Date().toISOString().split('T')[0],
      tempHigh, tempLow, rhHigh, rhLow, vpdDay, vpdNight,
      vpd: vpdDay,
    });
    store.commit('environment', envSnap);
    renderEnvironmentView(container.closest('#content') || container, store);
  });
  form.appendChild(saveBtn);
  section.appendChild(form);
  container.appendChild(section);
}

function _renderVPDCalc(container, profile, stage) {
  const section = document.createElement('div');
  section.className = 'env-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'VPD Calculator';
  section.appendChild(h3);

  const targets = VPD_TARGETS[stage];
  if (targets) {
    const targetText = document.createElement('div');
    targetText.className = 'text-muted';
    targetText.textContent = `Target for ${stage.replace(/-/g, ' ')}: ${targets.vpdRange.min}-${targets.vpdRange.max} kPa`;
    section.appendChild(targetText);
  }

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = 'var(--space-3)';
  row.style.alignItems = 'center';
  row.style.marginTop = 'var(--space-2)';

  const tempIn = document.createElement('input');
  tempIn.type = 'number';
  tempIn.className = 'input';
  tempIn.placeholder = 'Temp °C';
  tempIn.style.maxWidth = '100px';

  const rhIn = document.createElement('input');
  rhIn.type = 'number';
  rhIn.className = 'input';
  rhIn.placeholder = 'RH %';
  rhIn.style.maxWidth = '100px';

  const resultEl = document.createElement('span');
  resultEl.className = 'vpd-calc-result';

  const update = () => {
    const t = parseFloat(tempIn.value);
    const r = parseFloat(rhIn.value);
    if (isNaN(t) || isNaN(r)) { resultEl.textContent = ''; return; }
    const { vpd } = calculateVPD(t, r, profile.lighting || 'led');
    const status = getVPDStatus(vpd, stage);
    resultEl.textContent = `${vpd} kPa — ${status}`;
  };

  tempIn.addEventListener('input', update);
  rhIn.addEventListener('input', update);

  row.appendChild(tempIn);
  row.appendChild(rhIn);
  row.appendChild(resultEl);
  section.appendChild(row);
  container.appendChild(section);
}

function _renderDLICalc(container, stage, priorities) {
  const section = document.createElement('div');
  section.className = 'env-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'DLI Calculator';
  section.appendChild(h3);

  const targets = DLI_TARGETS[stage];
  if (targets && priorities) {
    const rec = getRecommendation('dli', stage, null, priorities);
    const targetText = document.createElement('div');
    targetText.className = 'text-muted';
    targetText.textContent = `Target DLI: ${rec.range.min}-${rec.range.max} mol/m²/day (blended: ${rec.value})`;
    section.appendChild(targetText);
  }

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = 'var(--space-3)';
  row.style.alignItems = 'center';
  row.style.marginTop = 'var(--space-2)';

  const ppfdIn = document.createElement('input');
  ppfdIn.type = 'number';
  ppfdIn.className = 'input';
  ppfdIn.placeholder = 'PPFD µmol';
  ppfdIn.style.maxWidth = '120px';

  const hoursIn = document.createElement('input');
  hoursIn.type = 'number';
  hoursIn.className = 'input';
  hoursIn.placeholder = 'Hours';
  hoursIn.style.maxWidth = '80px';

  const resultEl = document.createElement('span');
  resultEl.className = 'dli-calc-result';

  const update = () => {
    const p = parseFloat(ppfdIn.value);
    const h = parseFloat(hoursIn.value);
    if (isNaN(p) || isNaN(h)) { resultEl.textContent = ''; return; }
    const dli = calculateDLI(p, h);
    resultEl.textContent = `${dli} mol/m²/day`;
  };

  ppfdIn.addEventListener('input', update);
  hoursIn.addEventListener('input', update);

  row.appendChild(ppfdIn);
  row.appendChild(hoursIn);
  row.appendChild(resultEl);
  section.appendChild(row);
  container.appendChild(section);
}

function _renderTempDif(container, readings, priorities) {
  const section = document.createElement('div');
  section.className = 'env-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Temperature Differential';
  section.appendChild(h3);

  if (priorities) {
    const rec = getRecommendation('temp_dif', null, null, priorities);
    const text = document.createElement('div');
    text.className = 'text-muted';
    text.textContent = `Recommended: ${rec.range.min}-${rec.range.max}°C day/night difference`;
    if (rec.tradeoffNote) text.textContent += ` — ${rec.tradeoffNote}`;
    section.appendChild(text);
  }

  if (readings.length > 0) {
    const latest = readings[readings.length - 1];
    const diff = (latest.tempHigh - latest.tempLow).toFixed(1);
    const current = document.createElement('div');
    current.textContent = `Current: ${diff}°C (${latest.tempHigh}°C high / ${latest.tempLow}°C low)`;
    section.appendChild(current);
  }

  container.appendChild(section);
}

function _renderNutrientRef(container, medium, stage) {
  if (!medium) return;
  const targets = NUTRIENT_TARGETS[medium]?.[stage];
  if (!targets) return;

  const section = document.createElement('div');
  section.className = 'env-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Nutrient Targets (Reference)';
  section.appendChild(h3);

  const info = document.createElement('div');
  info.className = 'text-muted';
  info.textContent = `EC: ${targets.ec.min}-${targets.ec.max} | pH: ${targets.ph.min}-${targets.ph.max} | NPK: ${targets.npkRatio}`;
  if (targets.calmagNote) info.textContent += ` | ${targets.calmagNote}`;
  section.appendChild(info);
  container.appendChild(section);
}

function _renderDriftWarning(container, readings, stage) {
  if (readings.length < 7) return;
  const recent = readings.slice(-7);
  const avgVPD = recent.reduce((s, r) => s + (r.vpdDay || 0), 0) / recent.length;
  const targets = VPD_TARGETS[stage];
  if (!targets) return;

  const { min, max } = targets.vpdRange;
  if (avgVPD < min * 0.9 || avgVPD > max * 1.1) {
    const warning = document.createElement('div');
    warning.className = 'drift-warning';
    const direction = avgVPD < min ? 'below' : 'above';
    warning.textContent = `7-day average VPD is ${avgVPD.toFixed(2)} kPa — ${direction} optimal range (${min}-${max} kPa) for ${stage.replace(/-/g, ' ')}.`;
    container.appendChild(warning);
  }
}

function _renderCharts(container, readings, stage) {
  if (readings.length === 0) return;

  const section = document.createElement('div');
  section.className = 'env-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Trends';
  section.appendChild(h3);

  const targets = VPD_TARGETS[stage];

  // VPD chart
  renderTrendChart(section, {
    data: readings.map(r => ({ date: r.date, value: r.vpdDay || 0 })),
    label: 'VPD', unit: 'kPa',
    targetMin: targets?.vpdRange.min,
    targetMax: targets?.vpdRange.max,
    color: 'var(--accent-green)',
  });

  // Temperature chart
  renderTrendChart(section, {
    data: readings.map(r => ({ date: r.date, value: r.tempHigh || 0 })),
    label: 'Temperature High', unit: '°C',
    targetMin: targets?.dayTemp.min,
    targetMax: targets?.dayTemp.max,
    color: 'var(--status-action)',
  });

  container.appendChild(section);
}
