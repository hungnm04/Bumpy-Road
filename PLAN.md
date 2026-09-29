# Bumpy Road — Cleanup & Data Generation Plan

## What just happened
- Deleted all dead duplicate root-level files: `node_modules/`, `dist/`, `src/`, `database/`, `eslint.config.js`, `index.js`, `server.js`, `index.html`
- Root is now clean — only `backend/`, `frontend/`, `docker-compose.yml`, `.env.example`, `README.md`, `AGENTS.md`, `CLAUDE.md`

## What remains to do

### 1. Enhance `dev_seed.sql` — 50 real mountain destinations

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
