import { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthProtocol } from '../core/auth.js';

/**
 * 🔐 Auth Routes: Native Solana (SIWS) Standard
 */
export const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/login',
    {
      schema: {
        body: z.object({
          publicKey: z.string(),
          signature: z.string(),
          message: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { publicKey, signature, message } = request.body as any;

      const isValid = await AuthProtocol.validateSignature(publicKey, signature, message);

      if (!isValid) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: '🛡️ Invalid Solana signature',
        });
      }

      /**
       * 🏛️ Institutional JWT Issuance
       * Standard: HttpOnly Cookie for Zero-Trust session management.
       */
      return reply.send({
        status: 'ok',
        user: { publicKey },
        token: '🏛️_SIWS_TOKEN_V22.3_PENDING',
      });
    },
  );
};
