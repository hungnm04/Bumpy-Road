# Bumpy Road

Bumpy Road is a searchable mountain-destination field guide with a Vite React frontend,
an Express API, and PostgreSQL.

## Local Setup

Start Docker Desktop, then run:

```bash
docker compose -f docker-compose.dev.yml up
```

Open `http://localhost:5173`.

Local seeded accounts:

```text
admin / AdminPass123!
guest / GuestPass123!
```

## Checks

With the local stack running:

```bash
npm test
npm run build
npm audit --audit-level=low
docker compose --env-file .env.example config --quiet
```

See `PRODUCTION.md` for the GCP deployment flow.
