/** @type {import('next').NextConfig} */
import { withSentryConfig } from "@sentry/nextjs";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  typescript: {
    // Type errors are caught by the separate CI type-check step (npx tsc --noEmit).
    // Ignoring here prevents Docker build failures from type issues unrelated to runtime.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Keep bcryptjs as a real node_modules entry in the standalone output instead of
  // bundling it into webpack chunks. This makes it available to scripts that run
  // outside of webpack (e.g. npm run seed:admin inside the container).
  serverExternalPackages: ['bcryptjs', 'busboy'],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // 'standalone' creates a minimal self-contained server — ideal for Docker.
  // Run with: node .next/standalone/server.js (NOT npm start)
  output: "standalone",
  // Fix workspace root detection when multiple package-lock.json files exist
  outputFileTracingRoot: __dirname,
  trailingSlash: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i3.ytimg.com' },
      { protocol: 'https', hostname: 'i9.ytimg.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com https://js.stripe.com https://www.googletagmanager.com https://apis.google.com https://accounts.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://i.ytimg.com https://i3.ytimg.com https://i9.ytimg.com https://img.youtube.com https://lh3.googleusercontent.com https://www.gstatic.com",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://js.stripe.com https://accounts.google.com",
              "connect-src 'self' https://api.stripe.com https://www.googleapis.com https://googleads.googleapis.com https://youtube.googleapis.com https://oauth2.googleapis.com https://accounts.google.com",
              "media-src 'self' https://www.youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  // Only print debug output during development
  debug: process.env.NODE_ENV !== "production",

  // Automatically create releases and upload source maps
  org: process.env.SENTRY_ORG || "your-org-slug",
  project: process.env.SENTRY_PROJECT || "your-project-slug",

  // Upload source maps — essential for production debugging
  sourcemaps: {
    disable: process.env.SENTRY_DISABLE_AUTO_UPLOAD === 'true',
    deleteAfterUpload: true,
  },

  // Hide debug logs in production
  silent: process.env.NODE_ENV === "production",

  // Disable telemetry to Sentry's own servers about SDK usage
  telemetry: false,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
