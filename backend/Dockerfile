# Base

FROM node:25-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@11.0.9

COPY package.json pnpm-lock.yaml ./

# Dependencies

FROM base AS deps

RUN pnpm install --frozen-lockfile

# Development

FROM deps AS development

COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]

# Build

FROM deps AS builder

COPY . .

RUN pnpm run build

# Production

FROM node:25-alpine AS production

WORKDIR /app

RUN npm install -g pnpm@11.0.9

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["pnpm", "run", "start"]
