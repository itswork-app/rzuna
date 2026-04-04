import { EventEmitter } from 'events';
import bs58 from 'bs58';
import Client from '@triton-one/yellowstone-grpc';
import { Connection, PublicKey } from '@solana/web3.js';
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
 * Falls back to RpcWebSocketClient (Standard RPC) if gRPC fails.
 */
export class GeyserService extends EventEmitter {
  private client: GrpcClient | null = null;
  private connection: Connection;
  private isActive: boolean = false;
  private isFallbackActive: boolean = false;
  private retryCount: number = 0;
  private static readonly MAX_RETRIES = 5;
  private readonly mode: 'public' | 'vip';
  private readonly priority: number;
  private websocketId: number | null = null;

  constructor(mode: 'public' | 'vip' = 'public', priority: number = 0) {
    super();
    this.mode = mode;
    this.priority = mode === 'vip' ? 1 : priority;
    this.connection = new Connection(env.SOLANA_RPC_URL, {
      commitment: 'confirmed',
      wsEndpoint: env.SOLANA_WSS_URL,
    });

    const endpoint = mode === 'vip' ? env.VIP_GEYSER_ENDPOINT : env.GEYSER_ENDPOINT;
    const token = mode === 'vip' ? env.VIP_GEYSER_TOKEN : env.GEYSER_TOKEN;

    if (endpoint && token) {
      // @ts-expect-error - Yellowstone gRPC Client types
      this.client = new Client(endpoint, token);
      this.isActive = true;
      console.info(
        `🛡️ [GeyserService:${mode}] Institutional Grade Ready. Priority: ${this.priority}`,
      );
    } else {
      const label =
        mode === 'vip'
          ? 'VIP_GEYSER_ENDPOINT / VIP_GEYSER_TOKEN'
          : 'GEYSER_ENDPOINT / GEYSER_TOKEN';
      console.warn(
        `[GeyserService:${mode}] ${label} not configured. ` +
          'Running in NO-OP mode — will attempt WebSocket fallback.',
      );
      this.isActive = false; // Trigger fallback immediately if called
    }
  }

  async start(): Promise<void> {
    this.retryCount = 0;
    if (!this.isActive) {
      console.warn('[GeyserService] gRPC inactive. Starting WebSocket Fallback...');
      return this.startWebSocketFallback();
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
        console.error(
          `🛑 [Geyser:${this.mode}] Max retries reached. Switching to WebSocket Fallback.`,
        );
        this.isActive = false;
        await this.startWebSocketFallback();
      }
    }
  }

  /**
   * 🏛️ PR 22: RpcWebSocketClient Fallback (onLogs)
   * Listens for Pump.fun program logs when gRPC is unavailable.
   */
  private async startWebSocketFallback(): Promise<void> {
    if (this.isFallbackActive) return;

    console.info('🔌 [Geyser:Fallback] Activating RPC WebSocket Fallback...');
    const PUMP_FUN_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfMX1NczvLA8nd6XMyC');

    this.websocketId = this.connection.onLogs(
      PUMP_FUN_ID,
      (logs) => {
        void (async () => {
          // Filter for "Create" instruction in Pump.fun
          if (logs.logs.some((l) => l.includes('Program log: Instruction: Create'))) {
            try {
              // Fetch transaction to identify the mint
              const tx = await this.connection.getParsedTransaction(logs.signature, {
                maxSupportedTransactionVersion: 0,
              });

              if (tx && tx.meta && !tx.meta.err) {
                const accountKeys = tx.transaction.message.accountKeys.map((k) =>
                  k.pubkey.toBase58(),
                );
                const detectedMint = accountKeys.find(
                  (k) =>
                    k !== PUMP_FUN_ID.toBase58() &&
                    k !== '11111111111111111111111111111111' &&
                    k !== 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' &&
                    k !== 'SysvarRent111111111111111111111111111111111' &&
                    k.length > 32,
                );

                if (detectedMint) {
                  const event: MintEvent = {
                    mint: detectedMint,
                    signature: logs.signature,
                    timestamp: new Date().toISOString(),
                  };
                  this.emit('mint', event);
                }
              }
            } catch (err) {
              console.error('[Geyser:Fallback] Failed to process log tx:', err);
            }
          }
        })();
      },
      'confirmed',
    );

    this.isFallbackActive = true;
    console.info('🚀 [Geyser:Fallback] WebSocket Fallback Active.');
  }

  private async startRealStream(): Promise<void> {
    if (!this.client) return;

    const stream = await this.client.subscribe();

    stream.on('data', (data: unknown) => {
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

        if (accountKeys.includes(PUMP_FUN_ID)) {
          const signature = bs58.encode(tx.signatures[0]);
          const detectedMint = accountKeys.find(
            (k: string) =>
              k !== PUMP_FUN_ID &&
              k !== '11111111111111111111111111111111' &&
              k !== 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' &&
              k !== 'SysvarRent111111111111111111111111111111111' &&
              k.length > 32,
          );

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
      const timeout = setTimeout(() => reject(new Error('Geyser write timeout')), 5000);
      stream.write(request, (err: Error | null) => {
        clearTimeout(timeout);
        if (err) reject(err);
        else resolve();
      });
    });

    stream.on('error', (err: unknown) => {
      console.error(`[Geyser:${this.mode}] gRPC Stream error:`, err);
      void this.connectWithRetry();
    });
  }

  async stop(): Promise<void> {
    this.removeAllListeners();
    if (this.websocketId !== null) {
      await this.connection.removeOnLogsListener(this.websocketId);
      this.websocketId = null;
    }
  }
}
