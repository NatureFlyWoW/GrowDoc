diff --git a/app.js b/app.js
index a17d7aa..4b396a9 100644
--- a/app.js
+++ b/app.js
@@ -38,24 +38,50 @@ function statusBadge(status) {
 }
 
 function render() {
-  const visibleDocs = docs.filter(d => activeFilters.has(d.status || 'OPEN'));
-  if (visibleDocs.length === 0) {
+  const toolDocs = docs.filter(d => d.category === 'tool');
+  const visibleDocs = docs.filter(d => d.category !== 'tool' && activeFilters.has(d.status || 'OPEN'));
+
+  const allSelectableDocs = [...toolDocs, ...visibleDocs];
+  if (allSelectableDocs.length === 0) {
     activeId = null;
-  } else if (!visibleDocs.find(d => d.id === activeId)) {
-    activeId = visibleDocs[0].id;
+  } else if (!allSelectableDocs.find(d => d.id === activeId)) {
+    activeId = allSelectableDocs[0].id;
   }
-  const active = visibleDocs.find(d => d.id === activeId) ?? null;
+  const active = docs.find(d => d.id === activeId) ?? null;
 
-  // Filter bar
+  // Filter bar — exclude tools from counts
   document.getElementById('filter-bar').innerHTML = ALL_STATUSES.map(s => {
     const cfg = STATUS_CONFIG[s];
     const on = activeFilters.has(s);
-    const count = docs.filter(d => (d.status || 'OPEN') === s).length;
+    const count = docs.filter(d => d.category !== 'tool' && (d.status || 'OPEN') === s).length;
     return `<button class="filter-chip ${on ? 'on' : 'off'}" style="--chip:${cfg.color}" aria-pressed="${on}" onclick="toggleFilter('${s}')">${cfg.label} <span class="count">${count}</span></button>`;
   }).join('');
 
-  // Sidebar — grouped by priority
+  // Sidebar — tools group first, then priority groups
   let sidebarHTML = '';
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
   for (const group of PRIORITY_GROUPS) {
     const groupDocs = visibleDocs.filter(d => (d.priority ?? 4) === group.priority);
     if (groupDocs.length === 0) continue;
@@ -80,9 +106,10 @@ function render() {
   }
   document.getElementById('nav-list').innerHTML = sidebarHTML || '<div class="nav-empty">No docs match the current filter.</div>';
 
-  // Mobile nav — sorted by priority
+  // Mobile nav — tools first, then priority-sorted docs
   const sortedDocs = [...visibleDocs].sort((a, b) => (a.priority ?? 4) - (b.priority ?? 4));
-  document.getElementById('mobile-nav').innerHTML = sortedDocs.map(d => `
+  const mobileAll = [...toolDocs, ...sortedDocs];
+  document.getElementById('mobile-nav').innerHTML = mobileAll.map(d => `
     <div class="mobile-nav-item cat-${d.category || 'none'} ${d.id === activeId ? 'active' : ''}"
          role="button" tabindex="0" ${d.id === activeId ? 'aria-current="page"' : ''}
          onclick="select('${d.id}')"
diff --git a/docs/docs.json b/docs/docs.json
index 1fde9b9..a2105d2 100644
--- a/docs/docs.json
+++ b/docs/docs.json
@@ -108,5 +108,41 @@
     "category": "botanical",
     "priority": 4,
     "file": "glossary.html"
+  },
+  {
+    "id": "plant-doctor",
+    "title": "Plant Doctor",
+    "subtitle": "Interactive symptom diagnosis",
+    "icon": "🩺",
+    "status": "DONE",
+    "category": "tool",
+    "file": "tool-plant-doctor.html"
+  },
+  {
+    "id": "env-dashboard",
+    "title": "Environment Dashboard",
+    "subtitle": "VPD + DLI calculator & chart",
+    "icon": "🌡️",
+    "status": "DONE",
+    "category": "tool",
+    "file": "tool-env-dashboard.html"
+  },
+  {
+    "id": "cure-tracker",
+    "title": "Drying & Cure Tracker",
+    "subtitle": "Harvest-to-jar protocol tracker",
+    "icon": "🫙",
+    "status": "DONE",
+    "category": "tool",
+    "file": "tool-cure-tracker.html"
+  },
+  {
+    "id": "stealth-audit",
+    "title": "Stealth Audit",
+    "subtitle": "Monthly OPSEC security checklist",
+    "icon": "🔒",
+    "status": "DONE",
+    "category": "tool",
+    "file": "tool-stealth-audit.html"
   }
 ]
diff --git a/style.css b/style.css
index 04dc199..086a5fc 100644
--- a/style.css
+++ b/style.css
@@ -178,6 +178,9 @@ html, body {
 .prio-4 .priority-label { color: var(--text-muted); }
 .prio-4 .priority-header { border-bottom-color: var(--border); }
 
+.prio-tools .priority-label { color: #4a7c23; }
+.prio-tools .priority-header { border-bottom-color: rgba(74, 124, 35, 0.4); }
+
 /* ── Nav items ── */
 .nav-item {
   display: block;
@@ -244,6 +247,22 @@ html, body {
   border-left-color: #185FA5;
 }
 
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
 .nav-empty {
   padding: 16px 12px;
   font-size: 0.82rem;
@@ -393,6 +412,17 @@ html, body {
     border-color: #185FA5;
   }
 
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
   .viewer {
     padding: 14px 12px;
   }
