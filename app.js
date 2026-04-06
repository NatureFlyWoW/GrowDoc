const STATUS_CONFIG = {
  'OPEN':        { color: '#8b7355', label: 'OPEN' },
  'IN PROGRESS': { color: '#185FA5', label: 'IN PROGRESS' },
  'HALTED':      { color: '#BA7517', label: 'HALTED' },
  'IN REVIEW':   { color: '#534AB7', label: 'IN REVIEW' },
  'DONE':        { color: '#3B6D11', label: 'DONE' }
};
const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const PRIORITY_GROUPS = [
  { priority: 1, label: 'Urgent Care', desc: 'Next days & weeks' },
  { priority: 2, label: 'Setup & Supplies', desc: 'Refining the grow' },
  { priority: 3, label: 'Future Runs', desc: 'Pheno hunting & yield goals' },
  { priority: 4, label: 'Reference', desc: 'Glossary & general knowledge' }
];

let docs = [];
let activeId = null;
let activeFilters = new Set(ALL_STATUSES);
let lastLoadedSrc = '';

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
  if (visibleDocs.length === 0) {
    activeId = null;
  } else if (!visibleDocs.find(d => d.id === activeId)) {
    activeId = visibleDocs[0].id;
  }
  const active = visibleDocs.find(d => d.id === activeId) ?? null;

  // Filter bar
  document.getElementById('filter-bar').innerHTML = ALL_STATUSES.map(s => {
    const cfg = STATUS_CONFIG[s];
    const on = activeFilters.has(s);
    const count = docs.filter(d => (d.status || 'OPEN') === s).length;
    return `<button class="filter-chip ${on ? 'on' : 'off'}" style="--chip:${cfg.color}" aria-pressed="${on}" onclick="toggleFilter('${s}')">${cfg.label} <span class="count">${count}</span></button>`;
  }).join('');

  // Sidebar — grouped by priority
  let sidebarHTML = '';
  for (const group of PRIORITY_GROUPS) {
    const groupDocs = visibleDocs.filter(d => (d.priority ?? 4) === group.priority);
    if (groupDocs.length === 0) continue;
    sidebarHTML += `<div class="priority-group prio-${group.priority}">`;
    sidebarHTML += `<div class="priority-header" role="heading" aria-level="3">`;
    sidebarHTML += `<span class="priority-label">${group.label}</span>`;
    sidebarHTML += `<span class="priority-desc">${group.desc}</span>`;
    sidebarHTML += `</div>`;
    sidebarHTML += groupDocs.map(d => `
      <div class="nav-item cat-${d.category || 'none'} ${d.id === activeId ? 'active' : ''}"
           role="button" tabindex="0" ${d.id === activeId ? 'aria-current="page"' : ''}
           onclick="select('${d.id}')"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();select('${d.id}')}">
        <div class="nav-line">
          <span class="icon">${d.icon}</span>
          <span class="nav-title">${d.title}</span>
        </div>
        ${statusBadge(d.status || 'OPEN')}
      </div>
    `).join('');
    sidebarHTML += `</div>`;
  }
  document.getElementById('nav-list').innerHTML = sidebarHTML || '<div class="nav-empty">No docs match the current filter.</div>';

  // Mobile nav — sorted by priority
  const sortedDocs = [...visibleDocs].sort((a, b) => (a.priority ?? 4) - (b.priority ?? 4));
  document.getElementById('mobile-nav').innerHTML = sortedDocs.map(d => `
    <div class="mobile-nav-item cat-${d.category || 'none'} ${d.id === activeId ? 'active' : ''}"
         role="button" tabindex="0" ${d.id === activeId ? 'aria-current="page"' : ''}
         onclick="select('${d.id}')"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();select('${d.id}')}">
      ${d.icon} ${d.title}
    </div>
  `).join('');

  // Viewer — only reload iframe when doc actually changes
  if (active) {
    document.getElementById('viewer-title').textContent = active.title;
    document.getElementById('viewer-meta').innerHTML =
      active.subtitle + ' · ' + statusBadge(active.status || 'OPEN');
    const newSrc = 'docs/' + active.file;
    if (lastLoadedSrc !== newSrc) {
      document.getElementById('viewer-iframe').src = newSrc + '?t=' + Date.now();
      lastLoadedSrc = newSrc;
    }
  } else {
    document.getElementById('viewer-title').textContent = '';
    document.getElementById('viewer-meta').textContent = '';
    document.getElementById('viewer-iframe').src = 'about:blank';
    lastLoadedSrc = '';
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
