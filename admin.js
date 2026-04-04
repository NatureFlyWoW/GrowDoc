// ─────────────────────────────────────────────────────────────
// GrowDoc Admin — GitHub API client for collaborative editing
// ─────────────────────────────────────────────────────────────

const REPO_OWNER = 'NatureFlyWoW';
const REPO_NAME = 'GrowDoc';
const DOCS_JSON_PATH = 'docs/docs.json';
const DOCS_DIR = 'docs';
const BRANCH = 'main';

const STATUS_CONFIG = {
  'OPEN':        '#8b7355',
  'IN PROGRESS': '#185FA5',
  'HALTED':      '#BA7517',
  'IN REVIEW':   '#534AB7',
  'DONE':        '#3B6D11'
};

let state = {
  pat: null,
  user: null,
  docs: [],
  docsJsonSha: null
};

// ── Base64 helpers (UTF-8 safe) ─────────────────────────────
function b64encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64decode(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));
}

// ── GitHub API ──────────────────────────────────────────────
async function gh(path, options = {}) {
  const url = `https://api.github.com${path}`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...options.headers
  };
  if (state.pat) headers['Authorization'] = `Bearer ${state.pat}`;
  if (options.body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, { ...options, headers });
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function getFile(path) {
  try {
    const data = await gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`);
    return { content: b64decode(data.content), sha: data.sha };
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

async function putFile(path, content, message, sha = null) {
  const body = {
    message,
    content: b64encode(content),
    branch: BRANCH
  };
  if (sha) body.sha = sha;
  return gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

async function deleteFile(path, sha, message) {
  return gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha, branch: BRANCH })
  });
}

// ── Auth ────────────────────────────────────────────────────
async function signIn(pat) {
  state.pat = pat;
  const user = await gh('/user');
  state.user = user;
  localStorage.setItem('growdoc-pat', pat);
  return user;
}

function signOut() {
  localStorage.removeItem('growdoc-pat');
  state.pat = null;
  state.user = null;
  location.reload();
}

async function tryRestoreSession() {
  const stored = localStorage.getItem('growdoc-pat');
  if (!stored) return false;
  try {
    state.pat = stored;
    state.user = await gh('/user');
    return true;
  } catch {
    localStorage.removeItem('growdoc-pat');
    state.pat = null;
    return false;
  }
}

// ── Load docs ───────────────────────────────────────────────
async function loadDocs() {
  const file = await getFile(DOCS_JSON_PATH);
  if (!file) {
    state.docs = [];
    state.docsJsonSha = null;
    return;
  }
  state.docs = JSON.parse(file.content);
  state.docsJsonSha = file.sha;
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
  // If it's already a full document, return as-is
  if (/<!DOCTYPE|<html[\s>]/i.test(html)) return html;
  // Otherwise wrap in the theme template
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
  $('who-name').textContent = '@' + state.user.login;
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
  $('form-id').value = isNew ? '' : doc.id;
  $('form-original-file').value = isNew ? '' : doc.file;
  $('form-icon').value = doc.icon;
  $('form-title').value = doc.title;
  $('form-subtitle').value = doc.subtitle || '';
  $('form-status').value = doc.status || 'OPEN';
  $('form-file').value = doc.file;
  $('form-file').readOnly = !isNew;

  // Reset content tabs
  $('form-html').value = '';
  $('form-markdown').value = '';
  $('form-text').value = '';
  $('form-upload').value = '';
  $('upload-info').textContent = '';
  $('form-error').textContent = '';

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

// Auto-generate file name from title for new docs
function setupAutoFilename() {
  $('form-title').addEventListener('input', () => {
    if (!$('form-file').readOnly && !$('form-file').dataset.manual) {
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

// ── Save / delete ───────────────────────────────────────────
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

    // Get the content
    const html = await getContentFromForm(title);
    const originalFile = $('form-original-file').value;
    const fileRenamed = !isNew && originalFile && originalFile !== fileName;

    // 1. Write the HTML file (if new content provided OR file was renamed)
    if (html !== null || fileRenamed) {
      const path = `${DOCS_DIR}/${fileName}`;
      let existing = null;
      try { existing = await getFile(path); } catch {}

      let contentToWrite = html;
      if (contentToWrite === null && fileRenamed) {
        // Just moving content from old file to new file
        const oldFile = await getFile(`${DOCS_DIR}/${originalFile}`);
        if (!oldFile) throw new Error('Original file not found');
        contentToWrite = oldFile.content;
      }

      await putFile(
        path,
        contentToWrite,
        `${isNew ? 'Add' : 'Update'} ${fileName}`,
        existing?.sha || null
      );

      // Delete old file if renamed
      if (fileRenamed) {
        const oldPath = `${DOCS_DIR}/${originalFile}`;
        const oldFile = await getFile(oldPath);
        if (oldFile) {
          await gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${oldPath}`, {
            method: 'DELETE',
            body: JSON.stringify({
              message: `Remove ${originalFile} (renamed to ${fileName})`,
              sha: oldFile.sha,
              branch: BRANCH
            })
          });
        }
      }
    }

    // 2. Update docs.json
    if (isNew) {
      state.docs.push(meta);
    } else {
      state.docs[editingIndex] = meta;
    }

    await putFile(
      DOCS_JSON_PATH,
      JSON.stringify(state.docs, null, 2) + '\n',
      `${isNew ? 'Add' : 'Update'} doc: ${meta.title}`,
      state.docsJsonSha
    );

    // Refresh state
    await loadDocs();
    renderDocsTable();
    closeModal();
    showNotice(`✓ ${isNew ? 'Added' : 'Updated'} "${meta.title}" — live in ~60 seconds`, 'success');
  } catch (err) {
    if (err.status === 409 || /sha|conflict/i.test(err.message)) {
      errorEl.textContent = 'Someone else edited first — refresh the page and try again.';
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
  doc.status = newStatus;
  try {
    await putFile(
      DOCS_JSON_PATH,
      JSON.stringify(state.docs, null, 2) + '\n',
      `Set status of "${doc.title}" → ${newStatus}`,
      state.docsJsonSha
    );
    await loadDocs();
    renderDocsTable();
    showNotice(`✓ Status updated — live in ~60 seconds`, 'success', 3000);
  } catch (err) {
    doc.status = oldStatus;
    renderDocsTable();
    if (err.status === 409) {
      showNotice('Someone else edited first — refresh the page and try again.', 'error');
    } else {
      showNotice('Error: ' + err.message, 'error');
    }
  }
}

async function deleteDoc(index) {
  const doc = state.docs[index];
  if (!confirm(`Delete "${doc.title}"? The HTML file will also be removed.`)) return;

  try {
    // Delete the HTML file
    const htmlPath = `${DOCS_DIR}/${doc.file}`;
    const htmlFile = await getFile(htmlPath);
    if (htmlFile) {
      await deleteFile(htmlPath, htmlFile.sha, `Delete ${doc.file}`);
    }

    // Update docs.json
    state.docs.splice(index, 1);
    await putFile(
      DOCS_JSON_PATH,
      JSON.stringify(state.docs, null, 2) + '\n',
      `Delete doc: ${doc.title}`,
      state.docsJsonSha
    );

    await loadDocs();
    renderDocsTable();
    showNotice(`✓ Deleted "${doc.title}"`, 'success');
  } catch (err) {
    showNotice('Error deleting: ' + err.message, 'error');
    await loadDocs();
    renderDocsTable();
  }
}

// ── Wire it up ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  $('repo-label').textContent = `${REPO_OWNER}/${REPO_NAME}`;

  // Login form
  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pat = $('pat-input').value.trim();
    $('login-error').textContent = '';
    try {
      await signIn(pat);
      await loadDocs();
      renderDocsTable();
      showAdmin();
    } catch (err) {
      $('login-error').textContent = err.status === 401
        ? 'Invalid token. Make sure it has public_repo scope.'
        : 'Error: ' + err.message;
      state.pat = null;
    }
  });

  // Sign out
  $('signout-btn').addEventListener('click', signOut);

  // Add button
  $('add-btn').addEventListener('click', () => openEditModal(null));

  // Modal controls
  $('modal-close').addEventListener('click', closeModal);
  $('cancel-btn').addEventListener('click', closeModal);
  $('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  // Upload info
  $('form-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    $('upload-info').textContent = file
      ? `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      : '';
  });

  // Form submit
  $('doc-form').addEventListener('submit', saveDoc);

  setupAutoFilename();

  // Try restore session
  const restored = await tryRestoreSession();
  if (restored) {
    try {
      await loadDocs();
      renderDocsTable();
      showAdmin();
    } catch (err) {
      showNotice('Failed to load docs: ' + err.message, 'error', 0);
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
