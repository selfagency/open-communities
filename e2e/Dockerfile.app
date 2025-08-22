# Multi-stage build: build the project inside the image, then produce a small runtime image
FROM node:20 AS builder
WORKDIR /app

# Install pnpm and copy lockfiles first for better cache use
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10

# Copy the rest of the repo and build the production output
COPY . .
# Skip optional dependencies to avoid native optional binaries (like rollup native) failing on some platforms
RUN pnpm install --no-optional && pnpm build

FROM node:20-alpine AS runtime
WORKDIR /app

# Install runtime package manager and production deps
COPY package.json pnpm-lock.yaml ./
# If a lockfile is present in the build context pnpm will use it; if not, fall back to a normal install.
RUN npm install -g pnpm@10 && (pnpm install --prod --frozen-lockfile || pnpm install --prod)

# Copy only the build output from the builder stage
COPY --from=builder /app/build ./build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "build/index.js"]
