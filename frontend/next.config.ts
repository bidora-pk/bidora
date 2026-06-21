import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This tells Vercel to ignore TypeScript errors when building
  typescript: {
    ignoreBuildErrors: true,
  },
  // This tells Vercel to ignore ESLint formatting warnings when building
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
