import { withAxiom } from 'next-axiom';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Sentry options for Next.js
  // https://github.com/getsentry/sentry-javascript/blob/develop/packages/nextjs/src/config/types.ts
};

const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-javascript/blob/develop/packages/nextjs/src/config/types.ts

  // Suppresses source map uploading logs during bundling
  silent: true,
  org: 'rzuna',
  project: 'rzuna-web',
};

// Handle withSentryConfig wrapping withAxiom
export default withSentryConfig(withAxiom(nextConfig), sentryConfig);
