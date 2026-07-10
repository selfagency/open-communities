# Add curl to the tiago2/cap image for health checks
FROM tiago2/cap:3.1.5

USER root
RUN \
  if command -v apk >/dev/null 2>&1; then \
    apk add --no-cache curl=8.12.1-r0; \
  elif command -v apt-get >/dev/null 2>&1; then \
    apt-get update && apt-get install -y --no-install-recommends curl=8.12.1-3 \
    && rm -rf /var/lib/apt/lists/*; \
  else \
    echo "WARNING: No known package manager — health checks may fail"; \
  fi

# Create and switch to a non-root user for security
RUN useradd -m -s /bin/bash capuser
USER capuser

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1
