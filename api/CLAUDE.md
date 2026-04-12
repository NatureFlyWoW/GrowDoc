# API Conventions

Vercel serverless functions. Node.js ESM (`type: "module"`). CORS enabled for all origins.

## Handler Pattern

Every endpoint follows this structure:

```js
import { handleCors } from './_lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;           // 1. CORS preflight
  if (req.method !== 'POST') { ... return; }  // 2. Method check
  if (!requireAuth(req)) { ... return; }      // 3. Auth check (if needed)
  try { ... } catch (err) { ... }             // 4. Business logic + error handling
}
```

## Shared Libraries (api/_lib/)

| Module | Exports |
|--------|---------|
| `auth.js` | `verifyPassword(pw)`, `createToken()`, `verifyToken(token)`, `requireAuth(req)` |
| `cors.js` | `handleCors(req, res)` — returns `true` if OPTIONS handled |
| `github.js` | `getFile(path)`, `putFile(path, content, msg, sha?)`, `deleteFile(path, sha, msg)`, `isConflict(err)` |

## Endpoints

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/login` | POST | No | Team password → JWT (14-day TTL) |
| `/api/state` | GET | Yes | Returns `docs.json` + SHA for optimistic concurrency |
| `/api/save` | POST | Yes | Commits document changes via GitHub API |

## Security Model

- `GITHUB_TOKEN` never reaches the browser — server-side only
- Auth flow: scrypt password verification → HS256 JWT → Bearer token in localStorage
- Filename validation: `FILE_NAME_RE = /^[a-z0-9\-]+\.html$/`
- 500ms delay on failed login attempts (brute-force mitigation)
- Documents rendered in sandboxed iframes (XSS isolation)
- SHA-based optimistic locking on `docs.json` updates (409 on conflict)

## JavaScript Conventions

- ES Modules everywhere — `import`/`export`, never `require`
- Arrow functions for handlers and utilities
- Fetch API for HTTP (no axios, no XMLHttpRequest)
- No TypeScript — plain JavaScript with JSDoc where needed
- No npm runtime dependencies
