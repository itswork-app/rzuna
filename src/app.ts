import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { type Axiom } from '@axiomhq/js';
import { monitoringPlugin } from './infrastructure/monitoring/monitoring.plugin.js';
import { IntelligenceEngine } from './core/engine.js';
import { feePlugin } from './plugins/fee.plugin.js';
import { TierService } from './core/tiers/tier.service.js';
import websocket from '@fastify/websocket';
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

  // Register modern WebSocket plugin
  await fastify.register(websocket);

  // ================================================================
  // CORS: Institutional Origin Whitelist (Blueprint v1.6)
  // Production: *.aivo.sh only. Dev: all origins allowed.
  // Override with ALLOWED_ORIGINS="https://aivo.sh,https://trade.aivo.sh"
  // ================================================================
  // eslint-disable-next-line security/detect-unsafe-regex
  const AIVO_ORIGIN_PATTERN = /^https:\/\/(?:[a-zA-Z0-9-]+\.)?aivo\.sh$/;

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
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
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

  // VIP Infrastructure Activation: Blueprint v1.6
  fastify.addHook('onRequest', async (request) => {
    if (request.headers['x-rzuna-vip-mode'] === 'true') {
      await engine.ensureVipGeyser();
    }
  });

  // WebSocket Route: Real-time Alpha Signals
  fastify.get('/ws/signals', { websocket: true }, (connection, req) => {
    const isVip = req.headers['x-rzuna-vip-mode'] === 'true';
    console.info(`[WS] Client connected. VIP Mode: ${isVip} | Host: ${req.headers.host}`);

    const onSignal = (signal: any) => {
      connection.send(JSON.stringify({ type: 'ALPHA_SIGNAL', payload: signal }));
    };

    engine.on('signal', onSignal);

    connection.on('close', () => {
      engine.off('signal', onSignal);
    });
  });

  // Health check for Checkly/Guardian
  fastify.get('/health', async (_request, reply) => {
    return await reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    });
  });

  /**
   * 🏛️ PR 22: Prometheus Metrics Endpoint
   */
  fastify.get('/metrics', async (_request, reply) => {
    const { metricsRegistry } = await import('./core/engine.js');
    reply.header('Content-Type', metricsRegistry.contentType);
    return await reply.send(await metricsRegistry.metrics());
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
  fastify.post(
    '/trade/swap',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
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
    },
  );

  /**
   * Telegram Dispatcher: Test Connection (PR 12)
   */
  fastify.post('/telegram/test', async (request, reply) => {
    try {
      const { chatId } = request.body as { chatId?: string };
      if (!chatId) {
        return await reply.status(400).send({ error: 'chatId is required' });
      }

      const { TelegramService } = await import('./infrastructure/telegram/telegram.service.js');
      const tg = new TelegramService();
      await tg.sendTestPing(chatId);

      return await reply.send({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return await reply.status(500).send({ error: message });
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
