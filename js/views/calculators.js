// GrowDoc Companion — Standalone Calculator Tools
// VPD, DLI, EC/PPM, Nutrient Mix — all with save-to-settings

import { calculateVPD, getVPDStatus, calculateDLI } from '../components/vpd-widget.js';
import { VPD_TARGETS, DLI_TARGETS } from '../data/grow-knowledge.js';
import { getRecommendation } from '../data/priority-engine.js';
import { getFeedingSchedule, compareToTarget } from '../data/feeding-calculator.js';
import { escapeHtml } from '../utils.js';

/**
 * renderCalculators(container, store) — Standalone calculator tools page.
 */
export function renderCalculators(container, store) {
  container.innerHTML = '';
  const profile = store.state.profile || {};
  const grow = store.state.grow;
  const stage = grow?.plants?.[0]?.stage || 'early-veg';

  const h1 = document.createElement('h1');
  h1.textContent = 'Grow Calculators';
  container.appendChild(h1);

  _renderVPDCalc(container, store, profile, stage);
  _renderDLICalc(container, store, profile, stage);
  _renderECCalc(container, store, profile, stage);
  _renderPPMConverter(container, store);
}

// ── VPD Calculator ──────────────────────────────────────────────────

function _renderVPDCalc(container, store, profile, stage) {
  const section = _calcSection('VPD Calculator', 'Calculate Vapour Pressure Deficit from temperature and humidity');
  const targets = VPD_TARGETS[stage];

  if (targets) {
    const targetInfo = document.createElement('div');
    targetInfo.className = 'calc-target-info';
    targetInfo.textContent = `Target for ${stage.replace(/-/g, ' ')}: ${targets.vpdRange.min} - ${targets.vpdRange.max} kPa`;
    section.appendChild(targetInfo);
  }

  const row = _inputRow();

  const tempInput = _numInput('calc-vpd-temp', 'Temperature (°C)', profile._lastTemp || '');
  const rhInput = _numInput('calc-vpd-rh', 'Relative Humidity (%)', profile._lastRH || '');

  const resultEl = document.createElement('div');
  resultEl.className = 'calc-result';

  const saveBtn = _saveBtn('Save as reading', () => {
    const temp = parseFloat(tempInput.value);
    const rh = parseFloat(rhInput.value);
    if (isNaN(temp) || isNaN(rh)) return;
    const { vpd } = calculateVPD(temp, rh, profile.lighting || 'led');

    // Save to environment readings
    const envSnap = store.getSnapshot().environment || { readings: [] };
    if (!envSnap.readings) envSnap.readings = [];
    envSnap.readings.push({
      date: new Date().toISOString().split('T')[0],
      tempHigh: temp, tempLow: temp, rhHigh: rh, rhLow: rh,
      vpdDay: vpd, vpdNight: vpd, vpd,
    });
    store.commit('environment', envSnap);

    // Save last values to profile for persistence
    const profileSnap = store.getSnapshot().profile || {};
    profileSnap._lastTemp = temp;
    profileSnap._lastRH = rh;
    store.commit('profile', profileSnap);

    saveBtn.textContent = 'Saved ✓';
    setTimeout(() => { saveBtn.textContent = 'Save as reading'; }, 1500);
  });

  const calculate = () => {
    const temp = parseFloat(tempInput.value);
    const rh = parseFloat(rhInput.value);
    if (isNaN(temp) || isNaN(rh)) { resultEl.innerHTML = ''; return; }
    const { vpd, leafTemp } = calculateVPD(temp, rh, profile.lighting || 'led');
    const status = getVPDStatus(vpd, stage);
    const statusColors = { optimal: 'var(--status-good)', high: 'var(--status-action)', low: 'var(--status-action)', 'critical-high': 'var(--status-urgent)', 'critical-low': 'var(--status-urgent)' };
    resultEl.innerHTML = `
      <div class="calc-result-main" style="color:${statusColors[status] || 'var(--text-primary)'}">
        VPD: <strong>${vpd} kPa</strong> — ${status.replace(/-/g, ' ')}
      </div>
      <div class="calc-result-sub">Leaf temp (${profile.lighting || 'LED'}): ${leafTemp}°C</div>
    `;
  };

  tempInput.addEventListener('input', calculate);
  rhInput.addEventListener('input', calculate);

  row.appendChild(tempInput);
  row.appendChild(rhInput);
  section.appendChild(row);
  section.appendChild(resultEl);
  section.appendChild(saveBtn);
  container.appendChild(section);
}

// ── DLI Calculator ──────────────────────────────────────────────────

function _renderDLICalc(container, store, profile, stage) {
  const section = _calcSection('DLI Calculator', 'Daily Light Integral = PPFD × hours × 0.0036');

  const priorities = profile.priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 };
  const rec = getRecommendation('dli', stage, null, priorities);
  if (rec.value > 0) {
    const targetInfo = document.createElement('div');
    targetInfo.className = 'calc-target-info';
    targetInfo.textContent = `Target for ${stage.replace(/-/g, ' ')}: ${rec.range.min} - ${rec.range.max} mol/m²/day (priority-blended: ${rec.value})`;
    section.appendChild(targetInfo);
  }

  const row = _inputRow();
  const ppfdInput = _numInput('calc-dli-ppfd', 'PPFD (µmol/m²/s)', profile._lastPPFD || '');
  const hoursInput = _numInput('calc-dli-hours', 'Photoperiod (hours)', profile._lastPhotoperiod || '18');

  const resultEl = document.createElement('div');
  resultEl.className = 'calc-result';

  const saveBtn = _saveBtn('Save to profile', () => {
    const ppfd = parseFloat(ppfdInput.value);
    const hours = parseFloat(hoursInput.value);
    if (isNaN(ppfd) || isNaN(hours)) return;
    const profileSnap = store.getSnapshot().profile || {};
    profileSnap._lastPPFD = ppfd;
    profileSnap._lastPhotoperiod = hours;
    store.commit('profile', profileSnap);
    saveBtn.textContent = 'Saved ✓';
    setTimeout(() => { saveBtn.textContent = 'Save to profile'; }, 1500);
  });

  const calculate = () => {
    const ppfd = parseFloat(ppfdInput.value);
    const hours = parseFloat(hoursInput.value);
    if (isNaN(ppfd) || isNaN(hours)) { resultEl.innerHTML = ''; return; }
    const dli = calculateDLI(ppfd, hours);
    let status = 'On target';
    let color = 'var(--status-good)';
    if (rec.value > 0) {
      if (dli < rec.range.min) { status = 'Below target — increase light intensity or hours'; color = 'var(--status-action)'; }
      else if (dli > rec.range.max) { status = 'Above target — risk of light stress'; color = 'var(--status-urgent)'; }
    }
    resultEl.innerHTML = `
      <div class="calc-result-main" style="color:${color}">
        DLI: <strong>${dli} mol/m²/day</strong> — ${status}
      </div>
    `;
  };

  ppfdInput.addEventListener('input', calculate);
  hoursInput.addEventListener('input', calculate);

  row.appendChild(ppfdInput);
  row.appendChild(hoursInput);
  section.appendChild(row);
  section.appendChild(resultEl);
  section.appendChild(saveBtn);
  container.appendChild(section);
}

// ── EC / Nutrient Calculator ────────────────────────────────────────

function _renderECCalc(container, store, profile, stage) {
  const section = _calcSection('Nutrient Calculator', 'Compare your EC and pH to recommended targets');
  const medium = profile.medium || 'soil';
  const priorities = profile.priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 };
  const context = profile.context || {};
  const schedule = getFeedingSchedule(medium, stage, priorities, context);

  if (schedule) {
    const targetInfo = document.createElement('div');
    targetInfo.className = 'calc-target-info';
    targetInfo.innerHTML = `Target for ${medium} / ${stage.replace(/-/g, ' ')}:<br>
      EC: ${schedule.ecTarget.min} - ${schedule.ecTarget.max} | pH: ${schedule.phTarget.min} - ${schedule.phTarget.max} | NPK: ${schedule.npkRatio}`;
    section.appendChild(targetInfo);
  }

  const row = _inputRow();
  const ecInput = _numInput('calc-ec', 'Your EC (mS/cm)', profile._lastEC || '');
  ecInput.step = '0.1';
  const phInput = _numInput('calc-ph', 'Your pH', profile._lastPH || '');
  phInput.step = '0.1';

  const resultEl = document.createElement('div');
  resultEl.className = 'calc-result';

  const saveBtn = _saveBtn('Save reading', () => {
    const ec = parseFloat(ecInput.value);
    const ph = parseFloat(phInput.value);
    const profileSnap = store.getSnapshot().profile || {};
    if (!isNaN(ec)) profileSnap._lastEC = ec;
    if (!isNaN(ph)) profileSnap._lastPH = ph;
    store.commit('profile', profileSnap);
    saveBtn.textContent = 'Saved ✓';
    setTimeout(() => { saveBtn.textContent = 'Save reading'; }, 1500);
  });

  const calculate = () => {
    const ec = parseFloat(ecInput.value);
    const ph = parseFloat(phInput.value);
    if (isNaN(ec) && isNaN(ph)) { resultEl.innerHTML = ''; return; }
    const result = compareToTarget(ec || 0, ph || 7, medium, stage, priorities);
    const statusColors = { good: 'var(--status-good)', adjust: 'var(--status-action)', concern: 'var(--status-urgent)' };
    resultEl.innerHTML = `
      <div style="color:${statusColors[result.overallStatus] || 'var(--text-primary)'}">${result.ecAdvice}</div>
      <div style="color:${statusColors[result.overallStatus] || 'var(--text-primary)'}; margin-top:var(--space-2)">${result.phAdvice}</div>
    `;
  };

  ecInput.addEventListener('input', calculate);
  phInput.addEventListener('input', calculate);

  row.appendChild(ecInput);
  row.appendChild(phInput);
  section.appendChild(row);
  section.appendChild(resultEl);
  section.appendChild(saveBtn);
  container.appendChild(section);
}

// ── PPM / EC Converter ──────────────────────────────────────────────

function _renderPPMConverter(container, store) {
  const section = _calcSection('EC ↔ PPM Converter', 'Convert between EC (mS/cm) and PPM using different scales');

  const row = _inputRow();
  const ecInput = _numInput('calc-conv-ec', 'EC (mS/cm)', '');
  ecInput.step = '0.1';

  const resultEl = document.createElement('div');
  resultEl.className = 'calc-result';

  const calculate = () => {
    const ec = parseFloat(ecInput.value);
    if (isNaN(ec)) { resultEl.innerHTML = ''; return; }
    resultEl.innerHTML = `
      <div><strong>Hanna/Truncheon (×500):</strong> ${Math.round(ec * 500)} PPM</div>
      <div><strong>Bluelab/Milwaukee (×700):</strong> ${Math.round(ec * 700)} PPM</div>
      <div><strong>Eutech/Hannah EU (×640):</strong> ${Math.round(ec * 640)} PPM</div>
      <div class="text-muted" style="margin-top:var(--space-2);font-size:0.78rem">
        Most pen meters use ×500 or ×700. Check your meter manual. When in doubt, use EC — it is universal.
      </div>
    `;
  };

  ecInput.addEventListener('input', calculate);

  row.appendChild(ecInput);
  section.appendChild(row);
  section.appendChild(resultEl);
  container.appendChild(section);
}

// ── Helpers ──────────────────────────────────────────────────────────

function _calcSection(title, subtitle) {
  const section = document.createElement('div');
  section.className = 'calc-section';
  const h3 = document.createElement('h3');
  h3.textContent = title;
  section.appendChild(h3);
  if (subtitle) {
    const sub = document.createElement('div');
    sub.className = 'text-muted';
    sub.style.fontSize = '0.82rem';
    sub.style.marginBottom = 'var(--space-3)';
    sub.textContent = subtitle;
    section.appendChild(sub);
  }
  return section;
}

function _inputRow() {
  const row = document.createElement('div');
  row.className = 'calc-input-row';
  return row;
}

function _numInput(id, placeholder, value) {
  const input = document.createElement('input');
  input.type = 'number';
  input.id = id;
  input.className = 'input';
  input.placeholder = placeholder;
  input.style.maxWidth = '160px';
  if (value !== '' && value != null) input.value = value;
  return input;
}

function _saveBtn(label, onClick) {
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm';
  btn.style.marginTop = 'var(--space-3)';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}
