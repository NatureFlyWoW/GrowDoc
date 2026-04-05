const BRANCH = 'main';

function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function ghRequest(path, options = {}) {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Authorization': `Bearer ${getEnv('GITHUB_TOKEN')}`,
      'User-Agent': 'GrowDoc-Admin',
      ...options.headers
    }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || `GitHub API ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function b64encode(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

function b64decode(b64) {
  return Buffer.from(b64, 'base64').toString('utf-8');
}

function repoPath(path) {
  const owner = getEnv('GITHUB_REPO_OWNER');
  const name = getEnv('GITHUB_REPO_NAME');
  return `/repos/${owner}/${name}/contents/${path}`;
}

export async function getFile(path) {
  try {
    const data = await ghRequest(`${repoPath(path)}?ref=${BRANCH}`);
    return { content: b64decode(data.content), sha: data.sha };
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function putFile(path, content, message, sha = null) {
  const body = { message, content: b64encode(content), branch: BRANCH };
  if (sha) body.sha = sha;
  return ghRequest(repoPath(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function deleteFile(path, sha, message) {
  return ghRequest(repoPath(path), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: BRANCH })
  });
}

export function isConflict(err) {
  if (err.status === 409) return true;
  const msg = (err.message || '').toLowerCase();
  return msg.includes('does not match') || msg.includes('sha') && msg.includes('conflict');
}
