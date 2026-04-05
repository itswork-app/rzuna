import { withAxiom } from 'next-axiom';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  // Refine / Admin specific settings
  transpilePackages: ['@refinedev/nextjs-router', '@refinedev/core', '@rzuna/ui'],
};

const sentryConfig = {
  silent: true,
  org: 'rzuna',
  project: 'rzuna-admin',
};

export default withSentryConfig(withAxiom(nextConfig), sentryConfig);
