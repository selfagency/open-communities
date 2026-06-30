# Docker Compose setup

This directory contains the Docker Compose setup for running **local development** services and **E2E test** dependencies.

## Architecture

Two compose files work together:

| File | Purpose | Used by |
|------|---------|---------|
| `docker-compose.yml` | Production base — bare services, no ports/networks | Coolify (Docker Compose build pack) |
| `docker-compose.dev.yml` | Dev override — adds ports, network, PocketBase, Mailpit | Local dev, CI/E2E |

## Services

| Service | Internal DNS | Host port (dev) | Purpose |
|---------|-------------|-----------------|---------|
| `pocketbase` | `http://pocketbase:8090` | `8090` | Database + auth (dev only) |
| `mailpit` | `http://mailpit:8025` | `1025` / `8025` | SMTP catch-all (dev only) |
| `dragonfly` | `redis://dragonfly:6379` | `6379` | Redis-compatible cache |
| `cap` | `http://cap:3000` | `3001` | Captcha validation |
| `libretranslate` | `http://libretranslate:5000` | `5000` | Machine translation |
| `app` | — | — | Production SvelteKit app (Coolify only) |

## Local dev

```bash
# Start infra only (SvelteKit runs via pnpm dev)
pnpm deps:up

# Bootstrap PocketBase (first time)
pnpm deps:bootstrap

# Start dev server
pnpm dev

# Stop everything
pnpm deps:down

# Full wipe and restart
pnpm deps:reset
```

## E2E tests

```bash
# Start infra
pnpm deps:up

# Bootstrap PocketBase
pnpm deps:bootstrap

# Build app image + run container manually
docker build -f docker/Dockerfile -t opencommunities-e2e ..
docker run -d --name opencommunities-e2e --network docker_dev \
  -p 3000:3000 -e NODE_ENV=test \
  -e PUBLIC_API_ENDPOINT=http://docker-pocketbase-1:8090 \
  -e PUBLIC_CAPTCHA_ENDPOINT=http://localhost:3001 \
  -e CAPTCHA_SITE_SECRET=... \
  opencommunities-e2e

# Run Playwright
pnpm test:e2e
```

## Production (Coolify)

Uses `docker-compose.yml` directly (Docker Compose build pack). Coolify manages networking, ports via Traefik, and env vars through its UI. No profiles or custom networks needed.

## Manual compose commands

```bash
# Dev (with override)
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d --build

# Production (base only)
docker compose -f docker/docker-compose.yml up -d --build
```
