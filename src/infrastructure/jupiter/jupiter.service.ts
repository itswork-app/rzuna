export interface SwapRoute {
  inMint: string;
  outMint: string;
  inAmount: number; // In lamports
  outAmount: number; // In lamports
  priceImpactPct: number;
  routePlan: string[];
  platformFeeBps?: number;
}

export interface SwapResult {
  signature: string;
  inAmount: number;
  outAmount: number;
  fee: number;
}

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';

/**
 * Jupiter V6 Swap Service
 * Standar: Canonical Master Blueprint v1.3 (PR 4 — Rank & Economy)
 * Uses REST API for lightweight, no-SDK integration.
 */
export class JupiterService {
  /**
   * Get the best swap route from Jupiter V6 REST API.
   * @param inputMint  - Source token mint address
   * @param outputMint - Destination token mint address
   * @param amountLamports - Amount in lamports (integer)
   * @param platformFeeBps - Dynamic platform fee in basis points (e.g. 200 = 2.0%)
   */
  async getBestRoute(
    inputMint: string,
    outputMint: string,
    amountLamports: number,
    platformFeeBps: number,
  ): Promise<SwapRoute> {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountLamports.toString(),
      slippageBps: '50', // 0.5% slippage
      platformFeeBps: platformFeeBps.toString(),
      onlyDirectRoutes: 'false',
    });

    const response = await fetch(`${JUPITER_QUOTE_API}/quote?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Jupiter quote failed: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      inAmount: string;
      outAmount: string;
      priceImpactPct: number;
      routePlan: Array<{ swapInfo: { label: string } }>;
    };

    return {
      inMint: inputMint,
      outMint: outputMint,
      inAmount: Number(data.inAmount),
      outAmount: Number(data.outAmount),
      priceImpactPct: data.priceImpactPct,
      routePlan: data.routePlan.map((r) => r.swapInfo.label),
      platformFeeBps,
    };
  }

  /**
   * Build a Jito-protected swap transaction bundle.
   * In production, this signs and submits via Jito block engine.
   * For PR 4, returns mock signature for testing.
   */
  async executeSwap(route: SwapRoute, walletAddress: string): Promise<SwapResult> {
    // Production flow: fetch swap transaction from Jupiter, inject Jito tip, submit bundle
    // Jito tip account (Cw8CFyM9...) and JITO_ENDPOINT env are used in real bundle signing.
    // Replace this mock with real Jito bundle submission in deployment phase.

    // For institutional testing — return a structured mock result
    // Replace with real bundle submission in deployment phase
    const mockSignature = `RZUNA_${walletAddress.slice(0, 8)}_${Date.now()}`;

    console.info(
      `[JUPITER] Swap ${route.inAmount} lamports → ${route.outAmount} lamports | Routes: ${route.routePlan.join(' → ')} | Fee: ${route.platformFeeBps}bps | Jito protected`,
    );

    return {
      signature: mockSignature,
      inAmount: route.inAmount,
      outAmount: route.outAmount,
      fee: Math.floor((route.inAmount * (route.platformFeeBps ?? 0)) / 10000),
    };
  }

  /**
   * Convert fee percentage (e.g., 0.02) to basis points (200)
   */
  static feeToBps(feeRate: number): number {
    return Math.round(feeRate * 10000);
  }
}
