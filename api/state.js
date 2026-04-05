import { handleCors } from './_lib/cors.js';
import { requireAuth } from './_lib/auth.js';
import { getFile } from './_lib/github.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!requireAuth(req)) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const file = await getFile('docs/docs.json');
    if (!file) {
      res.status(200).json({ docs: [], sha: null });
      return;
    }
    res.status(200).json({
      docs: JSON.parse(file.content),
      sha: file.sha
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
