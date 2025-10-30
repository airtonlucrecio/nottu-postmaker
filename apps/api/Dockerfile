# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies for sharp and other native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    musl-dev \
    vips-dev \
    glib-dev \
    gobject-introspection-dev \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    tiff-dev \
    giflib-dev \
    librsvg-dev \
    pkgconfig \
    libc6-compat \
    ca-certificates \
    curl

# Configure sharp to prefer prebuilt binaries and avoid compilation
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=0
ENV SHARP_FORCE_GLOBAL_LIBVIPS=true
ENV SHARP_LIBVIPS_INCLUDE_DIR=/usr/include/vips
ENV SHARP_LIBVIPS_LIB_DIR=/usr/lib
ENV npm_config_sharp_binary_host=https://github.com/lovell/sharp-libvips/releases/download/
ENV npm_config_sharp_libvips_binary_host=https://github.com/lovell/sharp-libvips/releases/download/
ENV npm_config_cache=/tmp/.npm
ENV npm_config_update_notifier=false
ENV npm_config_build_from_source=false

# Copy root configuration required for builds
COPY tsconfig.json ./
COPY package.json package-lock.json ./

# Prepare package manifests
COPY packages/core/package.json packages/core/package.json
COPY packages/core/package-lock.json packages/core/package-lock.json
COPY packages/brand-kit/package.json packages/brand-kit/package.json
COPY packages/brand-kit/package-lock.json packages/brand-kit/package-lock.json
COPY packages/render/package.json packages/render/package.json
COPY packages/render/package-lock.json packages/render/package-lock.json
COPY packages/queue/package.json packages/queue/package.json
COPY packages/queue/package-lock.json packages/queue/package-lock.json
COPY apps/api/package.json apps/api/package.json
COPY apps/api/nest-cli.json apps/api/nest-cli.json

# Install package dependencies for shared packages
RUN npm ci --prefix packages/core --no-audit --no-fund && \
    npm ci --prefix packages/brand-kit --no-audit --no-fund && \
    npm ci --prefix packages/render --no-audit --no-fund && \
    npm ci --prefix packages/queue --no-audit --no-fund

# Copy package sources and build
COPY packages/core/ packages/core/
COPY packages/brand-kit/ packages/brand-kit/
COPY packages/render/ packages/render/
COPY packages/queue/ packages/queue/

RUN npm run build --prefix packages/core \
  && npm run build --prefix packages/brand-kit \
  && npm run build --prefix packages/render \
  && npm run build --prefix packages/queue

# Install API dependencies after local packages are built
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/api/scripts/ apps/api/scripts/
COPY apps/api/src/ apps/api/src/
RUN npm install --prefix apps/api --no-audit --no-fund --maxsockets 1 --include=dev || \
    (sleep 5 && npm install --prefix apps/api --no-audit --no-fund --maxsockets 1 --include=dev)

WORKDIR /app/apps/api
RUN npm run build

WORKDIR /app
RUN npm prune --prefix apps/api --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY apps/api/package.json ./package.json
COPY apps/api/nest-cli.json ./nest-cli.json

ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]
