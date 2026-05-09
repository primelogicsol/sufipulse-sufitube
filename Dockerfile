# Multi-stage build for production
FROM node:20-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Ensure devDependencies are installed for the build step
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars — disable all env/secret validation during image build
ENV CI=true
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV SENTRY_DISABLE_AUTO_UPLOAD=true

# Accept NEXT_PUBLIC vars at build time (baked into client bundle)
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_YOUTUBE_API_KEY=""
ARG NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=""
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

# Build the application
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install FFmpeg for server-side video conversion (H.265→H.264 for OCR)
RUN apk add --no-cache ffmpeg

# Create non-root user (using standard Alpine flags)
RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nextjs

# Create data and Next.js cache directories with correct ownership
RUN mkdir -p /app/.data/audit /app/.next/cache && \
    chown -R nextjs:nodejs /app/.data /app/.next/cache

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Seed data bundled in image
COPY --from=builder /app/lib/cms-seed-releases.json ./lib/cms-seed-releases.json

# Explicitly copy the FULL compiled server directory from the builder.
COPY --from=builder /app/.next/server/app ./.next/server/app
COPY --from=builder /app/.next/server/app-paths-manifest.json ./.next/server/app-paths-manifest.json
COPY --from=builder /app/.next/server/server-reference-manifest.json ./.next/server/server-reference-manifest.json
COPY --from=builder /app/.next/server/server-reference-manifest.js ./.next/server/server-reference-manifest.js

# Operational scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts/seed-admin.js ./scripts/seed-admin.js

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ARG APP_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV APP_COMMIT=$APP_COMMIT
ENV BUILD_TIME=$BUILD_TIME

CMD ["node", "server.js"]

