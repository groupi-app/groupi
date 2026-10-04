import { z } from '@hono/zod-openapi';
export const GroupInviteStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
]);
export const GroupPersonSchema = z.object({
  personId: z.string(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  image: z.string().nullable(),
});
export const GroupInviteSchema = z.object({
  inviteId: z.string(),
  status: GroupInviteStatusSchema,
  createdAt: z.number(),
  respondedAt: z.number().nullable(),
  group: z.object({
    groupId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    image: z.string().nullable(),
  }),
  inviter: GroupPersonSchema,
  invitee: GroupPersonSchema,
  available: z.boolean(),
  canBan: z.boolean(),
});
export const GroupMemberSchema = GroupPersonSchema.extend({
  role: z.enum(['OWNER', 'MODERATOR', 'MEMBER']),
  joinedAt: z.number(),
  canRemove: z.boolean(),
  canBan: z.boolean(),
  canChangeRole: z.boolean(),
});
export const GroupPageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().max(4096).optional(),
});
export const GroupInvitePageQuerySchema = GroupPageQuerySchema.extend({
  status: GroupInviteStatusSchema.optional(),
});
