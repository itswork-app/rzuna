'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlphaSignal } from '@/types';

export function useSignals() {
  const [signals, setSignals] = useState<AlphaSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch from backend API
    const fetchSignals = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signals`);
        if (response.ok) {
          const data = await response.json();
          setSignals(data.signals || []);
        }
      } catch (err) {
        console.error('Failed to fetch signals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();

    // Supabase Real-time Subscription
    const channel = supabase
      .channel('public:scouted_tokens')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scouted_tokens' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedToken = payload.new as { is_active: boolean; base_score: number; mint_address: string; ai_reasoning?: string };
          
          if (!updatedToken.is_active || updatedToken.base_score < 85) {
            // AUTO-DOWN
            setSignals(prev => prev.filter(s => s.mint !== updatedToken.mint_address));
          } else {
            setSignals(prev => prev.map(s => s.mint === updatedToken.mint_address ? {
              ...s,
              score: updatedToken.base_score,
              aiReasoning: (() => {
                if (!updatedToken.ai_reasoning) return s.aiReasoning;
                try {
                  return JSON.parse(updatedToken.ai_reasoning);
                } catch {
                  return s.aiReasoning;
                }
              })()
            } : s));
          }
        } else if (payload.eventType === 'INSERT') {
          const newToken = payload.new as { mint_address: string; base_score: number; is_active: boolean };
          if (newToken.is_active && newToken.base_score >= 85) {
            const signal: AlphaSignal = {
              mint: newToken.mint_address,
              symbol: 'UNKNOWN',
              score: newToken.base_score,
              isPremium: true,
              isNew: true,
              timestamp: Date.now()
            };
            setSignals(prev => [...prev, signal]);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { signals, loading };
}
