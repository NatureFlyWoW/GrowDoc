# Architecture

## Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | Vanilla JS + HTML + CSS | No framework, no bundler, no transpiler |
| Backend | Vercel Serverless Functions | Node.js 18+ ESM (`type: "module"`) |
| Auth | Custom scrypt + HS256 JWT | Team password model, 14-day token TTL |
| Storage | GitHub repo via API | `docs/` directory = the database |
| CDN | Vercel | Static files served directly, `docs.json` cache-busted |
| Markdown | Marked.js via CDN | Used in admin editor for MD-to-HTML conversion |

## Data Flow

```
Browser (admin.html)
  ─POST /api/login─> Vercel Function ─scrypt verify─> JWT returned
  ─POST /api/save──> Vercel Function ─GitHub API────> Commits to repo
  ─GET  /api/state─> Vercel Function ─GitHub API────> Returns docs.json + SHA

Browser (index.html)
  ─GET docs/docs.json──> Static file (cache-busted with ?t=timestamp)
  ─GET docs/{file}.html─> Loaded into sandboxed iframe
```

## Security Model

- Server-side only: `GITHUB_TOKEN` never reaches the browser
- Auth: scrypt password verification → JWT → Bearer token in localStorage
- Input validation: `FILE_NAME_RE = /^[a-z0-9\-]+\.html$/` enforces safe filenames
- XSS: docs loaded in iframe isolation
- Concurrency: SHA-based optimistic locking on `docs.json` updates
- Brute force: 500ms delay on failed login attempts

## Key Design Decisions

- **No per-user accounts**: Single team password, shared auth. Everyone's edits commit under the repo owner's token.
- **GitHub as source of truth**: No separate database. Content versioned via git. Rollback = git revert.
- **No build step**: Static site deploys instantly. Interactive tools are self-contained HTML files.
- **Iframe viewer**: Documents render in sandboxed iframes to prevent XSS from user-authored HTML content.
