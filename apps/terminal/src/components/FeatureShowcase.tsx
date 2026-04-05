'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Brain, Cpu, Database, BarChart3 } from 'lucide-react';

const Features = [
  {
    icon: Brain,
    title: 'L2 AI Reasoning',
    desc: 'Deep neural analysis of token narratives using the AIVO OS Scoring Engine for high-conviction alpha.',
    color: 'purple',
  },
  {
    icon: Zap,
    title: 'Zero Latency Swaps',
    desc: 'Institutional-grade Jito bundles ensure your trades land in the first block, every time.',
    color: 'cyan',
  },
  {
    icon: Shield,
    title: 'No Registration',
    desc: 'Access the full suite of RZUNA tools with just your Solana wallet. No emails, no friction.',
    color: 'teal',
  },
  {
    icon: BarChart3,
    title: 'ML Ranking System',
    desc: 'Dynamic tiered access based on your trading volume and institutional tenure.',
    color: 'blue',
  },
  {
    icon: Database,
    title: 'Infinite Scalability',
    desc: 'Powered by a distributed Geyser stream for micro-second synchronization with Solana Mainnet.',
    color: 'indigo',
  },
  {
    icon: Cpu,
    title: 'Adaptive Intelligence',
    desc: 'Our scoring models evolve in real-time, detecting new meta shifts before they hit the mainstream.',
    color: 'pink',
  },
];

export function FeatureShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
      {Features.map((feature, idx) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.5 }}
          viewport={{ once: true }}
          className="group p-8 rounded-[32px] bg-[#11111a] border border-white/5 hover:border-white/10 transition-all hover:bg-[#161625]"
        >
          <div
            className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
          >
            {React.createElement(feature.icon as any, {
              size: 24,
              className: `text-${feature.color}-400`,
            })}
          </div>
          <h4 className="text-xl font-bold mb-3 text-white tracking-tight">{feature.title}</h4>
          <p className="text-zinc-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}
