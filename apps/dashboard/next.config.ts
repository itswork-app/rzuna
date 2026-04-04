import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  optimizeFonts: false,
  eslint: {
    ignoreDuringBuilds: true, // Stage 1 already handles this in guardian.sh
  },
};

export default nextConfig;
