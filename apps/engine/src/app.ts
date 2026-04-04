import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
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
  await fastify.register(rateLimit, {
    max: async (request: any) => {
      const tier = request.apiKey?.tier || 'FREE';
      if (tier === 'ENTERPRISE') return 10000;
      if (tier === 'PRO') return 1000;
      return 100;
    },
    keyGenerator: (request: any) => {
      return (request.headers['x-api-key'] as string) || request.ip;
    },
    timeWindow: '1 minute',
  });

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

  // Error Handler logic for Zod
  fastify.setErrorHandler(
    (
      error: any,
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) => {
      if (error.validation) {
        console.error('🛡️ Validation Error:', JSON.stringify(error.validation, null, 2));
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Validation failed',
          details: error.validation,
        });
      }
      console.error('🛡️ Server Error:', error);
      return reply.status(error.statusCode || 500).send({
        error: error.name || 'Error',
        message: error.message || 'Internal Server Error',
      });
    },
  );

  return fastify;
};

declare module 'fastify' {
  interface FastifyInstance {
    rankService: RankService;
    scoringService: ScoringService;
    engine: IntelligenceEngine;
  }
}
