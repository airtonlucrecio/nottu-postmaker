# syntax=docker/dockerfile:1
ARG VITE_API_URL=http://localhost:3000

FROM node:20-alpine AS base
WORKDIR /app

ENV VITE_API_URL=${VITE_API_URL}

COPY apps/web/package.json apps/web/package.json
COPY apps/web/package-lock.json apps/web/package-lock.json
RUN npm ci --prefix apps/web

COPY apps/web/ apps/web/
WORKDIR /app/apps/web
RUN npm run build

FROM node:20-alpine AS runner
ARG VITE_API_URL=http://localhost:3000
WORKDIR /app
ENV NODE_ENV=production
ENV VITE_API_URL=${VITE_API_URL}
RUN npm install -g serve
COPY --from=base /app/apps/web/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
# syntax=docker/dockerfile:1
ARG VITE_API_URL=http://localhost:3000

FROM node:20-alpine AS base
WORKDIR /app

ENV VITE_API_URL=${VITE_API_URL}

# Copy root configuration required for builds
COPY tsconfig.json ./

# Copy shared packages first
COPY packages/core/package.json packages/core/package.json
COPY packages/core/package-lock.json packages/core/package-lock.json
COPY packages/brand-kit/package.json packages/brand-kit/package.json
COPY packages/brand-kit/package-lock.json packages/brand-kit/package-lock.json

# Install shared packages dependencies
RUN npm ci --prefix packages/core
RUN npm ci --prefix packages/brand-kit

# Copy shared packages source code
COPY packages/core/ packages/core/
COPY packages/brand-kit/ packages/brand-kit/

# Build shared packages
RUN npm run build --prefix packages/core
RUN npm run build --prefix packages/brand-kit

# Copy and install web app
COPY apps/web/package.json apps/web/package.json
COPY apps/web/package-lock.json apps/web/package-lock.json
RUN npm ci --prefix apps/web

COPY apps/web/ apps/web/
WORKDIR /app/apps/web
RUN npm run build

FROM node:20-alpine AS runner
ARG VITE_API_URL=http://localhost:3000
WORKDIR /app
ENV NODE_ENV=production
ENV VITE_API_URL=${VITE_API_URL}
RUN npm install -g serve
COPY --from=base /app/apps/web/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
