import { FastifyPluginAsync } from 'fastify';
import { TierService } from '../core/tiers/tier.service.js';
import { supabase } from '../infrastructure/supabase/client.js';

interface TradeBody {
  walletAddress: string;
  amountUSD: number;
  platform: 'PUMP_FUN' | 'RAYDIUM' | 'ORCA';
  signature: string;
}

/**
 * FeePlugin: Captures trading volume and audits transactions in Supabase.
 * Standar: Schema v1.3 (profiles & transactions)
 */
export const feePlugin: FastifyPluginAsync = (fastify) => {
  const tierService = new TierService();

  fastify.post<{ Body: TradeBody }>('/trade', async (request, reply) => {
    const { walletAddress, amountUSD, platform, signature } = request.body;

    // Simulation: 1% Fee Collection (The Gas)
    const fee = amountUSD * 0.01;

    try {
      // 1. Update Profile Volume and Rank (Calculated in TierService)
      const newRank = await tierService.addVolume(walletAddress, amountUSD);

      // 2. Fetch profile ID for transaction link
      const profile = await tierService.getUserProfile(walletAddress);

      // 3. Audit Trail: Insert to transactions table (Asyncly)
      if (profile.id) {
        void (async () => {
          const { error: insertError } = await supabase.from('transactions').insert({
            profile_id: profile.id,
            tx_hash: signature,
            amount_usd: amountUSD,
            fee_collected: fee,
            platform,
            status: 'success',
          } as unknown as never);
          if (insertError) fastify.log.error(insertError, 'Failed to log transaction audit trail');
        })();
      }

      fastify.log.info(
        `[FEE-COLLECTED] User ${walletAddress} traded ${amountUSD} USD. Fee: ${fee} USD.`,
      );

      return await reply.send({
        status: 'success',
        feeCollected: fee,
        currentRank: newRank,
        signature,
      });
    } catch (error) {
      fastify.log.error(error);
      return await reply.status(500).send({ error: 'Failed to record trade volume' });
    }
  });

  fastify.get('/user/:wallet/tier', async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    const profile = await tierService.getUserProfile(wallet);
    return await reply.send(profile);
  });

  return Promise.resolve();
};
