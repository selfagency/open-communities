# ---- Build stage ----
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /build

# Initialize Go module and fetch dependencies
RUN go mod init github.com/selfagency/open-communities/pocketbase
COPY cmd/main.go ./cmd/main.go
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /pb/pocketbase ./cmd/

# ---- Runtime stage ----
FROM alpine:latest

RUN apk add --no-cache ca-certificates

COPY --from=builder /pb/pocketbase /pb/pocketbase

EXPOSE 8090

RUN mkdir -p /pb_data && chmod 755 /pb_data
VOLUME ["/pb_data"]

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data"]
