import { pgTable, uuid, text, numeric, timestamp, boolean, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// 🏛️ RZUNA V22.1 CONSTITUTIONAL ENUMS
export const userRankEnum = pgEnum('user_rank', [
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND',
  'MYTHIC'
]);

export const subStatusEnum = pgEnum('sub_status', [
  'NONE',
  'STARLIGHT',
  'STARLIGHT_PLUS',
  'VIP'
]);

// 👥 USERS TABLE (Formerly Profiles)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: text('wallet_address').notNull().unique(),
  tier: userRankEnum('tier').default('BRONZE').notNull(),
  currentMonthVolume: numeric('current_month_volume', { precision: 20, scale: 8 }).default('0').notNull(),
  totalFeesPaid: numeric('total_fees_paid', { precision: 20, scale: 8 }).default('0').notNull(),
  lastRankReset: timestamp('last_rank_reset', { withTimezone: true }).defaultNow().notNull(),
  telegramId: text('telegram_id'),
  
  // V22.1 Audit & Governance
  isTgEnabled: boolean('is_tg_enabled').default(false).notNull(),
  isBanned: boolean('is_banned').default(false).notNull(),
  auditId: uuid('audit_id').defaultRandom().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 🎟️ SUBSCRIPTIONS TABLE
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tier: userRankEnum('tier').notNull(),
  status: subStatusEnum('status').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  
  auditId: uuid('audit_id').defaultRandom().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 💹 TRADES TABLE
export const trades = pgTable('trades', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  mint: text('mint').notNull(),
  amount: numeric('amount', { precision: 20, scale: 8 }).notNull(),
  pnl: numeric('pnl', { precision: 20, scale: 8 }),
  feePaid: numeric('fee_paid', { precision: 20, scale: 8 }).notNull(),
  type: text('type').notNull(), // 'buy' | 'sell'
  
  auditId: uuid('audit_id').defaultRandom().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 🤖 AI QUOTA TABLE
export const aiQuota = pgTable('ai_quota', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  creditsRemaining: integer('credits_remaining').default(0).notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).defaultNow().notNull(),
  
  auditId: uuid('audit_id').defaultRandom().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 🏦 TREASURY LOGS TABLE
export const treasuryLogs = pgTable('treasury_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: numeric('amount', { precision: 20, scale: 8 }).notNull(),
  source: text('source').notNull(),
  auditId: uuid('audit_id').defaultRandom().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 📡 SCOUTED TOKENS (Preserved from Institutional Schema V1.3)
export const scoutedTokens = pgTable('scouted_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  mintAddress: text('mint_address').notNull().unique(),
  symbol: text('symbol'),
  name: text('name'),
  description: text('description'),
  
  // Enriched Social Metadata (V22.1 Dual-Path)
  twitter: text('twitter'),
  telegram: text('telegram'),
  website: text('website'),

  baseScore: integer('base_score'),
  aiReasoning: text('ai_reasoning'),
  isActive: boolean('is_active').default(true).notNull(),
  isPrivate: boolean('is_private').default(false).notNull(),
  metadata: jsonb('metadata'),
  
  auditId: uuid('audit_id').defaultRandom().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 🔑 API KEYS TABLE (B2B ecosystem)
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  keyHash: text('key_hash').notNull().unique(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  
  auditId: uuid('audit_id').defaultRandom().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 📊 USAGE LOGS TABLE
export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id).notNull(),
  endpoint: text('endpoint').notNull(),
  creditsUsed: integer('credits_used').default(0).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// 🏛️ DRIZZLE RELATIONS (V22.1)
export const usersRelations = relations(users, ({ one, many }) => ({
  aiQuota: one(aiQuota, {
    fields: [users.id],
    references: [aiQuota.userId],
  }),
  subscriptions: many(subscriptions),
  trades: many(trades),
  apiKeys: many(apiKeys),
  usageLogs: many(usageLogs),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  usageLogs: many(usageLogs),
}));

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  user: one(users, {
    fields: [usageLogs.userId],
    references: [users.id],
  }),
  apiKey: one(apiKeys, {
    fields: [usageLogs.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const aiQuotaRelations = relations(aiQuota, ({ one }) => ({
  user: one(users, {
    fields: [aiQuota.userId],
    references: [users.id],
  }),
}));
