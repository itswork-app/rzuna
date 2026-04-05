'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Shield, Check, LucideIcon } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface Tier {
  id: 'STARLIGHT' | 'STARLIGHT_PLUS' | 'VIP';
  name: string;
  price: number;
  icon: LucideIcon;
  color: string;
  perks: string[];
}

const Tiers: Tier[] = [
  {
    id: 'STARLIGHT',
    name: 'Starlight',
    price: 19,
    icon: Star,
    color: 'zinc',
    perks: ['85+ Signal Access', 'Standard Detection', 'Basic Analytics'],
  },
  {
    id: 'STARLIGHT_PLUS',
    name: 'Starlight+',
    price: 49,
    icon: Shield,
    color: 'blue',
    perks: [
      '90+ Signal Access',
      'Priority Notifications',
      '2x Rank Multiplier',
      'Early Alpha Access',
    ],
  },
  {
    id: 'VIP',
    name: 'VIP Alliance',
    price: 149,
    icon: Crown,
    color: 'purple',
    perks: ['L2 AI Reasoning', 'Instant Jito Swaps', 'Private Alpha Channel', 'Direct Dev Support'],
  },
];

export function TierCards({ onUpgrade }: { onUpgrade: (id: string, price: number) => void }) {
  const { profile } = useProfile();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
      {Tiers.map((tier) => (
        <motion.div
          key={tier.id}
          whileHover={{ y: -8 }}
          className={`relative overflow-hidden bg-[#11111a] border ${
            profile?.status === tier.id
              ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.15)]'
              : 'border-white/5'
          } p-8 rounded-[32px] flex flex-col transition-all duration-300 group`}
        >
          {profile?.status === tier.id && (
            <div className="absolute top-6 right-6 bg-purple-500 text-black text-[10px] font-black px-3 py-1 rounded-full tracking-widest">
              ACTIVE TIER
            </div>
          )}

          <div
            className={`w-14 h-14 bg-${tier.color}-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
          >
            {React.createElement(tier.icon as any, {
              size: 28,
              className: `text-${tier.color}-400`,
            })}
          </div>

          <h3 className="text-2xl font-bold mb-2 text-white">{tier.name}</h3>
          <div className="text-4xl font-black mb-6 flex items-baseline gap-1 text-white">
            {tier.price} <span className="text-sm font-bold text-zinc-500">USDC/MO</span>
          </div>

          <ul className="space-y-4 mb-10 grow">
            {tier.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-zinc-400 text-sm font-medium">
                {React.createElement(Check as any, {
                  size: 16,
                  className: 'text-green-500 shrink-0',
                })}
                {perk}
              </li>
            ))}
          </ul>

          <button
            onClick={() => onUpgrade(tier.id, tier.price)}
            disabled={profile?.status === tier.id}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
              profile?.status === tier.id
                ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5'
                : 'bg-white text-black hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95'
            }`}
          >
            {profile?.status === tier.id ? 'Current Plan' : 'Secure Access'}
          </button>
        </motion.div>
      ))}
    </div>
  );
}
