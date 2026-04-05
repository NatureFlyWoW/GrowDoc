import { handleCors } from './_lib/cors.js';
import { verifyPassword, createToken } from './_lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Vercel auto-parses JSON bodies
  const body = req.body || {};
  const password = typeof body.password === 'string' ? body.password : '';

  if (!password) {
    res.status(400).json({ error: 'Password required' });
    return;
  }

  if (!verifyPassword(password)) {
    // Small delay to slow brute force attempts
    await new Promise((r) => setTimeout(r, 500));
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  const token = createToken();
  res.status(200).json({ token, expiresInDays: 14 });
}
