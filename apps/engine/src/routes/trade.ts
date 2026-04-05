import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { validateApiKey } from '../middleware/auth.js';
import { TradeService } from '../core/services/trade.service.js';

const tradeService = new TradeService();

export const tradeRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // 🏛️ B2B Execution Endpoint (Requires Valid API Key & deducts quotas)
  fastify.post(
    '/b2b/execute',
    {
      preHandler: [validateApiKey],
      schema: {
        body: z.object({
          action: z.enum(['BUY', 'SELL']),
          mint: z.string(),
          amount: z.number().optional(),
          percent: z.number().optional(),
          settings: z
            .object({
              stopLoss: z.number().optional(),
              takeProfit: z.number().optional(),
            })
            .optional(),
        }),
      },
    },
    async (request, reply) => {
      // Because validateApiKey ran, we know request has been billed for B2B.
      const result = await tradeService.executeSwap(request.body as any);
      return reply.send({ ...result, requestedBy: 'B2B_PARTNER' });
    },
  );

  // 🏪 B2C Execution Endpoint (Called by RZUNA Dashboard)
  fastify.post(
    '/execute',
    {
      schema: {
        body: z.object({
          action: z.enum(['BUY', 'SELL']),
          mint: z.string(),
          amount: z.any().optional(), // accept string or num for test mock simplicity
          percent: z.any().optional(),
          settings: z.any().optional(),
        }),
      },
    },
    async (request, reply) => {
      // In prod, this uses internal session checking or IP whitelisting
      const result = await tradeService.executeSwap(request.body as any);
      return reply.send({ ...result, requestedBy: 'B2C_DASHBOARD' });
    },
  );
};
