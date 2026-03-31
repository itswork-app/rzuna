import { supabase } from './client.js';
import type { AlphaSignal } from '../../core/engine.js';
import type { L2Reasoning } from '../../agents/reasoning.service.js';

export interface VipBroadcastPayload {
  type: 'ALPHA_SIGNAL';
  signal: AlphaSignal;
  reasoning: L2Reasoning;
  timestamp: string;
}

/**
 * Supabase Realtime VIP Broadcast Service
 * Standar: Canonical Master Blueprint v1.3 (PR 5 — Agent Intelligence)
 *
 * Broadcasts private alpha signals with AI reasoning to VIP subscribers.
 * Frontend: subscribe to channel 'vip-alpha' with valid session token.
 */
export class RealtimeService {
  /**
   * Broadcast alpha signal + L2 reasoning to VIP channel.
   * Only called for tokens with score >= 90.
   */
  broadcastVipAlpha(signal: AlphaSignal, reasoning: L2Reasoning): void {
    const payload: VipBroadcastPayload = {
      type: 'ALPHA_SIGNAL',
      signal,
      reasoning,
      timestamp: new Date().toISOString(),
    };

    // Fire-and-forget Supabase Realtime broadcast
    void supabase
      .channel('vip-alpha')
      .send({
        type: 'broadcast',
        event: 'alpha',
        payload,
      })
      .then((status) => {
        if (status !== 'ok') {
          console.error('[REALTIME] VIP broadcast failed:', status);
        }
      });
  }
}
