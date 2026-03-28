import fp from 'fastify-plugin';
import * as Sentry from '@sentry/node';
import { Client } from '@axiomhq/axiom-node';
import type { FastifyPluginAsync } from 'fastify';

export const monitoringPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // Sentry Initialization
  const SENTRY_DSN = process.env.SENTRY_DSN;
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
    });

    fastify.addHook('onError', (request, reply, error, done) => {
      Sentry.withScope((scope) => {
        scope.setTag('path', request.url);
        Sentry.captureException(error);
      });
      done();
    });
  } else {
    fastify.log.warn('SENTRY_DSN not provided. Sentry integration disabled.');
  }

  // Axiom Initialization
  const AXIOM_TOKEN = process.env.AXIOM_TOKEN;
  const AXIOM_DATASET = process.env.AXIOM_DATASET;
  if (AXIOM_TOKEN && AXIOM_DATASET) {
    const axiom = new Client({
      token: AXIOM_TOKEN,
    });

    fastify.addHook('onResponse', (request, reply, done) => {
      void axiom
        .ingestEvents(AXIOM_DATASET, {
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
          responseTime: reply.elapsedTime,
          timestamp: new Date().toISOString(),
        })
        .catch((err: Error) => {
          fastify.log.error(err, 'Axiom ingestion failed');
        });
      done();
    });
  } else {
    fastify.log.warn('AXIOM_TOKEN or AXIOM_DATASET not provided. Axiom integration disabled.');
  }

  return await Promise.resolve();
});
