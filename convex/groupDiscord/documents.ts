import { v } from 'convex/values';
import schema from '../schema';
export const connectionDocument = v.object({
  _id: v.id('groupDiscordConnections'),
  _creationTime: v.number(),
  ...schema.tables.groupDiscordConnections.validator.fields,
});
export const enrollmentDocument = v.object({
  _id: v.id('groupDiscordEnrollments'),
  _creationTime: v.number(),
  ...schema.tables.groupDiscordEnrollments.validator.fields,
});
export const cleanupDocument = v.object({
  _id: v.id('groupDiscordCleanup'),
  _creationTime: v.number(),
  ...schema.tables.groupDiscordCleanup.validator.fields,
});
export const auditStreamDocument = v.object({
  _id: v.id('groupDiscordAuditStreams'),
  _creationTime: v.number(),
  ...schema.tables.groupDiscordAuditStreams.validator.fields,
});
