# Architecture Overview

Vanilla JS SPA with Vercel serverless backend and localStorage persistence. No build step, no framework, no npm runtime dependencies.

## Module Dependency Graph (text)

```
index.html
  -> js/main.js (entry, top-level await)
       -> js/store.js (Proxy-based reactive store, frozen views)
       -> js/storage.js (localStorage CRUD, quota, migration helpers)
       -> js/migration.js (two-phase legacy import)
       -> js/router.js (History API, route table, auth guard)
       -> js/utils.js (escapeHtml, generateId, debounce)
       -> js/components/sidebar.js (nav tree, bottom-nav mobile)
       -> js/data/note-contextualizer/index.js (singleton projection cache)
            -> merge.js, weighting.js, rules-score.js, rules-advice.js
            -> rules-keywords.js, placeholders.js, stage-sources.js
            -> [CIRCULAR] rules-score.js -> index.js (getObservationIndex)
            -> [CIRCULAR] rules-advice.js -> index.js (getObservationIndex)
       -> js/data/edge-case-engine.js (top-level await, optional)
       -> js/views/* (14 view modules, each receives store)
       -> js/components/* (16 component modules)
       -> js/plant-doctor/* (doctor-ui, doctor-engine, doctor-data)

api/login.js  -> _lib/auth.js (scrypt+JWT)
api/save.js   -> _lib/github.js (Contents API), _lib/auth.js
api/state.js  -> _lib/github.js, _lib/auth.js
api/_lib/cors.js (stateless CORS handler)
```

## Data Flow

```
localStorage -> storage.js (load/validate/migrate) -> store.js (Proxy state)
  -> subscribers (debounced 300ms save-back to localStorage)
  -> views (imperative DOM render on navigation)
  -> note-contextualizer (singleton cache, FNV-1a hash invalidation)
```

## API Surface

- 3 serverless functions: `POST /api/login`, `GET /api/state`, `POST /api/save`
- GitHub Contents API as database via `_lib/github.js`
- SHA-based optimistic concurrency on `docs.json`
- HS256 JWT auth with 14-day TTL, scrypt password verification
- CORS open to all origins (`Access-Control-Allow-Origin: *`)
