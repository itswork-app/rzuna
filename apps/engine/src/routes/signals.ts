import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  UserRankSchema,
  SubscriptionStatusSchema,
  AlphaSignalSchema,
  type AlphaSignal,
  type UserRank,
} from '@rzuna/contracts';

/**
 * 🏛️ Signals Route: Tiered Alpha Intelligence
 * Standar: Canonical Master Blueprint v22.1 (The Muscles)
 */
export const signalRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/signals',
    {
      schema: {
        querystring: z.object({
          wallet: z.string(),
        }),
        response: {
          200: z.object({
            user: z.object({
              wallet: z.string(),
              tier: UserRankSchema,
              status: SubscriptionStatusSchema,
            }),
            count: z.number(),
            signals: z.array(AlphaSignalSchema),
          }),
        },
      },
    },
    async (request, reply) => {
      const { wallet } = request.query as { wallet: string };

      // Use RankService to get user details including tier/status
      const user = await fastify.rankService.getUser(wallet);

      // Get tiered signals from the engine
      const signals: AlphaSignal[] = fastify.engine.getTieredSignals(
        user.tier as UserRank,
        false, // isStarlight calculation logic would go here
        false, // isVIP calculation logic would go here
        { aiQuotaLimit: 10, aiQuotaUsed: 0 }, // Mock profile for now
      );

      return {
        user: {
          wallet: user.walletAddress,
          tier: user.tier,
          status: 'NONE', // Placeholder: logic to determine status from subscriptions table
        },
        count: signals.length,
        signals,
      };
    },
  );
};
