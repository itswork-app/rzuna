import { EventEmitter } from 'events';
import bs58 from 'bs58';
import Client from '@triton-one/yellowstone-grpc';
import { env } from '../../utils/env.js';

export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  isMintable?: boolean;
}

export interface MintEvent {
  mint: string;
  signature: string;
  timestamp: string;
  metadata?: TokenMetadata;
  initialLiquidity?: number;
  socialScore?: number;
}

/** Minimal structural interface for Yellowstone gRPC client (no official types). */
interface GrpcClient {
  subscribe(): Promise<{
    on(event: string, listener: (data: unknown) => void): void;
    write(req: unknown, cb: (err: Error | null) => void): void;
  }>;
}

/**
 * GeyserService: YellowStone gRPC Stream (Production Only)
 * Standar: Canonical Master Blueprint v1.6 (Dual-Mode: Public + VIP Dedicated)
 *
 * Mode 'public' — uses GEYSER_ENDPOINT + GEYSER_TOKEN (shared infrastructure).
 * Mode 'vip'    — uses VIP_GEYSER_ENDPOINT + VIP_GEYSER_TOKEN (dedicated node for vip.aivo.sh).
 * Falls back to no-op if the relevant credentials are missing.
 */
export class GeyserService extends EventEmitter {
  private client: GrpcClient | null = null;
  private isActive: boolean = false;
  private retryCount: number = 0;
  private static readonly MAX_RETRIES = 5;
  private readonly mode: 'public' | 'vip';

  constructor(mode: 'public' | 'vip' = 'public') {
    super();
    this.mode = mode;

    const endpoint =
      mode === 'vip' ? env.VIP_GEYSER_ENDPOINT : env.GEYSER_ENDPOINT;
    const token =
      mode === 'vip' ? env.VIP_GEYSER_TOKEN : env.GEYSER_TOKEN;

    if (endpoint && token) {
      // @ts-expect-error - Yellowstone gRPC Client types
      this.client = new Client(endpoint, token);
      this.isActive = true;
    } else {
      const label = mode === 'vip' ? 'VIP_GEYSER_ENDPOINT / VIP_GEYSER_TOKEN' : 'GEYSER_ENDPOINT / GEYSER_TOKEN';
      console.warn(
        `[GeyserService:${mode}] ${label} not configured. ` +
          'Running in NO-OP mode — no live signals will be emitted.',
      );
    }
  }

  async start(): Promise<void> {
    this.retryCount = 0;

    if (!this.isActive) {
      console.warn('[GeyserService] No-op mode active. Skipping stream connection.');
      return;
    }

    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    try {
      console.info(`📡 Connecting to Geyser (Attempt ${this.retryCount + 1})...`);
      await this.startRealStream();
      this.retryCount = 0;
      console.info('✅ Geyser stream connected successfully.');
    } catch (error) {
      this.retryCount++;
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
      console.error(`❌ Geyser connection failed. Retrying in ${delay}ms...`, error);

      if (this.retryCount < GeyserService.MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.connectWithRetry();
      } else {
        console.error(
          `[GeyserService] Max retries (${GeyserService.MAX_RETRIES}) reached. ` +
            'Stream is offline. No signals will be emitted until restart.',
        );
        this.isActive = false;
        this.emit('error', new Error('Geyser max retries reached. Stream offline.'));
      }
    }
  }

  private async startRealStream(): Promise<void> {
    if (!this.client) return;

    const stream = await this.client.subscribe();

    stream.on('data', (data: unknown) => {
      const payload = data as {
        transaction?: { transaction?: { signatures: Uint8Array[]; message: { accountKeys: Uint8Array[] } } };
      };
      if (payload?.transaction?.transaction) {
        const tx = payload.transaction.transaction;
        const signature = bs58.encode(tx.signatures[0]);
        const accountKeys = tx.message.accountKeys.map((k: Uint8Array) => bs58.encode(k));
        const PUMP_FUN_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfMX1NczvLA8nd6XMyC';

        if (accountKeys.includes(PUMP_FUN_ID)) {
          const detectedMint = accountKeys.find((k: string) => k !== PUMP_FUN_ID && k.length > 32);

          if (detectedMint) {
            const event: MintEvent = {
              mint: detectedMint,
              signature,
              timestamp: new Date().toISOString(),
              // Real data provided by upstream or left undefined
            };
            this.emit('mint', event);
          }
        }
      }
    });

    const request = {
      transactions: {
        mints: {
          accountInclude: ['6EF8rrecthR5Dkzon8Nwu78hRvfMX1NczvLA8nd6XMyC'],
        },
      },
      commitment: 1,
    };

    await new Promise<void>((resolve, reject) => {
      stream.write(request, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });

    stream.on('error', (err: unknown) => {
      console.error('[GeyserService] Stream error:', err);
      void this.connectWithRetry();
    });
  }
}
