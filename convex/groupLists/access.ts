import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import {
  contentCapabilities,
  requireContentAccess,
} from '../groupTools/context';

type ReadCtx = MutationCtx | QueryCtx;
export function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
export async function instance(ctx: ReadCtx, toolId: Id<'groupTools'>) {
  const tool = await ctx.db.get(toolId);
  const state = await ctx.db
    .query('groupLists')
    .withIndex('by_toolId', q => q.eq('toolId', toolId))
    .unique();
  if (!tool || tool.kind !== 'LIST' || !state)
    fail('NOT_FOUND', 'Group list not found.');
  return { tool, state };
}
export function resolvedOptions(
  state: Pick<Doc<'groupLists'>, 'listType' | 'addPolicy' | 'completionPolicy'>
) {
  return {
    listType: state.listType ?? 'CHECKLIST',
    addPolicy: state.addPolicy ?? 'PARTICIPANTS',
    completionPolicy: state.completionPolicy ?? 'PARTICIPANTS',
  };
}
export function canAddToList(
  tool: Doc<'groupTools'>,
  state: Doc<'groupLists'>,
  personId: Id<'persons'>,
  manager: boolean
) {
  return (
    manager ||
    resolvedOptions(state).addPolicy === 'PARTICIPANTS' ||
    tool.creatorId === personId
  );
}
export function canCompleteEntry(
  tool: Doc<'groupTools'>,
  state: Doc<'groupLists'>,
  row: Doc<'groupListEntries'>,
  personId: Id<'persons'>,
  manager: boolean
) {
  if (resolvedOptions(state).listType !== 'CHECKLIST') return false;
  if (manager) return true;
  if (tool.resultsVisibility === 'MANAGERS') return row.personId === personId;
  const policy = resolvedOptions(state).completionPolicy;
  return (
    policy === 'PARTICIPANTS' ||
    (policy === 'AUTHORS'
      ? row.personId === personId
      : tool.creatorId === personId)
  );
}
export async function requireConfigureList(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  tool: Doc<'groupTools'>
) {
  await requireContentAccess(ctx, personId, tool);
  const capabilities = await contentCapabilities(ctx, personId, tool);
  if (!capabilities.canManage && tool.creatorId !== personId)
    fail(
      'FORBIDDEN',
      'Only the current list creator and managers can edit list settings.'
    );
  return capabilities;
}
