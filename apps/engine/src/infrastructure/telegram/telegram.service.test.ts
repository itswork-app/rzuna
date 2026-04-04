import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramService } from './telegram.service.js';
import { env } from '../../utils/env.js';
import { db } from '@rzuna/database';

// 🏛️ V22.1 Hoisted Mocks
const { mockInnerJoin, mockWhere } = vi.hoisted(() => ({
  mockInnerJoin: vi.fn().mockReturnThis(),
  mockWhere: vi.fn(),
}));

vi.mock('telegraf', () => {
  return {
    Telegraf: vi.fn().mockImplementation(function () {
      return {
        catch: vi.fn(),
        telegram: {
          sendMessage: vi.fn().mockResolvedValue({ message_id: 123 }),
        },
      };
    }),
  };
});

vi.mock('../../utils/env.js', () => ({
  env: {
    TELEGRAM_BOT_TOKEN: 'mock-bot-token',
  },
}));

vi.mock('@rzuna/database', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: mockInnerJoin,
    where: mockWhere,
  },
  users: { id: 'id', telegramId: 'telegram_id', isTgEnabled: 'is_tg_enabled' },
  subscriptions: { id: 'id', userId: 'user_id', status: 'status' },
  eq: vi.fn(),
  inArray: vi.fn(),
  and: vi.fn(),
  isNotNull: vi.fn(),
}));

describe('TelegramService (Institutional V22.1)', () => {
  let service: TelegramService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TelegramService();
  });

  describe('broadcastAlpha', () => {
    const mockSignal: any = {
      event: {
        mint: 'mint123',
        metadata: { name: 'Test Token', symbol: 'TEST' },
      },
      score: 95,
      latency: 450.5,
      aiReasoning: { narrative: 'High conviction signal' },
    };

    it('should broadcast message to eligible users via Drizzle', async () => {
      const mockRows = [
        { tgChatId: '123', status: 'VIP' },
        { tgChatId: '456', status: 'STARLIGHT_PLUS' },
      ];

      mockWhere.mockResolvedValueOnce(mockRows);

      await service.broadcastAlpha(mockSignal);

      // Verify Drizzle call
      expect(db.select).toHaveBeenCalled();
      expect(mockInnerJoin).toHaveBeenCalled();

      // Verify bot call
      const botInstance = (service as any).bot;
      expect(botInstance.telegram.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle zero eligible users gracefully', async () => {
      mockWhere.mockResolvedValueOnce([]);

      await service.broadcastAlpha(mockSignal);
      const botInstance = (service as any).bot;
      expect(botInstance.telegram.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('sendTestPing', () => {
    it('should send connection test message', async () => {
      await service.sendTestPing('test-chat-id');
      const botInstance = (service as any).bot;
      expect(botInstance.telegram.sendMessage).toHaveBeenCalled();
    });
  });
});
