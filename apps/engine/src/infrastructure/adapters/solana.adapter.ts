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

interface GrpcClient {
  subscribe(): Promise<{
    on(event: string, listener: (data: unknown) => void): void;
    write(req: unknown, cb: (err: Error | null) => void): void;
    end(): void;
  }>;
}

/**
 * 🏛️ SolanaAdapter: Yellowstone gRPC + Helius RPC Fallback
 * Standar: Canonical Master Blueprint v22.1 (Adapter Pattern)
 */
export class SolanaAdapter extends EventEmitter {
  private client: GrpcClient | null = null;
  private connection: Connection;
  private isActive: boolean = false;
  private isFallbackActive: boolean = false;
  private retryCount: number = 0;
  private static readonly MAX_RETRIES = 5;
  private readonly mode: 'public' | 'vip';
  private websocketId: number | null = null;

  constructor(mode: 'public' | 'vip' = 'public') {
    super();
    this.mode = mode;
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
    } else {
      this.isActive = false;
    }
  }

  get status() {
    return {
      isActive: this.isActive,
      isFallbackActive: this.isFallbackActive,
    };
  }

  async start(): Promise<void> {
    if (!this.isActive) {
      return this.startRpcFallback();
    }
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    try {
      await this.startGrpcStream();
      this.retryCount = 0;
    } catch (error) {
      this.retryCount++;
      if (this.retryCount <= SolanaAdapter.MAX_RETRIES) {
        const delay = Math.pow(2, this.retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.connectWithRetry();
      } else {
        this.isActive = false;
        await this.startRpcFallback();
      }
    }
  }

  /**
   * 🛡️ Helius/Standard RPC Fallback
   */
  private async startRpcFallback(): Promise<void> {
    if (this.isFallbackActive) return;

    const PUMP_FUN_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfMX1NczvLA8nd6XMyC');

    this.websocketId = this.connection.onLogs(
      PUMP_FUN_ID,
      (logs) => {
        void (async () => {
          if (logs.logs.some((l) => l.includes('Program log: Instruction: Create'))) {
            try {
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
                    ![
                      '11111111111111111111111111111111',
                      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    ].includes(k) &&
                    k.length > 32,
                );

                if (detectedMint) {
                  this.emit('mint', {
                    mint: detectedMint,
                    signature: logs.signature,
                    timestamp: new Date().toISOString(),
                  });
                }
              }
            } catch (err) {
              console.error('[SolanaAdapter:RPC] Log processing error:', err);
            }
          }
        })();
      },
      'confirmed',
    );

    this.isFallbackActive = true;
    console.info(`🚀 [SolanaAdapter:${this.mode}] RPC Fallback Active.`);
  }

  private async startGrpcStream(): Promise<void> {
    if (!this.client) return;
    const stream = await this.client.subscribe();

    stream.on('data', (data: any) => {
      const tx = data?.transaction?.transaction;
      if (tx) {
        const accountKeys = tx.message.accountKeys.map((k: Uint8Array) => bs58.encode(k));
        const PUMP_FUN_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfMX1NczvLA8nd6XMyC';

        if (accountKeys.includes(PUMP_FUN_ID)) {
          const signature = bs58.encode(tx.signatures[0]);
          const detectedMint = accountKeys.find(
            (k: string) =>
              k !== PUMP_FUN_ID &&
              ![
                '11111111111111111111111111111111',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              ].includes(k) &&
              k.length > 32,
          );

          if (detectedMint) {
            this.emit('mint', {
              mint: detectedMint,
              signature,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    });

    const request = {
      transactions: {
        mints: { accountInclude: ['6EF8rrecthR5Dkzon8Nwu78hRvfMX1NczvLA8nd6XMyC'] },
      },
      commitment: 1,
    };

    stream.write(request, (err: Error | null) => {
      if (err) throw err;
    });

    stream.on('error', (err: any) => {
      console.error(`[SolanaAdapter:${this.mode}] gRPC error:`, err);
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
