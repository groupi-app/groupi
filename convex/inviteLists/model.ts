import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { ConvexError } from 'convex/values';
import { components } from '../_generated/api';
import { checkIsBlocked } from '../lib/privacy';
import type { Doc as AuthDoc } from '../betterAuth/_generated/dataModel';

export async function resolvePeople(
  ctx: QueryCtx | MutationCtx,
  personIds: Id<'persons'>[]
) {
  const people = await Promise.all(
    personIds.map(personId => ctx.db.get(personId))
  );
  const userIds = [
    ...new Set(people.flatMap(person => (person ? [person.userId] : []))),
  ];
  const usersById = new Map<string, AuthDoc<'user'>>();
  // Resolve bounded batches by auth identity, rather than one cross-component
  // function call for every occurrence across the creator's saved lists.
  for (let offset = 0; offset < userIds.length; offset += 100) {
    const users = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'user',
      where: [
        {
          field: '_id',
          operator: 'in',
          value: userIds.slice(offset, offset + 100),
        },
      ],
      paginationOpts: { cursor: null, numItems: 100 },
    });
    for (const user of users.page as AuthDoc<'user'>[])
      usersById.set(user._id, user);
  }
  return personIds.map((personId, index) => {
    const person = people[index];
    const user = person ? usersById.get(person.userId) : undefined;
    return {
      personId,
      name: user?.name ?? null,
      username: user?.username ?? null,
      image: user?.image ?? null,
      available: !!user,
    };
  });
}

function summaryForList(
  list: Doc<'inviteLists'>,
  availablePersonCount: number
) {
  return {
    inviteListId: list._id,
    name: list.name,
    personCount: list.personIds.length,
    availablePersonCount,
    needsAttention: availablePersonCount === 0,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };
}

export async function detailForList(
  ctx: QueryCtx | MutationCtx,
  list: Doc<'inviteLists'>
) {
  const people = await resolvePeople(ctx, list.personIds);
  const availablePersonCount = people.filter(person => person.available).length;
  return {
    ...summaryForList(list, availablePersonCount),
    people,
  };
}

async function validateSelection(
  ctx: MutationCtx,
  creatorId: Id<'persons'>,
  args: { name: string; personIds: Id<'persons'>[] },
  inviteListId?: Id<'inviteLists'>,
  savedPersonIds: Id<'persons'>[] = []
) {
  const name = args.name.trim();
  if (name.length < 1 || name.length > 100)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invite list names must contain 1–100 characters after trimming',
    });
  const normalizedName = name.toLowerCase();
  const duplicate = await ctx.db
    .query('inviteLists')
    .withIndex('by_creator_normalizedName', q =>
      q.eq('creatorId', creatorId).eq('normalizedName', normalizedName)
    )
    .first();
  if (duplicate && duplicate._id !== inviteListId)
    throw new ConvexError({
      code: 'CONFLICT',
      message: 'An invite list with this name already exists',
    });
  const personIds = [...new Set(args.personIds)];
  if (personIds.length === 0)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'An invite list requires at least one existing user',
    });
  if (personIds.length > 100)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'An invite list can contain at most 100 people',
    });
  const people = await resolvePeople(ctx, personIds);
  const savedIds = new Set(savedPersonIds);
  if (
    people.some(person => !person.available && !savedIds.has(person.personId))
  )
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invite lists can contain only existing users',
    });
  if (!people.some(person => person.available))
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Repair this invite list by adding at least one existing user',
    });
  return { name, normalizedName, personIds };
}

export async function createListForPerson(
  ctx: MutationCtx,
  creatorId: Id<'persons'>,
  args: { name: string; personIds: Id<'persons'>[] }
) {
  // REST key validation precedes this mutation. Re-read the current owner in
  // the write transaction so account deletion cannot leave an orphaned list.
  const [creator] = await resolvePeople(ctx, [creatorId]);
  if (!creator.available)
    throw new ConvexError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  const selection = await validateSelection(ctx, creatorId, args);
  // Index range reads and insertion share one transaction. Convex retries
  // conflicting inserts, protecting both the name and creator-local limit.
  const ownedLists = await ctx.db
    .query('inviteLists')
    .withIndex('by_creator', q => q.eq('creatorId', creatorId))
    .take(100);
  if (ownedLists.length >= 100)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'You can create at most 100 invite lists',
    });
  const now = Date.now();
  const inviteListId = await ctx.db.insert('inviteLists', {
    creatorId,
    ...selection,
    createdAt: now,
    updatedAt: now,
  });
  const list = await ctx.db.get(inviteListId);
  return detailForList(ctx, list!);
}

export async function listListsForPerson(
  ctx: QueryCtx,
  creatorId: Id<'persons'>
) {
  const lists = await ctx.db
    .query('inviteLists')
    .withIndex('by_creator', q => q.eq('creatorId', creatorId))
    .order('desc')
    .collect();
  const people = await resolvePeople(ctx, [
    ...new Set(lists.flatMap(list => list.personIds)),
  ]);
  const availablePeople = new Set(
    people.filter(person => person.available).map(person => person.personId)
  );
  return {
    items: lists.map(list =>
      summaryForList(
        list,
        list.personIds.filter(personId => availablePeople.has(personId)).length
      )
    ),
  };
}

export async function requireOwnedList(
  ctx: QueryCtx | MutationCtx,
  creatorId: Id<'persons'>,
  inviteListId: Id<'inviteLists'>
) {
  const list = await ctx.db.get(inviteListId);
  if (!list || list.creatorId !== creatorId)
    throw new ConvexError({
      code: 'NOT_FOUND',
      message: 'Invite list not found',
    });
  return list;
}

export async function getListForPerson(
  ctx: QueryCtx | MutationCtx,
  creatorId: Id<'persons'>,
  inviteListId: Id<'inviteLists'>
) {
  return detailForList(
    ctx,
    await requireOwnedList(ctx, creatorId, inviteListId)
  );
}

export async function updateListForPerson(
  ctx: MutationCtx,
  creatorId: Id<'persons'>,
  args: {
    inviteListId: Id<'inviteLists'>;
    name?: string;
    personIds?: Id<'persons'>[];
  }
) {
  const list = await requireOwnedList(ctx, creatorId, args.inviteListId);
  if (args.name === undefined && args.personIds === undefined)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Provide a name or people to update',
    });
  const selection = await validateSelection(
    ctx,
    creatorId,
    {
      name: args.name ?? list.name,
      personIds: args.personIds ?? list.personIds,
    },
    list._id,
    list.personIds
  );
  await ctx.db.patch(args.inviteListId, {
    ...selection,
    updatedAt: Date.now(),
  });
  return getListForPerson(ctx, creatorId, args.inviteListId);
}

export async function deleteListForPerson(
  ctx: MutationCtx,
  creatorId: Id<'persons'>,
  inviteListId: Id<'inviteLists'>
) {
  await requireOwnedList(ctx, creatorId, inviteListId);
  await ctx.db.delete(inviteListId);
  return { deleted: true as const, inviteListId };
}

/** Owner cleanup shares the account deletion transaction and creator index. */
export async function deleteListsForPerson(
  ctx: MutationCtx,
  creatorId: Id<'persons'>
) {
  const lists = await ctx.db
    .query('inviteLists')
    .withIndex('by_creator', q => q.eq('creatorId', creatorId))
    .collect();
  for (const list of lists) await ctx.db.delete(list._id);
}

export async function searchPeopleForPerson(
  ctx: QueryCtx,
  personId: Id<'persons'>,
  searchTerm: string
) {
  const term = searchTerm.trim().toLowerCase();
  if (term.length < 2) return { items: [] };
  // Match the existing username picker against Better Auth's normalized usernames.
  const matchingUsers = await ctx.runQuery(
    components.betterAuth.adapter.findMany,
    {
      model: 'user',
      where: [{ field: 'username', operator: 'contains', value: term }],
      paginationOpts: { cursor: null, numItems: 20 },
    }
  );
  const results = await Promise.all(
    matchingUsers.page.map(async (user: AuthDoc<'user'>) => {
      const person = await ctx.db
        .query('persons')
        .withIndex('by_user_id', q => q.eq('userId', user._id))
        .first();
      if (
        !person ||
        person._id === personId ||
        (await checkIsBlocked(ctx, personId, person._id))
      )
        return null;
      return {
        personId: person._id,
        name: user.name ?? null,
        username: user.username ?? null,
        image: user.image ?? null,
        available: true as const,
      };
    })
  );
  return {
    items: results.flatMap(result => (result ? [result] : [])).slice(0, 10),
  };
}

export async function friendChoicesForPerson(
  ctx: QueryCtx,
  personId: Id<'persons'>
) {
  const [asRequester, asAddressee] = await Promise.all([
    ctx.db
      .query('friendships')
      .withIndex('by_requester_status', q =>
        q.eq('requesterId', personId).eq('status', 'ACCEPTED')
      )
      .collect(),
    ctx.db
      .query('friendships')
      .withIndex('by_addressee_status', q =>
        q.eq('addresseeId', personId).eq('status', 'ACCEPTED')
      )
      .collect(),
  ]);
  const friendIds = [
    ...new Set([
      ...asRequester.map(friendship => friendship.addresseeId),
      ...asAddressee.map(friendship => friendship.requesterId),
    ]),
  ];
  const visibleFriendIds = await Promise.all(
    friendIds.map(async friendId => {
      if (
        friendId === personId ||
        (await checkIsBlocked(ctx, personId, friendId))
      )
        return null;
      return friendId;
    })
  );
  const friends = await resolvePeople(
    ctx,
    visibleFriendIds.flatMap(friendId => (friendId ? [friendId] : []))
  );
  return {
    items: friends.flatMap(friend =>
      friend.available ? [{ ...friend, available: true as const }] : []
    ),
  };
}
