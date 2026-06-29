# Add curl to the tiago2/cap image for health checks
FROM tiago2/cap:3.1.5

RUN \
  if command -v apk >/dev/null 2>&1; then \
    apk add --no-cache curl; \
  elif command -v apt-get >/dev/null 2>&1; then \
    apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*; \
  else \
    echo "WARNING: No known package manager — health checks may fail"; \
  fi

USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1
