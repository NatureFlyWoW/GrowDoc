// GrowDoc Companion — Task Card UI Component

import { escapeHtml } from '../utils.js';
import { getExperienceDetail } from './task-engine.js';

const PRIORITY_COLORS = { urgent: 'var(--status-urgent)', recommended: 'var(--status-action)', optional: 'var(--status-good)' };
const EVIDENCE_COLORS = { established: 'var(--evidence-strong)', promising: 'var(--evidence-moderate)', speculative: 'var(--evidence-emerging)', practitioner: 'var(--evidence-anecdotal)' };
const TYPE_ICONS = { water: '💧', feed: '🧪', train: '✂️', defoliate: '🍃', check: '🔍', harvest: '🌾', stage: '📈', custom: '📝' };

/**
 * renderTaskCard(container, task, options) — Renders a task card with actions.
 */
export function renderTaskCard(container, task, options = {}) {
  const { experienceLevel = 'intermediate', onDone, onDismiss, onSnooze, onNotes } = options;

  const card = document.createElement('div');
  card.className = 'task-card';
  card.dataset.taskId = task.id;
  card.dataset.priority = task.priority;

  // Header: icon + title + priority badge
  const header = document.createElement('div');
  header.className = 'task-card-header';

  const icon = document.createElement('span');
  icon.className = 'task-icon';
  icon.textContent = TYPE_ICONS[task.type] || '📋';

  const title = document.createElement('span');
  title.className = 'task-title';
  title.textContent = task.title;

  const badge = document.createElement('span');
  badge.className = 'task-badge';
  badge.style.color = PRIORITY_COLORS[task.priority] || 'var(--text-muted)';
  badge.textContent = task.priority;

  header.appendChild(icon);
  header.appendChild(title);
  header.appendChild(badge);
  card.appendChild(header);

  // Detail text (experience-level selected)
  const detail = document.createElement('div');
  detail.className = 'task-detail';
  detail.textContent = getExperienceDetail(task, experienceLevel);
  card.appendChild(detail);

  // Expandable Layer 2
  const expandable = document.createElement('div');
  expandable.className = 'task-expandable';
  expandable.style.display = 'none';

  if (task.evidence) {
    const evBadge = document.createElement('span');
    evBadge.className = 'evidence-badge';
    evBadge.style.color = EVIDENCE_COLORS[task.evidence] || 'var(--text-muted)';
    evBadge.textContent = task.evidence;
    expandable.appendChild(evBadge);
  }

  if (task.notes) {
    const notesEl = document.createElement('div');
    notesEl.className = 'task-notes-display';
    notesEl.textContent = task.notes;
    expandable.appendChild(notesEl);
  }

  card.appendChild(expandable);

  // Toggle expand
  header.style.cursor = 'pointer';
  header.addEventListener('click', () => {
    expandable.style.display = expandable.style.display === 'none' ? '' : 'none';
  });

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const doneBtn = _actionBtn('Done', 'btn-primary btn-sm', () => { if (onDone) onDone(task.id); });
  const dismissBtn = _actionBtn('Dismiss', 'btn-sm', () => { if (onDismiss) onDismiss(task.id); });
  const snoozeBtn = _actionBtn('Snooze', 'btn-sm', () => {
    const until = new Date(Date.now() + 86400000).toISOString();
    if (onSnooze) onSnooze(task.id, until);
  });
  const notesBtn = _actionBtn('Notes', 'btn-sm', () => {
    _toggleNotesInput(expandable, task, onNotes);
    expandable.style.display = '';
  });

  actions.appendChild(doneBtn);
  actions.appendChild(dismissBtn);
  actions.appendChild(snoozeBtn);
  actions.appendChild(notesBtn);
  card.appendChild(actions);

  container.appendChild(card);
  return { element: card };
}

function _actionBtn(label, className, onClick) {
  const btn = document.createElement('button');
  btn.className = `btn ${className}`;
  btn.textContent = label;
  btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  return btn;
}

function _toggleNotesInput(expandable, task, onNotes) {
  let input = expandable.querySelector('.task-notes-input');
  if (input) { input.focus(); return; }

  const group = document.createElement('div');
  group.className = 'task-notes-input-group';

  input = document.createElement('textarea');
  input.className = 'input task-notes-input';
  input.rows = 2;
  input.value = task.notes || '';
  input.placeholder = 'Add a note...';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary btn-sm';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => {
    const sanitized = escapeHtml(input.value);
    task.notes = sanitized;
    if (onNotes) onNotes(task.id, sanitized);
  });

  group.appendChild(input);
  group.appendChild(saveBtn);
  expandable.appendChild(group);
  input.focus();
}

/**
 * renderCustomTaskForm(container, store) — Renders the "Add custom task" form.
 */
export function renderCustomTaskForm(container, store) {
  const form = document.createElement('div');
  form.className = 'custom-task-form';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'input';
  titleInput.placeholder = 'Task description...';

  const prioritySelect = document.createElement('select');
  prioritySelect.className = 'input';
  for (const p of ['recommended', 'urgent', 'optional']) {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
    prioritySelect.appendChild(opt);
  }

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-primary btn-sm';
  addBtn.textContent = 'Add Task';
  addBtn.addEventListener('click', () => {
    const text = escapeHtml(titleInput.value.trim());
    if (!text) return;
    const grow = store.getSnapshot().grow;
    if (!grow.tasks) grow.tasks = [];
    grow.tasks.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      plantId: 'all',
      type: 'custom',
      priority: prioritySelect.value,
      title: text,
      detail: { beginner: text, intermediate: text, expert: text },
      evidence: null,
      status: 'pending',
      snoozeUntil: null,
      notes: '',
      generatedDate: new Date().toISOString(),
      completedDate: null,
    });
    store.commit('grow', grow);
    titleInput.value = '';
  });

  form.appendChild(titleInput);
  form.appendChild(prioritySelect);
  form.appendChild(addBtn);
  container.appendChild(form);
}
