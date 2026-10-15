import { checkBoundedAttachments, attachIntegrationFiles } from './uploads';
import { attendanceMember } from '../availability/contracts';
import { contentSummary, contentDetail } from '../discussion/rest';
import { internalMutation, type MutationCtx } from '../_generated/server';
import { v, ConvexError, type Infer } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import {
  authorizeCredential,
  audit,
  denied,
  type AuthorizationAction,
} from './model';
import {
  readEventDetail,
  eventDetailValidator,
  eventSummaryValidator,
} from '../events/restQueries';
import { getPersonWithUser, requireEventPermissionForPerson } from '../auth';
import { getDiscussionActorWithUser } from '../posts/presentation';
import { reminderOffsetValidator } from '../events/writes';
import { attachmentInputValidator } from '../attachments/model';
import { writeIntegrationContent } from '../discussion/integrations';
export const request = v.object({
  operation: v.union(
    v.literal('events.read'),
    v.literal('events.list'),
    v.literal('events.update'),
    v.literal('members.read'),
    v.literal('profiles.read'),
    v.literal('identity.read'),
    v.literal('discussion.read'),
    v.literal('discussion.list'),
    v.literal('discussion.create'),
    v.literal('discussion.update'),
    v.literal('discussion.delete')
  ),
  eventId: v.optional(v.id('events')),
  postId: v.optional(v.id('posts')),
  replyId: v.optional(v.id('replies')),
  username: v.optional(v.string()),
  kind: v.optional(v.union(v.literal('posts'), v.literal('replies'))),
  limit: v.optional(v.number()),
  cursor: v.optional(v.string()),
  paged: v.optional(v.boolean()),
  body: v.optional(
    v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      location: v.optional(v.string()),
      reminderOffset: v.optional(v.union(reminderOffsetValidator, v.null())),
      potentialDateTimeOptions: v.optional(
        v.array(
          v.object({
            start: v.string(),
            end: v.optional(v.string()),
            note: v.optional(v.string()),
          })
        )
      ),
      content: v.optional(v.string()),
      text: v.optional(v.string()),
      attachments: v.optional(v.array(attachmentInputValidator)),
      attachmentsToAdd: v.optional(v.array(attachmentInputValidator)),
      attachmentIdsToDelete: v.optional(v.array(v.id('attachments'))),
    })
  ),
});
function redactEvent<
  T extends { creator: { user: { email: string | null } } | null },
>(event: T) {
  return {
    ...event,
    creator: event.creator
      ? { ...event.creator, user: { ...event.creator.user, email: null } }
      : null,
  };
}
async function discussionSummary(
  ctx: MutationCtx,
  row: Doc<'posts'> | Doc<'replies'>,
  includeFiles: boolean
) {
  const author = await getDiscussionActorWithUser(ctx, row.authorId);
  const attachments = includeFiles
    ? await (
        'eventId' in row
          ? ctx.db
              .query('attachments')
              .withIndex('by_post', q => q.eq('postId', row._id))
          : ctx.db
              .query('attachments')
              .withIndex('by_reply', q => q.eq('replyId', row._id))
      ).collect()
    : [];
  return {
    id: row._id,
    createdAt: row._creationTime,
    ...('eventId' in row
      ? {
          eventId: row.eventId,
          title: row.title,
          content: row.content,
          editedAt: row.editedAt ?? null,
        }
      : {
          postId: row.postId,
          text: row.text,
          updatedAt: row.updatedAt ?? null,
        }),
    author: author
      ? {
          id: author.person._id,
          kind: author.kind,
          user: {
            id: author.user._id,
            name: author.user.name,
            image: author.user.image,
            username: author.user.username,
            email: null,
          },
        }
      : null,
    attachments: await Promise.all(
      attachments.map(async a => ({
        id: a._id,
        storageId: a.storageId,
        filename: a.filename,
        size: a.size,
        mimeType: a.mimeType,
        url: await ctx.storage.getUrl(a.storageId),
      }))
    ),
  };
}
const publicProfile = v.object({
  personId: v.id('persons'),
  userId: v.string(),
  name: v.union(v.string(), v.null()),
  email: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
  username: v.union(v.string(), v.null()),
  bio: v.null(),
  pronouns: v.null(),
});
const boundedEventSummary = v.object({
  ...eventSummaryValidator.fields,
  userRole: v.union(eventSummaryValidator.fields.userRole, v.null()),
  userRsvpStatus: v.union(
    eventSummaryValidator.fields.userRsvpStatus,
    v.null()
  ),
});
const responseItems = v.union(
  v.array(boundedEventSummary),
  v.array(attendanceMember),
  v.array(contentSummary)
);
const responseData = v.union(
  eventDetailValidator,
  responseItems,
  publicProfile,
  contentDetail,
  v.object({ eventId: v.id('events') }),
  v.object({ postId: v.id('posts') }),
  v.object({ replyId: v.id('replies') }),
  v.object({ items: responseItems, nextCursor: v.union(v.string(), v.null()) }),
  v.object({
    error: v.object({ code: v.literal('FORBIDDEN'), message: v.string() }),
  }),
  v.null()
);
export const execute = internalMutation({
  args: { credentialId: v.id('authorizationCredentials'), request },
  returns: v.object({ status: v.number(), data: responseData }),
  handler: async (
    ctx,
    { credentialId, request: input }
  ): Promise<{ status: number; data: Infer<typeof responseData> }> => {
    const now = Date.now();
    let eventId = input.eventId;
    let post = input.postId ? await ctx.db.get(input.postId) : null;
    const reply = input.replyId ? await ctx.db.get(input.replyId) : null;
    if (reply) post = await ctx.db.get(reply.postId);
    if (post) {
      if (eventId !== undefined && eventId !== post.eventId) throw denied();
      eventId = post.eventId;
    }
    let requested: AuthorizationAction =
      input.operation === 'events.list'
        ? 'events.read'
        : input.operation === 'discussion.list'
          ? 'discussion.read'
          : input.operation === 'identity.read'
            ? 'identity.display-name'
            : input.operation;
    if (input.operation === 'identity.read') {
      const credential = await ctx.db.get(credentialId);
      const grant = credential ? await ctx.db.get(credential.grantId) : null;
      requested = grant?.actions.includes('identity.display-name')
        ? 'identity.display-name'
        : 'identity.email';
    }
    let authority;
    try {
      authority = await authorizeCredential(
        ctx,
        credentialId,
        requested,
        eventId,
        now
      );
    } catch {
      const credential = await ctx.db.get(credentialId);
      const grant = credential ? await ctx.db.get(credential.grantId) : null;
      if (grant)
        await audit(
          ctx,
          grant,
          input.operation,
          'denied',
          'authority-denied',
          undefined,
          credentialId
        );
      return {
        status: 403,
        data: {
          error: {
            code: 'FORBIDDEN',
            message: 'Credential does not permit this operation.',
          },
        },
      };
    }
    const { grant, principal } = authority;
    const limit = input.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Limit must be between 1 and 100.',
      });
    let status = 200;
    let data: Infer<typeof responseData>;
    if (input.operation === 'events.list') {
      const ids =
        grant.selector.kind === 'selected'
          ? grant.selector.eventIds
          : (
              await ctx.db
                .query('memberships')
                .withIndex('by_person', q =>
                  q.eq('personId', grant.grantorPersonId)
                )
                .collect()
            ).map(member => member.eventId);
      const events = [];
      for (const id of ids) {
        try {
          await authorizeCredential(ctx, credentialId, 'events.read', id, now);
        } catch {
          continue;
        }
        const event = await readEventDetail(ctx, id);
        if (event) {
          const membership = await ctx.db
            .query('memberships')
            .withIndex('by_person_event', q =>
              q.eq('personId', grant.grantorPersonId).eq('eventId', id)
            )
            .unique();
          if (membership)
            events.push({
              id: event.id,
              title: event.title,
              description: event.description,
              location: event.location,
              imageUrl: event.imageUrl,
              chosenDateTime: event.chosenDateTime,
              chosenEndDateTime: event.chosenEndDateTime,
              createdAt: event.createdAt,
              updatedAt: event.updatedAt,
              memberCount: (await ctx.db.get(id))?.memberCount ?? 0,
              userRole:
                principal.kind === 'integration' ? null : membership.role,
              userRsvpStatus:
                principal.kind === 'integration' ? null : membership.rsvpStatus,
            });
        }
      }
      data = events;
    } else if (input.operation === 'events.read') {
      const event = eventId ? await readEventDetail(ctx, eventId) : null;
      if (!event) throw denied();
      data = redactEvent(event);
    } else if (input.operation === 'events.update') {
      if (!eventId || !input.body) throw denied();
      const {
        title,
        description,
        location,
        reminderOffset,
        potentialDateTimeOptions,
        ...rest
      } = input.body;
      if (Object.values(rest).some(value => value !== undefined))
        throw denied();
      await ctx.runMutation(internal.events.rest.update, {
        personId: grant.grantorPersonId,
        eventId,
        body: {
          title,
          description,
          location,
          reminderOffset,
          potentialDateTimeOptions,
        },
        integrationActorId:
          principal.kind === 'integration' ? principal._id : undefined,
      });
      data = { eventId };
    } else if (
      input.operation === 'members.read' ||
      input.operation === 'profiles.read'
    ) {
      if (!eventId) throw denied();
      await requireEventPermissionForPerson(
        ctx,
        eventId,
        grant.grantorPersonId,
        'viewAttendeeList'
      );
      const members = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId!))
        .collect();
      const profiles: Array<
        Infer<typeof publicProfile> | Infer<typeof attendanceMember>
      > = [];
      for (const member of members) {
        const person = await getPersonWithUser(ctx, member.personId);
        if (!person) continue;
        const profile = {
          personId: member.personId,
          userId: person.user._id,
          name: person.user.name,
          email: null,
          image: person.user.image,
          username: person.user.username,
          bio: null,
          pronouns: null,
        };
        if (input.operation === 'profiles.read') {
          if (person.user.username === input.username) profiles.push(profile);
        } else
          profiles.push({
            id: member._id,
            personId: member.personId,
            role: member.role,
            rsvpStatus: member.rsvpStatus,
            rsvpNote: null,
            joinedAt: member._creationTime,
            user: {
              id: person.user._id,
              name: person.user.name,
              email: null,
              image: person.user.image,
              username: person.user.username,
            },
          });
      }
      if (input.operation === 'profiles.read') {
        if (!profiles.length) throw denied();
        data = profiles[0] as Infer<typeof publicProfile>;
      } else data = profiles as Infer<typeof attendanceMember>[];
    } else if (input.operation === 'identity.read') {
      if (authority.credential.kind === 'delegated-access')
        throw denied('Use OIDC claims for delegated identity.');
      const owner = await getPersonWithUser(ctx, grant.grantorPersonId);
      if (!owner) throw denied();
      data = {
        personId: owner.person._id,
        userId: owner.user._id,
        name: grant.actions.includes('identity.display-name')
          ? owner.user.name
          : null,
        email: grant.actions.includes('identity.email')
          ? owner.user.email
          : null,
        image: null,
        username: null,
        bio: null,
        pronouns: null,
      };
    } else if (
      input.operation === 'discussion.read' ||
      input.operation === 'discussion.list'
    ) {
      if (!eventId) throw denied();
      let includeFiles = false;
      try {
        await authorizeCredential(
          ctx,
          credentialId,
          'files.read',
          eventId,
          now
        );
        includeFiles = true;
      } catch {
        /* Omit ungranted related files. */
      }
      if (input.operation === 'discussion.read') {
        const row = reply ?? post;
        if (!row) throw denied();
        const result = await discussionSummary(ctx, row, includeFiles);
        data =
          'eventId' in row
            ? {
                ...result,
                replies: await Promise.all(
                  (
                    await ctx.db
                      .query('replies')
                      .withIndex('by_post', q => q.eq('postId', row._id))
                      .collect()
                  ).map(r => discussionSummary(ctx, r, includeFiles))
                ),
              }
            : result;
      } else {
        const rows =
          input.kind === 'replies' && post
            ? await ctx.db
                .query('replies')
                .withIndex('by_post', q => q.eq('postId', post!._id))
                .collect()
            : await ctx.db
                .query('posts')
                .withIndex('by_event', q => q.eq('eventId', eventId!))
                .order('desc')
                .collect();
        data = await Promise.all(
          rows.map(row => discussionSummary(ctx, row, includeFiles))
        );
      }
    } else {
      if (!eventId || !input.kind) throw denied();
      const operation =
        input.operation === 'discussion.create'
          ? 'create'
          : input.operation === 'discussion.update'
            ? 'edit'
            : 'delete';
      const body = input.body ?? {};
      const allowedBodyFields =
        operation === 'delete'
          ? []
          : [
              ...(input.kind === 'posts' ? ['title', 'content'] : ['text']),
              ...(operation === 'create'
                ? ['attachments']
                : ['attachmentsToAdd', 'attachmentIdsToDelete']),
            ];
      if (
        Object.entries(body).some(
          ([key, value]) =>
            value !== undefined && !allowedBodyFields.includes(key)
        )
      )
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Unsupported discussion fields.',
        });
      if (
        operation !== 'delete' &&
        !Object.values(body).some(value => value !== undefined)
      )
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Provide a discussion field.',
        });
      const additions =
        operation === 'create'
          ? (body.attachments ?? [])
          : (body.attachmentsToAdd ?? []);
      if (additions.length)
        await checkBoundedAttachments(ctx, credentialId, eventId, additions);
      if (body.attachmentIdsToDelete?.length)
        await authorizeCredential(
          ctx,
          credentialId,
          'files.upload',
          eventId,
          now
        );
      if (principal.kind === 'integration') {
        // The sponsor supplies a current authority ceiling, never authorship.
        if (operation === 'create')
          await requireEventPermissionForPerson(
            ctx,
            eventId,
            grant.grantorPersonId,
            'createPosts'
          );
        const existing =
          operation === 'create'
            ? []
            : await (
                input.kind === 'posts'
                  ? ctx.db
                      .query('attachments')
                      .withIndex('by_post', q => q.eq('postId', post!._id))
                  : ctx.db
                      .query('attachments')
                      .withIndex('by_reply', q => q.eq('replyId', reply!._id))
              ).collect();
        const remainingFileCount =
          existing.filter(
            file => !body.attachmentIdsToDelete?.includes(file._id)
          ).length + additions.length;
        data = await writeIntegrationContent(ctx, {
          principalId: principal._id,
          sponsorPersonId: grant.grantorPersonId,
          eventId,
          kind: input.kind,
          operation,
          postId: post?._id,
          replyId: reply?._id,
          title: body.title,
          content: body.content,
          text: body.text,
          hasAttachments: remainingFileCount > 0,
        });
        if (operation !== 'delete') {
          const parent =
            'postId' in data
              ? { postId: data.postId }
              : { replyId: data.replyId };
          const parentRow = parent.postId
            ? await ctx.db.get(parent.postId)
            : parent.replyId
              ? await ctx.db.get(parent.replyId)
              : null;
          if (!parentRow || parentRow.authorId !== principal._id)
            throw denied();
          for (const id of body.attachmentIdsToDelete ?? []) {
            const file = await ctx.db.get(id);
            if (
              !file ||
              (parent.postId
                ? file.postId !== parent.postId
                : file.replyId !== parent.replyId)
            )
              throw denied();
            await ctx.storage.delete(file.storageId);
            await ctx.db.delete(file._id);
          }
          await attachIntegrationFiles(ctx, principal._id, parent, additions);
        }
      } else {
        const result = await ctx.runMutation(internal.discussion.rest.write, {
          kind: input.kind,
          operation,
          id:
            operation === 'create'
              ? input.kind === 'posts'
                ? eventId
                : (post?._id ?? '')
              : input.kind === 'posts'
                ? (post?._id ?? '')
                : (reply?._id ?? ''),
          personId: grant.grantorPersonId,
          body: {
            title: body.title,
            content: body.content,
            text: body.text,
            attachments: body.attachments,
            attachmentsToAdd: body.attachmentsToAdd,
            attachmentIdsToDelete: body.attachmentIdsToDelete,
          },
        });
        if (input.kind === 'posts') {
          const postId =
            operation === 'create' && 'postId' in result
              ? result.postId
              : post?._id;
          if (!postId) throw denied();
          data = { postId };
        } else {
          const replyId =
            operation === 'create' && 'replyId' in result
              ? result.replyId
              : reply?._id;
          if (!replyId) throw denied();
          data = { replyId };
        }
      }
      status =
        operation === 'create' ? 201 : operation === 'delete' ? 204 : 200;
    }
    if (input.paged && Array.isArray(data)) {
      const prefix = `${grant._id}:${grant.updatedAt}:`;
      const start = input.cursor
        ? input.cursor.startsWith(prefix)
          ? Number(input.cursor.slice(prefix.length))
          : NaN
        : 0;
      if (!Number.isInteger(start) || start < 0 || start > data.length)
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid cursor. Start again without a cursor.',
        });
      const items = data.slice(start, start + limit);
      data = {
        items,
        nextCursor:
          start + limit < data.length ? `${prefix}${start + limit}` : null,
      };
    }
    await audit(
      ctx,
      grant,
      input.operation,
      'allowed',
      'authorized',
      eventId,
      credentialId
    );
    return { status, data: status === 204 ? null : data };
  },
});
