import { Telegraf } from 'telegraf';
import { env } from '../../utils/env.js';
import { db, users, subscriptions, eq, inArray, and, isNotNull } from '@rzuna/database';
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
      // 🏛️ V22.1: Fetch eligible users via Drizzle Join
      const rows = await db
        .select({
          tgChatId: users.telegramId,
          status: subscriptions.status
        })
        .from(users)
        .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
        .where(
          and(
            eq(users.isTgEnabled, true),
            inArray(subscriptions.status, ['STARLIGHT', 'STARLIGHT_PLUS', 'VIP']),
            isNotNull(users.telegramId)
          )
        );

      if (rows.length === 0) return;

      // 2. Format message
      const message = this.formatAlphaMessage(signal);

      // 3. Dispatch concurrently
      const promises = rows.map((row) => {
        const isVip = row.status === 'VIP';
        const baseUrl = isVip ? 'https://vip.aivo.sh' : 'https://trade.aivo.sh';

        return this.bot!.telegram.sendMessage(row.tgChatId!, message, {
          parse_mode: 'MarkdownV2',
          link_preview_options: { is_disabled: false },
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Trade Institutional',
                  url: `${baseUrl}/token/${signal.event.mint}`,
                },
              ],
            ],
          },
        }).catch((err) => {
          console.error(`[TelegramService] Failed to send to ${row.tgChatId}:`, err);
        });
      });

      await Promise.all(promises);
      console.info(`📢 [TelegramService] Broadcasted signal to ${rows.length} users.`);
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

⚡ *SPEED:* \`${(signal.latency ?? 0).toFixed(2)}ms\`
🔗 *MINT:* \`${mint}\`

*Institutional Confirmation Required\\.*`;
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}
