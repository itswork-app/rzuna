import { InferSelectModel, InferInsertModel, eq, sql, relations, inArray, and, isNotNull } from 'drizzle-orm';
import * as schema from './schema.js';

export { eq, sql, relations, inArray, and, isNotNull };

// Re-export the client
export * from './client.js';

// Re-export the schema
export * from './schema.js';

// 🏛️ RZUNA INFERRED TYPES (Sync with @rzuna/contracts)
export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;

export type Subscription = InferSelectModel<typeof schema.subscriptions>;
export type NewSubscription = InferInsertModel<typeof schema.subscriptions>;

export type Trade = InferSelectModel<typeof schema.trades>;
export type NewTrade = InferInsertModel<typeof schema.trades>;

export type AiQuota = InferSelectModel<typeof schema.aiQuota>;
export type NewAiQuota = InferInsertModel<typeof schema.aiQuota>;

export type TreasuryLog = InferSelectModel<typeof schema.treasuryLogs>;
export type NewTreasuryLog = InferInsertModel<typeof schema.treasuryLogs>;
