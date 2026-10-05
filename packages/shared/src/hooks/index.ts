/**
 * Platform-agnostic hooks for Groupi
 * These hooks work identically on web and mobile platforms
 */

// Authentication hooks
export * from './useAuth';

// Event data hooks
export * from './useEventData';

// Event action hooks
export * from './useEventActions';

// Post data hooks
export * from './usePostData';

// Post action hooks
export * from './usePostActions';

// Type exports
export { createInviteListHooks } from './useInviteLists';

export type { ConvexApi, ConvexDataModel, ConvexId } from './types';

// Combined hook factories for convenience
import { createEventDataHooks } from './useEventData';
import { createEventActionHooks } from './useEventActions';
import type { ConvexApi } from './types';

/**
 * Combined event hooks factory - combines data and action hooks
 * Use this for convenience when you need both queries and mutations
 */
export function createEventHooks(api: ConvexApi) {
  const dataHooks = createEventDataHooks(api);
  const actionHooks = createEventActionHooks(api);

  return {
    ...dataHooks,
    ...actionHooks,
  };
}

export { createGroupHooks } from './useGroups';
export { createEventTransferHooks } from './useEventTransfers';
export { createEventAdmissionHooks } from './useEventAdmission';
export { createGroupInvitationHooks } from './useGroupInvitations';

export { createGroupModerationHooks } from './useGroupModeration';
export { createEventApplicationHooks } from './useEventApplications';
export type {
  ApplicationQuestion,
  ApplicationAnswers,
} from '../utils/application-questions';
export { createGroupTransferHooks } from './useGroupTransfer';
export { createGroupQuestionnaireHooks } from './useGroupQuestionnaire';

export { createGroupApplicationHooks } from './useGroupApplications';
export { createGroupAnnouncementHooks } from './useGroupAnnouncements';
export { announcementRequestId } from '../utils/announcement-request';

export { createAccountResolutionHooks } from './useAccountResolution';
export { AccountResolutionBoundary } from './account-resolution-boundary';

export { createGroupEventAudienceHooks } from './useGroupEventAudiences';

export { createGroupFormHooks } from './useGroupForms';
export { groupFormTemplates } from '../utils/group-form-templates';
