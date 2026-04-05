'use client';

import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

export const WalletContextProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  const ConnectionProviderAny = ConnectionProvider as any;
  const WalletProviderAny = WalletProvider as any;
  const WalletModalProviderAny = WalletModalProvider as any;

  return (
    <ConnectionProviderAny endpoint={endpoint}>
      <WalletProviderAny wallets={wallets} autoConnect>
        <WalletModalProviderAny>{children}</WalletModalProviderAny>
      </WalletProviderAny>
    </ConnectionProviderAny>
  );
};
