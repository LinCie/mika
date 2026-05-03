# Base image
FROM oven/bun:1 AS base
WORKDIR /app
# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 openssl ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install all dependencies (including dev)
FROM base AS deps
# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prerelease stage
FROM build AS prerelease
# Generate Prisma client (dummy URL needed by prisma.config.ts at generate time)
ENV TURSO_DATABASE_URL="file:./dev.db"
RUN bun prisma:generate

# Final runtime image
FROM base AS release
COPY --from=prerelease /app ./
RUN mkdir -p /app/download && \
    chown -R bun:bun /app/download /app/node_modules/youtube-dl-exec/bin
USER bun
ENTRYPOINT ["bun", "run", "./src/mika.ts"]
