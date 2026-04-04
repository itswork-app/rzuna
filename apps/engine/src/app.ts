import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './utils/env.js';
import { RankService } from './core/services/rank.service.js';
import { ScoringService } from './core/services/scoring.service.js';
import { IntelligenceEngine } from './core/engine.js';
import { sdkRoutes } from './routes/sdk.js';
import { signalRoutes } from './routes/signals.js';
import { feePlugin } from './plugins/fee.plugin.js';

/**
 * 🏛️ Fastify Application Factory: V22.1 Singularity
 * Standar: Institutional-Grade with Zod Enforcement
 */
export const buildApp = async () => {
  const fastify = Fastify({
    logger: env.NODE_ENV === 'development',
  }).withTypeProvider<ZodTypeProvider>();

  // Zod Compilers
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(websocket);
  await fastify.register(cors, { origin: true, credentials: true });
  await fastify.register(helmet);
  await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // Services
  const rankService = new RankService();
  const scoringService = new ScoringService();
  const engine = new IntelligenceEngine();
  
  fastify.decorate('rankService', rankService);
  fastify.decorate('scoringService', scoringService);
  fastify.decorate('engine', engine);

  // Health Check
  fastify.get('/health', async () => ({
    status: 'ok',
    version: '22.1.0',
    timestamp: new Date().toISOString(),
  }));

  // Routes registration
  await fastify.register(feePlugin);
  await fastify.register(sdkRoutes);
  await fastify.register(signalRoutes);

  // Initialize engine
  void engine.start();

  return fastify;
};

declare module 'fastify' {
  interface FastifyInstance {
    rankService: RankService;
    scoringService: ScoringService;
    engine: IntelligenceEngine;
  }
}
