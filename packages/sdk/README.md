# @rzuna/sdk (The Nerve)

Institutional-grade SDK for the RZUNA AIVO Protocol (V22.1).
This package provides a high-speed interface for institutional traders (B2B) to access alpha signals, AI intelligence, and execution services.

## Installation

```bash
pnpm add @rzuna/sdk
```

## Quick Start

```typescript
import { AivoClient } from '@rzuna/sdk';

const client = new AivoClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://engine.rzuna.io',
  wssUrl: 'wss://engine.rzuna.io/ws',
});

// 📡 Listen to High-Alpha Signals
client.getSignalStream().on('signal', (signal) => {
  console.log(`🚀 New Alpha: ${signal.symbol} (Score: ${signal.score})`);
});

// 🧠 Fetch AI Intelligence
const intel = await client.getTokenIntelligence('MINT_ADDRESS');
console.log(intel.aiReasoning.narrative);

// 💹 Execute High-Speed Swap
const tx = await client.executeSwap({
  mint: 'MINT_ADDRESS',
  amount: '1000000',
  type: 'buy',
  slippageBps: 100,
});
console.log(`✅ Transaction Success: ${tx.signature}`);
```

## B2B Trading Fees

Fees are automatically applied at the protocol level based on your tier:

- **VIP (Mythic/Diamond)**: 0.5% (50 BPS)
- **Starlight Plus (Gold/Platinum)**: 1.0% (100 BPS)
- **Starlight (Silver)**: 1.5% (150 BPS)

## Authentication

All requests require the `x-api-key` header, which is managed via the [AIVO Dashboard](https://dashboard.rzuna.io).

## Support

For institutional support, contact the RZUNA Core Team on Telegram.

---

© 2026 RZUNA Protocol. All Rights Reserved.
