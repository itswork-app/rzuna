/**
 * 🏛️ CreatorReputationService: In-Memory Blacklist & Reputation Tracker
 * Level 1 component — O(1) lookup, zero latency impact.
 *
 * Tracks creator wallet history across all tokens processed by the engine.
 * Builds a reputation score based on observed behavior patterns.
 */

export interface CreatorProfile {
  wallet: string;
  totalTokensCreated: number;
  rugCount: number; // Tokens where dev dumped or token died < 5min
  washCount: number; // Times caught self-buying
  successCount: number; // Tokens that maintained value
  lastSeen: number; // timestamp
  reputation: 'TRUSTED' | 'NEUTRAL' | 'SUSPICIOUS' | 'BLACKLISTED';
}

export class CreatorReputationService {
  // O(1) lookup — Map is the fastest JS data structure for key-value
  private profiles: Map<string, CreatorProfile> = new Map();

  /**
   * Get reputation for a creator wallet. O(1) time.
   * Returns null if creator is unknown (first-time creator).
   */
  getProfile(wallet: string): CreatorProfile | null {
    if (!wallet || wallet === 'UNKNOWN') return null;
    return this.profiles.get(wallet) || null;
  }

  /**
   * Get L1 score modifier based on creator reputation.
   * Called during calculateInitialScore — must be <0.01ms.
   */
  getScoreModifier(wallet: string): { modifier: number; reputation: string; redFlag?: string } {
    const profile = this.getProfile(wallet);
    if (!profile) return { modifier: 0, reputation: 'UNKNOWN' };

    switch (profile.reputation) {
      case 'BLACKLISTED':
        return { modifier: -50, reputation: 'BLACKLISTED', redFlag: 'CREATOR_BLACKLISTED' };
      case 'SUSPICIOUS':
        return { modifier: -20, reputation: 'SUSPICIOUS', redFlag: 'CREATOR_SUSPICIOUS' };
      case 'TRUSTED':
        return { modifier: +10, reputation: 'TRUSTED' };
      default:
        return { modifier: 0, reputation: 'NEUTRAL' };
    }
  }

  /**
   * Record a new token creation event.
   */
  recordCreation(wallet: string): void {
    if (!wallet || wallet === 'UNKNOWN') return;
    const profile = this.ensureProfile(wallet);
    profile.totalTokensCreated++;
    profile.lastSeen = Date.now();
    this.recalculateReputation(profile);
  }

  /**
   * Record a rugpull event (dev dump detected).
   */
  recordRugpull(wallet: string): void {
    if (!wallet || wallet === 'UNKNOWN') return;
    const profile = this.ensureProfile(wallet);
    profile.rugCount++;
    profile.lastSeen = Date.now();
    this.recalculateReputation(profile);
  }

  /**
   * Record a wash trading event (self-buy detected).
   */
  recordWashTrade(wallet: string): void {
    if (!wallet || wallet === 'UNKNOWN') return;
    const profile = this.ensureProfile(wallet);
    profile.washCount++;
    profile.lastSeen = Date.now();
    this.recalculateReputation(profile);
  }

  /**
   * Record a successful token (maintained value, organic growth).
   */
  recordSuccess(wallet: string): void {
    if (!wallet || wallet === 'UNKNOWN') return;
    const profile = this.ensureProfile(wallet);
    profile.successCount++;
    profile.lastSeen = Date.now();
    this.recalculateReputation(profile);
  }

  /**
   * Recalculate reputation based on behavior history.
   * Rules:
   * - 1 rug → SUSPICIOUS
   * - 2+ rugs → BLACKLISTED
   * - 3+ washes → SUSPICIOUS
   * - 5+ successful tokens, 0 rugs → TRUSTED
   */
  private recalculateReputation(profile: CreatorProfile): void {
    if (profile.rugCount >= 2) {
      profile.reputation = 'BLACKLISTED';
    } else if (profile.rugCount >= 1 || profile.washCount >= 3) {
      profile.reputation = 'SUSPICIOUS';
    } else if (profile.successCount >= 5 && profile.rugCount === 0) {
      profile.reputation = 'TRUSTED';
    } else {
      profile.reputation = 'NEUTRAL';
    }
  }

  private ensureProfile(wallet: string): CreatorProfile {
    let profile = this.profiles.get(wallet);
    if (!profile) {
      profile = {
        wallet,
        totalTokensCreated: 0,
        rugCount: 0,
        washCount: 0,
        successCount: 0,
        lastSeen: Date.now(),
        reputation: 'NEUTRAL',
      };
      this.profiles.set(wallet, profile);
    }
    return profile;
  }

  /** Stats for monitoring */
  getStats() {
    let blacklisted = 0, suspicious = 0, trusted = 0;
    this.profiles.forEach((p) => {
      if (p.reputation === 'BLACKLISTED') blacklisted++;
      else if (p.reputation === 'SUSPICIOUS') suspicious++;
      else if (p.reputation === 'TRUSTED') trusted++;
    });
    return { total: this.profiles.size, blacklisted, suspicious, trusted };
  }
}
