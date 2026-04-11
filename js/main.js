// GrowDoc Companion — App Entry Point

import { initRouter, navigate } from './router.js';
import { renderSidebar } from './components/sidebar.js';
import { createStore } from './store.js';
import { load, save, migrate, STORAGE_KEYS, compactEnvironmentReadings, validateShape, checkQuota } from './storage.js';
import { debounce } from './utils.js';
import { renderLanding, renderOnboarding } from './views/onboarding.js';
import { renderDashboard } from './views/dashboard.js';
import { renderEnvironmentView } from './views/environment.js';
import { renderMyGrow } from './views/my-grow.js';
import { renderPlantDetail } from './views/plant-detail.js';
import { renderFeedingView } from './views/feeding.js';
import { renderDryCureView, renderTimeline as renderTimelineBar, renderStageDetail, advancePlantStage } from './components/timeline-bar.js';
import { getDaysInStage } from './data/stage-rules.js';
import { renderTrainingView } from './views/training.js';
import { renderHarvestView } from './views/harvest.js';
import { renderPlantDoctor } from './plant-doctor/doctor-ui.js';
import { renderKnowledgeView, renderMythsView } from './views/knowledge.js';
import { renderToolsView } from './views/tools.js';
import { renderCalculators } from './views/calculators.js';
import { renderSettingsView } from './views/settings.js';
import { renderJournal } from './views/journal.js';
import { preInitMigration, postInitMigration } from './migration.js';

/** Initialize reactive store with persisted state. */
function initStore() {
  // Load, run schema migrations, then validate the shape so a corrupted
  // localStorage entry can't crash the app on boot.
  const profile = validateShape('profile', migrate('profile', load('profile') || {}));
  const grow = validateShape('grow', migrate('grow', load('grow') || {}));
  const environment = validateShape('environment', migrate('environment', load('environment') || { readings: [] }));
  const archive = validateShape('archive', migrate('archive', load('archive') || []));
  const outcomes = validateShape('outcomes', migrate('outcomes', load('outcomes') || []));
  const ui = validateShape('ui', migrate('ui', load('ui') || { sidebarCollapsed: false }));

  const store = createStore({
    profile,
    grow,
    environment,
    archive,
    outcomes,
    ui,
  });

  // Auto-save on commit: each top-level key gets its own debounced
  // save function so rapid commits to one key don't cancel saves for
  // unrelated keys. 300ms debounce window.
  const persistKeys = ['profile', 'grow', 'environment', 'archive', 'outcomes', 'ui'];
  for (const key of persistKeys) {
    const debouncedSave = debounce(() => save(key, store.state[key]), 300);
    store.subscribe(key, () => debouncedSave());
  }

  return store;
}

/** View map: route view names -> render functions. */
const viewMap = {
  'landing': renderLanding,
  'onboarding': (container) => renderOnboarding(container, null),
  'test-runner': renderTestRunner,
  'dashboard': (container) => renderDashboard(container, window.__growdocStore),
  'environment': (container) => renderEnvironmentView(container, window.__growdocStore),
  'my-grow': (container) => renderMyGrow(container, window.__growdocStore),
  'timeline': (container) => {
    const store = window.__growdocStore;
    const grow = store?.state?.grow;
    const plant = grow?.plants?.[0];
    if (!plant) { container.innerHTML = '<p class="text-muted">No active grow.</p>'; return; }
    container.innerHTML = '';
    const h1 = document.createElement('h1'); h1.textContent = 'Growth Timeline'; container.appendChild(h1);
    const detailTarget = document.createElement('div');
    detailTarget.className = 'stage-detail-target';
    const showDetail = (stageId) => {
      detailTarget.innerHTML = '';
      renderStageDetail(detailTarget, stageId, {
        currentStage: plant.stage,
        onAdvance: (nextId) => { advancePlantStage(store, plant.id, nextId); navigate('/grow/timeline'); },
        onStageChange: (newId) => { advancePlantStage(store, plant.id, newId); navigate('/grow/timeline'); },
      });
    };
    renderTimelineBar(container, {
      currentStage: plant.stage, daysInStage: getDaysInStage(plant),
      stageHistory: grow.stageHistory || [], mode: 'full',
      onStageClick: showDetail,
      onAdvance: (nextId) => { advancePlantStage(store, plant.id, nextId); navigate('/grow/timeline'); },
      plantId: plant.id, _store: store,
    });
    container.appendChild(detailTarget);
  },
  'plant-detail': (container, params) => renderPlantDetail(container, window.__growdocStore, params?.id, params?._hash),
  'feeding': (container) => renderFeedingView(container, window.__growdocStore),
  'dry-cure': (container) => renderDryCureView(container, window.__growdocStore),
  'training': (container) => renderTrainingView(container, window.__growdocStore),
  'harvest': (container) => renderHarvestView(container, window.__growdocStore),
  'doctor': (container) => renderPlantDoctor(container, window.__growdocStore),
  'knowledge': (container) => renderKnowledgeView(container, window.__growdocStore),
  'myths': (container) => renderMythsView(container),
  'tools': (container, params) => renderToolsView(container, window.__growdocStore, params?.id),
  'stealth': (container) => renderToolsView(container, window.__growdocStore, 'stealth'),
  'calculators': (container) => renderCalculators(container, window.__growdocStore),
  'settings': (container) => renderSettingsView(container, window.__growdocStore),
  'journal': (container) => renderJournal(container, window.__growdocStore),
};

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('content');

  if (!sidebar || !content) {
    showErrorScreen('App structure is missing. Please reload.');
    return;
  }

  try {
    // Phase 1: Rewrite legacy v1 data into v2 localStorage keys
    // BEFORE the store reads them. Idempotent via flag check.
    preInitMigration();

    // Initialize store with persisted state (now including migrated data)
    const store = initStore();

    // Phase 2: Store-dependent migration steps (placeholder hook)
    postInitMigration(store);

    // Run environment data compaction (daily to weekly for old readings)
    compactEnvironmentReadings();

    // Quota snapshot — log warnings/critical on app boot so users know
    // before they hit the wall. Section 11 builds a UI dashboard for this.
    const quota = checkQuota();
    if (quota.status === 'warning') {
      console.warn(`Storage at ${quota.percent}% — consider exporting your data soon.`);
    } else if (quota.status === 'critical') {
      console.error(`Storage at ${quota.percent}% — almost full. Free up space in Settings.`);
    }

    // Make store accessible for other modules
    window.__growdocStore = store;

    // Initialize sidebar
    renderSidebar(sidebar, store);

    // Initialize router with content area and view map
    initRouter(content, viewMap);
  } catch (err) {
    console.error('App initialization failed:', err);
    showErrorScreen('Something went wrong during startup.');
  }
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});


// ── Error Recovery Screen ──────────────────────────────────────────────

function showErrorScreen(message) {
  document.body.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'error-screen';

  const h1 = document.createElement('h1');
  h1.textContent = 'Something Went Wrong';
  screen.appendChild(h1);

  const p = document.createElement('p');
  p.textContent = message;
  screen.appendChild(p);

  const actions = document.createElement('div');
  actions.className = 'error-actions';

  const reloadBtn = document.createElement('button');
  reloadBtn.className = 'btn btn-primary';
  reloadBtn.textContent = 'Reload App';
  reloadBtn.addEventListener('click', () => location.reload());
  actions.appendChild(reloadBtn);

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn';
  exportBtn.textContent = 'Export Your Data';
  exportBtn.addEventListener('click', exportData);
  actions.appendChild(exportBtn);

  // Restore backup button (shown if pre-migration backup keys exist)
  const hasBackup = _hasBackupKeys();
  if (hasBackup) {
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn';
    restoreBtn.textContent = 'Restore Backup';
    restoreBtn.addEventListener('click', restoreBackup);
    actions.appendChild(restoreBtn);
  }

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-danger';
  resetBtn.textContent = 'Reset App Data';
  resetBtn.addEventListener('click', resetData);
  actions.appendChild(resetBtn);

  screen.appendChild(actions);
  document.body.appendChild(screen);
}

function exportData() {
  try {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('growdoc-companion')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growdoc-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Export failed: ' + err.message);
  }
}

function _hasBackupKeys() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('growdoc-companion-backup')) return true;
    }
  } catch { /* ignore */ }
  return false;
}

function restoreBackup() {
  if (!confirm('This will restore from the most recent backup. Current data will be overwritten. Continue?')) return;
  try {
    const backupKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('growdoc-companion-backup-')) backupKeys.push(key);
    }
    for (const bk of backupKeys) {
      // Backup keys are: growdoc-companion-backup-{original-legacy-key}
      // Restore the original legacy key so the next migration re-imports it
      const originalKey = bk.replace('growdoc-companion-backup-', '');
      const val = localStorage.getItem(bk);
      if (val) localStorage.setItem(originalKey, val);
    }
    // Clear migration flag so re-import runs on reload
    localStorage.removeItem('growdoc-companion-migrated');
    location.reload();
  } catch (err) {
    alert('Restore failed: ' + err.message);
  }
}

function resetData() {
  if (!confirm('This will delete all GrowDoc Companion data. Are you sure?')) return;
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('growdoc-companion')) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
    location.reload();
  } catch (err) {
    alert('Reset failed: ' + err.message);
  }
}


// ── Test Runner View ───────────────────────────────────────────────────

async function renderTestRunner(container) {
  container.innerHTML = '<h1>GrowDoc Test Runner</h1><div id="test-output" class="text-mono" style="font-size:0.85rem;"></div>';

  const output = document.getElementById('test-output');
  const modules = [
    { name: 'utils', path: './utils.js' },
    { name: 'store', path: './store.js' },
    { name: 'storage', path: './storage.js' },
    { name: 'router', path: './router.js' },
    { name: 'sidebar', path: './components/sidebar.js' },
    { name: 'onboarding', path: './views/onboarding.js' },
    { name: 'vercel-config', path: './tests/vercel-config.test.js' },
    { name: 'grow-knowledge', path: './tests/grow-knowledge.test.js' },
    { name: 'strain-database', path: './tests/strain-database.test.js' },
    { name: 'priority-system', path: './tests/priority-system.test.js' },
    { name: 'stage-timeline', path: './tests/stage-timeline.test.js' },
    { name: 'task-engine', path: './tests/task-engine.test.js' },
    { name: 'dashboard', path: './views/dashboard.js' },
    { name: 'vpd-widget', path: './components/vpd-widget.js' },
    { name: 'feeding-calculator', path: './data/feeding-calculator.js' },
  ];

  let totalPass = 0;
  let totalFail = 0;

  for (const mod of modules) {
    try {
      const m = await import(mod.path);
      if (typeof m.runTests !== 'function') {
        output.innerHTML += `<div style="color:var(--text-muted)">-- ${mod.name}: no runTests() exported --</div>`;
        continue;
      }
      const results = await m.runTests();
      const passed = results.filter(r => r.pass).length;
      const failed = results.filter(r => !r.pass).length;
      totalPass += passed;
      totalFail += failed;

      const color = failed > 0 ? 'var(--status-urgent)' : 'var(--status-good)';
      output.innerHTML += `<div style="color:${color};margin-top:12px;font-weight:600">
        ${failed > 0 ? 'FAIL' : 'PASS'} ${mod.name}: ${passed}/${results.length} passed
      </div>`;

      for (const r of results) {
        const icon = r.pass ? '<span style="color:var(--status-good)">PASS</span>' : '<span style="color:var(--status-urgent)">FAIL</span>';
        output.innerHTML += `<div style="padding-left:16px">${icon} ${r.msg}</div>`;
      }
    } catch (err) {
      totalFail++;
      output.innerHTML += `<div style="color:var(--status-urgent);margin-top:12px">ERROR ${mod.name}: ${err.message}</div>`;
    }
  }

  // Summary
  const summaryColor = totalFail > 0 ? 'var(--status-urgent)' : 'var(--status-good)';
  output.innerHTML = `<div style="color:${summaryColor};font-size:1.1rem;margin-bottom:16px;padding:8px;border:1px solid ${summaryColor};border-radius:4px">
    ${totalFail > 0 ? 'SOME TESTS FAILED' : 'ALL TESTS PASSED'}: ${totalPass} passed, ${totalFail} failed
  </div>` + output.innerHTML;
}
