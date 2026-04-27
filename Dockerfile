# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
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
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_YOUTUBE_API_KEY=$NEXT_PUBLIC_YOUTUBE_API_KEY
ENV NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=$NEXT_PUBLIC_YOUTUBE_CHANNEL_ID
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_ENABLE_USER_GOOGLE_ADS=$NEXT_PUBLIC_ENABLE_USER_GOOGLE_ADS

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data and Next.js cache directories with correct ownership
RUN mkdir -p /app/.data /app/.next/cache
RUN chown -R nextjs:nodejs /app/.data /app/.next/cache

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Seed data bundled in image — used by cms-storage-server.ts to populate the
# volume on first run when .data/cms-releases.json doesn't exist yet
COPY --from=builder /app/lib/cms-seed-releases.json ./lib/cms-seed-releases.json
# .data is excluded from .dockerignore and is provided via Docker volume at runtime

# Explicitly copy the FULL compiled server directory from the builder.
# Next.js standalone tracing can omit route.js files that lack file-traced
# imports (e.g. /api/adoptions, /api/admin/users). Copying the builder's
# .next/server/app on top of the standalone output ensures every compiled
# route and manifest is present in the production image.
COPY --from=builder /app/.next/server/app ./.next/server/app
COPY --from=builder /app/.next/server/app-paths-manifest.json ./.next/server/app-paths-manifest.json
COPY --from=builder /app/.next/server/server-reference-manifest.json ./.next/server/server-reference-manifest.json
COPY --from=builder /app/.next/server/server-reference-manifest.js ./.next/server/server-reference-manifest.js

# Operational scripts — not part of the Next.js bundle but needed inside the container.
# package.json is copied explicitly because standalone ships a stripped-down version
# that omits custom npm scripts like seed:admin.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts/seed-admin.js ./scripts/seed-admin.js

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
