# syntax=docker/dockerfile:1

# Image version (global arg, usable in every FROM below).
ARG NODE_VERSION=22-alpine

# ─────────────────────────────────────────────────────────────
# 1. Build the static site
# ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS build

WORKDIR /app

# Install dependencies first, so this layer stays cached until the lockfile changes.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Compile the Vite bundle into /app/dist.
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────
# 2. Serve the bundle with Node (no runtime dependencies)
# ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runtime

ENV NODE_ENV=production \
    PORT=8080 \
    STATIC_ROOT=/app/dist

WORKDIR /app

# Only the compiled output and the static server are shipped.
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server.mjs ./

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

STOPSIGNAL SIGTERM

CMD ["node", "server.mjs"]
