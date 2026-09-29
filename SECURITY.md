# AlpineScout Security Documentation

## Threat Model

### In Scope (What We Defended Against)

| Threat | Mitigation | Location |
|--------|------------|----------|
| **SQL Injection** | All queries use pg parameterized placeholders (`$1`, `$2`) | `server/services/*.js`, `server/models/*.js` |
| **XSS / Content Injection** | Helmet CSP with explicit third-party allowlist | `server.js` |
| **CSRF** | `sameSite: strict` on auth cookies | `server/controllers/userControllers.js` |
| **Token Theft** | httpOnly cookies, access token 15min expiry | `server/controllers/userControllers.js` |
| **Refresh Token Replay** | Token rotation on every refresh, JTI tracking | `server/middlewares/auth.js`, `server/services/users.js` |
| **Brute Force Auth** | In-memory rate limiting (500 req/15min general, 25 req/15min auth) | `server.js` |
| **File Upload Attacks** | Magic byte validation, Sharp re-encoding, path traversal prevention | `server/utils/imageUtils.js`, `server/middlewares/uploadMiddleware.js`, `server/controllers/adminController.js` |
| **IDOR** | Ownership checks middleware, centralized RBAC | `server/middlewares/auth.js` |
| **Broken Authentication** | Argon2id password hashing with bcrypt migration | `server/services/users.js` |
| **Input Validation** | Zod schemas on all POST/PUT/PATCH routes | `server/controllers/*.js` |
| **Security Misconfiguration** | Explicit CSP, HSTS, X-Frame-Options, no stack traces | `server.js` |
| **Logging & Monitoring** | Pino structured logging for auth events and admin actions | `server/utils/logger.js` |

### Out of Scope (Delegated to Cloudflare)

| Threat | Why Out of Scope |
|--------|-----------------|
| **DDoS / Volumetric Attacks** | Cloudflare handles rate limiting and bot protection at the edge |
| **Bot Traffic** | Cloudflare's WAF and bot management |
| **SSL/TLS Termination** | Cloudflare handles HTTPS; internal traffic stays on Docker network |
| **Application-Level DoS** | Cloudflare's rate rules and challenge pages |

### Why Cloudflare Handles Rate Limiting / WAF

1. **Edge location** — Cloudflare is geographically distributed; rate limiting at the edge stops malicious traffic before it reaches the application
2. **No application overhead** — Legitimate requests don't consume app resources fighting bots
3. **Managed ruleset** — Cloudflare's WAF rules are updated without deploying code changes
4. **CAPTCHA/challenge integration** — Built-in, no custom implementation needed
5. **Cost efficiency** — Cheaper than running your own IP-based rate limiter that could be bypassed with distributed IPs

---

## Security Controls Detail

### 1. Authentication & Sessions

**Access Token (JWT)**
- Short-lived: 15 minutes
- Signed with `JWT_SECRET`
- Stored in httpOnly cookie
- Contains: `username`, `role`, `jti`

**Refresh Token (JWT)**
- Long-lived: 7 days
- Signed with `JWT_REFRESH_SECRET`
- Stored in httpOnly cookie with `sameSite: strict`
- Rotates on every use (old token invalidated via JTI tracking)
- Stored in database for revocation capability

**Password Storage**
- Algorithm: Argon2id (memory: 64MB, time: 3, parallelism: 4)
- Lazy migration: Existing bcrypt hashes are migrated on next successful login
- Validation: 8-128 characters

### 2. Authorization (RBAC)

**Roles**: `admin`, `guest`

**Centralized Middleware**: `requireRole(...roles)` middleware used on all protected routes.

**Ownership Checks**: `checkOwnership(resourceType)` middleware prevents IDOR:
- `user`: Users can only modify their own profile
- `review`: Users can only modify their own reviews
- `blog`: Users can only modify their own blogs (admins bypass)

### 3. Input Validation

**Zod Schemas** enforce validation before any database touch:

| Route | Schema |
|-------|--------|
| `POST /login` | `loginSchema` |
| `POST /create-account` | `createAccountSchema` |
| `PUT /profile` | `updateProfileSchema` |
| `POST /mountains/:id/reviews` | `submitReviewSchema` |
| `POST /admin/mountains` | `addMountainSchema` |
| `POST /faq` | `submitFaqSchema` |

### 4. File Upload Security

**Avatar Upload** (`POST /upload-avatar`):
1. Multer validates MIME type header
2. Magic byte validation (JPEG, PNG, GIF, WebP signatures)
3. Sharp re-encoding (strips EXIF, normalizes format)
4. Resize to max 512x512
5. Stored with SHA256 hash filename
6. Path traversal prevention in storage service

**Admin Photo Upload** (`POST /admin/upload-photo`):
1. Same magic byte validation
2. Sharp re-encoding (max 1920x1080, 85% quality)
3. Secure random filename

### 5. Network Isolation

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                               │
└──────────────────────┬──────────────────────────────────┘
                       │ :80, :443
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Caddy (reverse proxy)                                  │
│  - TLS termination                                      │
│  - Routes /api/* → backend:5000                         │
│  - Everything else → frontend:80                         │
└──────────────────────┬──────────────────────────────────┘
                       │ Internal Docker Network
          ┌────────────┴────────────┐
          │                        │
          ▼                        ▼
┌─────────────────┐    ┌─────────────────────┐
│   Backend       │    │     Frontend        │
│   (Node.js)     │    │     (Nginx)        │
│   :5000         │    │     :80            │
└────────┬────────┘    └─────────────────────┘
         │
         │ Internal only (no ports exposed)
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   :5432         │
└─────────────────┘
```

### 6. Container Security

- **Non-root users**: Both `backend` and `frontend` containers run as non-root (`nodejs`/`nginx`)
- **No secrets in images**: All secrets passed via environment variables at runtime
- **Pinned base images**: `node:22-alpine`, `nginx:alpine`, `postgres:16-alpine`
- **Dockerignore**: Excludes `node_modules`, `.env`, `.git` from build context

---

## Security Headers (CSP)

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
img-src 'self' data: https: https://upload.wikimedia.org https://*.wikimedia.org https://images.unsplash.com https://*.unsplash.com https://*.pexels.com https://*.pexelsmedia.com;
font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
connect-src 'self' ws: wss: https://query.wikidata.org https://www.wikidata.org https://commons.wikimedia.org https://api.open-meteo.com https://*.open-meteo.com;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
```

---

## Accepted Risks / False Positives

1. **In-memory rate limiting** — Simple IP-based limiter; bypassable with distributed IPs. Acceptable because Cloudflare handles distributed attacks.

2. **No refresh token expiration cleanup cron** — Expired tokens remain in `revoked_refresh_tokens` table. Acceptable for low-traffic app; add a scheduled job if scaling.

3. **HSTS preload not submitted** — Would require `includeSubDomains; preload`. Skipped for initial deployment; can add later.

---

## Security Checklist

- [x] SQL injection prevented (parameterized queries)
- [x] XSS prevented (CSP, output encoding)
- [x] CSRF prevented (sameSite cookies)
- [x] Auth tokens secured (httpOnly, short-lived)
- [x] Refresh tokens rotated and revocable
- [x] Passwords hashed with Argon2id
- [x] File uploads validated (magic bytes + re-encoding)
- [x] RBAC centralized (requireRole middleware)
- [x] IDOR prevented (ownership checks)
- [x] Input validated (Zod schemas)
- [x] Security headers set (Helmet CSP)
- [x] Structured logging (Pino)
- [x] Non-root containers
- [x] No secrets in images
- [x] Network isolation (no db/backend ports exposed)
