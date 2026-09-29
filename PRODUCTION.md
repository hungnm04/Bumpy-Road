# Bumpy Road production MVP on GCP Compute Engine

This repository is set up to run as one Docker Compose application:

- `app`: Express API plus the built Vite frontend from `dist`
- `db`: private PostgreSQL container with a persistent Docker volume
- `caddy`: public HTTPS reverse proxy for `ascensionfuzz.me`

Postgres is not exposed to the public internet. Only ports `80` and `443` need to be open on the GCP firewall.

## 1. Create the VM

Use a GCP Compute Engine VM with Ubuntu LTS. A small MVP machine is fine to start:

```bash
e2-small or e2-medium
20GB+ balanced persistent disk
HTTP and HTTPS firewall allowed
```

Point DNS to the VM external IP:

```text
A     ascensionfuzz.me       <vm-external-ip>
A     www.ascensionfuzz.me   <vm-external-ip>
```

## 2. Install Docker on the VM

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and back in after adding the Docker group.

## 3. Configure production secrets

Copy `.env.example` to `.env.production` on the VM and replace every placeholder:

```bash
cp .env.example .env.production
```

Required production values:

```text
NODE_ENV=production
PORT=5000
CLIENT_ORIGINS=https://ascensionfuzz.me,https://www.ascensionfuzz.me

DB_USER=bumpyroad
DB_HOST=db
DB_NAME=bumpyroad
DB_PASSWORD=<strong unique password>
DB_PORT=5432
DB_SSL=false

JWT_SECRET=<32+ random chars>
JWT_REFRESH_SECRET=<32+ random chars>

ADMIN_USERNAME=admin
ADMIN_EMAIL=<your admin email>
ADMIN_PASSWORD=<strong 12+ char admin password>

INGEST_USER_AGENT=BumpyRoad/1.0 (contact: <your admin email>)
INGEST_ALLOWED_HOSTS=query.wikidata.org,www.wikidata.org,commons.wikimedia.org,api.open-meteo.com
```

Generate secrets with:

```bash
openssl rand -base64 48
```

## 4. Deploy

From the repository folder on the VM:

```bash
docker compose --env-file .env.production up -d --build
```

The app container automatically runs:

```bash
npm run db:migrate
npm run db:seed:admin
npm start
```

Check status:

```bash
docker compose --env-file .env.production ps
curl -f https://ascensionfuzz.me/healthz
```

## 5. Local MVP run

When Docker Desktop is running locally:

```bash
docker compose -f docker-compose.dev.yml up
```

Then open:

```text
http://localhost:5173
```

Local seeded accounts:

```text
admin / AdminPass123!
guest / GuestPass123!
```

## 6. Import destination drafts

The ingestion worker only reads from Wikidata and Wikimedia Commons over HTTPS. It stores
source URLs and image attribution with each candidate. New records are drafts until an
admin publishes them from the Imports tab in the dashboard.

Back up PostgreSQL before the first production import:

```bash
docker compose --env-file .env.production exec -T db pg_dump -U bumpyroad bumpyroad > before-destination-import.sql
```

Preview a small provider request, then stage up to 200 review candidates:

```bash
docker compose --env-file .env.production run --rm app npm run data:discover -- --limit=3 --dry-run
docker compose --env-file .env.production run --rm app npm run data:discover -- --limit=1000
```

The importer is idempotent. Re-running discovery updates source-owned fields instead of
creating duplicate Wikidata records. Editorial descriptions, tags, selected images, and
publication decisions remain under admin control.

For the first catalog release only, publish drafts that have complete geography and an
attributed HTTPS image:

```bash
docker compose --env-file .env.production run --rm app npm run data:publish-ready
```

This is an explicit release command. Discovery and weekly refresh never auto-publish new
records. Incomplete records stay in the admin Imports queue for review.

Promote a deliberately bounded set of complete published destinations into reviewed
guides for the first Weather Window release:

```bash
docker compose --env-file .env.production run --rm app npm run data:audit-guides -- --limit=150
```

The guide audit is idempotent. It keeps the public catalog searchable while reserving
forecast rankings for destinations with complete geography, verified media, original
practical overviews, and trip-fit notes.

Refresh known records weekly without auto-publishing new destinations:

```bash
crontab -e
```

Add:

```cron
17 3 * * 0 cd /path/to/Bumpy-Road && docker compose --env-file .env.production run --rm app npm run data:refresh -- --existing-only >> /var/log/bumpy-road-refresh.log 2>&1
```

The public Nominatim service is intentionally not used for bulk geocoding. Coordinates
come from Wikidata.

### Commercial content-source rule

Keep imported facts separate from editorial writing:

- Store reusable structured facts from permitted feeds such as Wikidata.
- Write original Bumpy Road destination summaries from those facts.
- Keep provider provenance visible to admins for review and auditing.
- Do not scrape or persist Tripadvisor reviews or travel-site prose. Tripadvisor content
  must use its official Content API under an approved key and its current caching rules.
- Keep a compact public photo-info link when a reused image license requires attribution.

Weather Window fetches short-lived forecast context from Open-Meteo on demand. Forecasts
are cached briefly for comparison performance and are never stored as permanent
destination facts.

## 7. Backups and restore

Create a backup:

```bash
docker compose --env-file .env.production exec -T db pg_dump -U bumpyroad bumpyroad > backup.sql
```

Restore a backup into a fresh DB volume:

```bash
docker compose --env-file .env.production down
docker volume rm bumpy-road_postgres_data
docker compose --env-file .env.production up -d db
cat backup.sql | docker compose --env-file .env.production exec -T db psql -U bumpyroad bumpyroad
docker compose --env-file .env.production up -d --build
```

Test restores before depending on backups.

## 8. Security checklist

Before go-live:

```bash
npm run build
npm audit --audit-level=low
docker compose --env-file .env.production config
```

Confirm:

- `CLIENT_ORIGINS` only contains HTTPS production origins.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` are unique and at least 32 characters.
- `DB_PASSWORD` and `ADMIN_PASSWORD` are not reused anywhere else.
- GCP firewall exposes only `80`, `443`, and restricted SSH.
- No public `5432` rule exists.
- `/storage` is mounted as a Docker volume.
- `INGEST_USER_AGENT` contains a monitored contact address.
- `INGEST_ALLOWED_HOSTS` contains only the expected Wikidata, Wikimedia, and Open-Meteo hosts.
