# AGENTS Guidelines for This Repository

This repository contains a Vite React frontend and an Express backend in the root of
the repository. The production Express server serves the built frontend from `dist`.

## Development

- Use `npm run dev` for the Vite frontend dev server.
- Run the backend separately with `npm start` when testing API-backed flows.
- Vite dev proxies API paths to `http://localhost:5000` through `vite.config.ts`.

## Production Checks

- `npm run build` is valid for this project and should be run before deployment.
- `npm audit --audit-level=low` should stay clean before going live.
- `npm start` runs `server.js`, which serves both API routes and the built frontend.

## Deployment

- Set production environment variables from `.env.example`.
- In production, set `NODE_ENV=production`.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must each be at least 32 characters.
- `CLIENT_ORIGINS` should include only the live HTTPS origins, for example:
  `https://ascensionfuzz.me,https://www.ascensionfuzz.me`.

## Coding Conventions

- Prefer the existing React JSX and CommonJS backend style unless doing a larger
  migration.
- Keep security-sensitive changes focused and verify with build plus audit.
- Do not commit generated browser profiles, screenshots, logs, `node_modules`, or
  `dist`.
