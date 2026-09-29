# AlpineScout — Master Build Prompt (Docker-Only, Security-Hardened)

Use this as the spec you paste into Claude Code (or any coding agent) to execute the work. Each phase has a clear goal, concrete tasks, and acceptance criteria — the agent should not move to the next phase until the current one's criteria are met.

## Context (give this to the agent verbatim)

> I'm working on AlpineScout, a React (Vite) + Express + PostgreSQL travel app with Socket.io notifications, JWT auth, multer/Sharp file uploads, and admin routes. I do NOT have a VPS yet — everything must run locally via Docker Compose only, structured so it can be deployed to a VPS later with zero changes to the compose files. Rate limiting and WAF/bot protection will be handled by Cloudflare later, not in the app or reverse proxy — do not add express-rate-limit or similar. My goal is a security-hardened, containerized reference architecture I can describe precisely in interviews.

---

## Phase 0 — Audit & Inventory
**Goal:** Know exactly what exists before touching anything.

- [ ] Walk the repo, list all routes (method + path + auth requirement) for backend
- [ ] List all environment variables currently used, across frontend and backend
- [ ] Identify every place raw SQL is built (flag any string-concatenated queries)
- [ ] Identify current auth flow (where JWT is issued, stored, verified)
- [ ] Identify file upload flow (multer config, storage location, Sharp usage)
- [ ] Output a single `AUDIT.md` summarizing all of the above

**Acceptance:** `AUDIT.md` exists and accurately reflects the codebase — no guesses, only what's actually in the code.

---

## Phase 1 — Containerize the stack (no security changes yet)
**Goal:** Everything runs via `docker compose up`, nothing published except one reverse proxy.

- [ ] `backend/Dockerfile` — node:22-alpine, non-root `USER node`, multi-stage if build step needed
- [ ] `frontend/Dockerfile` — multi-stage: `node:22-alpine` build → static output served by `nginx:alpine`
- [ ] `docker-compose.yml` with services: `db`, `backend`, `frontend`, `caddy`
  - `db` and `backend`: **no `ports:` published** — reachable only over the internal Docker network
  - `caddy`: only service publishing `80`/`443`
- [ ] `Caddyfile` routing `/api/*` → `backend`, everything else → `frontend`
- [ ] `.env.example` files for root/backend covering every variable found in Phase 0 (real `.env` gitignored)
- [ ] Named volume for Postgres data (`pgdata`) — no bind mount to host

**Acceptance:** `docker compose up` boots the full stack locally; app is reachable only via `http://localhost` (Caddy), not via any other port; `docker compose config` shows `db`/`backend` with no host port bindings.

---

## Phase 2 — Backend security hardening
**Goal:** Fix real vulnerabilities, not cosmetic ones. No rate limiting (Cloudflare's job).

- [ ] `helmet` added with an explicit CSP (not defaults) — list every third-party origin (Unsplash, socket.io, etc.) by name
- [ ] CORS locked to the exact frontend origin(s), not `*`
- [ ] Audit every SQL query flagged in Phase 0 — convert any concatenated query to parameterized (`pg` placeholders)
- [ ] Add `zod` schemas for every POST/PUT/PATCH route; reject on validation failure before touching the DB
- [ ] Replace password hashing with `argon2id` if not already used; migrate existing bcrypt hashes lazily on next login
- [ ] Auth: short-lived JWT access token (e.g. 15 min) + httpOnly/secure/sameSite=strict refresh token cookie, rotated on refresh, revocable server-side (store refresh token IDs, not full tokens, in DB)
- [ ] Centralize authorization: one RBAC middleware function used on every protected route, not scattered `if (role === 'admin')` checks
- [ ] Add ownership checks (IDOR) on every route that takes a resource `:id` and mutates it
- [ ] File uploads: validate magic bytes (not just extension/MIME header), re-encode every image through Sharp before storage, store outside any web-servable path
- [ ] Structured logging via `pino`: auth events (login, failed login, token refresh, logout) and all admin actions logged with actor + timestamp

**Acceptance:** Every checklist item has a corresponding code change; `AUDIT.md` findings from Phase 0 are each resolved or explicitly noted as out of scope with reasoning.

---

## Phase 3 — Network & container hardening
**Goal:** Minimize blast radius inside Docker itself.

- [ ] All app containers run as non-root user
- [ ] `db` container: only `backend` service can reach it (already true via no published ports — verify with `docker network inspect`)
- [ ] Secrets (`DB_PASSWORD`, `JWT_SECRET`, etc.) passed via `.env` / Docker secrets, never baked into images — verify with `docker history` on built images
- [ ] Add `.dockerignore` (node_modules, .env, .git) to every build context
- [ ] Pin base image versions (already done above) — no `:latest` tags anywhere

**Acceptance:** `docker history backend` shows no secrets in any layer; containers confirmed non-root via `docker exec ... whoami`.

---

## Phase 4 — Documentation (the part that makes this resume-credible)
**Goal:** A reviewer can read one file and understand your threat model and decisions.

- [ ] `SECURITY.md` at repo root covering:
  - Threat model in scope (what you defended against, e.g. SQLi, XSS, IDOR, file-upload attacks, token theft) and explicitly out of scope (DDoS/bot traffic — delegated to Cloudflare)
  - Each mitigation mapped to the specific code/file that implements it
  - Why Cloudflare handles rate limiting/WAF instead of app-level middleware
- [ ] `README.md` updated with: architecture diagram (text/ASCII is fine), `docker compose up` quickstart, env var reference

**Acceptance:** Both files exist, are accurate, and require no tribal knowledge to follow.

---

## Phase 5 — Verification
**Goal:** Prove the hardening actually works, don't just assert it.

- [ ] Run OWASP ZAP baseline scan against the local Docker stack (`http://localhost`), save report to `/security-reports/`
- [ ] Manually verify: SQLi attempt on a search field fails safely; uploading a renamed non-image file is rejected; accessing another user's resource by ID returns 403/404; expired access token is rejected and refresh flow works
- [ ] Fix anything ZAP flags above informational severity, or document why it's a false positive/accepted risk in `SECURITY.md`

**Acceptance:** ZAP report committed, all medium+ findings resolved or explicitly justified.

---

## Phase 6 — Data ingestion & provenance (scaling past ~100 entries)
**Goal:** Grow the `mountains` (and related) tables from properly licensed, structured sources — with every record traceable back to where it came from. This traceability is also what makes the site legally sellable later: if you can't show provenance for a photo, don't ship it.

### 6.0 — Schema audit first (do not skip)
- [ ] Dump the actual current schema (`\d mountains`, `\d blogs`, etc. or a migration file) into `AUDIT.md` from Phase 0 — do not assume column names, read them
- [ ] Add provenance columns wherever images/content are stored (adjust names to match existing convention, e.g. snake_case if the rest of the schema uses it):
  - `source` (text — e.g. `wikimedia`, `unsplash`, `pexels`, `manual`)
  - `source_id` (text — the external API's unique ID for that record, used for de-duplication on re-runs)
  - `license` (text — e.g. `CC-BY-SA-4.0`, `Unsplash License`)
  - `attribution` (text — photographer/author name, required by most of these licenses)
  - `attribution_url` (text, nullable — link back to original source page)
  - `ingested_at` (timestamptz — when the record was pulled)
- [ ] Add a **unique constraint** on `(source, source_id)` so re-running ingestion scripts is idempotent, not duplicative
- [ ] Write this as a proper migration file (matching whatever migration approach the project already uses — raw SQL file, `node-pg-migrate`, etc. — check `AUDIT.md`), not a manual `ALTER TABLE` run by hand

**Acceptance:** Migration applies cleanly to the Dockerized `db` container; re-running old ingestion scripts against the new schema doesn't break.

### 6.1 — Source connectors (one script per source, same output shape)
Each script normalizes into a shared shape before insert: `{ name, country, region, elevation_m, latitude, longitude, description, image_url, source, source_id, license, attribution, attribution_url }`.

- [ ] **Wikidata SPARQL connector** — query mountains/peaks by type (`wd:Q8502`) with elevation, coordinates, country; pull associated Commons image if present
- [ ] **Wikimedia Commons connector** — for entries missing images from Wikidata, search Commons category by mountain name, pull image + license + author from file metadata (never invent an attribution — skip the record if metadata is missing)
- [ ] **Unsplash API connector** — keyword/location search (not the one-shot root `index.js` script — replace that with this), respecting Unsplash's attribution requirement (store photographer name + Unsplash profile link)
- [ ] **Pexels API connector** — same pattern, as a secondary image source when Unsplash coverage is thin
- [ ] **OpenStreetMap/Overpass connector** — trail, elevation, and geo-tag enrichment for existing entries (not new photos, structured data only)

**Explicitly excluded:** scraping X/Twitter or arbitrary travel blogs. Their content is copyrighted to individual authors/photographers and X's terms prohibit bulk scraping — using that content on a site you intend to sell creates real legal exposure. Every image on a monetized site needs a license you can point to.

### 6.2 — Pipeline & storage
- [ ] All scripts run inside a `db-tools` (or similar) short-lived container / `docker compose run` job — not on host — so it's reproducible on any machine
- [ ] Downloaded images pass through the existing Sharp reprocessing step (resize, strip EXIF, re-encode) before storage — this is both a security control (Phase 2) and a consistency control (uniform image sizes across a mixed-source catalog)
- [ ] Insert via parameterized queries only, respecting the `(source, source_id)` unique constraint — `ON CONFLICT DO NOTHING` or `DO UPDATE` depending on whether you want re-runs to refresh metadata
- [ ] Log ingestion runs (source, count pulled, count inserted, count skipped as duplicate/missing-license) via the `pino` logger from Phase 2

**Acceptance:** Running each connector against a fresh Dockerized `db` grows the `mountains` table with zero manual copy-pasting, every row has non-null `source`/`license`/`attribution`, and re-running any connector twice doesn't create duplicates.

### 6.3 — What makes it "outstanding" rather than a bigger scraped catalog
Volume alone won't differentiate you from every other travel site — the pitch is a *curated, verifiable* dataset plus something competitors don't bother building:
- [ ] Surface attribution in the UI (small credit line on each destination card/detail page) — this is also a legal requirement for CC-BY-family licenses, so it's not optional polish
- [ ] Combine structured Wikidata facts (elevation, first ascent, range) with photos, so each entry reads as a real reference page rather than a stock-photo gallery
- [ ] Consider a data-quality field (`completeness_score` or similar) so the frontend can prioritize showing well-documented destinations over stub entries as the catalog grows unevenly
- [ ] This whole ingestion pipeline is itself a resume artifact: "built a licensed, provenance-tracked data pipeline aggregating three external APIs with de-duplication and attribution compliance" is a real engineering story, distinct from the security work in Phases 1–5

---

## Explicit non-goals (so the agent doesn't wander)
- No VPS provisioning or deployment scripts yet — Docker Compose only
- No app-level or Caddy-level rate limiting — Cloudflare handles this later
- No swapping React/Express/Postgres for other frameworks — the stack stays, the engineering rigor changes
- No scraping X/Twitter or travel blogs for content/images — licensed API sources only (Phase 6)

## How to use this
Paste this whole document into Claude Code (or your agent of choice) and say: "Execute Phase 0 first, show me `AUDIT.md`, then stop and wait for my go-ahead before Phase 1." Gate each phase behind your review — that keeps you actually understanding every change instead of accepting a wall of generated code.