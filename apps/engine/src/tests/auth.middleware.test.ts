import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateApiKey } from '../middleware/auth.js';
import { db, apiKeys, users } from '@rzuna/database';
import crypto from 'crypto';

// 🏛️ Mock Database & Fastify
const mockQuery = {
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
};

vi.mock('@rzuna/database', () => ({
  db: {
    select: vi.fn(() => mockQuery),
    update: vi.fn(() => mockQuery),
    insert: vi.fn(() => mockQuery),
    transaction: vi.fn(async (cb) => cb(db)),
  },
  apiKeys: { id: 'key_id', keyHash: 'hash', userId: 'user_id', isActive: true },
  users: { id: 'user_id', tier: 'VIP' },
  usageLogs: {},
  treasuryLogs: {},
  eq: vi.fn(),
}));

describe('Auth Middleware (Revenue Integrity)', () => {
  let req: any;
  let reply: any;

  beforeEach(() => {
    req = {
      headers: {},
      url: '/v1/signals',
    };
    reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    vi.clearAllMocks();
  });

  it('should reject requests without API key', async () => {
    await validateApiKey(req, reply);
    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ error: 'MANDATORY_API_KEY_REQUIRED' });
  });

  it('should accept valid API key and log usage', async () => {
    const rawKey = 'rzuna_test_key';
    req.headers['x-api-key'] = rawKey;
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // Simulate key found
    const mockKeyRec = { id: 'key_1', userId: 'user_1', isActive: true, keyHash: hash };
    const mockUserRec = { id: 'user_1', tier: 'VIP' };

    let callCount = 0;
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return [mockKeyRec];
        return [mockUserRec];
      }),
    });

    await validateApiKey(req, reply);

    // Verify usage logging (simplified check)
    expect(db.transaction).toHaveBeenCalled();
    expect(req.apiKey).toEqual(mockKeyRec);
  });

  it('should reject inactive API keys', async () => {
    req.headers['x-api-key'] = 'some_key';
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnValue([{ id: 'key_1', isActive: false }]),
    });

    await validateApiKey(req, reply);
    expect(reply.status).toHaveBeenCalledWith(403);
  });
});
