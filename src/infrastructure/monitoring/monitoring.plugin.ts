import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import * as Sentry from '@sentry/node';
import { Axiom } from '@axiomhq/js';
import { PostHog } from 'posthog-node';
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

    fastify.addHook('onError', async (request, reply, error) => {
      Sentry.captureException(error);
    });
  }

  // 2. Axiom initialization
  let axiom: Axiom | undefined;
  if (env.AXIOM_TOKEN && env.AXIOM_DATASET) {
    axiom = new Axiom({
      token: env.AXIOM_TOKEN,
    });

    fastify.decorate('axiom', axiom);

    fastify.addHook('onResponse', async (request, reply) => {
      if (axiom) {
        try {
          axiom.ingest(env.AXIOM_DATASET!, [
            {
              method: request.method,
              url: request.url,
              statusCode: reply.statusCode,
              responseTime: reply.elapsedTime,
              wallet: (request.query as { wallet?: string })?.wallet,
            },
          ]);
          await axiom.flush();
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
        axiom.ingest(env.AXIOM_DATASET, [
          {
            ...data,
            _time: new Date().toISOString(),
          },
        ]);
        await axiom.flush();
      } catch (error) {
        fastify.log.error(error, 'Axiom alpha log failed');
      }
    }
  });

  // 3. PostHog initialization
  let posthog: PostHog | undefined;
  if (env.POSTHOG_API_KEY) {
    posthog = new PostHog(env.POSTHOG_API_KEY, { host: env.POSTHOG_HOST });
    fastify.decorate('posthog', posthog);

    fastify.addHook('onClose', async () => {
      await posthog?.shutdown();
    });
  }
};

export const monitoringPlugin = fp(monitoring);
