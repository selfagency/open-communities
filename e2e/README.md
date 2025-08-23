# Playwright E2E tests

This folder documents how to run the Playwright E2E tests and the helper tooling that brings up the local dependencies used by the tests (PocketBase, Mailpit, and Cap).

Requirements

- Docker (for the docker-compose local flow)
- Node 20 / pnpm (the project uses pnpm)

Services and default ports

- PocketBase: <http://127.0.0.1:8090>
- Mailpit HTTP API: <http://127.0.0.1:8025> (SMTP: 127.0.0.1:1025)
- Cap standalone API (mapped): <http://127.0.0.1:3001>
- App frontend (when run locally): <http://localhost:4173>

Environment variables (use when you need non-default ports/hosts)

- PB_TEST_API - PocketBase API endpoint (default <http://127.0.0.1:8090>)
- PB_TEST_BASEURL - app frontend base URL (default <http://localhost:4173>)
- MAILPIT_API - Mailpit API base (default <http://127.0.0.1:8025/api/v1>)

Local developer flow (automated)

The `e2e/run-e2e.sh` script automates the common local E2E flow. It will build the app, create the Docker image, start docker-compose (app + pocketbase + mailpit + cap), create a Cap key if needed, and finally run Playwright tests.

Example (simple):

pnpm run e2e

What the script does (summary):

- builds an app image using `e2e/Dockerfile.app` (the image runs `pnpm build` inside the container so a host `pnpm build` is not required)

-## Note for Apple Silicon (M1/M2): building inside a linux container can fail due to native optional dependencies used by tools such as Rollup. The orchestrator runs `pnpm build` on the host by default to avoid this problem. If you prefer to build inside the image, set `SKIP_HOST_BUILD=1`.

Image platform selection

- The orchestrator will choose a Docker build platform automatically:
  - In CI it defaults to `linux/amd64`.
  - Locally, on arm64 hosts (Apple Silicon), it prefers `linux/arm64` so the image architecture matches the machine.
- Override with `DOCKER_BUILD_PLATFORM`, for example:

  DOCKER_BUILD_PLATFORM=linux/amd64 pnpm run e2e

- If you need to build an image for a different platform locally, the script uses `docker buildx` so cross-platform builds are supported.

- runs `docker-compose -f e2e/docker-compose.yml up -d --build` to start app, PocketBase, Mailpit and Cap
- waits for ports 8090, 8025 and 3001 to be reachable
- runs `node e2e/cap/create-key.mjs` to create a deterministic Cap site key (writes `.e2e/cap-key.json`) if Cap is reachable
- clears Mailpit messages and runs Playwright tests

Manual service control

If you prefer to run services manually (or from a different orchestration mechanism), run:

docker-compose -f e2e/docker-compose.yml up -d --build

Then create a Cap key if needed (the compose file sets an admin key by default so the helper should work without extra env):

node e2e/cap/create-key.mjs

CI integration

In CI you should provision the required services using that environment's docker setup. When `CI` is present in the environment, `e2e/run-e2e.sh` will skip starting docker-compose and will instead wait for the required ports to become reachable. This lets CI keep the service lifecycle in the job configuration.

Notes

- `.e2e/cap-key.json` is created by the helper and contains the site key and secret used by the app and server for captcha validation. If this file exists the runner will export `PUBLIC_CAPTCHA_SITE_KEY` and `CAPTCHA_SITE_SECRET` for the Playwright run.
- The Cap helper expects the Cap standalone API to accept an `x-api-key` header for admin operations. The `e2e/docker-compose.yml` sets a default admin key for the Cap container so the helper should be able to create a key without extra environment variables.
- Make sure Docker is running before invoking the local automated flow.

Troubleshooting

- If the Cap helper is waiting for the Cap API, check the container logs and ensure the container's API port is mapped to the host port configured by `CAP_STANDALONE_PORT` (default 3001).
- If Playwright reports missing captcha keys, ensure `.e2e/cap-key.json` exists and is readable.

Contact

If you need help adjusting ports or CI wiring, add a note in the project README or open an issue in the repo.
