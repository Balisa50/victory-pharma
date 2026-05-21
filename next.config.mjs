/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  eslint: {
    // Lint warnings shouldn't block prod deploys; run lint in CI separately.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
    // Tree-shake barrel imports so only used icons/chart parts ship.
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
