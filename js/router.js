// GrowDoc Companion — Client-Side Router (History API)

const ROUTES = [
  { path: '/',                  view: 'landing',      auth: false },
  { path: '/setup',             view: 'onboarding',   auth: false },
  { path: '/dashboard',         view: 'dashboard',    auth: true  },
  { path: '/grow',              view: 'my-grow',      auth: true  },
  { path: '/grow/plant/:id',    view: 'plant-detail', auth: true  },
  { path: '/grow/timeline',     view: 'timeline',     auth: true  },
  { path: '/grow/training',     view: 'training',     auth: true  },
  { path: '/grow/environment',  view: 'environment',  auth: true  },
  { path: '/grow/harvest',      view: 'harvest',      auth: true  },
  { path: '/grow/feeding',      view: 'feeding',      auth: true  },
  { path: '/grow/journal',      view: 'journal',      auth: true  },
  { path: '/grow/dry-cure',     view: 'dry-cure',     auth: true  },
  { path: '/tools/doctor',      view: 'doctor',       auth: false },
  { path: '/tools/stealth',     view: 'stealth',      auth: false },
  { path: '/tools/calculators', view: 'calculators',  auth: false },
  { path: '/knowledge',         view: 'knowledge',    auth: false },
  { path: '/knowledge/myths',   view: 'myths',        auth: false },
  { path: '/settings',          view: 'settings',     auth: true  },
  { path: '/finish',            view: 'finish',       auth: true  },
  { path: '/test',              view: 'test-runner',  auth: false },
];

let _contentEl = null;
let _viewMap = {};
let _currentRoute = null;

/**
 * Match a pathname to a route definition.
 * Returns { route, params } or null if no match.
 */
export function matchRoute(pathname) {
  // Normalize: strip trailing slash (except root)
  const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');

  for (const route of ROUTES) {
    const paramNames = [];
    // Convert route path to regex: :param -> capture group
    const pattern = route.path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${pattern}$`);
    const match = path.match(regex);
    if (match) {
      const params = {};
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { route, params };
    }
  }
  return null;
}

/** Get the current route info. */
export function getCurrentRoute() {
  return _currentRoute;
}

/** Navigate to a path via pushState. Supports hash fragments (e.g., /grow/plant/id#edit). */
export function navigate(path) {
  const [pathname, hash] = path.split('#');
  const fullPath = hash ? `${pathname}#${hash}` : pathname;
  if (fullPath === window.location.pathname + window.location.hash) return;
  window.history.pushState(null, '', fullPath);
  _handleRoute();
}

/** Initialize the router. Call once on app startup. */
export function initRouter(contentEl, viewMap) {
  _contentEl = contentEl;
  _viewMap = viewMap;

  // Intercept link clicks for SPA navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    // Only intercept internal links (starts with /)
    if (!href || !href.startsWith('/') || link.hasAttribute('data-external')) return;
    e.preventDefault();
    navigate(href);
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => _handleRoute());

  // Route to current URL
  _handleRoute();
}

function _handleRoute() {
  const pathname = window.location.pathname;
  const hash = window.location.hash.replace('#', '');
  const matched = matchRoute(pathname);

  // Check first-visit: no profile -> landing
  const hasProfile = _hasProfile();

  if (!matched) {
    // Unknown route -> dashboard (or landing if no profile)
    _currentRoute = { view: hasProfile ? 'dashboard' : 'landing', params: {} };
    _renderView(_currentRoute.view, _currentRoute.params);
    return;
  }

  const { route, params } = matched;

  // Landing redirect: if profile exists and visiting /, go to dashboard
  if (route.path === '/' && hasProfile) {
    window.history.replaceState(null, '', '/dashboard');
    _currentRoute = { view: 'dashboard', params: {} };
    _renderView('dashboard', {});
    return;
  }

  // Auth guard: routes requiring auth redirect to landing if no profile
  if (route.auth && !hasProfile) {
    window.history.replaceState(null, '', '/');
    _currentRoute = { view: 'landing', params: {} };
    _renderView('landing', {});
    return;
  }

  if (hash) params._hash = hash;
  _currentRoute = { view: route.view, params };
  _renderView(route.view, params);
}

function _hasProfile() {
  try {
    return !!localStorage.getItem('growdoc-companion-profile');
  } catch {
    return false;
  }
}

function _renderView(viewName, params) {
  if (!_contentEl) return;

  const viewFn = _viewMap[viewName];
  if (viewFn) {
    viewFn(_contentEl, params);
  } else {
    // Placeholder for views not yet implemented
    _contentEl.innerHTML = '';
    const h1 = document.createElement('h1');
    h1.textContent = viewName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const p = document.createElement('p');
    p.textContent = 'This view is coming soon.';
    p.className = 'text-muted';
    _contentEl.appendChild(h1);
    _contentEl.appendChild(p);
  }

  // Focus management: focus the heading in main content
  const heading = _contentEl.querySelector('h1, h2, [tabindex="-1"]');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  // Dispatch custom event for sidebar active-state updates
  window.dispatchEvent(new CustomEvent('routechange', {
    detail: { view: viewName, params, path: window.location.pathname }
  }));
}


// ── Tests ──────────────────────────────────────────────────────────────

export function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // Route matching: basic routes
  const dashboard = matchRoute('/dashboard');
  assert(dashboard !== null, 'matchRoute finds /dashboard');
  assert(dashboard.route.view === 'dashboard', 'matchRoute returns correct view for /dashboard');

  const landing = matchRoute('/');
  assert(landing !== null, 'matchRoute finds /');
  assert(landing.route.view === 'landing', 'matchRoute returns correct view for /');

  const doctor = matchRoute('/tools/doctor');
  assert(doctor !== null, 'matchRoute finds /tools/doctor');
  assert(doctor.route.view === 'doctor', 'matchRoute returns correct view for /tools/doctor');

  const test = matchRoute('/test');
  assert(test !== null, 'matchRoute finds /test');
  assert(test.route.view === 'test-runner', 'matchRoute returns correct view for /test');

  // Parameterized routes
  const plant = matchRoute('/grow/plant/abc123');
  assert(plant !== null, 'matchRoute finds parameterized route /grow/plant/:id');
  assert(plant.route.view === 'plant-detail', 'parameterized route returns correct view');
  assert(plant.params.id === 'abc123', 'parameterized route extracts id param');

  const plant2 = matchRoute('/grow/plant/xyz-789');
  assert(plant2 !== null, 'matchRoute handles hyphenated param values');
  assert(plant2.params.id === 'xyz-789', 'parameterized route extracts hyphenated id');

  // Unknown routes
  const unknown = matchRoute('/nonexistent/path');
  assert(unknown === null, 'matchRoute returns null for unknown route');

  const unknown2 = matchRoute('/grow/plant');
  assert(unknown2 === null, 'matchRoute returns null for partial parameterized route');

  // Trailing slash normalization
  const trailingSlash = matchRoute('/dashboard/');
  assert(trailingSlash !== null, 'matchRoute handles trailing slash');
  assert(trailingSlash.route.view === 'dashboard', 'trailing slash matches correct route');

  // All defined routes are matchable
  for (const route of ROUTES) {
    const testPath = route.path.replace(/:([^/]+)/g, 'test-val');
    const m = matchRoute(testPath);
    assert(m !== null, `route ${route.path} is matchable`);
    assert(m.route.view === route.view, `route ${route.path} returns view ${route.view}`);
  }

  // Auth guard: routes with auth=true should be flagged
  const authRoutes = ROUTES.filter(r => r.auth);
  const noAuthRoutes = ROUTES.filter(r => !r.auth);
  assert(authRoutes.length > 0, 'some routes require auth');
  assert(noAuthRoutes.length > 0, 'some routes do not require auth');

  // Verify specific auth expectations
  const dashboardRoute = ROUTES.find(r => r.path === '/dashboard');
  assert(dashboardRoute.auth === true, '/dashboard requires auth');
  const doctorRoute = ROUTES.find(r => r.path === '/tools/doctor');
  assert(doctorRoute.auth === false, '/tools/doctor does not require auth');
  const landingRoute = ROUTES.find(r => r.path === '/');
  assert(landingRoute.auth === false, '/ (landing) does not require auth');

  // First visit detection: _hasProfile is used by router
  // (Full redirect behavior requires DOM/History API, tested in browser)
  const growRoutes = ROUTES.filter(r => r.path.startsWith('/grow'));
  assert(growRoutes.every(r => r.auth === true), 'all /grow/* routes require auth');

  return results;
}
