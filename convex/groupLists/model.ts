import { publicPage } from '../lib/pagination';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import { livePerson, requirePerson } from '../groups/model';
import { requireManager } from '../groups/policy';
import { requireGroupMemberContent } from '../groups/contentAccess';
import { getPolicy } from '../groupTools/policy';
import { hash, requestExpiry } from '../lib/requestId';
import {
  contentContext,
  contentCapabilities,
  requireContentCreation,
  requireContentInteraction,
  requireContentManager,
} from '../groupTools/context';
import {
  canAddToList,
  canCompleteEntry,
  fail,
  instance,
  requireConfigureList,
  resolvedOptions,
} from './access';
import {
  cleanupPersonClaims,
  purgeEntryClaims,
  purgeListClaims,
} from './bring';
type ReadCtx = MutationCtx | QueryCtx;
type OptionInput = Pick<
  Doc<'groupLists'>,
  'listType' | 'addPolicy' | 'completionPolicy'
>;
function options(input: OptionInput, previous?: Doc<'groupLists'>) {
  if (
    input.listType !== undefined &&
    !['SIMPLE', 'CHECKLIST', 'BRING'].includes(input.listType)
  )
    fail('VALIDATION_ERROR', 'Invalid list type.');
  if (
    input.addPolicy !== undefined &&
    !['PARTICIPANTS', 'CREATOR_MANAGERS'].includes(input.addPolicy)
  )
    fail('VALIDATION_ERROR', 'Invalid add-item policy.');
  if (
    input.completionPolicy !== undefined &&
    !['PARTICIPANTS', 'AUTHORS', 'CREATOR_MANAGERS'].includes(
      input.completionPolicy
    )
  )
    fail('VALIDATION_ERROR', 'Invalid completion policy.');
  const listType = input.listType ?? previous?.listType ?? 'CHECKLIST';
  return {
    listType,
    addPolicy:
      input.addPolicy ??
      previous?.addPolicy ??
      (!previous && listType === 'BRING' ? 'CREATOR_MANAGERS' : 'PARTICIPANTS'),
    completionPolicy:
      input.completionPolicy ?? previous?.completionPolicy ?? 'PARTICIPANTS',
  };
}
function quantity(value: number | undefined) {
  if (!Number.isInteger(value) || value! < 1 || value! > 999)
    fail(
      'VALIDATION_ERROR',
      'Bring item quantity must be an integer from 1 to 999.'
    );
  return value!;
}
function expectedRevision(value: number) {
  if (!Number.isInteger(value) || value < 1)
    fail('VALIDATION_ERROR', 'Entry revision must be a positive integer.');
}

function text(value: string) {
  const result = value.trim();
  if (!result || result.length > 2000)
    fail('VALIDATION_ERROR', 'Entry text must contain 1–2000 characters.');
  return result;
}
function config(input: { title: string; description?: string }) {
  const title = input.title.trim(),
    description = input.description?.trim() ?? '';
  if (!title || title.length > 100 || description.length > 2000)
    fail(
      'VALIDATION_ERROR',
      'List title must contain 1–100 characters; description at most 2000.'
    );
  return { title, description };
}
function version(current: number, expected: number) {
  if (!Number.isInteger(expected) || expected < 1)
    fail('VALIDATION_ERROR', 'List version must be a positive integer.');
  if (current !== expected)
    fail('CONFLICT', 'List configuration changed. Reload before saving.');
}
function page(input: { numItems: number; cursor: string | null }) {
  if (
    !Number.isInteger(input.numItems) ||
    input.numItems < 1 ||
    input.numItems > 100 ||
    (input.cursor !== null && (!input.cursor || input.cursor.length > 4096))
  )
    fail(
      'VALIDATION_ERROR',
      'Page size must be 1–100; use a nonempty server cursor of at most 4096 characters.'
    );
  return input;
}
export async function create(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    groupId?: Id<'groups'>;
    eventId?: Id<'events'>;
    title: string;
    description?: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
  } & OptionInput
) {
  await requireContentCreation(ctx, personId, input, 'LIST');
  const data = config(input),
    selectedOptions = options(input),
    now = Date.now();
  if (
    selectedOptions.listType === 'BRING' &&
    input.resultsVisibility !== 'MEMBERS'
  )
    fail(
      'VALIDATION_ERROR',
      'Bring lists require shared visibility. Create a separate shared Bring list.'
    );
  const toolId = await ctx.db.insert('groupTools', {
    ...contentContext(input),
    kind: 'LIST',
    ...data,
    resultsVisibility: input.resultsVisibility,
    creatorId: personId,
    createdAt: now,
    updatedAt: now,
  });
  await ctx.db.insert('groupLists', {
    toolId,
    ...contentContext(input),
    ...selectedOptions,
    version: 1,
    updatedAt: now,
  });
  return toolId;
}
export async function get(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>,
  management = false
) {
  const { tool, state } = await instance(ctx, toolId);
  if (management) await requireConfigureList(ctx, personId, tool);
  else await requireContentInteraction(ctx, personId, tool, 'LIST');
  const { canManage } = await contentCapabilities(ctx, personId, tool);
  const canConfigure = canManage || tool.creatorId === personId;
  const hasEntries =
    canConfigure &&
    Boolean(
      tool.resultsVisibility === 'MANAGERS' && !canManage
        ? await ctx.db
            .query('groupListEntries')
            .withIndex('by_toolId_and_personId', q =>
              q.eq('toolId', toolId).eq('personId', personId)
            )
            .first()
        : await ctx.db
            .query('groupListEntries')
            .withIndex('by_toolId', q => q.eq('toolId', toolId))
            .first()
    );
  return {
    ...tool,
    ...resolvedOptions(state),
    version: state.version,
    canManage,
    canConfigure,
    canDelete: canManage,
    canAdd: canAddToList(tool, state, personId, canManage),
    hasEntries,
  };
}
export async function list(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requireGroupMemberContent(ctx, groupId, personId);
  if (!(await getPolicy(ctx, groupId, 'LIST')).enabled)
    await requireManager(ctx, groupId, personId);
  try {
    return publicPage(
      await ctx.db
        .query('groupTools')
        .withIndex('by_groupId_and_kind', q =>
          q.eq('groupId', groupId).eq('kind', 'LIST')
        )
        .order('desc')
        .paginate(page(paginationOpts))
    );
  } catch {
    fail('VALIDATION_ERROR', 'Invalid list page or cursor.');
  }
}
export async function configure(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    toolId: Id<'groupTools'>;
    version: number;
    title: string;
    description?: string;
  } & OptionInput
) {
  const { tool, state } = await instance(ctx, input.toolId);
  await requireConfigureList(ctx, personId, tool);
  version(state.version, input.version);
  const selectedOptions = options(input, state);
  if (
    selectedOptions.listType === 'BRING' &&
    tool.resultsVisibility !== 'MEMBERS'
  )
    fail(
      'VALIDATION_ERROR',
      'Bring lists require shared visibility. Create a separate shared Bring list.'
    );
  if (
    (selectedOptions.listType === 'BRING') !==
    (resolvedOptions(state).listType === 'BRING')
  ) {
    const entry = await ctx.db
      .query('groupListEntries')
      .withIndex('by_toolId', q => q.eq('toolId', tool._id))
      .first();
    const claim = await ctx.db
      .query('groupListClaims')
      .withIndex('by_toolId', q => q.eq('toolId', tool._id))
      .first();
    if (entry || claim)
      fail(
        'CONFLICT',
        'This list contains entries or claims. Create a separate list to change between Bring list and other types; the original is preserved.'
      );
  }
  await ctx.db.patch(tool._id, { ...config(input), updatedAt: Date.now() });
  await ctx.db.patch(state._id, {
    ...selectedOptions,
    version: state.version + 1,
    updatedAt: Date.now(),
  });
  return null;
}
export async function entries(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>,
  paginationOpts: { numItems: number; cursor: string | null },
  ownRecovery = false
) {
  await requirePerson(ctx, personId);
  let ownOnly = ownRecovery;
  let manager = false;
  let current: Awaited<ReturnType<typeof instance>> | undefined;
  if (!ownRecovery) {
    current = await instance(ctx, toolId);
    await requireContentInteraction(ctx, personId, current.tool, 'LIST');
    manager = (await contentCapabilities(ctx, personId, current.tool))
      .canManage;
    ownOnly = current.tool.resultsVisibility === 'MANAGERS' && !manager;
  }
  const query = ownOnly
    ? ctx.db
        .query('groupListEntries')
        .withIndex('by_toolId_and_personId', q =>
          q.eq('toolId', toolId).eq('personId', personId)
        )
    : ctx.db
        .query('groupListEntries')
        .withIndex('by_toolId', q => q.eq('toolId', toolId));
  const names = new Map<string, Promise<string | undefined>>();
  function name(id: Id<'persons'> | undefined) {
    if (!id) return Promise.resolve(undefined);
    if (!names.has(id))
      names.set(
        id,
        livePerson(ctx, id).then(person =>
          person
            ? person.user.name || person.user.username || 'Member'
            : 'Member'
        )
      );
    return names.get(id)!;
  }
  const result = await query.order('desc').paginate(page(paginationOpts));
  return {
    ...publicPage(result),
    page: await Promise.all(
      result.page.map(async row => ({
        ...row,
        canEdit: !ownRecovery && (row.personId === personId || manager),
        canRemove: row.personId === personId || (!ownRecovery && manager),
        canComplete: Boolean(
          current &&
            !ownRecovery &&
            canCompleteEntry(
              current.tool,
              current.state,
              row,
              personId,
              manager
            )
        ),
        addedByName: await name(row.personId),
        completedByName:
          row.completed && !ownRecovery
            ? await name(row.completedById)
            : undefined,
      }))
    ),
  };
}
export async function add(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    toolId: Id<'groupTools'>;
    version: number;
    requestId: string;
    text: string;
    quantity?: number;
  }
) {
  const { tool, state } = await instance(ctx, input.toolId);
  await requireContentInteraction(ctx, personId, tool, 'LIST');
  const manager = (await contentCapabilities(ctx, personId, tool)).canManage;
  if (!canAddToList(tool, state, personId, manager))
    fail('FORBIDDEN', 'Only the list creator and managers can add items.');
  const expiresAt = requestExpiry(
    input.requestId,
    'Inspect your list entries before starting a new request.'
  );
  const fingerprint = await hash({
    version: input.version,
    text: text(input.text),
    ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
  });
  const previous = await ctx.db
    .query('groupListRequests')
    .withIndex('by_toolId_and_personId_and_requestId', q =>
      q
        .eq('toolId', tool._id)
        .eq('personId', personId)
        .eq('requestId', input.requestId)
    )
    .unique();
  if (previous) {
    if (previous.fingerprint !== fingerprint)
      fail(
        'CONFLICT',
        'Request identifier was used with different content. Inspect entries before starting a new request.'
      );
    return {
      entryId: previous.entryId,
      state: (await ctx.db.get(previous.entryId))
        ? ('PRESENT' as const)
        : ('REMOVED' as const),
    };
  }
  version(state.version, input.version);
  const bring = resolvedOptions(state).listType === 'BRING';
  const requiredQuantity = bring ? quantity(input.quantity) : undefined;
  if (!bring && input.quantity !== undefined)
    fail('VALIDATION_ERROR', 'Quantities apply only to Bring lists.');
  const now = Date.now();
  const entryId = await ctx.db.insert('groupListEntries', {
    toolId: tool._id,
    ...contentContext(tool),
    personId,
    actorId: personId,
    listTitle: tool.title,
    text: text(input.text),
    completed: false,
    ...(bring ? { quantity: requiredQuantity, claimedQuantity: 0 } : {}),
    revision: 1,
    createdAt: now,
    updatedAt: now,
  });
  const id = await ctx.db.insert('groupListRequests', {
    toolId: tool._id,
    ...contentContext(tool),
    personId,
    requestId: input.requestId,
    fingerprint,
    entryId,
    expiresAt,
  });
  const scheduledId = await ctx.scheduler.runAfter(
    expiresAt - now,
    internal.groupLists.internal.expireRequest,
    { id }
  );
  await ctx.db.patch(id, { scheduledId });
  return { entryId, state: 'PRESENT' as const };
}
export async function setCompletion(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    entryId: Id<'groupListEntries'>;
    version: number;
    expectedRevision: number;
    completed: boolean;
  }
) {
  const row = await ctx.db.get(input.entryId);
  if (!row) fail('NOT_FOUND', 'List entry not found.');
  const { tool, state } = await instance(ctx, row.toolId);
  await requireContentInteraction(ctx, personId, tool, 'LIST');
  const manager = (await contentCapabilities(ctx, personId, tool)).canManage;
  if (!canCompleteEntry(tool, state, row, personId, manager))
    fail(
      'FORBIDDEN',
      'Completion is unavailable for this item under the current list type and policy.'
    );
  version(state.version, input.version);
  expectedRevision(input.expectedRevision);
  if (row.completed === input.completed) return { revision: row.revision };
  if (row.revision !== input.expectedRevision)
    fail('CONFLICT', 'Entry changed. Reload before completing.');
  await ctx.db.patch(row._id, {
    completed: input.completed,
    completedById: input.completed ? personId : undefined,
    completedAt: input.completed ? Date.now() : undefined,
    actorId: personId,
    revision: row.revision + 1,
    updatedAt: Date.now(),
  });
  return { revision: row.revision + 1 };
}
export async function edit(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    entryId: Id<'groupListEntries'>;
    version: number;
    expectedRevision: number;
    text: string;
    completed: boolean;
    quantity?: number;
  }
) {
  const row = await ctx.db.get(input.entryId);
  if (!row) fail('NOT_FOUND', 'List entry not found.');
  const { tool, state } = await instance(ctx, row.toolId);
  await requireContentInteraction(ctx, personId, tool, 'LIST');
  const manager = (await contentCapabilities(ctx, personId, tool)).canManage;
  if (
    tool.resultsVisibility === 'MANAGERS' &&
    row.personId !== personId &&
    !manager
  )
    fail('FORBIDDEN', 'This private entry is not available.');
  version(state.version, input.version);
  expectedRevision(input.expectedRevision);
  const value = text(input.text);
  const bring = resolvedOptions(state).listType === 'BRING';
  if (!bring && input.quantity !== undefined)
    fail('VALIDATION_ERROR', 'Quantities apply only to Bring lists.');
  const requiredQuantity =
    input.quantity === undefined ? row.quantity : quantity(input.quantity);
  if (bring && (requiredQuantity ?? 0) < (row.claimedQuantity ?? 0))
    fail('CONFLICT', 'Quantity cannot be lower than existing claims.');
  const textChanged = row.text !== value || requiredQuantity !== row.quantity;
  const completionChanged = row.completed !== input.completed;
  if (textChanged && row.personId !== personId && !manager)
    fail(
      'FORBIDDEN',
      'Only the entry author and managers can edit its text or quantity.'
    );
  if (
    completionChanged &&
    !canCompleteEntry(tool, state, row, personId, manager)
  )
    fail(
      'FORBIDDEN',
      'Completion is unavailable for this item under the current list type and policy.'
    );
  if (!textChanged && !completionChanged) {
    if (
      row.personId !== personId &&
      !manager &&
      !canCompleteEntry(tool, state, row, personId, manager)
    )
      fail(
        'FORBIDDEN',
        'This entry cannot be edited under the current list policy.'
      );
    return { revision: row.revision };
  }
  if (row.revision !== input.expectedRevision)
    fail('CONFLICT', 'Entry changed. Reload before editing.');
  await ctx.db.patch(row._id, {
    text: value,
    ...(bring && input.quantity !== undefined
      ? { quantity: requiredQuantity }
      : {}),
    completed: input.completed,
    ...(completionChanged
      ? {
          completedById: input.completed ? personId : undefined,
          completedAt: input.completed ? Date.now() : undefined,
        }
      : {}),
    revision: row.revision + 1,
    actorId: personId,
    updatedAt: Date.now(),
  });
  return { revision: row.revision + 1 };
}
export async function removeEntry(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  entryId: Id<'groupListEntries'>,
  expectedRevision: number
) {
  await requirePerson(ctx, personId);
  const row = await ctx.db.get(entryId);
  if (!row) return null;
  if (row.personId !== personId) {
    const { tool } = await instance(ctx, row.toolId);
    await requireContentInteraction(ctx, personId, tool, 'LIST');
    await requireContentManager(ctx, personId, tool);
  } else {
    const state = await ctx.db
      .query('groupLists')
      .withIndex('by_toolId', q => q.eq('toolId', row.toolId))
      .unique();
    if (state?.listType === 'BRING') {
      // A Bring item also owns other participants' commitments, so the ordinary
      // own-history removal shortcut must not survive lost participation access.
      const { tool } = await instance(ctx, row.toolId);
      await requireContentInteraction(ctx, personId, tool, 'LIST');
    } else if (!state) {
      const orphanedClaim = await ctx.db
        .query('groupListClaims')
        .withIndex('by_entryId', q => q.eq('entryId', entryId))
        .first();
      if (orphanedClaim)
        fail(
          'FORBIDDEN',
          'Current Bring List access is required to remove claimed items.'
        );
    }
  }
  if (!Number.isInteger(expectedRevision) || expectedRevision < 1)
    fail('VALIDATION_ERROR', 'Entry revision must be a positive integer.');
  if (row.revision !== expectedRevision)
    fail('CONFLICT', 'Entry changed. Reload before removing.');
  await purgeEntryClaims(ctx, entryId);
  await ctx.db.delete(entryId);
  return null;
}
export async function remove(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>
) {
  const { tool } = await instance(ctx, toolId);
  await requireContentManager(ctx, personId, tool);
  await purge(ctx, toolId);
  return null;
}
export async function removeRequest(
  ctx: MutationCtx,
  id: Id<'groupListRequests'>
) {
  const row = await ctx.db.get(id);
  if (!row) return;
  if (row.scheduledId) await ctx.scheduler.cancel(row.scheduledId);
  await ctx.db.delete(id);
}
export async function purge(ctx: MutationCtx, toolId: Id<'groupTools'>) {
  await purgeListClaims(ctx, toolId);
  for await (const row of ctx.db
    .query('groupListEntries')
    .withIndex('by_toolId', q => q.eq('toolId', toolId)))
    await ctx.db.delete(row._id);
  for await (const row of ctx.db
    .query('groupListRequests')
    .withIndex('by_toolId', q => q.eq('toolId', toolId)))
    await removeRequest(ctx, row._id);
  const state = await ctx.db
    .query('groupLists')
    .withIndex('by_toolId', q => q.eq('toolId', toolId))
    .unique();
  if (state) await ctx.db.delete(state._id);
  await ctx.db.delete(toolId);
}
export async function cleanupPerson(ctx: MutationCtx, personId: Id<'persons'>) {
  await cleanupPersonClaims(ctx, personId);
  for await (const row of ctx.db
    .query('groupListEntries')
    .withIndex('by_personId', q => q.eq('personId', personId))) {
    const tool = await ctx.db.get(row.toolId);
    if (tool?.resultsVisibility === 'MEMBERS')
      await ctx.db.patch(row._id, {
        personId: undefined,
        ...(row.actorId === personId ? { actorId: undefined } : {}),
        ...(row.completedById === personId ? { completedById: undefined } : {}),
      });
    else {
      await purgeEntryClaims(ctx, row._id);
      await ctx.db.delete(row._id);
    }
  }
  for await (const row of ctx.db
    .query('groupListEntries')
    .withIndex('by_actorId', q => q.eq('actorId', personId)))
    await ctx.db.patch(row._id, { actorId: undefined });
  for await (const row of ctx.db
    .query('groupListEntries')
    .withIndex('by_completedById', q => q.eq('completedById', personId)))
    await ctx.db.patch(row._id, { completedById: undefined });
  for await (const row of ctx.db
    .query('groupListRequests')
    .withIndex('by_personId', q => q.eq('personId', personId)))
    await removeRequest(ctx, row._id);
}
