# Bumpy Road — Product & Delivery Roadmap

## What remains to do

## Product direction

Bumpy Road should be a focused field guide and trip-planning tool for self-guided
outdoor travelers, connecting mountain destinations with nearby coastal escapes.
Help people decide where and when to go using practical, sourced details: season,
weather, access, route effort, points of interest, and trip reports.

This is not a general travel-review or booking marketplace. Do not chase listing
volume, broad restaurant/hotel coverage, or feature parity with large travel sites.
Grow coverage only where each destination can support a useful planning decision.

### 1. Initial data milestone — 50 real mountain destinations

**Schema target** (from migrations 002 + 005 + 007):
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
2. `docker compose exec postgres psql -U postgres -d bumpyroad -f /docker-entrypoint-initdb.d/seeds/dev_seed.sql`
3. Verify: `SELECT COUNT(*) FROM mountains;` → 50

## Notes
- Wikimedia Commons hotlinks: `https://upload.wikimedia.org/wikipedia/commons/{hash}/{filename}`
- Photo URLs stored in `photo_url` column for the hero image
- Full gallery goes in `mountain_media` table
- No API key needed — all data is pre-researched CC-licensed content

## Portfolio roadmap

The 50-destination seed is a demo milestone, not the final catalog target. Prioritize
the work below in order; expand each area in small, independently verifiable stages.

### 1. Security

- [ ] Add per-account login failure tracking and a temporary lockout/backoff policy;
    retain the existing per-IP rate limit and avoid revealing whether an account exists.
- [ ] Add an immutable `admin_audit_log` for sensitive admin actions, recording the
    actor, action, target, timestamp, and relevant non-secret metadata.
- [ ] Remove the plaintext password fallback in `verifyPassword`; require hashed
    credentials and provide a deliberate migration/reset path for any legacy users.
- [ ] Add per-IP and per-account throttling to `/refresh-token` and normalize
    success/failure behavior to reduce account enumeration signals.
- [ ] Add email verification to signup before enabling normal guest-account use.
- [ ] Set auth cookies to `SameSite=Lax` (and `Secure` in production); add CSRF token
    validation for cookie-authenticated state-changing requests. Keep GET routes
    free of state changes; bearer-token-only APIs do not need cookie CSRF tokens.
- [ ] Publish `/.well-known/security.txt` with a monitored security contact and
    disclosure policy.
- [ ] Consider Have I Been Pwned's k-anonymity range API for signup password checks;
    never send or store the raw password outside the normal credential flow.

### 2. Operations and scale

- [ ] Replace process-local rate-limit state with a shared Redis-backed store before
    running multiple backend instances.
- [ ] Configure PostgreSQL pool limits and lifecycle settings (`max`, idle timeout,
    connection timeout) from deployment capacity; document the connection budget.
- [ ] Add Redis for refresh-token revocation/session lookups and cache only where
    measured query or latency needs justify it.
- [ ] Move Wikidata and other long-running ingestion work out of the request path
    into a durable job queue (BullMQ/Bull); expose job status and failure details.
- [ ] Measure read load and reporting impact before introducing read replicas; define
    acceptable replication lag and route only suitable reads to replicas.

### 3. Frontend experience

- [ ] Replace text/spinner loading states with content-shaped skeletons.
- [ ] Add reduced-motion-aware, staggered reveal animations for destination cards.
- [ ] Add an interactive destination map with useful region and terrain filters;
    evaluate Leaflet or Mapbox against deployment and licensing requirements.
- [ ] Add restrained interaction feedback for buttons, cards, links, and review
    ratings, including a rating fill animation and helpful-vote response.
- [ ] Show route elevation profiles on destination pages and animate the chart when
    it enters view.
- [ ] Treat parallax and decorative motion as optional polish; prioritize legibility,
    accessibility, and trip-comparison workflows.

### 4. Destination and trip data

- [ ] Expand beyond the initial 50 to cover chosen mountain and coastal regions with
    complete, well-sourced planning details; do not use a destination-count target
    as the product's success metric.
- [ ] Extend the catalog to coastal and mixed-terrain destinations. Define and
    migrate `destination_type` values for `mountain_town`, `coastal_town`, and
    `mixed_terrain`, then add a terrain filter in the UI.
- [ ] Add reviewable points of interest such as trails, huts, base camps, villages,
    and viewpoints, linked to their parent destination.
- [ ] Model seasonal conditions by month (snow, trail conditions, and crowd levels)
    instead of relying only on free-text `best_seasons`.
- [ ] Add structured trail and route records with difficulty, GPX track, distance,
    elevation gain, and estimated duration.
- [ ] Add structured user trip reports for route, date, conditions, and outcome,
    alongside the existing general star reviews.
- [ ] Add historical weather normals (for example, 10-year averages) alongside live
    weather, with source and period recorded.
