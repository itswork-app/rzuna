import {
  Connection,
  Keypair,
  VersionedTransaction,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { env } from '../../utils/env.js';

export interface SwapRoute {
  inMint: string;
  outMint: string;
  inAmount: number;
  outAmount: number;
  priceImpactPct: number;
  routePlan: string[];
  platformFeeBps?: number;
  swapTransaction?: string;
}

export interface SwapResult {
  signature: string;
  inAmount: number;
  outAmount: number;
  fee: number;
  jitoBundle?: boolean;
  status: 'success' | 'failed';
}

/**
 * 🏛️ JupiterAdapter: Jupiter V6 + Jito Dynamic Tipping
 * Standar: Canonical Master Blueprint v22.1 (Adapter Pattern)
 */
export class JupiterAdapter {
  private connection: Connection;
  private jitoValidator: string;

  constructor() {
    this.connection = new Connection(env.SOLANA_RPC_URL, {
      commitment: 'confirmed',
      wsEndpoint: env.SOLANA_WSS_URL,
    });
    this.jitoValidator = env.JITO_BLOCK_ENGINE_URL || 'https://mainnet.block-engine.jito.wtf';
  }

  async getBestRoute(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    platformFeeBps: number;
    userPublicKey: string;
  }): Promise<SwapRoute> {
    const quoteParams = new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount.toString(),
      slippageBps: '50',
      platformFeeBps: params.platformFeeBps.toString(),
    });

    const quoteRes = await fetch(`https://quote-api.jup.ag/v6/quote?${quoteParams}`);
    if (!quoteRes.ok) throw new Error('Jupiter quote failed');
    const quoteData = await quoteRes.json();

    const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: params.userPublicKey,
        wrapAndUnwrapSol: true,
      }),
    });
    if (!swapRes.ok) throw new Error('Jupiter swap assembly failed');
    const { swapTransaction } = await swapRes.json();

    return {
      inMint: params.inputMint,
      outMint: params.outputMint,
      inAmount: Number(quoteData.inAmount),
      outAmount: Number(quoteData.outAmount),
      priceImpactPct: quoteData.priceImpactPct,
      routePlan: quoteData.routePlan.map((r: any) => r.swapInfo.label),
      platformFeeBps: params.platformFeeBps,
      swapTransaction,
    };
  }

  async executeSwap(route: SwapRoute): Promise<SwapResult> {
    if (!env.WALLET_PRIVATE_KEY) throw new Error('WALLET_PRIVATE_KEY missing');
    if (!route.swapTransaction) throw new Error('Swap transaction missing');

    const keypair = Keypair.fromSecretKey(bs58.decode(env.WALLET_PRIVATE_KEY));
    const transaction = VersionedTransaction.deserialize(Buffer.from(route.swapTransaction, 'base64'));
    transaction.sign([keypair]);

    // ⚡ Jito Dynamic Tipping (PR 8: getRecentJitoTip integration)
    const tipSOL = await this.getRecentJitoTip();
    const tipLamports = Math.floor(tipSOL * 1e9);

    const tipInstruction = SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(env.JITO_TIP_PAYMENT_ADDRESS || 'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY'),
      lamports: tipLamports,
    });

    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    const tipTx = new Transaction().add(tipInstruction);
    tipTx.recentBlockhash = blockhash;
    tipTx.feePayer = keypair.publicKey;
    tipTx.sign(keypair);

    try {
      const result = await this.submitBundle([bs58.encode(transaction.serialize()), bs58.encode(tipTx.serialize())]);
      return {
        signature: result,
        inAmount: route.inAmount,
        outAmount: route.outAmount,
        fee: Math.floor(route.inAmount * ((route.platformFeeBps ?? 0) / 10000)),
        jitoBundle: true,
        status: 'success',
      };
    } catch (err) {
      console.warn('Jito bundle failed, falling back to standard RPC', err);
      const signature = await this.connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true });
      return {
        signature,
        inAmount: route.inAmount,
        outAmount: route.outAmount,
        fee: 0,
        jitoBundle: false,
        status: 'success',
      };
    }
  }

  private async getRecentJitoTip(): Promise<number> {
    try {
      const res = await fetch(`${this.jitoValidator}/api/v1/bundles/tip_floor`);
      if (!res.ok) return 0.00001;
      const data = await res.json();
      return data[0]?.ema_landed_tips_50th_percentile || 0.00001;
    } catch {
      return 0.00001;
    }
  }

  private async submitBundle(transactions: string[]): Promise<string> {
    const res = await fetch(`${this.jitoValidator}/api/v1/bundles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [transactions],
      }),
    });

    if (!res.ok) throw new Error('Jito bundle failed');
    const { result } = await res.json();
    return result;
  }
}
