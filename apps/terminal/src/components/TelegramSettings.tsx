'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { UserProfile } from '@rzuna/contracts';

interface TelegramSettingsProps {
  profile: UserProfile | null;
  onUpdate: () => void;
}

export function TelegramSettings({ profile, onUpdate }: TelegramSettingsProps) {
  const { publicKey } = useWallet();
  const [chatId, setChatId] = useState(profile?.tgChatId || '');
  const [isEnabled, setIsEnabled] = useState(profile?.isTgEnabled || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const supabase = createClient();

  const handleSave = async () => {
    if (!publicKey) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          tg_chat_id: chatId || null,
          is_tg_enabled: isEnabled && !!chatId,
        })
        .eq('wallet_address', publicKey.toBase58());

      if (error) throw error;
      toast.success('Telegram settings saved.');
      onUpdate();
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!chatId) return toast.error('Enter a Chat ID first.');
    setIsTesting(true);
    setTestStatus('idle');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/telegram/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });

      if (!res.ok) throw new Error('Test failed');
      setTestStatus('success');
      toast.success('Test message sent! Check your Telegram.');
    } catch {
      setTestStatus('error');
      toast.error('Failed to send test message. Verify your Chat ID.');
    } finally {
      setIsTesting(false);
    }
  };

  const isPremium = profile?.status &&
    ['STARLIGHT', 'STARLIGHT_PLUS', 'VIP'].includes(profile.status);

  if (!isPremium) {
    return (
      <div className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-2">Telegram Alpha Dispatcher</h3>
        <p className="text-gray-500 text-sm">
          Upgrade to Starlight+ or VIP to receive alpha signals directly on Telegram.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a2e] border border-cyan-500/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg">Telegram Alpha Dispatcher</h3>
          <p className="text-gray-500 text-xs mt-1">
            Receive high-conviction signals instantly on Telegram.
          </p>
        </div>
        <button
          onClick={() => { setIsEnabled(!isEnabled); }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-cyan-600' : 'bg-gray-700'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">
            Telegram Chat ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. 123456789"
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-mono placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !chatId}
              className="px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-cyan-400 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Test
            </button>
          </div>
          {testStatus === 'success' && (
            <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Connection verified
            </p>
          )}
          {testStatus === 'error' && (
            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Check your Chat ID and try again
            </p>
          )}
        </div>

        <p className="text-gray-600 text-[10px] leading-relaxed">
          To get your Chat ID, start a conversation with <span className="text-cyan-400 font-bold">@RzunaAlphaBot</span> on Telegram and send <code className="bg-black/40 px-1 rounded text-cyan-400">/start</code>.
        </p>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Telegram Settings'}
        </button>
      </div>
    </div>
  );
}
