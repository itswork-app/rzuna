import { withAxiom } from 'next-axiom';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@solana/wallet-adapter-react', '@solana/wallet-adapter-react-ui'],
  /* config options here */
};

export default withSentryConfig(withAxiom(nextConfig), {
  silent: true,
  org: 'rzuna',
  project: 'rzuna-dashboard',
});
