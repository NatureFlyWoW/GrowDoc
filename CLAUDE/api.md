# API Reference

All endpoints are Vercel serverless functions in `api/`. CORS enabled for all origins.

## POST /api/login

Authenticate with team password, receive JWT.

**Request:** `{ "password": "string" }`
**Success:** `{ "token": "string", "expiresInDays": 14 }`
**Errors:** 400 (missing password), 401 (invalid — has 500ms delay)

## GET /api/state

Fetch current `docs.json` and its SHA for optimistic concurrency.

**Headers:** `Authorization: Bearer <token>`
**Success:** `{ "docs": [...], "sha": "string" }`
**Errors:** 401 (unauthenticated)

## POST /api/save

Save document changes. Commits to GitHub via API.

**Headers:** `Authorization: Bearer <token>`
**Request:**
```json
{
  "docs": [...],              // Full docs.json array (required)
  "sha": "string",            // Current SHA of docs.json (optimistic lock)
  "upsertFile": {             // Optional: create/update HTML file
    "name": "filename.html",
    "content": "string"       // Max 500KB
  },
  "deleteFileName": "string", // Optional: delete an HTML file
  "commitNote": "string"      // Optional: custom commit message
}
```
**Success:** `{ "ok": true, "sha": "new-sha" }`
**Errors:** 400 (validation), 401 (unauth), 409 (conflict — someone else saved first)

## Shared Libraries (api/_lib/)

| Module | Exports |
|--------|---------|
| `auth.js` | `verifyPassword(pw)`, `createToken()`, `verifyToken(token)`, `requireAuth(req)` |
| `cors.js` | `handleCors(req, res)` — returns `true` if OPTIONS handled |
| `github.js` | `getFile(path)`, `putFile(path, content, msg, sha?)`, `deleteFile(path, sha, msg)`, `isConflict(err)` |
