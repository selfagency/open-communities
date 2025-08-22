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

# uncomment to copy local migration/hooks if you want to bake them into the image
# COPY ./pb_migrations /pb/pb_migrations
# COPY ./pb_hooks /pb/pb_hooks

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
