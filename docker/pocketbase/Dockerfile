# PocketBase for local development
# Uses the standard PB binary (pb-audit is deployed via pb_hooks/ on PocketHost)
FROM alpine:3.21

ARG PB_VERSION=0.29.2
ARG PB_ARCH=amd64

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    curl

# download and unzip PocketBase for the requested architecture
RUN curl -fsSL -o /tmp/pb.zip \
  "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" \
  && unzip /tmp/pb.zip -d /pb/ \
  && rm -f /tmp/pb.zip

EXPOSE 8090

RUN mkdir -p /pb_data && chmod 755 /pb_data \
    && addgroup -S pocketbase \
    && adduser -S pocketbase -G pocketbase \
    && chown -R pocketbase:pocketbase /pb /pb_data

USER pocketbase

VOLUME ["/pb_data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8090/api/health || exit 1

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data"]
