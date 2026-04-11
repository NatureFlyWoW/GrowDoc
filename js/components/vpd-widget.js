// GrowDoc Companion — VPD Widget & Calculator

import { VPD_TARGETS } from '../data/grow-knowledge.js';
import { navigate } from '../router.js';

// Leaf temperature offset (°C) added to air temp to estimate canopy temp.
// LED:  -2  — modern LEDs emit minimal infrared, leaves run cooler than air
// HPS:   0  — HPS infrared keeps leaves at or slightly above air temp
//             (close-mounted HPS may be +1; users can adjust manually)
// CFL:  -1  — minimal IR, slight cooling
// fluo: -1  — same
const LEAF_OFFSETS = { led: -2, hps: 0, cfl: -1, fluorescent: -1 };

/**
 * calculateVPD(tempC, rhPercent, lightingType) — Calculates VPD in kPa.
 */
export function calculateVPD(tempC, rhPercent, lightingType = 'led') {
  const offset = LEAF_OFFSETS[lightingType] || -1;
  const leafTemp = tempC + offset;

  const svpAir = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const svpLeaf = 0.6108 * Math.exp((17.27 * leafTemp) / (leafTemp + 237.3));
  const vpd = svpLeaf - (svpAir * rhPercent / 100);

  return { vpd: Math.round(vpd * 100) / 100, leafTemp };
}

/**
 * getVPDStatus(vpd, stage) — Returns status relative to target range.
 */
export function getVPDStatus(vpd, stage) {
  const targets = VPD_TARGETS[stage];
  if (!targets) return 'unknown';

  const { min, max } = targets.vpdRange;
  if (vpd >= min && vpd <= max) return 'optimal';

  const range = max - min;
  if (vpd < min) {
    return (min - vpd) > range * 0.2 ? 'critical-low' : 'low';
  }
  return (vpd - max) > range * 0.2 ? 'critical-high' : 'high';
}

/**
 * calculateDLI(ppfd, hours) — DLI = PPFD * hours * 0.0036
 */
export function calculateDLI(ppfd, hours) {
  return Math.round(ppfd * hours * 0.0036 * 10) / 10;
}

/**
 * renderVPDWidget(container, store) — Compact VPD widget for dashboard sidebar.
 */
export function renderVPDWidget(container, store) {
  const profile = store.state.profile || {};
  const env = store.state.environment || {};
  const readings = env.readings || [];
  const latest = readings.length > 0 ? readings[readings.length - 1] : null;

  const card = document.createElement('div');
  card.className = 'sidebar-widget vpd-widget';

  const title = document.createElement('h4');
  title.textContent = 'VPD';
  card.appendChild(title);

  if (latest && latest.vpdDay != null) {
    const stage = store.state.grow?.plants?.[0]?.stage || 'early-veg';
    const status = getVPDStatus(latest.vpdDay, stage);
    const statusColors = { optimal: 'var(--status-good)', high: 'var(--status-action)', low: 'var(--status-action)', 'critical-high': 'var(--status-urgent)', 'critical-low': 'var(--status-urgent)' };

    card.style.borderLeftColor = statusColors[status] || 'var(--text-muted)';

    const value = document.createElement('div');
    value.className = 'vpd-value';
    value.textContent = `${latest.vpdDay} kPa`;
    card.appendChild(value);

    const statusText = document.createElement('div');
    statusText.className = 'vpd-status';
    statusText.style.color = statusColors[status] || 'var(--text-muted)';
    statusText.textContent = status === 'optimal' ? `Optimal for ${stage.replace(/-/g, ' ')}` : `${status.replace(/-/g, ' ')} — adjust conditions`;
    card.appendChild(statusText);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'text-muted';
    placeholder.textContent = 'No readings yet';
    card.appendChild(placeholder);
  }

  // Update button
  const updateBtn = document.createElement('button');
  updateBtn.className = 'btn btn-sm';
  updateBtn.textContent = 'Update';
  updateBtn.style.marginTop = 'var(--space-2)';
  updateBtn.addEventListener('click', () => _showUpdateForm(card, store));
  card.appendChild(updateBtn);

  // Full view link
  const link = document.createElement('a');
  link.href = '#';
  link.className = 'text-muted';
  link.style.fontSize = '0.78rem';
  link.style.display = 'block';
  link.style.marginTop = 'var(--space-2)';
  link.textContent = 'Full view →';
  link.addEventListener('click', (e) => { e.preventDefault(); navigate('/grow/environment'); });
  card.appendChild(link);

  container.appendChild(card);
}

function _showUpdateForm(card, store) {
  const existing = card.querySelector('.vpd-update-form');
  if (existing) { existing.remove(); return; }

  const form = document.createElement('div');
  form.className = 'vpd-update-form';

  const tempInput = document.createElement('input');
  tempInput.type = 'number';
  tempInput.className = 'input';
  tempInput.placeholder = 'Temp °C';
  tempInput.style.maxWidth = '80px';

  const rhInput = document.createElement('input');
  rhInput.type = 'number';
  rhInput.className = 'input';
  rhInput.placeholder = 'RH %';
  rhInput.style.maxWidth = '80px';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary btn-sm';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => {
    const temp = parseFloat(tempInput.value);
    const rh = parseFloat(rhInput.value);
    if (isNaN(temp) || isNaN(rh)) return;

    const profile = store.state.profile || {};
    const { vpd } = calculateVPD(temp, rh, profile.lighting || 'led');

    const envSnap = store.getSnapshot().environment || { readings: [] };
    if (!envSnap.readings) envSnap.readings = [];
    envSnap.readings.push({
      date: new Date().toISOString().split('T')[0],
      tempHigh: temp,
      tempLow: temp,
      rhHigh: rh,
      rhLow: rh,
      vpdDay: vpd,
      vpdNight: vpd,
      vpd,
    });
    store.commit('environment', envSnap);
    form.remove();
    // Re-render widget
    const parent = card.parentElement;
    card.remove();
    renderVPDWidget(parent, store);
  });

  form.appendChild(tempInput);
  form.appendChild(rhInput);
  form.appendChild(saveBtn);
  card.appendChild(form);
}

// ── Tests ──────────────────────────────────────────────────────────

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // VPD formula: 25C, 60% RH, LED
  {
    const { vpd, leafTemp } = calculateVPD(25, 60, 'led');
    assert(leafTemp === 23, 'LED leaf temp offset: 25-2=23');
    assert(vpd > 0.9 && vpd < 1.2, `VPD at 25C/60%/LED is ~1.05 (got ${vpd})`);
  }

  // HPS offset
  {
    const { leafTemp } = calculateVPD(25, 60, 'hps');
    assert(leafTemp === 24, 'HPS leaf temp offset: 25-1=24');
  }

  // Optimal status
  {
    const status = getVPDStatus(1.1, 'mid-flower');
    assert(status === 'optimal', `1.1 kPa is optimal for mid-flower (got ${status})`);
  }

  // High status
  {
    const status = getVPDStatus(1.8, 'mid-flower');
    assert(status === 'high' || status === 'critical-high', `1.8 kPa is high for mid-flower (got ${status})`);
  }

  // Low status
  {
    const status = getVPDStatus(0.5, 'mid-flower');
    assert(status === 'low' || status === 'critical-low', `0.5 kPa is low for mid-flower (got ${status})`);
  }

  // DLI calculation: 400 PPFD * 18h = 25.9
  {
    const dli = calculateDLI(400, 18);
    assert(Math.abs(dli - 25.9) < 0.1, `DLI: 400 PPFD * 18h = 25.9 (got ${dli})`);
  }

  // DLI: 800 PPFD * 12h = 34.6
  {
    const dli = calculateDLI(800, 12);
    assert(Math.abs(dli - 34.6) < 0.1, `DLI: 800 PPFD * 12h = 34.6 (got ${dli})`);
  }

  return results;
}
