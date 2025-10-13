# Base image
FROM oven/bun:1 AS base
WORKDIR /app
# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install all dependencies (including dev)
FROM base AS deps
# Install python3 for yt-dlp build
RUN apt-get update && \ 
    apt-get install -y --no-install-recommends python3 && \
    rm -rf /var/lib/apt/lists/*
# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prerelease stage
FROM build AS prerelease
# Generate Prisma client
RUN bun prisma:generate

# Final runtime image
FROM base AS release
COPY --from=prerelease /app ./
USER bun
ENTRYPOINT ["bun", "run", "./src/mika.ts"]
