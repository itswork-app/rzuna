import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { monitoringPlugin } from './plugins/monitoring.js';

export const buildApp = async () => {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors);
  await fastify.register(helmet);
  await fastify.register(monitoringPlugin);

  fastify.get('/health', () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return fastify;
};
