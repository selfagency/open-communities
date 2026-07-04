# Multi-stage build: compile inside a full Node image, then produce a minimal runtime image
# checkov:skip=CKV_DOCKER_2:HEALTHCHECK not needed for build-stage image
# checkov:skip=CKV_DOCKER_3:Root needed for CI build process
# checkov:skip=CKV_DOCKER_7:ARG for build-only secrets is acceptable — multi-stage build
# discards the builder layer; only the runtime stage (no secrets) is pushed.
FROM node:22 AS builder
WORKDIR /app

# Build-time secrets for typegen against the production PocketBase instance
# These are consumed only during the build step inside the builder stage.
# The multi-stage pattern discards this layer; only the runtime stage is pushed.
ARG PB_API_TOKEN
ARG PB_URL

# Build-time commit SHA for version tracking (e.g. PostHog sourcemaps)
# CI passes COMMIT_SHA via --build-arg; local builds default to 'dev'
# Also used as a cache buster — every commit gets a fresh fetch-translations run
ARG COMMIT_SHA
ENV SOURCE_VERSION=${COMMIT_SHA:-dev}

# Install pnpm
RUN npm install -g pnpm@10

# Copy dependency manifests first for Docker layer caching
COPY package.json pnpm-lock.yaml ./
# CI=true prevents ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY in non-TTY CI envs
# --mount=type=cache caches the pnpm store across builds (Docker BuildKit)
RUN --mount=type=cache,target=/root/.local/share/pnpm-store \
    CI=true pnpm fetch \
    && CI=true pnpm install --offline

# Copy the rest of the source and build the production output
# PB_API_TOKEN/PB_URL passed inline to avoid persisting as ENV in intermediate layers
COPY . .
RUN CI=true SOURCE_VERSION=${SOURCE_VERSION} COMMIT_SHA=${COMMIT_SHA} \
  PB_API_TOKEN=${PB_API_TOKEN} PB_URL=${PB_URL} \
  pnpm run build:prod

# ─── Runtime image ───────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package manifests first
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
# --ignore-scripts avoids the husky prepare hook failing in prod install
# --frozen-lockfile ensures deterministic install; fall back if lockfile is absent
RUN npm install -g pnpm@10 \
    && (pnpm fetch --prod 2>/dev/null || true) \
    && (pnpm install --prod --frozen-lockfile --ignore-scripts --offline \
        || pnpm install --prod --ignore-scripts)

# Copy build output from the builder stage
COPY --from=builder /app/build ./build

ENV NODE_ENV=production
USER appuser
EXPOSE 3000

# Use 127.0.0.1 instead of localhost to avoid IPv6 resolution issues in Alpine
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "build/index.js"]
