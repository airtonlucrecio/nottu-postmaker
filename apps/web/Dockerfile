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
