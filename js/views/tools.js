// GrowDoc Companion — Tools Section View

import { renderPlantDoctor } from '../plant-doctor/doctor-ui.js';
import { renderCalculators } from './calculators.js';

/**
 * renderToolsView(container, store, toolId) — Tools section hub.
 */
export function renderToolsView(container, store, toolId) {
  container.innerHTML = '';

  if (toolId === 'doctor') {
    renderPlantDoctor(container, store);
    return;
  }

  if (toolId === 'stealth') {
    renderStealthAudit(container);
    return;
  }

  if (toolId === 'calculators') {
    renderCalculators(container, store);
    return;
  }

  // Tools hub
  const h1 = document.createElement('h1');
  h1.textContent = 'Tools';
  container.appendChild(h1);

  const tools = [
    { id: 'doctor', name: 'Plant Doctor', desc: 'Diagnose plant problems with symptom-based scoring', route: '/tools/doctor' },
    { id: 'stealth', name: 'Stealth Audit', desc: 'Assess and improve your operational security', route: '/tools/stealth' },
    { id: 'calculators', name: 'Grow Calculators', desc: 'VPD, DLI, EC/pH, PPM converter — with save to profile', route: '/tools/calculators' },
  ];

  for (const tool of tools) {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.style.cursor = 'pointer';

    const name = document.createElement('div');
    name.className = 'tool-name';
    name.textContent = tool.name;

    const desc = document.createElement('div');
    desc.className = 'text-muted';
    desc.textContent = tool.desc;

    card.appendChild(name);
    card.appendChild(desc);
    card.addEventListener('click', () => {
      const { navigate } = window.__growdocRouter || {};
      if (navigate) navigate(tool.route);
      else window.location.hash = tool.route;
    });
    container.appendChild(card);
  }
}

/**
 * renderStealthAudit(container) — Embed stealth audit via iframe.
 */
export function renderStealthAudit(container) {
  const h1 = document.createElement('h1');
  h1.textContent = 'Stealth Audit';
  container.appendChild(h1);

  const iframe = document.createElement('iframe');
  iframe.src = '/docs/tool-stealth-audit.html';
  iframe.title = 'Stealth Audit Tool';
  iframe.className = 'stealth-iframe';
  iframe.style.width = '100%';
  iframe.style.height = '80vh';
  iframe.style.border = 'none';
  iframe.style.borderRadius = 'var(--radius-md)';
  container.appendChild(iframe);
}
