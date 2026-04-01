import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { type Axiom } from '@axiomhq/js';
import { monitoringPlugin } from './infrastructure/monitoring/monitoring.plugin.js';
import { IntelligenceEngine } from './core/engine.js';
import { feePlugin } from './plugins/fee.plugin.js';
import { TierService } from './core/tiers/tier.service.js';
import { env } from './utils/env.js';
import { SubscriptionStatus } from './core/types/user.js';
import { JupiterService } from './infrastructure/jupiter/jupiter.service.js';

/**
 * Fastify Application Factory: Blueprint v1.5 Refactored
 * Standar: institutional-grade High-Performance
 */
export const buildApp = async () => {
  const fastify: FastifyInstance = Fastify({
    logger: env.NODE_ENV === 'development',
  });

  // ================================================================
  // CORS: Institutional Origin Whitelist (Blueprint v1.6)
  // Production: *.aivo.sh only. Dev: all origins allowed.
  // Override with ALLOWED_ORIGINS="https://aivo.sh,https://trade.aivo.sh"
  // ================================================================
  const AIVO_ORIGIN_PATTERN = /^https:\/\/([\w-]+\.)?aivo\.sh$/;

  const getAllowedOrigins = (): (string | RegExp)[] => {
    if (env.ALLOWED_ORIGINS) {
      return env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    }
    if (env.NODE_ENV === 'production') {
      return [AIVO_ORIGIN_PATTERN];
    }
    return ['http://localhost:3000', 'http://localhost:3001'];
  };

  await fastify.register(cors, {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  });
  await fastify.register(helmet);
  await fastify.register(monitoringPlugin);

  // Feature Plugins
  await fastify.register(feePlugin);

  // Initialize Services (Domain & Infrastructure)
  const tierService = new TierService();
  const jupiterService = new JupiterService();
  const engine = new IntelligenceEngine({
    logAudit: (data) => {
      void (async () => {
        if (fastify.logAlpha) {
          await fastify.logAlpha(data);
        }
      })();
    },
  });

  await engine.start();

  fastify.decorate('engine', engine);
  fastify.decorate('jupiter', jupiterService);

  // Health check for Checkly/Guardian
  fastify.get('/health', async (_request, reply) => {
    return await reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    });
  });

  /**
   * Probability Engine Dashboard Integration
   * Standar: Canonical Master Blueprint v1.3 (Tier-based Filtering)
   */
  fastify.get('/signals', async (request, reply) => {
    const { wallet } = request.query as { wallet: string };

    if (!wallet) {
      return await reply.status(400).send({ error: 'Wallet address required' });
    }

    const profile = await tierService.getUserProfile(wallet);

    // Check Subscription status for gatekeeping
    const isStarlight =
      profile.status === SubscriptionStatus.STARLIGHT ||
      profile.status === SubscriptionStatus.STARLIGHT_PLUS;
    const isVIP = profile.status === SubscriptionStatus.VIP;

    const signals = engine.getTieredSignals(profile.rank, isStarlight, isVIP, profile);

    return await reply.send({
      user: {
        wallet: profile.walletAddress,
        rank: profile.rank,
        status: profile.status,
        monthlyVolume: profile.volume.currentMonthVolume,
      },
      count: signals.length,
      signals,
    });
  });

  /**
   * Execution Engine: Live Swap via Jito
   * Standar: Canonical Master Blueprint v1.5
   */
  fastify.post('/trade/swap', async (request, reply) => {
    try {
      const { route, userPublicKey } = request.body as { route: any; userPublicKey: string };

      if (!route || !userPublicKey) {
        return await reply.status(400).send({ error: 'Missing route or wallet context' });
      }

      console.info(
        `[EXECUTION] [${env.EXECUTION_MODE.toUpperCase()}] Initiating swap for ${userPublicKey} | Route: ${route.inMint} -> ${route.outMint}`,
      );

      const result = await jupiterService.executeSwap(route);

      return await reply.send({ mode: env.EXECUTION_MODE, result });
    } catch (err: any) {
      console.error('[EXECUTION_ERROR]', err);
      return await reply.status(500).send({ error: err.message || 'Execution failed' });
    }
  });

  return fastify;
};

declare module 'fastify' {
  interface FastifyInstance {
    axiom?: Axiom;
    posthog?: import('posthog-node').PostHog;
    logAlpha?(data: Record<string, unknown>): Promise<void>;
    engine: IntelligenceEngine;
    jupiter: JupiterService;
  }
}
