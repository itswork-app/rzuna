import { z } from 'zod';

export enum UserRank {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  MYTHIC = 'MYTHIC',
}
export const UserRankSchema = z.nativeEnum(UserRank);

export enum SubscriptionStatus {
  NONE = 'NONE',
  STARLIGHT = 'STARLIGHT',
  STARLIGHT_PLUS = 'STARLIGHT_PLUS',
  VIP = 'VIP',
}
export const SubscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);

export const UserVolumeSchema = z.object({
  currentMonthVolume: z.number(),
  totalFeesPaid: z.number(),
  lastResetDate: z.date().or(z.string().transform((val) => new Date(val))),
});
export type UserVolume = z.infer<typeof UserVolumeSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid().optional(),
  walletAddress: z.string(),
  rank: UserRankSchema,
  rankLevel: z.number().default(1),
  status: SubscriptionStatusSchema,
  volume: UserVolumeSchema,
  createdAt: z.date().or(z.string().transform((val) => new Date(val))),
  lastActiveAt: z.date().or(z.string().transform((val) => new Date(val))),
  isBanned: z.boolean().default(false),
  aiQuotaLimit: z.number(),
  aiQuotaUsed: z.number(),
  tgChatId: z.string().optional(),
  isTgEnabled: z.boolean().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UserTierAccessSchema = z.object({
  hasPrivateTokenAccess: z.boolean(),
  hasAiReasoning: z.boolean(),
  aiReasoningQuota: z.number(),
  priorityLevel: z.number(),
});
export type UserTierAccess = z.infer<typeof UserTierAccessSchema>;
