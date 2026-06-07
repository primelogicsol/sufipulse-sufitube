# Use Debian-based image for maximum compatibility
FROM node:20-bookworm-slim AS base

# 1. Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Use npm install for better resilience across different build environments
RUN npm install

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Set these FIRST — before any COPY so prebuild/predev scripts see them
ENV CI=true
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV SENTRY_DISABLE_AUTO_UPLOAD=true
ENV NODE_ENV=production
# Increase Node.js heap to prevent OOM on memory-constrained CI runners
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept NEXT_PUBLIC vars at build time (baked into client bundle)
ARG NEXT_PUBLIC_APP_URL=https://sufipulse.com
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_YOUTUBE_API_KEY=""
ARG NEXT_PUBLIC_YOUTUBE_CHANNEL_ID="UCraDr3i5A3k0j7typ6tOOsQ"
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
ARG NEXT_PUBLIC_ENABLE_USER_GOOGLE_ADS="false"
ARG NEXT_PUBLIC_APP_COMMIT=unknown
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_YOUTUBE_API_KEY=$NEXT_PUBLIC_YOUTUBE_API_KEY
ENV NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=$NEXT_PUBLIC_YOUTUBE_CHANNEL_ID
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_ENABLE_USER_GOOGLE_ADS=$NEXT_PUBLIC_ENABLE_USER_GOOGLE_ADS
ENV NEXT_PUBLIC_APP_COMMIT=$NEXT_PUBLIC_APP_COMMIT
# Stub out .data JSON files so Next.js static evaluation doesn't throw ENOENT
RUN mkdir -p .data \
    && echo "[]" > .data/constitutional_core.json \
    && echo "[]" > .data/unified_knowledge.json \
    && echo "[]" > .data/cms-releases.json \
    && echo "[]" > .data/articles.json

# Build the application
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install FFmpeg for server-side video conversion
RUN apt-get update && apt-get install -y ffmpeg --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Use the built-in 'node' user for security
# Ensure directories have correct ownership
RUN mkdir -p /app/.data/audit /app/.next/cache && \
    chown -R node:node /app

# Copy necessary files with correct ownership
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Seed data and operational scripts
COPY --from=builder --chown=node:node /app/lib/cms-seed-releases.json ./lib/cms-seed-releases.json
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/scripts/seed-admin.js ./scripts/seed-admin.js

# Switch to non-root user
USER node

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ARG APP_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV APP_COMMIT=$APP_COMMIT
ENV BUILD_TIME=$BUILD_TIME

CMD ["node", "server.js"]


