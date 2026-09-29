# AlpineScout — Phase 0 Audit Report

## Routes Inventory

### Backend Routes (server.js + mounted routers)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/healthz` | None | DB health check |
| POST | `/login` | Rate-limited | Returns JWT in httpOnly cookies |
| POST | `/create-account` | Rate-limited | User registration |
| GET | `/auth-status` | None | Check auth state, auto-refreshes |
| POST | `/logout` | JWT | Clears cookies |
| POST | `/refresh-token` | Rate-limited | Refresh access token |
| GET | `/profile` | JWT | Get user profile |
| PUT | `/profile` | JWT | Update user profile |
| POST | `/upload-avatar` | JWT | Upload avatar (multer+Sharp) |
| GET | `/places` | None | Search mountains |
| GET | `/places/:id` | None | Get mountain by ID |
| GET | `/featured-places` | None | Featured destinations |
| GET | `/api/weather-window` | None | Weather data |
| GET | `/api/places/:id/conditions` | None | Place conditions |
| GET | `/mountains/:mountainId/reviews` | None | Get reviews |
| POST | `/mountains/:mountainId/reviews` | JWT | Submit review |
| POST | `/faq` | None | Submit FAQ |
| POST | `/notifications/mark-all-read` | Admin | Mark all notifications read |
| **Admin Routes** (`/admin/*`) | | | All require JWT + admin role |
| GET | `/admin/ingestion/runs` | Admin | List ingestion runs |
| GET | `/admin/ingestion/candidates` | Admin | List candidates |
| POST | `/admin/ingestion/candidates/bulk-publish` | Admin | Bulk publish |
| POST | `/admin/ingestion/candidates/:id/publish` | Admin | Publish one |
| POST | `/admin/ingestion/candidates/:id/reject` | Admin | Reject one |
| POST | `/admin/upload-photo` | Admin | Upload mountain photo |
| CRUD | `/admin/mountains` | Admin | Mountains management |
| GET | `/admin/total-locations` | Admin | Stats |
| GET | `/admin/active-users` | Admin | Stats |
| CRUD | `/admin/users` | Admin | User management |
| **Blog Routes** (`/api/blog/*`) | | | |
| GET | `/api/blog/` | None | List blogs |
| GET | `/api/blog/:id` | None | Get blog by ID |
| POST | `/api/blog/` | JWT | Create blog |
| **Notification Routes** (`/notifications/*`) | | | |
| GET | `/notifications/all` | Admin | All notifications |
| GET | `/notifications/unread` | Admin | Unread only |
| PUT | `/notifications/:id/read` | Admin | Mark one read |

---

## Environment Variables

### Root / .env

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | production / development |
| `PORT` | Server port (default 5000) |
| `CLIENT_ORIGINS` | Comma-separated allowed CORS origins |
| `DB_USER` | Postgres user |
| `DB_HOST` | Postgres host (db in docker) |
| `DB_NAME` | Postgres database name |
| `DB_PASSWORD` | Postgres password |
| `DB_PORT` | Postgres port (default 5432) |
| `DB_SSL` | SSL connection flag |
| `DB_SSL_REJECT_UNAUTHORIZED` | SSL cert validation |
| `JWT_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `ADMIN_USERNAME` | Initial admin username |
| `ADMIN_EMAIL` | Initial admin email |
| `ADMIN_PASSWORD` | Initial admin password |
| `ADMIN_FIRST_NAME` | Admin first name |
| `ADMIN_LAST_NAME` | Admin last name |
| `INGEST_USER_AGENT` | User-Agent for external API calls |
| `INGEST_ALLOWED_HOSTS` | Allowed hosts for ingestion |

---

## SQL Query Audit

### Parameterized Queries (Safe)
- `server/config/db.js` — pg pool config (no queries)
- `server/services/users.js` — All queries use `$1`, `$2` placeholders
- `server/services/reviews.js` — All queries parameterized
- `server/services/blogServices.js` — All queries parameterized
- `server/services/mountains.js` — All queries use parameterized placeholders
- `server/services/adminService.js` — All queries parameterized
- `server/middlewares/uploadMiddleware.js` — DB queries parameterized
- `server/models/userModel.js` — All queries parameterized
- `server/ingestion/catalogRepository.js` — All queries parameterized
- `server/routes/notificationRoutes.js` — All queries parameterized

### Raw String Concatenation (Potentially Unsafe)
**NONE FOUND** — All SQL uses pg parameterized queries with `$1`, `$2`, etc.

---

## Authentication Flow

### Current Implementation
1. **Login** (`POST /login`):
   - Validates username/password via `users.js` service
   - Uses `bcryptjs` for password comparison (with lazy migration from plain text)
   - Creates access token (JWT, 15 min expiry) + refresh token (JWT, 7d expiry)
   - Stores both in httpOnly cookies with `secure` flag in production

2. **Token Storage**:
   - Access token: `httpOnly` cookie, 15 min
   - Refresh token: `httpOnly` cookie, 7 days
   - Both use separate secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`)

3. **Token Verification** (`authenticateJWT` middleware):
   - Reads `accessToken` from cookie
   - Verifies with `JWT_SECRET`
   - Returns 401 if expired, 403 if invalid

4. **Token Refresh** (`POST /refresh-token`):
   - Reads `refreshToken` from cookie
   - Verifies with `JWT_REFRESH_SECRET`
   - Issues new access token

5. **Auth Status** (`GET /auth-status`):
   - Checks access token, auto-refreshes if expired using refresh token

### Missing Security Controls
- **NO refresh token rotation** — Same refresh token used multiple times
- **NO refresh token revocation** — No server-side tracking of issued tokens
- **NO token ID tracking** — Can't invalidate specific sessions
- **sameSite: "lax"** — Should be "strict" for better CSRF protection

---

## File Upload Flow

### Current Implementation
1. **User Avatar** (`POST /upload-avatar`):
   - Uses `multer.memoryStorage()` → streams to Sharp
   - Validates MIME type: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
   - Sharp validates image by reading metadata
   - Stored in `/storage/avatars/` with SHA256 hash filename
   - **ISSUE**: Magic bytes NOT validated — relies on MIME header only

2. **Admin Mountain Photo** (`POST /admin/upload-photo`):
   - Uses `multer.diskStorage()` with random filename
   - Validates MIME type + extension
   - Sharp validates by reading metadata
   - Stored in `/storage/mountain-photos/`
   - **ISSUE**: Magic bytes NOT validated — relies on MIME header + extension only
   - **ISSUE**: Stored in web-servable path (`/storage/mountain-photos/`)

### Storage Paths
- Avatars: `/storage/avatars/` — protected path
- Mountain photos: `/storage/mountain-photos/` — served statically at `/storage/mountain-photos/*`

---

## Database Schema Summary

### Core Tables
- `users` — username, email, password, role (admin/guest), profile fields
- `mountains` — destinations with extensive metadata, publication status
- `reviews` — user reviews with ratings
- `faqs` — contact form submissions
- `notifications` — admin notification system
- `blogs` — editorial blog posts

### Ingestion Tables
- `mountain_sources` — provenance tracking (provider, external_id, license, attribution)
- `mountain_media` — media provenance (provider, source_url, license, attribution)
- `ingestion_runs` — ingestion history

### Missing Provenance Columns (Phase 6)
Current schema has provenance in separate tables but NOT directly on `mountains`:
- No `source` column on `mountains`
- No `source_id` column on `mountains`
- No `license` column on `mountains`
- No `attribution` column on `mountains`
- No `ingested_at` column on `mountains`

---

## Security Observations

### Already Good
- Security headers middleware (CSP, HSTS, X-Frame-Options, etc.)
- CORS locked to configured origins
- Parameterized SQL queries throughout
- httpOnly cookies for tokens
- Helmet-style headers implemented manually
- Rate limiting on auth endpoints
- Non-root Dockerfile user (node user)

### Needs Hardening (Phase 2)
1. **Password hashing**: Uses bcryptjs, should migrate to argon2id
2. **Refresh token security**: No rotation, no revocation, no server-side tracking
3. **Input validation**: No Zod schemas on POST/PUT/PATCH routes
4. **File upload**: Magic bytes not validated, images not re-encoded
5. **IDOR protection**: Missing ownership checks on user-specific mutations
6. **Logging**: No structured logging for auth events or admin actions
7. **RBAC**: `requireRole()` exists but role checks may be scattered

---

## Docker Current State

### docker-compose.yml
- `db`: No ports published (good — internal only)
- `app`: No ports published (good — only exposed via caddy)
- `caddy`: Publishes 80/443 (good — reverse proxy)

### Dockerfile
- Multi-stage build (good)
- Runs as root (NEEDS FIX — add `USER node`)
- No .dockerignore (NEEDS ADD)

---

## Ingestion Connectors

### Existing
- `wikidata.js` — SPARQL queries for mountain destinations
- `wikimedia.js` — Commons image connector
- `httpClient.js` — HTTP utility with caching

### Missing (Phase 6)
- Unsplash API connector
- Pexels API connector
- OpenStreetMap/Overpass connector

---

*Audit completed: All findings are based on actual code review, not assumptions.*
