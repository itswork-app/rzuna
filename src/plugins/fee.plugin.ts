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
async function verifySOLPayment(
  tx: any,
  expectedReceiver: string,
  expectedAmount: number,
): Promise<boolean> {
  const receiverIndex = tx.transaction.message.accountKeys.findIndex(
    (acc: any) => acc.pubkey.toBase58() === expectedReceiver,
  );

  if (receiverIndex === -1) return false;

  const preBalance = tx.meta.preBalances[receiverIndex];
  const postBalance = tx.meta.postBalances[receiverIndex];
  const deltaSOL = (postBalance - preBalance) / 1e9;

  return deltaSOL >= expectedAmount * 0.99;
}

async function verifyUSDCPayment(
  tx: any,
  expectedReceiver: string,
  expectedAmount: number,
): Promise<boolean> {
  const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

  const findBalance = (balances: any[]) => {
    const found = balances?.find((b) => b.owner === expectedReceiver && b.mint === usdcMint);
    return found ? Number(found.uiTokenAmount.amount) : 0;
  };

  const preAmount = findBalance(tx.meta.preTokenBalances || []);
  const postAmount = findBalance(tx.meta.postTokenBalances || []);
  const deltaUSDC = (postAmount - preAmount) / 1e6; // USDC has 6 decimals

  return deltaUSDC >= expectedAmount * 0.99;
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

    // 2. Verify Receiver & Amount (Delta-Based - Blueprint v1.6 Hardening)
    if (asset === 'SOL') {
      return await verifySOLPayment(tx, expectedReceiver, expectedAmount);
    } else {
      return await verifyUSDCPayment(tx, expectedReceiver, expectedAmount);
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
    const body = request.body;
    const { walletAddress, amountUSD, platform, signature, status = 'success' } = body;

    try {
      // 🏛️ PR 22: Hardened Trade Verification
      await handleTradeVerification(status, signature, reply);

      const profile = await tierService.getUserProfile(walletAddress);
      await checkJupiterEnabled(walletAddress, fastify, reply);

      const feeRate = tierService.getTradingFeePercentage(profile);
      const solPrice = await getLiveSOLPrice();

      const tradingFeeUSD = amountUSD * feeRate;
      const jitoTipUSD = (body.jitoTipSOL || 0) * solPrice;
      const networkFeeUSD = (body.networkFeeSOL || 0.000005) * solPrice;
      const totalBundledCostUSD = tradingFeeUSD + jitoTipUSD + networkFeeUSD;

      let newRank = profile.rank;
      if (status === 'success') {
        newRank = await tierService.addVolume(walletAddress, amountUSD, tradingFeeUSD);
      }

      const updatedProfile = await tierService.getUserProfile(walletAddress);
      await logTransactionAuditTrail(updatedProfile, body, tradingFeeUSD, jupiterService, fastify);

      if (fastify.logAlpha) {
        await fastify.logAlpha({
          type: 'TRADE_FEE_COLLECTED',
          wallet: walletAddress,
          platform,
          amountUSD,
          feeRate: `${(feeRate * 100).toFixed(2)}%`,
          tradingFeeUSD,
          jitoTipUSD,
          networkFeeUSD,
          totalBundledCostUSD,
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
        jitoTipUSD,
        networkFeeUSD,
        totalBundledCostUSD,
        currentRank: newRank,
        signature,
      });
    } catch (error) {
      console.error('[FEE_PLUGIN_ERROR]', error);
      fastify.log.error(error);
      return await reply.status(500).send({ error: 'Failed to record trade volume' });
    }
  });

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

      // 1. Replay Attack Protection (Anti-Double Spend)
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('tx_hash', paymentSignature)
        .maybeSingle();

      if (existingTx) {
        return await reply.status(403).send({ error: 'Transaction signature already used' });
      }

      // 2. On-Chain Verification (Delta-Based)
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

      const profile = await tierService.getUserProfile(walletAddress);

      // 3. Database Transaction Safety (Insert Transaction Audit Trail FIRST)
      const { error: txError } = await supabase.from('transactions').insert({
        profile_id: profile.id,
        tx_hash: paymentSignature,
        amount_usd: amountUSDC,
        fee_collected: amountUSDC,
        type: 'subscription',
        treasury_asset: 'USDC',
        treasury_status: 'settled',
        status: 'success',
      } as unknown as never);

      if (txError) throw txError;

      // 4. Update Profile Status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_status: tier } as unknown as never)
        .eq('wallet_address', walletAddress);

      if (updateError) throw updateError;

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

async function handleTradeVerification(status: string, signature: string, reply: any) {
  if (status === 'success' && signature) {
    const connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
    const tx = await connection.getSignatureStatus(signature);
    if (!tx.value || tx.value.err) {
      return await reply.status(400).send({ error: 'Invalid or failed trade signature' });
    }
  }
}

async function checkJupiterEnabled(walletAddress: string, fastify: any, reply: any) {
  if (fastify.posthog) {
    const flags = await fastify.posthog.getAllFlags(walletAddress);
    if (flags['jupiter_swap_enabled'] === false) {
      return await reply.status(403).send({
        error: 'Jupiter swap is not enabled for your account tier.',
      });
    }
  }
}

async function logTransactionAuditTrail(
  profile: any,
  body: TradeBody,
  tradingFeeUSD: number,
  jupiterService: JupiterService,
  fastify: any,
) {
  if (!profile.id) return;
  const { signature, amountUSD, platform, status, tokenMint, feeAmountLamports } = body;

  try {
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

    if (insertError) fastify.log.error(insertError, 'Failed to log transaction audit trail');

    if (status === 'success' && tokenMint && feeAmountLamports) {
      const swapResult = await jupiterService.autoConvertFeeToSOL(tokenMint, feeAmountLamports);
      if (swapResult.status === 'success') {
        await supabase
          .from('transactions')
          .update({ treasury_status: 'settled' } as unknown as never)
          .eq('tx_hash', signature);
      }
    }
  } catch (trailError) {
    fastify.log.error(trailError, 'Background audit trail failed');
  }
}
