# Add curl to the libretranslate/libretranslate image for health checks
FROM libretranslate/libretranslate:v1.9.6

USER root
RUN \
  if command -v apt-get >/dev/null 2>&1; then \
    apt-get update && apt-get install -y --no-install-recommends curl=8.12.1-3 \
    && rm -rf /var/lib/apt/lists/*; \
  elif command -v apk >/dev/null 2>&1; then \
    apk add --no-cache curl=8.12.1-r0; \
  else \
    echo "WARNING: No known package manager — health checks may fail"; \
  fi

USER libretranslate

HEALTHCHECK --interval=10s --timeout=4s --start-period=120s --retries=4 \
    CMD ./venv/bin/python scripts/healthcheck.py || exit 1
