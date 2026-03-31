import { EventEmitter } from 'events';

export interface MockTokenSignal {
  mint: string;
  symbol: string;
  name: string;
  initialLiquidity: number;
  isMintable: boolean;
  socialScore: number;
  timestamp: number;
}

/**
 * Mock Stream: Simulates Solana Mainnet Data (Geyser)
 * Used for development and testing scoring logic.
 */
export class MockGeyserStream extends EventEmitter {
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  start() {
    this.isRunning = true;
    console.warn('⚠️  RUNNING IN GEYSER MOCK MODE - NO LIVE DATA');

    const streamLoop = () => {
      if (!this.isRunning) return;

      const signal = this.generateFakeSignal();
      this.emit('token_mint', signal);

      const nextTick = 1000 + (Date.now() % 2000);
      this.timer = setTimeout(streamLoop, nextTick);
    };

    streamLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  private generateFakeSignal(): MockTokenSignal {
    const now = Date.now();
    const rand = Math.random();
    const isScam = rand > 0.8;

    return {
      mint: `MockMint${now.toString(36)}`,
      symbol: isScam ? 'SCAM' : rand > 0.5 ? 'GEMS' : 'ALPHA',
      name: isScam ? 'RugPull Token' : 'Future Moon Coin',
      initialLiquidity: isScam ? 10 : 200 + Math.floor(Math.random() * 800),
      isMintable: isScam && Math.random() > 0.5,
      socialScore: isScam ? 10 : 50 + Math.floor(Math.random() * 50),
      timestamp: now,
    };
  }
}
