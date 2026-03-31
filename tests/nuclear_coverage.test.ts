import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReasoningService } from '../src/agents/reasoning.service.js';
import * as serverModule from '../src/server.js';
import * as appModule from '../src/app.js';
import { env } from '../src/utils/env.js';

// Global Mocks
vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: vi.fn(),
      },
    };
  },
}));

describe('☢️ Institutional 80% Absolute Nuclear Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🧠 ReasoningService Infiltration (Target: >80% Branches)', () => {
    const service = new ReasoningService();

    it('should hit ALL catalysts branches (Line 19, 21, 22, 25)', async () => {
      const event: any = { initialLiquidity: 1000, socialScore: 80 };
      const score = 95;
      // Hit 19, 21, 22
      const res = await (service as any).analyzeToken(event, score);
      expect(res.catalysts.length).toBeGreaterThan(1);
    });

    it('should hit catalysts fallback branch (Line 25)', async () => {
      const event: any = { initialLiquidity: 100, socialScore: 30 };
      const res = await (service as any).analyzeToken(event, 80);
      expect(res.catalysts[0]).toBe('Token lolos filter L1 rzuna');
    });

    it('should hit ALL risk branches (Line 32, 33, 35, 37)', async () => {
      const event: any = { initialLiquidity: 50, metadata: { isMintable: true }, socialScore: 10 };
      const res = await (service as any).analyzeToken(event, 80);
      expect(res.riskFactors.length).toBeGreaterThan(2);
    });

    it('should hit metadata undefined branches (Line 42, 115, 116)', async () => {
      const event: any = { mint: 'm', initialLiquidity: 100, socialScore: 50 }; // No metadata
      const res = await (service as any).analyzeToken(event, 80);
      expect(res.narrative).toContain('UNKNOWN');
    });

    it('should hit score threshold branches (Line 52, 60)', async () => {
      const event: any = { initialLiquidity: 100, socialScore: 50 };
      // Branch 60 HIGH
      const r1 = await (service as any).analyzeToken(event, 91);
      expect(r1.confidence).toBe('HIGH');
      // Branch 60 MEDIUM
      const r2 = await (service as any).analyzeToken(event, 88);
      expect(r2.confidence).toBe('MEDIUM');
      // Branch 60 LOW
      const r3 = await (service as any).analyzeToken(event, 85);
      expect(r3.confidence).toBe('LOW');
    });

    it('should hit OpenAI content fallback branches (Line 99, 101-104)', async () => {
      env.OPENAI_API_KEY = 'test';
      const aiService = new ReasoningService();
      const mockOpenAI = (aiService as any).openai;

      // Hit 99 (choices empty)
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({ choices: [] });
      const r1 = await aiService.analyzeToken({} as any, 80);
      expect(r1.generatedByAI).toBe(true);

      // Hit 101-104 (properties missing)
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
      });
      const r2 = await aiService.analyzeToken({} as any, 80);
      expect(r2.narrative).toBe('AI generated narrative unavailable');
    });
  });

  describe('🚀 server.ts Infiltration (Target: 100% Branches)', () => {
    it('should hit port and execution mode branches (Line 10, 20)', async () => {
      env.PORT = '';
      env.EXECUTION_MODE = 'real';
      const spy = vi.spyOn(appModule, 'buildApp').mockResolvedValue({
        listen: vi.fn(),
        close: vi.fn(),
      } as any);

      const app = await serverModule.start();
      expect(app).toBeDefined();
      spy.mockRestore();
    });

    it('should hit fatal startup catch block (Line 25-28)', async () => {
      const spy = vi.spyOn(appModule, 'buildApp').mockRejectedValueOnce(new Error('Fatal'));
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await serverModule.start();
      expect(exitSpy).toHaveBeenCalledWith(1);
      spy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});
