import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import * as Sentry from '@sentry/node';
import { Client } from '@axiomhq/axiom-node';
import { env } from '../../utils/env.js';

/**
 * Monitoring Plugin: Centralizes Sentry (Errors) and Axiom (Logs)
 */
const monitoring: FastifyPluginAsync = async (fastify) => {
  // 1. Sentry initialization
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: 1.0,
    });

    fastify.addHook('onError', (request, reply, error) => {
      Sentry.captureException(error);
    });
  }

  // 2. Axiom initialization
  let axiom: Client | undefined;
  if (env.AXIOM_TOKEN && env.AXIOM_DATASET) {
    axiom = new Client({
      token: env.AXIOM_TOKEN,
    });

    fastify.decorate('axiom', axiom);

    fastify.addHook('onResponse', async (request, reply) => {
      if (axiom) {
        try {
          await axiom.ingestEvents(env.AXIOM_DATASET!, [
            {
              method: request.method,
              url: request.url,
              statusCode: reply.statusCode,
              responseTime: reply.elapsedTime,
              wallet: (request.query as { wallet?: string })?.wallet,
            },
          ]);
        } catch (error) {
          fastify.log.error(error, 'Axiom ingestion failed');
        }
      }
    });
  }

  // Helper to log Alpha signals to Axiom
  fastify.decorate('logAlpha', async (data: Record<string, unknown>) => {
    if (axiom && env.AXIOM_DATASET) {
      try {
        await axiom.ingestEvents(env.AXIOM_DATASET, [
          {
            ...data,
            _time: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        fastify.log.error(error, 'Axiom alpha log failed');
      }
    }
  });
};

export const monitoringPlugin = fp(monitoring);
