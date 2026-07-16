# PocketBase for local development
# Uses the standard PB binary (pb-audit is deployed via pb_hooks/ on PocketHost)
# checkov:skip=CKV_DOCKER_3:Root needed for host bind-mount volume permissions in local dev
# NOSONAR — root required for bind-mount volume access in local dev; override with --user root
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

RUN mkdir -p /pb_data && chmod 777 /pb_data
RUN mkdir -p /pb_data/pb_hooks && chmod 777 /pb_data/pb_hooks

EXPOSE 8090

VOLUME ["/pb_data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8090/api/health || exit 1

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--hooksDir=/pb_data/pb_hooks"]
