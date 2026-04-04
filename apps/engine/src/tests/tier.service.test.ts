import { describe, it, expect } from 'vitest';
import { TierService, B2BTier } from '../core/tiers/tier.service.js';

describe('TierService (The Nerve)', () => {
  const service = new TierService();

  it('should return correct limits for NONE tier', () => {
    const limits = service.getLimits('NONE');
    expect(limits.rpm).toBe(1);
    expect(limits.creditsPerSignal).toBe(10);
    expect(limits.feePercentage).toBe(2.0);
    expect(limits.hasJitoAccess).toBe(false);
  });

  it('should return correct limits for STARLIGHT tier', () => {
    const limits = service.getLimits('STARLIGHT');
    expect(limits.rpm).toBe(10);
    expect(limits.creditsPerSignal).toBe(1);
    expect(limits.feePercentage).toBe(1.5);
  });

  it('should return correct limits for VIP tier', () => {
    const limits = service.getLimits('VIP');
    expect(limits.rpm).toBe(1000);
    expect(limits.hasJitoAccess).toBe(true);
    expect(limits.feePercentage).toBe(0.5);
  });

  it('SHOULD return default limit for unrecognized tier', () => {
    const limits = service.getLimits('INVALID_TIER');
    expect(limits.rpm).toBe(1);
    expect(limits.feePercentage).toBe(2.0);
  });

  it('SHOULD return default limit for empty tier', () => {
    const limits = service.getLimits('');
    expect(limits.rpm).toBe(1);
  });

  it('should calculate correct institutional fees', () => {
    const amount = 1000;

    // VIP: 0.5%
    expect(service.calculateFee('VIP' as any, amount)).toBe(5);

    // STARLIGHT: 1.5%
    expect(service.calculateFee('STARLIGHT' as any, amount)).toBe(15);

    // NONE: 2.0%
    expect(service.calculateFee('NONE' as any, amount)).toBe(20);
  });
});
