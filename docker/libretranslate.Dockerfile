# Add curl to the libretranslate/libretranslate image for health checks
FROM libretranslate/libretranslate:v1.9.6

USER root
RUN \
  if command -v apt-get >/dev/null 2>&1; then \
    apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*; \
  elif command -v apk >/dev/null 2>&1; then \
    apk add --no-cache curl; \
  else \
    echo "WARNING: No known package manager — health checks may fail"; \
  fi

USER libretranslate

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1
