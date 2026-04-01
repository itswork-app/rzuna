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
    end(): void;
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

    const endpoint = mode === 'vip' ? env.VIP_GEYSER_ENDPOINT : env.GEYSER_ENDPOINT;
    const token = mode === 'vip' ? env.VIP_GEYSER_TOKEN : env.GEYSER_TOKEN;

    if (endpoint && token) {
      // @ts-expect-error - Yellowstone gRPC Client types
      this.client = new Client(endpoint, token);
      this.isActive = true;
    } else {
      const label =
        mode === 'vip'
          ? 'VIP_GEYSER_ENDPOINT / VIP_GEYSER_TOKEN'
          : 'GEYSER_ENDPOINT / GEYSER_TOKEN';
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

  /**
   * Hardened Reconnect Logic (Blueprint v1.5)
   * Tries 5 times with increasing interval (2s, 4s, 8s, 16s, 32s).
   */
  private async connectWithRetry(): Promise<void> {
    try {
      console.info(`📡 [Geyser:${this.mode}] Connecting (Attempt ${this.retryCount + 1})...`);
      await this.startRealStream();
      this.retryCount = 0;
      console.info(`✅ [Geyser:${this.mode}] Stream connected.`);
    } catch (error) {
      this.retryCount++;
      if (this.retryCount <= GeyserService.MAX_RETRIES) {
        const delay = Math.pow(2, this.retryCount) * 1000;
        console.error(
          `❌ [Geyser:${this.mode}] Connection failed. Retrying in ${delay / 1000}s...`,
          error instanceof Error ? error.message : error,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.connectWithRetry();
      } else {
        console.error(`🛑 [Geyser:${this.mode}] Max retries reached. Switching to safe NO-OP.`);
        this.isActive = false;
        this.emit('error', new Error('Geyser max retries reached.'));
      }
    }
  }

  private async startRealStream(): Promise<void> {
    if (!this.client) return;

    const stream = await this.client.subscribe();

    stream.on('data', (data: unknown) => {
      // Robust Parsing: Dissecting Yellowstone gRPC SubscribeUpdate
      const payload = data as {
        transaction?: {
          transaction?: {
            signatures: Uint8Array[];
            message: { accountKeys: Uint8Array[] };
          };
        };
      };

      if (payload?.transaction?.transaction) {
        const tx = payload.transaction.transaction;
        const accountKeys = tx.message.accountKeys.map((k: Uint8Array) => bs58.encode(k));
        const PUMP_FUN_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfMX1NczvLA8nd6XMyC';

        // Check if Pump.fun program is involved
        if (accountKeys.includes(PUMP_FUN_ID)) {
          // Hardened Extraction: Identify the mint address (usually the last or unique key)
          const signature = bs58.encode(tx.signatures[0]);
          const detectedMint = accountKeys.find((k: string) => k !== PUMP_FUN_ID && k.length > 32);

          if (detectedMint) {
            const event: MintEvent = {
              mint: detectedMint,
              signature,
              timestamp: new Date().toISOString(),
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
      // Timeout to prevent hanging on initial write
      const timeout = setTimeout(() => reject(new Error('Geyser write timeout')), 5000);
      stream.write(request, (err: Error | null) => {
        clearTimeout(timeout);
        if (err) reject(err);
        else resolve();
      });
    });

    stream.on('error', (err: unknown) => {
      console.error(`[Geyser:${this.mode}] Stream error:`, err);
      void this.connectWithRetry();
    });
  }
}
