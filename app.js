const STATUS_CONFIG = {
  'OPEN':        { color: '#8b7355', label: 'OPEN' },
  'IN PROGRESS': { color: '#185FA5', label: 'IN PROGRESS' },
  'HALTED':      { color: '#BA7517', label: 'HALTED' },
  'IN REVIEW':   { color: '#534AB7', label: 'IN REVIEW' },
  'DONE':        { color: '#3B6D11', label: 'DONE' }
};
const ALL_STATUSES = Object.keys(STATUS_CONFIG);

let docs = [];
let activeId = null;
let activeFilters = new Set(ALL_STATUSES);

async function loadDocs() {
  try {
    const res = await fetch('docs/docs.json?t=' + Date.now());
    if (!res.ok) throw new Error('Failed to load docs.json');
    docs = await res.json();
    if (docs.length > 0) activeId = docs[0].id;
    render();
  } catch (err) {
    document.getElementById('viewer-title').textContent = 'Error loading docs';
    document.getElementById('viewer-meta').textContent = err.message;
  }
}

function statusBadge(status) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['OPEN'];
  return `<span class="status-badge" style="background:${cfg.color}">${cfg.label}</span>`;
}

function render() {
  const visibleDocs = docs.filter(d => activeFilters.has(d.status || 'OPEN'));
  if (visibleDocs.length > 0 && !visibleDocs.find(d => d.id === activeId)) {
    activeId = visibleDocs[0].id;
  }
  const active = docs.find(d => d.id === activeId);

  // Filter bar
  document.getElementById('filter-bar').innerHTML = ALL_STATUSES.map(s => {
    const cfg = STATUS_CONFIG[s];
    const on = activeFilters.has(s);
    const count = docs.filter(d => (d.status || 'OPEN') === s).length;
    return `<button class="filter-chip ${on ? 'on' : 'off'}" style="--chip:${cfg.color}" onclick="toggleFilter('${s}')">${cfg.label} <span class="count">${count}</span></button>`;
  }).join('');

  // Sidebar
  document.getElementById('nav-list').innerHTML = visibleDocs.map(d => `
    <div class="nav-item ${d.id === activeId ? 'active' : ''}" onclick="select('${d.id}')">
      <div class="nav-line">
        <span class="icon">${d.icon}</span>
        <span class="nav-title">${d.title}</span>
      </div>
      ${statusBadge(d.status || 'OPEN')}
    </div>
  `).join('') || '<div class="nav-empty">No docs match the current filter.</div>';

  // Mobile nav
  document.getElementById('mobile-nav').innerHTML = visibleDocs.map(d => `
    <div class="mobile-nav-item ${d.id === activeId ? 'active' : ''}" onclick="select('${d.id}')">
      ${d.icon} ${d.title}
    </div>
  `).join('');

  // Viewer
  if (active) {
    document.getElementById('viewer-title').textContent = active.title;
    document.getElementById('viewer-meta').innerHTML =
      active.subtitle + ' · ' + statusBadge(active.status || 'OPEN');
    const iframe = document.getElementById('viewer-iframe');
    iframe.src = 'docs/' + active.file + '?t=' + Date.now();
  } else {
    document.getElementById('viewer-title').textContent = '';
    document.getElementById('viewer-meta').textContent = '';
    document.getElementById('viewer-iframe').src = 'about:blank';
  }
}

function select(id) {
  activeId = id;
  render();
}

function toggleFilter(status) {
  if (activeFilters.has(status)) activeFilters.delete(status);
  else activeFilters.add(status);
  render();
}

document.addEventListener('DOMContentLoaded', loadDocs);
