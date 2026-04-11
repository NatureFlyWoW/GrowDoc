// GrowDoc Companion — Settings & Data Management View

import { renderStarRating, renderPriorityDisplay } from '../components/star-rating.js';
import { calculateWeights } from '../data/priority-engine.js';
import { parseProfileNotes, NOTE_PLACEHOLDERS } from '../data/profile-context-rules.js';
import { navigate } from '../router.js';

/**
 * renderSettingsView(container, store) — Settings and data management view.
 */
export function renderSettingsView(container, store) {
  container.innerHTML = '';

  const h1 = document.createElement('h1');
  h1.textContent = 'Settings';
  container.appendChild(h1);

  // Profile editor
  _renderProfileEditor(container, store);

  // Priority editor with live preview
  _renderPriorityEditor(container, store);

  // Profile notes editor
  _renderNotesEditor(container, store);

  // Storage usage
  _renderStorageUsage(container);

  // Data management
  _renderDataManagement(container, store);

  // Finish Grow
  if (store.state.grow?.active) {
    _renderFinishGrow(container, store);
  }
}

function _renderProfileEditor(container, store) {
  const section = document.createElement('div');
  section.className = 'settings-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Grow Profile';
  section.appendChild(h3);

  const profile = store.state.profile || {};

  const fields = [
    { key: 'medium', label: 'Growing Medium', type: 'select', options: ['soil', 'coco', 'hydro', 'soilless'] },
    { key: 'lighting', label: 'Lighting', type: 'select', options: ['led', 'hps', 'cfl', 'fluorescent'] },
    { key: 'experience', label: 'Experience', type: 'select', options: ['first-grow', 'beginner', 'intermediate', 'advanced', 'expert'] },
  ];

  for (const f of fields) {
    const group = document.createElement('div');
    group.className = 'form-field';
    const label = document.createElement('label');
    label.textContent = f.label;

    const select = document.createElement('select');
    select.className = 'input';
    for (const opt of f.options) {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (profile[f.key] === opt) o.selected = true;
      select.appendChild(o);
    }
    select.addEventListener('change', () => {
      const profileSnap = store.getSnapshot().profile || {};
      profileSnap[f.key] = select.value;
      store.commit('profile', profileSnap);
    });

    group.appendChild(label);
    group.appendChild(select);
    section.appendChild(group);
  }

  container.appendChild(section);
}

function _renderPriorityEditor(container, store) {
  const section = document.createElement('div');
  section.className = 'settings-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Priorities';
  section.appendChild(h3);

  const profile = store.state.profile || {};
  const priorities = profile.priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 };

  const dims = [
    { key: 'yield', label: 'Yield', color: 'var(--priority-yield)' },
    { key: 'quality', label: 'Quality', color: 'var(--priority-quality)' },
    { key: 'terpenes', label: 'Terpenes', color: 'var(--priority-terpenes)' },
    { key: 'effect', label: 'Effect', color: 'var(--priority-effect)' },
  ];

  for (const d of dims) {
    const group = document.createElement('div');
    group.style.marginBottom = 'var(--space-3)';
    renderStarRating(group, {
      name: d.key, label: d.label, color: d.color,
      value: priorities[d.key],
      onChange: (v) => {
        priorities[d.key] = v;
        const profileSnap = store.getSnapshot().profile || {};
        profileSnap.priorities = { ...priorities };
        store.commit('profile', profileSnap);
        // Update live preview
        const preview = section.querySelector('.priority-preview');
        if (preview) { preview.innerHTML = ''; renderPriorityDisplay(preview, priorities); }
      },
    });
    section.appendChild(group);
  }

  // Live preview
  const preview = document.createElement('div');
  preview.className = 'priority-preview';
  renderPriorityDisplay(preview, priorities);
  section.appendChild(preview);

  // Weights display
  const weights = calculateWeights(priorities);
  const weightText = document.createElement('div');
  weightText.className = 'text-muted';
  weightText.style.fontSize = '0.78rem';
  weightText.textContent = `Weights: Y=${(weights.yield * 100).toFixed(0)}% Q=${(weights.quality * 100).toFixed(0)}% T=${(weights.terpenes * 100).toFixed(0)}% E=${(weights.effect * 100).toFixed(0)}%`;
  section.appendChild(weightText);

  container.appendChild(section);
}

function _renderNotesEditor(container, store) {
  const profile = store.state.profile || {};
  const notes = profile.notes || {};

  if (Object.values(notes).every(v => !v)) return; // No notes to edit

  const section = document.createElement('div');
  section.className = 'settings-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Grow Context Notes';
  section.appendChild(h3);

  const hint = document.createElement('p');
  hint.className = 'text-muted';
  hint.style.fontSize = '0.82rem';
  hint.textContent = 'Notes from your setup wizard that personalize recommendations. Edit to update.';
  section.appendChild(hint);

  for (const [step, text] of Object.entries(notes)) {
    if (!text) continue;
    const group = document.createElement('div');
    group.className = 'form-field';
    const label = document.createElement('label');
    label.textContent = step.charAt(0).toUpperCase() + step.slice(1);
    const textarea = document.createElement('textarea');
    textarea.className = 'input';
    textarea.rows = 2;
    textarea.value = text;
    textarea.placeholder = NOTE_PLACEHOLDERS[step] || '';
    textarea.addEventListener('change', () => {
      const profileSnap = store.getSnapshot().profile || {};
      if (!profileSnap.notes) profileSnap.notes = {};
      profileSnap.notes[step] = textarea.value;
      profileSnap.context = parseProfileNotes(profileSnap.notes);
      store.commit('profile', profileSnap);
      store.publish('context:changed', { step });
    });
    group.appendChild(label);
    group.appendChild(textarea);
    section.appendChild(group);
  }

  container.appendChild(section);
}

function _renderStorageUsage(container) {
  const section = document.createElement('div');
  section.className = 'settings-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Storage';
  section.appendChild(h3);

  let usedBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('growdoc-companion')) {
        usedBytes += (localStorage.getItem(key) || '').length * 2; // UTF-16
      }
    }
  } catch { /* ignore */ }

  const maxBytes = 5 * 1024 * 1024; // 5MB
  const pct = Math.round((usedBytes / maxBytes) * 100);

  const bar = document.createElement('div');
  bar.className = 'storage-bar';
  const fill = document.createElement('div');
  fill.className = 'storage-fill';
  fill.style.width = `${Math.min(pct, 100)}%`;
  if (pct > 80) fill.style.background = 'var(--status-action)';
  bar.appendChild(fill);
  section.appendChild(bar);

  const label = document.createElement('div');
  label.className = 'text-muted';
  label.style.fontSize = '0.78rem';
  label.textContent = `Using ${(usedBytes / 1024).toFixed(1)} KB of ~5 MB (${pct}%)`;
  if (pct > 80) label.style.color = 'var(--status-action)';
  section.appendChild(label);

  container.appendChild(section);
}

function _renderDataManagement(container, store) {
  const section = document.createElement('div');
  section.className = 'settings-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Data Management';
  section.appendChild(h3);

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn';
  exportBtn.textContent = 'Export All Data';
  exportBtn.addEventListener('click', () => {
    const data = store.getSnapshot();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growdoc-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  section.appendChild(exportBtn);

  container.appendChild(section);
}

function _renderFinishGrow(container, store) {
  const section = document.createElement('div');
  section.className = 'settings-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Finish Grow';
  section.appendChild(h3);

  const info = document.createElement('p');
  info.className = 'text-muted';
  info.textContent = 'Archive this grow cycle and start fresh. Your data will be preserved in the archive.';
  section.appendChild(info);

  const finishBtn = document.createElement('button');
  finishBtn.className = 'btn btn-danger';
  finishBtn.textContent = 'Finish & Archive Grow';
  finishBtn.addEventListener('click', () => {
    if (!confirm('Archive this grow? You can view it later but cannot resume.')) return;

    const grow = store.getSnapshot().grow;
    const profile = store.state.profile || {};
    const archive = store.getSnapshot().archive || [];

    archive.push({
      id: grow.id,
      startDate: grow.startDate,
      endDate: new Date().toISOString(),
      totalDays: Math.floor((Date.now() - new Date(grow.startDate)) / 86400000),
      medium: profile.medium,
      lighting: profile.lighting,
      plantCount: grow.plants?.length || 0,
      priorities: { ...profile.priorities },
      diagnosisCount: grow.plants?.reduce((s, p) => s + (p.diagnoses?.length || 0), 0) || 0,
    });

    store.commit('archive', archive);
    store.commit('grow', { active: false, plants: [], tasks: [], stageHistory: [] });
    navigate('/dashboard');
  });
  section.appendChild(finishBtn);

  container.appendChild(section);
}
