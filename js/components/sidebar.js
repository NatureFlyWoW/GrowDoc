// GrowDoc Companion — Sidebar Navigation

import { navigate } from '../router.js';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Today',
    icon: 'dashboard',
    path: '/dashboard',
    auth: true,
    children: null,
  },
  {
    id: 'grow',
    label: 'My Grow',
    icon: 'plant',
    path: '/grow',
    auth: true,
    children: [
      { id: 'grow-plants',    label: 'Plants',      path: '/grow' },
      { id: 'grow-timeline',  label: 'Timeline',    path: '/grow/timeline' },
      { id: 'grow-training',  label: 'Training',    path: '/grow/training' },
      { id: 'grow-env',       label: 'Environment', path: '/grow/environment' },
      { id: 'grow-harvest',   label: 'Harvest',     path: '/grow/harvest' },
      { id: 'grow-feeding',   label: 'Feeding',     path: '/grow/feeding' },
      { id: 'grow-journal',   label: 'Journal',     path: '/grow/journal' },
      { id: 'grow-dry-cure',  label: 'Dry/Cure',    path: '/grow/dry-cure' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: 'wrench',
    path: '/tools/doctor',
    auth: false,
    children: [
      { id: 'tools-doctor',   label: 'Plant Doctor',  path: '/tools/doctor' },
      { id: 'tools-stealth',  label: 'Stealth Audit', path: '/tools/stealth' },
      { id: 'tools-calcs',    label: 'Calculators',   path: '/tools/calculators' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    icon: 'book',
    path: '/knowledge',
    auth: false,
    children: null,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'gear',
    path: '/settings',
    auth: true,
    children: null,
  },
];

let _collapsed = false;
let _container = null;
let _store = null;
let _activeRoute = null;
let _hasActiveGrow = false;

/** Render the sidebar into the given container. */
export function renderSidebar(container, store) {
  _container = container;
  _store = store;

  // Load collapsed state from store
  if (store && typeof store.get === 'function') {
    _collapsed = !!store.get('ui.sidebarCollapsed');
  }

  // Listen for grow state changes
  if (store && typeof store.get === 'function') {
    _hasActiveGrow = !!store.get('grow.active');
  }

  // React to grow state changes (start/finish grow)
  if (store && typeof store.subscribe === 'function') {
    store.subscribe('grow', () => {
      const newState = !!store.get('grow.active');
      if (newState !== _hasActiveGrow) {
        _hasActiveGrow = newState;
        _render();
      }
    });
  }

  _render();

  // Listen for route changes
  window.addEventListener('routechange', (e) => {
    updateActiveItem(e.detail.path);
  });
}

/** Update the active nav item based on the current route. */
export function updateActiveItem(currentRoute) {
  _activeRoute = currentRoute;
  _render();
}

/** Set sidebar collapsed state. */
export function setSidebarCollapsed(collapsed) {
  _collapsed = collapsed;
  if (_store && typeof _store.set === 'function') {
    _store.set('ui.sidebarCollapsed', collapsed);
  }
  // Update the app shell class
  const shell = document.querySelector('.app-shell');
  if (shell) {
    shell.classList.toggle('sidebar-collapsed', collapsed);
  }
  _render();
}

function _isActive(path) {
  if (!_activeRoute) return false;
  // Exact match for leaf paths, prefix match only for parent groups
  return _activeRoute === path;
}

function _isActivePrefix(path) {
  if (!_activeRoute) return false;
  return _activeRoute === path || _activeRoute.startsWith(path + '/');
}

function _isGroupActive(item) {
  if (_isActivePrefix(item.path)) return true;
  if (item.children) {
    return item.children.some(child => _isActive(child.path));
  }
  return false;
}

function _render() {
  if (!_container) return;

  const nav = document.createElement('div');
  nav.className = 'sidebar-inner';

  // Logo / brand
  const brand = document.createElement('div');
  brand.className = 'sidebar-brand';
  if (_collapsed) {
    brand.innerHTML = '<span class="sidebar-brand-icon">&#127807;</span>';
  } else {
    brand.innerHTML = '<span class="sidebar-brand-icon">&#127807;</span><span class="sidebar-brand-text">GrowDoc</span>';
  }
  nav.appendChild(brand);

  // Nav items
  const navList = document.createElement('div');
  navList.className = 'sidebar-nav';

  for (const item of NAV_ITEMS) {
    const groupActive = _isGroupActive(item);

    // Parent item
    const link = document.createElement('a');
    link.href = item.path;
    link.className = 'nav-link' + (groupActive ? ' active' : '');
    if (groupActive) link.setAttribute('aria-current', 'page');
    link.dataset.navId = item.id;

    const iconEl = document.createElement('span');
    iconEl.className = 'nav-icon';
    iconEl.innerHTML = _getIcon(item.icon);
    link.appendChild(iconEl);

    if (!_collapsed) {
      const labelEl = document.createElement('span');
      labelEl.className = 'nav-label';
      labelEl.textContent = item.label;
      link.appendChild(labelEl);
    }

    link.title = item.label;
    navList.appendChild(link);

    // Children (only when expanded and group is active or always show tools)
    if (item.children && !_collapsed) {
      const childList = document.createElement('div');
      childList.className = 'nav-children';

      for (const child of item.children) {
        const childLink = document.createElement('a');
        childLink.href = child.path;
        childLink.className = 'nav-child-link' + (_isActive(child.path) ? ' active' : '');
        childLink.textContent = child.label;
        childLink.dataset.navId = child.id;

        // Between-grows mode: disable My Grow sub-items when no active grow
        if (item.id === 'grow' && !_hasActiveGrow) {
          childLink.classList.add('disabled');
          childLink.setAttribute('aria-disabled', 'true');
          childLink.setAttribute('tabindex', '-1');
          childLink.removeAttribute('href');
          childLink.addEventListener('click', (e) => {
            e.preventDefault();
            _showDisabledTooltip(childLink);
          });
        }

        childList.appendChild(childLink);
      }
      navList.appendChild(childList);
    }
  }

  nav.appendChild(navList);

  // Collapse toggle button at bottom
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'sidebar-toggle';
  toggleBtn.setAttribute('aria-expanded', String(!_collapsed));
  toggleBtn.setAttribute('aria-label', _collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  toggleBtn.innerHTML = _collapsed ? '&#x276F;' : '&#x276E;';
  toggleBtn.addEventListener('click', () => {
    setSidebarCollapsed(!_collapsed);
  });
  nav.appendChild(toggleBtn);

  _container.innerHTML = '';
  _container.appendChild(nav);
}

function _showDisabledTooltip(element) {
  // Remove any existing tooltip
  const existing = document.querySelector('.nav-tooltip');
  if (existing) existing.remove();

  const tooltip = document.createElement('div');
  tooltip.className = 'nav-tooltip';
  tooltip.textContent = 'Start a grow to access this feature.';
  element.style.position = 'relative';
  element.appendChild(tooltip);
  setTimeout(() => tooltip.remove(), 2500);
}

function _getIcon(name) {
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    plant: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V8"/><path d="M5 12c0-4 3-7 7-7s7 3 7 7"/><path d="M8 17c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  };
  return icons[name] || '';
}

/** Export NAV_ITEMS for testing */
export { NAV_ITEMS };


// ── Tests ──────────────────────────────────────────────────────────────

export function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // Nav items structure
  assert(NAV_ITEMS.length === 5, 'sidebar has 5 top-level nav items');
  const labels = NAV_ITEMS.map(i => i.label);
  assert(labels.includes('Today'), 'nav includes Today');
  assert(labels.includes('My Grow'), 'nav includes My Grow');
  assert(labels.includes('Tools'), 'nav includes Tools');
  assert(labels.includes('Knowledge Base'), 'nav includes Knowledge Base');
  assert(labels.includes('Settings'), 'nav includes Settings');

  // My Grow children
  const myGrow = NAV_ITEMS.find(i => i.id === 'grow');
  assert(myGrow.children.length === 8, 'My Grow has 8 sub-items');
  const childLabels = myGrow.children.map(c => c.label);
  assert(childLabels.includes('Plants'), 'My Grow includes Plants');
  assert(childLabels.includes('Training'), 'My Grow includes Training');
  assert(childLabels.includes('Dry/Cure'), 'My Grow includes Dry/Cure');

  // Tools children
  const tools = NAV_ITEMS.find(i => i.id === 'tools');
  assert(tools.children.length === 3, 'Tools has 3 sub-items');
  assert(tools.children[0].label === 'Plant Doctor', 'Tools includes Plant Doctor');
  assert(tools.children[1].label === 'Stealth Audit', 'Tools includes Stealth Audit');
  assert(tools.children[2].label === 'Calculators', 'Tools includes Calculators');

  // Collapsed state test (DOM-based)
  const testContainer = document.createElement('nav');
  testContainer.id = 'sidebar-test';
  testContainer.style.display = 'none';
  document.body.appendChild(testContainer);

  // Mock store
  const mockStore = {
    _data: {},
    get(key) { return this._data[key]; },
    set(key, val) { this._data[key] = val; },
  };

  // Render sidebar
  renderSidebar(testContainer, mockStore);

  // Verify rendered nav items
  const links = testContainer.querySelectorAll('.nav-link');
  assert(links.length === 5, 'sidebar renders 5 nav links');

  // Toggle test
  const toggleBtn = testContainer.querySelector('.sidebar-toggle');
  assert(toggleBtn !== null, 'sidebar has toggle button');
  assert(toggleBtn.getAttribute('aria-expanded') === 'true', 'toggle shows expanded state initially');

  // Set collapsed
  setSidebarCollapsed(true);
  const toggleAfter = testContainer.querySelector('.sidebar-toggle');
  assert(toggleAfter.getAttribute('aria-expanded') === 'false', 'collapsed state shows aria-expanded=false');

  // Collapsed: no labels visible
  const labelsInCollapsed = testContainer.querySelectorAll('.nav-label');
  assert(labelsInCollapsed.length === 0, 'collapsed state hides nav labels');

  // Expand back
  setSidebarCollapsed(false);
  const labelsExpanded = testContainer.querySelectorAll('.nav-label');
  assert(labelsExpanded.length === 5, 'expanded state shows nav labels');

  // Between-grows mode: disable My Grow sub-items
  mockStore._data['grow.active'] = false;
  _hasActiveGrow = false;
  _render();
  const disabledLinks = testContainer.querySelectorAll('.nav-child-link.disabled');
  assert(disabledLinks.length > 0, 'between-grows mode disables My Grow sub-items');

  // Active section highlighting
  _activeRoute = '/dashboard';
  _render();
  const activeLink = testContainer.querySelector('.nav-link.active');
  assert(activeLink !== null, 'active section is highlighted');
  assert(activeLink.dataset.navId === 'dashboard', 'correct nav item is active for /dashboard');

  // Cleanup
  testContainer.remove();

  return results;
}
