# PocketBase for local development
# Uses the standard PB binary (pb-audit is deployed via pb_hooks/ on PocketHost)
FROM alpine:latest

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

RUN mkdir -p /pb_data && chmod 755 /pb_data
VOLUME ["/pb_data"]

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data"]
