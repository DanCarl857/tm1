# Tm (Task Management)

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

This repository is an Nx workspace containing a NestJS API (`apps/api`) and an Angular frontend (`apps/frontend`). The app implements a role-based access control (RBAC) model for organizations and tasks. This README documents how to run the project (locally and with Docker), explains the RBAC model and where permissions are enforced, and lists common run/test commands.

---

## Contents

- `apps/api` — NestJS backend (TypeORM + SQLite)
- `apps/frontend` — Angular frontend (standalone components)
- `data/sqlite.db` — SQLite database (used by the API in local development)

## Quick prerequisites

- Node.js 18+ / 20 recommended
- npm
- npx (comes with npm)
- Docker & Docker Compose (optional, to run containers)

## Install & run locally (developer flow)

1. Install dependencies

```bash
npm install
```

2. Start the API and frontend in parallel (dev servers)

```bash
# Start both using Nx (concurrent)
npm run dev

# Or start individually in separate terminals:
npm run api:dev
npm run frontend
```

Notes:
- The dev servers use `nx`. The API server watches files and reloads; the frontend runs the Angular dev server.
- The API uses the SQLite file at `data/sqlite.db` by default. Keep this file mapped in Docker if you want to persist data between runs.

## Build for production (locally)

```bash
npx nx build api --prod
npx nx build frontend --prod
```

After building:
- Backend build outputs to `dist/apps/api` (run with `node dist/apps/api/main.js`).
- Frontend build files live in `dist/apps/frontend` and can be served by any static server or nginx.

## RBAC (Role-Based Access Control)

This project implements a simple RBAC model with the following roles:

- `admin` — global administrator. Can manage organizations, users, logs and see everything.
- `org-admin` — organization administrator. Can manage users and tasks within their organization.
- `user` — regular organization user. Can create and update tasks according to org rules.
- `viewer` — read-only user; cannot modify tasks or manage users.

Role bindings are per-organization (stored in `UserOrganizationRole` entities). A user can hold multiple roles across different organizations. There is also a notion of a global admin which bypasses org-level restrictions.

How enforcement works:

- Server-side (authoritative):
  - The backend always enforces permissions. For example, `apps/api/src/tasks/tasks.service.ts` checks the caller's role in the target organization before allowing updates, deletions, or assignee modifications. Helper functions such as `getActorRoleInOrg()` and `isGlobalAdmin()` determine permissions and cause the API to return HTTP 403 when an action is not allowed.

- Frontend (UX & routing):
  - The Angular frontend mirrors server-side rules to hide or show action buttons (Edit/Delete/Complete) and assignee management controls.
  - A route guard (`apps/frontend/src/app/guards/role.guard.ts`) is used to prevent navigation to pages that require particular roles. Routes declare required roles via `data: { roles: ['admin','org-admin'], orgParam: 'orgId' }` and the guard checks the current user's roles and the selected organization.

Important: the frontend checks are for convenience and better UX; they are not a substitute for server-side authorization, which is the source of truth.

Examples:

- Only `admin` may access organization management endpoints; attempting the same as a non-admin will produce 403 from the API.
- `org-admin` and `admin` can add/remove assignees for tasks in that organization; `viewer` cannot.

## Environment variables (common)

- `PORT` — port the API listens on (default: 3333)
- `DATABASE_PATH` — file path to the SQLite DB (example: `/app/data/sqlite.db`)
- `JWT_SECRET` — JWT signing secret (in production)

Set these in your environment or in Docker Compose for container runs.

## Docker (images) and Docker Compose

This repository includes Docker artifacts to build and run the API and frontend in containers.

Files included:

- `Dockerfile.api` — builds the backend and runs it with Node (multi-stage).
- `Dockerfile.frontend` — builds the Angular app and serves it with nginx.
- `docker-compose.yml` — builds and runs the `api` and `frontend` services, mounting `./data` so the SQLite DB persists.

### Quick compose commands

```bash
# Build images and start containers in the foreground
docker-compose up --build

# Start in background
docker-compose up -d --build

# Stop and remove containers
docker-compose down
```

After compose starts:

- Frontend: http://localhost:4200
- API: http://localhost:3333

The compose file mounts the host `./data` folder into `/app/data` of the API container so your `sqlite.db` persists.

### Build & run individual images

```bash
# API
docker build -f Dockerfile.api -t tm-api .
docker run --rm -p 3333:3333 -v $(pwd)/data:/app/data -e PORT=3333 tm-api

# Frontend
docker build -f Dockerfile.frontend -t tm-frontend .
docker run --rm -p 4200:80 tm-frontend
```

## Troubleshooting

- If the frontend can't reach the API when in containers, check that the API is reachable at `http://host:3333` and that any CORS settings permit the request origin. When using compose with port mappings as above, `http://localhost:3333` should work from the host machine.
- If you receive 403 permission errors when attempting to change tasks/users, check the user's binding for the selected organization. The server logs contain the reason for rejections.

## Useful commands summary

- Install deps: `npm install`
- Start dev servers: `npm run dev` (runs API and frontend)
- API dev only: `npm run api:dev`
- Frontend dev only: `npm run frontend`
- Build production artifacts: `npx nx build api --prod && npx nx build frontend --prod`
- Docker Compose up: `docker-compose up --build`

---

If you'd like I can also:

- Add a `.env.example` describing environment variables used in development and production.
- Add a `Makefile` or small scripts for `dev`, `build`, `docker-build`, and `docker-up` convenience commands.

