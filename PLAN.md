# Bumpy Road — Product & Delivery Roadmap

## What was delivered

### Security ✅
- [x] Account lockout — 5 failed attempts → 30-minute lock, per-account (not per-username-field)
- [x] Plaintext password fallback removed — rejected, not silently accepted
- [x] HIBP k-Anonymity breach check on signup — fails closed in production (503), skips in dev
- [x] Email verification on signup — nodemailer + Ethereal dev fallback, real SMTP in prod
- [x] Login blocked until email verified (403)
- [x] Redis-backed sliding-window rate limiter — single check-and-increment, no double-counting
- [x] `/well-known/security.txt` (RFC 9116) + `/security.txt` redirect
- [x] Helmet hardened — `referrerPolicy: strict-origin-when-cross-origin`, `permissionsPolicy`
- [x] Zod schema validation on all auth endpoints
- [x] Token rotation on every refresh

### Admin audit log ✅
- [x] `admin_audit_log` table — actor, action, resource_type, resource_id, details, IP, user-agent, timestamp
- [x] Every admin mutation logged: create/update/delete destinations, users; bulk publish; reject
- [x] `/admin/audit-log` GET endpoint with pagination + actor/resource_type filters
- [x] Admin dashboard Audit Log tab

### Async ingestion jobs ✅
- [x] Jobs saved as `PENDING`, claimed with `FOR UPDATE SKIP LOCKED` — safe for concurrent workers
- [x] `cleanupStaleJobs()` runs on server startup — stale `RUNNING` jobs from crashed processes → `FAILED`
- [x] `/admin/jobs/ingest` — 202 immediately, work runs in background
- [x] `/admin/jobs/:id` — poll job status

### Frontend experience ✅
- [x] Shimmer skeleton cards (loading states in Places page)
- [x] Wave-fill star rating with spring physics (clip-path animation)
- [x] Hero scroll parallax (0.35× speed, passive listener)
- [x] Card staggered entrance via `containerVariants` + `staggerChildren`
- [x] Email verification page (loading/success/error states)

### Infrastructure ✅
- [x] Redis service in docker-compose
- [x] `ioredis` + `nodemailer` dependencies
- [x] `REDIS_URL`, `CHECK_BREACHED_PASSWORDS`, SMTP env vars

---

## Product direction

Bumpy Road should be a focused field guide and trip-planning tool for self-guided
outdoor travelers, connecting mountain destinations with nearby coastal escapes.
Help people decide where and when to go using practical, sourced details: season,
weather, access, route effort, points of interest, and trip reports.

This is not a general travel-review or booking marketplace. Do not chase listing
volume, broad restaurant/hotel coverage, or feature parity with large travel sites.
Grow coverage only where each destination can support a useful planning decision.

### 1. Initial data milestone — 50 real mountain destinations

**Schema target** (migrations 002 + 005 + 007):
```
mountains: name, location, description, photo_url, continent,
           slug, region, country_code, latitude, longitude,
           elevation_m, destination_type, source_tags, editorial_tags,
           guide_status, guide_quality_score, traveler_fit, avoid_if,
           best_seasons, stay_style, transport_notes, planning_notes,
           photo_verified, source, source_id, license_code, attribution,
           completeness_score
```

**50 destinations split:**
- 12 Alpine Europe (CH, FR, IT, AT, DE)
- 8 Mountain Asia (NP, IN, JP, CN, KR, VN)
- 10 Mountain Americas (US, CA, MX, AR, CL, PE, BO)
- 10 Oceania & Pacific (NZ, AU, PNG, ID)
- 10 Other global (ZA, ET, KE, GR, TR, GE, CO, EC, KR-N, JP)

**Per destination:**
- Real name, country, region, coordinates, elevation
- 1–2 paragraph real description
- `photo_url` → Wikimedia Commons CDN URL (CC-licensed, hotlink-safe)
- `source_tags` → 5–10 Wikidata-derived tags
- `editorial_tags` → 3–5 human-curated tags
- `guide_status` → mix of `guide_ready` (30) and `preview` (20)
- `traveler_fit`, `avoid_if`, `best_seasons` → 2–4 items each for `guide_ready`
- `stay_style`, `transport_notes`, `planning_notes` → 1 sentence each for `guide_ready`
- `source` = `wikidata`, `source_id` = Wikidata QID
- `completeness_score` = 60–100

**Media table** (`mountain_media`):
- 3–5 Wikimedia Commons images per `guide_ready` destination
- `is_primary = true` for the first one (drives `photo_verified = true`)
- Attribution and license populated

### 2. Rich reviews
- 3–6 reviews per destination (avg 4) = ~200 reviews total
- Real usernames (faker names), realistic ratings skewed positive (3–5), specific detailed comments mentioning trail names, weather, transport, crowds
- Timestamps spread across last 2 years

### 3. Blog posts
- 20 blog posts (1–2 per major destination) with real titles and 3-paragraph content
- Mix of categories: Planning, Safety, Travel Guide, Experience, Equipment, Tips
- Images from `mountain_town_*.jpg` path pattern (existing storage refs)

### 4. Additional seed users
- Add 15–20 realistic user accounts with names, bios, varied roles (mostly `guest`, 2 `admin` for content moderation)

## Execution order
1. Overwrite `backend/database/seeds/dev_seed.sql` with full 50-destination seed
2. `docker compose exec db psql -U bumpyroad -d bumpyroad -f /docker-entrypoint-initdb.d/seeds/dev_seed.sql`
3. Verify: `SELECT COUNT(*) FROM mountains;` → 50

## Notes
- Wikimedia Commons hotlinks: `https://upload.wikimedia.org/wikipedia/commons/{hash}/{filename}`
- Photo URLs stored in `photo_url` column for the hero image
- Full gallery goes in `mountain_media` table
- No API key needed — all data is pre-researched CC-licensed content

---

## Portfolio roadmap — remaining work

### 1. Security

- [x] ~~Add per-account login failure tracking and a temporary lockout~~ ✅
- [x] ~~Add an immutable `admin_audit_log`~~ ✅
- [x] ~~Remove the plaintext password fallback~~ ✅
- [x] ~~Add per-IP and per-account throttling to `/refresh-token`~~ ✅
- [x] ~~Add email verification to signup before enabling normal guest-account use~~ ✅
- [x] ~~Set auth cookies to `SameSite=Strict`; add CSRF token validation for cookie-authenticated state-changing requests~~ ✅
- [x] ~~Publish `/.well-known/security.txt`~~ ✅
- [x] ~~Add Have I Been Pwned's k-anonymity range API for signup password checks~~ ✅
- [ ] Redis session store — token revocation currently hits DB on every request; Redis = O(1) lookups
- [ ] CSRF token for non-GET state-changing requests (keep GET routes stateless, bearer-token APIs exempt)
- [ ] Scheduled cleanup of `email_verification_tokens` (TTL function exists, needs cron or job)

### 2. Operations and scale

- [x] ~~Replace process-local rate-limit state with a shared Redis-backed store~~ ✅
- [ ] Configure PostgreSQL pool limits (`max`, `idleTimeoutMillis`, `connectionTimeoutMillis`) in `db.js`
- [ ] Add Redis for refresh-token revocation/session lookups
- [ ] Measure read load before introducing read replicas
- [ ] Add BullMQ job queue when ingestion volume justifies it (current DB-backed queue is sufficient for MVP)

### 3. Frontend experience

- [x] ~~Replace text/spinner loading states with content-shaped skeletons~~ ✅
- [x] ~~Add staggered reveal animations for destination cards~~ ✅
- [ ] Interactive destination map with Leaflet or Mapbox (terrain/region filters)
- [x] ~~Restrained interaction feedback — press states, lift on hover, underline-slide links~~ ✅
- [ ] Route elevation profiles with SVG chart animation on scroll
- [ ] Mountain + beach mixed-terrain toggle in filter UI

### 4. Destination and trip data

- [ ] Expand beyond the initial 50 — prioritize depth over breadth per region
- [x] ~~Extend catalog to coastal/mixed-terrain destinations~~ (schema supports it — add enum values + UI filter)
- [ ] Add reviewable POIs: trails, huts, base camps, viewpoints
- [ ] Model seasonal conditions by month (snow level, trail status, crowd level) — not just free-text `best_seasons`
- [ ] Add structured trail/route records: difficulty, GPX track, elevation gain, distance, estimated time
- [ ] Structured user trip reports: route, date, conditions, outcome — alongside star reviews
- [ ] Historical weather normals (10-year averages) alongside live weather data
