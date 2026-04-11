// GrowDoc Companion — Settings & Data Management View

import { renderStarRating, renderPriorityDisplay } from '../components/star-rating.js';
import { calculateWeights } from '../data/priority-engine.js';
import { parseProfileText, NOTE_PLACEHOLDERS } from '../data/note-contextualizer/index.js';
import { exportAllData, importAllData, validateBackupSchema, getStorageBreakdown } from '../storage.js';
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

  // Past Grows (Section 07)
  _renderPastGrows(container, store);

  // Finish Grow
  if (store.state.grow?.active) {
    _renderFinishGrow(container, store);
  }
}

function _renderPastGrows(container, store) {
  const grow = store.state.grow;
  const donePlants = (grow?.plants || []).filter(p => p.stage === 'done');
  if (donePlants.length === 0) return;

  // Sort by finishedDate descending (newest first)
  donePlants.sort((a, b) => {
    const da = new Date(a.finishedDate || 0).getTime();
    const db = new Date(b.finishedDate || 0).getTime();
    return db - da;
  });

  const section = document.createElement('div');
  section.className = 'settings-section';
  const h3 = document.createElement('h3');
  h3.textContent = `Past Grows (${donePlants.length})`;
  section.appendChild(h3);

  for (const plant of donePlants) {
    const row = document.createElement('details');
    row.style.marginBottom = '8px';
    row.style.padding = '8px 12px';
    row.style.background = 'var(--bg-elevated, #fafafa)';
    row.style.borderRadius = '6px';

    const summary = document.createElement('summary');
    summary.style.cursor = 'pointer';
    summary.style.fontWeight = '600';
    const strainName = plant.strainCustom?.name || plant.name;
    const yieldStr = plant.outcome?.dryYieldGrams != null ? `${plant.outcome.dryYieldGrams}g` : 'no yield recorded';
    const qualityStr = plant.outcome?.qualityRating != null ? `${plant.outcome.qualityRating}/10` : '';
    const dateStr = plant.finishedDate || '';
    summary.textContent = `${strainName} — ${yieldStr}${qualityStr ? ' · ' + qualityStr : ''}${dateStr ? ' · ' + dateStr : ''}`;
    row.appendChild(summary);

    const body = document.createElement('div');
    body.style.marginTop = '8px';
    body.style.fontSize = '0.9rem';
    body.style.color = 'var(--text-muted)';

    if (plant.outcome?.terpeneNotes) {
      const t = document.createElement('div');
      t.innerHTML = '<strong>Terpenes:</strong> ';
      t.appendChild(document.createTextNode(plant.outcome.terpeneNotes));
      body.appendChild(t);
    }
    if (plant.outcome?.effectNotes) {
      const e = document.createElement('div');
      e.innerHTML = '<strong>Effects:</strong> ';
      e.appendChild(document.createTextNode(plant.outcome.effectNotes));
      body.appendChild(e);
    }
    if (plant.outcome?.growAgain) {
      const g = document.createElement('div');
      g.innerHTML = '<strong>Would grow again:</strong> ';
      g.appendChild(document.createTextNode(plant.outcome.growAgain));
      body.appendChild(g);
    }
    if (plant.outcome?.lessonsLearned) {
      const l = document.createElement('div');
      l.innerHTML = '<strong>Lessons:</strong> ';
      l.appendChild(document.createTextNode(plant.outcome.lessonsLearned));
      body.appendChild(l);
    }

    const logCount = (plant.logs || []).length;
    const dxCount = (plant.diagnoses || []).length;
    if (logCount > 0 || dxCount > 0) {
      const meta = document.createElement('div');
      meta.style.marginTop = '6px';
      meta.style.fontSize = '0.8rem';
      meta.textContent = `${logCount} log entries, ${dxCount} diagnoses`;
      body.appendChild(meta);
    }

    row.appendChild(body);
    section.appendChild(row);
  }

  container.appendChild(section);
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
      profileSnap.context = parseProfileText(profileSnap.notes);
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

  // Section 11: full per-category breakdown
  const breakdown = getStorageBreakdown();

  const totalLabel = document.createElement('div');
  totalLabel.style.fontWeight = '600';
  totalLabel.textContent = `${(breakdown.totalBytes / 1024).toFixed(1)} KB of ~5 MB used (${breakdown.percentUsed}%)`;
  section.appendChild(totalLabel);

  const bar = document.createElement('div');
  bar.className = 'storage-bar';
  bar.style.background = 'var(--bg-elevated, #eee)';
  bar.style.borderRadius = '4px';
  bar.style.height = '8px';
  bar.style.margin = '8px 0 16px';
  bar.style.overflow = 'hidden';
  const fill = document.createElement('div');
  fill.className = 'storage-fill';
  fill.style.height = '100%';
  fill.style.width = `${Math.min(breakdown.percentUsed, 100)}%`;
  fill.style.background = breakdown.percentUsed >= 95 ? 'var(--status-urgent, #d93)' :
                          breakdown.percentUsed >= 80 ? 'var(--status-action, #d97706)' :
                          'var(--color-primary, #2d5016)';
  fill.style.transition = 'width 0.3s';
  bar.appendChild(fill);
  section.appendChild(bar);

  // Per-category list
  for (const cat of breakdown.categories) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.padding = '4px 0';
    row.style.fontSize = '0.85rem';

    const name = document.createElement('span');
    name.textContent = cat.name;
    row.appendChild(name);

    const size = document.createElement('span');
    size.style.color = 'var(--text-muted)';
    const kb = (cat.bytes / 1024).toFixed(1);
    size.textContent = `${kb} KB`;
    row.appendChild(size);

    section.appendChild(row);
  }

  container.appendChild(section);
}

function _renderDataManagement(container, store) {
  const section = document.createElement('div');
  section.className = 'settings-section';
  const h3 = document.createElement('h3');
  h3.textContent = 'Backup & Restore';
  section.appendChild(h3);

  const help = document.createElement('p');
  help.className = 'text-muted';
  help.style.fontSize = '0.85rem';
  help.textContent = 'Export downloads a complete backup including plants, logs, photos, past grows, and settings. Import replaces all current data — back up first.';
  section.appendChild(help);

  const buttonRow = document.createElement('div');
  buttonRow.style.display = 'flex';
  buttonRow.style.gap = '8px';
  buttonRow.style.flexWrap = 'wrap';

  // Export button — Section 11 v2 envelope
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-primary';
  exportBtn.textContent = '⬇ Export backup';
  exportBtn.addEventListener('click', () => {
    const payload = exportAllData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growdoc-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  buttonRow.appendChild(exportBtn);

  // Import button
  const importBtn = document.createElement('button');
  importBtn.className = 'btn';
  importBtn.textContent = '⬆ Import backup';
  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          validateBackupSchema(parsed);
          const summary = _summarizeBackup(parsed);
          if (!confirm(`This will replace ALL current data with the backup contents:\n\n${summary}\n\nA pre-import backup will be saved automatically. Continue?`)) {
            return;
          }
          const result = importAllData(parsed);
          alert(`Imported ${result.restored} keys. The page will reload.`);
          location.reload();
        } catch (err) {
          alert(`Import failed: ${err.message}`);
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });
  buttonRow.appendChild(importBtn);

  section.appendChild(buttonRow);

  // Pre-import restore link if available
  if (localStorage.getItem('growdoc-preimport-backup')) {
    const restoreLink = document.createElement('button');
    restoreLink.className = 'btn btn-link';
    restoreLink.style.fontSize = '0.85rem';
    restoreLink.style.marginTop = '8px';
    restoreLink.style.color = 'var(--text-muted)';
    restoreLink.textContent = '↩ Restore previous (pre-import) state';
    restoreLink.addEventListener('click', () => {
      try {
        const raw = localStorage.getItem('growdoc-preimport-backup');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!confirm('Restore the state from before your last import? Current data will be replaced.')) return;
        importAllData(parsed);
        alert('Pre-import state restored. The page will reload.');
        location.reload();
      } catch (err) {
        alert(`Restore failed: ${err.message}`);
      }
    });
    section.appendChild(restoreLink);
  }

  container.appendChild(section);
}

function _summarizeBackup(parsed) {
  const data = parsed?.data || {};
  const grow = data['growdoc-companion-grow'];
  const plants = grow?.plants?.length || 0;
  const photos = data['growdoc-photos-v1'] ? Object.keys(data['growdoc-photos-v1']).length : 0;
  const archive = Array.isArray(data['growdoc-companion-archive']) ? data['growdoc-companion-archive'].length : 0;
  const exported = parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString() : 'unknown';
  return `Exported: ${exported}\nPlants: ${plants}\nPhotos: ${photos}\nPast grows: ${archive}`;
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
