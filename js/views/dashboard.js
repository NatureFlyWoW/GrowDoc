// GrowDoc Companion — Dashboard (Today View)

import { generateTasks, pruneTasks, getExperienceDetail, recordTaskCompletion, recordTaskDismissal } from '../components/task-engine.js';
import { renderTaskCard, renderCustomTaskForm } from '../components/task-card.js';
import { renderTimeline } from '../components/timeline-bar.js';
import { getDaysInStage } from '../data/stage-rules.js';
import { daysSinceLog as _daysSinceLog } from '../utils.js';
import { navigate } from '../router.js';

/**
 * renderDashboard(container, store) — Main dashboard view.
 */
export function renderDashboard(container, store) {
  container.innerHTML = '';
  const grow = store.state.grow;

  if (!grow || !grow.active) {
    renderBetweenGrows(container, store);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'dashboard';

  // Zone 1: Status Banner
  renderStatusBanner(wrapper, store);

  // Prune stale completed/dismissed tasks (keeps localStorage bounded and
  // extracts interval data for the pattern tracker) then generate and
  // merge new tasks.
  const growSnap = store.getSnapshot().grow;
  const beforeCount = (growSnap.tasks || []).length;
  pruneTasks(growSnap);
  const newTasks = generateTasks(store);
  if (newTasks.length > 0) {
    if (!growSnap.tasks) growSnap.tasks = [];
    growSnap.tasks.push(...newTasks);
  }
  // Commit if pruning or new tasks changed the state
  if (newTasks.length > 0 || (growSnap.tasks || []).length !== beforeCount) {
    store.commit('grow', growSnap);
  }

  // Layout: tasks + sidebar
  const layout = document.createElement('div');
  layout.className = 'dashboard-layout';

  const mainCol = document.createElement('div');
  mainCol.className = 'dashboard-main';

  const sideCol = document.createElement('div');
  sideCol.className = 'dashboard-side';

  // Zone 2: Tasks
  const allTasks = (store.state.grow.tasks || []).filter(t =>
    t.status === 'pending' || (t.status === 'snoozed' && t.snoozeUntil && new Date(t.snoozeUntil) <= new Date())
  );
  renderTaskList(mainCol, allTasks, store);

  // Zone 3: Sidebar Widgets
  renderSidebarWidgets(sideCol, store);

  layout.appendChild(mainCol);
  layout.appendChild(sideCol);
  wrapper.appendChild(layout);
  container.appendChild(wrapper);
}

/**
 * renderStatusBanner(container, store) — Zone 1: colored status banner.
 */
export function renderStatusBanner(container, store) {
  const grow = store.state.grow;
  const tasks = grow.tasks || [];
  const plants = grow.plants || [];

  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status === 'pending');
  const recommendedTasks = tasks.filter(t => t.priority === 'recommended' && t.status === 'pending');

  let status = 'green';
  let text = '';

  const firstPlant = plants[0];
  const days = firstPlant ? getDaysInStage(firstPlant) : 0;
  const stageName = firstPlant ? firstPlant.stage : '';
  const overallDay = grow.startDate ? Math.floor((Date.now() - new Date(grow.startDate)) / 86400000) : 0;

  if (urgentTasks.length > 0) {
    status = 'red';
    text = `Check plants — ${urgentTasks[0].title}`;
  } else if (recommendedTasks.length > 0) {
    status = 'gold';
    text = `Action needed — ${recommendedTasks[0].title}`;
  } else {
    text = `All good — Day ${overallDay}, ${stageName.replace(/-/g, ' ')}`;
  }

  const banner = document.createElement('div');
  banner.className = `status-banner status-${status}`;
  banner.textContent = text;
  banner.dataset.status = status;
  container.appendChild(banner);
}

/**
 * renderTaskList(container, tasks, store) — Zone 2: sorted task cards.
 */
export function renderTaskList(container, tasks, store) {
  const profile = store.state.profile || {};
  const experience = profile.experience || 'intermediate';

  if (tasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dashboard-empty';
    empty.innerHTML = '<p>Nothing to do right now. Your plants are on track!</p><p class="text-muted">Log observations or check the knowledge base.</p>';
    container.appendChild(empty);
  } else {
    // Sort: urgent > recommended > optional
    const priorityOrder = { urgent: 0, recommended: 1, optional: 2 };
    const sorted = [...tasks].sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));

    for (const task of sorted) {
      renderTaskCard(container, task, {
        experienceLevel: experience,
        onDone: (id) => _updateTask(store, id, 'done'),
        onDismiss: (id) => _updateTask(store, id, 'dismissed'),
        onSnooze: (id, until) => _snoozeTask(store, id, until),
        onNotes: (id, notes) => _saveNotes(store, id, notes),
      });
    }
  }

  // Custom task form
  const addSection = document.createElement('div');
  addSection.style.marginTop = 'var(--space-4)';
  renderCustomTaskForm(addSection, store);
  container.appendChild(addSection);
}

/**
 * renderSidebarWidgets(container, store) — Zone 3: VPD, timeline, stats.
 */
export function renderSidebarWidgets(container, store) {
  const grow = store.state.grow;
  const plants = grow.plants || [];

  // Timeline snapshot
  const firstPlant = plants[0];
  if (firstPlant) {
    const timelineSection = document.createElement('div');
    timelineSection.className = 'sidebar-widget';
    const timelineTitle = document.createElement('h4');
    timelineTitle.textContent = 'Timeline';
    timelineSection.appendChild(timelineTitle);
    renderTimeline(timelineSection, {
      currentStage: firstPlant.stage,
      daysInStage: getDaysInStage(firstPlant),
      stageHistory: grow.stageHistory || [],
      mode: 'compact',
    });
    container.appendChild(timelineSection);
  }

  // Quick Stats
  const stats = document.createElement('div');
  stats.className = 'sidebar-widget';
  const statsTitle = document.createElement('h4');
  statsTitle.textContent = 'Quick Stats';
  stats.appendChild(statsTitle);

  for (const plant of plants) {
    const lastWater = _daysSinceLog(plant, 'water');
    const lastFeed = _daysSinceLog(plant, 'feed');
    const line = document.createElement('div');
    line.className = 'stat-line';
    line.textContent = `${plant.name}: Water ${lastWater !== null ? lastWater + 'd ago' : 'never'} | Feed ${lastFeed !== null ? lastFeed + 'd ago' : 'never'}`;
    stats.appendChild(line);
  }

  container.appendChild(stats);
}

/**
 * renderBetweenGrows(container, store) — No-active-grow dashboard.
 */
export function renderBetweenGrows(container, store) {
  const archive = store.state.archive || [];

  const wrapper = document.createElement('div');
  wrapper.className = 'between-grows';

  const h1 = document.createElement('h1');
  h1.textContent = archive.length > 0 ? 'Ready for your next grow?' : 'Welcome to GrowDoc';
  wrapper.appendChild(h1);

  if (archive.length > 0) {
    const last = archive[archive.length - 1];
    const summary = document.createElement('p');
    summary.className = 'text-muted';
    summary.textContent = `Your last grow finished ${_daysSinceDate(last.endDate)} days ago.`;
    wrapper.appendChild(summary);
  } else {
    const intro = document.createElement('p');
    intro.className = 'text-muted';
    intro.textContent = 'Set up your first grow to get started.';
    wrapper.appendChild(intro);
  }

  const startBtn = document.createElement('button');
  startBtn.className = 'btn btn-primary';
  startBtn.style.fontSize = '1.1rem';
  startBtn.style.padding = '12px 32px';
  startBtn.textContent = 'Start New Grow';
  startBtn.addEventListener('click', () => navigate('/setup'));
  wrapper.appendChild(startBtn);

  container.appendChild(wrapper);
}

// ── Helpers ──────────────────────────────────────────────────────────

function _updateTask(store, taskId, status) {
  const grow = store.getSnapshot().grow;
  const task = (grow.tasks || []).find(t => t.id === taskId);
  if (task) {
    task.status = status;
    task.completedDate = new Date().toISOString();
    // Stamp the stage at completion so the pattern tracker can scope
    // intervals per (plant, type, stage).
    const plant = (grow.plants || []).find(p => p.id === task.plantId);
    if (plant) task.stageAtCompletion = plant.stage;

    if (status === 'done') {
      recordTaskCompletion(grow, task, plant?.stage || 'unknown');
    } else if (status === 'dismissed') {
      recordTaskDismissal(grow);
    }

    store.commit('grow', grow);
    const content = document.getElementById('content');
    if (content) renderDashboard(content, store);
  }
}

function _snoozeTask(store, taskId, until) {
  const grow = store.getSnapshot().grow;
  const task = (grow.tasks || []).find(t => t.id === taskId);
  if (task) {
    task.status = 'snoozed';
    task.snoozeUntil = until;
    store.commit('grow', grow);
    const content = document.getElementById('content');
    if (content) renderDashboard(content, store);
  }
}

function _saveNotes(store, taskId, notes) {
  const grow = store.getSnapshot().grow;
  const task = (grow.tasks || []).find(t => t.id === taskId);
  if (task) {
    task.notes = notes;
    store.commit('grow', grow);
  }
}

function _daysSinceDate(dateStr) {
  if (!dateStr) return '?';
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

// ── Tests ──────────────────────────────────────────────────────────

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  const { createStore } = await import('../store.js');

  // Status banner: green when no urgent tasks
  {
    const store = createStore({
      profile: { medium: 'soil', experience: 'beginner', priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 } },
      grow: { active: true, startDate: new Date().toISOString(), plants: [{ id: 'p1', name: 'Test', stage: 'early-veg', stageStartDate: new Date().toISOString(), logs: [{ date: new Date().toISOString(), type: 'water' }], training: {}, diagnoses: [] }], tasks: [], stageHistory: [] },
      environment: { readings: [] }, archive: [], outcomes: [], ui: {}
    });
    const container = document.createElement('div');
    renderStatusBanner(container, store);
    const banner = container.querySelector('.status-banner');
    assert(banner !== null, 'status banner rendered');
    assert(banner.dataset.status === 'green' || banner.classList.contains('status-green'), 'green banner when no urgent tasks');
  }

  // Between-grows: Start New Grow button
  {
    const store = createStore({ grow: null, profile: {}, archive: [], environment: {}, outcomes: [], ui: {} });
    const container = document.createElement('div');
    renderBetweenGrows(container, store);
    const btn = container.querySelector('.btn-primary');
    assert(btn !== null, 'Start New Grow button rendered in between-grows');
    assert(btn.textContent.includes('Start New Grow'), 'button has correct label');
  }

  // Task sorting: urgent first
  {
    const tasks = [
      { id: 't1', priority: 'optional', status: 'pending', type: 'check', title: 'Opt', detail: { beginner: 'x', intermediate: 'x', expert: 'x' }, evidence: 'practitioner', notes: '' },
      { id: 't2', priority: 'urgent', status: 'pending', type: 'water', title: 'Urg', detail: { beginner: 'x', intermediate: 'x', expert: 'x' }, evidence: 'established', notes: '' },
      { id: 't3', priority: 'recommended', status: 'pending', type: 'feed', title: 'Rec', detail: { beginner: 'x', intermediate: 'x', expert: 'x' }, evidence: 'established', notes: '' },
    ];
    const store = createStore({ profile: { experience: 'intermediate' }, grow: { tasks } });
    const container = document.createElement('div');
    renderTaskList(container, tasks, store);
    const cards = container.querySelectorAll('.task-card');
    assert(cards.length >= 3, 'all task cards rendered');
    assert(cards[0].dataset.priority === 'urgent', 'urgent task first');
  }

  return results;
}
