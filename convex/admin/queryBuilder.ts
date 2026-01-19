import { query, QueryCtx } from '../_generated/server';
import { v } from 'convex/values';
import {
  getCurrentPerson,
  isAdmin,
  authComponent,
  ExtendedAuthUser,
  AuthUserId,
} from '../auth';

/**
 * Admin Query Builder
 *
 * Provides a flexible query endpoint for the admin Query Builder feature.
 * Supports filtering, sorting, and relationship-based queries.
 */

/**
 * Check if current user has admin privileges
 */
async function requireAdmin(ctx: QueryCtx) {
  const currentPerson = await getCurrentPerson(ctx);
  if (!currentPerson) {
    throw new Error('Authentication required');
  }

  const admin = await isAdmin(ctx);
  if (!admin) {
    throw new Error('Admin privileges required');
  }

  return currentPerson;
}

/**
 * Helper to get user info using Better Auth component
 */
async function getUserInfo(ctx: QueryCtx, userId: string) {
  try {
    const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
    if (!user) return null;

    const extendedUser = user as ExtendedAuthUser;
    return {
      name: extendedUser.name || null,
      email: extendedUser.email,
      image: extendedUser.image || null,
      username: extendedUser.username || null,
      role: extendedUser.role || null,
    };
  } catch {
    return null;
  }
}

// Define filter operators
const filterOperators = v.union(
  v.literal('equals'),
  v.literal('not_equals'),
  v.literal('contains'),
  v.literal('not_contains'),
  v.literal('starts_with'),
  v.literal('ends_with'),
  v.literal('gt'),
  v.literal('gte'),
  v.literal('lt'),
  v.literal('lte'),
  v.literal('is_empty'),
  v.literal('is_not_empty'),
  v.literal('is'),
  v.literal('is_not')
);

// Define a single filter condition
const filterCondition = v.object({
  field: v.string(),
  operator: filterOperators,
  value: v.optional(v.any()),
});

// Define filter group (AND/OR logic)
const filterGroup = v.object({
  logic: v.union(v.literal('AND'), v.literal('OR')),
  conditions: v.array(filterCondition),
});

/**
 * Execute a dynamic query based on the query builder parameters
 */
export const executeQuery = query({
  args: {
    entity: v.union(
      v.literal('users'),
      v.literal('events'),
      v.literal('posts'),
      v.literal('replies'),
      v.literal('memberships')
    ),
    filters: v.optional(v.array(filterGroup)),
    sortField: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const {
      entity,
      filters,
      sortField,
      sortDirection = 'desc',
      cursor,
      limit = 100,
    } = args;

    // Dispatch to entity-specific handler
    switch (entity) {
      case 'users':
        return executeUsersQuery(ctx, {
          filters,
          sortField,
          sortDirection,
          cursor,
          limit,
        });
      case 'events':
        return executeEventsQuery(ctx, {
          filters,
          sortField,
          sortDirection,
          cursor,
          limit,
        });
      case 'posts':
        return executePostsQuery(ctx, {
          filters,
          sortField,
          sortDirection,
          cursor,
          limit,
        });
      case 'replies':
        return executeRepliesQuery(ctx, {
          filters,
          sortField,
          sortDirection,
          cursor,
          limit,
        });
      case 'memberships':
        return executeMembershipsQuery(ctx, {
          filters,
          sortField,
          sortDirection,
          cursor,
          limit,
        });
      default:
        throw new Error(`Unknown entity: ${entity}`);
    }
  },
});

type FilterGroup = {
  logic: 'AND' | 'OR';
  conditions: {
    field: string;
    operator: string;
    value?: unknown;
  }[];
};

type QueryParams = {
  filters?: FilterGroup[];
  sortField?: string;
  sortDirection: 'asc' | 'desc';
  cursor?: string;
  limit: number;
};

/**
 * Apply filter conditions to a record
 */
function applyFilters(
  record: Record<string, unknown>,
  filters?: FilterGroup[],
  debug = false
): boolean {
  if (!filters || filters.length === 0) return true;

  return filters.every(group => {
    const results = group.conditions.map(condition => {
      const fieldValue = record[condition.field];
      const result = evaluateCondition(
        fieldValue,
        condition.operator,
        condition.value
      );
      if (debug) {
        console.log(
          `Condition: ${condition.field} ${condition.operator} ${condition.value}`
        );
        console.log(`  Field value:`, fieldValue);
        console.log(`  Result:`, result);
      }
      return result;
    });

    const finalResult =
      group.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
    if (debug) {
      console.log(
        `Group logic: ${group.logic}, results:`,
        results,
        `final:`,
        finalResult
      );
    }
    return finalResult;
  });
}

/**
 * Evaluate a single filter condition
 */
function evaluateCondition(
  fieldValue: unknown,
  operator: string,
  filterValue: unknown
): boolean {
  const strValue = String(fieldValue ?? '').toLowerCase();
  const strFilter = String(filterValue ?? '').toLowerCase();

  switch (operator) {
    case 'equals':
      return fieldValue === filterValue || strValue === strFilter;
    case 'not_equals':
      return fieldValue !== filterValue && strValue !== strFilter;
    case 'contains':
      return strValue.includes(strFilter);
    case 'not_contains':
      return !strValue.includes(strFilter);
    case 'starts_with':
      return strValue.startsWith(strFilter);
    case 'ends_with':
      return strValue.endsWith(strFilter);
    case 'gt':
      return typeof fieldValue === 'number' && typeof filterValue === 'number'
        ? fieldValue > filterValue
        : strValue > strFilter;
    case 'gte':
      return typeof fieldValue === 'number' && typeof filterValue === 'number'
        ? fieldValue >= filterValue
        : strValue >= strFilter;
    case 'lt':
      return typeof fieldValue === 'number' && typeof filterValue === 'number'
        ? fieldValue < filterValue
        : strValue < strFilter;
    case 'lte':
      return typeof fieldValue === 'number' && typeof filterValue === 'number'
        ? fieldValue <= filterValue
        : strValue <= strFilter;
    case 'is_empty':
      return (
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );
    case 'is_not_empty':
      return (
        fieldValue !== null &&
        fieldValue !== undefined &&
        fieldValue !== '' &&
        (!Array.isArray(fieldValue) || fieldValue.length > 0)
      );
    // Relationship operators - fieldValue is an array of matching entity IDs
    case 'is':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(String(filterValue));
      }
      return String(fieldValue) === String(filterValue);
    case 'is_not':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(String(filterValue));
      }
      return String(fieldValue) !== String(filterValue);
    default:
      return true;
  }
}

/**
 * Sort records by field
 */
function sortRecords<T extends Record<string, unknown>>(
  records: T[],
  sortField?: string,
  sortDirection: 'asc' | 'desc' = 'desc'
): T[] {
  if (!sortField) return records;

  return [...records].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison =
      typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));

    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

/**
 * Paginate records
 */
function paginateRecords<T>(
  records: T[],
  cursor?: string,
  limit: number = 100
): { page: T[]; nextCursor?: string; hasMore: boolean; totalCount: number } {
  const startIndex = cursor ? parseInt(cursor) : 0;
  const page = records.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < records.length;
  const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

  return { page, nextCursor, hasMore, totalCount: records.length };
}

/**
 * Execute query for users entity
 */
async function executeUsersQuery(ctx: QueryCtx, params: QueryParams) {
  const allPersons = await ctx.db.query('persons').collect();
  const allMemberships = await ctx.db.query('memberships').collect();
  const allPosts = await ctx.db.query('posts').collect();
  const allReplies = await ctx.db.query('replies').collect();

  // Pre-compute relationship data for all users
  // Build maps from personId to their relationships
  const personEventMap = new Map<string, Set<string>>(); // personId -> Set of eventIds
  const eventPersonMap = new Map<string, Set<string>>(); // eventId -> Set of personIds

  for (const membership of allMemberships) {
    const personIdStr = membership.personId.toString();
    const eventIdStr = membership.eventId.toString();

    if (!personEventMap.has(personIdStr)) {
      personEventMap.set(personIdStr, new Set());
    }
    personEventMap.get(personIdStr)!.add(eventIdStr);

    if (!eventPersonMap.has(eventIdStr)) {
      eventPersonMap.set(eventIdStr, new Set());
    }
    eventPersonMap.get(eventIdStr)!.add(personIdStr);
  }

  // Build map from personId to events they posted in
  const personPostedInEventMap = new Map<string, Set<string>>();
  for (const post of allPosts) {
    const personIdStr = post.authorId.toString();
    const eventIdStr = post.eventId.toString();
    if (!personPostedInEventMap.has(personIdStr)) {
      personPostedInEventMap.set(personIdStr, new Set());
    }
    personPostedInEventMap.get(personIdStr)!.add(eventIdStr);
  }

  // Build map from personId to personIds they replied to (based on post authorship)
  const personRepliedToMap = new Map<string, Set<string>>();
  const postAuthorMap = new Map<string, string>(); // postId -> authorId
  for (const post of allPosts) {
    postAuthorMap.set(post._id.toString(), post.authorId.toString());
  }
  for (const reply of allReplies) {
    const replierIdStr = reply.authorId.toString();
    const postIdStr = reply.postId.toString();
    const postAuthorId = postAuthorMap.get(postIdStr);
    if (postAuthorId && postAuthorId !== replierIdStr) {
      if (!personRepliedToMap.has(replierIdStr)) {
        personRepliedToMap.set(replierIdStr, new Set());
      }
      personRepliedToMap.get(replierIdStr)!.add(postAuthorId);
    }
  }

  // Get all user data with relationship fields
  let usersWithData = await Promise.all(
    allPersons.map(async person => {
      const user = await getUserInfo(ctx, person.userId);
      if (!user) return null;

      const personIdStr = person._id.toString();
      const membershipCount = personEventMap.get(personIdStr)?.size || 0;

      // Compute relationship data for this user
      // rel_inEventWith: list of personIds who share events with this user
      const sharedEventPersons: string[] = [];
      const userEvents = personEventMap.get(personIdStr) || new Set();
      for (const eventId of userEvents) {
        const eventPersons = eventPersonMap.get(eventId) || new Set();
        for (const otherPersonId of eventPersons) {
          if (
            otherPersonId !== personIdStr &&
            !sharedEventPersons.includes(otherPersonId)
          ) {
            sharedEventPersons.push(otherPersonId);
          }
        }
      }

      // rel_memberOfEvent: list of eventIds this user is a member of
      const memberOfEvents = Array.from(userEvents);

      // rel_postedInEvent: list of eventIds this user has posted in
      const postedInEvents = Array.from(
        personPostedInEventMap.get(personIdStr) || new Set()
      );

      // rel_repliedToUser: list of personIds whose posts this user has replied to
      const repliedToUsers = Array.from(
        personRepliedToMap.get(personIdStr) || new Set()
      );

      return {
        id: person.userId,
        personId: person._id,
        name: user.name,
        email: user.email,
        username: user.username,
        image: user.image,
        role: user.role || 'user',
        bio: person.bio || null,
        lastSeen: person.lastSeen || null,
        createdAt: person._creationTime,
        membershipCount,
        // Relationship fields - arrays of IDs that match each relationship
        rel_inEventWith: sharedEventPersons,
        rel_memberOfEvent: memberOfEvents,
        rel_postedInEvent: postedInEvents,
        rel_repliedToUser: repliedToUsers,
      };
    })
  );

  // Filter out null values
  let filtered = usersWithData.filter(
    (u): u is NonNullable<typeof u> => u !== null
  );

  // Apply all filters (including relationship conditions with OR logic)
  // Debug: log filter evaluation
  if (filtered.length > 0 && params.filters && params.filters.length > 0) {
    console.log('=== DEBUG: Filter conditions ===');
    console.log('Filters:', JSON.stringify(params.filters, null, 2));

    // Find users who might match the relationship filter
    const relCondition = params.filters[0]?.conditions.find(c =>
      c.field.startsWith('rel_')
    );
    if (relCondition) {
      console.log(
        'Looking for users with',
        relCondition.field,
        'containing',
        relCondition.value
      );
      const matchingUsers = filtered.filter(u => {
        const fieldVal = u[relCondition.field as keyof typeof u];
        if (Array.isArray(fieldVal)) {
          return fieldVal.includes(String(relCondition.value));
        }
        return false;
      });
      console.log(
        'Users matching relationship condition:',
        matchingUsers.map(u => ({
          name: u.name,
          personId: u.personId,
          [relCondition.field]: u[relCondition.field as keyof typeof u],
        }))
      );
    }

    // Test evaluation for all users
    for (const user of filtered.slice(0, 3)) {
      console.log(
        '--- Evaluating user:',
        user.name,
        'personId:',
        user.personId
      );
      console.log('    rel_inEventWith:', user.rel_inEventWith);
      applyFilters(user as Record<string, unknown>, params.filters, true);
    }
  }
  filtered = filtered.filter(u =>
    applyFilters(u as Record<string, unknown>, params.filters)
  );

  // Sort
  const sorted = sortRecords(
    filtered,
    params.sortField || 'createdAt',
    params.sortDirection
  );

  // Paginate
  const { page, nextCursor, hasMore, totalCount } = paginateRecords(
    sorted,
    params.cursor,
    params.limit
  );

  return {
    results: page,
    totalCount,
    nextCursor,
    hasMore,
  };
}

/**
 * Execute query for events entity
 */
async function executeEventsQuery(ctx: QueryCtx, params: QueryParams) {
  const allEvents = await ctx.db.query('events').collect();
  const allMemberships = await ctx.db.query('memberships').collect();
  const allPosts = await ctx.db.query('posts').collect();

  // Build maps for relationship data
  const eventMemberMap = new Map<string, Set<string>>(); // eventId -> Set of personIds
  const eventPostersMap = new Map<string, Set<string>>(); // eventId -> Set of personIds who posted

  for (const membership of allMemberships) {
    const eventIdStr = membership.eventId.toString();
    const personIdStr = membership.personId.toString();
    if (!eventMemberMap.has(eventIdStr)) {
      eventMemberMap.set(eventIdStr, new Set());
    }
    eventMemberMap.get(eventIdStr)!.add(personIdStr);
  }

  for (const post of allPosts) {
    const eventIdStr = post.eventId.toString();
    const personIdStr = post.authorId.toString();
    if (!eventPostersMap.has(eventIdStr)) {
      eventPostersMap.set(eventIdStr, new Set());
    }
    eventPostersMap.get(eventIdStr)!.add(personIdStr);
  }

  let eventsWithData = await Promise.all(
    allEvents.map(async event => {
      const creator = await ctx.db.get(event.creatorId);
      const creatorUser = creator
        ? await getUserInfo(ctx, creator.userId)
        : null;

      const eventIdStr = event._id.toString();
      const members = eventMemberMap.get(eventIdStr) || new Set();
      const posters = eventPostersMap.get(eventIdStr) || new Set();

      return {
        id: event._id,
        title: event.title,
        description: event.description || null,
        location: event.location || null,
        chosenDateTime: event.chosenDateTime || null,
        timezone: event.timezone,
        creatorId: event.creatorId,
        createdAt: event._creationTime,
        creatorName: creatorUser?.name || null,
        creatorEmail: creatorUser?.email || null,
        memberCount: members.size,
        postCount: posters.size,
        // Relationship fields
        rel_createdByUser: [event.creatorId.toString()],
        rel_hasMember: Array.from(members),
        rel_hasPostsByUser: Array.from(posters),
      };
    })
  );

  // Apply all filters (including relationship conditions with OR logic)
  let filtered = eventsWithData.filter(e =>
    applyFilters(e as Record<string, unknown>, params.filters)
  );

  // Sort
  const sorted = sortRecords(
    filtered,
    params.sortField || 'createdAt',
    params.sortDirection
  );

  // Paginate
  const { page, nextCursor, hasMore, totalCount } = paginateRecords(
    sorted,
    params.cursor,
    params.limit
  );

  return {
    results: page,
    totalCount,
    nextCursor,
    hasMore,
  };
}

/**
 * Execute query for posts entity
 */
async function executePostsQuery(ctx: QueryCtx, params: QueryParams) {
  const allPosts = await ctx.db.query('posts').collect();
  const allReplies = await ctx.db.query('replies').collect();

  // Build map of postId to replier personIds
  const postRepliersMap = new Map<string, Set<string>>();
  for (const reply of allReplies) {
    const postIdStr = reply.postId.toString();
    const personIdStr = reply.authorId.toString();
    if (!postRepliersMap.has(postIdStr)) {
      postRepliersMap.set(postIdStr, new Set());
    }
    postRepliersMap.get(postIdStr)!.add(personIdStr);
  }

  let postsWithData = await Promise.all(
    allPosts.map(async post => {
      const [author, event] = await Promise.all([
        ctx.db.get(post.authorId),
        ctx.db.get(post.eventId),
      ]);

      const authorUser = author ? await getUserInfo(ctx, author.userId) : null;
      const postIdStr = post._id.toString();
      const repliers = postRepliersMap.get(postIdStr) || new Set();

      return {
        id: post._id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        eventId: post.eventId,
        createdAt: post._creationTime,
        authorName: authorUser?.name || null,
        authorEmail: authorUser?.email || null,
        eventTitle: event?.title || null,
        replyCount: repliers.size,
        // Relationship fields
        rel_inEvent: [post.eventId.toString()],
        rel_byUser: [post.authorId.toString()],
        rel_hasRepliesByUser: Array.from(repliers),
      };
    })
  );

  // Apply all filters (including relationship conditions with OR logic)
  let filtered = postsWithData.filter(p =>
    applyFilters(p as Record<string, unknown>, params.filters)
  );

  // Sort
  const sorted = sortRecords(
    filtered,
    params.sortField || 'createdAt',
    params.sortDirection
  );

  // Paginate
  const { page, nextCursor, hasMore, totalCount } = paginateRecords(
    sorted,
    params.cursor,
    params.limit
  );

  return {
    results: page,
    totalCount,
    nextCursor,
    hasMore,
  };
}

/**
 * Execute query for replies entity
 */
async function executeRepliesQuery(ctx: QueryCtx, params: QueryParams) {
  const allReplies = await ctx.db.query('replies').collect();

  let repliesWithData = await Promise.all(
    allReplies.map(async reply => {
      const [author, post] = await Promise.all([
        ctx.db.get(reply.authorId),
        ctx.db.get(reply.postId),
      ]);

      const authorUser = author ? await getUserInfo(ctx, author.userId) : null;
      const event = post ? await ctx.db.get(post.eventId) : null;

      return {
        id: reply._id,
        text: reply.text,
        authorId: reply.authorId,
        postId: reply.postId,
        eventId: post?.eventId || null,
        postAuthorId: post?.authorId || null,
        createdAt: reply._creationTime,
        authorName: authorUser?.name || null,
        authorEmail: authorUser?.email || null,
        postTitle: post?.title || null,
        eventTitle: event?.title || null,
        // Relationship fields
        rel_byUser: [reply.authorId.toString()],
        rel_inEvent: post?.eventId ? [post.eventId.toString()] : [],
        rel_toPostsByUser: post?.authorId ? [post.authorId.toString()] : [],
        rel_onPost: [reply.postId.toString()],
      };
    })
  );

  // Apply all filters (including relationship conditions with OR logic)
  let filtered = repliesWithData.filter(r =>
    applyFilters(r as Record<string, unknown>, params.filters)
  );

  // Sort
  const sorted = sortRecords(
    filtered,
    params.sortField || 'createdAt',
    params.sortDirection
  );

  // Paginate
  const { page, nextCursor, hasMore, totalCount } = paginateRecords(
    sorted,
    params.cursor,
    params.limit
  );

  return {
    results: page,
    totalCount,
    nextCursor,
    hasMore,
  };
}

/**
 * Execute query for memberships entity
 */
async function executeMembershipsQuery(ctx: QueryCtx, params: QueryParams) {
  const allMemberships = await ctx.db.query('memberships').collect();

  const membershipsWithData = await Promise.all(
    allMemberships.map(async membership => {
      const [person, event] = await Promise.all([
        ctx.db.get(membership.personId),
        ctx.db.get(membership.eventId),
      ]);

      const user = person ? await getUserInfo(ctx, person.userId) : null;

      return {
        id: membership._id,
        role: membership.role,
        rsvpStatus: membership.rsvpStatus,
        personId: membership.personId,
        eventId: membership.eventId,
        createdAt: membership._creationTime,
        personName: user?.name || null,
        personEmail: user?.email || null,
        eventTitle: event?.title || null,
        // Relationship fields
        rel_forUser: [membership.personId.toString()],
        rel_forEvent: [membership.eventId.toString()],
      };
    })
  );

  // Apply all filters (including relationship conditions with OR logic)
  let filtered = membershipsWithData.filter(m =>
    applyFilters(m as Record<string, unknown>, params.filters)
  );

  // Sort
  const sorted = sortRecords(
    filtered,
    params.sortField || 'role',
    params.sortDirection
  );

  // Paginate
  const { page, nextCursor, hasMore, totalCount } = paginateRecords(
    sorted,
    params.cursor,
    params.limit
  );

  return {
    results: page,
    totalCount,
    nextCursor,
    hasMore,
  };
}

/**
 * Get available fields for an entity (for the Query Builder UI)
 */
export const getEntityFields = query({
  args: {
    entity: v.union(
      v.literal('users'),
      v.literal('events'),
      v.literal('posts'),
      v.literal('replies'),
      v.literal('memberships')
    ),
  },
  handler: async (ctx, { entity }) => {
    await requireAdmin(ctx);

    // Field type definition with optional relationship metadata
    type FieldDef = {
      name: string;
      type: 'string' | 'number' | 'datetime' | 'relationship';
      label: string;
      entityType?: 'user' | 'event' | 'post';
      relationshipKey?: string;
      description?: string;
    };

    const fieldDefinitions: Record<string, FieldDef[]> = {
      users: [
        { name: 'name', type: 'string', label: 'Name' },
        { name: 'email', type: 'string', label: 'Email' },
        { name: 'username', type: 'string', label: 'Username' },
        { name: 'role', type: 'string', label: 'Role' },
        { name: 'bio', type: 'string', label: 'Bio' },
        { name: 'createdAt', type: 'datetime', label: 'Created At' },
        { name: 'lastSeen', type: 'datetime', label: 'Last Seen' },
        { name: 'membershipCount', type: 'number', label: 'Event Count' },
        // Relationship filters (use "isn't" operator for negation)
        {
          name: 'rel_inEventWith',
          type: 'relationship',
          label: 'In event with',
          entityType: 'user',
          relationshipKey: 'inEventWith',
          description: 'Users who share an event',
        },
        {
          name: 'rel_memberOfEvent',
          type: 'relationship',
          label: 'Member of event',
          entityType: 'event',
          relationshipKey: 'memberOfEvent',
          description: 'Users in specific event',
        },
        {
          name: 'rel_postedInEvent',
          type: 'relationship',
          label: 'Posted in event',
          entityType: 'event',
          relationshipKey: 'postedInEvent',
          description: 'Users who posted in event',
        },
        {
          name: 'rel_repliedToUser',
          type: 'relationship',
          label: 'Replied to user',
          entityType: 'user',
          relationshipKey: 'repliedToUser',
          description: "Users who replied to user's posts",
        },
      ],
      events: [
        { name: 'title', type: 'string', label: 'Title' },
        { name: 'description', type: 'string', label: 'Description' },
        { name: 'location', type: 'string', label: 'Location' },
        { name: 'timezone', type: 'string', label: 'Timezone' },
        { name: 'chosenDateTime', type: 'datetime', label: 'Chosen Date' },
        { name: 'createdAt', type: 'datetime', label: 'Created At' },
        { name: 'creatorName', type: 'string', label: 'Creator Name' },
        { name: 'memberCount', type: 'number', label: 'Member Count' },
        { name: 'postCount', type: 'number', label: 'Post Count' },
        // Relationship filters
        {
          name: 'rel_createdByUser',
          type: 'relationship',
          label: 'Created by',
          entityType: 'user',
          relationshipKey: 'createdByUser',
          description: 'Events created by user',
        },
        {
          name: 'rel_hasMember',
          type: 'relationship',
          label: 'Has member',
          entityType: 'user',
          relationshipKey: 'hasMember',
          description: 'Events with specific member',
        },
        {
          name: 'rel_hasPostsByUser',
          type: 'relationship',
          label: 'Has posts by',
          entityType: 'user',
          relationshipKey: 'hasPostsByUser',
          description: 'Events with posts from user',
        },
      ],
      posts: [
        { name: 'title', type: 'string', label: 'Title' },
        { name: 'content', type: 'string', label: 'Content' },
        { name: 'createdAt', type: 'datetime', label: 'Created At' },
        { name: 'authorName', type: 'string', label: 'Author Name' },
        { name: 'authorEmail', type: 'string', label: 'Author Email' },
        { name: 'eventTitle', type: 'string', label: 'Event Title' },
        { name: 'replyCount', type: 'number', label: 'Reply Count' },
        // Relationship filters
        {
          name: 'rel_inEvent',
          type: 'relationship',
          label: 'In event',
          entityType: 'event',
          relationshipKey: 'inEvent',
          description: 'Posts in specific event',
        },
        {
          name: 'rel_byUser',
          type: 'relationship',
          label: 'By user',
          entityType: 'user',
          relationshipKey: 'byUser',
          description: 'Posts by specific user',
        },
        {
          name: 'rel_hasRepliesByUser',
          type: 'relationship',
          label: 'Has replies by',
          entityType: 'user',
          relationshipKey: 'hasRepliesByUser',
          description: 'Posts with replies from user',
        },
      ],
      replies: [
        { name: 'text', type: 'string', label: 'Text' },
        { name: 'createdAt', type: 'datetime', label: 'Created At' },
        { name: 'authorName', type: 'string', label: 'Author Name' },
        { name: 'authorEmail', type: 'string', label: 'Author Email' },
        { name: 'postTitle', type: 'string', label: 'Post Title' },
        { name: 'eventTitle', type: 'string', label: 'Event Title' },
        // Relationship filters
        {
          name: 'rel_byUser',
          type: 'relationship',
          label: 'By user',
          entityType: 'user',
          relationshipKey: 'byUser',
          description: 'Replies by specific user',
        },
        {
          name: 'rel_inEvent',
          type: 'relationship',
          label: 'In event',
          entityType: 'event',
          relationshipKey: 'inEvent',
          description: 'Replies in specific event',
        },
        {
          name: 'rel_toPostsByUser',
          type: 'relationship',
          label: 'To posts by',
          entityType: 'user',
          relationshipKey: 'toPostsByUser',
          description: "Replies to user's posts",
        },
        {
          name: 'rel_onPost',
          type: 'relationship',
          label: 'On post',
          entityType: 'post',
          relationshipKey: 'onPost',
          description: 'Replies on specific post',
        },
      ],
      memberships: [
        { name: 'role', type: 'string', label: 'Role' },
        { name: 'rsvpStatus', type: 'string', label: 'RSVP Status' },
        { name: 'personName', type: 'string', label: 'Person Name' },
        { name: 'personEmail', type: 'string', label: 'Person Email' },
        { name: 'eventTitle', type: 'string', label: 'Event Title' },
        { name: 'createdAt', type: 'datetime', label: 'Created At' },
        // Relationship filters
        {
          name: 'rel_forUser',
          type: 'relationship',
          label: 'For user',
          entityType: 'user',
          relationshipKey: 'forUser',
          description: 'Memberships for specific user',
        },
        {
          name: 'rel_forEvent',
          type: 'relationship',
          label: 'For event',
          entityType: 'event',
          relationshipKey: 'forEvent',
          description: 'Memberships for specific event',
        },
      ],
    };

    return fieldDefinitions[entity] || [];
  },
});

/**
 * Get available operators for a field type
 */
export const getOperatorsForFieldType = query({
  args: {
    fieldType: v.union(
      v.literal('string'),
      v.literal('number'),
      v.literal('relationship')
    ),
  },
  handler: async (ctx, { fieldType }) => {
    await requireAdmin(ctx);

    const stringOperators = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does Not Contain' },
      { value: 'starts_with', label: 'Starts With' },
      { value: 'ends_with', label: 'Ends With' },
      { value: 'is_empty', label: 'Is Empty' },
      { value: 'is_not_empty', label: 'Is Not Empty' },
    ];

    const numberOperators = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'gt', label: 'Greater Than' },
      { value: 'gte', label: 'Greater Than or Equal' },
      { value: 'lt', label: 'Less Than' },
      { value: 'lte', label: 'Less Than or Equal' },
      { value: 'is_empty', label: 'Is Empty' },
      { value: 'is_not_empty', label: 'Is Not Empty' },
    ];

    // Relationship fields use "is" operator (the value is the entity ID)
    const relationshipOperators = [{ value: 'is', label: 'Is' }];

    if (fieldType === 'relationship') {
      return relationshipOperators;
    }
    return fieldType === 'string' ? stringOperators : numberOperators;
  },
});

/**
 * Search entities for autocomplete picker
 * Returns matching users, events, or posts based on search query
 */
export const searchEntities = query({
  args: {
    entityType: v.union(
      v.literal('user'),
      v.literal('event'),
      v.literal('post')
    ),
    search: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { entityType, search, limit = 10 }) => {
    await requireAdmin(ctx);

    const searchLower = search.toLowerCase();

    if (entityType === 'user') {
      const allPersons = await ctx.db.query('persons').collect();
      const usersWithData = await Promise.all(
        allPersons.map(async person => {
          const user = await getUserInfo(ctx, person.userId);
          if (!user) return null;
          return {
            id: person._id,
            label: user.name || user.username || user.email,
            sublabel: user.email,
            type: 'user' as const,
          };
        })
      );

      return usersWithData
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .filter(
          u =>
            u.label.toLowerCase().includes(searchLower) ||
            u.sublabel.toLowerCase().includes(searchLower)
        )
        .slice(0, limit);
    }

    if (entityType === 'event') {
      const allEvents = await ctx.db.query('events').collect();
      return allEvents
        .filter(e => e.title.toLowerCase().includes(searchLower))
        .slice(0, limit)
        .map(e => ({
          id: e._id,
          label: e.title,
          sublabel: e.location || 'No location',
          type: 'event' as const,
        }));
    }

    if (entityType === 'post') {
      const allPosts = await ctx.db.query('posts').collect();
      const postsWithEvents = await Promise.all(
        allPosts.map(async post => {
          const event = await ctx.db.get(post.eventId);
          return {
            id: post._id,
            label: post.title,
            sublabel: event?.title || 'Unknown event',
            type: 'post' as const,
          };
        })
      );

      return postsWithEvents
        .filter(p => p.label.toLowerCase().includes(searchLower))
        .slice(0, limit);
    }

    return [];
  },
});

/**
 * Get available relationship filters for an entity
 */
export const getRelationshipFilters = query({
  args: {
    entity: v.union(
      v.literal('users'),
      v.literal('events'),
      v.literal('posts'),
      v.literal('replies'),
      v.literal('memberships')
    ),
  },
  handler: async (ctx, { entity }) => {
    await requireAdmin(ctx);

    const relationshipFilters: Record<
      string,
      {
        key: string;
        label: string;
        description: string;
        entityType: 'user' | 'event' | 'post';
        mode?: 'include' | 'exclude';
      }[]
    > = {
      users: [
        {
          key: 'inEventWith',
          label: 'In event with user',
          description: 'Users who share at least one event with selected user',
          entityType: 'user',
          mode: 'include',
        },
        {
          key: 'notInEventWith',
          label: 'NOT in event with user',
          description: 'Users who do NOT share any events with selected user',
          entityType: 'user',
          mode: 'exclude',
        },
        {
          key: 'memberOfEvent',
          label: 'Member of event',
          description: 'Users who are members of selected event',
          entityType: 'event',
          mode: 'include',
        },
        {
          key: 'notMemberOfEvent',
          label: 'NOT member of event',
          description: 'Users who are NOT members of selected event',
          entityType: 'event',
          mode: 'exclude',
        },
        {
          key: 'postedInEvent',
          label: 'Posted in event',
          description: 'Users who have created posts in selected event',
          entityType: 'event',
          mode: 'include',
        },
        {
          key: 'repliedToUser',
          label: 'Replied to user',
          description: 'Users who have replied to posts by selected user',
          entityType: 'user',
          mode: 'include',
        },
        {
          key: 'createdEvent',
          label: 'Created event',
          description: 'Users who created selected event',
          entityType: 'event',
          mode: 'include',
        },
      ],
      events: [
        {
          key: 'createdByUser',
          label: 'Created by user',
          description: 'Events created by selected user',
          entityType: 'user',
          mode: 'include',
        },
        {
          key: 'hasMember',
          label: 'Has member',
          description: 'Events that include selected user as a member',
          entityType: 'user',
          mode: 'include',
        },
        {
          key: 'hasPostsByUser',
          label: 'Has posts by user',
          description: 'Events with posts from selected user',
          entityType: 'user',
          mode: 'include',
        },
      ],
      posts: [
        {
          key: 'inEvent',
          label: 'In event',
          description: 'Posts in selected event',
          entityType: 'event',
          mode: 'include',
        },
        {
          key: 'byUser',
          label: 'By user',
          description: 'Posts authored by selected user',
          entityType: 'user',
          mode: 'include',
        },
        {
          key: 'hasRepliesByUser',
          label: 'Has replies by user',
          description: 'Posts with replies from selected user',
          entityType: 'user',
          mode: 'include',
        },
      ],
      replies: [
        {
          key: 'byUser',
          label: 'By user',
          description: 'Replies authored by selected user',
          entityType: 'user',
          mode: 'include',
        },
        {
          key: 'inEvent',
          label: 'In event',
          description: 'Replies on posts in selected event',
          entityType: 'event',
          mode: 'include',
        },
        {
          key: 'toPostsByUser',
          label: 'To posts by user',
          description: 'Replies on posts authored by selected user',
          entityType: 'user',
          mode: 'include',
        },
        {
          key: 'onPost',
          label: 'On post',
          description: 'Replies on selected post',
          entityType: 'post',
          mode: 'include',
        },
      ],
      memberships: [
        {
          key: 'forUser',
          label: 'For user',
          description: 'Memberships for selected user',
          entityType: 'user',
          mode: 'include',
        },
        {
          key: 'forEvent',
          label: 'For event',
          description: 'Memberships for selected event',
          entityType: 'event',
          mode: 'include',
        },
      ],
    };

    return relationshipFilters[entity] || [];
  },
});
