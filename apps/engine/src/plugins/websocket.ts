import { type FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import fp from 'fastify-plugin';

/**
 * ⚡ RZUNA WebSocket Singularity (v22.3)
 * High-performance signal streaming for real-time Alpha delivery.
 */
export const websocketPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(websocket);

  fastify.get('/ws/signals', { websocket: true }, (socket, req) => {
    console.info('🛡️ [WS] Institutional Client Connected');

    // Subscribe to Engine signal events
    const onNewSignal = (signal: any) => {
      socket.send(JSON.stringify({ type: 'SIGNAL_UPDATE', data: signal }));
    };

    fastify.engine.on('signal', onNewSignal);

    socket.on('close', () => {
      console.info('🛡️ [WS] Client Disconnected');
      fastify.engine.off('signal', onNewSignal);
    });
  });
});
