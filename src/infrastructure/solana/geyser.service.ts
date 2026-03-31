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

/**
 * GeyserService: YellowStone gRPC Stream (Production Only)
 * Standar: Canonical Master Blueprint v1.5 (Institutional Uptime)
 *
 * No mock fallback — requires real GEYSER_ENDPOINT & GEYSER_TOKEN.
 * If credentials are missing, the service runs in no-op mode (no signals emitted).
 */
export class GeyserService extends EventEmitter {
  private client: any = null;
  private isActive: boolean = false;
  private retryCount: number = 0;
  private static readonly MAX_RETRIES = 5;

  constructor() {
    super();

    if (env.GEYSER_ENDPOINT && env.GEYSER_TOKEN) {
      // @ts-ignore
      this.client = new Client(env.GEYSER_ENDPOINT, env.GEYSER_TOKEN);
      this.isActive = true;
    } else {
      console.warn(
        '[GeyserService] GEYSER_ENDPOINT / GEYSER_TOKEN not configured. ' +
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

    stream.on('data', (data: any) => {
      if (data?.transaction?.transaction) {
        const tx = data.transaction.transaction;
        const signature = bs58.encode(tx.signatures[0]);
        const accountKeys = tx.message.accountKeys.map((k: any) => bs58.encode(k));
        const PUMP_FUN_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfMX1NczvLA8nd6XMyC';

        if (accountKeys.includes(PUMP_FUN_ID)) {
          const detectedMint = accountKeys.find(
            (k: string) => k !== PUMP_FUN_ID && k.length > 32,
          );

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

    stream.on('error', (err: any) => {
      console.error('[GeyserService] Stream error:', err);
      void this.connectWithRetry();
    });
  }
}
