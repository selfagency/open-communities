#!/usr/bin/env bash
set -eu

# Build, start node server, wait for readiness, run playwright, cleanup
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

BASE_URL="${PB_TEST_BASEURL:-http://localhost:3000}"
LOGFILE="/tmp/opencommunities-e2e.log"
PIDFILE="/tmp/opencommunities-e2e.pid"

echo "[e2e] Building project..."
### If using Cap Standalone, assume it's managed externally (docker-compose / CI) and
### only wait for the API to be reachable before attempting key creation. Do NOT start
### the Cap container from this script — dependency lifecycle should be handled outside.
if [ "${USE_CAP_STANDALONE:-}" = "1" ]; then
  echo "[e2e] USE_CAP_STANDALONE=1: expecting Cap standalone to be started externally."
  CAP_STANDALONE_PORT=${CAP_STANDALONE_PORT:-3001}

  echo "[e2e] Waiting for Cap Standalone at http://localhost:${CAP_STANDALONE_PORT}..."
  cap_deadline=$(( $(date +%s) + 30 ))
  while true; do
    if curl -sS http://localhost:${CAP_STANDALONE_PORT}/ -o /dev/null; then
      echo "[e2e] Cap Standalone is reachable"
      break
    fi
    if [ $(date +%s) -gt $cap_deadline ]; then
      echo "[e2e] Timeout waiting for Cap Standalone; continuing but captcha may fail unless keys are pre-configured."
      break
    fi
    sleep 0.5
  done

  echo "[e2e] Attempting to auto-create/find Cap key via helper..."
  # The helper expects CAP_ADMIN_KEY to be set if Cap requires an admin token.
  node ./e2e/cap/create-key.mjs || true
  if [ -f "$PROJECT_ROOT/.e2e/cap-key.json" ]; then
    echo "[e2e] Found cap key file; exporting site key and secret into environment"
    CAP_KEY=$(node -e "console.log(require('./.e2e/cap-key.json').key)")
    CAP_SECRET=$(node -e "console.log(require('./.e2e/cap-key.json').secret)")
    export PUBLIC_CAPTCHA_SITE_KEY=${PUBLIC_CAPTCHA_SITE_KEY:-$CAP_KEY}
    export CAPTCHA_SITE_SECRET=${CAPTCHA_SITE_SECRET:-$CAP_SECRET}
    echo "[e2e] PUBLIC_CAPTCHA_SITE_KEY set to ${PUBLIC_CAPTCHA_SITE_KEY}"
  else
    echo "[e2e] cap key file not found at .e2e/cap-key.json — ensure you create a key in Cap dashboard and set PUBLIC_CAPTCHA_SITE_KEY and CAPTCHA_SITE_SECRET"
  fi
fi

echo "[e2e] NOTE: building the app will be performed inside the Docker image (no host pnpm build)."
echo "[e2e] If you want to build on the host instead, run 'pnpm build' manually before invoking this script."

# If not running in CI, build the app Docker image and bring up compose services (cap, mailpit, pocketbase, app)
if [ "${CI:-}" = "" ]; then
  # Choose platform: on CI default to linux/amd64; locally detect host arch and prefer linux/arm64 on arm hosts.
  # Allow override with DOCKER_BUILD_PLATFORM env var.
  if [ -n "${CI:-}" ]; then
    BUILD_PLATFORM=${DOCKER_BUILD_PLATFORM:-linux/amd64}
  else
    HOST_ARCH=$(uname -m || echo "")
    if [ "${HOST_ARCH}" = "arm64" ] || [ "${HOST_ARCH}" = "aarch64" ]; then
      BUILD_PLATFORM=${DOCKER_BUILD_PLATFORM:-linux/arm64}
    else
      BUILD_PLATFORM=${DOCKER_BUILD_PLATFORM:-linux/amd64}
    fi
  fi

  echo "[e2e] Docker build platform: ${BUILD_PLATFORM}"

  # Decide whether to build on host: by default build on host unless
  #  - SKIP_HOST_BUILD=1 is set, or
  #  - the chosen BUILD_PLATFORM matches the host arch (e.g. linux/arm64 on an arm host)
  SKIP_BUILD_ON_HOST=0
  if [ "${SKIP_HOST_BUILD:-}" = "1" ]; then
    SKIP_BUILD_ON_HOST=1
  else
    if [ "${BUILD_PLATFORM}" = "linux/arm64" ] && ( [ "${HOST_ARCH}" = "arm64" ] || [ "${HOST_ARCH}" = "aarch64" ] ); then
      echo "[e2e] BUILD_PLATFORM matches host arch; will build inside the image instead of host."
      SKIP_BUILD_ON_HOST=1
    fi
  fi

  if [ "$SKIP_BUILD_ON_HOST" = "0" ]; then
    echo "[e2e] Building project on host (pnpm build)..."
    pnpm build
  else
    echo "[e2e] Skipping host build; image build will run the build step."
  fi

  # Ensure buildx builder is available and use it so we can specify platform easily.
  if ! docker buildx ls >/dev/null 2>&1; then
    docker buildx create --use --name e2e-builder >/dev/null 2>&1 || true
  fi

  buildx_build() {
    echo "[e2e] Attempting buildx build (platform=${BUILD_PLATFORM})..."
    if docker buildx build --platform ${BUILD_PLATFORM} -t opencommunities-app:latest -f e2e/Dockerfile.app . --load; then
      echo "[e2e] buildx build succeeded"
      return 0
    else
      echo "[e2e] buildx build failed"
      return 1
    fi
  }

  # Try buildx, but if it fails, fall back to building on host (unless SKIP_HOST_BUILD=1), then regular docker build
  if buildx_build; then
    echo "[e2e] Image built via buildx"
  else
    echo "[e2e] buildx failed. Falling back to host build flow."
    if [ "${SKIP_HOST_BUILD:-}" != "1" ]; then
      echo "[e2e] Running host pnpm build as part of fallback..."
      pnpm build || true
    else
      echo "[e2e] SKIP_HOST_BUILD=1; skipping host build fallback"
    fi
    echo "[e2e] Retrying docker build (no buildx)..."
    docker build -t opencommunities-app:latest -f e2e/Dockerfile.app . || true
  fi

  echo "[e2e] Bringing up backend services via docker-compose..."
  docker-compose -f e2e/docker-compose.yml up -d --build

  # ensure services started
  echo "[e2e] Waiting for dependent services to become available..."
  # wait for pocketsbase (8090), mailpit (8025) and cap (3001)
  for port in 8090 8025 3001; do
    deadline=$(( $(date +%s) + 30 ))
    while true; do
      if nc -z localhost $port 2>/dev/null; then
        echo "[e2e] port $port is open"
        break
      fi
      if [ $(date +%s) -gt $deadline ]; then
        echo "[e2e] Timeout waiting for port $port to open"
        break
      fi
      sleep 0.5
    done
  done
else
  echo "[e2e] Running in CI: assuming dependencies are managed externally; waiting for ports..."
  # in CI, just wait for ports, but do not start docker-compose
  for port in 8090 8025 3001; do
    deadline=$(( $(date +%s) + 60 ))
    while true; do
      if nc -z localhost $port 2>/dev/null; then
        echo "[e2e] port $port is open"
        break
      fi
      if [ $(date +%s) -gt $deadline ]; then
        echo "[e2e] Timeout waiting for port $port to open in CI"
        break
      fi
      sleep 0.5
    done
  done
fi

echo "[e2e] Starting Node server (node build/index.js)..."
# Mailpit SMTP defaults: host 127.0.0.1, port 1025 (no auth). These env keys are used by the
# project's mail sending logic during runtime tests/mocks. Do NOT set SKIP_CAPTCHA here; we
# want to exercise real captcha flows in e2e runs.
export SMTP_HOST=${SMTP_HOST:-127.0.0.1}
export SMTP_PORT=${SMTP_PORT:-1025}

nohup node build/index.js > "$LOGFILE" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PIDFILE"

cleanup() {
  echo "[e2e] Stopping server PID $SERVER_PID"
  kill "$SERVER_PID" 2>/dev/null || true
  rm -f "$PIDFILE"
}

trap cleanup EXIT INT TERM

echo "[e2e] Waiting for server at $BASE_URL to become healthy..."
deadline=$(( $(date +%s) + 60 ))
while true; do
  if curl -sS -o /dev/null "$BASE_URL"; then
    echo "[e2e] Server is responding"
    break
  fi
  if [ $(date +%s) -gt $deadline ]; then
    echo "[e2e] Timeout waiting for server. Check $LOGFILE"
    exit 1
  fi
  sleep 0.5
done

# ... Cap already started above if requested

echo "[e2e] Clearing Mailpit (if available)..."
check_mailpit() {
  local MAILPIT_API=${MAILPIT_API:-http://127.0.0.1:8025/api/v1}
  echo "[e2e] Checking Mailpit at $MAILPIT_API..."
  deadline=$(( $(date +%s) + 30 ))
  while true; do
    if curl -sS "$MAILPIT_API/messages" -o /dev/null; then
      echo "[e2e] Mailpit API is reachable"
      return 0
    fi
    if [ $(date +%s) -gt $deadline ]; then
      echo "[e2e] Mailpit not reachable at $MAILPIT_API after 30s; please start Mailpit at http://127.0.0.1:8025"
      return 1
    fi
    sleep 0.5
  done
}

if command -v curl >/dev/null 2>&1; then
  if check_mailpit; then
    curl -s -X DELETE "${MAILPIT_API:-http://127.0.0.1:8025/api/v1/messages}" || true
  else
    echo "[e2e] Aborting e2e run because Mailpit is not available"
    exit 1
  fi
fi

echo "[e2e] Running Playwright tests..."
pnpm exec playwright test --config e2e/playwright.config.mjs
EXIT_CODE=$?

echo "[e2e] Playwright finished with exit code $EXIT_CODE"
exit $EXIT_CODE
