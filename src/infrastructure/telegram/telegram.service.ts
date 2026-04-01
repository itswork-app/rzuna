import { Telegraf } from 'telegraf';
import { env } from '../../utils/env.js';
import { supabase } from '../supabase/client.js';
import { AlphaSignal } from '../../core/engine.js';

interface TelegramUser {
  tg_chat_id: string;
  subscription_status: string;
}

/**
 * Telegram Alpha Dispatcher Service (PR 12)
 * Dispatches high-conviction signals to premium users via Telegram Bot.
 * Speed Target: <500ms broadcast.
 */
export class TelegramService {
  private bot: Telegraf | null = null;

  constructor() {
    if (env.TELEGRAM_BOT_TOKEN) {
      this.bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
      this.bot.catch((err) => {
        console.error('[TelegramService] Bot encountered error:', err);
      });
      console.info('🛡️ [TelegramService] Alpha Dispatcher Initialized.');
    } else {
      console.warn('⚠️ [TelegramService] No BOT_TOKEN found. Dispatcher disabled.');
    }
  }

  /**
   * Broadcast an alpha signal to all eligible premium users.
   */
  async broadcastAlpha(signal: AlphaSignal) {
    if (!this.bot) return;

    try {
      // 1. Fetch eligible users (Starlight+ and VIP) with TG enabled
      const { data, error } = await supabase
        .from('profiles')
        .select('tg_chat_id, subscription_status')
        .eq('is_tg_enabled', true)
        .in('subscription_status', ['STARLIGHT', 'STARLIGHT_PLUS', 'VIP'])
        .not('tg_chat_id', 'is', null);

      const users = (data as unknown as TelegramUser[]) || [];
      if (error || users.length === 0) return;

      // 2. Format message
      const message = this.formatAlphaMessage(signal);

      // 3. Dispatch concurrently
      const promises = users.map((user) =>
        this.bot!.telegram.sendMessage(user.tg_chat_id, message, {
          parse_mode: 'MarkdownV2',
          link_preview_options: { is_disabled: false },
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Trade Institutional',
                  url: `https://trade.aivo.sh/token/${signal.event.mint}`,
                },
              ],
            ],
          },
        }).catch((err) => {
          console.error(`[TelegramService] Failed to send to ${user.tg_chat_id}:`, err);
        }),
      );

      await Promise.all(promises);
      console.info(`📢 [TelegramService] Broadcasted signal to ${users.length} users.`);
    } catch (err) {
      console.error('[TelegramService] Critical broadcast error:', err);
    }
  }

  /**
   * Send a test connectivity message.
   */
  async sendTestPing(chatId: string) {
    if (!this.bot) throw new Error('Bot not active');
    await this.bot.telegram.sendMessage(
      chatId,
      '✅ *RZUNA BOT:* Connection established. Ready for alpha dispatch.',
      {
        parse_mode: 'Markdown',
      },
    );
  }

  private formatAlphaMessage(signal: AlphaSignal): string {
    const { event, score, aiReasoning } = signal;
    const name = this.escapeMarkdown(event.metadata?.name || 'Unknown');
    const symbol = this.escapeMarkdown(event.metadata?.symbol || 'TOKEN');
    const mint = this.escapeMarkdown(event.mint);
    const narrative = this.escapeMarkdown(aiReasoning?.narrative || 'Intelligence processing...');

    return `🚀 *RZUNA ALPHA DETECTED*
[${name} | $${symbol}](https://solscan.io/token/${event.mint})

📊 *RZUNA SCORE:* \`${score}\`
🧠 *AI NARRATIVE:*
_${narrative}_

⚡ *SPEED:* \`${signal.latency.toFixed(2)}ms\`
🔗 *MINT:* \`${mint}\`

*Institutional Confirmation Required\\.*`;
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}
