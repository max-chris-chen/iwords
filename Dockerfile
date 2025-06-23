# 1. Base Stage, contains node and pnpm
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Enable pnpm
RUN corepack enable

# 2. Builder Stage, installs dependencies and builds the app
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .


RUN pnpm build

# 3. Production Stage, contains only the final app
FROM base AS production
WORKDIR /app
# Copy built app and dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD [ "node", "build/index.js" ]
