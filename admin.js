// ─────────────────────────────────────────────────────────────
// GrowDoc Admin — talks to our Vercel backend, which holds the
// single GitHub token. Friends only need the team password.
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  'OPEN':        '#8b7355',
  'IN PROGRESS': '#185FA5',
  'HALTED':      '#BA7517',
  'IN REVIEW':   '#534AB7',
  'DONE':        '#3B6D11'
};

const API_BASE = ''; // same origin — Vercel serves both site and API

let state = {
  token: null,
  docs: [],
  sha: null
};

// ── API client ──────────────────────────────────────────────
async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ── Auth ────────────────────────────────────────────────────
async function signIn(password) {
  const result = await api('/api/login', { method: 'POST', body: { password } });
  state.token = result.token;
  localStorage.setItem('growdoc-token', result.token);
}

function signOut() {
  localStorage.removeItem('growdoc-token');
  state.token = null;
  location.reload();
}

async function loadState() {
  const result = await api('/api/state');
  state.docs = result.docs;
  state.sha = result.sha;
}

// ── Content converters ─────────────────────────────────────
const THEME_TEMPLATE = (title, body) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
:root{--bg:#faf9f6;--fg:#1a1a18;--mu:#6b6a65;--gn:#3B6D11;--gl:#EAF3DE;--am:#BA7517;--al:#FAEEDA;--co:#D85A30;--cl:#FAECE7;--rd:#A32D2D;--rl:#FCEBEB;--bl:#185FA5;--bll:#E6F1FB;--tl:#0F6E56;--tll:#E1F5EE;--pu:#534AB7;--pl:#EEEDFE;--bd:#e5e3dc;--sf:#f1efe8}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:var(--bg);color:var(--fg);line-height:1.72;max-width:840px;margin:0 auto;padding:2rem 1.5rem 4rem}
h1{font-family:Georgia,serif;font-size:2rem;font-weight:400;line-height:1.2;margin:0 0 .4rem}
h2{font-size:1.15rem;font-weight:700;margin:2.5rem 0 .75rem;padding-top:1.5rem;border-top:1px solid var(--bd)}
h3{font-size:.95rem;font-weight:700;margin:1.5rem 0 .5rem}
h4{font-size:.88rem;font-weight:700;margin:1.2rem 0 .4rem}
p{margin:0 0 .75rem;font-size:.9rem}
.sub{font-size:.92rem;color:var(--mu);margin:0 0 2rem;line-height:1.6}
ul,ol{margin:0 0 .75rem 1.5rem;font-size:.9rem}
li{margin:0 0 .3rem}
blockquote{border-left:3px solid var(--bd);padding:.5rem 1rem;margin:1rem 0;color:var(--mu);font-style:italic;background:var(--sf);border-radius:0 6px 6px 0}
code{background:var(--sf);padding:1px 6px;border-radius:3px;font-size:.85em;font-family:'SF Mono',Consolas,Monaco,monospace}
pre{background:var(--sf);padding:12px 16px;border-radius:8px;overflow-x:auto;margin:1rem 0;font-size:.82rem}
pre code{background:none;padding:0}
a{color:var(--bl);text-decoration:underline}
a:hover{color:var(--gn)}
table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.82rem}
th{background:var(--sf);text-align:left;padding:7px 10px;font-weight:600;border-bottom:2px solid var(--bd)}
td{padding:7px 10px;border-bottom:1px solid var(--bd)}
tr:last-child td{border-bottom:none}
img{max-width:100%;height:auto;border-radius:8px;margin:1rem 0}
hr{border:none;border-top:1px solid var(--bd);margin:2rem 0}
.tip{background:var(--gl);border-left:3px solid var(--gn);padding:10px 14px;border-radius:0 8px 8px 0;margin:1rem 0;font-size:.84rem}
.warn{background:var(--cl);border-left:3px solid var(--co);padding:10px 14px;border-radius:0 8px 8px 0;margin:1rem 0;font-size:.84rem}
.da{background:var(--pl);border-left:3px solid var(--pu);padding:10px 14px;border-radius:0 8px 8px 0;margin:1rem 0;font-size:.84rem}
.danger{background:var(--rl);border-left:3px solid var(--rd);padding:10px 14px;border-radius:0 8px 8px 0;margin:1rem 0;font-size:.84rem}
</style>
</head>
<body>
${body}
</body>
</html>`;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function markdownToHtml(md, title) {
  if (typeof marked === 'undefined') throw new Error('Markdown library not loaded');
  const body = marked.parse(md);
  return THEME_TEMPLATE(title, body);
}

function textToHtml(text, title) {
  const paragraphs = text.trim().split(/\n\s*\n/).map(p =>
    `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`
  ).join('\n');
  return THEME_TEMPLATE(title, paragraphs);
}

function wrapHtmlFragment(html, title) {
  if (/<!DOCTYPE|<html[\s>]/i.test(html)) return html;
  return THEME_TEMPLATE(title, html);
}

// ── Render UI ───────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function showLogin() {
  $('login-panel').classList.remove('hidden');
  $('admin-panel').classList.add('hidden');
}

function showAdmin() {
  $('login-panel').classList.add('hidden');
  $('admin-panel').classList.remove('hidden');
}

function renderDocsTable() {
  const tbody = $('docs-tbody');
  if (state.docs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted" style="text-align:center;padding:28px">No docs yet. Click "Add new doc" to get started.</td></tr>';
    return;
  }
  tbody.innerHTML = state.docs.map((d, i) => {
    const status = d.status || 'OPEN';
    const statusColor = STATUS_CONFIG[status];
    return `
      <tr>
        <td><span class="doc-icon">${d.icon}</span></td>
        <td>
          <div class="doc-title">${escapeHtml(d.title)}</div>
          <div class="doc-subtitle">${escapeHtml(d.subtitle || '')}</div>
        </td>
        <td>
          <select class="status-select" style="background:${statusColor}" onchange="changeStatus(${i}, this.value)">
            ${Object.keys(STATUS_CONFIG).map(s =>
              `<option value="${s}" ${s === status ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </td>
        <td class="w-actions">
          <button class="btn small" onclick="openEditModal(${i})">✏️ Edit</button>
          <button class="btn small danger" onclick="deleteDoc(${i})">🗑</button>
        </td>
      </tr>
    `;
  }).join('');
}

function showNotice(message, type = 'info', duration = 5000) {
  const el = $('notice');
  el.className = `notice ${type}`;
  el.textContent = message;
  el.classList.remove('hidden');
  if (duration > 0) {
    setTimeout(() => el.classList.add('hidden'), duration);
  }
}

// ── Modal form ──────────────────────────────────────────────
let editingIndex = null;

function openEditModal(index) {
  editingIndex = index;
  const isNew = index === null || index === undefined;
  const doc = isNew ? { icon: '📄', title: '', subtitle: '', status: 'OPEN', file: '' } : state.docs[index];

  $('modal-title').textContent = isNew ? 'Add new doc' : 'Edit doc';
  $('form-original-file').value = isNew ? '' : doc.file;
  $('form-icon').value = doc.icon;
  $('form-title').value = doc.title;
  $('form-subtitle').value = doc.subtitle || '';
  $('form-status').value = doc.status || 'OPEN';
  $('form-file').value = doc.file;
  $('form-file').readOnly = false;

  // Reset content tabs
  $('form-html').value = '';
  $('form-markdown').value = '';
  $('form-text').value = '';
  $('form-upload').value = '';
  $('upload-info').textContent = '';
  $('form-error').textContent = '';
  delete $('form-file').dataset.manual;

  // For new docs: default to HTML tab. For existing: default to Keep existing.
  switchTab(isNew ? 'html' : 'keep');

  $('modal-backdrop').classList.remove('hidden');
}

function closeModal() {
  $('modal-backdrop').classList.add('hidden');
  editingIndex = null;
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === name));
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function setupAutoFilename() {
  $('form-title').addEventListener('input', () => {
    if (!$('form-file').dataset.manual && editingIndex === null) {
      const slug = slugify($('form-title').value);
      $('form-file').value = slug ? slug + '.html' : '';
    }
  });
  $('form-file').addEventListener('input', () => {
    $('form-file').dataset.manual = '1';
  });
}

async function getContentFromForm(title) {
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  switch (activeTab) {
    case 'html': {
      const html = $('form-html').value.trim();
      if (!html) throw new Error('HTML content is empty');
      return wrapHtmlFragment(html, title);
    }
    case 'upload': {
      const file = $('form-upload').files[0];
      if (!file) throw new Error('No file selected');
      const text = await file.text();
      return wrapHtmlFragment(text, title);
    }
    case 'markdown': {
      const md = $('form-markdown').value.trim();
      if (!md) throw new Error('Markdown content is empty');
      return markdownToHtml(md, title);
    }
    case 'text': {
      const text = $('form-text').value.trim();
      if (!text) throw new Error('Text content is empty');
      return textToHtml(text, title);
    }
    case 'keep':
      return null;
  }
}

// ── Save / delete / status ──────────────────────────────────
async function saveDoc(e) {
  e.preventDefault();
  const saveBtn = $('save-btn');
  const errorEl = $('form-error');
  errorEl.textContent = '';
  saveBtn.disabled = true;
  saveBtn.textContent = '⏳ Saving...';

  try {
    const isNew = editingIndex === null;
    const title = $('form-title').value.trim();
    const fileName = $('form-file').value.trim();

    if (!/^[a-z0-9\-]+\.html$/.test(fileName)) {
      throw new Error('File name must be lowercase letters, numbers, hyphens, ending in .html');
    }

    const meta = {
      id: isNew ? slugify(title) || slugify(fileName.replace('.html', '')) : state.docs[editingIndex].id,
      title,
      subtitle: $('form-subtitle').value.trim(),
      icon: $('form-icon').value.trim() || '📄',
      status: $('form-status').value,
      file: fileName
    };

    // Prevent duplicate IDs
    if (isNew) {
      let baseId = meta.id;
      let counter = 2;
      while (state.docs.some(d => d.id === meta.id)) {
        meta.id = baseId + '-' + counter++;
      }
    }

    // Content
    const html = await getContentFromForm(title);
    const originalFile = $('form-original-file').value;
    const fileRenamed = !isNew && originalFile && originalFile !== fileName;

    // Build new docs array
    const newDocs = [...state.docs];
    if (isNew) newDocs.push(meta);
    else newDocs[editingIndex] = meta;

    // Figure out upsertFile + deleteFile
    let upsertFile = null;
    let deleteFileName = null;

    if (html !== null) {
      upsertFile = { name: fileName, content: html };
    } else if (fileRenamed) {
      // Keep-existing + renamed: need to fetch old content and write to new name
      // For simplicity in this flow: require new content when renaming
      throw new Error('To rename a file, please also provide new content (or keep the old filename).');
    }

    if (fileRenamed && originalFile) {
      deleteFileName = originalFile;
    }

    const result = await api('/api/save', {
      method: 'POST',
      body: {
        docs: newDocs,
        sha: state.sha,
        upsertFile,
        deleteFileName,
        commitNote: `${isNew ? 'Add' : 'Update'} doc: ${meta.title}`
      }
    });

    state.docs = newDocs;
    state.sha = result.sha;
    renderDocsTable();
    closeModal();
    showNotice(`✓ ${isNew ? 'Added' : 'Updated'} "${meta.title}" — live in ~30 seconds`, 'success');
  } catch (err) {
    if (err.status === 409) {
      errorEl.textContent = err.message;
      // Refresh state so next attempt has the latest SHA
      try { await loadState(); renderDocsTable(); } catch {}
    } else {
      errorEl.textContent = 'Error: ' + err.message;
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save & publish';
  }
}

async function changeStatus(index, newStatus) {
  const doc = state.docs[index];
  const oldStatus = doc.status;
  const newDocs = state.docs.map((d, i) => i === index ? { ...d, status: newStatus } : d);

  try {
    const result = await api('/api/save', {
      method: 'POST',
      body: {
        docs: newDocs,
        sha: state.sha,
        commitNote: `Status: "${doc.title}" → ${newStatus}`
      }
    });
    state.docs = newDocs;
    state.sha = result.sha;
    renderDocsTable();
    showNotice(`✓ Status updated — live in ~30 seconds`, 'success', 3000);
  } catch (err) {
    // Revert select value
    doc.status = oldStatus;
    renderDocsTable();
    if (err.status === 409) {
      showNotice(err.message, 'error');
      try { await loadState(); renderDocsTable(); } catch {}
    } else {
      showNotice('Error: ' + err.message, 'error');
    }
  }
}

async function deleteDoc(index) {
  const doc = state.docs[index];
  if (!confirm(`Delete "${doc.title}"? The HTML file will also be removed.`)) return;

  const newDocs = state.docs.filter((_, i) => i !== index);
  try {
    const result = await api('/api/save', {
      method: 'POST',
      body: {
        docs: newDocs,
        sha: state.sha,
        deleteFileName: doc.file,
        commitNote: `Delete doc: ${doc.title}`
      }
    });
    state.docs = newDocs;
    state.sha = result.sha;
    renderDocsTable();
    showNotice(`✓ Deleted "${doc.title}"`, 'success');
  } catch (err) {
    if (err.status === 409) {
      showNotice(err.message, 'error');
      try { await loadState(); renderDocsTable(); } catch {}
    } else {
      showNotice('Error deleting: ' + err.message, 'error');
    }
  }
}

// ── Wire it up ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Login form
  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = $('password-input').value;
    $('login-error').textContent = '';
    $('login-btn').disabled = true;
    try {
      await signIn(password);
      await loadState();
      renderDocsTable();
      showAdmin();
    } catch (err) {
      $('login-error').textContent = err.status === 401
        ? 'Wrong password.'
        : 'Error: ' + err.message;
    } finally {
      $('login-btn').disabled = false;
      $('password-input').value = '';
    }
  });

  $('signout-btn').addEventListener('click', signOut);
  $('add-btn').addEventListener('click', () => openEditModal(null));
  $('modal-close').addEventListener('click', closeModal);
  $('cancel-btn').addEventListener('click', closeModal);
  $('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });

  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  $('form-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    $('upload-info').textContent = file
      ? `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      : '';
  });

  $('doc-form').addEventListener('submit', saveDoc);
  setupAutoFilename();

  // Try restore session
  const storedToken = localStorage.getItem('growdoc-token');
  if (storedToken) {
    state.token = storedToken;
    try {
      await loadState();
      renderDocsTable();
      showAdmin();
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('growdoc-token');
        state.token = null;
      }
      showLogin();
    }
  } else {
    showLogin();
  }
});

// Expose for inline onclick handlers
window.openEditModal = openEditModal;
window.deleteDoc = deleteDoc;
window.changeStatus = changeStatus;
