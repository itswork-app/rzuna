import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramService } from './telegram.service.js';
import { env } from '../../utils/env.js';
import { supabase } from '../supabase/client.js';

// Mock Dependencies
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

vi.mock('../supabase/client.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
  },
}));

describe('TelegramService', () => {
  let service: TelegramService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TelegramService();
  });

  describe('Constructor', () => {
    it('should initialize bot when token is present', () => {
      expect(service).toBeDefined();
    });

    it('should warn when token is missing', () => {
      const originalToken = env.TELEGRAM_BOT_TOKEN;
      (env as any).TELEGRAM_BOT_TOKEN = undefined;
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const instance = new TelegramService();
      expect(instance).toBeDefined();
      expect(warnSpy).toHaveBeenCalled();
      (env as any).TELEGRAM_BOT_TOKEN = originalToken;
    });
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

    it('should broadcast message to eligible users', async () => {
      const mockUsers = [
        { tg_chat_id: '123', subscription_status: 'VIP' },
        { tg_chat_id: '456', subscription_status: 'STARLIGHT_PLUS' },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnValue({ data: mockUsers, error: null }),
      });

      await service.broadcastAlpha(mockSignal);

      // Verify supabase call
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vi.mocked(supabase.from)).toHaveBeenCalledWith('profiles');

      // Verify bot call
      const botInstance = (service as any).bot;
      expect(botInstance.telegram.sendMessage).toHaveBeenCalledTimes(2);
      expect(botInstance.telegram.sendMessage).toHaveBeenCalledWith(
        '123',
        expect.stringContaining('RZUNA ALPHA DETECTED'),
        expect.any(Object),
      );
    });

    it('should early return if no bot initialized', async () => {
      (service as any).bot = null;
      await service.broadcastAlpha(mockSignal);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vi.mocked(supabase.from)).not.toHaveBeenCalled();
    });

    it('should handle supabase error gracefully', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnValue({ data: null, error: new Error('DB Error') }),
      });

      await service.broadcastAlpha(mockSignal);
      const botInstance = (service as any).bot;
      expect(botInstance.telegram.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle sendMessage failures for individual users', async () => {
      const mockUsers = [{ tg_chat_id: 'err123' }];
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnValue({ data: mockUsers, error: null }),
      });

      const botInstance = (service as any).bot;
      botInstance.telegram.sendMessage.mockRejectedValue(new Error('TG Error'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await service.broadcastAlpha(mockSignal);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send to err123'),
        expect.any(Object),
      );
    });
  });

  describe('sendTestPing', () => {
    it('should send connection test message', async () => {
      await service.sendTestPing('test-chat-id');
      const botInstance = (service as any).bot;
      expect(botInstance.telegram.sendMessage).toHaveBeenCalledWith(
        'test-chat-id',
        expect.stringContaining('Connection established'),
        expect.any(Object),
      );
    });

    it('should throw if bot not active', async () => {
      (service as any).bot = null;
      await expect(service.sendTestPing('123')).rejects.toThrow('Bot not active');
    });
  });

  describe('Formatting Logic', () => {
    it('should escape markdown special characters', () => {
      const text = 'Token_Name*With*Chars!';
      const escaped = (service as any).escapeMarkdown(text);
      expect(escaped).toContain('\\_');
      expect(escaped).toContain('\\*');
      expect(escaped).toContain('\\!');
    });

    it('should handle missing metadata gracefully', () => {
      const signal: any = {
        event: { mint: 'mint123' },
        score: 80,
        latency: 100,
      };
      const message = (service as any).formatAlphaMessage(signal);
      expect(message).toContain('Unknown');
      expect(message).toContain('TOKEN');
    });
  });
});
