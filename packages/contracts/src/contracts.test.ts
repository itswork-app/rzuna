import { describe, it, expect } from 'vitest';
import { UserRankSchema, UserRank } from './user.js';

describe('Contracts — Zod Verification', () => {
  it('validates the new AIVO rank system', () => {
    const result = UserRankSchema.safeParse('BRONZE');
    expect(result.success).toBe(true);
    expect(result.data).toBe(UserRank.BRONZE);
  });

  it('rejects legacy rank names', () => {
    const result = UserRankSchema.safeParse('NEWBIE');
    expect(result.success).toBe(false);
  });
});
