diff --git a/assets/icons.svg b/assets/icons.svg
new file mode 100644
index 0000000..b02a838
--- /dev/null
+++ b/assets/icons.svg
@@ -0,0 +1,43 @@
+<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
+  <!-- Dashboard / grid icon -->
+  <symbol id="icon-dashboard" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
+    <rect x="3" y="3" width="7" height="7" rx="1"/>
+    <rect x="14" y="3" width="7" height="7" rx="1"/>
+    <rect x="3" y="14" width="7" height="7" rx="1"/>
+    <rect x="14" y="14" width="7" height="7" rx="1"/>
+  </symbol>
+
+  <!-- Plant / seedling icon -->
+  <symbol id="icon-plant" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
+    <path d="M12 22V8"/>
+    <path d="M5 12c0-4 3-7 7-7s7 3 7 7"/>
+    <path d="M8 17c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
+  </symbol>
+
+  <!-- Wrench / tools icon -->
+  <symbol id="icon-wrench" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
+    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
+  </symbol>
+
+  <!-- Book / knowledge icon -->
+  <symbol id="icon-book" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
+    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
+    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
+  </symbol>
+
+  <!-- Gear / settings icon -->
+  <symbol id="icon-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
+    <circle cx="12" cy="12" r="3"/>
+    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
+  </symbol>
+
+  <!-- Chevron left (collapse) -->
+  <symbol id="icon-chevron-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
+    <polyline points="15 18 9 12 15 6"/>
+  </symbol>
+
+  <!-- Chevron right (expand) -->
+  <symbol id="icon-chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
+    <polyline points="9 18 15 12 9 6"/>
+  </symbol>
+</svg>
diff --git a/css/components.css b/css/components.css
new file mode 100644
index 0000000..2df6fd5
--- /dev/null
+++ b/css/components.css
@@ -0,0 +1,366 @@
+/* GrowDoc Companion — Base Components */
+
+/* Buttons */
+.btn {
+  display: inline-flex;
+  align-items: center;
+  gap: var(--space-2);
+  padding: var(--space-2) var(--space-4);
+  border: 1px solid var(--bg-elevated);
+  border-radius: var(--radius-md);
+  background: var(--bg-surface);
+  color: var(--text-primary);
+  font-family: var(--font-body);
+  font-size: 0.9rem;
+  cursor: pointer;
+  transition: background var(--transition-fast), border-color var(--transition-fast);
+}
+
+.btn:hover {
+  background: var(--bg-elevated);
+  border-color: var(--text-muted);
+}
+
+.btn:focus-visible {
+  outline: 2px solid var(--accent-green);
+  outline-offset: 2px;
+}
+
+.btn-primary {
+  background: var(--accent-green);
+  color: var(--bg-primary);
+  border-color: var(--accent-green);
+  font-weight: 600;
+}
+
+.btn-primary:hover {
+  background: #a0c966;
+  border-color: #a0c966;
+}
+
+.btn-danger {
+  border-color: var(--status-urgent);
+  color: var(--status-urgent);
+}
+
+.btn-danger:hover {
+  background: var(--status-urgent);
+  color: var(--text-primary);
+}
+
+/* Cards */
+.card {
+  background: var(--bg-surface);
+  border: 1px solid var(--bg-elevated);
+  border-radius: var(--radius-md);
+  padding: var(--space-4);
+}
+
+.card-elevated {
+  background: var(--bg-elevated);
+  box-shadow: var(--shadow-md);
+}
+
+/* Badges */
+.badge {
+  display: inline-flex;
+  align-items: center;
+  padding: var(--space-1) var(--space-2);
+  border-radius: var(--radius-full);
+  font-family: var(--font-mono);
+  font-size: 0.7rem;
+  font-weight: 600;
+  text-transform: uppercase;
+  letter-spacing: 0.5px;
+}
+
+.badge-green { background: var(--status-good); color: var(--bg-primary); }
+.badge-gold { background: var(--status-action); color: var(--bg-primary); }
+.badge-red { background: var(--status-urgent); color: var(--text-primary); }
+.badge-purple { background: var(--priority-terpenes); color: var(--text-primary); }
+.badge-indigo { background: var(--priority-effect); color: var(--text-primary); }
+
+/* Form inputs */
+.input {
+  width: 100%;
+  padding: var(--space-2) var(--space-3);
+  background: var(--bg-primary);
+  border: 1px solid var(--bg-elevated);
+  border-radius: var(--radius-md);
+  color: var(--text-primary);
+  font-family: var(--font-body);
+  font-size: 0.95rem;
+  transition: border-color var(--transition-fast);
+}
+
+.input:focus {
+  outline: none;
+  border-color: var(--accent-green);
+}
+
+.input::placeholder {
+  color: var(--text-muted);
+}
+
+select.input {
+  cursor: pointer;
+}
+
+textarea.input {
+  resize: vertical;
+  min-height: 80px;
+}
+
+/* Labels */
+label {
+  display: block;
+  margin-bottom: var(--space-1);
+  color: var(--text-secondary);
+  font-size: 0.85rem;
+  font-weight: 600;
+}
+
+/* Typography helpers */
+h1, h2, h3, h4 {
+  font-family: var(--font-heading);
+  color: var(--text-primary);
+  line-height: 1.3;
+}
+
+h1 { font-size: 1.8rem; margin-bottom: var(--space-4); }
+h2 { font-size: 1.4rem; margin-bottom: var(--space-3); }
+h3 { font-size: 1.15rem; margin-bottom: var(--space-2); }
+h4 { font-size: 1rem; margin-bottom: var(--space-2); }
+
+.text-muted { color: var(--text-muted); }
+.text-secondary { color: var(--text-secondary); }
+.text-accent { color: var(--accent-green); }
+.text-mono { font-family: var(--font-mono); }
+
+/* Sidebar navigation */
+.sidebar-inner {
+  display: flex;
+  flex-direction: column;
+  height: 100%;
+}
+
+.sidebar-brand {
+  display: flex;
+  align-items: center;
+  gap: var(--space-2);
+  padding: var(--space-4);
+  border-bottom: 1px solid var(--bg-elevated);
+  font-family: var(--font-heading);
+  font-size: 1.2rem;
+  color: var(--text-primary);
+  white-space: nowrap;
+  overflow: hidden;
+}
+
+.sidebar-brand-icon {
+  font-size: 1.4rem;
+  flex-shrink: 0;
+}
+
+.sidebar-nav {
+  flex: 1;
+  padding: var(--space-2) 0;
+  overflow-y: auto;
+}
+
+.nav-link {
+  display: flex;
+  align-items: center;
+  gap: var(--space-3);
+  padding: var(--space-2) var(--space-4);
+  color: var(--text-secondary);
+  text-decoration: none;
+  font-size: 0.9rem;
+  white-space: nowrap;
+  overflow: hidden;
+  border-left: 3px solid transparent;
+}
+
+@media (prefers-reduced-motion: no-preference) {
+  .nav-link {
+    transition: color var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
+  }
+}
+
+.nav-link:hover {
+  color: var(--text-primary);
+  background: var(--bg-elevated);
+}
+
+.nav-link:focus-visible {
+  outline: 2px solid var(--accent-green);
+  outline-offset: -2px;
+}
+
+.nav-link.active {
+  color: var(--accent-green);
+  border-left-color: var(--accent-green);
+  background: rgba(143, 184, 86, 0.08);
+}
+
+.nav-icon {
+  flex-shrink: 0;
+  display: flex;
+  align-items: center;
+  color: inherit;
+}
+
+.nav-label {
+  overflow: hidden;
+  text-overflow: ellipsis;
+}
+
+/* Nav children (sub-items) */
+.nav-children {
+  padding-left: var(--space-8);
+}
+
+.nav-child-link {
+  display: block;
+  padding: var(--space-1) var(--space-4);
+  color: var(--text-muted);
+  text-decoration: none;
+  font-size: 0.82rem;
+}
+
+@media (prefers-reduced-motion: no-preference) {
+  .nav-child-link {
+    transition: color var(--transition-fast);
+  }
+}
+
+.nav-child-link:hover {
+  color: var(--text-primary);
+}
+
+.nav-child-link.active {
+  color: var(--accent-green);
+}
+
+.nav-child-link.disabled {
+  color: var(--text-muted);
+  opacity: 0.5;
+  cursor: not-allowed;
+}
+
+.nav-child-link.disabled:hover {
+  color: var(--text-muted);
+}
+
+/* Disabled tooltip */
+.nav-tooltip {
+  position: absolute;
+  left: 100%;
+  top: 50%;
+  transform: translateY(-50%);
+  margin-left: var(--space-2);
+  padding: var(--space-1) var(--space-2);
+  background: var(--bg-elevated);
+  border: 1px solid var(--text-muted);
+  border-radius: var(--radius-sm);
+  color: var(--text-secondary);
+  font-size: 0.75rem;
+  white-space: nowrap;
+  z-index: 10;
+  pointer-events: none;
+}
+
+/* Sidebar toggle button */
+.sidebar-toggle {
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  padding: var(--space-3);
+  border: none;
+  border-top: 1px solid var(--bg-elevated);
+  background: transparent;
+  color: var(--text-muted);
+  cursor: pointer;
+  font-size: 1rem;
+}
+
+.sidebar-toggle:hover {
+  color: var(--text-primary);
+  background: var(--bg-elevated);
+}
+
+.sidebar-toggle:focus-visible {
+  outline: 2px solid var(--accent-green);
+  outline-offset: -2px;
+}
+
+/* Mobile sidebar adjustments */
+@media (max-width: 768px) {
+  .sidebar-inner {
+    flex-direction: row;
+    align-items: center;
+  }
+
+  .sidebar-brand {
+    display: none;
+  }
+
+  .sidebar-nav {
+    display: flex;
+    flex-direction: row;
+    padding: 0;
+    overflow-x: auto;
+    overflow-y: hidden;
+  }
+
+  .nav-link {
+    flex-direction: column;
+    gap: var(--space-1);
+    padding: var(--space-2) var(--space-3);
+    border-left: none;
+    border-top: 3px solid transparent;
+    font-size: 0.7rem;
+    text-align: center;
+  }
+
+  .nav-link.active {
+    border-top-color: var(--accent-green);
+    border-left-color: transparent;
+  }
+
+  .nav-children,
+  .sidebar-toggle {
+    display: none;
+  }
+}
+
+/* Error screen (static fallback, no store/router dependency) */
+.error-screen {
+  display: flex;
+  flex-direction: column;
+  align-items: center;
+  justify-content: center;
+  min-height: 100vh;
+  padding: var(--space-8);
+  text-align: center;
+  background: var(--bg-primary);
+  color: var(--text-primary);
+}
+
+.error-screen h1 {
+  color: var(--status-urgent);
+  margin-bottom: var(--space-4);
+}
+
+.error-screen p {
+  color: var(--text-secondary);
+  margin-bottom: var(--space-6);
+  max-width: 480px;
+}
+
+.error-screen .error-actions {
+  display: flex;
+  gap: var(--space-3);
+  flex-wrap: wrap;
+  justify-content: center;
+}
diff --git a/css/layout.css b/css/layout.css
new file mode 100644
index 0000000..4874d6c
--- /dev/null
+++ b/css/layout.css
@@ -0,0 +1,95 @@
+/* GrowDoc Companion — Layout */
+
+*,
+*::before,
+*::after {
+  box-sizing: border-box;
+  margin: 0;
+  padding: 0;
+}
+
+html, body {
+  height: 100%;
+  background: var(--bg-primary);
+  color: var(--text-primary);
+  font-family: var(--font-body);
+  font-size: 16px;
+  line-height: 1.6;
+  -webkit-font-smoothing: antialiased;
+}
+
+/* App shell: sidebar + main content */
+.app-shell {
+  display: grid;
+  grid-template-columns: var(--sidebar-width) 1fr;
+  min-height: 100vh;
+  transition: grid-template-columns var(--transition-base);
+}
+
+.app-shell.sidebar-collapsed {
+  grid-template-columns: var(--sidebar-collapsed-width) 1fr;
+}
+
+/* Sidebar */
+#sidebar {
+  background: var(--bg-surface);
+  border-right: 1px solid var(--bg-elevated);
+  display: flex;
+  flex-direction: column;
+  overflow-y: auto;
+  overflow-x: hidden;
+  position: sticky;
+  top: 0;
+  height: 100vh;
+}
+
+/* Main content */
+#content {
+  padding: var(--space-8);
+  overflow-y: auto;
+  min-height: 100vh;
+  max-width: 960px;
+}
+
+/* Responsive: mobile */
+@media (max-width: 768px) {
+  .app-shell {
+    grid-template-columns: 1fr;
+    grid-template-rows: 1fr auto;
+  }
+
+  .app-shell.sidebar-collapsed {
+    grid-template-columns: 1fr;
+  }
+
+  #sidebar {
+    position: fixed;
+    bottom: 0;
+    left: 0;
+    right: 0;
+    top: auto;
+    height: auto;
+    flex-direction: row;
+    border-right: none;
+    border-top: 1px solid var(--bg-elevated);
+    overflow-x: auto;
+    overflow-y: hidden;
+    z-index: 100;
+  }
+
+  #content {
+    padding: var(--space-4);
+    padding-bottom: calc(var(--space-16) + var(--space-8));
+  }
+}
+
+/* Reduced motion */
+@media (prefers-reduced-motion: reduce) {
+  *,
+  *::before,
+  *::after {
+    animation-duration: 0.01ms !important;
+    animation-iteration-count: 1 !important;
+    transition-duration: 0.01ms !important;
+  }
+}
diff --git a/css/variables.css b/css/variables.css
new file mode 100644
index 0000000..190afa9
--- /dev/null
+++ b/css/variables.css
@@ -0,0 +1,70 @@
+/* GrowDoc Companion — Design System Tokens */
+
+:root {
+  /* Background */
+  --bg-primary: #0c0e0a;
+  --bg-surface: #1a1d16;
+  --bg-elevated: #252820;
+
+  /* Text */
+  --text-primary: #d4cdb7;
+  --text-secondary: #a09880;
+  --text-muted: #6b6555;
+
+  /* Accent */
+  --accent-green: #8fb856;
+
+  /* Priority colors */
+  --priority-yield: #8fb856;
+  --priority-quality: #d4a843;
+  --priority-terpenes: #9b6cc0;
+  --priority-effect: #5c6bc0;
+
+  /* Evidence level badges */
+  --evidence-strong: #8fb856;
+  --evidence-moderate: #d4a843;
+  --evidence-emerging: #5c6bc0;
+  --evidence-anecdotal: #a09880;
+
+  /* Status colors */
+  --status-good: #8fb856;
+  --status-action: #d4a843;
+  --status-urgent: #c0392b;
+
+  /* Typography */
+  --font-heading: 'DM Serif Display', Georgia, 'Times New Roman', serif;
+  --font-body: 'Source Serif 4', Georgia, serif;
+  --font-mono: 'IBM Plex Mono', 'Courier New', monospace;
+
+  /* Spacing scale (4px base) */
+  --space-1: 4px;
+  --space-2: 8px;
+  --space-3: 12px;
+  --space-4: 16px;
+  --space-5: 20px;
+  --space-6: 24px;
+  --space-8: 32px;
+  --space-10: 40px;
+  --space-12: 48px;
+  --space-16: 64px;
+
+  /* Border radius */
+  --radius-sm: 4px;
+  --radius-md: 8px;
+  --radius-lg: 12px;
+  --radius-full: 9999px;
+
+  /* Transitions */
+  --transition-fast: 150ms ease;
+  --transition-base: 250ms ease;
+  --transition-slow: 400ms ease;
+
+  /* Shadows */
+  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
+  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.4);
+  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
+
+  /* Sidebar widths */
+  --sidebar-width: 220px;
+  --sidebar-collapsed-width: 60px;
+}
diff --git a/index.html b/index.html
index 92ce99e..27a3c2c 100644
--- a/index.html
+++ b/index.html
@@ -2,44 +2,20 @@
 <html lang="en">
 <head>
   <meta charset="UTF-8">
-  <meta name="viewport" content="width=device-width, initial-scale=1.0">
-  <title>GrowDoc — Grow Planning Docs</title>
-  <link rel="stylesheet" href="style.css">
+  <meta name="viewport" content="width=device-width, initial-scale=1">
+  <title>GrowDoc Companion</title>
+  <link rel="preconnect" href="https://fonts.googleapis.com">
+  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
+  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=IBM+Plex+Mono:wght@400;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..900;1,8..60,300..900&display=swap" rel="stylesheet">
+  <link rel="stylesheet" href="/css/variables.css">
+  <link rel="stylesheet" href="/css/layout.css">
+  <link rel="stylesheet" href="/css/components.css">
 </head>
 <body>
-  <div class="app">
-    <header class="header">
-      <div class="header-main">
-        <h1>🌿 GrowDoc</h1>
-        <p>Planning docs for the 80×80 grow project</p>
-      </div>
-      <a href="admin.html" class="admin-link">⚙ Admin</a>
-    </header>
-
-    <div class="mobile-nav" id="mobile-nav"></div>
-
-    <div class="main">
-      <nav class="sidebar" aria-label="Documents by Priority">
-        <div class="sidebar-label">Filter by status</div>
-        <div class="filter-bar" id="filter-bar"></div>
-        <div class="sidebar-label" style="margin-top:18px">Documents by Priority</div>
-        <div id="nav-list"></div>
-      </nav>
-
-      <div class="viewer">
-        <h2 class="viewer-title" id="viewer-title"></h2>
-        <div class="viewer-meta" id="viewer-meta"></div>
-        <div class="viewer-frame">
-          <iframe id="viewer-iframe" title="Document viewer"></iframe>
-        </div>
-      </div>
-    </div>
-
-    <footer class="footer">
-      GrowDoc · Shared planning docs
-    </footer>
+  <div class="app-shell" id="app-shell">
+    <nav id="sidebar" aria-label="Main navigation"></nav>
+    <main id="content"></main>
   </div>
-
-  <script src="app.js"></script>
+  <script type="module" src="/js/main.js"></script>
 </body>
 </html>
diff --git a/js/components/sidebar.js b/js/components/sidebar.js
new file mode 100644
index 0000000..bab3457
--- /dev/null
+++ b/js/components/sidebar.js
@@ -0,0 +1,331 @@
+// GrowDoc Companion — Sidebar Navigation
+
+import { navigate } from '../router.js';
+
+const NAV_ITEMS = [
+  {
+    id: 'dashboard',
+    label: 'Today',
+    icon: 'dashboard',
+    path: '/dashboard',
+    auth: true,
+    children: null,
+  },
+  {
+    id: 'grow',
+    label: 'My Grow',
+    icon: 'plant',
+    path: '/grow',
+    auth: true,
+    children: [
+      { id: 'grow-plants',    label: 'Plants',      path: '/grow' },
+      { id: 'grow-timeline',  label: 'Timeline',    path: '/grow', section: 'timeline' },
+      { id: 'grow-training',  label: 'Training',    path: '/grow/training' },
+      { id: 'grow-env',       label: 'Environment', path: '/grow/environment' },
+      { id: 'grow-harvest',   label: 'Harvest',     path: '/grow/harvest' },
+      { id: 'grow-feeding',   label: 'Feeding',     path: '/grow/feeding' },
+      { id: 'grow-journal',   label: 'Journal',     path: '/grow/journal' },
+      { id: 'grow-dry-cure',  label: 'Dry/Cure',    path: '/grow/dry-cure' },
+    ],
+  },
+  {
+    id: 'tools',
+    label: 'Tools',
+    icon: 'wrench',
+    path: '/tools/doctor',
+    auth: false,
+    children: [
+      { id: 'tools-doctor',   label: 'Plant Doctor',  path: '/tools/doctor' },
+      { id: 'tools-stealth',  label: 'Stealth Audit', path: '/tools/stealth' },
+    ],
+  },
+  {
+    id: 'knowledge',
+    label: 'Knowledge Base',
+    icon: 'book',
+    path: '/knowledge',
+    auth: false,
+    children: null,
+  },
+  {
+    id: 'settings',
+    label: 'Settings',
+    icon: 'gear',
+    path: '/settings',
+    auth: true,
+    children: null,
+  },
+];
+
+let _collapsed = false;
+let _container = null;
+let _store = null;
+let _activeRoute = null;
+let _hasActiveGrow = false;
+
+/** Render the sidebar into the given container. */
+export function renderSidebar(container, store) {
+  _container = container;
+  _store = store;
+
+  // Load collapsed state from store
+  if (store && typeof store.get === 'function') {
+    _collapsed = !!store.get('ui.sidebarCollapsed');
+  }
+
+  // Listen for grow state changes
+  if (store && typeof store.get === 'function') {
+    _hasActiveGrow = !!store.get('grow.active');
+  }
+
+  _render();
+
+  // Listen for route changes
+  window.addEventListener('routechange', (e) => {
+    updateActiveItem(e.detail.path);
+  });
+}
+
+/** Update the active nav item based on the current route. */
+export function updateActiveItem(currentRoute) {
+  _activeRoute = currentRoute;
+  _render();
+}
+
+/** Set sidebar collapsed state. */
+export function setSidebarCollapsed(collapsed) {
+  _collapsed = collapsed;
+  if (_store && typeof _store.set === 'function') {
+    _store.set('ui.sidebarCollapsed', collapsed);
+  }
+  // Update the app shell class
+  const shell = document.querySelector('.app-shell');
+  if (shell) {
+    shell.classList.toggle('sidebar-collapsed', collapsed);
+  }
+  _render();
+}
+
+function _isActive(path) {
+  if (!_activeRoute) return false;
+  return _activeRoute === path || _activeRoute.startsWith(path + '/');
+}
+
+function _isGroupActive(item) {
+  if (_isActive(item.path)) return true;
+  if (item.children) {
+    return item.children.some(child => _isActive(child.path));
+  }
+  return false;
+}
+
+function _render() {
+  if (!_container) return;
+
+  const nav = document.createElement('div');
+  nav.className = 'sidebar-inner';
+
+  // Logo / brand
+  const brand = document.createElement('div');
+  brand.className = 'sidebar-brand';
+  if (_collapsed) {
+    brand.innerHTML = '<span class="sidebar-brand-icon">&#127807;</span>';
+  } else {
+    brand.innerHTML = '<span class="sidebar-brand-icon">&#127807;</span><span class="sidebar-brand-text">GrowDoc</span>';
+  }
+  nav.appendChild(brand);
+
+  // Nav items
+  const navList = document.createElement('div');
+  navList.className = 'sidebar-nav';
+  navList.setAttribute('role', 'navigation');
+  navList.setAttribute('aria-label', 'Main navigation');
+
+  for (const item of NAV_ITEMS) {
+    const groupActive = _isGroupActive(item);
+
+    // Parent item
+    const link = document.createElement('a');
+    link.href = item.path;
+    link.className = 'nav-link' + (groupActive ? ' active' : '');
+    if (groupActive) link.setAttribute('aria-current', 'page');
+    link.dataset.navId = item.id;
+
+    const iconEl = document.createElement('span');
+    iconEl.className = 'nav-icon';
+    iconEl.innerHTML = _getIcon(item.icon);
+    link.appendChild(iconEl);
+
+    if (!_collapsed) {
+      const labelEl = document.createElement('span');
+      labelEl.className = 'nav-label';
+      labelEl.textContent = item.label;
+      link.appendChild(labelEl);
+    }
+
+    link.title = item.label;
+    navList.appendChild(link);
+
+    // Children (only when expanded and group is active or always show tools)
+    if (item.children && !_collapsed) {
+      const childList = document.createElement('div');
+      childList.className = 'nav-children';
+
+      for (const child of item.children) {
+        const childLink = document.createElement('a');
+        childLink.href = child.path;
+        childLink.className = 'nav-child-link' + (_isActive(child.path) ? ' active' : '');
+        childLink.textContent = child.label;
+        childLink.dataset.navId = child.id;
+
+        // Between-grows mode: disable My Grow sub-items when no active grow
+        if (item.id === 'grow' && !_hasActiveGrow) {
+          childLink.classList.add('disabled');
+          childLink.setAttribute('aria-disabled', 'true');
+          childLink.addEventListener('click', (e) => {
+            e.preventDefault();
+            _showDisabledTooltip(childLink);
+          });
+        }
+
+        childList.appendChild(childLink);
+      }
+      navList.appendChild(childList);
+    }
+  }
+
+  nav.appendChild(navList);
+
+  // Collapse toggle button at bottom
+  const toggleBtn = document.createElement('button');
+  toggleBtn.className = 'sidebar-toggle';
+  toggleBtn.setAttribute('aria-expanded', String(!_collapsed));
+  toggleBtn.setAttribute('aria-label', _collapsed ? 'Expand sidebar' : 'Collapse sidebar');
+  toggleBtn.innerHTML = _collapsed ? '&#x276F;' : '&#x276E;';
+  toggleBtn.addEventListener('click', () => {
+    setSidebarCollapsed(!_collapsed);
+  });
+  nav.appendChild(toggleBtn);
+
+  _container.innerHTML = '';
+  _container.appendChild(nav);
+}
+
+function _showDisabledTooltip(element) {
+  // Remove any existing tooltip
+  const existing = document.querySelector('.nav-tooltip');
+  if (existing) existing.remove();
+
+  const tooltip = document.createElement('div');
+  tooltip.className = 'nav-tooltip';
+  tooltip.textContent = 'Start a grow to access this feature.';
+  element.style.position = 'relative';
+  element.appendChild(tooltip);
+  setTimeout(() => tooltip.remove(), 2500);
+}
+
+function _getIcon(name) {
+  const icons = {
+    dashboard: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
+    plant: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V8"/><path d="M5 12c0-4 3-7 7-7s7 3 7 7"/><path d="M8 17c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>',
+    wrench: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
+    book: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
+    gear: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
+  };
+  return icons[name] || '';
+}
+
+/** Export NAV_ITEMS for testing */
+export { NAV_ITEMS };
+
+
+// ── Tests ──────────────────────────────────────────────────────────────
+
+export function runTests() {
+  const results = [];
+  function assert(condition, msg) {
+    results.push({ pass: !!condition, msg });
+    if (!condition) console.error(`FAIL: ${msg}`);
+  }
+
+  // Nav items structure
+  assert(NAV_ITEMS.length === 5, 'sidebar has 5 top-level nav items');
+  const labels = NAV_ITEMS.map(i => i.label);
+  assert(labels.includes('Today'), 'nav includes Today');
+  assert(labels.includes('My Grow'), 'nav includes My Grow');
+  assert(labels.includes('Tools'), 'nav includes Tools');
+  assert(labels.includes('Knowledge Base'), 'nav includes Knowledge Base');
+  assert(labels.includes('Settings'), 'nav includes Settings');
+
+  // My Grow children
+  const myGrow = NAV_ITEMS.find(i => i.id === 'grow');
+  assert(myGrow.children.length === 8, 'My Grow has 8 sub-items');
+  const childLabels = myGrow.children.map(c => c.label);
+  assert(childLabels.includes('Plants'), 'My Grow includes Plants');
+  assert(childLabels.includes('Training'), 'My Grow includes Training');
+  assert(childLabels.includes('Dry/Cure'), 'My Grow includes Dry/Cure');
+
+  // Tools children
+  const tools = NAV_ITEMS.find(i => i.id === 'tools');
+  assert(tools.children.length === 2, 'Tools has 2 sub-items');
+  assert(tools.children[0].label === 'Plant Doctor', 'Tools includes Plant Doctor');
+  assert(tools.children[1].label === 'Stealth Audit', 'Tools includes Stealth Audit');
+
+  // Collapsed state test (DOM-based)
+  const testContainer = document.createElement('nav');
+  testContainer.id = 'sidebar-test';
+  testContainer.style.display = 'none';
+  document.body.appendChild(testContainer);
+
+  // Mock store
+  const mockStore = {
+    _data: {},
+    get(key) { return this._data[key]; },
+    set(key, val) { this._data[key] = val; },
+  };
+
+  // Render sidebar
+  renderSidebar(testContainer, mockStore);
+
+  // Verify rendered nav items
+  const links = testContainer.querySelectorAll('.nav-link');
+  assert(links.length === 5, 'sidebar renders 5 nav links');
+
+  // Toggle test
+  const toggleBtn = testContainer.querySelector('.sidebar-toggle');
+  assert(toggleBtn !== null, 'sidebar has toggle button');
+  assert(toggleBtn.getAttribute('aria-expanded') === 'true', 'toggle shows expanded state initially');
+
+  // Set collapsed
+  setSidebarCollapsed(true);
+  const toggleAfter = testContainer.querySelector('.sidebar-toggle');
+  assert(toggleAfter.getAttribute('aria-expanded') === 'false', 'collapsed state shows aria-expanded=false');
+
+  // Collapsed: no labels visible
+  const labelsInCollapsed = testContainer.querySelectorAll('.nav-label');
+  assert(labelsInCollapsed.length === 0, 'collapsed state hides nav labels');
+
+  // Expand back
+  setSidebarCollapsed(false);
+  const labelsExpanded = testContainer.querySelectorAll('.nav-label');
+  assert(labelsExpanded.length === 5, 'expanded state shows nav labels');
+
+  // Between-grows mode: disable My Grow sub-items
+  mockStore._data['grow.active'] = false;
+  _hasActiveGrow = false;
+  _render();
+  const disabledLinks = testContainer.querySelectorAll('.nav-child-link.disabled');
+  assert(disabledLinks.length > 0, 'between-grows mode disables My Grow sub-items');
+
+  // Active section highlighting
+  _activeRoute = '/dashboard';
+  _render();
+  const activeLink = testContainer.querySelector('.nav-link.active');
+  assert(activeLink !== null, 'active section is highlighted');
+  assert(activeLink.dataset.navId === 'dashboard', 'correct nav item is active for /dashboard');
+
+  // Cleanup
+  testContainer.remove();
+
+  return results;
+}
diff --git a/js/main.js b/js/main.js
new file mode 100644
index 0000000..ba1be06
--- /dev/null
+++ b/js/main.js
@@ -0,0 +1,173 @@
+// GrowDoc Companion — App Entry Point
+
+import { initRouter, navigate } from './router.js';
+import { renderSidebar } from './components/sidebar.js';
+
+/**
+ * Minimal store stub for section-01.
+ * Will be replaced by the real reactive store in section-02.
+ */
+const store = {
+  _data: {},
+  get(key) {
+    const keys = key.split('.');
+    let val = this._data;
+    for (const k of keys) {
+      if (val == null) return undefined;
+      val = val[k];
+    }
+    return val;
+  },
+  set(key, val) {
+    const keys = key.split('.');
+    let obj = this._data;
+    for (let i = 0; i < keys.length - 1; i++) {
+      if (obj[keys[i]] == null) obj[keys[i]] = {};
+      obj = obj[keys[i]];
+    }
+    obj[keys[keys.length - 1]] = val;
+  },
+};
+
+/** View map: route view names -> render functions. Stubs for now. */
+const viewMap = {
+  'test-runner': renderTestRunner,
+};
+
+document.addEventListener('DOMContentLoaded', () => {
+  const sidebar = document.getElementById('sidebar');
+  const content = document.getElementById('content');
+
+  if (!sidebar || !content) {
+    showErrorScreen('App structure is missing. Please reload.');
+    return;
+  }
+
+  try {
+    // Initialize sidebar
+    renderSidebar(sidebar, store);
+
+    // Initialize router with content area and view map
+    initRouter(content, viewMap);
+  } catch (err) {
+    console.error('App initialization failed:', err);
+    showErrorScreen('Something went wrong during startup.');
+  }
+});
+
+// Global error handler
+window.addEventListener('error', (event) => {
+  console.error('Unhandled error:', event.error);
+});
+
+window.addEventListener('unhandledrejection', (event) => {
+  console.error('Unhandled promise rejection:', event.reason);
+});
+
+
+// ── Error Recovery Screen ──────────────────────────────────────────────
+
+function showErrorScreen(message) {
+  document.body.innerHTML = `
+    <div class="error-screen">
+      <h1>Something Went Wrong</h1>
+      <p>${message}</p>
+      <div class="error-actions">
+        <button class="btn btn-primary" onclick="location.reload()">Reload App</button>
+        <button class="btn" id="export-data-btn">Export Your Data</button>
+        <button class="btn btn-danger" id="reset-data-btn">Reset App Data</button>
+      </div>
+    </div>
+  `;
+
+  document.getElementById('export-data-btn')?.addEventListener('click', exportData);
+  document.getElementById('reset-data-btn')?.addEventListener('click', resetData);
+}
+
+function exportData() {
+  try {
+    const data = {};
+    for (let i = 0; i < localStorage.length; i++) {
+      const key = localStorage.key(i);
+      if (key && key.startsWith('growdoc-companion')) {
+        data[key] = localStorage.getItem(key);
+      }
+    }
+    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
+    const url = URL.createObjectURL(blob);
+    const a = document.createElement('a');
+    a.href = url;
+    a.download = `growdoc-backup-${new Date().toISOString().slice(0, 10)}.json`;
+    a.click();
+    URL.revokeObjectURL(url);
+  } catch (err) {
+    alert('Export failed: ' + err.message);
+  }
+}
+
+function resetData() {
+  if (!confirm('This will delete all GrowDoc Companion data. Are you sure?')) return;
+  try {
+    const keys = [];
+    for (let i = 0; i < localStorage.length; i++) {
+      const key = localStorage.key(i);
+      if (key && key.startsWith('growdoc-companion')) keys.push(key);
+    }
+    keys.forEach(k => localStorage.removeItem(k));
+    location.reload();
+  } catch (err) {
+    alert('Reset failed: ' + err.message);
+  }
+}
+
+
+// ── Test Runner View ───────────────────────────────────────────────────
+
+async function renderTestRunner(container) {
+  container.innerHTML = '<h1>GrowDoc Test Runner</h1><div id="test-output" class="text-mono" style="font-size:0.85rem;"></div>';
+
+  const output = document.getElementById('test-output');
+  const modules = [
+    { name: 'utils', path: './utils.js' },
+    { name: 'router', path: './router.js' },
+    { name: 'sidebar', path: './components/sidebar.js' },
+    { name: 'vercel-config', path: './tests/vercel-config.test.js' },
+  ];
+
+  let totalPass = 0;
+  let totalFail = 0;
+
+  for (const mod of modules) {
+    try {
+      const m = await import(mod.path);
+      if (typeof m.runTests !== 'function') {
+        output.innerHTML += `<div style="color:var(--text-muted)">-- ${mod.name}: no runTests() exported --</div>`;
+        continue;
+      }
+      const results = m.runTests();
+      const passed = results.filter(r => r.pass).length;
+      const failed = results.filter(r => !r.pass).length;
+      totalPass += passed;
+      totalFail += failed;
+
+      const color = failed > 0 ? 'var(--status-urgent)' : 'var(--status-good)';
+      output.innerHTML += `<div style="color:${color};margin-top:12px;font-weight:600">
+        ${failed > 0 ? 'FAIL' : 'PASS'} ${mod.name}: ${passed}/${results.length} passed
+      </div>`;
+
+      for (const r of results) {
+        const icon = r.pass ? '<span style="color:var(--status-good)">PASS</span>' : '<span style="color:var(--status-urgent)">FAIL</span>';
+        output.innerHTML += `<div style="padding-left:16px">${icon} ${r.msg}</div>`;
+      }
+    } catch (err) {
+      totalFail++;
+      output.innerHTML += `<div style="color:var(--status-urgent);margin-top:12px">ERROR ${mod.name}: ${err.message}</div>`;
+    }
+  }
+
+  // Summary
+  const summaryColor = totalFail > 0 ? 'var(--status-urgent)' : 'var(--status-good)';
+  output.innerHTML = `<div style="color:${summaryColor};font-size:1.1rem;margin-bottom:16px;padding:8px;border:1px solid ${summaryColor};border-radius:4px">
+    ${totalFail > 0 ? 'SOME TESTS FAILED' : 'ALL TESTS PASSED'}: ${totalPass} passed, ${totalFail} failed
+  </div>` + output.innerHTML;
+}
diff --git a/js/router.js b/js/router.js
new file mode 100644
index 0000000..5ac9ef8
--- /dev/null
+++ b/js/router.js
@@ -0,0 +1,224 @@
+// GrowDoc Companion — Client-Side Router (History API)
+
+const ROUTES = [
+  { path: '/',                  view: 'landing',      auth: false },
+  { path: '/setup',             view: 'onboarding',   auth: false },
+  { path: '/dashboard',         view: 'dashboard',    auth: true  },
+  { path: '/grow',              view: 'my-grow',      auth: true  },
+  { path: '/grow/plant/:id',    view: 'plant-detail', auth: true  },
+  { path: '/grow/training',     view: 'training',     auth: true  },
+  { path: '/grow/environment',  view: 'environment',  auth: true  },
+  { path: '/grow/harvest',      view: 'harvest',      auth: true  },
+  { path: '/grow/feeding',      view: 'feeding',      auth: true  },
+  { path: '/grow/journal',      view: 'journal',      auth: true  },
+  { path: '/grow/dry-cure',     view: 'dry-cure',     auth: true  },
+  { path: '/tools/doctor',      view: 'doctor',       auth: false },
+  { path: '/tools/stealth',     view: 'stealth',      auth: false },
+  { path: '/knowledge',         view: 'knowledge',    auth: false },
+  { path: '/knowledge/myths',   view: 'myths',        auth: false },
+  { path: '/settings',          view: 'settings',     auth: true  },
+  { path: '/finish',            view: 'finish',       auth: true  },
+  { path: '/test',              view: 'test-runner',  auth: false },
+];
+
+let _contentEl = null;
+let _viewMap = {};
+let _currentRoute = null;
+
+/**
+ * Match a pathname to a route definition.
+ * Returns { route, params } or null if no match.
+ */
+export function matchRoute(pathname) {
+  // Normalize: strip trailing slash (except root)
+  const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
+
+  for (const route of ROUTES) {
+    const paramNames = [];
+    // Convert route path to regex: :param -> capture group
+    const pattern = route.path.replace(/:([^/]+)/g, (_, name) => {
+      paramNames.push(name);
+      return '([^/]+)';
+    });
+    const regex = new RegExp(`^${pattern}$`);
+    const match = path.match(regex);
+    if (match) {
+      const params = {};
+      paramNames.forEach((name, i) => {
+        params[name] = match[i + 1];
+      });
+      return { route, params };
+    }
+  }
+  return null;
+}
+
+/** Get the current route info. */
+export function getCurrentRoute() {
+  return _currentRoute;
+}
+
+/** Navigate to a path via pushState. */
+export function navigate(path) {
+  if (path === window.location.pathname) return;
+  window.history.pushState(null, '', path);
+  _handleRoute();
+}
+
+/** Initialize the router. Call once on app startup. */
+export function initRouter(contentEl, viewMap) {
+  _contentEl = contentEl;
+  _viewMap = viewMap;
+
+  // Intercept link clicks for SPA navigation
+  document.addEventListener('click', (e) => {
+    const link = e.target.closest('a[href]');
+    if (!link) return;
+    const href = link.getAttribute('href');
+    // Only intercept internal links (starts with /)
+    if (!href || !href.startsWith('/') || link.hasAttribute('data-external')) return;
+    e.preventDefault();
+    navigate(href);
+  });
+
+  // Handle browser back/forward
+  window.addEventListener('popstate', () => _handleRoute());
+
+  // Route to current URL
+  _handleRoute();
+}
+
+function _handleRoute() {
+  const pathname = window.location.pathname;
+  const matched = matchRoute(pathname);
+
+  // Check first-visit: no profile -> landing
+  const hasProfile = _hasProfile();
+
+  if (!matched) {
+    // Unknown route -> dashboard (or landing if no profile)
+    _currentRoute = { view: hasProfile ? 'dashboard' : 'landing', params: {} };
+    _renderView(_currentRoute.view, _currentRoute.params);
+    return;
+  }
+
+  const { route, params } = matched;
+
+  // Landing redirect: if profile exists and visiting /, go to dashboard
+  if (route.path === '/' && hasProfile) {
+    window.history.replaceState(null, '', '/dashboard');
+    _currentRoute = { view: 'dashboard', params: {} };
+    _renderView('dashboard', {});
+    return;
+  }
+
+  // Auth guard: routes requiring auth redirect to landing if no profile
+  if (route.auth && !hasProfile) {
+    window.history.replaceState(null, '', '/');
+    _currentRoute = { view: 'landing', params: {} };
+    _renderView('landing', {});
+    return;
+  }
+
+  _currentRoute = { view: route.view, params };
+  _renderView(route.view, params);
+}
+
+function _hasProfile() {
+  try {
+    return !!localStorage.getItem('growdoc-companion-profile');
+  } catch {
+    return false;
+  }
+}
+
+function _renderView(viewName, params) {
+  if (!_contentEl) return;
+
+  const viewFn = _viewMap[viewName];
+  if (viewFn) {
+    viewFn(_contentEl, params);
+  } else {
+    // Placeholder for views not yet implemented
+    _contentEl.innerHTML = '';
+    const h1 = document.createElement('h1');
+    h1.textContent = viewName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
+    const p = document.createElement('p');
+    p.textContent = 'This view is coming soon.';
+    p.className = 'text-muted';
+    _contentEl.appendChild(h1);
+    _contentEl.appendChild(p);
+  }
+
+  // Focus management: focus the heading in main content
+  const heading = _contentEl.querySelector('h1, h2, [tabindex="-1"]');
+  if (heading) {
+    heading.setAttribute('tabindex', '-1');
+    heading.focus({ preventScroll: true });
+  }
+
+  // Dispatch custom event for sidebar active-state updates
+  window.dispatchEvent(new CustomEvent('routechange', {
+    detail: { view: viewName, params, path: window.location.pathname }
+  }));
+}
+
+
+// ── Tests ──────────────────────────────────────────────────────────────
+
+export function runTests() {
+  const results = [];
+  function assert(condition, msg) {
+    results.push({ pass: !!condition, msg });
+    if (!condition) console.error(`FAIL: ${msg}`);
+  }
+
+  // Route matching: basic routes
+  const dashboard = matchRoute('/dashboard');
+  assert(dashboard !== null, 'matchRoute finds /dashboard');
+  assert(dashboard.route.view === 'dashboard', 'matchRoute returns correct view for /dashboard');
+
+  const landing = matchRoute('/');
+  assert(landing !== null, 'matchRoute finds /');
+  assert(landing.route.view === 'landing', 'matchRoute returns correct view for /');
+
+  const doctor = matchRoute('/tools/doctor');
+  assert(doctor !== null, 'matchRoute finds /tools/doctor');
+  assert(doctor.route.view === 'doctor', 'matchRoute returns correct view for /tools/doctor');
+
+  const test = matchRoute('/test');
+  assert(test !== null, 'matchRoute finds /test');
+  assert(test.route.view === 'test-runner', 'matchRoute returns correct view for /test');
+
+  // Parameterized routes
+  const plant = matchRoute('/grow/plant/abc123');
+  assert(plant !== null, 'matchRoute finds parameterized route /grow/plant/:id');
+  assert(plant.route.view === 'plant-detail', 'parameterized route returns correct view');
+  assert(plant.params.id === 'abc123', 'parameterized route extracts id param');
+
+  const plant2 = matchRoute('/grow/plant/xyz-789');
+  assert(plant2 !== null, 'matchRoute handles hyphenated param values');
+  assert(plant2.params.id === 'xyz-789', 'parameterized route extracts hyphenated id');
+
+  // Unknown routes
+  const unknown = matchRoute('/nonexistent/path');
+  assert(unknown === null, 'matchRoute returns null for unknown route');
+
+  const unknown2 = matchRoute('/grow/plant');
+  assert(unknown2 === null, 'matchRoute returns null for partial parameterized route');
+
+  // Trailing slash normalization
+  const trailingSlash = matchRoute('/dashboard/');
+  assert(trailingSlash !== null, 'matchRoute handles trailing slash');
+  assert(trailingSlash.route.view === 'dashboard', 'trailing slash matches correct route');
+
+  // All defined routes are matchable
+  for (const route of ROUTES) {
+    const testPath = route.path.replace(/:([^/]+)/g, 'test-val');
+    const m = matchRoute(testPath);
+    assert(m !== null, `route ${route.path} is matchable`);
+    assert(m.route.view === route.view, `route ${route.path} returns view ${route.view}`);
+  }
+
+  return results;
+}
diff --git a/js/tests/vercel-config.test.js b/js/tests/vercel-config.test.js
new file mode 100644
index 0000000..8eec575
--- /dev/null
+++ b/js/tests/vercel-config.test.js
@@ -0,0 +1,34 @@
+// GrowDoc Companion — Vercel Config Tests
+
+export async function runTests() {
+  const results = [];
+  function assert(condition, msg) {
+    results.push({ pass: !!condition, msg });
+    if (!condition) console.error(`FAIL: ${msg}`);
+  }
+
+  try {
+    const res = await fetch('/vercel.json?t=' + Date.now());
+    const config = await res.json();
+
+    // SPA rewrite rule exists
+    assert(Array.isArray(config.rewrites), 'vercel.json has rewrites array');
+
+    const spaRewrite = config.rewrites?.find(r => r.destination === '/index.html');
+    assert(spaRewrite !== undefined, 'vercel.json has SPA rewrite to /index.html');
+
+    if (spaRewrite) {
+      const source = spaRewrite.source || '';
+
+      // Exclusion patterns
+      const exclusions = ['api', 'legacy', 'assets', 'css', 'js', 'docs'];
+      for (const exc of exclusions) {
+        assert(source.includes(exc), `SPA rewrite excludes /${exc}/`);
+      }
+    }
+  } catch (err) {
+    assert(false, `Failed to load vercel.json: ${err.message}`);
+  }
+
+  return results;
+}
diff --git a/js/utils.js b/js/utils.js
new file mode 100644
index 0000000..f8e2f5e
--- /dev/null
+++ b/js/utils.js
@@ -0,0 +1,93 @@
+// GrowDoc Companion — Shared Utilities
+
+/**
+ * Escape HTML special characters to prevent XSS.
+ * All user-provided strings MUST pass through this before innerHTML insertion.
+ */
+export function escapeHtml(str) {
+  if (typeof str !== 'string') return '';
+  return str
+    .replace(/&/g, '&amp;')
+    .replace(/</g, '&lt;')
+    .replace(/>/g, '&gt;')
+    .replace(/"/g, '&quot;')
+    .replace(/'/g, '&#x27;');
+}
+
+/** Format an ISO date string to a human-readable date. */
+export function formatDate(isoString) {
+  if (!isoString) return '';
+  const d = new Date(isoString);
+  if (isNaN(d.getTime())) return '';
+  return d.toLocaleDateString('en-US', {
+    month: 'short', day: 'numeric', year: 'numeric'
+  });
+}
+
+/** Return the number of whole days since the given ISO date string. */
+export function daysSince(isoString) {
+  if (!isoString) return 0;
+  const d = new Date(isoString);
+  if (isNaN(d.getTime())) return 0;
+  const now = new Date();
+  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
+}
+
+/** Generate a short unique ID (8 hex chars). */
+export function generateId() {
+  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
+    .map(b => b.toString(16).padStart(2, '0'))
+    .join('');
+}
+
+/** Standard debounce — delays fn execution until ms after last call. */
+export function debounce(fn, ms) {
+  let timer;
+  return function (...args) {
+    clearTimeout(timer);
+    timer = setTimeout(() => fn.apply(this, args), ms);
+  };
+}
+
+
+// ── Tests ──────────────────────────────────────────────────────────────
+
+export function runTests() {
+  const results = [];
+  function assert(condition, msg) {
+    results.push({ pass: !!condition, msg });
+    if (!condition) console.error(`FAIL: ${msg}`);
+  }
+
+  // escapeHtml
+  assert(escapeHtml('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
+    'escapeHtml escapes tags and quotes');
+  assert(escapeHtml("it's & done") === "it&#x27;s &amp; done",
+    'escapeHtml escapes apostrophes and ampersands');
+  assert(escapeHtml('') === '', 'escapeHtml handles empty string');
+  assert(escapeHtml(null) === '', 'escapeHtml handles null');
+  assert(escapeHtml(123) === '', 'escapeHtml handles non-string');
+
+  // formatDate
+  assert(formatDate('2024-06-15T12:00:00Z').includes('Jun'), 'formatDate returns month name');
+  assert(formatDate('2024-06-15T12:00:00Z').includes('15'), 'formatDate returns day');
+  assert(formatDate('') === '', 'formatDate handles empty string');
+  assert(formatDate('not-a-date') === '', 'formatDate handles invalid date');
+
+  // daysSince
+  const yesterday = new Date(Date.now() - 86400000).toISOString();
+  assert(daysSince(yesterday) === 1, 'daysSince returns 1 for yesterday');
+  assert(daysSince('') === 0, 'daysSince handles empty string');
+
+  // generateId
+  const id1 = generateId();
+  const id2 = generateId();
+  assert(id1.length === 8, 'generateId returns 8-char string');
+  assert(/^[0-9a-f]{8}$/.test(id1), 'generateId returns hex string');
+  assert(id1 !== id2, 'generateId returns unique IDs');
+
+  // debounce
+  assert(typeof debounce(() => {}, 100) === 'function', 'debounce returns a function');
+
+  return results;
+}
diff --git a/legacy/app.js b/legacy/app.js
new file mode 100644
index 0000000..4b396a9
--- /dev/null
+++ b/legacy/app.js
@@ -0,0 +1,150 @@
+const STATUS_CONFIG = {
+  'OPEN':        { color: '#8b7355', label: 'OPEN' },
+  'IN PROGRESS': { color: '#185FA5', label: 'IN PROGRESS' },
+  'HALTED':      { color: '#BA7517', label: 'HALTED' },
+  'IN REVIEW':   { color: '#534AB7', label: 'IN REVIEW' },
+  'DONE':        { color: '#3B6D11', label: 'DONE' }
+};
+const ALL_STATUSES = Object.keys(STATUS_CONFIG);
+
+const PRIORITY_GROUPS = [
+  { priority: 1, label: 'Urgent Care', desc: 'Next days & weeks' },
+  { priority: 2, label: 'Setup & Supplies', desc: 'Refining the grow' },
+  { priority: 3, label: 'Future Runs', desc: 'Pheno hunting & yield goals' },
+  { priority: 4, label: 'Reference', desc: 'Glossary & general knowledge' }
+];
+
+let docs = [];
+let activeId = null;
+let activeFilters = new Set(ALL_STATUSES);
+let lastLoadedSrc = '';
+
+async function loadDocs() {
+  try {
+    const res = await fetch('docs/docs.json?t=' + Date.now());
+    if (!res.ok) throw new Error('Failed to load docs.json');
+    docs = await res.json();
+    if (docs.length > 0) activeId = docs[0].id;
+    render();
+  } catch (err) {
+    document.getElementById('viewer-title').textContent = 'Error loading docs';
+    document.getElementById('viewer-meta').textContent = err.message;
+  }
+}
+
+function statusBadge(status) {
+  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['OPEN'];
+  return `<span class="status-badge" style="background:${cfg.color}">${cfg.label}</span>`;
+}
+
+function render() {
+  const toolDocs = docs.filter(d => d.category === 'tool');
+  const visibleDocs = docs.filter(d => d.category !== 'tool' && activeFilters.has(d.status || 'OPEN'));
+
+  const allSelectableDocs = [...toolDocs, ...visibleDocs];
+  if (allSelectableDocs.length === 0) {
+    activeId = null;
+  } else if (!allSelectableDocs.find(d => d.id === activeId)) {
+    activeId = allSelectableDocs[0].id;
+  }
+  const active = docs.find(d => d.id === activeId) ?? null;
+
+  // Filter bar — exclude tools from counts
+  document.getElementById('filter-bar').innerHTML = ALL_STATUSES.map(s => {
+    const cfg = STATUS_CONFIG[s];
+    const on = activeFilters.has(s);
+    const count = docs.filter(d => d.category !== 'tool' && (d.status || 'OPEN') === s).length;
+    return `<button class="filter-chip ${on ? 'on' : 'off'}" style="--chip:${cfg.color}" aria-pressed="${on}" onclick="toggleFilter('${s}')">${cfg.label} <span class="count">${count}</span></button>`;
+  }).join('');
+
+  // Sidebar — tools group first, then priority groups
+  let sidebarHTML = '';
+
+  // Tools group (always visible)
+  if (toolDocs.length > 0) {
+    sidebarHTML += `<div class="priority-group prio-tools">`;
+    sidebarHTML += `<div class="priority-header" role="heading" aria-level="3">`;
+    sidebarHTML += `<span class="priority-label">Tools</span>`;
+    sidebarHTML += `<span class="priority-desc">Interactive grow utilities</span>`;
+    sidebarHTML += `</div>`;
+    sidebarHTML += toolDocs.map(d => `
+      <div class="nav-item cat-tool ${d.id === activeId ? 'active' : ''}"
+           role="button" tabindex="0" ${d.id === activeId ? 'aria-current="page"' : ''}
+           onclick="select('${d.id}')"
+           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();select('${d.id}')}">
+        <div class="nav-line">
+          <span class="icon">${d.icon}</span>
+          <span class="nav-title">${d.title}</span>
+        </div>
+        ${statusBadge(d.status || 'OPEN')}
+      </div>
+    `).join('');
+    sidebarHTML += `</div>`;
+  }
+
+  for (const group of PRIORITY_GROUPS) {
+    const groupDocs = visibleDocs.filter(d => (d.priority ?? 4) === group.priority);
+    if (groupDocs.length === 0) continue;
+    sidebarHTML += `<div class="priority-group prio-${group.priority}">`;
+    sidebarHTML += `<div class="priority-header" role="heading" aria-level="3">`;
+    sidebarHTML += `<span class="priority-label">${group.label}</span>`;
+    sidebarHTML += `<span class="priority-desc">${group.desc}</span>`;
+    sidebarHTML += `</div>`;
+    sidebarHTML += groupDocs.map(d => `
+      <div class="nav-item cat-${d.category || 'none'} ${d.id === activeId ? 'active' : ''}"
+           role="button" tabindex="0" ${d.id === activeId ? 'aria-current="page"' : ''}
+           onclick="select('${d.id}')"
+           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();select('${d.id}')}">
+        <div class="nav-line">
+          <span class="icon">${d.icon}</span>
+          <span class="nav-title">${d.title}</span>
+        </div>
+        ${statusBadge(d.status || 'OPEN')}
+      </div>
+    `).join('');
+    sidebarHTML += `</div>`;
+  }
+  document.getElementById('nav-list').innerHTML = sidebarHTML || '<div class="nav-empty">No docs match the current filter.</div>';
+
+  // Mobile nav — tools first, then priority-sorted docs
+  const sortedDocs = [...visibleDocs].sort((a, b) => (a.priority ?? 4) - (b.priority ?? 4));
+  const mobileAll = [...toolDocs, ...sortedDocs];
+  document.getElementById('mobile-nav').innerHTML = mobileAll.map(d => `
+    <div class="mobile-nav-item cat-${d.category || 'none'} ${d.id === activeId ? 'active' : ''}"
+         role="button" tabindex="0" ${d.id === activeId ? 'aria-current="page"' : ''}
+         onclick="select('${d.id}')"
+         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();select('${d.id}')}">
+      ${d.icon} ${d.title}
+    </div>
+  `).join('');
+
+  // Viewer — only reload iframe when doc actually changes
+  if (active) {
+    document.getElementById('viewer-title').textContent = active.title;
+    document.getElementById('viewer-meta').innerHTML =
+      active.subtitle + ' · ' + statusBadge(active.status || 'OPEN');
+    const newSrc = 'docs/' + active.file;
+    if (lastLoadedSrc !== newSrc) {
+      document.getElementById('viewer-iframe').src = newSrc + '?t=' + Date.now();
+      lastLoadedSrc = newSrc;
+    }
+  } else {
+    document.getElementById('viewer-title').textContent = '';
+    document.getElementById('viewer-meta').textContent = '';
+    document.getElementById('viewer-iframe').src = 'about:blank';
+    lastLoadedSrc = '';
+  }
+}
+
+function select(id) {
+  activeId = id;
+  render();
+}
+
+function toggleFilter(status) {
+  if (activeFilters.has(status)) activeFilters.delete(status);
+  else activeFilters.add(status);
+  render();
+}
+
+document.addEventListener('DOMContentLoaded', loadDocs);
diff --git a/legacy/index.html b/legacy/index.html
new file mode 100644
index 0000000..92ce99e
--- /dev/null
+++ b/legacy/index.html
@@ -0,0 +1,45 @@
+<!DOCTYPE html>
+<html lang="en">
+<head>
+  <meta charset="UTF-8">
+  <meta name="viewport" content="width=device-width, initial-scale=1.0">
+  <title>GrowDoc — Grow Planning Docs</title>
+  <link rel="stylesheet" href="style.css">
+</head>
+<body>
+  <div class="app">
+    <header class="header">
+      <div class="header-main">
+        <h1>🌿 GrowDoc</h1>
+        <p>Planning docs for the 80×80 grow project</p>
+      </div>
+      <a href="admin.html" class="admin-link">⚙ Admin</a>
+    </header>
+
+    <div class="mobile-nav" id="mobile-nav"></div>
+
+    <div class="main">
+      <nav class="sidebar" aria-label="Documents by Priority">
+        <div class="sidebar-label">Filter by status</div>
+        <div class="filter-bar" id="filter-bar"></div>
+        <div class="sidebar-label" style="margin-top:18px">Documents by Priority</div>
+        <div id="nav-list"></div>
+      </nav>
+
+      <div class="viewer">
+        <h2 class="viewer-title" id="viewer-title"></h2>
+        <div class="viewer-meta" id="viewer-meta"></div>
+        <div class="viewer-frame">
+          <iframe id="viewer-iframe" title="Document viewer"></iframe>
+        </div>
+      </div>
+    </div>
+
+    <footer class="footer">
+      GrowDoc · Shared planning docs
+    </footer>
+  </div>
+
+  <script src="app.js"></script>
+</body>
+</html>
diff --git a/legacy/style.css b/legacy/style.css
new file mode 100644
index 0000000..086a5fc
--- /dev/null
+++ b/legacy/style.css
@@ -0,0 +1,437 @@
+*, *::before, *::after {
+  box-sizing: border-box;
+  margin: 0;
+  padding: 0;
+}
+
+:root {
+  --bg: #f5f0e8;
+  --sidebar-bg: #e8dcc8;
+  --border: #d4c4a0;
+  --green-dark: #2d5016;
+  --green-mid: #4a7c23;
+  --text-dark: #4a3728;
+  --text-muted: #6b5540;
+  --white: #fff;
+  --sidebar-width: 300px;
+}
+
+html, body {
+  height: 100%;
+  font-family: Georgia, 'Times New Roman', serif;
+  background: var(--bg);
+  color: var(--text-dark);
+}
+
+/* ── Layout ── */
+.app {
+  display: flex;
+  flex-direction: column;
+  height: 100vh;
+}
+
+.header {
+  background: linear-gradient(135deg, var(--green-dark), var(--green-mid));
+  padding: 18px 28px;
+  color: var(--bg);
+  flex-shrink: 0;
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  gap: 16px;
+}
+
+.header-main h1 {
+  font-size: 1.5rem;
+  font-weight: 700;
+  letter-spacing: 0.5px;
+}
+
+.header-main p {
+  font-size: 0.85rem;
+  opacity: 0.8;
+  margin-top: 2px;
+}
+
+.admin-link {
+  color: var(--bg);
+  opacity: 0.85;
+  text-decoration: none;
+  font-size: 0.82rem;
+  padding: 6px 14px;
+  border: 1px solid rgba(245, 240, 232, 0.3);
+  border-radius: 18px;
+  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
+  transition: background 0.15s, opacity 0.15s;
+  white-space: nowrap;
+}
+
+.admin-link:hover {
+  background: rgba(245, 240, 232, 0.12);
+  opacity: 1;
+}
+
+.main {
+  display: flex;
+  flex: 1;
+  min-height: 0;
+}
+
+/* ── Sidebar ── */
+.sidebar {
+  width: var(--sidebar-width);
+  background: var(--sidebar-bg);
+  border-right: 1px solid var(--border);
+  padding: 18px 14px;
+  flex-shrink: 0;
+  overflow-y: auto;
+}
+
+.sidebar-label {
+  font-size: 0.68rem;
+  text-transform: uppercase;
+  letter-spacing: 1.5px;
+  color: var(--text-muted);
+  margin-bottom: 10px;
+  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
+}
+
+/* ── Filter chips ── */
+.filter-bar {
+  display: flex;
+  flex-wrap: wrap;
+  gap: 5px;
+}
+
+.filter-chip {
+  font-size: 0.62rem;
+  padding: 4px 8px;
+  border-radius: 12px;
+  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
+  font-weight: 600;
+  letter-spacing: 0.5px;
+  cursor: pointer;
+  border: 1px solid transparent;
+  transition: all 0.15s;
+  color: var(--white);
+  background: var(--chip);
+}
+
+.filter-chip.off {
+  background: transparent;
+  color: var(--text-muted);
+  border-color: var(--border);
+}
+
+.filter-chip:hover {
+  opacity: 0.85;
+}
+
+.filter-chip .count {
+  display: inline-block;
+  margin-left: 3px;
+  font-size: 0.6rem;
+  opacity: 0.85;
+}
+
+/* ── Priority groups ── */
+.priority-group {
+  margin-bottom: 16px;
+}
+
+.priority-group:last-child {
+  margin-bottom: 0;
+}
+
+.priority-header {
+  display: flex;
+  align-items: baseline;
+  gap: 8px;
+  padding: 10px 12px 6px;
+  border-bottom: 1px solid var(--border);
+  margin-bottom: 4px;
+}
+
+.priority-label {
+  font-size: 0.72rem;
+  font-weight: 700;
+  text-transform: uppercase;
+  letter-spacing: 1.2px;
+  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
+}
+
+.priority-desc {
+  font-size: 0.62rem;
+  color: var(--text-muted);
+  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
+}
+
+.prio-1 .priority-label { color: #b44c30; }
+.prio-1 .priority-header { border-bottom-color: rgba(180, 76, 48, 0.3); }
+
+.prio-2 .priority-label { color: #185FA5; }
+.prio-2 .priority-header { border-bottom-color: rgba(24, 95, 165, 0.3); }
+
+.prio-3 .priority-label { color: var(--green-mid); }
+.prio-3 .priority-header { border-bottom-color: rgba(74, 124, 35, 0.3); }
+
+.prio-4 .priority-label { color: var(--text-muted); }
+.prio-4 .priority-header { border-bottom-color: var(--border); }
+
+.prio-tools .priority-label { color: #4a7c23; }
+.prio-tools .priority-header { border-bottom-color: rgba(74, 124, 35, 0.4); }
+
+/* ── Nav items ── */
+.nav-item {
+  display: block;
+  padding: 9px 12px;
+  border-radius: 8px;
+  cursor: pointer;
+  transition: background 0.15s, color 0.15s;
+  margin-bottom: 4px;
+  color: var(--text-dark);
+}
+
+.nav-line {
+  display: flex;
+  align-items: center;
+  gap: 10px;
+  font-size: 0.88rem;
+  line-height: 1.3;
+  margin-bottom: 5px;
+}
+
+.nav-title {
+  flex: 1;
+  min-width: 0;
+}
+
+.nav-item .icon {
+  font-size: 1.05rem;
+  flex-shrink: 0;
+}
+
+.nav-item:hover {
+  background: rgba(45, 80, 22, 0.08);
+}
+
+/* Category tints — botanical = green, planning = blue */
+.nav-item.cat-botanical {
+  background: rgba(59, 109, 17, 0.09);
+  border-left: 3px solid rgba(59, 109, 17, 0.35);
+  padding-left: 9px;
+}
+
+.nav-item.cat-botanical:hover {
+  background: rgba(59, 109, 17, 0.18);
+}
+
+.nav-item.cat-planning {
+  background: rgba(24, 95, 165, 0.09);
+  border-left: 3px solid rgba(24, 95, 165, 0.35);
+  padding-left: 9px;
+}
+
+.nav-item.cat-planning:hover {
+  background: rgba(24, 95, 165, 0.18);
+}
+
+.nav-item.active {
+  background: var(--green-dark);
+  color: var(--bg);
+  border-left-color: var(--green-dark);
+}
+
+.nav-item.cat-planning.active {
+  background: #185FA5;
+  border-left-color: #185FA5;
+}
+
+.nav-item.cat-tool {
+  background: rgba(74, 124, 35, 0.12);
+  border-left: 3px solid rgba(74, 124, 35, 0.5);
+  padding-left: 9px;
+}
+
+.nav-item.cat-tool:hover {
+  background: rgba(74, 124, 35, 0.22);
+}
+
+.nav-item.cat-tool.active {
+  background: #4a7c23;
+  color: var(--bg);
+  border-left-color: #4a7c23;
+}
+
+.nav-empty {
+  padding: 16px 12px;
+  font-size: 0.82rem;
+  color: var(--text-muted);
+  font-style: italic;
+}
+
+/* ── Status badges ── */
+.status-badge {
+  display: inline-block;
+  font-size: 0.58rem;
+  font-weight: 700;
+  letter-spacing: 0.6px;
+  padding: 2px 7px;
+  border-radius: 4px;
+  color: var(--white);
+  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
+  text-transform: uppercase;
+  vertical-align: middle;
+}
+
+.nav-item.active .status-badge {
+  box-shadow: 0 0 0 1px rgba(245, 240, 232, 0.3);
+}
+
+/* ── Viewer ── */
+.viewer {
+  flex: 1;
+  display: flex;
+  flex-direction: column;
+  padding: 20px 24px;
+  min-width: 0;
+}
+
+.viewer-title {
+  font-size: 1.15rem;
+  color: var(--green-dark);
+  font-weight: 700;
+  margin-bottom: 4px;
+}
+
+.viewer-meta {
+  font-size: 0.75rem;
+  color: var(--text-muted);
+  margin-bottom: 14px;
+  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
+  display: flex;
+  align-items: center;
+  gap: 10px;
+}
+
+.viewer-frame {
+  flex: 1;
+  border: 1px solid var(--border);
+  border-radius: 8px;
+  overflow: hidden;
+  background: var(--white);
+}
+
+.viewer-frame iframe {
+  width: 100%;
+  height: 100%;
+  border: none;
+  display: block;
+}
+
+/* ── Footer ── */
+.footer {
+  background: var(--sidebar-bg);
+  border-top: 1px solid var(--border);
+  padding: 10px 28px;
+  font-size: 0.7rem;
+  color: var(--text-muted);
+  text-align: center;
+  flex-shrink: 0;
+  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
+}
+
+/* ── Mobile ── */
+.mobile-nav {
+  display: none;
+}
+
+@media (max-width: 768px) {
+  .sidebar {
+    display: none;
+  }
+
+  .mobile-nav {
+    display: flex;
+    background: var(--sidebar-bg);
+    border-bottom: 1px solid var(--border);
+    padding: 8px 12px;
+    gap: 6px;
+    overflow-x: auto;
+    flex-shrink: 0;
+    -webkit-overflow-scrolling: touch;
+  }
+
+  .mobile-nav {
+    scrollbar-width: none;
+  }
+
+  .mobile-nav::-webkit-scrollbar {
+    display: none;
+  }
+
+  .mobile-nav-item {
+    flex-shrink: 0;
+    padding: 8px 14px;
+    min-height: 44px;
+    display: flex;
+    align-items: center;
+    border-radius: 20px;
+    font-size: 0.78rem;
+    cursor: pointer;
+    white-space: nowrap;
+    color: var(--text-dark);
+    background: transparent;
+    border: 1px solid var(--border);
+    transition: background 0.15s, color 0.15s;
+    font-family: Georgia, 'Times New Roman', serif;
+  }
+
+  .mobile-nav-item:hover {
+    background: rgba(45, 80, 22, 0.08);
+  }
+
+  .mobile-nav-item.cat-botanical {
+    border-color: rgba(59, 109, 17, 0.4);
+    background: rgba(59, 109, 17, 0.06);
+  }
+
+  .mobile-nav-item.cat-planning {
+    border-color: rgba(24, 95, 165, 0.4);
+    background: rgba(24, 95, 165, 0.06);
+  }
+
+  .mobile-nav-item.active {
+    background: var(--green-dark);
+    color: var(--bg);
+    border-color: var(--green-dark);
+  }
+
+  .mobile-nav-item.cat-planning.active {
+    background: #185FA5;
+    border-color: #185FA5;
+  }
+
+  .mobile-nav-item.cat-tool {
+    border-color: rgba(74, 124, 35, 0.5);
+    background: rgba(74, 124, 35, 0.08);
+  }
+
+  .mobile-nav-item.cat-tool.active {
+    background: #4a7c23;
+    color: var(--bg);
+    border-color: #4a7c23;
+  }
+
+  .viewer {
+    padding: 14px 12px;
+  }
+
+  .header {
+    padding: 14px 16px;
+  }
+
+  .header-main h1 {
+    font-size: 1.2rem;
+  }
+}
diff --git a/vercel.json b/vercel.json
index ad14d68..00ee71f 100644
--- a/vercel.json
+++ b/vercel.json
@@ -5,6 +5,9 @@
       "maxDuration": 10
     }
   },
+  "rewrites": [
+    { "source": "/((?!api|legacy|assets|css|js|docs).*)", "destination": "/index.html" }
+  ],
   "headers": [
     {
       "source": "/docs/docs.json",
