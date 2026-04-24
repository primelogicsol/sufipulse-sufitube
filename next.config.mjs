/** @type {import('next').NextConfig} */
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // 'standalone' creates a minimal self-contained server — ideal for Docker.
  // Removes the need to copy all node_modules into the container.
  output: "standalone",
  trailingSlash: false,
  images: {
    unoptimized: true,
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
    disable: false,
    // Delete source maps after upload (they are not needed at runtime with standalone output)
    deleteAfterUpload: true,
  },

  // Hide debug logs in production
  silent: process.env.NODE_ENV === "production",

  // Disable telemetry to Sentry's own servers about SDK usage
  telemetry: false,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
