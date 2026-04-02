import { type FastifyPluginAsync } from 'fastify';
import { TierService } from '../core/tiers/tier.service.js';
import { supabase } from '../infrastructure/supabase/client.js';
import { JupiterService } from '../infrastructure/jupiter/jupiter.service.js';
import { Connection } from '@solana/web3.js';
import { env } from '../utils/env.js';

interface TradeBody {
  walletAddress: string;
  amountUSD: number;
  platform: 'PUMP_FUN' | 'RAYDIUM' | 'METEORA' | 'ORCA';
  signature: string;
  jitoTipSOL?: number; // External Jito tip (in SOL)
  networkFeeSOL?: number; // Solana network fee (in SOL)
  status?: 'success' | 'failed';
  tokenMint?: string; // Mint of the output token (for fee swap)
  feeAmountLamports?: number; // Raw fee collected
}

interface SubscribeBody {
  walletAddress: string;
  tier: 'STARLIGHT' | 'STARLIGHT_PLUS' | 'VIP';
  amountSOL: number;
  paymentSignature: string;
}

/** Fetch live SOL/USD price from Jupiter Price API v4 */
async function getLiveSOLPrice(): Promise<number> {
  try {
    const res = await fetch('https://price.jup.ag/v4/price?ids=SOL');
    if (!res.ok) throw new Error('Price fetch failed');
    const json = (await res.json()) as { data: { SOL: { price: number } } };
    return json.data.SOL.price;
  } catch {
    return 150;
  }
}

/**
 * On-Chain Verification Engine (Blueprint v1.6 Hardening)
 */
async function verifyOnChainPayment(
  signature: string,
  expectedReceiver: string,
  expectedSender: string,
  expectedAmount: number,
  asset: 'SOL' | 'USDC' = 'SOL',
): Promise<boolean> {
  try {
    const connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta || tx.meta.err) return false;

    // 1. Verify Sender (the first account in the transaction is usually the fee payer/sender)
    const sender = tx.transaction.message.accountKeys[0].pubkey.toBase58();
    if (sender !== expectedSender) return false;

    // 2. Verify Receiver & Amount
    if (asset === 'SOL') {
      const lamports = expectedAmount * 1e9;
      // In a simple transfer, we look for instructions targeting the expectedReceiver
      const hasTransfer = tx.transaction.message.instructions.some((ix: any) => {
        if (ix.program === 'system' && ix.parsed?.type === 'transfer') {
          return (
            ix.parsed.info.destination === expectedReceiver &&
            Number(ix.parsed.info.lamports) >= lamports * 0.99 // 1% tolerance for slippage/rounding
          );
        }
        return false;
      });
      return hasTransfer;
    } else {
      // USDC (SPL Token) logic
      const amountUnits = expectedAmount * 1e6; // USDC has 6 decimals
      const hasTokenTransfer = tx.meta.postTokenBalances?.some((balance: any) => {
        return (
          balance.owner === expectedReceiver &&
          balance.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' && // USDC mainnet mint
          Number(balance.uiTokenAmount.amount) >= amountUnits * 0.99
        );
      });
      return !!hasTokenTransfer;
    }
  } catch (error) {
    console.error('[Verification] Error:', error);
    return false;
  }
}

/**
 * FeePlugin: Dynamic Trading Fee Engine
 * Standar: Canonical Master Blueprint v1.6 (Institutional Grade)
 */
export const feePlugin: FastifyPluginAsync = async (fastify) => {
  const tierService = new TierService();
  const jupiterService = new JupiterService();

  fastify.post<{ Body: TradeBody }>('/trade', async (request, reply) => {
    const {
      walletAddress,
      amountUSD,
      platform,
      signature,
      jitoTipSOL = 0,
      networkFeeSOL = 0.000005,
      status = 'success',
      tokenMint,
      feeAmountLamports,
    } = request.body;

    try {
      if (status === 'success' && signature) {
        await verifySignatureStatus(signature);
      }

      const profile = await tierService.getUserProfile(walletAddress);
      await checkPostHogFlags(fastify, walletAddress);

      const feeRate = tierService.getTradingFeePercentage(profile);
      const tradingFeeUSD = amountUSD * feeRate;
      const solPrice = await getLiveSOLPrice();
      const costs = calculateCosts(tradingFeeUSD, jitoTipSOL, networkFeeSOL, solPrice);

      const { newRank, updatedProfile } = await updateProfileAndLogAudit(
        walletAddress,
        amountUSD,
        tradingFeeUSD,
        signature,
        platform,
        status,
        tokenMint,
        feeAmountLamports,
        profile,
        tierService,
        jupiterService,
        fastify,
      );

      if (fastify.logAlpha) {
        void fastify.logAlpha({
          type: 'TRADE_FEE_COLLECTED',
          wallet: walletAddress,
          platform,
          amountUSD,
          feeRate: `${(feeRate * 100).toFixed(2)}%`,
          tradingFeeUSD,
          ...costs,
          rank: updatedProfile.rank,
          status: updatedProfile.status,
          newRank,
          signature,
        });
      }

      fastify.log.info(
        `[FEE] ${walletAddress} | ${(feeRate * 100).toFixed(2)}% of $${amountUSD} = $${tradingFeeUSD.toFixed(4)} | Rank: ${newRank}`,
      );

      return await reply.send({
        status: 'success',
        tradingFeeUSD,
        feeRate: `${(feeRate * 100).toFixed(2)}%`,
        ...costs,
        currentRank: newRank,
        signature,
      });
    } catch (error: any) {
      fastify.log.error(error);
      const statusCode = error.statusCode || 500;
      return await reply
        .status(statusCode)
        .send({ error: error.message || 'Failed to record trade volume' });
    }
  });

  async function updateProfileAndLogAudit(
    walletAddress: string,
    amountUSD: number,
    tradingFeeUSD: number,
    signature: string,
    platform: string,
    status: string,
    tokenMint?: string,
    feeAmountLamports?: number,
    profile?: any,
    tierService?: any,
    jupiterService?: any,
    fastify?: any,
  ) {
    let newRank = profile.rank;
    if (status === 'success') {
      newRank = await tierService.addVolume(walletAddress, amountUSD, tradingFeeUSD);
    }

    const updatedProfile = await tierService.getUserProfile(walletAddress);
    await logTradeAudit(
      updatedProfile,
      signature,
      amountUSD,
      tradingFeeUSD,
      platform,
      status,
      tokenMint,
      feeAmountLamports,
      jupiterService,
      fastify,
    );

    return { newRank, updatedProfile };
  }

  async function verifySignatureStatus(signature: string) {
    const connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
    const tx = await connection.getSignatureStatus(signature);
    if (!tx.value || tx.value.err) {
      const error = new Error('Invalid or failed trade signature') as any;
      error.statusCode = 400;
      throw error;
    }
  }

  async function checkPostHogFlags(fastify: any, walletAddress: string) {
    if (fastify.posthog) {
      const flags = await fastify.posthog.getAllFlags(walletAddress);
      if (flags['jupiter_swap_enabled'] === false) {
        const error = new Error('Jupiter swap is not enabled for your account tier.') as any;
        error.statusCode = 403;
        throw error;
      }
    }
  }

  function calculateCosts(
    tradingFeeUSD: number,
    jitoTipSOL: number,
    networkFeeSOL: number,
    solPrice: number,
  ) {
    const jitoTipUSD = jitoTipSOL * solPrice;
    const networkFeeUSD = networkFeeSOL * solPrice;
    return {
      jitoTipUSD,
      networkFeeUSD,
      totalBundledCostUSD: tradingFeeUSD + jitoTipUSD + networkFeeUSD,
    };
  }

  async function logTradeAudit(
    profile: any,
    signature: string,
    amountUSD: number,
    tradingFeeUSD: number,
    platform: string,
    status: string,
    tokenMint?: string,
    feeAmountLamports?: number,
    jupiterService?: any,
    fastify?: any,
  ) {
    if (!profile.id) return;

    const { error: insertError } = await supabase.from('transactions').insert({
      profile_id: profile.id,
      tx_hash: signature,
      amount_usd: amountUSD,
      fee_collected: status === 'success' ? tradingFeeUSD : 0,
      platform,
      status,
      type: 'trading_fee',
      treasury_asset: 'SOL',
      treasury_status: status === 'success' ? 'pending_conversion' : 'settled',
    } as unknown as never);

    if (insertError) {
      fastify.log.error(insertError);
      console.error(insertError, 'Failed to log transaction audit trail');
    }

    if (status === 'success' && tokenMint && feeAmountLamports) {
      const swapResult = await jupiterService.autoConvertFeeToSOL(tokenMint, feeAmountLamports);
      if (swapResult.status === 'success') {
        await supabase
          .from('transactions')
          .update({ treasury_status: 'settled' } as unknown as never)
          .eq('tx_hash', signature);
      }
    }
  }

  fastify.post<{ Body: SubscribeBody }>('/subscribe', async (request, reply) => {
    const { walletAddress, tier, amountSOL, paymentSignature } = request.body;
    const amountUSDC = amountSOL;

    try {
      // 🏛️ PR 22: Hardened Verification (On-Chain)
      const treasuryAddress = env.USDC_TREASURY_WALLET || env.SOL_TREASURY_WALLET;

      if (!treasuryAddress) {
        throw new Error('Treasury wallet not configured');
      }

      fastify.log.info(
        `[Subscription] Verifying $${amountUSDC} USDC transfer for ${walletAddress} (Tier: ${tier})...`,
      );

      const isValid = await verifyOnChainPayment(
        paymentSignature,
        treasuryAddress,
        walletAddress,
        amountUSDC,
        'USDC',
      );

      if (!isValid && env.NODE_ENV === 'production') {
        return await reply.status(403).send({ error: 'Subscription payment verification failed' });
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_status: tier } as unknown as never)
        .eq('wallet_address', walletAddress);

      if (updateError) throw updateError;

      const profile = await tierService.getUserProfile(walletAddress);

      await supabase.from('transactions').insert({
        profile_id: profile.id,
        tx_hash: paymentSignature,
        amount_usd: amountUSDC,
        fee_collected: amountUSDC,
        type: 'subscription',
        treasury_asset: 'USDC',
        treasury_status: 'settled',
        status: 'success',
      } as unknown as never);

      return await reply.send({ status: 'success', tier });
    } catch (error) {
      fastify.log.error(error);
      return await reply.status(500).send({ error: 'Subscription settlement failed' });
    }
  });

  fastify.get('/user/:wallet/tier', async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    try {
      const profile = await tierService.getUserProfile(wallet);
      const feeRate = tierService.getTradingFeePercentage(profile);
      return await reply.send({ ...profile, feeRate: `${(feeRate * 100).toFixed(2)}%` });
    } catch (error) {
      fastify.log.error(error);
      return await reply.status(500).send({ error: 'Tier fetch failed' });
    }
  });
};
