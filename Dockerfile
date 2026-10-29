# syntax=docker/dockerfile:1

# Image versions (global args, usable in every FROM below).
ARG NODE_VERSION=22-alpine
ARG NGINX_VERSION=1.30-alpine-slim

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
# 2. Serve the bundle with NGINX as a non-root user (port 8080)
# ─────────────────────────────────────────────────────────────
FROM nginx/nginx-unprivileged:${NGINX_VERSION} AS runtime

# SPA fallback, compression, cache policy and security headers.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Ship only the compiled output — no sources, node_modules or build tooling.
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
