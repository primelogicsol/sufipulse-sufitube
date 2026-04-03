/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable faster builds
    optimizePackageImports: ['lucide-react'],
  },
  // Handle static export for Netlify ONLY in production
  // Disabled during development to allow dynamic pages
  output: undefined, // process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
