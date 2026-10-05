import { removeAudiencesForGroup } from '../groupEventAudiences/cleanup';

import { removeToolsForGroup } from '../groupTools/cleanup';
import { removeAnnouncementsForGroup } from '../groupAnnouncements/cleanup';
import { removeApplicationsForGroup } from '../groupApplications/cleanup';
import { removeQuestionnairesForGroup } from '../groupQuestionnaires/cleanup';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { removeInvitationsForGroup } from '../groupInvites/cleanup';
import { removeModerationForGroup } from '../groupModeration/cleanup';
import { removeTransfersForGroup } from '../groupTransfers/cleanup';
/** All Group-producing slices extend this atomic retirement boundary. Independent Events are not Group data. */
export async function cascadeDeleteGroupData(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for await (const membership of ctx.db
    .query('groupMemberships')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await ctx.db.delete(membership._id);
  await removeToolsForGroup(ctx, groupId);
  await removeInvitationsForGroup(ctx, groupId);
  await removeAudiencesForGroup(ctx, groupId);
  await removeModerationForGroup(ctx, groupId);
  await removeTransfersForGroup(ctx, groupId);
  await removeQuestionnairesForGroup(ctx, groupId);
  await removeApplicationsForGroup(ctx, groupId);
  await removeAnnouncementsForGroup(ctx, groupId);
  await ctx.db.delete(groupId);
}
