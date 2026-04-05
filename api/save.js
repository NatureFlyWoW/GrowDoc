import { handleCors } from './_lib/cors.js';
import { requireAuth } from './_lib/auth.js';
import { getFile, putFile, deleteFile, isConflict } from './_lib/github.js';

const FILE_NAME_RE = /^[a-z0-9\-]+\.html$/;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!requireAuth(req)) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const body = req.body || {};
    const { docs, sha, upsertFile, deleteFileName, commitNote } = body;

    // Validate
    if (!Array.isArray(docs)) {
      return res.status(400).json({ error: 'docs array required' });
    }
    if (docs.length > 200) {
      return res.status(400).json({ error: 'Too many docs' });
    }
    for (const d of docs) {
      if (!d.id || !d.title || !d.file || !d.icon) {
        return res.status(400).json({ error: 'Each doc needs id, title, file, icon' });
      }
      if (!FILE_NAME_RE.test(d.file)) {
        return res.status(400).json({ error: `Invalid file name: ${d.file}` });
      }
    }
    if (upsertFile) {
      if (!FILE_NAME_RE.test(upsertFile.name || '')) {
        return res.status(400).json({ error: 'Invalid upsert file name' });
      }
      if (typeof upsertFile.content !== 'string' || upsertFile.content.length === 0) {
        return res.status(400).json({ error: 'upsertFile.content required' });
      }
      if (upsertFile.content.length > 500_000) {
        return res.status(400).json({ error: 'File content too large (max 500KB)' });
      }
    }
    if (deleteFileName && !FILE_NAME_RE.test(deleteFileName)) {
      return res.status(400).json({ error: 'Invalid delete file name' });
    }

    // 1. Upsert HTML file if provided
    if (upsertFile) {
      const path = `docs/${upsertFile.name}`;
      const existing = await getFile(path);
      await putFile(
        path,
        upsertFile.content,
        `Save ${upsertFile.name}`,
        existing?.sha || null
      );
    }

    // 2. Delete HTML file if requested (and different from upsert — safety)
    if (deleteFileName && deleteFileName !== upsertFile?.name) {
      const path = `docs/${deleteFileName}`;
      const existing = await getFile(path);
      if (existing) {
        await deleteFile(path, existing.sha, `Delete ${deleteFileName}`);
      }
    }

    // 3. Update docs.json with SHA guard (optimistic concurrency)
    try {
      await putFile(
        'docs/docs.json',
        JSON.stringify(docs, null, 2) + '\n',
        commitNote || 'Update docs.json',
        sha || null
      );
    } catch (err) {
      if (isConflict(err)) {
        return res.status(409).json({
          error: 'Someone else edited first — refresh and try again',
          conflict: true
        });
      }
      throw err;
    }

    // Return new SHA for client to continue with
    const latest = await getFile('docs/docs.json');
    res.status(200).json({ ok: true, sha: latest?.sha || null });
  } catch (err) {
    console.error('save.js error:', err);
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
