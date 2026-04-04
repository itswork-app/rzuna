import { EventEmitter } from 'events';
import WebSocket from 'ws';

export interface PumpPortalEvent {
  mint: string;
  traderPublicKey: string;
  txType: 'create' | 'buy' | 'sell';
  bondingCurveKey: string;
  vTokensInBondingCurve: number;
  vSolInBondingCurve: number;
  marketCapSol: number;
  name: string;
  symbol: string;
  uri: string;
}

/**
 * 🏛️ PumpPortalAdapter: High-Speed Transaction Stream
 * Standar: Canonical Master Blueprint v22.1 (The Dual-Path)
 * Ingests real-time events for instant brain processing.
 */
export class PumpPortalAdapter extends EventEmitter {
  private ws: WebSocket | null = null;
  private readonly url = 'wss://pumpportal.fun/api/data';

  async start(): Promise<void> {
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.info('🔌 [PumpPortal:Stream] Connected to WebSocket.');
      // Subscribe to both new tokens AND trades for full transaction context
      this.ws?.send(JSON.stringify({ method: 'subscribeNewToken' }));
      this.ws?.send(JSON.stringify({ method: 'subscribeAllTrades' }));
    });

    this.ws.on('message', (data: string) => {
      try {
        const payload = JSON.parse(data);
        
        // Machine Filtering: We only want creation or big buy events
        if (payload.txType === 'create' || payload.txType === 'buy' || payload.txType === 'sell') {
          const event: PumpPortalEvent = {
            mint: payload.mint,
            traderPublicKey: payload.traderPublicKey,
            txType: payload.txType,
            bondingCurveKey: payload.bondingCurveKey,
            vTokensInBondingCurve: payload.vTokensInBondingCurve,
            vSolInBondingCurve: payload.vSolInBondingCurve,
            marketCapSol: payload.marketCapSol,
            name: payload.name,
            symbol: payload.symbol,
            uri: payload.uri,
          };
          this.emit('transaction', event);
          if (payload.txType === 'create') this.emit('mint', event);
        }
      } catch (err) {
        // Silent fail for non-JSON or heartbeats
      }
    });

    this.ws.on('error', (err: Error) => {
      console.error('❌ [PumpPortal:Stream] WebSocket Error:', err);
      this.reconnect();
    });

    this.ws.on('close', () => {
      console.warn('⚠️ [PumpPortal:Stream] Connection closed.');
      this.reconnect();
    });
  }

  private reconnect(): void {
    setTimeout(() => {
      console.info('🔄 [PumpPortal:Stream] Reconnecting...');
      void this.start();
    }, 5000);
  }

  async stop(): Promise<void> {
    this.ws?.close();
    this.removeAllListeners();
  }
}
