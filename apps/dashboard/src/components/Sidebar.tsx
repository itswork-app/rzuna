'use client';

import * as Lucide from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * 🏛️ Sidebar: Navigation & Identity (Institutional v22.1)
 */
export function Sidebar() {
  const { disconnect, publicKey, connected } = useWallet();
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', icon: Lucide.LayoutDashboard as any, href: '/' },
    { label: 'API Keys', icon: Lucide.Key as any, href: '/keys' },
    { label: 'Usage', icon: Lucide.BarChart3 as any, href: '/usage' },
    { label: 'Settings', icon: Lucide.Settings as any, href: '/settings' },
  ];

  if (!connected) return null;

  const address = publicKey?.toBase58();
  const LogOutIcon = Lucide.LogOut as any;

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col p-4 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
          R
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-100">RZUNA</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon as any;
          const isActive = pathname === item.href;
          const NavLink = Link as any;
          return (
            <NavLink
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group',
                isActive
                  ? 'bg-blue-600/10 text-blue-500 font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800',
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-100',
                )}
              />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 pt-4 mt-auto">
        <div className="px-3 mb-4">
          <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">
            Account
          </p>
          <p className="text-sm text-slate-300 truncate font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-3 px-3 py-2 w-full text-left text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          {LogOutIcon && <LogOutIcon className="w-5 h-5" />}
          Disconnect
        </button>
      </div>
    </aside>
  );
}
