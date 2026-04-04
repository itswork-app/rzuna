import { IntelligenceEngine } from './core/engine.js';
import { RankService } from './core/services/rank.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    engine: IntelligenceEngine;
    rankService: RankService;
    logAlpha: (data: any) => Promise<void>;
  }
}
