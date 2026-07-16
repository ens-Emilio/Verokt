# ---- Base ----
FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN pnpm install --frozen-lockfile

# ---- Backend (API + Worker) ----
FROM deps AS backend
COPY packages/shared packages/shared
COPY packages/backend packages/backend
RUN npx playwright install --with-deps chromium
EXPOSE 3000
CMD ["npx", "tsx", "packages/backend/src/index.ts"]

# ---- Build Frontend ----
FROM deps AS build-frontend
COPY packages/shared packages/shared
COPY packages/frontend packages/frontend
RUN pnpm --filter @verokt/frontend exec vite build

# ---- Frontend (nginx) ----
FROM nginx:alpine AS frontend
COPY --from=build-frontend packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
