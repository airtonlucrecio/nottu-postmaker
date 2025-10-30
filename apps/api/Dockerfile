# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

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
COPY apps/api/package-lock.json apps/api/package-lock.json
COPY apps/api/nest-cli.json apps/api/nest-cli.json

# Install package dependencies for shared packages
RUN npm ci --prefix packages/core \
  && npm ci --prefix packages/brand-kit \
  && npm ci --prefix packages/render \
  && npm ci --prefix packages/queue

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
COPY apps/api/src/ apps/api/src/
RUN npm ci --prefix apps/api \
  && npm run build --prefix apps/api \
  && npm prune --prefix apps/api --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/node_modules ./node_modules
COPY apps/api/package.json ./package.json
COPY apps/api/nest-cli.json ./nest-cli.json

ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]
