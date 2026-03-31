import React from 'react';

/**
 * RankWidget placeholder based on ML-Style ranking from the blueprint.
 * This will dynamically display the user's current rank (e.g., NEWBIE, PRO, ELITE) and subscription tier.
 */
export function RankWidget() {
  return (
    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-4 py-1.5 rounded-full shadow-lg">
      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Starlight Tier</span>
    </div>
  );
}
