import { describe, it, expect } from 'vitest';
import { IntelligenceEngine } from '../core/engine.js';
import { type PumpPortalEvent } from '../infrastructure/adapters/pumpportal.adapter.js';

describe('B2B Phase 1: Real-time Dry Run Pipeline', () => {
  it('SHOULD successfully receive a good token, process L1/L2, and broadcast via ElizaOS', async () => {
    const engine = new IntelligenceEngine();
    
    // Listen for ElizaOS broadcast for the assertion
    const broadcastPromise = new Promise<{ platform: string, content: string }>((resolve) => {
      engine.eliza.on('broadcast', (msg) => resolve(msg));
    });

    console.info('\n' + '═'.repeat(70));
    console.info('  🏛️  RZUNA B2B PHASE 1: PIPELINE INJECTION (DRY RUN)');
    console.info('═'.repeat(70));

    // Mock an incredibly bullish event
    const goodEvent: PumpPortalEvent = {
        mint: 'DemoMintAlphaGEM1234567890SOLANAxxxxxx',
        symbol: 'GIGA',
        name: 'GigaChad Coin',
        txType: 'create',
        vSolInBondingCurve: 85, // High liquidity
        vTokensInBondingCurve: 200000000,
        marketCapSol: 150,      // High initial mcap
        traderPublicKey: 'GoodDevWallet123456',
        bondingCurveKey: 'BondCurve123',
        uri: 'https://example.com/meta.json',
    };

    console.info(`  [1] Injecting Event -> $${goodEvent.symbol} (${goodEvent.mint})`);
    
    // Inject it into the pipeline
    await engine.handleAlphaEvent(goodEvent);

    // Wait for the pipeline to finish and Eliza to broadcast
    const broadcast = await Promise.race([
        broadcastPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Pipeline timeout')), 20000))
    ]) as any;

    console.info(`\n  [2] AI Pipeline Result Received!`);
    console.info(`  ------------------------------------------------------------------`);
    console.info(`  Platform : ${broadcast.platform}`);
    console.info(`  Content  : \n${broadcast.content}`);
    console.info(`  ------------------------------------------------------------------\n`);

    expect(broadcast.content).toContain('ALPHA');
    expect(broadcast.content).toContain('GIGA');
  }, 30000);
});
