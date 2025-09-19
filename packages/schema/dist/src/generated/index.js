import { z } from 'zod';
import { Prisma } from '@prisma/client';
export const transformJsonNull = (v) => {
    if (!v || v === 'DbNull')
        return Prisma.DbNull;
    if (v === 'JsonNull')
        return Prisma.JsonNull;
    return v;
};
export const JsonValueSchema = z.lazy(() => z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
]));
export const NullableJsonValue = z
    .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
    .nullable()
    .transform(v => transformJsonNull(v));
export const InputJsonValueSchema = z.lazy(() => z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
]));
/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////
export const TransactionIsolationLevelSchema = z.enum([
    'ReadUncommitted',
    'ReadCommitted',
    'RepeatableRead',
    'Serializable',
]);
export const PersonScalarFieldEnumSchema = z.enum([
    'id',
    'createdAt',
    'updatedAt',
    'firstName',
    'lastName',
    'username',
    'imageUrl',
]);
export const PersonSettingsScalarFieldEnumSchema = z.enum([
    'id',
    'createdAt',
    'updatedAt',
    'personId',
]);
export const EventScalarFieldEnumSchema = z.enum([
    'id',
    'createdAt',
    'updatedAt',
    'title',
    'description',
    'location',
    'chosenDateTime',
]);
export const MembershipScalarFieldEnumSchema = z.enum([
    'id',
    'personId',
    'eventId',
    'role',
    'rsvpStatus',
]);
export const PotentialDateTimeScalarFieldEnumSchema = z.enum([
    'id',
    'eventId',
    'dateTime',
]);
export const AvailabilityScalarFieldEnumSchema = z.enum([
    'membershipId',
    'potentialDateTimeId',
    'status',
]);
export const PostScalarFieldEnumSchema = z.enum([
    'id',
    'createdAt',
    'updatedAt',
    'editedAt',
    'authorId',
    'eventId',
    'title',
    'content',
]);
export const ReplyScalarFieldEnumSchema = z.enum([
    'id',
    'createdAt',
    'updatedAt',
    'authorId',
    'postId',
    'text',
]);
export const InviteScalarFieldEnumSchema = z.enum([
    'id',
    'eventId',
    'createdById',
    'createdAt',
    'expiresAt',
    'usesRemaining',
    'maxUses',
    'name',
]);
export const NotificationScalarFieldEnumSchema = z.enum([
    'id',
    'createdAt',
    'updatedAt',
    'personId',
    'authorId',
    'type',
    'eventId',
    'postId',
    'read',
    'datetime',
    'rsvp',
]);
export const NotificationMethodScalarFieldEnumSchema = z.enum([
    'id',
    'createdAt',
    'updatedAt',
    'settingsId',
    'type',
    'enabled',
    'name',
    'value',
    'webhookHeaders',
    'customTemplate',
    'webhookFormat',
]);
export const NotificationSettingScalarFieldEnumSchema = z.enum([
    'id',
    'notificationType',
    'methodId',
    'enabled',
]);
export const SortOrderSchema = z.enum(['asc', 'desc']);
export const NullableJsonNullValueInputSchema = z
    .enum(['DbNull', 'JsonNull'])
    .transform(value => value === 'JsonNull'
    ? Prisma.JsonNull
    : value === 'DbNull'
        ? Prisma.DbNull
        : value);
export const QueryModeSchema = z.enum(['default', 'insensitive']);
export const NullsOrderSchema = z.enum(['first', 'last']);
export const JsonNullValueFilterSchema = z
    .enum(['DbNull', 'JsonNull', 'AnyNull'])
    .transform(value => value === 'JsonNull'
    ? Prisma.JsonNull
    : value === 'DbNull'
        ? Prisma.JsonNull
        : value === 'AnyNull'
            ? Prisma.AnyNull
            : value);
export const StatusSchema = z.enum(['YES', 'MAYBE', 'NO', 'PENDING']);
export const RoleSchema = z.enum(['ORGANIZER', 'MODERATOR', 'ATTENDEE']);
export const NotificationTypeSchema = z.enum([
    'EVENT_EDITED',
    'NEW_POST',
    'NEW_REPLY',
    'DATE_CHOSEN',
    'DATE_CHANGED',
    'DATE_RESET',
    'USER_JOINED',
    'USER_LEFT',
    'USER_PROMOTED',
    'USER_DEMOTED',
    'USER_RSVP',
]);
export const NotificationMethodTypeSchema = z.enum([
    'EMAIL',
    'PUSH',
    'WEBHOOK',
]);
export const WebhookFormatSchema = z.enum([
    'DISCORD',
    'SLACK',
    'TEAMS',
    'GENERIC',
    'CUSTOM',
]);
/////////////////////////////////////////
// MODELS
/////////////////////////////////////////
/////////////////////////////////////////
// PERSON SCHEMA
/////////////////////////////////////////
export const PersonSchema = z.object({
    id: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    username: z.string(),
    imageUrl: z.string(),
});
// PERSON OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const PersonOptionalDefaultsSchema = PersonSchema.merge(z.object({
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
}));
/////////////////////////////////////////
// PERSON SETTINGS SCHEMA
/////////////////////////////////////////
export const PersonSettingsSchema = z.object({
    id: z.string().cuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    personId: z.string(),
});
// PERSON SETTINGS OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const PersonSettingsOptionalDefaultsSchema = PersonSettingsSchema.merge(z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
}));
/////////////////////////////////////////
// EVENT SCHEMA
/////////////////////////////////////////
export const EventSchema = z.object({
    id: z.string().cuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    chosenDateTime: z.coerce.date().nullable(),
});
// EVENT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const EventOptionalDefaultsSchema = EventSchema.merge(z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
}));
/////////////////////////////////////////
// MEMBERSHIP SCHEMA
/////////////////////////////////////////
export const MembershipSchema = z.object({
    role: RoleSchema,
    rsvpStatus: StatusSchema,
    id: z.string().cuid(),
    personId: z.string(),
    eventId: z.string(),
});
// MEMBERSHIP OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const MembershipOptionalDefaultsSchema = MembershipSchema.merge(z.object({
    role: RoleSchema.optional(),
    rsvpStatus: StatusSchema.optional(),
    id: z.string().cuid().optional(),
}));
/////////////////////////////////////////
// POTENTIAL DATE TIME SCHEMA
/////////////////////////////////////////
export const PotentialDateTimeSchema = z.object({
    id: z.string().cuid(),
    eventId: z.string(),
    dateTime: z.coerce.date(),
});
// POTENTIAL DATE TIME OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const PotentialDateTimeOptionalDefaultsSchema = PotentialDateTimeSchema.merge(z.object({
    id: z.string().cuid().optional(),
    dateTime: z.coerce.date().optional(),
}));
/////////////////////////////////////////
// AVAILABILITY SCHEMA
/////////////////////////////////////////
export const AvailabilitySchema = z.object({
    status: StatusSchema,
    membershipId: z.string(),
    potentialDateTimeId: z.string(),
});
// AVAILABILITY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const AvailabilityOptionalDefaultsSchema = AvailabilitySchema.merge(z.object({}));
/////////////////////////////////////////
// POST SCHEMA
/////////////////////////////////////////
export const PostSchema = z.object({
    id: z.string().cuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    editedAt: z.coerce.date(),
    authorId: z.string(),
    eventId: z.string(),
    title: z.string(),
    content: z.string(),
});
// POST OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const PostOptionalDefaultsSchema = PostSchema.merge(z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
}));
/////////////////////////////////////////
// REPLY SCHEMA
/////////////////////////////////////////
export const ReplySchema = z.object({
    id: z.string().cuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    authorId: z.string(),
    postId: z.string(),
    text: z.string(),
});
// REPLY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const ReplyOptionalDefaultsSchema = ReplySchema.merge(z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
}));
/////////////////////////////////////////
// INVITE SCHEMA
/////////////////////////////////////////
export const InviteSchema = z.object({
    id: z.string().cuid(),
    eventId: z.string(),
    createdById: z.string(),
    createdAt: z.coerce.date(),
    expiresAt: z.coerce.date(),
    usesRemaining: z.number().int().nullable(),
    maxUses: z.number().int().nullable(),
    name: z.string().nullable(),
});
// INVITE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const InviteOptionalDefaultsSchema = InviteSchema.merge(z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
}));
/////////////////////////////////////////
// NOTIFICATION SCHEMA
/////////////////////////////////////////
export const NotificationSchema = z.object({
    type: NotificationTypeSchema,
    rsvp: StatusSchema.nullable(),
    id: z.string().cuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    personId: z.string(),
    authorId: z.string().nullable(),
    eventId: z.string().nullable(),
    postId: z.string().nullable(),
    read: z.boolean(),
    datetime: z.coerce.date().nullable(),
});
// NOTIFICATION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const NotificationOptionalDefaultsSchema = NotificationSchema.merge(z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    read: z.boolean().optional(),
}));
/////////////////////////////////////////
// NOTIFICATION METHOD SCHEMA
/////////////////////////////////////////
export const NotificationMethodSchema = z.object({
    type: NotificationMethodTypeSchema,
    webhookFormat: WebhookFormatSchema.nullable(),
    id: z.string().cuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    settingsId: z.string(),
    enabled: z.boolean(),
    name: z.string().nullable(),
    value: z.string(),
    webhookHeaders: JsonValueSchema.nullable(),
    customTemplate: z.string().nullable(),
});
// NOTIFICATION METHOD OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const NotificationMethodOptionalDefaultsSchema = NotificationMethodSchema.merge(z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    enabled: z.boolean().optional(),
}));
/////////////////////////////////////////
// NOTIFICATION SETTING SCHEMA
/////////////////////////////////////////
export const NotificationSettingSchema = z.object({
    notificationType: NotificationTypeSchema,
    id: z.string().cuid(),
    methodId: z.string(),
    enabled: z.boolean(),
});
// NOTIFICATION SETTING OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------
export const NotificationSettingOptionalDefaultsSchema = NotificationSettingSchema.merge(z.object({
    id: z.string().cuid().optional(),
    enabled: z.boolean().optional(),
}));
/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////
// PERSON
//------------------------------------------------------
export const PersonIncludeSchema = z
    .object({
    memberships: z
        .union([z.boolean(), z.lazy(() => MembershipFindManyArgsSchema)])
        .optional(),
    posts: z
        .union([z.boolean(), z.lazy(() => PostFindManyArgsSchema)])
        .optional(),
    replies: z
        .union([z.boolean(), z.lazy(() => ReplyFindManyArgsSchema)])
        .optional(),
    notifications: z
        .union([z.boolean(), z.lazy(() => NotificationFindManyArgsSchema)])
        .optional(),
    authoredNotifications: z
        .union([z.boolean(), z.lazy(() => NotificationFindManyArgsSchema)])
        .optional(),
    settings: z
        .union([z.boolean(), z.lazy(() => PersonSettingsArgsSchema)])
        .optional(),
    _count: z
        .union([z.boolean(), z.lazy(() => PersonCountOutputTypeArgsSchema)])
        .optional(),
})
    .strict();
export const PersonArgsSchema = z
    .object({
    select: z.lazy(() => PersonSelectSchema).optional(),
    include: z.lazy(() => PersonIncludeSchema).optional(),
})
    .strict();
export const PersonCountOutputTypeArgsSchema = z
    .object({
    select: z.lazy(() => PersonCountOutputTypeSelectSchema).nullish(),
})
    .strict();
export const PersonCountOutputTypeSelectSchema = z
    .object({
    memberships: z.boolean().optional(),
    posts: z.boolean().optional(),
    replies: z.boolean().optional(),
    notifications: z.boolean().optional(),
    authoredNotifications: z.boolean().optional(),
})
    .strict();
export const PersonSelectSchema = z
    .object({
    id: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    firstName: z.boolean().optional(),
    lastName: z.boolean().optional(),
    username: z.boolean().optional(),
    imageUrl: z.boolean().optional(),
    memberships: z
        .union([z.boolean(), z.lazy(() => MembershipFindManyArgsSchema)])
        .optional(),
    posts: z
        .union([z.boolean(), z.lazy(() => PostFindManyArgsSchema)])
        .optional(),
    replies: z
        .union([z.boolean(), z.lazy(() => ReplyFindManyArgsSchema)])
        .optional(),
    notifications: z
        .union([z.boolean(), z.lazy(() => NotificationFindManyArgsSchema)])
        .optional(),
    authoredNotifications: z
        .union([z.boolean(), z.lazy(() => NotificationFindManyArgsSchema)])
        .optional(),
    settings: z
        .union([z.boolean(), z.lazy(() => PersonSettingsArgsSchema)])
        .optional(),
    _count: z
        .union([z.boolean(), z.lazy(() => PersonCountOutputTypeArgsSchema)])
        .optional(),
})
    .strict();
// PERSON SETTINGS
//------------------------------------------------------
export const PersonSettingsIncludeSchema = z
    .object({
    person: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    notificationMethods: z
        .union([
        z.boolean(),
        z.lazy(() => NotificationMethodFindManyArgsSchema),
    ])
        .optional(),
    _count: z
        .union([
        z.boolean(),
        z.lazy(() => PersonSettingsCountOutputTypeArgsSchema),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsArgsSchema = z
    .object({
    select: z.lazy(() => PersonSettingsSelectSchema).optional(),
    include: z.lazy(() => PersonSettingsIncludeSchema).optional(),
})
    .strict();
export const PersonSettingsCountOutputTypeArgsSchema = z
    .object({
    select: z.lazy(() => PersonSettingsCountOutputTypeSelectSchema).nullish(),
})
    .strict();
export const PersonSettingsCountOutputTypeSelectSchema = z
    .object({
    notificationMethods: z.boolean().optional(),
})
    .strict();
export const PersonSettingsSelectSchema = z
    .object({
    id: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    personId: z.boolean().optional(),
    person: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    notificationMethods: z
        .union([
        z.boolean(),
        z.lazy(() => NotificationMethodFindManyArgsSchema),
    ])
        .optional(),
    _count: z
        .union([
        z.boolean(),
        z.lazy(() => PersonSettingsCountOutputTypeArgsSchema),
    ])
        .optional(),
})
    .strict();
// EVENT
//------------------------------------------------------
export const EventIncludeSchema = z
    .object({
    invites: z
        .union([z.boolean(), z.lazy(() => InviteFindManyArgsSchema)])
        .optional(),
    potentialDateTimes: z
        .union([z.boolean(), z.lazy(() => PotentialDateTimeFindManyArgsSchema)])
        .optional(),
    posts: z
        .union([z.boolean(), z.lazy(() => PostFindManyArgsSchema)])
        .optional(),
    memberships: z
        .union([z.boolean(), z.lazy(() => MembershipFindManyArgsSchema)])
        .optional(),
    notifications: z
        .union([z.boolean(), z.lazy(() => NotificationFindManyArgsSchema)])
        .optional(),
    _count: z
        .union([z.boolean(), z.lazy(() => EventCountOutputTypeArgsSchema)])
        .optional(),
})
    .strict();
export const EventArgsSchema = z
    .object({
    select: z.lazy(() => EventSelectSchema).optional(),
    include: z.lazy(() => EventIncludeSchema).optional(),
})
    .strict();
export const EventCountOutputTypeArgsSchema = z
    .object({
    select: z.lazy(() => EventCountOutputTypeSelectSchema).nullish(),
})
    .strict();
export const EventCountOutputTypeSelectSchema = z
    .object({
    invites: z.boolean().optional(),
    potentialDateTimes: z.boolean().optional(),
    posts: z.boolean().optional(),
    memberships: z.boolean().optional(),
    notifications: z.boolean().optional(),
})
    .strict();
export const EventSelectSchema = z
    .object({
    id: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    title: z.boolean().optional(),
    description: z.boolean().optional(),
    location: z.boolean().optional(),
    chosenDateTime: z.boolean().optional(),
    invites: z
        .union([z.boolean(), z.lazy(() => InviteFindManyArgsSchema)])
        .optional(),
    potentialDateTimes: z
        .union([z.boolean(), z.lazy(() => PotentialDateTimeFindManyArgsSchema)])
        .optional(),
    posts: z
        .union([z.boolean(), z.lazy(() => PostFindManyArgsSchema)])
        .optional(),
    memberships: z
        .union([z.boolean(), z.lazy(() => MembershipFindManyArgsSchema)])
        .optional(),
    notifications: z
        .union([z.boolean(), z.lazy(() => NotificationFindManyArgsSchema)])
        .optional(),
    _count: z
        .union([z.boolean(), z.lazy(() => EventCountOutputTypeArgsSchema)])
        .optional(),
})
    .strict();
// MEMBERSHIP
//------------------------------------------------------
export const MembershipIncludeSchema = z
    .object({
    person: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    availabilities: z
        .union([z.boolean(), z.lazy(() => AvailabilityFindManyArgsSchema)])
        .optional(),
    invites: z
        .union([z.boolean(), z.lazy(() => InviteFindManyArgsSchema)])
        .optional(),
    _count: z
        .union([z.boolean(), z.lazy(() => MembershipCountOutputTypeArgsSchema)])
        .optional(),
})
    .strict();
export const MembershipArgsSchema = z
    .object({
    select: z.lazy(() => MembershipSelectSchema).optional(),
    include: z.lazy(() => MembershipIncludeSchema).optional(),
})
    .strict();
export const MembershipCountOutputTypeArgsSchema = z
    .object({
    select: z.lazy(() => MembershipCountOutputTypeSelectSchema).nullish(),
})
    .strict();
export const MembershipCountOutputTypeSelectSchema = z
    .object({
    availabilities: z.boolean().optional(),
    invites: z.boolean().optional(),
})
    .strict();
export const MembershipSelectSchema = z
    .object({
    id: z.boolean().optional(),
    personId: z.boolean().optional(),
    eventId: z.boolean().optional(),
    role: z.boolean().optional(),
    rsvpStatus: z.boolean().optional(),
    person: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    availabilities: z
        .union([z.boolean(), z.lazy(() => AvailabilityFindManyArgsSchema)])
        .optional(),
    invites: z
        .union([z.boolean(), z.lazy(() => InviteFindManyArgsSchema)])
        .optional(),
    _count: z
        .union([z.boolean(), z.lazy(() => MembershipCountOutputTypeArgsSchema)])
        .optional(),
})
    .strict();
// POTENTIAL DATE TIME
//------------------------------------------------------
export const PotentialDateTimeIncludeSchema = z
    .object({
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    availabilities: z
        .union([z.boolean(), z.lazy(() => AvailabilityFindManyArgsSchema)])
        .optional(),
    _count: z
        .union([
        z.boolean(),
        z.lazy(() => PotentialDateTimeCountOutputTypeArgsSchema),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeArgsSchema = z
    .object({
    select: z.lazy(() => PotentialDateTimeSelectSchema).optional(),
    include: z.lazy(() => PotentialDateTimeIncludeSchema).optional(),
})
    .strict();
export const PotentialDateTimeCountOutputTypeArgsSchema = z
    .object({
    select: z
        .lazy(() => PotentialDateTimeCountOutputTypeSelectSchema)
        .nullish(),
})
    .strict();
export const PotentialDateTimeCountOutputTypeSelectSchema = z
    .object({
    availabilities: z.boolean().optional(),
})
    .strict();
export const PotentialDateTimeSelectSchema = z
    .object({
    id: z.boolean().optional(),
    eventId: z.boolean().optional(),
    dateTime: z.boolean().optional(),
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    availabilities: z
        .union([z.boolean(), z.lazy(() => AvailabilityFindManyArgsSchema)])
        .optional(),
    _count: z
        .union([
        z.boolean(),
        z.lazy(() => PotentialDateTimeCountOutputTypeArgsSchema),
    ])
        .optional(),
})
    .strict();
// AVAILABILITY
//------------------------------------------------------
export const AvailabilityIncludeSchema = z
    .object({
    membership: z
        .union([z.boolean(), z.lazy(() => MembershipArgsSchema)])
        .optional(),
    potentialDateTime: z
        .union([z.boolean(), z.lazy(() => PotentialDateTimeArgsSchema)])
        .optional(),
})
    .strict();
export const AvailabilityArgsSchema = z
    .object({
    select: z.lazy(() => AvailabilitySelectSchema).optional(),
    include: z.lazy(() => AvailabilityIncludeSchema).optional(),
})
    .strict();
export const AvailabilitySelectSchema = z
    .object({
    membershipId: z.boolean().optional(),
    potentialDateTimeId: z.boolean().optional(),
    status: z.boolean().optional(),
    membership: z
        .union([z.boolean(), z.lazy(() => MembershipArgsSchema)])
        .optional(),
    potentialDateTime: z
        .union([z.boolean(), z.lazy(() => PotentialDateTimeArgsSchema)])
        .optional(),
})
    .strict();
// POST
//------------------------------------------------------
export const PostIncludeSchema = z
    .object({
    author: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    replies: z
        .union([z.boolean(), z.lazy(() => ReplyFindManyArgsSchema)])
        .optional(),
    notifications: z
        .union([z.boolean(), z.lazy(() => NotificationFindManyArgsSchema)])
        .optional(),
    _count: z
        .union([z.boolean(), z.lazy(() => PostCountOutputTypeArgsSchema)])
        .optional(),
})
    .strict();
export const PostArgsSchema = z
    .object({
    select: z.lazy(() => PostSelectSchema).optional(),
    include: z.lazy(() => PostIncludeSchema).optional(),
})
    .strict();
export const PostCountOutputTypeArgsSchema = z
    .object({
    select: z.lazy(() => PostCountOutputTypeSelectSchema).nullish(),
})
    .strict();
export const PostCountOutputTypeSelectSchema = z
    .object({
    replies: z.boolean().optional(),
    notifications: z.boolean().optional(),
})
    .strict();
export const PostSelectSchema = z
    .object({
    id: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    editedAt: z.boolean().optional(),
    authorId: z.boolean().optional(),
    eventId: z.boolean().optional(),
    title: z.boolean().optional(),
    content: z.boolean().optional(),
    author: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    replies: z
        .union([z.boolean(), z.lazy(() => ReplyFindManyArgsSchema)])
        .optional(),
    notifications: z
        .union([z.boolean(), z.lazy(() => NotificationFindManyArgsSchema)])
        .optional(),
    _count: z
        .union([z.boolean(), z.lazy(() => PostCountOutputTypeArgsSchema)])
        .optional(),
})
    .strict();
// REPLY
//------------------------------------------------------
export const ReplyIncludeSchema = z
    .object({
    author: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    post: z.union([z.boolean(), z.lazy(() => PostArgsSchema)]).optional(),
})
    .strict();
export const ReplyArgsSchema = z
    .object({
    select: z.lazy(() => ReplySelectSchema).optional(),
    include: z.lazy(() => ReplyIncludeSchema).optional(),
})
    .strict();
export const ReplySelectSchema = z
    .object({
    id: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    authorId: z.boolean().optional(),
    postId: z.boolean().optional(),
    text: z.boolean().optional(),
    author: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    post: z.union([z.boolean(), z.lazy(() => PostArgsSchema)]).optional(),
})
    .strict();
// INVITE
//------------------------------------------------------
export const InviteIncludeSchema = z
    .object({
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    createdBy: z
        .union([z.boolean(), z.lazy(() => MembershipArgsSchema)])
        .optional(),
})
    .strict();
export const InviteArgsSchema = z
    .object({
    select: z.lazy(() => InviteSelectSchema).optional(),
    include: z.lazy(() => InviteIncludeSchema).optional(),
})
    .strict();
export const InviteSelectSchema = z
    .object({
    id: z.boolean().optional(),
    eventId: z.boolean().optional(),
    createdById: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    expiresAt: z.boolean().optional(),
    usesRemaining: z.boolean().optional(),
    maxUses: z.boolean().optional(),
    name: z.boolean().optional(),
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    createdBy: z
        .union([z.boolean(), z.lazy(() => MembershipArgsSchema)])
        .optional(),
})
    .strict();
// NOTIFICATION
//------------------------------------------------------
export const NotificationIncludeSchema = z
    .object({
    person: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    author: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    post: z.union([z.boolean(), z.lazy(() => PostArgsSchema)]).optional(),
})
    .strict();
export const NotificationArgsSchema = z
    .object({
    select: z.lazy(() => NotificationSelectSchema).optional(),
    include: z.lazy(() => NotificationIncludeSchema).optional(),
})
    .strict();
export const NotificationSelectSchema = z
    .object({
    id: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    personId: z.boolean().optional(),
    authorId: z.boolean().optional(),
    type: z.boolean().optional(),
    eventId: z.boolean().optional(),
    postId: z.boolean().optional(),
    read: z.boolean().optional(),
    datetime: z.boolean().optional(),
    rsvp: z.boolean().optional(),
    person: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    author: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    post: z.union([z.boolean(), z.lazy(() => PostArgsSchema)]).optional(),
})
    .strict();
// NOTIFICATION METHOD
//------------------------------------------------------
export const NotificationMethodIncludeSchema = z
    .object({
    settings: z
        .union([z.boolean(), z.lazy(() => PersonSettingsArgsSchema)])
        .optional(),
    notifications: z
        .union([
        z.boolean(),
        z.lazy(() => NotificationSettingFindManyArgsSchema),
    ])
        .optional(),
    _count: z
        .union([
        z.boolean(),
        z.lazy(() => NotificationMethodCountOutputTypeArgsSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationMethodArgsSchema = z
    .object({
    select: z.lazy(() => NotificationMethodSelectSchema).optional(),
    include: z.lazy(() => NotificationMethodIncludeSchema).optional(),
})
    .strict();
export const NotificationMethodCountOutputTypeArgsSchema = z
    .object({
    select: z
        .lazy(() => NotificationMethodCountOutputTypeSelectSchema)
        .nullish(),
})
    .strict();
export const NotificationMethodCountOutputTypeSelectSchema = z
    .object({
    notifications: z.boolean().optional(),
})
    .strict();
export const NotificationMethodSelectSchema = z
    .object({
    id: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    settingsId: z.boolean().optional(),
    type: z.boolean().optional(),
    enabled: z.boolean().optional(),
    name: z.boolean().optional(),
    value: z.boolean().optional(),
    webhookHeaders: z.boolean().optional(),
    customTemplate: z.boolean().optional(),
    webhookFormat: z.boolean().optional(),
    settings: z
        .union([z.boolean(), z.lazy(() => PersonSettingsArgsSchema)])
        .optional(),
    notifications: z
        .union([
        z.boolean(),
        z.lazy(() => NotificationSettingFindManyArgsSchema),
    ])
        .optional(),
    _count: z
        .union([
        z.boolean(),
        z.lazy(() => NotificationMethodCountOutputTypeArgsSchema),
    ])
        .optional(),
})
    .strict();
// NOTIFICATION SETTING
//------------------------------------------------------
export const NotificationSettingIncludeSchema = z
    .object({
    notificationMethod: z
        .union([z.boolean(), z.lazy(() => NotificationMethodArgsSchema)])
        .optional(),
})
    .strict();
export const NotificationSettingArgsSchema = z
    .object({
    select: z.lazy(() => NotificationSettingSelectSchema).optional(),
    include: z.lazy(() => NotificationSettingIncludeSchema).optional(),
})
    .strict();
export const NotificationSettingSelectSchema = z
    .object({
    id: z.boolean().optional(),
    notificationType: z.boolean().optional(),
    methodId: z.boolean().optional(),
    enabled: z.boolean().optional(),
    notificationMethod: z
        .union([z.boolean(), z.lazy(() => NotificationMethodArgsSchema)])
        .optional(),
})
    .strict();
/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////
export const PersonWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => PersonWhereInputSchema),
        z.lazy(() => PersonWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PersonWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PersonWhereInputSchema),
        z.lazy(() => PersonWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    firstName: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    lastName: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    username: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    imageUrl: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    memberships: z.lazy(() => MembershipListRelationFilterSchema).optional(),
    posts: z.lazy(() => PostListRelationFilterSchema).optional(),
    replies: z.lazy(() => ReplyListRelationFilterSchema).optional(),
    notifications: z
        .lazy(() => NotificationListRelationFilterSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationListRelationFilterSchema)
        .optional(),
    settings: z
        .union([
        z.lazy(() => PersonSettingsNullableRelationFilterSchema),
        z.lazy(() => PersonSettingsWhereInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const PersonOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    firstName: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    lastName: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    username: z.lazy(() => SortOrderSchema).optional(),
    imageUrl: z.lazy(() => SortOrderSchema).optional(),
    memberships: z
        .lazy(() => MembershipOrderByRelationAggregateInputSchema)
        .optional(),
    posts: z.lazy(() => PostOrderByRelationAggregateInputSchema).optional(),
    replies: z
        .lazy(() => ReplyOrderByRelationAggregateInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationOrderByRelationAggregateInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationOrderByRelationAggregateInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsOrderByWithRelationInputSchema)
        .optional(),
})
    .strict();
export const PersonWhereUniqueInputSchema = z
    .union([
    z.object({
        id: z.string(),
        username: z.string(),
    }),
    z.object({
        id: z.string(),
    }),
    z.object({
        username: z.string(),
    }),
])
    .and(z
    .object({
    id: z.string().optional(),
    username: z.string().optional(),
    AND: z
        .union([
        z.lazy(() => PersonWhereInputSchema),
        z.lazy(() => PersonWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PersonWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PersonWhereInputSchema),
        z.lazy(() => PersonWhereInputSchema).array(),
    ])
        .optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    firstName: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    lastName: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    imageUrl: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    memberships: z
        .lazy(() => MembershipListRelationFilterSchema)
        .optional(),
    posts: z.lazy(() => PostListRelationFilterSchema).optional(),
    replies: z.lazy(() => ReplyListRelationFilterSchema).optional(),
    notifications: z
        .lazy(() => NotificationListRelationFilterSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationListRelationFilterSchema)
        .optional(),
    settings: z
        .union([
        z.lazy(() => PersonSettingsNullableRelationFilterSchema),
        z.lazy(() => PersonSettingsWhereInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict());
export const PersonOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    firstName: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    lastName: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    username: z.lazy(() => SortOrderSchema).optional(),
    imageUrl: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => PersonCountOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => PersonMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => PersonMinOrderByAggregateInputSchema).optional(),
})
    .strict();
export const PersonScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => PersonScalarWhereWithAggregatesInputSchema),
        z.lazy(() => PersonScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PersonScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PersonScalarWhereWithAggregatesInputSchema),
        z.lazy(() => PersonScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    firstName: z
        .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
    ])
        .optional()
        .nullable(),
    username: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    imageUrl: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
})
    .strict();
export const PersonSettingsWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => PersonSettingsWhereInputSchema),
        z.lazy(() => PersonSettingsWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PersonSettingsWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PersonSettingsWhereInputSchema),
        z.lazy(() => PersonSettingsWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    personId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    person: z
        .union([
        z.lazy(() => PersonRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional(),
    notificationMethods: z
        .lazy(() => NotificationMethodListRelationFilterSchema)
        .optional(),
})
    .strict();
export const PersonSettingsOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    person: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
    notificationMethods: z
        .lazy(() => NotificationMethodOrderByRelationAggregateInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsWhereUniqueInputSchema = z
    .union([
    z.object({
        id: z.string().cuid(),
        personId: z.string(),
    }),
    z.object({
        id: z.string().cuid(),
    }),
    z.object({
        personId: z.string(),
    }),
])
    .and(z
    .object({
    id: z.string().cuid().optional(),
    personId: z.string().optional(),
    AND: z
        .union([
        z.lazy(() => PersonSettingsWhereInputSchema),
        z.lazy(() => PersonSettingsWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PersonSettingsWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PersonSettingsWhereInputSchema),
        z.lazy(() => PersonSettingsWhereInputSchema).array(),
    ])
        .optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    person: z
        .union([
        z.lazy(() => PersonRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional(),
    notificationMethods: z
        .lazy(() => NotificationMethodListRelationFilterSchema)
        .optional(),
})
    .strict());
export const PersonSettingsOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    _count: z
        .lazy(() => PersonSettingsCountOrderByAggregateInputSchema)
        .optional(),
    _max: z
        .lazy(() => PersonSettingsMaxOrderByAggregateInputSchema)
        .optional(),
    _min: z
        .lazy(() => PersonSettingsMinOrderByAggregateInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => PersonSettingsScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => PersonSettingsScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PersonSettingsScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PersonSettingsScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => PersonSettingsScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    personId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
})
    .strict();
export const EventWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => EventWhereInputSchema),
        z.lazy(() => EventWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => EventWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => EventWhereInputSchema),
        z.lazy(() => EventWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    description: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    location: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    chosenDateTime: z
        .union([z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date()])
        .optional()
        .nullable(),
    invites: z.lazy(() => InviteListRelationFilterSchema).optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeListRelationFilterSchema)
        .optional(),
    posts: z.lazy(() => PostListRelationFilterSchema).optional(),
    memberships: z.lazy(() => MembershipListRelationFilterSchema).optional(),
    notifications: z
        .lazy(() => NotificationListRelationFilterSchema)
        .optional(),
})
    .strict();
export const EventOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    location: z.lazy(() => SortOrderSchema).optional(),
    chosenDateTime: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    invites: z
        .lazy(() => InviteOrderByRelationAggregateInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeOrderByRelationAggregateInputSchema)
        .optional(),
    posts: z.lazy(() => PostOrderByRelationAggregateInputSchema).optional(),
    memberships: z
        .lazy(() => MembershipOrderByRelationAggregateInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationOrderByRelationAggregateInputSchema)
        .optional(),
})
    .strict();
export const EventWhereUniqueInputSchema = z
    .object({
    id: z.string().cuid(),
})
    .and(z
    .object({
    id: z.string().cuid().optional(),
    AND: z
        .union([
        z.lazy(() => EventWhereInputSchema),
        z.lazy(() => EventWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => EventWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => EventWhereInputSchema),
        z.lazy(() => EventWhereInputSchema).array(),
    ])
        .optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    title: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    description: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    location: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    chosenDateTime: z
        .union([
        z.lazy(() => DateTimeNullableFilterSchema),
        z.coerce.date(),
    ])
        .optional()
        .nullable(),
    invites: z.lazy(() => InviteListRelationFilterSchema).optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeListRelationFilterSchema)
        .optional(),
    posts: z.lazy(() => PostListRelationFilterSchema).optional(),
    memberships: z
        .lazy(() => MembershipListRelationFilterSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationListRelationFilterSchema)
        .optional(),
})
    .strict());
export const EventOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    location: z.lazy(() => SortOrderSchema).optional(),
    chosenDateTime: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    _count: z.lazy(() => EventCountOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => EventMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => EventMinOrderByAggregateInputSchema).optional(),
})
    .strict();
export const EventScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => EventScalarWhereWithAggregatesInputSchema),
        z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => EventScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => EventScalarWhereWithAggregatesInputSchema),
        z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    title: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    description: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    location: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    chosenDateTime: z
        .union([
        z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const MembershipWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => MembershipWhereInputSchema),
        z.lazy(() => MembershipWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => MembershipWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => MembershipWhereInputSchema),
        z.lazy(() => MembershipWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    personId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    role: z
        .union([z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema)])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => EnumStatusFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional(),
    person: z
        .union([
        z.lazy(() => PersonRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional(),
    event: z
        .union([
        z.lazy(() => EventRelationFilterSchema),
        z.lazy(() => EventWhereInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityListRelationFilterSchema)
        .optional(),
    invites: z.lazy(() => InviteListRelationFilterSchema).optional(),
})
    .strict();
export const MembershipOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    role: z.lazy(() => SortOrderSchema).optional(),
    rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
    person: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
    event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
    availabilities: z
        .lazy(() => AvailabilityOrderByRelationAggregateInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteOrderByRelationAggregateInputSchema)
        .optional(),
})
    .strict();
export const MembershipWhereUniqueInputSchema = z
    .object({
    id: z.string().cuid(),
})
    .and(z
    .object({
    id: z.string().cuid().optional(),
    AND: z
        .union([
        z.lazy(() => MembershipWhereInputSchema),
        z.lazy(() => MembershipWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => MembershipWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => MembershipWhereInputSchema),
        z.lazy(() => MembershipWhereInputSchema).array(),
    ])
        .optional(),
    personId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    role: z
        .union([
        z.lazy(() => EnumRoleFilterSchema),
        z.lazy(() => RoleSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => EnumStatusFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional(),
    person: z
        .union([
        z.lazy(() => PersonRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional(),
    event: z
        .union([
        z.lazy(() => EventRelationFilterSchema),
        z.lazy(() => EventWhereInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityListRelationFilterSchema)
        .optional(),
    invites: z.lazy(() => InviteListRelationFilterSchema).optional(),
})
    .strict());
export const MembershipOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    role: z.lazy(() => SortOrderSchema).optional(),
    rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
    _count: z
        .lazy(() => MembershipCountOrderByAggregateInputSchema)
        .optional(),
    _max: z.lazy(() => MembershipMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => MembershipMinOrderByAggregateInputSchema).optional(),
})
    .strict();
export const MembershipScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => MembershipScalarWhereWithAggregatesInputSchema),
        z.lazy(() => MembershipScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => MembershipScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => MembershipScalarWhereWithAggregatesInputSchema),
        z.lazy(() => MembershipScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    personId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    role: z
        .union([
        z.lazy(() => EnumRoleWithAggregatesFilterSchema),
        z.lazy(() => RoleSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => EnumStatusWithAggregatesFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => PotentialDateTimeWhereInputSchema),
        z.lazy(() => PotentialDateTimeWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PotentialDateTimeWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PotentialDateTimeWhereInputSchema),
        z.lazy(() => PotentialDateTimeWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    eventId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    dateTime: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    event: z
        .union([
        z.lazy(() => EventRelationFilterSchema),
        z.lazy(() => EventWhereInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityListRelationFilterSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    dateTime: z.lazy(() => SortOrderSchema).optional(),
    event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
    availabilities: z
        .lazy(() => AvailabilityOrderByRelationAggregateInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeWhereUniqueInputSchema = z
    .object({
    id: z.string().cuid(),
})
    .and(z
    .object({
    id: z.string().cuid().optional(),
    AND: z
        .union([
        z.lazy(() => PotentialDateTimeWhereInputSchema),
        z.lazy(() => PotentialDateTimeWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PotentialDateTimeWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PotentialDateTimeWhereInputSchema),
        z.lazy(() => PotentialDateTimeWhereInputSchema).array(),
    ])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    dateTime: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    event: z
        .union([
        z.lazy(() => EventRelationFilterSchema),
        z.lazy(() => EventWhereInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityListRelationFilterSchema)
        .optional(),
})
    .strict());
export const PotentialDateTimeOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    dateTime: z.lazy(() => SortOrderSchema).optional(),
    _count: z
        .lazy(() => PotentialDateTimeCountOrderByAggregateInputSchema)
        .optional(),
    _max: z
        .lazy(() => PotentialDateTimeMaxOrderByAggregateInputSchema)
        .optional(),
    _min: z
        .lazy(() => PotentialDateTimeMinOrderByAggregateInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => PotentialDateTimeScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => PotentialDateTimeScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PotentialDateTimeScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PotentialDateTimeScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => PotentialDateTimeScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    dateTime: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
})
    .strict();
export const AvailabilityWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => AvailabilityWhereInputSchema),
        z.lazy(() => AvailabilityWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => AvailabilityWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => AvailabilityWhereInputSchema),
        z.lazy(() => AvailabilityWhereInputSchema).array(),
    ])
        .optional(),
    membershipId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    potentialDateTimeId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    status: z
        .union([
        z.lazy(() => EnumStatusFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional(),
    membership: z
        .union([
        z.lazy(() => MembershipRelationFilterSchema),
        z.lazy(() => MembershipWhereInputSchema),
    ])
        .optional(),
    potentialDateTime: z
        .union([
        z.lazy(() => PotentialDateTimeRelationFilterSchema),
        z.lazy(() => PotentialDateTimeWhereInputSchema),
    ])
        .optional(),
})
    .strict();
export const AvailabilityOrderByWithRelationInputSchema = z
    .object({
    membershipId: z.lazy(() => SortOrderSchema).optional(),
    potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
    status: z.lazy(() => SortOrderSchema).optional(),
    membership: z
        .lazy(() => MembershipOrderByWithRelationInputSchema)
        .optional(),
    potentialDateTime: z
        .lazy(() => PotentialDateTimeOrderByWithRelationInputSchema)
        .optional(),
})
    .strict();
export const AvailabilityWhereUniqueInputSchema = z
    .object({
    id: z.lazy(() => AvailabilityIdCompoundUniqueInputSchema),
})
    .and(z
    .object({
    id: z.lazy(() => AvailabilityIdCompoundUniqueInputSchema).optional(),
    AND: z
        .union([
        z.lazy(() => AvailabilityWhereInputSchema),
        z.lazy(() => AvailabilityWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => AvailabilityWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => AvailabilityWhereInputSchema),
        z.lazy(() => AvailabilityWhereInputSchema).array(),
    ])
        .optional(),
    membershipId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    potentialDateTimeId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    status: z
        .union([
        z.lazy(() => EnumStatusFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional(),
    membership: z
        .union([
        z.lazy(() => MembershipRelationFilterSchema),
        z.lazy(() => MembershipWhereInputSchema),
    ])
        .optional(),
    potentialDateTime: z
        .union([
        z.lazy(() => PotentialDateTimeRelationFilterSchema),
        z.lazy(() => PotentialDateTimeWhereInputSchema),
    ])
        .optional(),
})
    .strict());
export const AvailabilityOrderByWithAggregationInputSchema = z
    .object({
    membershipId: z.lazy(() => SortOrderSchema).optional(),
    potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
    status: z.lazy(() => SortOrderSchema).optional(),
    _count: z
        .lazy(() => AvailabilityCountOrderByAggregateInputSchema)
        .optional(),
    _max: z.lazy(() => AvailabilityMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => AvailabilityMinOrderByAggregateInputSchema).optional(),
})
    .strict();
export const AvailabilityScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => AvailabilityScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => AvailabilityScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    OR: z
        .lazy(() => AvailabilityScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => AvailabilityScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => AvailabilityScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    membershipId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    potentialDateTimeId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    status: z
        .union([
        z.lazy(() => EnumStatusWithAggregatesFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional(),
})
    .strict();
export const PostWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => PostWhereInputSchema),
        z.lazy(() => PostWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PostWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PostWhereInputSchema),
        z.lazy(() => PostWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    editedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    eventId: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    content: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    author: z
        .union([
        z.lazy(() => PersonRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional(),
    event: z
        .union([
        z.lazy(() => EventRelationFilterSchema),
        z.lazy(() => EventWhereInputSchema),
    ])
        .optional(),
    replies: z.lazy(() => ReplyListRelationFilterSchema).optional(),
    notifications: z
        .lazy(() => NotificationListRelationFilterSchema)
        .optional(),
})
    .strict();
export const PostOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    editedAt: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    author: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
    event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
    replies: z
        .lazy(() => ReplyOrderByRelationAggregateInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationOrderByRelationAggregateInputSchema)
        .optional(),
})
    .strict();
export const PostWhereUniqueInputSchema = z
    .object({
    id: z.string().cuid(),
})
    .and(z
    .object({
    id: z.string().cuid().optional(),
    AND: z
        .union([
        z.lazy(() => PostWhereInputSchema),
        z.lazy(() => PostWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PostWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PostWhereInputSchema),
        z.lazy(() => PostWhereInputSchema).array(),
    ])
        .optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    editedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    title: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    content: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    author: z
        .union([
        z.lazy(() => PersonRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional(),
    event: z
        .union([
        z.lazy(() => EventRelationFilterSchema),
        z.lazy(() => EventWhereInputSchema),
    ])
        .optional(),
    replies: z.lazy(() => ReplyListRelationFilterSchema).optional(),
    notifications: z
        .lazy(() => NotificationListRelationFilterSchema)
        .optional(),
})
    .strict());
export const PostOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    editedAt: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => PostCountOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => PostMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => PostMinOrderByAggregateInputSchema).optional(),
})
    .strict();
export const PostScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => PostScalarWhereWithAggregatesInputSchema),
        z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PostScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PostScalarWhereWithAggregatesInputSchema),
        z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    editedAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    title: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    content: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
})
    .strict();
export const ReplyWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => ReplyWhereInputSchema),
        z.lazy(() => ReplyWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => ReplyWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => ReplyWhereInputSchema),
        z.lazy(() => ReplyWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    postId: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    text: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    author: z
        .union([
        z.lazy(() => PersonRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional(),
    post: z
        .union([
        z.lazy(() => PostRelationFilterSchema),
        z.lazy(() => PostWhereInputSchema),
    ])
        .optional(),
})
    .strict();
export const ReplyOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    postId: z.lazy(() => SortOrderSchema).optional(),
    text: z.lazy(() => SortOrderSchema).optional(),
    author: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
    post: z.lazy(() => PostOrderByWithRelationInputSchema).optional(),
})
    .strict();
export const ReplyWhereUniqueInputSchema = z
    .object({
    id: z.string().cuid(),
})
    .and(z
    .object({
    id: z.string().cuid().optional(),
    AND: z
        .union([
        z.lazy(() => ReplyWhereInputSchema),
        z.lazy(() => ReplyWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => ReplyWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => ReplyWhereInputSchema),
        z.lazy(() => ReplyWhereInputSchema).array(),
    ])
        .optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    postId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    text: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    author: z
        .union([
        z.lazy(() => PersonRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional(),
    post: z
        .union([
        z.lazy(() => PostRelationFilterSchema),
        z.lazy(() => PostWhereInputSchema),
    ])
        .optional(),
})
    .strict());
export const ReplyOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    postId: z.lazy(() => SortOrderSchema).optional(),
    text: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => ReplyCountOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => ReplyMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => ReplyMinOrderByAggregateInputSchema).optional(),
})
    .strict();
export const ReplyScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => ReplyScalarWhereWithAggregatesInputSchema),
        z.lazy(() => ReplyScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => ReplyScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => ReplyScalarWhereWithAggregatesInputSchema),
        z.lazy(() => ReplyScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    postId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    text: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
})
    .strict();
export const InviteWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => InviteWhereInputSchema),
        z.lazy(() => InviteWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => InviteWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => InviteWhereInputSchema),
        z.lazy(() => InviteWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    eventId: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdById: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    expiresAt: z
        .union([z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date()])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([z.lazy(() => IntNullableFilterSchema), z.number()])
        .optional()
        .nullable(),
    maxUses: z
        .union([z.lazy(() => IntNullableFilterSchema), z.number()])
        .optional()
        .nullable(),
    name: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    event: z
        .union([
        z.lazy(() => EventRelationFilterSchema),
        z.lazy(() => EventWhereInputSchema),
    ])
        .optional(),
    createdBy: z
        .union([
        z.lazy(() => MembershipRelationFilterSchema),
        z.lazy(() => MembershipWhereInputSchema),
    ])
        .optional(),
})
    .strict();
export const InviteOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    createdById: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    expiresAt: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    usesRemaining: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    maxUses: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
    createdBy: z
        .lazy(() => MembershipOrderByWithRelationInputSchema)
        .optional(),
})
    .strict();
export const InviteWhereUniqueInputSchema = z
    .object({
    id: z.string().cuid(),
})
    .and(z
    .object({
    id: z.string().cuid().optional(),
    AND: z
        .union([
        z.lazy(() => InviteWhereInputSchema),
        z.lazy(() => InviteWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => InviteWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => InviteWhereInputSchema),
        z.lazy(() => InviteWhereInputSchema).array(),
    ])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    createdById: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    expiresAt: z
        .union([
        z.lazy(() => DateTimeNullableFilterSchema),
        z.coerce.date(),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([z.lazy(() => IntNullableFilterSchema), z.number().int()])
        .optional()
        .nullable(),
    maxUses: z
        .union([z.lazy(() => IntNullableFilterSchema), z.number().int()])
        .optional()
        .nullable(),
    name: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    event: z
        .union([
        z.lazy(() => EventRelationFilterSchema),
        z.lazy(() => EventWhereInputSchema),
    ])
        .optional(),
    createdBy: z
        .union([
        z.lazy(() => MembershipRelationFilterSchema),
        z.lazy(() => MembershipWhereInputSchema),
    ])
        .optional(),
})
    .strict());
export const InviteOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    createdById: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    expiresAt: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    usesRemaining: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    maxUses: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    _count: z.lazy(() => InviteCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => InviteAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => InviteMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => InviteMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => InviteSumOrderByAggregateInputSchema).optional(),
})
    .strict();
export const InviteScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => InviteScalarWhereWithAggregatesInputSchema),
        z.lazy(() => InviteScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => InviteScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => InviteScalarWhereWithAggregatesInputSchema),
        z.lazy(() => InviteScalarWhereWithAggregatesInputSchema).array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    createdById: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.lazy(() => IntNullableWithAggregatesFilterSchema),
        z.number(),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.lazy(() => IntNullableWithAggregatesFilterSchema),
        z.number(),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => NotificationWhereInputSchema),
        z.lazy(() => NotificationWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationWhereInputSchema),
        z.lazy(() => NotificationWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    personId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => EnumNotificationTypeFilterSchema),
        z.lazy(() => NotificationTypeSchema),
    ])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    postId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    read: z.union([z.lazy(() => BoolFilterSchema), z.boolean()]).optional(),
    datetime: z
        .union([z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date()])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => EnumStatusNullableFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional()
        .nullable(),
    person: z
        .union([
        z.lazy(() => PersonRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional(),
    author: z
        .union([
        z.lazy(() => PersonNullableRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional()
        .nullable(),
    event: z
        .union([
        z.lazy(() => EventNullableRelationFilterSchema),
        z.lazy(() => EventWhereInputSchema),
    ])
        .optional()
        .nullable(),
    post: z
        .union([
        z.lazy(() => PostNullableRelationFilterSchema),
        z.lazy(() => PostWhereInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    authorId: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    eventId: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    postId: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    read: z.lazy(() => SortOrderSchema).optional(),
    datetime: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    rsvp: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    person: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
    author: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
    event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
    post: z.lazy(() => PostOrderByWithRelationInputSchema).optional(),
})
    .strict();
export const NotificationWhereUniqueInputSchema = z
    .object({
    id: z.string().cuid(),
})
    .and(z
    .object({
    id: z.string().cuid().optional(),
    AND: z
        .union([
        z.lazy(() => NotificationWhereInputSchema),
        z.lazy(() => NotificationWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationWhereInputSchema),
        z.lazy(() => NotificationWhereInputSchema).array(),
    ])
        .optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    personId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => EnumNotificationTypeFilterSchema),
        z.lazy(() => NotificationTypeSchema),
    ])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    postId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    read: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
    datetime: z
        .union([
        z.lazy(() => DateTimeNullableFilterSchema),
        z.coerce.date(),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => EnumStatusNullableFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional()
        .nullable(),
    person: z
        .union([
        z.lazy(() => PersonRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional(),
    author: z
        .union([
        z.lazy(() => PersonNullableRelationFilterSchema),
        z.lazy(() => PersonWhereInputSchema),
    ])
        .optional()
        .nullable(),
    event: z
        .union([
        z.lazy(() => EventNullableRelationFilterSchema),
        z.lazy(() => EventWhereInputSchema),
    ])
        .optional()
        .nullable(),
    post: z
        .union([
        z.lazy(() => PostNullableRelationFilterSchema),
        z.lazy(() => PostWhereInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict());
export const NotificationOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    authorId: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    eventId: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    postId: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    read: z.lazy(() => SortOrderSchema).optional(),
    datetime: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    rsvp: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    _count: z
        .lazy(() => NotificationCountOrderByAggregateInputSchema)
        .optional(),
    _max: z.lazy(() => NotificationMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => NotificationMinOrderByAggregateInputSchema).optional(),
})
    .strict();
export const NotificationScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => NotificationScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => NotificationScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    personId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    authorId: z
        .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
    ])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => EnumNotificationTypeWithAggregatesFilterSchema),
        z.lazy(() => NotificationTypeSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
    ])
        .optional()
        .nullable(),
    postId: z
        .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
    ])
        .optional()
        .nullable(),
    read: z
        .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
        .optional(),
    datetime: z
        .union([
        z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => EnumStatusNullableWithAggregatesFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationMethodWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => NotificationMethodWhereInputSchema),
        z.lazy(() => NotificationMethodWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationMethodWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationMethodWhereInputSchema),
        z.lazy(() => NotificationMethodWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    settingsId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    type: z
        .union([
        z.lazy(() => EnumNotificationMethodTypeFilterSchema),
        z.lazy(() => NotificationMethodTypeSchema),
    ])
        .optional(),
    enabled: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
    name: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    value: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    webhookHeaders: z.lazy(() => JsonNullableFilterSchema).optional(),
    customTemplate: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => EnumWebhookFormatNullableFilterSchema),
        z.lazy(() => WebhookFormatSchema),
    ])
        .optional()
        .nullable(),
    settings: z
        .union([
        z.lazy(() => PersonSettingsRelationFilterSchema),
        z.lazy(() => PersonSettingsWhereInputSchema),
    ])
        .optional(),
    notifications: z
        .lazy(() => NotificationSettingListRelationFilterSchema)
        .optional(),
})
    .strict();
export const NotificationMethodOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    settingsId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    enabled: z.lazy(() => SortOrderSchema).optional(),
    name: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    customTemplate: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    webhookFormat: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    settings: z
        .lazy(() => PersonSettingsOrderByWithRelationInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationSettingOrderByRelationAggregateInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodWhereUniqueInputSchema = z
    .object({
    id: z.string().cuid(),
})
    .and(z
    .object({
    id: z.string().cuid().optional(),
    AND: z
        .union([
        z.lazy(() => NotificationMethodWhereInputSchema),
        z.lazy(() => NotificationMethodWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationMethodWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationMethodWhereInputSchema),
        z.lazy(() => NotificationMethodWhereInputSchema).array(),
    ])
        .optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    settingsId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    type: z
        .union([
        z.lazy(() => EnumNotificationMethodTypeFilterSchema),
        z.lazy(() => NotificationMethodTypeSchema),
    ])
        .optional(),
    enabled: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
    name: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    value: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    webhookHeaders: z.lazy(() => JsonNullableFilterSchema).optional(),
    customTemplate: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => EnumWebhookFormatNullableFilterSchema),
        z.lazy(() => WebhookFormatSchema),
    ])
        .optional()
        .nullable(),
    settings: z
        .union([
        z.lazy(() => PersonSettingsRelationFilterSchema),
        z.lazy(() => PersonSettingsWhereInputSchema),
    ])
        .optional(),
    notifications: z
        .lazy(() => NotificationSettingListRelationFilterSchema)
        .optional(),
})
    .strict());
export const NotificationMethodOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    settingsId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    enabled: z.lazy(() => SortOrderSchema).optional(),
    name: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    customTemplate: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    webhookFormat: z
        .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
    ])
        .optional(),
    _count: z
        .lazy(() => NotificationMethodCountOrderByAggregateInputSchema)
        .optional(),
    _max: z
        .lazy(() => NotificationMethodMaxOrderByAggregateInputSchema)
        .optional(),
    _min: z
        .lazy(() => NotificationMethodMinOrderByAggregateInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => NotificationMethodScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => NotificationMethodScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationMethodScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationMethodScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => NotificationMethodScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
    ])
        .optional(),
    settingsId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    type: z
        .union([
        z.lazy(() => EnumNotificationMethodTypeWithAggregatesFilterSchema),
        z.lazy(() => NotificationMethodTypeSchema),
    ])
        .optional(),
    enabled: z
        .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
        .optional(),
    name: z
        .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
    ])
        .optional()
        .nullable(),
    value: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    webhookHeaders: z
        .lazy(() => JsonNullableWithAggregatesFilterSchema)
        .optional(),
    customTemplate: z
        .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
    ])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => EnumWebhookFormatNullableWithAggregatesFilterSchema),
        z.lazy(() => WebhookFormatSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationSettingWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => NotificationSettingWhereInputSchema),
        z.lazy(() => NotificationSettingWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationSettingWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationSettingWhereInputSchema),
        z.lazy(() => NotificationSettingWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    notificationType: z
        .union([
        z.lazy(() => EnumNotificationTypeFilterSchema),
        z.lazy(() => NotificationTypeSchema),
    ])
        .optional(),
    methodId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    enabled: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
    notificationMethod: z
        .union([
        z.lazy(() => NotificationMethodRelationFilterSchema),
        z.lazy(() => NotificationMethodWhereInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingOrderByWithRelationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    notificationType: z.lazy(() => SortOrderSchema).optional(),
    methodId: z.lazy(() => SortOrderSchema).optional(),
    enabled: z.lazy(() => SortOrderSchema).optional(),
    notificationMethod: z
        .lazy(() => NotificationMethodOrderByWithRelationInputSchema)
        .optional(),
})
    .strict();
export const NotificationSettingWhereUniqueInputSchema = z
    .union([
    z.object({
        id: z.string().cuid(),
        notificationType_methodId: z.lazy(() => NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema),
    }),
    z.object({
        id: z.string().cuid(),
    }),
    z.object({
        notificationType_methodId: z.lazy(() => NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema),
    }),
])
    .and(z
    .object({
    id: z.string().cuid().optional(),
    notificationType_methodId: z
        .lazy(() => NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema)
        .optional(),
    AND: z
        .union([
        z.lazy(() => NotificationSettingWhereInputSchema),
        z.lazy(() => NotificationSettingWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationSettingWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationSettingWhereInputSchema),
        z.lazy(() => NotificationSettingWhereInputSchema).array(),
    ])
        .optional(),
    notificationType: z
        .union([
        z.lazy(() => EnumNotificationTypeFilterSchema),
        z.lazy(() => NotificationTypeSchema),
    ])
        .optional(),
    methodId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    enabled: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
    notificationMethod: z
        .union([
        z.lazy(() => NotificationMethodRelationFilterSchema),
        z.lazy(() => NotificationMethodWhereInputSchema),
    ])
        .optional(),
})
    .strict());
export const NotificationSettingOrderByWithAggregationInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    notificationType: z.lazy(() => SortOrderSchema).optional(),
    methodId: z.lazy(() => SortOrderSchema).optional(),
    enabled: z.lazy(() => SortOrderSchema).optional(),
    _count: z
        .lazy(() => NotificationSettingCountOrderByAggregateInputSchema)
        .optional(),
    _max: z
        .lazy(() => NotificationSettingMaxOrderByAggregateInputSchema)
        .optional(),
    _min: z
        .lazy(() => NotificationSettingMinOrderByAggregateInputSchema)
        .optional(),
})
    .strict();
export const NotificationSettingScalarWhereWithAggregatesInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => NotificationSettingScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => NotificationSettingScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationSettingScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationSettingScalarWhereWithAggregatesInputSchema),
        z
            .lazy(() => NotificationSettingScalarWhereWithAggregatesInputSchema)
            .array(),
    ])
        .optional(),
    id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    notificationType: z
        .union([
        z.lazy(() => EnumNotificationTypeWithAggregatesFilterSchema),
        z.lazy(() => NotificationTypeSchema),
    ])
        .optional(),
    methodId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
    enabled: z
        .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
        .optional(),
})
    .strict();
export const PersonCreateInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedCreateInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonUpdateInputSchema = z
    .object({
    id: z
        .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
        .optional(),
    imageUrl: z
        .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
        .optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonCreateManyInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
})
    .strict();
export const PersonUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PersonUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    person: z.lazy(() => PersonCreateNestedOneWithoutSettingsInputSchema),
    notificationMethods: z
        .lazy(() => NotificationMethodCreateNestedManyWithoutSettingsInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsUncheckedCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
    notificationMethods: z
        .lazy(() => NotificationMethodUncheckedCreateNestedManyWithoutSettingsInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    person: z
        .lazy(() => PersonUpdateOneRequiredWithoutSettingsNestedInputSchema)
        .optional(),
    notificationMethods: z
        .lazy(() => NotificationMethodUpdateManyWithoutSettingsNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationMethods: z
        .lazy(() => NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsCreateManyInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
})
    .strict();
export const PersonSettingsUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const EventCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    invites: z
        .lazy(() => InviteCreateNestedManyWithoutEventInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeCreateNestedManyWithoutEventInputSchema)
        .optional(),
    posts: z.lazy(() => PostCreateNestedManyWithoutEventInputSchema).optional(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutEventInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
        .optional(),
    description: z
        .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
        .optional(),
    location: z
        .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    invites: z
        .lazy(() => InviteUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    posts: z.lazy(() => PostUpdateManyWithoutEventNestedInputSchema).optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const EventCreateManyInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
})
    .strict();
export const EventUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const EventUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const MembershipCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
    person: z.lazy(() => PersonCreateNestedOneWithoutMembershipsInputSchema),
    event: z.lazy(() => EventCreateNestedOneWithoutMembershipsInputSchema),
    availabilities: z
        .lazy(() => AvailabilityCreateNestedManyWithoutMembershipInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    personId: z.string(),
    eventId: z.string(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
})
    .strict();
export const MembershipUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    person: z
        .lazy(() => PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema)
        .optional(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutMembershipsNestedInputSchema)
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUpdateManyWithoutMembershipNestedInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
})
    .strict();
export const MembershipCreateManyInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    personId: z.string(),
    eventId: z.string(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
})
    .strict();
export const MembershipUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const MembershipUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    dateTime: z.coerce.date().optional(),
    event: z.lazy(() => EventCreateNestedOneWithoutPotentialDateTimesInputSchema),
    availabilities: z
        .lazy(() => AvailabilityCreateNestedManyWithoutPotentialDateTimeInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeUncheckedCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    eventId: z.string(),
    dateTime: z.coerce.date().optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    dateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutPotentialDateTimesNestedInputSchema)
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUpdateManyWithoutPotentialDateTimeNestedInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    dateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeCreateManyInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    eventId: z.string(),
    dateTime: z.coerce.date().optional(),
})
    .strict();
export const PotentialDateTimeUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    dateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    dateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const AvailabilityCreateInputSchema = z
    .object({
    status: z.lazy(() => StatusSchema),
    membership: z.lazy(() => MembershipCreateNestedOneWithoutAvailabilitiesInputSchema),
    potentialDateTime: z.lazy(() => PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInputSchema),
})
    .strict();
export const AvailabilityUncheckedCreateInputSchema = z
    .object({
    membershipId: z.string(),
    potentialDateTimeId: z.string(),
    status: z.lazy(() => StatusSchema),
})
    .strict();
export const AvailabilityUpdateInputSchema = z
    .object({
    status: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    membership: z
        .lazy(() => MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema)
        .optional(),
    potentialDateTime: z
        .lazy(() => PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema)
        .optional(),
})
    .strict();
export const AvailabilityUncheckedUpdateInputSchema = z
    .object({
    membershipId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    potentialDateTimeId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    status: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const AvailabilityCreateManyInputSchema = z
    .object({
    membershipId: z.string(),
    potentialDateTimeId: z.string(),
    status: z.lazy(() => StatusSchema),
})
    .strict();
export const AvailabilityUpdateManyMutationInputSchema = z
    .object({
    status: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const AvailabilityUncheckedUpdateManyInputSchema = z
    .object({
    membershipId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    potentialDateTimeId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    status: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PostCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    title: z.string(),
    content: z.string(),
    author: z.lazy(() => PersonCreateNestedOneWithoutPostsInputSchema),
    event: z.lazy(() => EventCreateNestedOneWithoutPostsInputSchema),
    replies: z
        .lazy(() => ReplyCreateNestedManyWithoutPostInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutPostInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    authorId: z.string(),
    eventId: z.string(),
    title: z.string(),
    content: z.string(),
    replies: z
        .lazy(() => ReplyUncheckedCreateNestedManyWithoutPostInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutPostInputSchema)
        .optional(),
})
    .strict();
export const PostUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
        .optional(),
    content: z
        .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
        .optional(),
    author: z
        .lazy(() => PersonUpdateOneRequiredWithoutPostsNestedInputSchema)
        .optional(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutPostsNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUpdateManyWithoutPostNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutPostNestedInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedUpdateManyWithoutPostNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutPostNestedInputSchema)
        .optional(),
})
    .strict();
export const PostCreateManyInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    authorId: z.string(),
    eventId: z.string(),
    title: z.string(),
    content: z.string(),
})
    .strict();
export const PostUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PostUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const ReplyCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    text: z.string(),
    author: z.lazy(() => PersonCreateNestedOneWithoutRepliesInputSchema),
    post: z.lazy(() => PostCreateNestedOneWithoutRepliesInputSchema),
})
    .strict();
export const ReplyUncheckedCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    authorId: z.string(),
    postId: z.string(),
    text: z.string(),
})
    .strict();
export const ReplyUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    text: z
        .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
        .optional(),
    author: z
        .lazy(() => PersonUpdateOneRequiredWithoutRepliesNestedInputSchema)
        .optional(),
    post: z
        .lazy(() => PostUpdateOneRequiredWithoutRepliesNestedInputSchema)
        .optional(),
})
    .strict();
export const ReplyUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    text: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const ReplyCreateManyInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    authorId: z.string(),
    postId: z.string(),
    text: z.string(),
})
    .strict();
export const ReplyUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    text: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const ReplyUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    text: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const InviteCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    usesRemaining: z.number().int().optional().nullable(),
    maxUses: z.number().int().optional().nullable(),
    name: z.string().optional().nullable(),
    event: z.lazy(() => EventCreateNestedOneWithoutInvitesInputSchema),
    createdBy: z.lazy(() => MembershipCreateNestedOneWithoutInvitesInputSchema),
})
    .strict();
export const InviteUncheckedCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    eventId: z.string(),
    createdById: z.string(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    usesRemaining: z.number().int().optional().nullable(),
    maxUses: z.number().int().optional().nullable(),
    name: z.string().optional().nullable(),
})
    .strict();
export const InviteUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutInvitesNestedInputSchema)
        .optional(),
    createdBy: z
        .lazy(() => MembershipUpdateOneRequiredWithoutInvitesNestedInputSchema)
        .optional(),
})
    .strict();
export const InviteUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdById: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const InviteCreateManyInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    eventId: z.string(),
    createdById: z.string(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    usesRemaining: z.number().int().optional().nullable(),
    maxUses: z.number().int().optional().nullable(),
    name: z.string().optional().nullable(),
})
    .strict();
export const InviteUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const InviteUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdById: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    type: z.lazy(() => NotificationTypeSchema),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
    person: z.lazy(() => PersonCreateNestedOneWithoutNotificationsInputSchema),
    author: z
        .lazy(() => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema)
        .optional(),
    event: z
        .lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
    post: z
        .lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
})
    .strict();
export const NotificationUncheckedCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
    authorId: z.string().optional().nullable(),
    type: z.lazy(() => NotificationTypeSchema),
    eventId: z.string().optional().nullable(),
    postId: z.string().optional().nullable(),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    person: z
        .lazy(() => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema)
        .optional(),
    author: z
        .lazy(() => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema)
        .optional(),
    event: z
        .lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
    post: z
        .lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationCreateManyInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
    authorId: z.string().optional().nullable(),
    type: z.lazy(() => NotificationTypeSchema),
    eventId: z.string().optional().nullable(),
    postId: z.string().optional().nullable(),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationMethodCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    type: z.lazy(() => NotificationMethodTypeSchema),
    enabled: z.boolean().optional(),
    name: z.string().optional().nullable(),
    value: z.string(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z.string().optional().nullable(),
    webhookFormat: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
    settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutNotificationMethodsInputSchema),
    notifications: z
        .lazy(() => NotificationSettingCreateNestedManyWithoutNotificationMethodInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodUncheckedCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    settingsId: z.string(),
    type: z.lazy(() => NotificationMethodTypeSchema),
    enabled: z.boolean().optional(),
    name: z.string().optional().nullable(),
    value: z.string(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z.string().optional().nullable(),
    webhookFormat: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
    notifications: z
        .lazy(() => NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    value: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    settings: z
        .lazy(() => PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationSettingUpdateManyWithoutNotificationMethodNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    settingsId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    value: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    notifications: z
        .lazy(() => NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodCreateManyInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    settingsId: z.string(),
    type: z.lazy(() => NotificationMethodTypeSchema),
    enabled: z.boolean().optional(),
    name: z.string().optional().nullable(),
    value: z.string(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z.string().optional().nullable(),
    webhookFormat: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationMethodUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    value: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationMethodUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    settingsId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    value: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationSettingCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    notificationType: z.lazy(() => NotificationTypeSchema),
    enabled: z.boolean().optional(),
    notificationMethod: z.lazy(() => NotificationMethodCreateNestedOneWithoutNotificationsInputSchema),
})
    .strict();
export const NotificationSettingUncheckedCreateInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    notificationType: z.lazy(() => NotificationTypeSchema),
    methodId: z.string(),
    enabled: z.boolean().optional(),
})
    .strict();
export const NotificationSettingUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationType: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationMethod: z
        .lazy(() => NotificationMethodUpdateOneRequiredWithoutNotificationsNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationSettingUncheckedUpdateInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationType: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    methodId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingCreateManyInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    notificationType: z.lazy(() => NotificationTypeSchema),
    methodId: z.string(),
    enabled: z.boolean().optional(),
})
    .strict();
export const NotificationSettingUpdateManyMutationInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationType: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingUncheckedUpdateManyInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationType: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    methodId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const StringFilterSchema = z
    .object({
    equals: z.string().optional(),
    in: z.string().array().optional(),
    notIn: z.string().array().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    not: z
        .union([z.string(), z.lazy(() => NestedStringFilterSchema)])
        .optional(),
})
    .strict();
export const DateTimeFilterSchema = z
    .object({
    equals: z.coerce.date().optional(),
    in: z.coerce.date().array().optional(),
    notIn: z.coerce.date().array().optional(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
        .union([z.coerce.date(), z.lazy(() => NestedDateTimeFilterSchema)])
        .optional(),
})
    .strict();
export const StringNullableFilterSchema = z
    .object({
    equals: z.string().optional().nullable(),
    in: z.string().array().optional().nullable(),
    notIn: z.string().array().optional().nullable(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    not: z
        .union([z.string(), z.lazy(() => NestedStringNullableFilterSchema)])
        .optional()
        .nullable(),
})
    .strict();
export const MembershipListRelationFilterSchema = z
    .object({
    every: z.lazy(() => MembershipWhereInputSchema).optional(),
    some: z.lazy(() => MembershipWhereInputSchema).optional(),
    none: z.lazy(() => MembershipWhereInputSchema).optional(),
})
    .strict();
export const PostListRelationFilterSchema = z
    .object({
    every: z.lazy(() => PostWhereInputSchema).optional(),
    some: z.lazy(() => PostWhereInputSchema).optional(),
    none: z.lazy(() => PostWhereInputSchema).optional(),
})
    .strict();
export const ReplyListRelationFilterSchema = z
    .object({
    every: z.lazy(() => ReplyWhereInputSchema).optional(),
    some: z.lazy(() => ReplyWhereInputSchema).optional(),
    none: z.lazy(() => ReplyWhereInputSchema).optional(),
})
    .strict();
export const NotificationListRelationFilterSchema = z
    .object({
    every: z.lazy(() => NotificationWhereInputSchema).optional(),
    some: z.lazy(() => NotificationWhereInputSchema).optional(),
    none: z.lazy(() => NotificationWhereInputSchema).optional(),
})
    .strict();
export const PersonSettingsNullableRelationFilterSchema = z
    .object({
    is: z
        .lazy(() => PersonSettingsWhereInputSchema)
        .optional()
        .nullable(),
    isNot: z
        .lazy(() => PersonSettingsWhereInputSchema)
        .optional()
        .nullable(),
})
    .strict();
export const SortOrderInputSchema = z
    .object({
    sort: z.lazy(() => SortOrderSchema),
    nulls: z.lazy(() => NullsOrderSchema).optional(),
})
    .strict();
export const MembershipOrderByRelationAggregateInputSchema = z
    .object({
    _count: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PostOrderByRelationAggregateInputSchema = z
    .object({
    _count: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const ReplyOrderByRelationAggregateInputSchema = z
    .object({
    _count: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const NotificationOrderByRelationAggregateInputSchema = z
    .object({
    _count: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PersonCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    firstName: z.lazy(() => SortOrderSchema).optional(),
    lastName: z.lazy(() => SortOrderSchema).optional(),
    username: z.lazy(() => SortOrderSchema).optional(),
    imageUrl: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PersonMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    firstName: z.lazy(() => SortOrderSchema).optional(),
    lastName: z.lazy(() => SortOrderSchema).optional(),
    username: z.lazy(() => SortOrderSchema).optional(),
    imageUrl: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PersonMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    firstName: z.lazy(() => SortOrderSchema).optional(),
    lastName: z.lazy(() => SortOrderSchema).optional(),
    username: z.lazy(() => SortOrderSchema).optional(),
    imageUrl: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const StringWithAggregatesFilterSchema = z
    .object({
    equals: z.string().optional(),
    in: z.string().array().optional(),
    notIn: z.string().array().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    not: z
        .union([
        z.string(),
        z.lazy(() => NestedStringWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedStringFilterSchema).optional(),
    _max: z.lazy(() => NestedStringFilterSchema).optional(),
})
    .strict();
export const DateTimeWithAggregatesFilterSchema = z
    .object({
    equals: z.coerce.date().optional(),
    in: z.coerce.date().array().optional(),
    notIn: z.coerce.date().array().optional(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
        .union([
        z.coerce.date(),
        z.lazy(() => NestedDateTimeWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
    _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
})
    .strict();
export const StringNullableWithAggregatesFilterSchema = z
    .object({
    equals: z.string().optional().nullable(),
    in: z.string().array().optional().nullable(),
    notIn: z.string().array().optional().nullable(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    not: z
        .union([
        z.string(),
        z.lazy(() => NestedStringNullableWithAggregatesFilterSchema),
    ])
        .optional()
        .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
})
    .strict();
export const PersonRelationFilterSchema = z
    .object({
    is: z.lazy(() => PersonWhereInputSchema).optional(),
    isNot: z.lazy(() => PersonWhereInputSchema).optional(),
})
    .strict();
export const NotificationMethodListRelationFilterSchema = z
    .object({
    every: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
    some: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
    none: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
})
    .strict();
export const NotificationMethodOrderByRelationAggregateInputSchema = z
    .object({
    _count: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PersonSettingsCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PersonSettingsMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PersonSettingsMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const DateTimeNullableFilterSchema = z
    .object({
    equals: z.coerce.date().optional().nullable(),
    in: z.coerce.date().array().optional().nullable(),
    notIn: z.coerce.date().array().optional().nullable(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
        .union([
        z.coerce.date(),
        z.lazy(() => NestedDateTimeNullableFilterSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const InviteListRelationFilterSchema = z
    .object({
    every: z.lazy(() => InviteWhereInputSchema).optional(),
    some: z.lazy(() => InviteWhereInputSchema).optional(),
    none: z.lazy(() => InviteWhereInputSchema).optional(),
})
    .strict();
export const PotentialDateTimeListRelationFilterSchema = z
    .object({
    every: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
    some: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
    none: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
})
    .strict();
export const InviteOrderByRelationAggregateInputSchema = z
    .object({
    _count: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PotentialDateTimeOrderByRelationAggregateInputSchema = z
    .object({
    _count: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const EventCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    location: z.lazy(() => SortOrderSchema).optional(),
    chosenDateTime: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const EventMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    location: z.lazy(() => SortOrderSchema).optional(),
    chosenDateTime: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const EventMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    location: z.lazy(() => SortOrderSchema).optional(),
    chosenDateTime: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const DateTimeNullableWithAggregatesFilterSchema = z
    .object({
    equals: z.coerce.date().optional().nullable(),
    in: z.coerce.date().array().optional().nullable(),
    notIn: z.coerce.date().array().optional().nullable(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
        .union([
        z.coerce.date(),
        z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema),
    ])
        .optional()
        .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
})
    .strict();
export const EnumRoleFilterSchema = z
    .object({
    equals: z.lazy(() => RoleSchema).optional(),
    in: z
        .lazy(() => RoleSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => RoleSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => NestedEnumRoleFilterSchema),
    ])
        .optional(),
})
    .strict();
export const EnumStatusFilterSchema = z
    .object({
    equals: z.lazy(() => StatusSchema).optional(),
    in: z
        .lazy(() => StatusSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => StatusSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NestedEnumStatusFilterSchema),
    ])
        .optional(),
})
    .strict();
export const EventRelationFilterSchema = z
    .object({
    is: z.lazy(() => EventWhereInputSchema).optional(),
    isNot: z.lazy(() => EventWhereInputSchema).optional(),
})
    .strict();
export const AvailabilityListRelationFilterSchema = z
    .object({
    every: z.lazy(() => AvailabilityWhereInputSchema).optional(),
    some: z.lazy(() => AvailabilityWhereInputSchema).optional(),
    none: z.lazy(() => AvailabilityWhereInputSchema).optional(),
})
    .strict();
export const AvailabilityOrderByRelationAggregateInputSchema = z
    .object({
    _count: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const MembershipCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    role: z.lazy(() => SortOrderSchema).optional(),
    rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const MembershipMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    role: z.lazy(() => SortOrderSchema).optional(),
    rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const MembershipMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    role: z.lazy(() => SortOrderSchema).optional(),
    rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const EnumRoleWithAggregatesFilterSchema = z
    .object({
    equals: z.lazy(() => RoleSchema).optional(),
    in: z
        .lazy(() => RoleSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => RoleSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
})
    .strict();
export const EnumStatusWithAggregatesFilterSchema = z
    .object({
    equals: z.lazy(() => StatusSchema).optional(),
    in: z
        .lazy(() => StatusSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => StatusSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NestedEnumStatusWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumStatusFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumStatusFilterSchema).optional(),
})
    .strict();
export const PotentialDateTimeCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    dateTime: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PotentialDateTimeMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    dateTime: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PotentialDateTimeMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    dateTime: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const MembershipRelationFilterSchema = z
    .object({
    is: z.lazy(() => MembershipWhereInputSchema).optional(),
    isNot: z.lazy(() => MembershipWhereInputSchema).optional(),
})
    .strict();
export const PotentialDateTimeRelationFilterSchema = z
    .object({
    is: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
    isNot: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
})
    .strict();
export const AvailabilityIdCompoundUniqueInputSchema = z
    .object({
    membershipId: z.string(),
    potentialDateTimeId: z.string(),
})
    .strict();
export const AvailabilityCountOrderByAggregateInputSchema = z
    .object({
    membershipId: z.lazy(() => SortOrderSchema).optional(),
    potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
    status: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const AvailabilityMaxOrderByAggregateInputSchema = z
    .object({
    membershipId: z.lazy(() => SortOrderSchema).optional(),
    potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
    status: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const AvailabilityMinOrderByAggregateInputSchema = z
    .object({
    membershipId: z.lazy(() => SortOrderSchema).optional(),
    potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
    status: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PostCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    editedAt: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PostMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    editedAt: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PostMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    editedAt: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const PostRelationFilterSchema = z
    .object({
    is: z.lazy(() => PostWhereInputSchema).optional(),
    isNot: z.lazy(() => PostWhereInputSchema).optional(),
})
    .strict();
export const ReplyCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    postId: z.lazy(() => SortOrderSchema).optional(),
    text: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const ReplyMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    postId: z.lazy(() => SortOrderSchema).optional(),
    text: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const ReplyMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    postId: z.lazy(() => SortOrderSchema).optional(),
    text: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const IntNullableFilterSchema = z
    .object({
    equals: z.number().optional().nullable(),
    in: z.number().array().optional().nullable(),
    notIn: z.number().array().optional().nullable(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
        .union([z.number(), z.lazy(() => NestedIntNullableFilterSchema)])
        .optional()
        .nullable(),
})
    .strict();
export const InviteCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    createdById: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    expiresAt: z.lazy(() => SortOrderSchema).optional(),
    usesRemaining: z.lazy(() => SortOrderSchema).optional(),
    maxUses: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const InviteAvgOrderByAggregateInputSchema = z
    .object({
    usesRemaining: z.lazy(() => SortOrderSchema).optional(),
    maxUses: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const InviteMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    createdById: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    expiresAt: z.lazy(() => SortOrderSchema).optional(),
    usesRemaining: z.lazy(() => SortOrderSchema).optional(),
    maxUses: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const InviteMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    createdById: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    expiresAt: z.lazy(() => SortOrderSchema).optional(),
    usesRemaining: z.lazy(() => SortOrderSchema).optional(),
    maxUses: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const InviteSumOrderByAggregateInputSchema = z
    .object({
    usesRemaining: z.lazy(() => SortOrderSchema).optional(),
    maxUses: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const IntNullableWithAggregatesFilterSchema = z
    .object({
    equals: z.number().optional().nullable(),
    in: z.number().array().optional().nullable(),
    notIn: z.number().array().optional().nullable(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
        .union([
        z.number(),
        z.lazy(() => NestedIntNullableWithAggregatesFilterSchema),
    ])
        .optional()
        .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
    _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
})
    .strict();
export const EnumNotificationTypeFilterSchema = z
    .object({
    equals: z.lazy(() => NotificationTypeSchema).optional(),
    in: z
        .lazy(() => NotificationTypeSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => NotificationTypeSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => NestedEnumNotificationTypeFilterSchema),
    ])
        .optional(),
})
    .strict();
export const BoolFilterSchema = z
    .object({
    equals: z.boolean().optional(),
    not: z
        .union([z.boolean(), z.lazy(() => NestedBoolFilterSchema)])
        .optional(),
})
    .strict();
export const EnumStatusNullableFilterSchema = z
    .object({
    equals: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
    in: z
        .lazy(() => StatusSchema)
        .array()
        .optional()
        .nullable(),
    notIn: z
        .lazy(() => StatusSchema)
        .array()
        .optional()
        .nullable(),
    not: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NestedEnumStatusNullableFilterSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const PersonNullableRelationFilterSchema = z
    .object({
    is: z
        .lazy(() => PersonWhereInputSchema)
        .optional()
        .nullable(),
    isNot: z
        .lazy(() => PersonWhereInputSchema)
        .optional()
        .nullable(),
})
    .strict();
export const EventNullableRelationFilterSchema = z
    .object({
    is: z
        .lazy(() => EventWhereInputSchema)
        .optional()
        .nullable(),
    isNot: z
        .lazy(() => EventWhereInputSchema)
        .optional()
        .nullable(),
})
    .strict();
export const PostNullableRelationFilterSchema = z
    .object({
    is: z
        .lazy(() => PostWhereInputSchema)
        .optional()
        .nullable(),
    isNot: z
        .lazy(() => PostWhereInputSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    postId: z.lazy(() => SortOrderSchema).optional(),
    read: z.lazy(() => SortOrderSchema).optional(),
    datetime: z.lazy(() => SortOrderSchema).optional(),
    rsvp: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const NotificationMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    postId: z.lazy(() => SortOrderSchema).optional(),
    read: z.lazy(() => SortOrderSchema).optional(),
    datetime: z.lazy(() => SortOrderSchema).optional(),
    rsvp: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const NotificationMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    personId: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    eventId: z.lazy(() => SortOrderSchema).optional(),
    postId: z.lazy(() => SortOrderSchema).optional(),
    read: z.lazy(() => SortOrderSchema).optional(),
    datetime: z.lazy(() => SortOrderSchema).optional(),
    rsvp: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const EnumNotificationTypeWithAggregatesFilterSchema = z
    .object({
    equals: z.lazy(() => NotificationTypeSchema).optional(),
    in: z
        .lazy(() => NotificationTypeSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => NotificationTypeSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => NestedEnumNotificationTypeWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumNotificationTypeFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumNotificationTypeFilterSchema).optional(),
})
    .strict();
export const BoolWithAggregatesFilterSchema = z
    .object({
    equals: z.boolean().optional(),
    not: z
        .union([
        z.boolean(),
        z.lazy(() => NestedBoolWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedBoolFilterSchema).optional(),
    _max: z.lazy(() => NestedBoolFilterSchema).optional(),
})
    .strict();
export const EnumStatusNullableWithAggregatesFilterSchema = z
    .object({
    equals: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
    in: z
        .lazy(() => StatusSchema)
        .array()
        .optional()
        .nullable(),
    notIn: z
        .lazy(() => StatusSchema)
        .array()
        .optional()
        .nullable(),
    not: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NestedEnumStatusNullableWithAggregatesFilterSchema),
    ])
        .optional()
        .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumStatusNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumStatusNullableFilterSchema).optional(),
})
    .strict();
export const EnumNotificationMethodTypeFilterSchema = z
    .object({
    equals: z.lazy(() => NotificationMethodTypeSchema).optional(),
    in: z
        .lazy(() => NotificationMethodTypeSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => NotificationMethodTypeSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => NestedEnumNotificationMethodTypeFilterSchema),
    ])
        .optional(),
})
    .strict();
export const JsonNullableFilterSchema = z
    .object({
    equals: InputJsonValueSchema.optional(),
    path: z.string().array().optional(),
    string_contains: z.string().optional(),
    string_starts_with: z.string().optional(),
    string_ends_with: z.string().optional(),
    array_contains: InputJsonValueSchema.optional().nullable(),
    array_starts_with: InputJsonValueSchema.optional().nullable(),
    array_ends_with: InputJsonValueSchema.optional().nullable(),
    lt: InputJsonValueSchema.optional(),
    lte: InputJsonValueSchema.optional(),
    gt: InputJsonValueSchema.optional(),
    gte: InputJsonValueSchema.optional(),
    not: InputJsonValueSchema.optional(),
})
    .strict();
export const EnumWebhookFormatNullableFilterSchema = z
    .object({
    equals: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
    in: z
        .lazy(() => WebhookFormatSchema)
        .array()
        .optional()
        .nullable(),
    notIn: z
        .lazy(() => WebhookFormatSchema)
        .array()
        .optional()
        .nullable(),
    not: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NestedEnumWebhookFormatNullableFilterSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const PersonSettingsRelationFilterSchema = z
    .object({
    is: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
    isNot: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
})
    .strict();
export const NotificationSettingListRelationFilterSchema = z
    .object({
    every: z.lazy(() => NotificationSettingWhereInputSchema).optional(),
    some: z.lazy(() => NotificationSettingWhereInputSchema).optional(),
    none: z.lazy(() => NotificationSettingWhereInputSchema).optional(),
})
    .strict();
export const NotificationSettingOrderByRelationAggregateInputSchema = z
    .object({
    _count: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const NotificationMethodCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    settingsId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    enabled: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    webhookHeaders: z.lazy(() => SortOrderSchema).optional(),
    customTemplate: z.lazy(() => SortOrderSchema).optional(),
    webhookFormat: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const NotificationMethodMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    settingsId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    enabled: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    customTemplate: z.lazy(() => SortOrderSchema).optional(),
    webhookFormat: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const NotificationMethodMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    settingsId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    enabled: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    customTemplate: z.lazy(() => SortOrderSchema).optional(),
    webhookFormat: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const EnumNotificationMethodTypeWithAggregatesFilterSchema = z
    .object({
    equals: z.lazy(() => NotificationMethodTypeSchema).optional(),
    in: z
        .lazy(() => NotificationMethodTypeSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => NotificationMethodTypeSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => NestedEnumNotificationMethodTypeWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z
        .lazy(() => NestedEnumNotificationMethodTypeFilterSchema)
        .optional(),
    _max: z
        .lazy(() => NestedEnumNotificationMethodTypeFilterSchema)
        .optional(),
})
    .strict();
export const JsonNullableWithAggregatesFilterSchema = z
    .object({
    equals: InputJsonValueSchema.optional(),
    path: z.string().array().optional(),
    string_contains: z.string().optional(),
    string_starts_with: z.string().optional(),
    string_ends_with: z.string().optional(),
    array_contains: InputJsonValueSchema.optional().nullable(),
    array_starts_with: InputJsonValueSchema.optional().nullable(),
    array_ends_with: InputJsonValueSchema.optional().nullable(),
    lt: InputJsonValueSchema.optional(),
    lte: InputJsonValueSchema.optional(),
    gt: InputJsonValueSchema.optional(),
    gte: InputJsonValueSchema.optional(),
    not: InputJsonValueSchema.optional(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
})
    .strict();
export const EnumWebhookFormatNullableWithAggregatesFilterSchema = z
    .object({
    equals: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
    in: z
        .lazy(() => WebhookFormatSchema)
        .array()
        .optional()
        .nullable(),
    notIn: z
        .lazy(() => WebhookFormatSchema)
        .array()
        .optional()
        .nullable(),
    not: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NestedEnumWebhookFormatNullableWithAggregatesFilterSchema),
    ])
        .optional()
        .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z
        .lazy(() => NestedEnumWebhookFormatNullableFilterSchema)
        .optional(),
    _max: z
        .lazy(() => NestedEnumWebhookFormatNullableFilterSchema)
        .optional(),
})
    .strict();
export const NotificationMethodRelationFilterSchema = z
    .object({
    is: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
    isNot: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
})
    .strict();
export const NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema = z
    .object({
    notificationType: z.lazy(() => NotificationTypeSchema),
    methodId: z.string(),
})
    .strict();
export const NotificationSettingCountOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    notificationType: z.lazy(() => SortOrderSchema).optional(),
    methodId: z.lazy(() => SortOrderSchema).optional(),
    enabled: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const NotificationSettingMaxOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    notificationType: z.lazy(() => SortOrderSchema).optional(),
    methodId: z.lazy(() => SortOrderSchema).optional(),
    enabled: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const NotificationSettingMinOrderByAggregateInputSchema = z
    .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    notificationType: z.lazy(() => SortOrderSchema).optional(),
    methodId: z.lazy(() => SortOrderSchema).optional(),
    enabled: z.lazy(() => SortOrderSchema).optional(),
})
    .strict();
export const MembershipCreateNestedManyWithoutPersonInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutPersonInputSchema),
        z.lazy(() => MembershipCreateWithoutPersonInputSchema).array(),
        z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema),
        z
            .lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema),
        z
            .lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => MembershipCreateManyPersonInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PostCreateNestedManyWithoutAuthorInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PostCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const ReplyCreateNestedManyWithoutAuthorInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => ReplyCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationCreateNestedManyWithoutPersonInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutPersonInputSchema),
        z.lazy(() => NotificationCreateWithoutPersonInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyPersonInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationCreateNestedManyWithoutAuthorInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema),
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsCreateNestedOneWithoutPersonInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonSettingsCreateOrConnectWithoutPersonInputSchema)
        .optional(),
    connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
})
    .strict();
export const MembershipUncheckedCreateNestedManyWithoutPersonInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutPersonInputSchema),
        z.lazy(() => MembershipCreateWithoutPersonInputSchema).array(),
        z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema),
        z
            .lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema),
        z
            .lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => MembershipCreateManyPersonInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PostUncheckedCreateNestedManyWithoutAuthorInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PostCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => ReplyCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUncheckedCreateNestedManyWithoutPersonInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutPersonInputSchema),
        z.lazy(() => NotificationCreateWithoutPersonInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyPersonInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema),
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonSettingsCreateOrConnectWithoutPersonInputSchema)
        .optional(),
    connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
})
    .strict();
export const StringFieldUpdateOperationsInputSchema = z
    .object({
    set: z.string().optional(),
})
    .strict();
export const DateTimeFieldUpdateOperationsInputSchema = z
    .object({
    set: z.coerce.date().optional(),
})
    .strict();
export const NullableStringFieldUpdateOperationsInputSchema = z
    .object({
    set: z.string().optional().nullable(),
})
    .strict();
export const MembershipUpdateManyWithoutPersonNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutPersonInputSchema),
        z.lazy(() => MembershipCreateWithoutPersonInputSchema).array(),
        z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema),
        z
            .lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema),
        z
            .lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => MembershipUpsertWithWhereUniqueWithoutPersonInputSchema),
        z
            .lazy(() => MembershipUpsertWithWhereUniqueWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => MembershipCreateManyPersonInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => MembershipUpdateWithWhereUniqueWithoutPersonInputSchema),
        z
            .lazy(() => MembershipUpdateWithWhereUniqueWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => MembershipUpdateManyWithWhereWithoutPersonInputSchema),
        z
            .lazy(() => MembershipUpdateManyWithWhereWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => MembershipScalarWhereInputSchema),
        z.lazy(() => MembershipScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PostUpdateManyWithoutAuthorNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PostCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema),
        z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => PostScalarWhereInputSchema),
        z.lazy(() => PostScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const ReplyUpdateManyWithoutAuthorNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => ReplyCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => ReplyUpdateManyWithWhereWithoutAuthorInputSchema),
        z
            .lazy(() => ReplyUpdateManyWithWhereWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => ReplyScalarWhereInputSchema),
        z.lazy(() => ReplyScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUpdateManyWithoutPersonNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutPersonInputSchema),
        z.lazy(() => NotificationCreateWithoutPersonInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema),
        z
            .lazy(() => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyPersonInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema),
        z
            .lazy(() => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationUpdateManyWithWhereWithoutPersonInputSchema),
        z
            .lazy(() => NotificationUpdateManyWithWhereWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationScalarWhereInputSchema),
        z.lazy(() => NotificationScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUpdateManyWithoutAuthorNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema),
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationUpdateManyWithWhereWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationUpdateManyWithWhereWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationScalarWhereInputSchema),
        z.lazy(() => NotificationScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsUpdateOneWithoutPersonNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonSettingsCreateOrConnectWithoutPersonInputSchema)
        .optional(),
    upsert: z
        .lazy(() => PersonSettingsUpsertWithoutPersonInputSchema)
        .optional(),
    disconnect: z
        .union([z.boolean(), z.lazy(() => PersonSettingsWhereInputSchema)])
        .optional(),
    delete: z
        .union([z.boolean(), z.lazy(() => PersonSettingsWhereInputSchema)])
        .optional(),
    connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PersonSettingsUpdateToOneWithWhereWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema),
    ])
        .optional(),
})
    .strict();
export const MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutPersonInputSchema),
        z.lazy(() => MembershipCreateWithoutPersonInputSchema).array(),
        z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema),
        z
            .lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema),
        z
            .lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => MembershipUpsertWithWhereUniqueWithoutPersonInputSchema),
        z
            .lazy(() => MembershipUpsertWithWhereUniqueWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => MembershipCreateManyPersonInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => MembershipUpdateWithWhereUniqueWithoutPersonInputSchema),
        z
            .lazy(() => MembershipUpdateWithWhereUniqueWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => MembershipUpdateManyWithWhereWithoutPersonInputSchema),
        z
            .lazy(() => MembershipUpdateManyWithWhereWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => MembershipScalarWhereInputSchema),
        z.lazy(() => MembershipScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PostUncheckedUpdateManyWithoutAuthorNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PostCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema),
        z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => PostScalarWhereInputSchema),
        z.lazy(() => PostScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema).array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => ReplyCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => ReplyUpdateManyWithWhereWithoutAuthorInputSchema),
        z
            .lazy(() => ReplyUpdateManyWithWhereWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => ReplyScalarWhereInputSchema),
        z.lazy(() => ReplyScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutPersonInputSchema),
        z.lazy(() => NotificationCreateWithoutPersonInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema),
        z
            .lazy(() => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyPersonInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema),
        z
            .lazy(() => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationUpdateManyWithWhereWithoutPersonInputSchema),
        z
            .lazy(() => NotificationUpdateManyWithWhereWithoutPersonInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationScalarWhereInputSchema),
        z.lazy(() => NotificationScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema),
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyAuthorInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationUpdateManyWithWhereWithoutAuthorInputSchema),
        z
            .lazy(() => NotificationUpdateManyWithWhereWithoutAuthorInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationScalarWhereInputSchema),
        z.lazy(() => NotificationScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonSettingsCreateOrConnectWithoutPersonInputSchema)
        .optional(),
    upsert: z
        .lazy(() => PersonSettingsUpsertWithoutPersonInputSchema)
        .optional(),
    disconnect: z
        .union([z.boolean(), z.lazy(() => PersonSettingsWhereInputSchema)])
        .optional(),
    delete: z
        .union([z.boolean(), z.lazy(() => PersonSettingsWhereInputSchema)])
        .optional(),
    connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PersonSettingsUpdateToOneWithWhereWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema),
    ])
        .optional(),
})
    .strict();
export const PersonCreateNestedOneWithoutSettingsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutSettingsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutSettingsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutSettingsInputSchema)
        .optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
})
    .strict();
export const NotificationMethodCreateNestedManyWithoutSettingsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodCreateWithoutSettingsInputSchema)
            .array(),
        z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationMethodCreateManySettingsInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationMethodWhereUniqueInputSchema),
        z.lazy(() => NotificationMethodWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationMethodUncheckedCreateNestedManyWithoutSettingsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodCreateWithoutSettingsInputSchema)
            .array(),
        z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationMethodCreateManySettingsInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationMethodWhereUniqueInputSchema),
        z.lazy(() => NotificationMethodWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PersonUpdateOneRequiredWithoutSettingsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutSettingsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutSettingsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutSettingsInputSchema)
        .optional(),
    upsert: z.lazy(() => PersonUpsertWithoutSettingsInputSchema).optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PersonUpdateToOneWithWhereWithoutSettingsInputSchema),
        z.lazy(() => PersonUpdateWithoutSettingsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutSettingsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationMethodUpdateManyWithoutSettingsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodCreateWithoutSettingsInputSchema)
            .array(),
        z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationMethodCreateManySettingsInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationMethodWhereUniqueInputSchema),
        z.lazy(() => NotificationMethodWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationMethodWhereUniqueInputSchema),
        z.lazy(() => NotificationMethodWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationMethodWhereUniqueInputSchema),
        z.lazy(() => NotificationMethodWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationMethodWhereUniqueInputSchema),
        z.lazy(() => NotificationMethodWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationMethodScalarWhereInputSchema),
        z.lazy(() => NotificationMethodScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodCreateWithoutSettingsInputSchema)
            .array(),
        z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationMethodCreateManySettingsInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationMethodWhereUniqueInputSchema),
        z.lazy(() => NotificationMethodWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationMethodWhereUniqueInputSchema),
        z.lazy(() => NotificationMethodWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationMethodWhereUniqueInputSchema),
        z.lazy(() => NotificationMethodWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationMethodWhereUniqueInputSchema),
        z.lazy(() => NotificationMethodWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema),
        z
            .lazy(() => NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationMethodScalarWhereInputSchema),
        z.lazy(() => NotificationMethodScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const InviteCreateNestedManyWithoutEventInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => InviteCreateWithoutEventInputSchema),
        z.lazy(() => InviteCreateWithoutEventInputSchema).array(),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema),
        z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema).array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => InviteCreateManyEventInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeCreateNestedManyWithoutEventInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema),
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema).array(),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PotentialDateTimeCreateManyEventInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PostCreateNestedManyWithoutEventInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutEventInputSchema),
        z.lazy(() => PostCreateWithoutEventInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PostCreateOrConnectWithoutEventInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutEventInputSchema).array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PostCreateManyEventInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const MembershipCreateNestedManyWithoutEventInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutEventInputSchema),
        z.lazy(() => MembershipCreateWithoutEventInputSchema).array(),
        z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => MembershipUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => MembershipCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => MembershipCreateManyEventInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationCreateNestedManyWithoutEventInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutEventInputSchema),
        z.lazy(() => NotificationCreateWithoutEventInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyEventInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const InviteUncheckedCreateNestedManyWithoutEventInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => InviteCreateWithoutEventInputSchema),
        z.lazy(() => InviteCreateWithoutEventInputSchema).array(),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema),
        z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema).array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => InviteCreateManyEventInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema),
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema).array(),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PotentialDateTimeCreateManyEventInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PostUncheckedCreateNestedManyWithoutEventInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutEventInputSchema),
        z.lazy(() => PostCreateWithoutEventInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PostCreateOrConnectWithoutEventInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutEventInputSchema).array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PostCreateManyEventInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const MembershipUncheckedCreateNestedManyWithoutEventInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutEventInputSchema),
        z.lazy(() => MembershipCreateWithoutEventInputSchema).array(),
        z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => MembershipUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => MembershipCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => MembershipCreateManyEventInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUncheckedCreateNestedManyWithoutEventInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutEventInputSchema),
        z.lazy(() => NotificationCreateWithoutEventInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyEventInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NullableDateTimeFieldUpdateOperationsInputSchema = z
    .object({
    set: z.coerce.date().optional().nullable(),
})
    .strict();
export const InviteUpdateManyWithoutEventNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => InviteCreateWithoutEventInputSchema),
        z.lazy(() => InviteCreateWithoutEventInputSchema).array(),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema),
        z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema).array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => InviteUpsertWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => InviteUpsertWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => InviteCreateManyEventInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => InviteUpdateWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => InviteUpdateWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => InviteUpdateManyWithWhereWithoutEventInputSchema),
        z
            .lazy(() => InviteUpdateManyWithWhereWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => InviteScalarWhereInputSchema),
        z.lazy(() => InviteScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeUpdateManyWithoutEventNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema),
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema).array(),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PotentialDateTimeCreateManyEventInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => PotentialDateTimeScalarWhereInputSchema),
        z.lazy(() => PotentialDateTimeScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PostUpdateManyWithoutEventNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutEventInputSchema),
        z.lazy(() => PostCreateWithoutEventInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PostCreateOrConnectWithoutEventInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutEventInputSchema).array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => PostUpsertWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => PostUpsertWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PostCreateManyEventInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => PostUpdateWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => PostUpdateWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => PostUpdateManyWithWhereWithoutEventInputSchema),
        z.lazy(() => PostUpdateManyWithWhereWithoutEventInputSchema).array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => PostScalarWhereInputSchema),
        z.lazy(() => PostScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const MembershipUpdateManyWithoutEventNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutEventInputSchema),
        z.lazy(() => MembershipCreateWithoutEventInputSchema).array(),
        z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => MembershipUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => MembershipCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => MembershipUpsertWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => MembershipUpsertWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => MembershipCreateManyEventInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => MembershipUpdateWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => MembershipUpdateWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => MembershipUpdateManyWithWhereWithoutEventInputSchema),
        z
            .lazy(() => MembershipUpdateManyWithWhereWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => MembershipScalarWhereInputSchema),
        z.lazy(() => MembershipScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUpdateManyWithoutEventNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutEventInputSchema),
        z.lazy(() => NotificationCreateWithoutEventInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationUpsertWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => NotificationUpsertWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyEventInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationUpdateWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => NotificationUpdateWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationUpdateManyWithWhereWithoutEventInputSchema),
        z
            .lazy(() => NotificationUpdateManyWithWhereWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationScalarWhereInputSchema),
        z.lazy(() => NotificationScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const InviteUncheckedUpdateManyWithoutEventNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => InviteCreateWithoutEventInputSchema),
        z.lazy(() => InviteCreateWithoutEventInputSchema).array(),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema),
        z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema).array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => InviteUpsertWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => InviteUpsertWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => InviteCreateManyEventInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => InviteUpdateWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => InviteUpdateWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => InviteUpdateManyWithWhereWithoutEventInputSchema),
        z
            .lazy(() => InviteUpdateManyWithWhereWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => InviteScalarWhereInputSchema),
        z.lazy(() => InviteScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema),
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema).array(),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PotentialDateTimeCreateManyEventInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
        z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema),
        z
            .lazy(() => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => PotentialDateTimeScalarWhereInputSchema),
        z.lazy(() => PotentialDateTimeScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PostUncheckedUpdateManyWithoutEventNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutEventInputSchema),
        z.lazy(() => PostCreateWithoutEventInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => PostCreateOrConnectWithoutEventInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutEventInputSchema).array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => PostUpsertWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => PostUpsertWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => PostCreateManyEventInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => PostUpdateWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => PostUpdateWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => PostUpdateManyWithWhereWithoutEventInputSchema),
        z.lazy(() => PostUpdateManyWithWhereWithoutEventInputSchema).array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => PostScalarWhereInputSchema),
        z.lazy(() => PostScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const MembershipUncheckedUpdateManyWithoutEventNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutEventInputSchema),
        z.lazy(() => MembershipCreateWithoutEventInputSchema).array(),
        z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => MembershipUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => MembershipCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => MembershipUpsertWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => MembershipUpsertWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => MembershipCreateManyEventInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => MembershipWhereUniqueInputSchema),
        z.lazy(() => MembershipWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => MembershipUpdateWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => MembershipUpdateWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => MembershipUpdateManyWithWhereWithoutEventInputSchema),
        z
            .lazy(() => MembershipUpdateManyWithWhereWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => MembershipScalarWhereInputSchema),
        z.lazy(() => MembershipScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUncheckedUpdateManyWithoutEventNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutEventInputSchema),
        z.lazy(() => NotificationCreateWithoutEventInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationUpsertWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => NotificationUpsertWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyEventInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationUpdateWithWhereUniqueWithoutEventInputSchema),
        z
            .lazy(() => NotificationUpdateWithWhereUniqueWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationUpdateManyWithWhereWithoutEventInputSchema),
        z
            .lazy(() => NotificationUpdateManyWithWhereWithoutEventInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationScalarWhereInputSchema),
        z.lazy(() => NotificationScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PersonCreateNestedOneWithoutMembershipsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutMembershipsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutMembershipsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutMembershipsInputSchema)
        .optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
})
    .strict();
export const EventCreateNestedOneWithoutMembershipsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => EventCreateWithoutMembershipsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutMembershipsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutMembershipsInputSchema)
        .optional(),
    connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
})
    .strict();
export const AvailabilityCreateNestedManyWithoutMembershipInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema),
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema).array(),
        z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => AvailabilityCreateManyMembershipInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const InviteCreateNestedManyWithoutCreatedByInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema),
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema).array(),
        z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => InviteCreateManyCreatedByInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema),
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema).array(),
        z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => AvailabilityCreateManyMembershipInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema),
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema).array(),
        z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => InviteCreateManyCreatedByInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const EnumRoleFieldUpdateOperationsInputSchema = z
    .object({
    set: z.lazy(() => RoleSchema).optional(),
})
    .strict();
export const EnumStatusFieldUpdateOperationsInputSchema = z
    .object({
    set: z.lazy(() => StatusSchema).optional(),
})
    .strict();
export const PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutMembershipsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutMembershipsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutMembershipsInputSchema)
        .optional(),
    upsert: z
        .lazy(() => PersonUpsertWithoutMembershipsInputSchema)
        .optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PersonUpdateToOneWithWhereWithoutMembershipsInputSchema),
        z.lazy(() => PersonUpdateWithoutMembershipsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutMembershipsInputSchema),
    ])
        .optional(),
})
    .strict();
export const EventUpdateOneRequiredWithoutMembershipsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => EventCreateWithoutMembershipsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutMembershipsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutMembershipsInputSchema)
        .optional(),
    upsert: z.lazy(() => EventUpsertWithoutMembershipsInputSchema).optional(),
    connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => EventUpdateToOneWithWhereWithoutMembershipsInputSchema),
        z.lazy(() => EventUpdateWithoutMembershipsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutMembershipsInputSchema),
    ])
        .optional(),
})
    .strict();
export const AvailabilityUpdateManyWithoutMembershipNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema),
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema).array(),
        z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => AvailabilityCreateManyMembershipInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => AvailabilityScalarWhereInputSchema),
        z.lazy(() => AvailabilityScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const InviteUpdateManyWithoutCreatedByNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema),
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema).array(),
        z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => InviteCreateManyCreatedByInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => InviteUpdateManyWithWhereWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteUpdateManyWithWhereWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => InviteScalarWhereInputSchema),
        z.lazy(() => InviteScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema),
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema).array(),
        z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => AvailabilityCreateManyMembershipInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema),
        z
            .lazy(() => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => AvailabilityScalarWhereInputSchema),
        z.lazy(() => AvailabilityScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema),
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema).array(),
        z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => InviteCreateManyCreatedByInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => InviteWhereUniqueInputSchema),
        z.lazy(() => InviteWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => InviteUpdateManyWithWhereWithoutCreatedByInputSchema),
        z
            .lazy(() => InviteUpdateManyWithWhereWithoutCreatedByInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => InviteScalarWhereInputSchema),
        z.lazy(() => InviteScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const EventCreateNestedOneWithoutPotentialDateTimesInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutPotentialDateTimesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutPotentialDateTimesInputSchema)
        .optional(),
    connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
})
    .strict();
export const AvailabilityCreateNestedManyWithoutPotentialDateTimeInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema)
            .array(),
        z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema)
            .array(),
        z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const EventUpdateOneRequiredWithoutPotentialDateTimesNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutPotentialDateTimesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutPotentialDateTimesInputSchema)
        .optional(),
    upsert: z
        .lazy(() => EventUpsertWithoutPotentialDateTimesInputSchema)
        .optional(),
    connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => EventUpdateToOneWithWhereWithoutPotentialDateTimesInputSchema),
        z.lazy(() => EventUpdateWithoutPotentialDateTimesInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutPotentialDateTimesInputSchema),
    ])
        .optional(),
})
    .strict();
export const AvailabilityUpdateManyWithoutPotentialDateTimeNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema)
            .array(),
        z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => AvailabilityScalarWhereInputSchema),
        z.lazy(() => AvailabilityScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema)
            .array(),
        z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => AvailabilityWhereUniqueInputSchema),
        z.lazy(() => AvailabilityWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => AvailabilityScalarWhereInputSchema),
        z.lazy(() => AvailabilityScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const MembershipCreateNestedOneWithoutAvailabilitiesInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => MembershipCreateOrConnectWithoutAvailabilitiesInputSchema)
        .optional(),
    connect: z.lazy(() => MembershipWhereUniqueInputSchema).optional(),
})
    .strict();
export const PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInputSchema)
        .optional(),
    connect: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).optional(),
})
    .strict();
export const MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => MembershipCreateOrConnectWithoutAvailabilitiesInputSchema)
        .optional(),
    upsert: z
        .lazy(() => MembershipUpsertWithoutAvailabilitiesInputSchema)
        .optional(),
    connect: z.lazy(() => MembershipWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => MembershipUpdateToOneWithWhereWithoutAvailabilitiesInputSchema),
        z.lazy(() => MembershipUpdateWithoutAvailabilitiesInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInputSchema)
        .optional(),
    upsert: z
        .lazy(() => PotentialDateTimeUpsertWithoutAvailabilitiesInputSchema)
        .optional(),
    connect: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PotentialDateTimeUpdateToOneWithWhereWithoutAvailabilitiesInputSchema),
        z.lazy(() => PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema),
    ])
        .optional(),
})
    .strict();
export const PersonCreateNestedOneWithoutPostsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutPostsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutPostsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutPostsInputSchema)
        .optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
})
    .strict();
export const EventCreateNestedOneWithoutPostsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => EventCreateWithoutPostsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutPostsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutPostsInputSchema)
        .optional(),
    connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
})
    .strict();
export const ReplyCreateNestedManyWithoutPostInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => ReplyCreateWithoutPostInputSchema),
        z.lazy(() => ReplyCreateWithoutPostInputSchema).array(),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema),
        z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema).array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => ReplyCreateManyPostInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationCreateNestedManyWithoutPostInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutPostInputSchema),
        z.lazy(() => NotificationCreateWithoutPostInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyPostInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const ReplyUncheckedCreateNestedManyWithoutPostInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => ReplyCreateWithoutPostInputSchema),
        z.lazy(() => ReplyCreateWithoutPostInputSchema).array(),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema),
        z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema).array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => ReplyCreateManyPostInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUncheckedCreateNestedManyWithoutPostInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutPostInputSchema),
        z.lazy(() => NotificationCreateWithoutPostInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyPostInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PersonUpdateOneRequiredWithoutPostsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutPostsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutPostsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutPostsInputSchema)
        .optional(),
    upsert: z.lazy(() => PersonUpsertWithoutPostsInputSchema).optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PersonUpdateToOneWithWhereWithoutPostsInputSchema),
        z.lazy(() => PersonUpdateWithoutPostsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutPostsInputSchema),
    ])
        .optional(),
})
    .strict();
export const EventUpdateOneRequiredWithoutPostsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => EventCreateWithoutPostsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutPostsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutPostsInputSchema)
        .optional(),
    upsert: z.lazy(() => EventUpsertWithoutPostsInputSchema).optional(),
    connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => EventUpdateToOneWithWhereWithoutPostsInputSchema),
        z.lazy(() => EventUpdateWithoutPostsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutPostsInputSchema),
    ])
        .optional(),
})
    .strict();
export const ReplyUpdateManyWithoutPostNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => ReplyCreateWithoutPostInputSchema),
        z.lazy(() => ReplyCreateWithoutPostInputSchema).array(),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema),
        z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema).array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => ReplyUpsertWithWhereUniqueWithoutPostInputSchema),
        z
            .lazy(() => ReplyUpsertWithWhereUniqueWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => ReplyCreateManyPostInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => ReplyUpdateWithWhereUniqueWithoutPostInputSchema),
        z
            .lazy(() => ReplyUpdateWithWhereUniqueWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => ReplyUpdateManyWithWhereWithoutPostInputSchema),
        z.lazy(() => ReplyUpdateManyWithWhereWithoutPostInputSchema).array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => ReplyScalarWhereInputSchema),
        z.lazy(() => ReplyScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUpdateManyWithoutPostNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutPostInputSchema),
        z.lazy(() => NotificationCreateWithoutPostInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPostInputSchema),
        z
            .lazy(() => NotificationUpsertWithWhereUniqueWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyPostInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPostInputSchema),
        z
            .lazy(() => NotificationUpdateWithWhereUniqueWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationUpdateManyWithWhereWithoutPostInputSchema),
        z
            .lazy(() => NotificationUpdateManyWithWhereWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationScalarWhereInputSchema),
        z.lazy(() => NotificationScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const ReplyUncheckedUpdateManyWithoutPostNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => ReplyCreateWithoutPostInputSchema),
        z.lazy(() => ReplyCreateWithoutPostInputSchema).array(),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema).array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema),
        z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema).array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => ReplyUpsertWithWhereUniqueWithoutPostInputSchema),
        z
            .lazy(() => ReplyUpsertWithWhereUniqueWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => ReplyCreateManyPostInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => ReplyWhereUniqueInputSchema),
        z.lazy(() => ReplyWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => ReplyUpdateWithWhereUniqueWithoutPostInputSchema),
        z
            .lazy(() => ReplyUpdateWithWhereUniqueWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => ReplyUpdateManyWithWhereWithoutPostInputSchema),
        z.lazy(() => ReplyUpdateManyWithWhereWithoutPostInputSchema).array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => ReplyScalarWhereInputSchema),
        z.lazy(() => ReplyScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationUncheckedUpdateManyWithoutPostNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationCreateWithoutPostInputSchema),
        z.lazy(() => NotificationCreateWithoutPostInputSchema).array(),
        z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema),
        z
            .lazy(() => NotificationUncheckedCreateWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema),
        z
            .lazy(() => NotificationCreateOrConnectWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPostInputSchema),
        z
            .lazy(() => NotificationUpsertWithWhereUniqueWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationCreateManyPostInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationWhereUniqueInputSchema),
        z.lazy(() => NotificationWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPostInputSchema),
        z
            .lazy(() => NotificationUpdateWithWhereUniqueWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationUpdateManyWithWhereWithoutPostInputSchema),
        z
            .lazy(() => NotificationUpdateManyWithWhereWithoutPostInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationScalarWhereInputSchema),
        z.lazy(() => NotificationScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const PersonCreateNestedOneWithoutRepliesInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutRepliesInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutRepliesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutRepliesInputSchema)
        .optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
})
    .strict();
export const PostCreateNestedOneWithoutRepliesInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutRepliesInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutRepliesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PostCreateOrConnectWithoutRepliesInputSchema)
        .optional(),
    connect: z.lazy(() => PostWhereUniqueInputSchema).optional(),
})
    .strict();
export const PersonUpdateOneRequiredWithoutRepliesNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutRepliesInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutRepliesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutRepliesInputSchema)
        .optional(),
    upsert: z.lazy(() => PersonUpsertWithoutRepliesInputSchema).optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PersonUpdateToOneWithWhereWithoutRepliesInputSchema),
        z.lazy(() => PersonUpdateWithoutRepliesInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutRepliesInputSchema),
    ])
        .optional(),
})
    .strict();
export const PostUpdateOneRequiredWithoutRepliesNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutRepliesInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutRepliesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PostCreateOrConnectWithoutRepliesInputSchema)
        .optional(),
    upsert: z.lazy(() => PostUpsertWithoutRepliesInputSchema).optional(),
    connect: z.lazy(() => PostWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PostUpdateToOneWithWhereWithoutRepliesInputSchema),
        z.lazy(() => PostUpdateWithoutRepliesInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutRepliesInputSchema),
    ])
        .optional(),
})
    .strict();
export const EventCreateNestedOneWithoutInvitesInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => EventCreateWithoutInvitesInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutInvitesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutInvitesInputSchema)
        .optional(),
    connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
})
    .strict();
export const MembershipCreateNestedOneWithoutInvitesInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutInvitesInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutInvitesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => MembershipCreateOrConnectWithoutInvitesInputSchema)
        .optional(),
    connect: z.lazy(() => MembershipWhereUniqueInputSchema).optional(),
})
    .strict();
export const NullableIntFieldUpdateOperationsInputSchema = z
    .object({
    set: z.number().optional().nullable(),
    increment: z.number().optional(),
    decrement: z.number().optional(),
    multiply: z.number().optional(),
    divide: z.number().optional(),
})
    .strict();
export const EventUpdateOneRequiredWithoutInvitesNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => EventCreateWithoutInvitesInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutInvitesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutInvitesInputSchema)
        .optional(),
    upsert: z.lazy(() => EventUpsertWithoutInvitesInputSchema).optional(),
    connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => EventUpdateToOneWithWhereWithoutInvitesInputSchema),
        z.lazy(() => EventUpdateWithoutInvitesInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutInvitesInputSchema),
    ])
        .optional(),
})
    .strict();
export const MembershipUpdateOneRequiredWithoutInvitesNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => MembershipCreateWithoutInvitesInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutInvitesInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => MembershipCreateOrConnectWithoutInvitesInputSchema)
        .optional(),
    upsert: z
        .lazy(() => MembershipUpsertWithoutInvitesInputSchema)
        .optional(),
    connect: z.lazy(() => MembershipWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => MembershipUpdateToOneWithWhereWithoutInvitesInputSchema),
        z.lazy(() => MembershipUpdateWithoutInvitesInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutInvitesInputSchema),
    ])
        .optional(),
})
    .strict();
export const PersonCreateNestedOneWithoutNotificationsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutNotificationsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutNotificationsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutNotificationsInputSchema)
        .optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
})
    .strict();
export const PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutAuthoredNotificationsInputSchema)
        .optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
})
    .strict();
export const EventCreateNestedOneWithoutNotificationsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => EventCreateWithoutNotificationsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutNotificationsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutNotificationsInputSchema)
        .optional(),
    connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
})
    .strict();
export const PostCreateNestedOneWithoutNotificationsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutNotificationsInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutNotificationsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PostCreateOrConnectWithoutNotificationsInputSchema)
        .optional(),
    connect: z.lazy(() => PostWhereUniqueInputSchema).optional(),
})
    .strict();
export const EnumNotificationTypeFieldUpdateOperationsInputSchema = z
    .object({
    set: z.lazy(() => NotificationTypeSchema).optional(),
})
    .strict();
export const BoolFieldUpdateOperationsInputSchema = z
    .object({
    set: z.boolean().optional(),
})
    .strict();
export const NullableEnumStatusFieldUpdateOperationsInputSchema = z
    .object({
    set: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutNotificationsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutNotificationsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutNotificationsInputSchema)
        .optional(),
    upsert: z
        .lazy(() => PersonUpsertWithoutNotificationsInputSchema)
        .optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PersonUpdateToOneWithWhereWithoutNotificationsInputSchema),
        z.lazy(() => PersonUpdateWithoutNotificationsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutNotificationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonCreateOrConnectWithoutAuthoredNotificationsInputSchema)
        .optional(),
    upsert: z
        .lazy(() => PersonUpsertWithoutAuthoredNotificationsInputSchema)
        .optional(),
    disconnect: z
        .union([z.boolean(), z.lazy(() => PersonWhereInputSchema)])
        .optional(),
    delete: z
        .union([z.boolean(), z.lazy(() => PersonWhereInputSchema)])
        .optional(),
    connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PersonUpdateToOneWithWhereWithoutAuthoredNotificationsInputSchema),
        z.lazy(() => PersonUpdateWithoutAuthoredNotificationsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const EventUpdateOneWithoutNotificationsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => EventCreateWithoutNotificationsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutNotificationsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutNotificationsInputSchema)
        .optional(),
    upsert: z
        .lazy(() => EventUpsertWithoutNotificationsInputSchema)
        .optional(),
    disconnect: z
        .union([z.boolean(), z.lazy(() => EventWhereInputSchema)])
        .optional(),
    delete: z
        .union([z.boolean(), z.lazy(() => EventWhereInputSchema)])
        .optional(),
    connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => EventUpdateToOneWithWhereWithoutNotificationsInputSchema),
        z.lazy(() => EventUpdateWithoutNotificationsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutNotificationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PostUpdateOneWithoutNotificationsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PostCreateWithoutNotificationsInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutNotificationsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PostCreateOrConnectWithoutNotificationsInputSchema)
        .optional(),
    upsert: z
        .lazy(() => PostUpsertWithoutNotificationsInputSchema)
        .optional(),
    disconnect: z
        .union([z.boolean(), z.lazy(() => PostWhereInputSchema)])
        .optional(),
    delete: z
        .union([z.boolean(), z.lazy(() => PostWhereInputSchema)])
        .optional(),
    connect: z.lazy(() => PostWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PostUpdateToOneWithWhereWithoutNotificationsInputSchema),
        z.lazy(() => PostUpdateWithoutNotificationsInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutNotificationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsCreateNestedOneWithoutNotificationMethodsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonSettingsCreateWithoutNotificationMethodsInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonSettingsCreateOrConnectWithoutNotificationMethodsInputSchema)
        .optional(),
    connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
})
    .strict();
export const NotificationSettingCreateNestedManyWithoutNotificationMethodInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema)
            .array(),
        z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationSettingWhereUniqueInputSchema),
        z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema)
            .array(),
        z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema)
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationSettingWhereUniqueInputSchema),
        z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const EnumNotificationMethodTypeFieldUpdateOperationsInputSchema = z
    .object({
    set: z.lazy(() => NotificationMethodTypeSchema).optional(),
})
    .strict();
export const NullableEnumWebhookFormatFieldUpdateOperationsInputSchema = z
    .object({
    set: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
})
    .strict();
export const PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => PersonSettingsCreateWithoutNotificationMethodsInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => PersonSettingsCreateOrConnectWithoutNotificationMethodsInputSchema)
        .optional(),
    upsert: z
        .lazy(() => PersonSettingsUpsertWithoutNotificationMethodsInputSchema)
        .optional(),
    connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
    update: z
        .union([
        z.lazy(() => PersonSettingsUpdateToOneWithWhereWithoutNotificationMethodsInputSchema),
        z.lazy(() => PersonSettingsUpdateWithoutNotificationMethodsInputSchema),
        z.lazy(() => PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingUpdateManyWithoutNotificationMethodNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema)
            .array(),
        z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationSettingWhereUniqueInputSchema),
        z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationSettingWhereUniqueInputSchema),
        z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationSettingWhereUniqueInputSchema),
        z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationSettingWhereUniqueInputSchema),
        z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationSettingScalarWhereInputSchema),
        z.lazy(() => NotificationSettingScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema)
            .array(),
        z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    connectOrCreate: z
        .union([
        z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    upsert: z
        .union([
        z.lazy(() => NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    createMany: z
        .lazy(() => NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema)
        .optional(),
    set: z
        .union([
        z.lazy(() => NotificationSettingWhereUniqueInputSchema),
        z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
    ])
        .optional(),
    disconnect: z
        .union([
        z.lazy(() => NotificationSettingWhereUniqueInputSchema),
        z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
    ])
        .optional(),
    delete: z
        .union([
        z.lazy(() => NotificationSettingWhereUniqueInputSchema),
        z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
    ])
        .optional(),
    connect: z
        .union([
        z.lazy(() => NotificationSettingWhereUniqueInputSchema),
        z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
    ])
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    updateMany: z
        .union([
        z.lazy(() => NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema)
            .array(),
    ])
        .optional(),
    deleteMany: z
        .union([
        z.lazy(() => NotificationSettingScalarWhereInputSchema),
        z.lazy(() => NotificationSettingScalarWhereInputSchema).array(),
    ])
        .optional(),
})
    .strict();
export const NotificationMethodCreateNestedOneWithoutNotificationsInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema),
        z.lazy(() => NotificationMethodUncheckedCreateWithoutNotificationsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => NotificationMethodCreateOrConnectWithoutNotificationsInputSchema)
        .optional(),
    connect: z
        .lazy(() => NotificationMethodWhereUniqueInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodUpdateOneRequiredWithoutNotificationsNestedInputSchema = z
    .object({
    create: z
        .union([
        z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema),
        z.lazy(() => NotificationMethodUncheckedCreateWithoutNotificationsInputSchema),
    ])
        .optional(),
    connectOrCreate: z
        .lazy(() => NotificationMethodCreateOrConnectWithoutNotificationsInputSchema)
        .optional(),
    upsert: z
        .lazy(() => NotificationMethodUpsertWithoutNotificationsInputSchema)
        .optional(),
    connect: z
        .lazy(() => NotificationMethodWhereUniqueInputSchema)
        .optional(),
    update: z
        .union([
        z.lazy(() => NotificationMethodUpdateToOneWithWhereWithoutNotificationsInputSchema),
        z.lazy(() => NotificationMethodUpdateWithoutNotificationsInputSchema),
        z.lazy(() => NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NestedStringFilterSchema = z
    .object({
    equals: z.string().optional(),
    in: z.string().array().optional(),
    notIn: z.string().array().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    not: z
        .union([z.string(), z.lazy(() => NestedStringFilterSchema)])
        .optional(),
})
    .strict();
export const NestedDateTimeFilterSchema = z
    .object({
    equals: z.coerce.date().optional(),
    in: z.coerce.date().array().optional(),
    notIn: z.coerce.date().array().optional(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
        .union([z.coerce.date(), z.lazy(() => NestedDateTimeFilterSchema)])
        .optional(),
})
    .strict();
export const NestedStringNullableFilterSchema = z
    .object({
    equals: z.string().optional().nullable(),
    in: z.string().array().optional().nullable(),
    notIn: z.string().array().optional().nullable(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    not: z
        .union([z.string(), z.lazy(() => NestedStringNullableFilterSchema)])
        .optional()
        .nullable(),
})
    .strict();
export const NestedStringWithAggregatesFilterSchema = z
    .object({
    equals: z.string().optional(),
    in: z.string().array().optional(),
    notIn: z.string().array().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    not: z
        .union([
        z.string(),
        z.lazy(() => NestedStringWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedStringFilterSchema).optional(),
    _max: z.lazy(() => NestedStringFilterSchema).optional(),
})
    .strict();
export const NestedIntFilterSchema = z
    .object({
    equals: z.number().optional(),
    in: z.number().array().optional(),
    notIn: z.number().array().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z.union([z.number(), z.lazy(() => NestedIntFilterSchema)]).optional(),
})
    .strict();
export const NestedDateTimeWithAggregatesFilterSchema = z
    .object({
    equals: z.coerce.date().optional(),
    in: z.coerce.date().array().optional(),
    notIn: z.coerce.date().array().optional(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
        .union([
        z.coerce.date(),
        z.lazy(() => NestedDateTimeWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
    _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
})
    .strict();
export const NestedStringNullableWithAggregatesFilterSchema = z
    .object({
    equals: z.string().optional().nullable(),
    in: z.string().array().optional().nullable(),
    notIn: z.string().array().optional().nullable(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    not: z
        .union([
        z.string(),
        z.lazy(() => NestedStringNullableWithAggregatesFilterSchema),
    ])
        .optional()
        .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
})
    .strict();
export const NestedIntNullableFilterSchema = z
    .object({
    equals: z.number().optional().nullable(),
    in: z.number().array().optional().nullable(),
    notIn: z.number().array().optional().nullable(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
        .union([z.number(), z.lazy(() => NestedIntNullableFilterSchema)])
        .optional()
        .nullable(),
})
    .strict();
export const NestedDateTimeNullableFilterSchema = z
    .object({
    equals: z.coerce.date().optional().nullable(),
    in: z.coerce.date().array().optional().nullable(),
    notIn: z.coerce.date().array().optional().nullable(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
        .union([
        z.coerce.date(),
        z.lazy(() => NestedDateTimeNullableFilterSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NestedDateTimeNullableWithAggregatesFilterSchema = z
    .object({
    equals: z.coerce.date().optional().nullable(),
    in: z.coerce.date().array().optional().nullable(),
    notIn: z.coerce.date().array().optional().nullable(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
        .union([
        z.coerce.date(),
        z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema),
    ])
        .optional()
        .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
})
    .strict();
export const NestedEnumRoleFilterSchema = z
    .object({
    equals: z.lazy(() => RoleSchema).optional(),
    in: z
        .lazy(() => RoleSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => RoleSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => NestedEnumRoleFilterSchema),
    ])
        .optional(),
})
    .strict();
export const NestedEnumStatusFilterSchema = z
    .object({
    equals: z.lazy(() => StatusSchema).optional(),
    in: z
        .lazy(() => StatusSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => StatusSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NestedEnumStatusFilterSchema),
    ])
        .optional(),
})
    .strict();
export const NestedEnumRoleWithAggregatesFilterSchema = z
    .object({
    equals: z.lazy(() => RoleSchema).optional(),
    in: z
        .lazy(() => RoleSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => RoleSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
})
    .strict();
export const NestedEnumStatusWithAggregatesFilterSchema = z
    .object({
    equals: z.lazy(() => StatusSchema).optional(),
    in: z
        .lazy(() => StatusSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => StatusSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NestedEnumStatusWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumStatusFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumStatusFilterSchema).optional(),
})
    .strict();
export const NestedIntNullableWithAggregatesFilterSchema = z
    .object({
    equals: z.number().optional().nullable(),
    in: z.number().array().optional().nullable(),
    notIn: z.number().array().optional().nullable(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
        .union([
        z.number(),
        z.lazy(() => NestedIntNullableWithAggregatesFilterSchema),
    ])
        .optional()
        .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
    _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
})
    .strict();
export const NestedFloatNullableFilterSchema = z
    .object({
    equals: z.number().optional().nullable(),
    in: z.number().array().optional().nullable(),
    notIn: z.number().array().optional().nullable(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
        .union([z.number(), z.lazy(() => NestedFloatNullableFilterSchema)])
        .optional()
        .nullable(),
})
    .strict();
export const NestedEnumNotificationTypeFilterSchema = z
    .object({
    equals: z.lazy(() => NotificationTypeSchema).optional(),
    in: z
        .lazy(() => NotificationTypeSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => NotificationTypeSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => NestedEnumNotificationTypeFilterSchema),
    ])
        .optional(),
})
    .strict();
export const NestedBoolFilterSchema = z
    .object({
    equals: z.boolean().optional(),
    not: z
        .union([z.boolean(), z.lazy(() => NestedBoolFilterSchema)])
        .optional(),
})
    .strict();
export const NestedEnumStatusNullableFilterSchema = z
    .object({
    equals: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
    in: z
        .lazy(() => StatusSchema)
        .array()
        .optional()
        .nullable(),
    notIn: z
        .lazy(() => StatusSchema)
        .array()
        .optional()
        .nullable(),
    not: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NestedEnumStatusNullableFilterSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NestedEnumNotificationTypeWithAggregatesFilterSchema = z
    .object({
    equals: z.lazy(() => NotificationTypeSchema).optional(),
    in: z
        .lazy(() => NotificationTypeSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => NotificationTypeSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => NestedEnumNotificationTypeWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumNotificationTypeFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumNotificationTypeFilterSchema).optional(),
})
    .strict();
export const NestedBoolWithAggregatesFilterSchema = z
    .object({
    equals: z.boolean().optional(),
    not: z
        .union([
        z.boolean(),
        z.lazy(() => NestedBoolWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedBoolFilterSchema).optional(),
    _max: z.lazy(() => NestedBoolFilterSchema).optional(),
})
    .strict();
export const NestedEnumStatusNullableWithAggregatesFilterSchema = z
    .object({
    equals: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
    in: z
        .lazy(() => StatusSchema)
        .array()
        .optional()
        .nullable(),
    notIn: z
        .lazy(() => StatusSchema)
        .array()
        .optional()
        .nullable(),
    not: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NestedEnumStatusNullableWithAggregatesFilterSchema),
    ])
        .optional()
        .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumStatusNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumStatusNullableFilterSchema).optional(),
})
    .strict();
export const NestedEnumNotificationMethodTypeFilterSchema = z
    .object({
    equals: z.lazy(() => NotificationMethodTypeSchema).optional(),
    in: z
        .lazy(() => NotificationMethodTypeSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => NotificationMethodTypeSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => NestedEnumNotificationMethodTypeFilterSchema),
    ])
        .optional(),
})
    .strict();
export const NestedEnumWebhookFormatNullableFilterSchema = z
    .object({
    equals: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
    in: z
        .lazy(() => WebhookFormatSchema)
        .array()
        .optional()
        .nullable(),
    notIn: z
        .lazy(() => WebhookFormatSchema)
        .array()
        .optional()
        .nullable(),
    not: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NestedEnumWebhookFormatNullableFilterSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NestedEnumNotificationMethodTypeWithAggregatesFilterSchema = z
    .object({
    equals: z.lazy(() => NotificationMethodTypeSchema).optional(),
    in: z
        .lazy(() => NotificationMethodTypeSchema)
        .array()
        .optional(),
    notIn: z
        .lazy(() => NotificationMethodTypeSchema)
        .array()
        .optional(),
    not: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => NestedEnumNotificationMethodTypeWithAggregatesFilterSchema),
    ])
        .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z
        .lazy(() => NestedEnumNotificationMethodTypeFilterSchema)
        .optional(),
    _max: z
        .lazy(() => NestedEnumNotificationMethodTypeFilterSchema)
        .optional(),
})
    .strict();
export const NestedJsonNullableFilterSchema = z
    .object({
    equals: InputJsonValueSchema.optional(),
    path: z.string().array().optional(),
    string_contains: z.string().optional(),
    string_starts_with: z.string().optional(),
    string_ends_with: z.string().optional(),
    array_contains: InputJsonValueSchema.optional().nullable(),
    array_starts_with: InputJsonValueSchema.optional().nullable(),
    array_ends_with: InputJsonValueSchema.optional().nullable(),
    lt: InputJsonValueSchema.optional(),
    lte: InputJsonValueSchema.optional(),
    gt: InputJsonValueSchema.optional(),
    gte: InputJsonValueSchema.optional(),
    not: InputJsonValueSchema.optional(),
})
    .strict();
export const NestedEnumWebhookFormatNullableWithAggregatesFilterSchema = z
    .object({
    equals: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
    in: z
        .lazy(() => WebhookFormatSchema)
        .array()
        .optional()
        .nullable(),
    notIn: z
        .lazy(() => WebhookFormatSchema)
        .array()
        .optional()
        .nullable(),
    not: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NestedEnumWebhookFormatNullableWithAggregatesFilterSchema),
    ])
        .optional()
        .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z
        .lazy(() => NestedEnumWebhookFormatNullableFilterSchema)
        .optional(),
    _max: z
        .lazy(() => NestedEnumWebhookFormatNullableFilterSchema)
        .optional(),
})
    .strict();
export const MembershipCreateWithoutPersonInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
    event: z.lazy(() => EventCreateNestedOneWithoutMembershipsInputSchema),
    availabilities: z
        .lazy(() => AvailabilityCreateNestedManyWithoutMembershipInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedCreateWithoutPersonInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    eventId: z.string(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
})
    .strict();
export const MembershipCreateOrConnectWithoutPersonInputSchema = z
    .object({
    where: z.lazy(() => MembershipWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => MembershipCreateWithoutPersonInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema),
    ]),
})
    .strict();
export const MembershipCreateManyPersonInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => MembershipCreateManyPersonInputSchema),
        z.lazy(() => MembershipCreateManyPersonInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PostCreateWithoutAuthorInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    title: z.string(),
    content: z.string(),
    event: z.lazy(() => EventCreateNestedOneWithoutPostsInputSchema),
    replies: z
        .lazy(() => ReplyCreateNestedManyWithoutPostInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutPostInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedCreateWithoutAuthorInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    eventId: z.string(),
    title: z.string(),
    content: z.string(),
    replies: z
        .lazy(() => ReplyUncheckedCreateNestedManyWithoutPostInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutPostInputSchema)
        .optional(),
})
    .strict();
export const PostCreateOrConnectWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const PostCreateManyAuthorInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => PostCreateManyAuthorInputSchema),
        z.lazy(() => PostCreateManyAuthorInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const ReplyCreateWithoutAuthorInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    text: z.string(),
    post: z.lazy(() => PostCreateNestedOneWithoutRepliesInputSchema),
})
    .strict();
export const ReplyUncheckedCreateWithoutAuthorInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    postId: z.string(),
    text: z.string(),
})
    .strict();
export const ReplyCreateOrConnectWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => ReplyWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const ReplyCreateManyAuthorInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => ReplyCreateManyAuthorInputSchema),
        z.lazy(() => ReplyCreateManyAuthorInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const NotificationCreateWithoutPersonInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    type: z.lazy(() => NotificationTypeSchema),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
    author: z
        .lazy(() => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema)
        .optional(),
    event: z
        .lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
    post: z
        .lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
})
    .strict();
export const NotificationUncheckedCreateWithoutPersonInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    authorId: z.string().optional().nullable(),
    type: z.lazy(() => NotificationTypeSchema),
    eventId: z.string().optional().nullable(),
    postId: z.string().optional().nullable(),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationCreateOrConnectWithoutPersonInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => NotificationCreateWithoutPersonInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema),
    ]),
})
    .strict();
export const NotificationCreateManyPersonInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => NotificationCreateManyPersonInputSchema),
        z.lazy(() => NotificationCreateManyPersonInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const NotificationCreateWithoutAuthorInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    type: z.lazy(() => NotificationTypeSchema),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
    person: z.lazy(() => PersonCreateNestedOneWithoutNotificationsInputSchema),
    event: z
        .lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
    post: z
        .lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
})
    .strict();
export const NotificationUncheckedCreateWithoutAuthorInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
    type: z.lazy(() => NotificationTypeSchema),
    eventId: z.string().optional().nullable(),
    postId: z.string().optional().nullable(),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationCreateOrConnectWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const NotificationCreateManyAuthorInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => NotificationCreateManyAuthorInputSchema),
        z.lazy(() => NotificationCreateManyAuthorInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PersonSettingsCreateWithoutPersonInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    notificationMethods: z
        .lazy(() => NotificationMethodCreateNestedManyWithoutSettingsInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsUncheckedCreateWithoutPersonInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    notificationMethods: z
        .lazy(() => NotificationMethodUncheckedCreateNestedManyWithoutSettingsInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsCreateOrConnectWithoutPersonInputSchema = z
    .object({
    where: z.lazy(() => PersonSettingsWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema),
    ]),
})
    .strict();
export const MembershipUpsertWithWhereUniqueWithoutPersonInputSchema = z
    .object({
    where: z.lazy(() => MembershipWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => MembershipUpdateWithoutPersonInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutPersonInputSchema),
    ]),
    create: z.union([
        z.lazy(() => MembershipCreateWithoutPersonInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema),
    ]),
})
    .strict();
export const MembershipUpdateWithWhereUniqueWithoutPersonInputSchema = z
    .object({
    where: z.lazy(() => MembershipWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => MembershipUpdateWithoutPersonInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutPersonInputSchema),
    ]),
})
    .strict();
export const MembershipUpdateManyWithWhereWithoutPersonInputSchema = z
    .object({
    where: z.lazy(() => MembershipScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => MembershipUpdateManyMutationInputSchema),
        z.lazy(() => MembershipUncheckedUpdateManyWithoutPersonInputSchema),
    ]),
})
    .strict();
export const MembershipScalarWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => MembershipScalarWhereInputSchema),
        z.lazy(() => MembershipScalarWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => MembershipScalarWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => MembershipScalarWhereInputSchema),
        z.lazy(() => MembershipScalarWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    personId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    role: z
        .union([z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema)])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => EnumStatusFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional(),
})
    .strict();
export const PostUpsertWithWhereUniqueWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => PostUpdateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutAuthorInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const PostUpdateWithWhereUniqueWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => PostUpdateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const PostUpdateManyWithWhereWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => PostScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => PostUpdateManyMutationInputSchema),
        z.lazy(() => PostUncheckedUpdateManyWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const PostScalarWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => PostScalarWhereInputSchema),
        z.lazy(() => PostScalarWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PostScalarWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PostScalarWhereInputSchema),
        z.lazy(() => PostScalarWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    editedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    content: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
})
    .strict();
export const ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => ReplyWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => ReplyUpdateWithoutAuthorInputSchema),
        z.lazy(() => ReplyUncheckedUpdateWithoutAuthorInputSchema),
    ]),
    create: z.union([
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => ReplyWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => ReplyUpdateWithoutAuthorInputSchema),
        z.lazy(() => ReplyUncheckedUpdateWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const ReplyUpdateManyWithWhereWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => ReplyScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => ReplyUpdateManyMutationInputSchema),
        z.lazy(() => ReplyUncheckedUpdateManyWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const ReplyScalarWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => ReplyScalarWhereInputSchema),
        z.lazy(() => ReplyScalarWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => ReplyScalarWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => ReplyScalarWhereInputSchema),
        z.lazy(() => ReplyScalarWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    postId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    text: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
})
    .strict();
export const NotificationUpsertWithWhereUniqueWithoutPersonInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => NotificationUpdateWithoutPersonInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutPersonInputSchema),
    ]),
    create: z.union([
        z.lazy(() => NotificationCreateWithoutPersonInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema),
    ]),
})
    .strict();
export const NotificationUpdateWithWhereUniqueWithoutPersonInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => NotificationUpdateWithoutPersonInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutPersonInputSchema),
    ]),
})
    .strict();
export const NotificationUpdateManyWithWhereWithoutPersonInputSchema = z
    .object({
    where: z.lazy(() => NotificationScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => NotificationUpdateManyMutationInputSchema),
        z.lazy(() => NotificationUncheckedUpdateManyWithoutPersonInputSchema),
    ]),
})
    .strict();
export const NotificationScalarWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => NotificationScalarWhereInputSchema),
        z.lazy(() => NotificationScalarWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationScalarWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationScalarWhereInputSchema),
        z.lazy(() => NotificationScalarWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    personId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    authorId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => EnumNotificationTypeFilterSchema),
        z.lazy(() => NotificationTypeSchema),
    ])
        .optional(),
    eventId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    postId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    read: z.union([z.lazy(() => BoolFilterSchema), z.boolean()]).optional(),
    datetime: z
        .union([z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date()])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => EnumStatusNullableFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => NotificationUpdateWithoutAuthorInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutAuthorInputSchema),
    ]),
    create: z.union([
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => NotificationUpdateWithoutAuthorInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const NotificationUpdateManyWithWhereWithoutAuthorInputSchema = z
    .object({
    where: z.lazy(() => NotificationScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => NotificationUpdateManyMutationInputSchema),
        z.lazy(() => NotificationUncheckedUpdateManyWithoutAuthorInputSchema),
    ]),
})
    .strict();
export const PersonSettingsUpsertWithoutPersonInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema),
    ]),
    where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
})
    .strict();
export const PersonSettingsUpdateToOneWithWhereWithoutPersonInputSchema = z
    .object({
    where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema),
    ]),
})
    .strict();
export const PersonSettingsUpdateWithoutPersonInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationMethods: z
        .lazy(() => NotificationMethodUpdateManyWithoutSettingsNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsUncheckedUpdateWithoutPersonInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationMethods: z
        .lazy(() => NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonCreateWithoutSettingsInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedCreateWithoutSettingsInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
})
    .strict();
export const PersonCreateOrConnectWithoutSettingsInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PersonCreateWithoutSettingsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutSettingsInputSchema),
    ]),
})
    .strict();
export const NotificationMethodCreateWithoutSettingsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    type: z.lazy(() => NotificationMethodTypeSchema),
    enabled: z.boolean().optional(),
    name: z.string().optional().nullable(),
    value: z.string(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z.string().optional().nullable(),
    webhookFormat: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
    notifications: z
        .lazy(() => NotificationSettingCreateNestedManyWithoutNotificationMethodInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodUncheckedCreateWithoutSettingsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    type: z.lazy(() => NotificationMethodTypeSchema),
    enabled: z.boolean().optional(),
    name: z.string().optional().nullable(),
    value: z.string(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z.string().optional().nullable(),
    webhookFormat: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
    notifications: z
        .lazy(() => NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodCreateOrConnectWithoutSettingsInputSchema = z
    .object({
    where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
        z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema),
    ]),
})
    .strict();
export const NotificationMethodCreateManySettingsInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => NotificationMethodCreateManySettingsInputSchema),
        z.lazy(() => NotificationMethodCreateManySettingsInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PersonUpsertWithoutSettingsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PersonUpdateWithoutSettingsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutSettingsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PersonCreateWithoutSettingsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutSettingsInputSchema),
    ]),
    where: z.lazy(() => PersonWhereInputSchema).optional(),
})
    .strict();
export const PersonUpdateToOneWithWhereWithoutSettingsInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PersonUpdateWithoutSettingsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutSettingsInputSchema),
    ]),
})
    .strict();
export const PersonUpdateWithoutSettingsInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedUpdateWithoutSettingsInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema = z
    .object({
    where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => NotificationMethodUpdateWithoutSettingsInputSchema),
        z.lazy(() => NotificationMethodUncheckedUpdateWithoutSettingsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
        z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema),
    ]),
})
    .strict();
export const NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema = z
    .object({
    where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => NotificationMethodUpdateWithoutSettingsInputSchema),
        z.lazy(() => NotificationMethodUncheckedUpdateWithoutSettingsInputSchema),
    ]),
})
    .strict();
export const NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema = z
    .object({
    where: z.lazy(() => NotificationMethodScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => NotificationMethodUpdateManyMutationInputSchema),
        z.lazy(() => NotificationMethodUncheckedUpdateManyWithoutSettingsInputSchema),
    ]),
})
    .strict();
export const NotificationMethodScalarWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => NotificationMethodScalarWhereInputSchema),
        z.lazy(() => NotificationMethodScalarWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationMethodScalarWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationMethodScalarWhereInputSchema),
        z.lazy(() => NotificationMethodScalarWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    settingsId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    type: z
        .union([
        z.lazy(() => EnumNotificationMethodTypeFilterSchema),
        z.lazy(() => NotificationMethodTypeSchema),
    ])
        .optional(),
    enabled: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
    name: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    value: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    webhookHeaders: z.lazy(() => JsonNullableFilterSchema).optional(),
    customTemplate: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => EnumWebhookFormatNullableFilterSchema),
        z.lazy(() => WebhookFormatSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const InviteCreateWithoutEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    usesRemaining: z.number().int().optional().nullable(),
    maxUses: z.number().int().optional().nullable(),
    name: z.string().optional().nullable(),
    createdBy: z.lazy(() => MembershipCreateNestedOneWithoutInvitesInputSchema),
})
    .strict();
export const InviteUncheckedCreateWithoutEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdById: z.string(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    usesRemaining: z.number().int().optional().nullable(),
    maxUses: z.number().int().optional().nullable(),
    name: z.string().optional().nullable(),
})
    .strict();
export const InviteCreateOrConnectWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => InviteWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => InviteCreateWithoutEventInputSchema),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema),
    ]),
})
    .strict();
export const InviteCreateManyEventInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => InviteCreateManyEventInputSchema),
        z.lazy(() => InviteCreateManyEventInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PotentialDateTimeCreateWithoutEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    dateTime: z.coerce.date().optional(),
    availabilities: z
        .lazy(() => AvailabilityCreateNestedManyWithoutPotentialDateTimeInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeUncheckedCreateWithoutEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    dateTime: z.coerce.date().optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeCreateOrConnectWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema),
    ]),
})
    .strict();
export const PotentialDateTimeCreateManyEventInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => PotentialDateTimeCreateManyEventInputSchema),
        z.lazy(() => PotentialDateTimeCreateManyEventInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PostCreateWithoutEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    title: z.string(),
    content: z.string(),
    author: z.lazy(() => PersonCreateNestedOneWithoutPostsInputSchema),
    replies: z
        .lazy(() => ReplyCreateNestedManyWithoutPostInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutPostInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedCreateWithoutEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    authorId: z.string(),
    title: z.string(),
    content: z.string(),
    replies: z
        .lazy(() => ReplyUncheckedCreateNestedManyWithoutPostInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutPostInputSchema)
        .optional(),
})
    .strict();
export const PostCreateOrConnectWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PostCreateWithoutEventInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema),
    ]),
})
    .strict();
export const PostCreateManyEventInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => PostCreateManyEventInputSchema),
        z.lazy(() => PostCreateManyEventInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const MembershipCreateWithoutEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
    person: z.lazy(() => PersonCreateNestedOneWithoutMembershipsInputSchema),
    availabilities: z
        .lazy(() => AvailabilityCreateNestedManyWithoutMembershipInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedCreateWithoutEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    personId: z.string(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
})
    .strict();
export const MembershipCreateOrConnectWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => MembershipWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => MembershipCreateWithoutEventInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema),
    ]),
})
    .strict();
export const MembershipCreateManyEventInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => MembershipCreateManyEventInputSchema),
        z.lazy(() => MembershipCreateManyEventInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const NotificationCreateWithoutEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    type: z.lazy(() => NotificationTypeSchema),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
    person: z.lazy(() => PersonCreateNestedOneWithoutNotificationsInputSchema),
    author: z
        .lazy(() => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema)
        .optional(),
    post: z
        .lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
})
    .strict();
export const NotificationUncheckedCreateWithoutEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
    authorId: z.string().optional().nullable(),
    type: z.lazy(() => NotificationTypeSchema),
    postId: z.string().optional().nullable(),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationCreateOrConnectWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => NotificationCreateWithoutEventInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema),
    ]),
})
    .strict();
export const NotificationCreateManyEventInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => NotificationCreateManyEventInputSchema),
        z.lazy(() => NotificationCreateManyEventInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const InviteUpsertWithWhereUniqueWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => InviteWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => InviteUpdateWithoutEventInputSchema),
        z.lazy(() => InviteUncheckedUpdateWithoutEventInputSchema),
    ]),
    create: z.union([
        z.lazy(() => InviteCreateWithoutEventInputSchema),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema),
    ]),
})
    .strict();
export const InviteUpdateWithWhereUniqueWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => InviteWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => InviteUpdateWithoutEventInputSchema),
        z.lazy(() => InviteUncheckedUpdateWithoutEventInputSchema),
    ]),
})
    .strict();
export const InviteUpdateManyWithWhereWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => InviteScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => InviteUpdateManyMutationInputSchema),
        z.lazy(() => InviteUncheckedUpdateManyWithoutEventInputSchema),
    ]),
})
    .strict();
export const InviteScalarWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => InviteScalarWhereInputSchema),
        z.lazy(() => InviteScalarWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => InviteScalarWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => InviteScalarWhereInputSchema),
        z.lazy(() => InviteScalarWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    eventId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    createdById: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    expiresAt: z
        .union([z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date()])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([z.lazy(() => IntNullableFilterSchema), z.number()])
        .optional()
        .nullable(),
    maxUses: z
        .union([z.lazy(() => IntNullableFilterSchema), z.number()])
        .optional()
        .nullable(),
    name: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
})
    .strict();
export const PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => PotentialDateTimeUpdateWithoutEventInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutEventInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema),
    ]),
})
    .strict();
export const PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => PotentialDateTimeUpdateWithoutEventInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutEventInputSchema),
    ]),
})
    .strict();
export const PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => PotentialDateTimeScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => PotentialDateTimeUpdateManyMutationInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventInputSchema),
    ]),
})
    .strict();
export const PotentialDateTimeScalarWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => PotentialDateTimeScalarWhereInputSchema),
        z.lazy(() => PotentialDateTimeScalarWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => PotentialDateTimeScalarWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => PotentialDateTimeScalarWhereInputSchema),
        z.lazy(() => PotentialDateTimeScalarWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    eventId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    dateTime: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
})
    .strict();
export const PostUpsertWithWhereUniqueWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => PostUpdateWithoutEventInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutEventInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PostCreateWithoutEventInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema),
    ]),
})
    .strict();
export const PostUpdateWithWhereUniqueWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => PostUpdateWithoutEventInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutEventInputSchema),
    ]),
})
    .strict();
export const PostUpdateManyWithWhereWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => PostScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => PostUpdateManyMutationInputSchema),
        z.lazy(() => PostUncheckedUpdateManyWithoutEventInputSchema),
    ]),
})
    .strict();
export const MembershipUpsertWithWhereUniqueWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => MembershipWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => MembershipUpdateWithoutEventInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutEventInputSchema),
    ]),
    create: z.union([
        z.lazy(() => MembershipCreateWithoutEventInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema),
    ]),
})
    .strict();
export const MembershipUpdateWithWhereUniqueWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => MembershipWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => MembershipUpdateWithoutEventInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutEventInputSchema),
    ]),
})
    .strict();
export const MembershipUpdateManyWithWhereWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => MembershipScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => MembershipUpdateManyMutationInputSchema),
        z.lazy(() => MembershipUncheckedUpdateManyWithoutEventInputSchema),
    ]),
})
    .strict();
export const NotificationUpsertWithWhereUniqueWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => NotificationUpdateWithoutEventInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutEventInputSchema),
    ]),
    create: z.union([
        z.lazy(() => NotificationCreateWithoutEventInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema),
    ]),
})
    .strict();
export const NotificationUpdateWithWhereUniqueWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => NotificationUpdateWithoutEventInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutEventInputSchema),
    ]),
})
    .strict();
export const NotificationUpdateManyWithWhereWithoutEventInputSchema = z
    .object({
    where: z.lazy(() => NotificationScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => NotificationUpdateManyMutationInputSchema),
        z.lazy(() => NotificationUncheckedUpdateManyWithoutEventInputSchema),
    ]),
})
    .strict();
export const PersonCreateWithoutMembershipsInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    posts: z
        .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedCreateWithoutMembershipsInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonCreateOrConnectWithoutMembershipsInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PersonCreateWithoutMembershipsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutMembershipsInputSchema),
    ]),
})
    .strict();
export const EventCreateWithoutMembershipsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    invites: z
        .lazy(() => InviteCreateNestedManyWithoutEventInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeCreateNestedManyWithoutEventInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostCreateNestedManyWithoutEventInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedCreateWithoutMembershipsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventCreateOrConnectWithoutMembershipsInputSchema = z
    .object({
    where: z.lazy(() => EventWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => EventCreateWithoutMembershipsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutMembershipsInputSchema),
    ]),
})
    .strict();
export const AvailabilityCreateWithoutMembershipInputSchema = z
    .object({
    status: z.lazy(() => StatusSchema),
    potentialDateTime: z.lazy(() => PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInputSchema),
})
    .strict();
export const AvailabilityUncheckedCreateWithoutMembershipInputSchema = z
    .object({
    potentialDateTimeId: z.string(),
    status: z.lazy(() => StatusSchema),
})
    .strict();
export const AvailabilityCreateOrConnectWithoutMembershipInputSchema = z
    .object({
    where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema),
        z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema),
    ]),
})
    .strict();
export const AvailabilityCreateManyMembershipInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => AvailabilityCreateManyMembershipInputSchema),
        z.lazy(() => AvailabilityCreateManyMembershipInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const InviteCreateWithoutCreatedByInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    usesRemaining: z.number().int().optional().nullable(),
    maxUses: z.number().int().optional().nullable(),
    name: z.string().optional().nullable(),
    event: z.lazy(() => EventCreateNestedOneWithoutInvitesInputSchema),
})
    .strict();
export const InviteUncheckedCreateWithoutCreatedByInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    eventId: z.string(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    usesRemaining: z.number().int().optional().nullable(),
    maxUses: z.number().int().optional().nullable(),
    name: z.string().optional().nullable(),
})
    .strict();
export const InviteCreateOrConnectWithoutCreatedByInputSchema = z
    .object({
    where: z.lazy(() => InviteWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema),
        z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema),
    ]),
})
    .strict();
export const InviteCreateManyCreatedByInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => InviteCreateManyCreatedByInputSchema),
        z.lazy(() => InviteCreateManyCreatedByInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PersonUpsertWithoutMembershipsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PersonUpdateWithoutMembershipsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutMembershipsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PersonCreateWithoutMembershipsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutMembershipsInputSchema),
    ]),
    where: z.lazy(() => PersonWhereInputSchema).optional(),
})
    .strict();
export const PersonUpdateToOneWithWhereWithoutMembershipsInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PersonUpdateWithoutMembershipsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutMembershipsInputSchema),
    ]),
})
    .strict();
export const PersonUpdateWithoutMembershipsInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    posts: z
        .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedUpdateWithoutMembershipsInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const EventUpsertWithoutMembershipsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => EventUpdateWithoutMembershipsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutMembershipsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => EventCreateWithoutMembershipsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutMembershipsInputSchema),
    ]),
    where: z.lazy(() => EventWhereInputSchema).optional(),
})
    .strict();
export const EventUpdateToOneWithWhereWithoutMembershipsInputSchema = z
    .object({
    where: z.lazy(() => EventWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => EventUpdateWithoutMembershipsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutMembershipsInputSchema),
    ]),
})
    .strict();
export const EventUpdateWithoutMembershipsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    invites: z
        .lazy(() => InviteUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedUpdateWithoutMembershipsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema = z
    .object({
    where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => AvailabilityUpdateWithoutMembershipInputSchema),
        z.lazy(() => AvailabilityUncheckedUpdateWithoutMembershipInputSchema),
    ]),
    create: z.union([
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema),
        z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema),
    ]),
})
    .strict();
export const AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema = z
    .object({
    where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => AvailabilityUpdateWithoutMembershipInputSchema),
        z.lazy(() => AvailabilityUncheckedUpdateWithoutMembershipInputSchema),
    ]),
})
    .strict();
export const AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema = z
    .object({
    where: z.lazy(() => AvailabilityScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => AvailabilityUpdateManyMutationInputSchema),
        z.lazy(() => AvailabilityUncheckedUpdateManyWithoutMembershipInputSchema),
    ]),
})
    .strict();
export const AvailabilityScalarWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => AvailabilityScalarWhereInputSchema),
        z.lazy(() => AvailabilityScalarWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => AvailabilityScalarWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => AvailabilityScalarWhereInputSchema),
        z.lazy(() => AvailabilityScalarWhereInputSchema).array(),
    ])
        .optional(),
    membershipId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    potentialDateTimeId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    status: z
        .union([
        z.lazy(() => EnumStatusFilterSchema),
        z.lazy(() => StatusSchema),
    ])
        .optional(),
})
    .strict();
export const InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema = z
    .object({
    where: z.lazy(() => InviteWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => InviteUpdateWithoutCreatedByInputSchema),
        z.lazy(() => InviteUncheckedUpdateWithoutCreatedByInputSchema),
    ]),
    create: z.union([
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema),
        z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema),
    ]),
})
    .strict();
export const InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema = z
    .object({
    where: z.lazy(() => InviteWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => InviteUpdateWithoutCreatedByInputSchema),
        z.lazy(() => InviteUncheckedUpdateWithoutCreatedByInputSchema),
    ]),
})
    .strict();
export const InviteUpdateManyWithWhereWithoutCreatedByInputSchema = z
    .object({
    where: z.lazy(() => InviteScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => InviteUpdateManyMutationInputSchema),
        z.lazy(() => InviteUncheckedUpdateManyWithoutCreatedByInputSchema),
    ]),
})
    .strict();
export const EventCreateWithoutPotentialDateTimesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    invites: z
        .lazy(() => InviteCreateNestedManyWithoutEventInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostCreateNestedManyWithoutEventInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutEventInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedCreateWithoutPotentialDateTimesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventCreateOrConnectWithoutPotentialDateTimesInputSchema = z
    .object({
    where: z.lazy(() => EventWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutPotentialDateTimesInputSchema),
    ]),
})
    .strict();
export const AvailabilityCreateWithoutPotentialDateTimeInputSchema = z
    .object({
    status: z.lazy(() => StatusSchema),
    membership: z.lazy(() => MembershipCreateNestedOneWithoutAvailabilitiesInputSchema),
})
    .strict();
export const AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema = z
    .object({
    membershipId: z.string(),
    status: z.lazy(() => StatusSchema),
})
    .strict();
export const AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema = z
    .object({
    where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
        z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema),
    ]),
})
    .strict();
export const AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => AvailabilityCreateManyPotentialDateTimeInputSchema),
        z
            .lazy(() => AvailabilityCreateManyPotentialDateTimeInputSchema)
            .array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const EventUpsertWithoutPotentialDateTimesInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => EventUpdateWithoutPotentialDateTimesInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutPotentialDateTimesInputSchema),
    ]),
    create: z.union([
        z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutPotentialDateTimesInputSchema),
    ]),
    where: z.lazy(() => EventWhereInputSchema).optional(),
})
    .strict();
export const EventUpdateToOneWithWhereWithoutPotentialDateTimesInputSchema = z
    .object({
    where: z.lazy(() => EventWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => EventUpdateWithoutPotentialDateTimesInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutPotentialDateTimesInputSchema),
    ]),
})
    .strict();
export const EventUpdateWithoutPotentialDateTimesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    invites: z
        .lazy(() => InviteUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedUpdateWithoutPotentialDateTimesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema = z
    .object({
    where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => AvailabilityUpdateWithoutPotentialDateTimeInputSchema),
        z.lazy(() => AvailabilityUncheckedUpdateWithoutPotentialDateTimeInputSchema),
    ]),
    create: z.union([
        z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
        z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema),
    ]),
})
    .strict();
export const AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema = z
    .object({
    where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => AvailabilityUpdateWithoutPotentialDateTimeInputSchema),
        z.lazy(() => AvailabilityUncheckedUpdateWithoutPotentialDateTimeInputSchema),
    ]),
})
    .strict();
export const AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema = z
    .object({
    where: z.lazy(() => AvailabilityScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => AvailabilityUpdateManyMutationInputSchema),
        z.lazy(() => AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeInputSchema),
    ]),
})
    .strict();
export const MembershipCreateWithoutAvailabilitiesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
    person: z.lazy(() => PersonCreateNestedOneWithoutMembershipsInputSchema),
    event: z.lazy(() => EventCreateNestedOneWithoutMembershipsInputSchema),
    invites: z
        .lazy(() => InviteCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedCreateWithoutAvailabilitiesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    personId: z.string(),
    eventId: z.string(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
    invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
})
    .strict();
export const MembershipCreateOrConnectWithoutAvailabilitiesInputSchema = z
    .object({
    where: z.lazy(() => MembershipWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema),
    ]),
})
    .strict();
export const PotentialDateTimeCreateWithoutAvailabilitiesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    dateTime: z.coerce.date().optional(),
    event: z.lazy(() => EventCreateNestedOneWithoutPotentialDateTimesInputSchema),
})
    .strict();
export const PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    eventId: z.string(),
    dateTime: z.coerce.date().optional(),
})
    .strict();
export const PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInputSchema = z
    .object({
    where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema),
    ]),
})
    .strict();
export const MembershipUpsertWithoutAvailabilitiesInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => MembershipUpdateWithoutAvailabilitiesInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema),
    ]),
    create: z.union([
        z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema),
    ]),
    where: z.lazy(() => MembershipWhereInputSchema).optional(),
})
    .strict();
export const MembershipUpdateToOneWithWhereWithoutAvailabilitiesInputSchema = z
    .object({
    where: z.lazy(() => MembershipWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => MembershipUpdateWithoutAvailabilitiesInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema),
    ]),
})
    .strict();
export const MembershipUpdateWithoutAvailabilitiesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    person: z
        .lazy(() => PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema)
        .optional(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutMembershipsNestedInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeUpsertWithoutAvailabilitiesInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema),
    ]),
    where: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
})
    .strict();
export const PotentialDateTimeUpdateToOneWithWhereWithoutAvailabilitiesInputSchema = z
    .object({
    where: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema),
    ]),
})
    .strict();
export const PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    dateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutPotentialDateTimesNestedInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    dateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PersonCreateWithoutPostsInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedCreateWithoutPostsInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonCreateOrConnectWithoutPostsInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PersonCreateWithoutPostsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutPostsInputSchema),
    ]),
})
    .strict();
export const EventCreateWithoutPostsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    invites: z
        .lazy(() => InviteCreateNestedManyWithoutEventInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeCreateNestedManyWithoutEventInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutEventInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedCreateWithoutPostsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventCreateOrConnectWithoutPostsInputSchema = z
    .object({
    where: z.lazy(() => EventWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => EventCreateWithoutPostsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutPostsInputSchema),
    ]),
})
    .strict();
export const ReplyCreateWithoutPostInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    text: z.string(),
    author: z.lazy(() => PersonCreateNestedOneWithoutRepliesInputSchema),
})
    .strict();
export const ReplyUncheckedCreateWithoutPostInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    authorId: z.string(),
    text: z.string(),
})
    .strict();
export const ReplyCreateOrConnectWithoutPostInputSchema = z
    .object({
    where: z.lazy(() => ReplyWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => ReplyCreateWithoutPostInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema),
    ]),
})
    .strict();
export const ReplyCreateManyPostInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => ReplyCreateManyPostInputSchema),
        z.lazy(() => ReplyCreateManyPostInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const NotificationCreateWithoutPostInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    type: z.lazy(() => NotificationTypeSchema),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
    person: z.lazy(() => PersonCreateNestedOneWithoutNotificationsInputSchema),
    author: z
        .lazy(() => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema)
        .optional(),
    event: z
        .lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
})
    .strict();
export const NotificationUncheckedCreateWithoutPostInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
    authorId: z.string().optional().nullable(),
    type: z.lazy(() => NotificationTypeSchema),
    eventId: z.string().optional().nullable(),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationCreateOrConnectWithoutPostInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => NotificationCreateWithoutPostInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema),
    ]),
})
    .strict();
export const NotificationCreateManyPostInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => NotificationCreateManyPostInputSchema),
        z.lazy(() => NotificationCreateManyPostInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PersonUpsertWithoutPostsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PersonUpdateWithoutPostsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutPostsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PersonCreateWithoutPostsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutPostsInputSchema),
    ]),
    where: z.lazy(() => PersonWhereInputSchema).optional(),
})
    .strict();
export const PersonUpdateToOneWithWhereWithoutPostsInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PersonUpdateWithoutPostsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutPostsInputSchema),
    ]),
})
    .strict();
export const PersonUpdateWithoutPostsInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedUpdateWithoutPostsInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const EventUpsertWithoutPostsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => EventUpdateWithoutPostsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutPostsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => EventCreateWithoutPostsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutPostsInputSchema),
    ]),
    where: z.lazy(() => EventWhereInputSchema).optional(),
})
    .strict();
export const EventUpdateToOneWithWhereWithoutPostsInputSchema = z
    .object({
    where: z.lazy(() => EventWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => EventUpdateWithoutPostsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutPostsInputSchema),
    ]),
})
    .strict();
export const EventUpdateWithoutPostsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    invites: z
        .lazy(() => InviteUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedUpdateWithoutPostsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const ReplyUpsertWithWhereUniqueWithoutPostInputSchema = z
    .object({
    where: z.lazy(() => ReplyWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => ReplyUpdateWithoutPostInputSchema),
        z.lazy(() => ReplyUncheckedUpdateWithoutPostInputSchema),
    ]),
    create: z.union([
        z.lazy(() => ReplyCreateWithoutPostInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema),
    ]),
})
    .strict();
export const ReplyUpdateWithWhereUniqueWithoutPostInputSchema = z
    .object({
    where: z.lazy(() => ReplyWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => ReplyUpdateWithoutPostInputSchema),
        z.lazy(() => ReplyUncheckedUpdateWithoutPostInputSchema),
    ]),
})
    .strict();
export const ReplyUpdateManyWithWhereWithoutPostInputSchema = z
    .object({
    where: z.lazy(() => ReplyScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => ReplyUpdateManyMutationInputSchema),
        z.lazy(() => ReplyUncheckedUpdateManyWithoutPostInputSchema),
    ]),
})
    .strict();
export const NotificationUpsertWithWhereUniqueWithoutPostInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => NotificationUpdateWithoutPostInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutPostInputSchema),
    ]),
    create: z.union([
        z.lazy(() => NotificationCreateWithoutPostInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema),
    ]),
})
    .strict();
export const NotificationUpdateWithWhereUniqueWithoutPostInputSchema = z
    .object({
    where: z.lazy(() => NotificationWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => NotificationUpdateWithoutPostInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutPostInputSchema),
    ]),
})
    .strict();
export const NotificationUpdateManyWithWhereWithoutPostInputSchema = z
    .object({
    where: z.lazy(() => NotificationScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => NotificationUpdateManyMutationInputSchema),
        z.lazy(() => NotificationUncheckedUpdateManyWithoutPostInputSchema),
    ]),
})
    .strict();
export const PersonCreateWithoutRepliesInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedCreateWithoutRepliesInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonCreateOrConnectWithoutRepliesInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PersonCreateWithoutRepliesInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutRepliesInputSchema),
    ]),
})
    .strict();
export const PostCreateWithoutRepliesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    title: z.string(),
    content: z.string(),
    author: z.lazy(() => PersonCreateNestedOneWithoutPostsInputSchema),
    event: z.lazy(() => EventCreateNestedOneWithoutPostsInputSchema),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutPostInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedCreateWithoutRepliesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    authorId: z.string(),
    eventId: z.string(),
    title: z.string(),
    content: z.string(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutPostInputSchema)
        .optional(),
})
    .strict();
export const PostCreateOrConnectWithoutRepliesInputSchema = z
    .object({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PostCreateWithoutRepliesInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutRepliesInputSchema),
    ]),
})
    .strict();
export const PersonUpsertWithoutRepliesInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PersonUpdateWithoutRepliesInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutRepliesInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PersonCreateWithoutRepliesInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutRepliesInputSchema),
    ]),
    where: z.lazy(() => PersonWhereInputSchema).optional(),
})
    .strict();
export const PersonUpdateToOneWithWhereWithoutRepliesInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PersonUpdateWithoutRepliesInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutRepliesInputSchema),
    ]),
})
    .strict();
export const PersonUpdateWithoutRepliesInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedUpdateWithoutRepliesInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const PostUpsertWithoutRepliesInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PostUpdateWithoutRepliesInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutRepliesInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PostCreateWithoutRepliesInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutRepliesInputSchema),
    ]),
    where: z.lazy(() => PostWhereInputSchema).optional(),
})
    .strict();
export const PostUpdateToOneWithWhereWithoutRepliesInputSchema = z
    .object({
    where: z.lazy(() => PostWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PostUpdateWithoutRepliesInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutRepliesInputSchema),
    ]),
})
    .strict();
export const PostUpdateWithoutRepliesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    author: z
        .lazy(() => PersonUpdateOneRequiredWithoutPostsNestedInputSchema)
        .optional(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutPostsNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutPostNestedInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedUpdateWithoutRepliesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutPostNestedInputSchema)
        .optional(),
})
    .strict();
export const EventCreateWithoutInvitesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeCreateNestedManyWithoutEventInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostCreateNestedManyWithoutEventInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutEventInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedCreateWithoutInvitesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventCreateOrConnectWithoutInvitesInputSchema = z
    .object({
    where: z.lazy(() => EventWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => EventCreateWithoutInvitesInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutInvitesInputSchema),
    ]),
})
    .strict();
export const MembershipCreateWithoutInvitesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
    person: z.lazy(() => PersonCreateNestedOneWithoutMembershipsInputSchema),
    event: z.lazy(() => EventCreateNestedOneWithoutMembershipsInputSchema),
    availabilities: z
        .lazy(() => AvailabilityCreateNestedManyWithoutMembershipInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedCreateWithoutInvitesInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    personId: z.string(),
    eventId: z.string(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema)
        .optional(),
})
    .strict();
export const MembershipCreateOrConnectWithoutInvitesInputSchema = z
    .object({
    where: z.lazy(() => MembershipWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => MembershipCreateWithoutInvitesInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutInvitesInputSchema),
    ]),
})
    .strict();
export const EventUpsertWithoutInvitesInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => EventUpdateWithoutInvitesInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutInvitesInputSchema),
    ]),
    create: z.union([
        z.lazy(() => EventCreateWithoutInvitesInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutInvitesInputSchema),
    ]),
    where: z.lazy(() => EventWhereInputSchema).optional(),
})
    .strict();
export const EventUpdateToOneWithWhereWithoutInvitesInputSchema = z
    .object({
    where: z.lazy(() => EventWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => EventUpdateWithoutInvitesInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutInvitesInputSchema),
    ]),
})
    .strict();
export const EventUpdateWithoutInvitesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedUpdateWithoutInvitesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const MembershipUpsertWithoutInvitesInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => MembershipUpdateWithoutInvitesInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutInvitesInputSchema),
    ]),
    create: z.union([
        z.lazy(() => MembershipCreateWithoutInvitesInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutInvitesInputSchema),
    ]),
    where: z.lazy(() => MembershipWhereInputSchema).optional(),
})
    .strict();
export const MembershipUpdateToOneWithWhereWithoutInvitesInputSchema = z
    .object({
    where: z.lazy(() => MembershipWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => MembershipUpdateWithoutInvitesInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutInvitesInputSchema),
    ]),
})
    .strict();
export const MembershipUpdateWithoutInvitesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    person: z
        .lazy(() => PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema)
        .optional(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutMembershipsNestedInputSchema)
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUpdateManyWithoutMembershipNestedInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedUpdateWithoutInvitesInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonCreateWithoutNotificationsInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedCreateWithoutNotificationsInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonCreateOrConnectWithoutNotificationsInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PersonCreateWithoutNotificationsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutNotificationsInputSchema),
    ]),
})
    .strict();
export const PersonCreateWithoutAuthoredNotificationsInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema = z
    .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    username: z.string(),
    imageUrl: z.string(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema)
        .optional(),
})
    .strict();
export const PersonCreateOrConnectWithoutAuthoredNotificationsInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema),
    ]),
})
    .strict();
export const EventCreateWithoutNotificationsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    invites: z
        .lazy(() => InviteCreateNestedManyWithoutEventInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeCreateNestedManyWithoutEventInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostCreateNestedManyWithoutEventInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedCreateWithoutNotificationsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    title: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    chosenDateTime: z.coerce.date().optional().nullable(),
    invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
})
    .strict();
export const EventCreateOrConnectWithoutNotificationsInputSchema = z
    .object({
    where: z.lazy(() => EventWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => EventCreateWithoutNotificationsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutNotificationsInputSchema),
    ]),
})
    .strict();
export const PostCreateWithoutNotificationsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    title: z.string(),
    content: z.string(),
    author: z.lazy(() => PersonCreateNestedOneWithoutPostsInputSchema),
    event: z.lazy(() => EventCreateNestedOneWithoutPostsInputSchema),
    replies: z
        .lazy(() => ReplyCreateNestedManyWithoutPostInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedCreateWithoutNotificationsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    authorId: z.string(),
    eventId: z.string(),
    title: z.string(),
    content: z.string(),
    replies: z
        .lazy(() => ReplyUncheckedCreateNestedManyWithoutPostInputSchema)
        .optional(),
})
    .strict();
export const PostCreateOrConnectWithoutNotificationsInputSchema = z
    .object({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PostCreateWithoutNotificationsInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutNotificationsInputSchema),
    ]),
})
    .strict();
export const PersonUpsertWithoutNotificationsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PersonUpdateWithoutNotificationsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutNotificationsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PersonCreateWithoutNotificationsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutNotificationsInputSchema),
    ]),
    where: z.lazy(() => PersonWhereInputSchema).optional(),
})
    .strict();
export const PersonUpdateToOneWithWhereWithoutNotificationsInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PersonUpdateWithoutNotificationsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutNotificationsInputSchema),
    ]),
})
    .strict();
export const PersonUpdateWithoutNotificationsInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedUpdateWithoutNotificationsInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    authoredNotifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonUpsertWithoutAuthoredNotificationsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PersonUpdateWithoutAuthoredNotificationsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema),
    ]),
    where: z.lazy(() => PersonWhereInputSchema).optional(),
})
    .strict();
export const PersonUpdateToOneWithWhereWithoutAuthoredNotificationsInputSchema = z
    .object({
    where: z.lazy(() => PersonWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PersonUpdateWithoutAuthoredNotificationsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema),
    ]),
})
    .strict();
export const PersonUpdateWithoutAuthoredNotificationsInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema = z
    .object({
    id: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    firstName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    lastName: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    username: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    imageUrl: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema)
        .optional(),
    settings: z
        .lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema)
        .optional(),
})
    .strict();
export const EventUpsertWithoutNotificationsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => EventUpdateWithoutNotificationsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutNotificationsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => EventCreateWithoutNotificationsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutNotificationsInputSchema),
    ]),
    where: z.lazy(() => EventWhereInputSchema).optional(),
})
    .strict();
export const EventUpdateToOneWithWhereWithoutNotificationsInputSchema = z
    .object({
    where: z.lazy(() => EventWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => EventUpdateWithoutNotificationsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutNotificationsInputSchema),
    ]),
})
    .strict();
export const EventUpdateWithoutNotificationsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    invites: z
        .lazy(() => InviteUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const EventUncheckedUpdateWithoutNotificationsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    description: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    location: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    chosenDateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    potentialDateTimes: z
        .lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
})
    .strict();
export const PostUpsertWithoutNotificationsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PostUpdateWithoutNotificationsInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutNotificationsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PostCreateWithoutNotificationsInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutNotificationsInputSchema),
    ]),
    where: z.lazy(() => PostWhereInputSchema).optional(),
})
    .strict();
export const PostUpdateToOneWithWhereWithoutNotificationsInputSchema = z
    .object({
    where: z.lazy(() => PostWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PostUpdateWithoutNotificationsInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutNotificationsInputSchema),
    ]),
})
    .strict();
export const PostUpdateWithoutNotificationsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    author: z
        .lazy(() => PersonUpdateOneRequiredWithoutPostsNestedInputSchema)
        .optional(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutPostsNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUpdateManyWithoutPostNestedInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedUpdateWithoutNotificationsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedUpdateManyWithoutPostNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsCreateWithoutNotificationMethodsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    person: z.lazy(() => PersonCreateNestedOneWithoutSettingsInputSchema),
})
    .strict();
export const PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
})
    .strict();
export const PersonSettingsCreateOrConnectWithoutNotificationMethodsInputSchema = z
    .object({
    where: z.lazy(() => PersonSettingsWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => PersonSettingsCreateWithoutNotificationMethodsInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema),
    ]),
})
    .strict();
export const NotificationSettingCreateWithoutNotificationMethodInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    notificationType: z.lazy(() => NotificationTypeSchema),
    enabled: z.boolean().optional(),
})
    .strict();
export const NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    notificationType: z.lazy(() => NotificationTypeSchema),
    enabled: z.boolean().optional(),
})
    .strict();
export const NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema = z
    .object({
    where: z.lazy(() => NotificationSettingWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema),
        z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema),
    ]),
})
    .strict();
export const NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema = z
    .object({
    data: z.union([
        z.lazy(() => NotificationSettingCreateManyNotificationMethodInputSchema),
        z
            .lazy(() => NotificationSettingCreateManyNotificationMethodInputSchema)
            .array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PersonSettingsUpsertWithoutNotificationMethodsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => PersonSettingsUpdateWithoutNotificationMethodsInputSchema),
        z.lazy(() => PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => PersonSettingsCreateWithoutNotificationMethodsInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema),
    ]),
    where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
})
    .strict();
export const PersonSettingsUpdateToOneWithWhereWithoutNotificationMethodsInputSchema = z
    .object({
    where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => PersonSettingsUpdateWithoutNotificationMethodsInputSchema),
        z.lazy(() => PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema),
    ]),
})
    .strict();
export const PersonSettingsUpdateWithoutNotificationMethodsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    person: z
        .lazy(() => PersonUpdateOneRequiredWithoutSettingsNestedInputSchema)
        .optional(),
})
    .strict();
export const PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema = z
    .object({
    where: z.lazy(() => NotificationSettingWhereUniqueInputSchema),
    update: z.union([
        z.lazy(() => NotificationSettingUpdateWithoutNotificationMethodInputSchema),
        z.lazy(() => NotificationSettingUncheckedUpdateWithoutNotificationMethodInputSchema),
    ]),
    create: z.union([
        z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema),
        z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema),
    ]),
})
    .strict();
export const NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema = z
    .object({
    where: z.lazy(() => NotificationSettingWhereUniqueInputSchema),
    data: z.union([
        z.lazy(() => NotificationSettingUpdateWithoutNotificationMethodInputSchema),
        z.lazy(() => NotificationSettingUncheckedUpdateWithoutNotificationMethodInputSchema),
    ]),
})
    .strict();
export const NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema = z
    .object({
    where: z.lazy(() => NotificationSettingScalarWhereInputSchema),
    data: z.union([
        z.lazy(() => NotificationSettingUpdateManyMutationInputSchema),
        z.lazy(() => NotificationSettingUncheckedUpdateManyWithoutNotificationMethodInputSchema),
    ]),
})
    .strict();
export const NotificationSettingScalarWhereInputSchema = z
    .object({
    AND: z
        .union([
        z.lazy(() => NotificationSettingScalarWhereInputSchema),
        z.lazy(() => NotificationSettingScalarWhereInputSchema).array(),
    ])
        .optional(),
    OR: z
        .lazy(() => NotificationSettingScalarWhereInputSchema)
        .array()
        .optional(),
    NOT: z
        .union([
        z.lazy(() => NotificationSettingScalarWhereInputSchema),
        z.lazy(() => NotificationSettingScalarWhereInputSchema).array(),
    ])
        .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    notificationType: z
        .union([
        z.lazy(() => EnumNotificationTypeFilterSchema),
        z.lazy(() => NotificationTypeSchema),
    ])
        .optional(),
    methodId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
    enabled: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
})
    .strict();
export const NotificationMethodCreateWithoutNotificationsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    type: z.lazy(() => NotificationMethodTypeSchema),
    enabled: z.boolean().optional(),
    name: z.string().optional().nullable(),
    value: z.string(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z.string().optional().nullable(),
    webhookFormat: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
    settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutNotificationMethodsInputSchema),
})
    .strict();
export const NotificationMethodUncheckedCreateWithoutNotificationsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    settingsId: z.string(),
    type: z.lazy(() => NotificationMethodTypeSchema),
    enabled: z.boolean().optional(),
    name: z.string().optional().nullable(),
    value: z.string(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z.string().optional().nullable(),
    webhookFormat: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationMethodCreateOrConnectWithoutNotificationsInputSchema = z
    .object({
    where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
    create: z.union([
        z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema),
        z.lazy(() => NotificationMethodUncheckedCreateWithoutNotificationsInputSchema),
    ]),
})
    .strict();
export const NotificationMethodUpsertWithoutNotificationsInputSchema = z
    .object({
    update: z.union([
        z.lazy(() => NotificationMethodUpdateWithoutNotificationsInputSchema),
        z.lazy(() => NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema),
    ]),
    create: z.union([
        z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema),
        z.lazy(() => NotificationMethodUncheckedCreateWithoutNotificationsInputSchema),
    ]),
    where: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
})
    .strict();
export const NotificationMethodUpdateToOneWithWhereWithoutNotificationsInputSchema = z
    .object({
    where: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
    data: z.union([
        z.lazy(() => NotificationMethodUpdateWithoutNotificationsInputSchema),
        z.lazy(() => NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema),
    ]),
})
    .strict();
export const NotificationMethodUpdateWithoutNotificationsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    value: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    settings: z
        .lazy(() => PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    settingsId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    value: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const MembershipCreateManyPersonInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    eventId: z.string(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
})
    .strict();
export const PostCreateManyAuthorInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    eventId: z.string(),
    title: z.string(),
    content: z.string(),
})
    .strict();
export const ReplyCreateManyAuthorInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    postId: z.string(),
    text: z.string(),
})
    .strict();
export const NotificationCreateManyPersonInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    authorId: z.string().optional().nullable(),
    type: z.lazy(() => NotificationTypeSchema),
    eventId: z.string().optional().nullable(),
    postId: z.string().optional().nullable(),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationCreateManyAuthorInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
    type: z.lazy(() => NotificationTypeSchema),
    eventId: z.string().optional().nullable(),
    postId: z.string().optional().nullable(),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const MembershipUpdateWithoutPersonInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutMembershipsNestedInputSchema)
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUpdateManyWithoutMembershipNestedInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedUpdateWithoutPersonInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedUpdateManyWithoutPersonInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PostUpdateWithoutAuthorInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutPostsNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUpdateManyWithoutPostNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutPostNestedInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedUpdateWithoutAuthorInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedUpdateManyWithoutPostNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutPostNestedInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedUpdateManyWithoutAuthorInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const ReplyUpdateWithoutAuthorInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    text: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    post: z
        .lazy(() => PostUpdateOneRequiredWithoutRepliesNestedInputSchema)
        .optional(),
})
    .strict();
export const ReplyUncheckedUpdateWithoutAuthorInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    text: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const ReplyUncheckedUpdateManyWithoutAuthorInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    text: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationUpdateWithoutPersonInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    author: z
        .lazy(() => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema)
        .optional(),
    event: z
        .lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
    post: z
        .lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationUncheckedUpdateWithoutPersonInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationUncheckedUpdateManyWithoutPersonInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationUpdateWithoutAuthorInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    person: z
        .lazy(() => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema)
        .optional(),
    event: z
        .lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
    post: z
        .lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationUncheckedUpdateWithoutAuthorInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationUncheckedUpdateManyWithoutAuthorInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationMethodCreateManySettingsInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    type: z.lazy(() => NotificationMethodTypeSchema),
    enabled: z.boolean().optional(),
    name: z.string().optional().nullable(),
    value: z.string(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z.string().optional().nullable(),
    webhookFormat: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
})
    .strict();
export const NotificationMethodUpdateWithoutSettingsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    value: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    notifications: z
        .lazy(() => NotificationSettingUpdateManyWithoutNotificationMethodNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodUncheckedUpdateWithoutSettingsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    value: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    notifications: z
        .lazy(() => NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationMethodUncheckedUpdateManyWithoutSettingsInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationMethodTypeSchema),
        z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    value: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    webhookHeaders: z
        .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
    ])
        .optional(),
    customTemplate: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    webhookFormat: z
        .union([
        z.lazy(() => WebhookFormatSchema),
        z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const InviteCreateManyEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdById: z.string(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    usesRemaining: z.number().int().optional().nullable(),
    maxUses: z.number().int().optional().nullable(),
    name: z.string().optional().nullable(),
})
    .strict();
export const PotentialDateTimeCreateManyEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    dateTime: z.coerce.date().optional(),
})
    .strict();
export const PostCreateManyEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
    authorId: z.string(),
    title: z.string(),
    content: z.string(),
})
    .strict();
export const MembershipCreateManyEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    personId: z.string(),
    role: z.lazy(() => RoleSchema).optional(),
    rsvpStatus: z.lazy(() => StatusSchema).optional(),
})
    .strict();
export const NotificationCreateManyEventInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
    authorId: z.string().optional().nullable(),
    type: z.lazy(() => NotificationTypeSchema),
    postId: z.string().optional().nullable(),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const InviteUpdateWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    createdBy: z
        .lazy(() => MembershipUpdateOneRequiredWithoutInvitesNestedInputSchema)
        .optional(),
})
    .strict();
export const InviteUncheckedUpdateWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdById: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const InviteUncheckedUpdateManyWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdById: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const PotentialDateTimeUpdateWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    dateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUpdateManyWithoutPotentialDateTimeNestedInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeUncheckedUpdateWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    dateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInputSchema)
        .optional(),
})
    .strict();
export const PotentialDateTimeUncheckedUpdateManyWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    dateTime: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const PostUpdateWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    author: z
        .lazy(() => PersonUpdateOneRequiredWithoutPostsNestedInputSchema)
        .optional(),
    replies: z
        .lazy(() => ReplyUpdateManyWithoutPostNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUpdateManyWithoutPostNestedInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedUpdateWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    replies: z
        .lazy(() => ReplyUncheckedUpdateManyWithoutPostNestedInputSchema)
        .optional(),
    notifications: z
        .lazy(() => NotificationUncheckedUpdateManyWithoutPostNestedInputSchema)
        .optional(),
})
    .strict();
export const PostUncheckedUpdateManyWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    editedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    title: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    content: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const MembershipUpdateWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    person: z
        .lazy(() => PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema)
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUpdateManyWithoutMembershipNestedInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedUpdateWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    availabilities: z
        .lazy(() => AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema)
        .optional(),
    invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
})
    .strict();
export const MembershipUncheckedUpdateManyWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    role: z
        .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    rsvpStatus: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationUpdateWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    person: z
        .lazy(() => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema)
        .optional(),
    author: z
        .lazy(() => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema)
        .optional(),
    post: z
        .lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationUncheckedUpdateWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationUncheckedUpdateManyWithoutEventInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    postId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const AvailabilityCreateManyMembershipInputSchema = z
    .object({
    potentialDateTimeId: z.string(),
    status: z.lazy(() => StatusSchema),
})
    .strict();
export const InviteCreateManyCreatedByInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    eventId: z.string(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    usesRemaining: z.number().int().optional().nullable(),
    maxUses: z.number().int().optional().nullable(),
    name: z.string().optional().nullable(),
})
    .strict();
export const AvailabilityUpdateWithoutMembershipInputSchema = z
    .object({
    status: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    potentialDateTime: z
        .lazy(() => PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema)
        .optional(),
})
    .strict();
export const AvailabilityUncheckedUpdateWithoutMembershipInputSchema = z
    .object({
    potentialDateTimeId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    status: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const AvailabilityUncheckedUpdateManyWithoutMembershipInputSchema = z
    .object({
    potentialDateTimeId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    status: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const InviteUpdateWithoutCreatedByInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    event: z
        .lazy(() => EventUpdateOneRequiredWithoutInvitesNestedInputSchema)
        .optional(),
})
    .strict();
export const InviteUncheckedUpdateWithoutCreatedByInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const InviteUncheckedUpdateManyWithoutCreatedByInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    expiresAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    usesRemaining: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    maxUses: z
        .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    name: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const AvailabilityCreateManyPotentialDateTimeInputSchema = z
    .object({
    membershipId: z.string(),
    status: z.lazy(() => StatusSchema),
})
    .strict();
export const AvailabilityUpdateWithoutPotentialDateTimeInputSchema = z
    .object({
    status: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    membership: z
        .lazy(() => MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema)
        .optional(),
})
    .strict();
export const AvailabilityUncheckedUpdateWithoutPotentialDateTimeInputSchema = z
    .object({
    membershipId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    status: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeInputSchema = z
    .object({
    membershipId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    status: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const ReplyCreateManyPostInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    authorId: z.string(),
    text: z.string(),
})
    .strict();
export const NotificationCreateManyPostInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    personId: z.string(),
    authorId: z.string().optional().nullable(),
    type: z.lazy(() => NotificationTypeSchema),
    eventId: z.string().optional().nullable(),
    read: z.boolean().optional(),
    datetime: z.coerce.date().optional().nullable(),
    rsvp: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
})
    .strict();
export const ReplyUpdateWithoutPostInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    text: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    author: z
        .lazy(() => PersonUpdateOneRequiredWithoutRepliesNestedInputSchema)
        .optional(),
})
    .strict();
export const ReplyUncheckedUpdateWithoutPostInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    text: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const ReplyUncheckedUpdateManyWithoutPostInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    text: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationUpdateWithoutPostInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    person: z
        .lazy(() => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema)
        .optional(),
    author: z
        .lazy(() => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema)
        .optional(),
    event: z
        .lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
})
    .strict();
export const NotificationUncheckedUpdateWithoutPostInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationUncheckedUpdateManyWithoutPostInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    createdAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    updatedAt: z
        .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    personId: z
        .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    authorId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    type: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    eventId: z
        .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    read: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    datetime: z
        .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
    rsvp: z
        .union([
        z.lazy(() => StatusSchema),
        z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema),
    ])
        .optional()
        .nullable(),
})
    .strict();
export const NotificationSettingCreateManyNotificationMethodInputSchema = z
    .object({
    id: z.string().cuid().optional(),
    notificationType: z.lazy(() => NotificationTypeSchema),
    enabled: z.boolean().optional(),
})
    .strict();
export const NotificationSettingUpdateWithoutNotificationMethodInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationType: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingUncheckedUpdateWithoutNotificationMethodInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationType: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingUncheckedUpdateManyWithoutNotificationMethodInputSchema = z
    .object({
    id: z
        .union([
        z.string().cuid(),
        z.lazy(() => StringFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    notificationType: z
        .union([
        z.lazy(() => NotificationTypeSchema),
        z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema),
    ])
        .optional(),
    enabled: z
        .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputSchema),
    ])
        .optional(),
})
    .strict();
/////////////////////////////////////////
// ARGS
/////////////////////////////////////////
export const PersonFindFirstArgsSchema = z
    .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    where: PersonWhereInputSchema.optional(),
    orderBy: z
        .union([
        PersonOrderByWithRelationInputSchema.array(),
        PersonOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PersonWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        PersonScalarFieldEnumSchema,
        PersonScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const PersonFindFirstOrThrowArgsSchema = z
    .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    where: PersonWhereInputSchema.optional(),
    orderBy: z
        .union([
        PersonOrderByWithRelationInputSchema.array(),
        PersonOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PersonWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        PersonScalarFieldEnumSchema,
        PersonScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const PersonFindManyArgsSchema = z
    .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    where: PersonWhereInputSchema.optional(),
    orderBy: z
        .union([
        PersonOrderByWithRelationInputSchema.array(),
        PersonOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PersonWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([PersonScalarFieldEnumSchema, PersonScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const PersonAggregateArgsSchema = z
    .object({
    where: PersonWhereInputSchema.optional(),
    orderBy: z
        .union([
        PersonOrderByWithRelationInputSchema.array(),
        PersonOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PersonWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const PersonGroupByArgsSchema = z
    .object({
    where: PersonWhereInputSchema.optional(),
    orderBy: z
        .union([
        PersonOrderByWithAggregationInputSchema.array(),
        PersonOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: PersonScalarFieldEnumSchema.array(),
    having: PersonScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const PersonFindUniqueArgsSchema = z
    .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    where: PersonWhereUniqueInputSchema,
})
    .strict();
export const PersonFindUniqueOrThrowArgsSchema = z
    .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    where: PersonWhereUniqueInputSchema,
})
    .strict();
export const PersonSettingsFindFirstArgsSchema = z
    .object({
    select: PersonSettingsSelectSchema.optional(),
    include: PersonSettingsIncludeSchema.optional(),
    where: PersonSettingsWhereInputSchema.optional(),
    orderBy: z
        .union([
        PersonSettingsOrderByWithRelationInputSchema.array(),
        PersonSettingsOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PersonSettingsWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        PersonSettingsScalarFieldEnumSchema,
        PersonSettingsScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsFindFirstOrThrowArgsSchema = z
    .object({
    select: PersonSettingsSelectSchema.optional(),
    include: PersonSettingsIncludeSchema.optional(),
    where: PersonSettingsWhereInputSchema.optional(),
    orderBy: z
        .union([
        PersonSettingsOrderByWithRelationInputSchema.array(),
        PersonSettingsOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PersonSettingsWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        PersonSettingsScalarFieldEnumSchema,
        PersonSettingsScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsFindManyArgsSchema = z
    .object({
    select: PersonSettingsSelectSchema.optional(),
    include: PersonSettingsIncludeSchema.optional(),
    where: PersonSettingsWhereInputSchema.optional(),
    orderBy: z
        .union([
        PersonSettingsOrderByWithRelationInputSchema.array(),
        PersonSettingsOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PersonSettingsWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        PersonSettingsScalarFieldEnumSchema,
        PersonSettingsScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const PersonSettingsAggregateArgsSchema = z
    .object({
    where: PersonSettingsWhereInputSchema.optional(),
    orderBy: z
        .union([
        PersonSettingsOrderByWithRelationInputSchema.array(),
        PersonSettingsOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PersonSettingsWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const PersonSettingsGroupByArgsSchema = z
    .object({
    where: PersonSettingsWhereInputSchema.optional(),
    orderBy: z
        .union([
        PersonSettingsOrderByWithAggregationInputSchema.array(),
        PersonSettingsOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: PersonSettingsScalarFieldEnumSchema.array(),
    having: PersonSettingsScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const PersonSettingsFindUniqueArgsSchema = z
    .object({
    select: PersonSettingsSelectSchema.optional(),
    include: PersonSettingsIncludeSchema.optional(),
    where: PersonSettingsWhereUniqueInputSchema,
})
    .strict();
export const PersonSettingsFindUniqueOrThrowArgsSchema = z
    .object({
    select: PersonSettingsSelectSchema.optional(),
    include: PersonSettingsIncludeSchema.optional(),
    where: PersonSettingsWhereUniqueInputSchema,
})
    .strict();
export const EventFindFirstArgsSchema = z
    .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    where: EventWhereInputSchema.optional(),
    orderBy: z
        .union([
        EventOrderByWithRelationInputSchema.array(),
        EventOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: EventWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const EventFindFirstOrThrowArgsSchema = z
    .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    where: EventWhereInputSchema.optional(),
    orderBy: z
        .union([
        EventOrderByWithRelationInputSchema.array(),
        EventOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: EventWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const EventFindManyArgsSchema = z
    .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    where: EventWhereInputSchema.optional(),
    orderBy: z
        .union([
        EventOrderByWithRelationInputSchema.array(),
        EventOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: EventWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const EventAggregateArgsSchema = z
    .object({
    where: EventWhereInputSchema.optional(),
    orderBy: z
        .union([
        EventOrderByWithRelationInputSchema.array(),
        EventOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: EventWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const EventGroupByArgsSchema = z
    .object({
    where: EventWhereInputSchema.optional(),
    orderBy: z
        .union([
        EventOrderByWithAggregationInputSchema.array(),
        EventOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: EventScalarFieldEnumSchema.array(),
    having: EventScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const EventFindUniqueArgsSchema = z
    .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    where: EventWhereUniqueInputSchema,
})
    .strict();
export const EventFindUniqueOrThrowArgsSchema = z
    .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    where: EventWhereUniqueInputSchema,
})
    .strict();
export const MembershipFindFirstArgsSchema = z
    .object({
    select: MembershipSelectSchema.optional(),
    include: MembershipIncludeSchema.optional(),
    where: MembershipWhereInputSchema.optional(),
    orderBy: z
        .union([
        MembershipOrderByWithRelationInputSchema.array(),
        MembershipOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: MembershipWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        MembershipScalarFieldEnumSchema,
        MembershipScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const MembershipFindFirstOrThrowArgsSchema = z
    .object({
    select: MembershipSelectSchema.optional(),
    include: MembershipIncludeSchema.optional(),
    where: MembershipWhereInputSchema.optional(),
    orderBy: z
        .union([
        MembershipOrderByWithRelationInputSchema.array(),
        MembershipOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: MembershipWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        MembershipScalarFieldEnumSchema,
        MembershipScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const MembershipFindManyArgsSchema = z
    .object({
    select: MembershipSelectSchema.optional(),
    include: MembershipIncludeSchema.optional(),
    where: MembershipWhereInputSchema.optional(),
    orderBy: z
        .union([
        MembershipOrderByWithRelationInputSchema.array(),
        MembershipOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: MembershipWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        MembershipScalarFieldEnumSchema,
        MembershipScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const MembershipAggregateArgsSchema = z
    .object({
    where: MembershipWhereInputSchema.optional(),
    orderBy: z
        .union([
        MembershipOrderByWithRelationInputSchema.array(),
        MembershipOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: MembershipWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const MembershipGroupByArgsSchema = z
    .object({
    where: MembershipWhereInputSchema.optional(),
    orderBy: z
        .union([
        MembershipOrderByWithAggregationInputSchema.array(),
        MembershipOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: MembershipScalarFieldEnumSchema.array(),
    having: MembershipScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const MembershipFindUniqueArgsSchema = z
    .object({
    select: MembershipSelectSchema.optional(),
    include: MembershipIncludeSchema.optional(),
    where: MembershipWhereUniqueInputSchema,
})
    .strict();
export const MembershipFindUniqueOrThrowArgsSchema = z
    .object({
    select: MembershipSelectSchema.optional(),
    include: MembershipIncludeSchema.optional(),
    where: MembershipWhereUniqueInputSchema,
})
    .strict();
export const PotentialDateTimeFindFirstArgsSchema = z
    .object({
    select: PotentialDateTimeSelectSchema.optional(),
    include: PotentialDateTimeIncludeSchema.optional(),
    where: PotentialDateTimeWhereInputSchema.optional(),
    orderBy: z
        .union([
        PotentialDateTimeOrderByWithRelationInputSchema.array(),
        PotentialDateTimeOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PotentialDateTimeWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        PotentialDateTimeScalarFieldEnumSchema,
        PotentialDateTimeScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeFindFirstOrThrowArgsSchema = z
    .object({
    select: PotentialDateTimeSelectSchema.optional(),
    include: PotentialDateTimeIncludeSchema.optional(),
    where: PotentialDateTimeWhereInputSchema.optional(),
    orderBy: z
        .union([
        PotentialDateTimeOrderByWithRelationInputSchema.array(),
        PotentialDateTimeOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PotentialDateTimeWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        PotentialDateTimeScalarFieldEnumSchema,
        PotentialDateTimeScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeFindManyArgsSchema = z
    .object({
    select: PotentialDateTimeSelectSchema.optional(),
    include: PotentialDateTimeIncludeSchema.optional(),
    where: PotentialDateTimeWhereInputSchema.optional(),
    orderBy: z
        .union([
        PotentialDateTimeOrderByWithRelationInputSchema.array(),
        PotentialDateTimeOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PotentialDateTimeWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        PotentialDateTimeScalarFieldEnumSchema,
        PotentialDateTimeScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const PotentialDateTimeAggregateArgsSchema = z
    .object({
    where: PotentialDateTimeWhereInputSchema.optional(),
    orderBy: z
        .union([
        PotentialDateTimeOrderByWithRelationInputSchema.array(),
        PotentialDateTimeOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PotentialDateTimeWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const PotentialDateTimeGroupByArgsSchema = z
    .object({
    where: PotentialDateTimeWhereInputSchema.optional(),
    orderBy: z
        .union([
        PotentialDateTimeOrderByWithAggregationInputSchema.array(),
        PotentialDateTimeOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: PotentialDateTimeScalarFieldEnumSchema.array(),
    having: PotentialDateTimeScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const PotentialDateTimeFindUniqueArgsSchema = z
    .object({
    select: PotentialDateTimeSelectSchema.optional(),
    include: PotentialDateTimeIncludeSchema.optional(),
    where: PotentialDateTimeWhereUniqueInputSchema,
})
    .strict();
export const PotentialDateTimeFindUniqueOrThrowArgsSchema = z
    .object({
    select: PotentialDateTimeSelectSchema.optional(),
    include: PotentialDateTimeIncludeSchema.optional(),
    where: PotentialDateTimeWhereUniqueInputSchema,
})
    .strict();
export const AvailabilityFindFirstArgsSchema = z
    .object({
    select: AvailabilitySelectSchema.optional(),
    include: AvailabilityIncludeSchema.optional(),
    where: AvailabilityWhereInputSchema.optional(),
    orderBy: z
        .union([
        AvailabilityOrderByWithRelationInputSchema.array(),
        AvailabilityOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: AvailabilityWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        AvailabilityScalarFieldEnumSchema,
        AvailabilityScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const AvailabilityFindFirstOrThrowArgsSchema = z
    .object({
    select: AvailabilitySelectSchema.optional(),
    include: AvailabilityIncludeSchema.optional(),
    where: AvailabilityWhereInputSchema.optional(),
    orderBy: z
        .union([
        AvailabilityOrderByWithRelationInputSchema.array(),
        AvailabilityOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: AvailabilityWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        AvailabilityScalarFieldEnumSchema,
        AvailabilityScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const AvailabilityFindManyArgsSchema = z
    .object({
    select: AvailabilitySelectSchema.optional(),
    include: AvailabilityIncludeSchema.optional(),
    where: AvailabilityWhereInputSchema.optional(),
    orderBy: z
        .union([
        AvailabilityOrderByWithRelationInputSchema.array(),
        AvailabilityOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: AvailabilityWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        AvailabilityScalarFieldEnumSchema,
        AvailabilityScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const AvailabilityAggregateArgsSchema = z
    .object({
    where: AvailabilityWhereInputSchema.optional(),
    orderBy: z
        .union([
        AvailabilityOrderByWithRelationInputSchema.array(),
        AvailabilityOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: AvailabilityWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const AvailabilityGroupByArgsSchema = z
    .object({
    where: AvailabilityWhereInputSchema.optional(),
    orderBy: z
        .union([
        AvailabilityOrderByWithAggregationInputSchema.array(),
        AvailabilityOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: AvailabilityScalarFieldEnumSchema.array(),
    having: AvailabilityScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const AvailabilityFindUniqueArgsSchema = z
    .object({
    select: AvailabilitySelectSchema.optional(),
    include: AvailabilityIncludeSchema.optional(),
    where: AvailabilityWhereUniqueInputSchema,
})
    .strict();
export const AvailabilityFindUniqueOrThrowArgsSchema = z
    .object({
    select: AvailabilitySelectSchema.optional(),
    include: AvailabilityIncludeSchema.optional(),
    where: AvailabilityWhereUniqueInputSchema,
})
    .strict();
export const PostFindFirstArgsSchema = z
    .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereInputSchema.optional(),
    orderBy: z
        .union([
        PostOrderByWithRelationInputSchema.array(),
        PostOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PostWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([PostScalarFieldEnumSchema, PostScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const PostFindFirstOrThrowArgsSchema = z
    .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereInputSchema.optional(),
    orderBy: z
        .union([
        PostOrderByWithRelationInputSchema.array(),
        PostOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PostWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([PostScalarFieldEnumSchema, PostScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const PostFindManyArgsSchema = z
    .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereInputSchema.optional(),
    orderBy: z
        .union([
        PostOrderByWithRelationInputSchema.array(),
        PostOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PostWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([PostScalarFieldEnumSchema, PostScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const PostAggregateArgsSchema = z
    .object({
    where: PostWhereInputSchema.optional(),
    orderBy: z
        .union([
        PostOrderByWithRelationInputSchema.array(),
        PostOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: PostWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const PostGroupByArgsSchema = z
    .object({
    where: PostWhereInputSchema.optional(),
    orderBy: z
        .union([
        PostOrderByWithAggregationInputSchema.array(),
        PostOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: PostScalarFieldEnumSchema.array(),
    having: PostScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const PostFindUniqueArgsSchema = z
    .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereUniqueInputSchema,
})
    .strict();
export const PostFindUniqueOrThrowArgsSchema = z
    .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereUniqueInputSchema,
})
    .strict();
export const ReplyFindFirstArgsSchema = z
    .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    where: ReplyWhereInputSchema.optional(),
    orderBy: z
        .union([
        ReplyOrderByWithRelationInputSchema.array(),
        ReplyOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: ReplyWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([ReplyScalarFieldEnumSchema, ReplyScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const ReplyFindFirstOrThrowArgsSchema = z
    .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    where: ReplyWhereInputSchema.optional(),
    orderBy: z
        .union([
        ReplyOrderByWithRelationInputSchema.array(),
        ReplyOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: ReplyWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([ReplyScalarFieldEnumSchema, ReplyScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const ReplyFindManyArgsSchema = z
    .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    where: ReplyWhereInputSchema.optional(),
    orderBy: z
        .union([
        ReplyOrderByWithRelationInputSchema.array(),
        ReplyOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: ReplyWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([ReplyScalarFieldEnumSchema, ReplyScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const ReplyAggregateArgsSchema = z
    .object({
    where: ReplyWhereInputSchema.optional(),
    orderBy: z
        .union([
        ReplyOrderByWithRelationInputSchema.array(),
        ReplyOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: ReplyWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const ReplyGroupByArgsSchema = z
    .object({
    where: ReplyWhereInputSchema.optional(),
    orderBy: z
        .union([
        ReplyOrderByWithAggregationInputSchema.array(),
        ReplyOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: ReplyScalarFieldEnumSchema.array(),
    having: ReplyScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const ReplyFindUniqueArgsSchema = z
    .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    where: ReplyWhereUniqueInputSchema,
})
    .strict();
export const ReplyFindUniqueOrThrowArgsSchema = z
    .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    where: ReplyWhereUniqueInputSchema,
})
    .strict();
export const InviteFindFirstArgsSchema = z
    .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    where: InviteWhereInputSchema.optional(),
    orderBy: z
        .union([
        InviteOrderByWithRelationInputSchema.array(),
        InviteOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: InviteWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        InviteScalarFieldEnumSchema,
        InviteScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const InviteFindFirstOrThrowArgsSchema = z
    .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    where: InviteWhereInputSchema.optional(),
    orderBy: z
        .union([
        InviteOrderByWithRelationInputSchema.array(),
        InviteOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: InviteWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        InviteScalarFieldEnumSchema,
        InviteScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const InviteFindManyArgsSchema = z
    .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    where: InviteWhereInputSchema.optional(),
    orderBy: z
        .union([
        InviteOrderByWithRelationInputSchema.array(),
        InviteOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: InviteWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([InviteScalarFieldEnumSchema, InviteScalarFieldEnumSchema.array()])
        .optional(),
})
    .strict();
export const InviteAggregateArgsSchema = z
    .object({
    where: InviteWhereInputSchema.optional(),
    orderBy: z
        .union([
        InviteOrderByWithRelationInputSchema.array(),
        InviteOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: InviteWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const InviteGroupByArgsSchema = z
    .object({
    where: InviteWhereInputSchema.optional(),
    orderBy: z
        .union([
        InviteOrderByWithAggregationInputSchema.array(),
        InviteOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: InviteScalarFieldEnumSchema.array(),
    having: InviteScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const InviteFindUniqueArgsSchema = z
    .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    where: InviteWhereUniqueInputSchema,
})
    .strict();
export const InviteFindUniqueOrThrowArgsSchema = z
    .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    where: InviteWhereUniqueInputSchema,
})
    .strict();
export const NotificationFindFirstArgsSchema = z
    .object({
    select: NotificationSelectSchema.optional(),
    include: NotificationIncludeSchema.optional(),
    where: NotificationWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationOrderByWithRelationInputSchema.array(),
        NotificationOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        NotificationScalarFieldEnumSchema,
        NotificationScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const NotificationFindFirstOrThrowArgsSchema = z
    .object({
    select: NotificationSelectSchema.optional(),
    include: NotificationIncludeSchema.optional(),
    where: NotificationWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationOrderByWithRelationInputSchema.array(),
        NotificationOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        NotificationScalarFieldEnumSchema,
        NotificationScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const NotificationFindManyArgsSchema = z
    .object({
    select: NotificationSelectSchema.optional(),
    include: NotificationIncludeSchema.optional(),
    where: NotificationWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationOrderByWithRelationInputSchema.array(),
        NotificationOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        NotificationScalarFieldEnumSchema,
        NotificationScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const NotificationAggregateArgsSchema = z
    .object({
    where: NotificationWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationOrderByWithRelationInputSchema.array(),
        NotificationOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const NotificationGroupByArgsSchema = z
    .object({
    where: NotificationWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationOrderByWithAggregationInputSchema.array(),
        NotificationOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: NotificationScalarFieldEnumSchema.array(),
    having: NotificationScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const NotificationFindUniqueArgsSchema = z
    .object({
    select: NotificationSelectSchema.optional(),
    include: NotificationIncludeSchema.optional(),
    where: NotificationWhereUniqueInputSchema,
})
    .strict();
export const NotificationFindUniqueOrThrowArgsSchema = z
    .object({
    select: NotificationSelectSchema.optional(),
    include: NotificationIncludeSchema.optional(),
    where: NotificationWhereUniqueInputSchema,
})
    .strict();
export const NotificationMethodFindFirstArgsSchema = z
    .object({
    select: NotificationMethodSelectSchema.optional(),
    include: NotificationMethodIncludeSchema.optional(),
    where: NotificationMethodWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationMethodOrderByWithRelationInputSchema.array(),
        NotificationMethodOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationMethodWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        NotificationMethodScalarFieldEnumSchema,
        NotificationMethodScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const NotificationMethodFindFirstOrThrowArgsSchema = z
    .object({
    select: NotificationMethodSelectSchema.optional(),
    include: NotificationMethodIncludeSchema.optional(),
    where: NotificationMethodWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationMethodOrderByWithRelationInputSchema.array(),
        NotificationMethodOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationMethodWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        NotificationMethodScalarFieldEnumSchema,
        NotificationMethodScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const NotificationMethodFindManyArgsSchema = z
    .object({
    select: NotificationMethodSelectSchema.optional(),
    include: NotificationMethodIncludeSchema.optional(),
    where: NotificationMethodWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationMethodOrderByWithRelationInputSchema.array(),
        NotificationMethodOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationMethodWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        NotificationMethodScalarFieldEnumSchema,
        NotificationMethodScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const NotificationMethodAggregateArgsSchema = z
    .object({
    where: NotificationMethodWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationMethodOrderByWithRelationInputSchema.array(),
        NotificationMethodOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationMethodWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const NotificationMethodGroupByArgsSchema = z
    .object({
    where: NotificationMethodWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationMethodOrderByWithAggregationInputSchema.array(),
        NotificationMethodOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: NotificationMethodScalarFieldEnumSchema.array(),
    having: NotificationMethodScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const NotificationMethodFindUniqueArgsSchema = z
    .object({
    select: NotificationMethodSelectSchema.optional(),
    include: NotificationMethodIncludeSchema.optional(),
    where: NotificationMethodWhereUniqueInputSchema,
})
    .strict();
export const NotificationMethodFindUniqueOrThrowArgsSchema = z
    .object({
    select: NotificationMethodSelectSchema.optional(),
    include: NotificationMethodIncludeSchema.optional(),
    where: NotificationMethodWhereUniqueInputSchema,
})
    .strict();
export const NotificationSettingFindFirstArgsSchema = z
    .object({
    select: NotificationSettingSelectSchema.optional(),
    include: NotificationSettingIncludeSchema.optional(),
    where: NotificationSettingWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationSettingOrderByWithRelationInputSchema.array(),
        NotificationSettingOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationSettingWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        NotificationSettingScalarFieldEnumSchema,
        NotificationSettingScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingFindFirstOrThrowArgsSchema = z
    .object({
    select: NotificationSettingSelectSchema.optional(),
    include: NotificationSettingIncludeSchema.optional(),
    where: NotificationSettingWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationSettingOrderByWithRelationInputSchema.array(),
        NotificationSettingOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationSettingWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        NotificationSettingScalarFieldEnumSchema,
        NotificationSettingScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingFindManyArgsSchema = z
    .object({
    select: NotificationSettingSelectSchema.optional(),
    include: NotificationSettingIncludeSchema.optional(),
    where: NotificationSettingWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationSettingOrderByWithRelationInputSchema.array(),
        NotificationSettingOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationSettingWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
        .union([
        NotificationSettingScalarFieldEnumSchema,
        NotificationSettingScalarFieldEnumSchema.array(),
    ])
        .optional(),
})
    .strict();
export const NotificationSettingAggregateArgsSchema = z
    .object({
    where: NotificationSettingWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationSettingOrderByWithRelationInputSchema.array(),
        NotificationSettingOrderByWithRelationInputSchema,
    ])
        .optional(),
    cursor: NotificationSettingWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const NotificationSettingGroupByArgsSchema = z
    .object({
    where: NotificationSettingWhereInputSchema.optional(),
    orderBy: z
        .union([
        NotificationSettingOrderByWithAggregationInputSchema.array(),
        NotificationSettingOrderByWithAggregationInputSchema,
    ])
        .optional(),
    by: NotificationSettingScalarFieldEnumSchema.array(),
    having: NotificationSettingScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
})
    .strict();
export const NotificationSettingFindUniqueArgsSchema = z
    .object({
    select: NotificationSettingSelectSchema.optional(),
    include: NotificationSettingIncludeSchema.optional(),
    where: NotificationSettingWhereUniqueInputSchema,
})
    .strict();
export const NotificationSettingFindUniqueOrThrowArgsSchema = z
    .object({
    select: NotificationSettingSelectSchema.optional(),
    include: NotificationSettingIncludeSchema.optional(),
    where: NotificationSettingWhereUniqueInputSchema,
})
    .strict();
export const PersonCreateArgsSchema = z
    .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    data: z.union([PersonCreateInputSchema, PersonUncheckedCreateInputSchema]),
})
    .strict();
export const PersonUpsertArgsSchema = z
    .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    where: PersonWhereUniqueInputSchema,
    create: z.union([
        PersonCreateInputSchema,
        PersonUncheckedCreateInputSchema,
    ]),
    update: z.union([
        PersonUpdateInputSchema,
        PersonUncheckedUpdateInputSchema,
    ]),
})
    .strict();
export const PersonCreateManyArgsSchema = z
    .object({
    data: z.union([
        PersonCreateManyInputSchema,
        PersonCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PersonCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        PersonCreateManyInputSchema,
        PersonCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PersonDeleteArgsSchema = z
    .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    where: PersonWhereUniqueInputSchema,
})
    .strict();
export const PersonUpdateArgsSchema = z
    .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    data: z.union([PersonUpdateInputSchema, PersonUncheckedUpdateInputSchema]),
    where: PersonWhereUniqueInputSchema,
})
    .strict();
export const PersonUpdateManyArgsSchema = z
    .object({
    data: z.union([
        PersonUpdateManyMutationInputSchema,
        PersonUncheckedUpdateManyInputSchema,
    ]),
    where: PersonWhereInputSchema.optional(),
})
    .strict();
export const PersonDeleteManyArgsSchema = z
    .object({
    where: PersonWhereInputSchema.optional(),
})
    .strict();
export const PersonSettingsCreateArgsSchema = z
    .object({
    select: PersonSettingsSelectSchema.optional(),
    include: PersonSettingsIncludeSchema.optional(),
    data: z.union([
        PersonSettingsCreateInputSchema,
        PersonSettingsUncheckedCreateInputSchema,
    ]),
})
    .strict();
export const PersonSettingsUpsertArgsSchema = z
    .object({
    select: PersonSettingsSelectSchema.optional(),
    include: PersonSettingsIncludeSchema.optional(),
    where: PersonSettingsWhereUniqueInputSchema,
    create: z.union([
        PersonSettingsCreateInputSchema,
        PersonSettingsUncheckedCreateInputSchema,
    ]),
    update: z.union([
        PersonSettingsUpdateInputSchema,
        PersonSettingsUncheckedUpdateInputSchema,
    ]),
})
    .strict();
export const PersonSettingsCreateManyArgsSchema = z
    .object({
    data: z.union([
        PersonSettingsCreateManyInputSchema,
        PersonSettingsCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PersonSettingsCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        PersonSettingsCreateManyInputSchema,
        PersonSettingsCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PersonSettingsDeleteArgsSchema = z
    .object({
    select: PersonSettingsSelectSchema.optional(),
    include: PersonSettingsIncludeSchema.optional(),
    where: PersonSettingsWhereUniqueInputSchema,
})
    .strict();
export const PersonSettingsUpdateArgsSchema = z
    .object({
    select: PersonSettingsSelectSchema.optional(),
    include: PersonSettingsIncludeSchema.optional(),
    data: z.union([
        PersonSettingsUpdateInputSchema,
        PersonSettingsUncheckedUpdateInputSchema,
    ]),
    where: PersonSettingsWhereUniqueInputSchema,
})
    .strict();
export const PersonSettingsUpdateManyArgsSchema = z
    .object({
    data: z.union([
        PersonSettingsUpdateManyMutationInputSchema,
        PersonSettingsUncheckedUpdateManyInputSchema,
    ]),
    where: PersonSettingsWhereInputSchema.optional(),
})
    .strict();
export const PersonSettingsDeleteManyArgsSchema = z
    .object({
    where: PersonSettingsWhereInputSchema.optional(),
})
    .strict();
export const EventCreateArgsSchema = z
    .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    data: z.union([EventCreateInputSchema, EventUncheckedCreateInputSchema]),
})
    .strict();
export const EventUpsertArgsSchema = z
    .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    where: EventWhereUniqueInputSchema,
    create: z.union([EventCreateInputSchema, EventUncheckedCreateInputSchema]),
    update: z.union([EventUpdateInputSchema, EventUncheckedUpdateInputSchema]),
})
    .strict();
export const EventCreateManyArgsSchema = z
    .object({
    data: z.union([
        EventCreateManyInputSchema,
        EventCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const EventCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        EventCreateManyInputSchema,
        EventCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const EventDeleteArgsSchema = z
    .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    where: EventWhereUniqueInputSchema,
})
    .strict();
export const EventUpdateArgsSchema = z
    .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    data: z.union([EventUpdateInputSchema, EventUncheckedUpdateInputSchema]),
    where: EventWhereUniqueInputSchema,
})
    .strict();
export const EventUpdateManyArgsSchema = z
    .object({
    data: z.union([
        EventUpdateManyMutationInputSchema,
        EventUncheckedUpdateManyInputSchema,
    ]),
    where: EventWhereInputSchema.optional(),
})
    .strict();
export const EventDeleteManyArgsSchema = z
    .object({
    where: EventWhereInputSchema.optional(),
})
    .strict();
export const MembershipCreateArgsSchema = z
    .object({
    select: MembershipSelectSchema.optional(),
    include: MembershipIncludeSchema.optional(),
    data: z.union([
        MembershipCreateInputSchema,
        MembershipUncheckedCreateInputSchema,
    ]),
})
    .strict();
export const MembershipUpsertArgsSchema = z
    .object({
    select: MembershipSelectSchema.optional(),
    include: MembershipIncludeSchema.optional(),
    where: MembershipWhereUniqueInputSchema,
    create: z.union([
        MembershipCreateInputSchema,
        MembershipUncheckedCreateInputSchema,
    ]),
    update: z.union([
        MembershipUpdateInputSchema,
        MembershipUncheckedUpdateInputSchema,
    ]),
})
    .strict();
export const MembershipCreateManyArgsSchema = z
    .object({
    data: z.union([
        MembershipCreateManyInputSchema,
        MembershipCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const MembershipCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        MembershipCreateManyInputSchema,
        MembershipCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const MembershipDeleteArgsSchema = z
    .object({
    select: MembershipSelectSchema.optional(),
    include: MembershipIncludeSchema.optional(),
    where: MembershipWhereUniqueInputSchema,
})
    .strict();
export const MembershipUpdateArgsSchema = z
    .object({
    select: MembershipSelectSchema.optional(),
    include: MembershipIncludeSchema.optional(),
    data: z.union([
        MembershipUpdateInputSchema,
        MembershipUncheckedUpdateInputSchema,
    ]),
    where: MembershipWhereUniqueInputSchema,
})
    .strict();
export const MembershipUpdateManyArgsSchema = z
    .object({
    data: z.union([
        MembershipUpdateManyMutationInputSchema,
        MembershipUncheckedUpdateManyInputSchema,
    ]),
    where: MembershipWhereInputSchema.optional(),
})
    .strict();
export const MembershipDeleteManyArgsSchema = z
    .object({
    where: MembershipWhereInputSchema.optional(),
})
    .strict();
export const PotentialDateTimeCreateArgsSchema = z
    .object({
    select: PotentialDateTimeSelectSchema.optional(),
    include: PotentialDateTimeIncludeSchema.optional(),
    data: z.union([
        PotentialDateTimeCreateInputSchema,
        PotentialDateTimeUncheckedCreateInputSchema,
    ]),
})
    .strict();
export const PotentialDateTimeUpsertArgsSchema = z
    .object({
    select: PotentialDateTimeSelectSchema.optional(),
    include: PotentialDateTimeIncludeSchema.optional(),
    where: PotentialDateTimeWhereUniqueInputSchema,
    create: z.union([
        PotentialDateTimeCreateInputSchema,
        PotentialDateTimeUncheckedCreateInputSchema,
    ]),
    update: z.union([
        PotentialDateTimeUpdateInputSchema,
        PotentialDateTimeUncheckedUpdateInputSchema,
    ]),
})
    .strict();
export const PotentialDateTimeCreateManyArgsSchema = z
    .object({
    data: z.union([
        PotentialDateTimeCreateManyInputSchema,
        PotentialDateTimeCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PotentialDateTimeCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        PotentialDateTimeCreateManyInputSchema,
        PotentialDateTimeCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PotentialDateTimeDeleteArgsSchema = z
    .object({
    select: PotentialDateTimeSelectSchema.optional(),
    include: PotentialDateTimeIncludeSchema.optional(),
    where: PotentialDateTimeWhereUniqueInputSchema,
})
    .strict();
export const PotentialDateTimeUpdateArgsSchema = z
    .object({
    select: PotentialDateTimeSelectSchema.optional(),
    include: PotentialDateTimeIncludeSchema.optional(),
    data: z.union([
        PotentialDateTimeUpdateInputSchema,
        PotentialDateTimeUncheckedUpdateInputSchema,
    ]),
    where: PotentialDateTimeWhereUniqueInputSchema,
})
    .strict();
export const PotentialDateTimeUpdateManyArgsSchema = z
    .object({
    data: z.union([
        PotentialDateTimeUpdateManyMutationInputSchema,
        PotentialDateTimeUncheckedUpdateManyInputSchema,
    ]),
    where: PotentialDateTimeWhereInputSchema.optional(),
})
    .strict();
export const PotentialDateTimeDeleteManyArgsSchema = z
    .object({
    where: PotentialDateTimeWhereInputSchema.optional(),
})
    .strict();
export const AvailabilityCreateArgsSchema = z
    .object({
    select: AvailabilitySelectSchema.optional(),
    include: AvailabilityIncludeSchema.optional(),
    data: z.union([
        AvailabilityCreateInputSchema,
        AvailabilityUncheckedCreateInputSchema,
    ]),
})
    .strict();
export const AvailabilityUpsertArgsSchema = z
    .object({
    select: AvailabilitySelectSchema.optional(),
    include: AvailabilityIncludeSchema.optional(),
    where: AvailabilityWhereUniqueInputSchema,
    create: z.union([
        AvailabilityCreateInputSchema,
        AvailabilityUncheckedCreateInputSchema,
    ]),
    update: z.union([
        AvailabilityUpdateInputSchema,
        AvailabilityUncheckedUpdateInputSchema,
    ]),
})
    .strict();
export const AvailabilityCreateManyArgsSchema = z
    .object({
    data: z.union([
        AvailabilityCreateManyInputSchema,
        AvailabilityCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const AvailabilityCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        AvailabilityCreateManyInputSchema,
        AvailabilityCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const AvailabilityDeleteArgsSchema = z
    .object({
    select: AvailabilitySelectSchema.optional(),
    include: AvailabilityIncludeSchema.optional(),
    where: AvailabilityWhereUniqueInputSchema,
})
    .strict();
export const AvailabilityUpdateArgsSchema = z
    .object({
    select: AvailabilitySelectSchema.optional(),
    include: AvailabilityIncludeSchema.optional(),
    data: z.union([
        AvailabilityUpdateInputSchema,
        AvailabilityUncheckedUpdateInputSchema,
    ]),
    where: AvailabilityWhereUniqueInputSchema,
})
    .strict();
export const AvailabilityUpdateManyArgsSchema = z
    .object({
    data: z.union([
        AvailabilityUpdateManyMutationInputSchema,
        AvailabilityUncheckedUpdateManyInputSchema,
    ]),
    where: AvailabilityWhereInputSchema.optional(),
})
    .strict();
export const AvailabilityDeleteManyArgsSchema = z
    .object({
    where: AvailabilityWhereInputSchema.optional(),
})
    .strict();
export const PostCreateArgsSchema = z
    .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    data: z.union([PostCreateInputSchema, PostUncheckedCreateInputSchema]),
})
    .strict();
export const PostUpsertArgsSchema = z
    .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereUniqueInputSchema,
    create: z.union([PostCreateInputSchema, PostUncheckedCreateInputSchema]),
    update: z.union([PostUpdateInputSchema, PostUncheckedUpdateInputSchema]),
})
    .strict();
export const PostCreateManyArgsSchema = z
    .object({
    data: z.union([
        PostCreateManyInputSchema,
        PostCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PostCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        PostCreateManyInputSchema,
        PostCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const PostDeleteArgsSchema = z
    .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereUniqueInputSchema,
})
    .strict();
export const PostUpdateArgsSchema = z
    .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    data: z.union([PostUpdateInputSchema, PostUncheckedUpdateInputSchema]),
    where: PostWhereUniqueInputSchema,
})
    .strict();
export const PostUpdateManyArgsSchema = z
    .object({
    data: z.union([
        PostUpdateManyMutationInputSchema,
        PostUncheckedUpdateManyInputSchema,
    ]),
    where: PostWhereInputSchema.optional(),
})
    .strict();
export const PostDeleteManyArgsSchema = z
    .object({
    where: PostWhereInputSchema.optional(),
})
    .strict();
export const ReplyCreateArgsSchema = z
    .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    data: z.union([ReplyCreateInputSchema, ReplyUncheckedCreateInputSchema]),
})
    .strict();
export const ReplyUpsertArgsSchema = z
    .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    where: ReplyWhereUniqueInputSchema,
    create: z.union([ReplyCreateInputSchema, ReplyUncheckedCreateInputSchema]),
    update: z.union([ReplyUpdateInputSchema, ReplyUncheckedUpdateInputSchema]),
})
    .strict();
export const ReplyCreateManyArgsSchema = z
    .object({
    data: z.union([
        ReplyCreateManyInputSchema,
        ReplyCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const ReplyCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        ReplyCreateManyInputSchema,
        ReplyCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const ReplyDeleteArgsSchema = z
    .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    where: ReplyWhereUniqueInputSchema,
})
    .strict();
export const ReplyUpdateArgsSchema = z
    .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    data: z.union([ReplyUpdateInputSchema, ReplyUncheckedUpdateInputSchema]),
    where: ReplyWhereUniqueInputSchema,
})
    .strict();
export const ReplyUpdateManyArgsSchema = z
    .object({
    data: z.union([
        ReplyUpdateManyMutationInputSchema,
        ReplyUncheckedUpdateManyInputSchema,
    ]),
    where: ReplyWhereInputSchema.optional(),
})
    .strict();
export const ReplyDeleteManyArgsSchema = z
    .object({
    where: ReplyWhereInputSchema.optional(),
})
    .strict();
export const InviteCreateArgsSchema = z
    .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    data: z.union([InviteCreateInputSchema, InviteUncheckedCreateInputSchema]),
})
    .strict();
export const InviteUpsertArgsSchema = z
    .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    where: InviteWhereUniqueInputSchema,
    create: z.union([
        InviteCreateInputSchema,
        InviteUncheckedCreateInputSchema,
    ]),
    update: z.union([
        InviteUpdateInputSchema,
        InviteUncheckedUpdateInputSchema,
    ]),
})
    .strict();
export const InviteCreateManyArgsSchema = z
    .object({
    data: z.union([
        InviteCreateManyInputSchema,
        InviteCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const InviteCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        InviteCreateManyInputSchema,
        InviteCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const InviteDeleteArgsSchema = z
    .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    where: InviteWhereUniqueInputSchema,
})
    .strict();
export const InviteUpdateArgsSchema = z
    .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    data: z.union([InviteUpdateInputSchema, InviteUncheckedUpdateInputSchema]),
    where: InviteWhereUniqueInputSchema,
})
    .strict();
export const InviteUpdateManyArgsSchema = z
    .object({
    data: z.union([
        InviteUpdateManyMutationInputSchema,
        InviteUncheckedUpdateManyInputSchema,
    ]),
    where: InviteWhereInputSchema.optional(),
})
    .strict();
export const InviteDeleteManyArgsSchema = z
    .object({
    where: InviteWhereInputSchema.optional(),
})
    .strict();
export const NotificationCreateArgsSchema = z
    .object({
    select: NotificationSelectSchema.optional(),
    include: NotificationIncludeSchema.optional(),
    data: z.union([
        NotificationCreateInputSchema,
        NotificationUncheckedCreateInputSchema,
    ]),
})
    .strict();
export const NotificationUpsertArgsSchema = z
    .object({
    select: NotificationSelectSchema.optional(),
    include: NotificationIncludeSchema.optional(),
    where: NotificationWhereUniqueInputSchema,
    create: z.union([
        NotificationCreateInputSchema,
        NotificationUncheckedCreateInputSchema,
    ]),
    update: z.union([
        NotificationUpdateInputSchema,
        NotificationUncheckedUpdateInputSchema,
    ]),
})
    .strict();
export const NotificationCreateManyArgsSchema = z
    .object({
    data: z.union([
        NotificationCreateManyInputSchema,
        NotificationCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const NotificationCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        NotificationCreateManyInputSchema,
        NotificationCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const NotificationDeleteArgsSchema = z
    .object({
    select: NotificationSelectSchema.optional(),
    include: NotificationIncludeSchema.optional(),
    where: NotificationWhereUniqueInputSchema,
})
    .strict();
export const NotificationUpdateArgsSchema = z
    .object({
    select: NotificationSelectSchema.optional(),
    include: NotificationIncludeSchema.optional(),
    data: z.union([
        NotificationUpdateInputSchema,
        NotificationUncheckedUpdateInputSchema,
    ]),
    where: NotificationWhereUniqueInputSchema,
})
    .strict();
export const NotificationUpdateManyArgsSchema = z
    .object({
    data: z.union([
        NotificationUpdateManyMutationInputSchema,
        NotificationUncheckedUpdateManyInputSchema,
    ]),
    where: NotificationWhereInputSchema.optional(),
})
    .strict();
export const NotificationDeleteManyArgsSchema = z
    .object({
    where: NotificationWhereInputSchema.optional(),
})
    .strict();
export const NotificationMethodCreateArgsSchema = z
    .object({
    select: NotificationMethodSelectSchema.optional(),
    include: NotificationMethodIncludeSchema.optional(),
    data: z.union([
        NotificationMethodCreateInputSchema,
        NotificationMethodUncheckedCreateInputSchema,
    ]),
})
    .strict();
export const NotificationMethodUpsertArgsSchema = z
    .object({
    select: NotificationMethodSelectSchema.optional(),
    include: NotificationMethodIncludeSchema.optional(),
    where: NotificationMethodWhereUniqueInputSchema,
    create: z.union([
        NotificationMethodCreateInputSchema,
        NotificationMethodUncheckedCreateInputSchema,
    ]),
    update: z.union([
        NotificationMethodUpdateInputSchema,
        NotificationMethodUncheckedUpdateInputSchema,
    ]),
})
    .strict();
export const NotificationMethodCreateManyArgsSchema = z
    .object({
    data: z.union([
        NotificationMethodCreateManyInputSchema,
        NotificationMethodCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const NotificationMethodCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        NotificationMethodCreateManyInputSchema,
        NotificationMethodCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const NotificationMethodDeleteArgsSchema = z
    .object({
    select: NotificationMethodSelectSchema.optional(),
    include: NotificationMethodIncludeSchema.optional(),
    where: NotificationMethodWhereUniqueInputSchema,
})
    .strict();
export const NotificationMethodUpdateArgsSchema = z
    .object({
    select: NotificationMethodSelectSchema.optional(),
    include: NotificationMethodIncludeSchema.optional(),
    data: z.union([
        NotificationMethodUpdateInputSchema,
        NotificationMethodUncheckedUpdateInputSchema,
    ]),
    where: NotificationMethodWhereUniqueInputSchema,
})
    .strict();
export const NotificationMethodUpdateManyArgsSchema = z
    .object({
    data: z.union([
        NotificationMethodUpdateManyMutationInputSchema,
        NotificationMethodUncheckedUpdateManyInputSchema,
    ]),
    where: NotificationMethodWhereInputSchema.optional(),
})
    .strict();
export const NotificationMethodDeleteManyArgsSchema = z
    .object({
    where: NotificationMethodWhereInputSchema.optional(),
})
    .strict();
export const NotificationSettingCreateArgsSchema = z
    .object({
    select: NotificationSettingSelectSchema.optional(),
    include: NotificationSettingIncludeSchema.optional(),
    data: z.union([
        NotificationSettingCreateInputSchema,
        NotificationSettingUncheckedCreateInputSchema,
    ]),
})
    .strict();
export const NotificationSettingUpsertArgsSchema = z
    .object({
    select: NotificationSettingSelectSchema.optional(),
    include: NotificationSettingIncludeSchema.optional(),
    where: NotificationSettingWhereUniqueInputSchema,
    create: z.union([
        NotificationSettingCreateInputSchema,
        NotificationSettingUncheckedCreateInputSchema,
    ]),
    update: z.union([
        NotificationSettingUpdateInputSchema,
        NotificationSettingUncheckedUpdateInputSchema,
    ]),
})
    .strict();
export const NotificationSettingCreateManyArgsSchema = z
    .object({
    data: z.union([
        NotificationSettingCreateManyInputSchema,
        NotificationSettingCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const NotificationSettingCreateManyAndReturnArgsSchema = z
    .object({
    data: z.union([
        NotificationSettingCreateManyInputSchema,
        NotificationSettingCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
})
    .strict();
export const NotificationSettingDeleteArgsSchema = z
    .object({
    select: NotificationSettingSelectSchema.optional(),
    include: NotificationSettingIncludeSchema.optional(),
    where: NotificationSettingWhereUniqueInputSchema,
})
    .strict();
export const NotificationSettingUpdateArgsSchema = z
    .object({
    select: NotificationSettingSelectSchema.optional(),
    include: NotificationSettingIncludeSchema.optional(),
    data: z.union([
        NotificationSettingUpdateInputSchema,
        NotificationSettingUncheckedUpdateInputSchema,
    ]),
    where: NotificationSettingWhereUniqueInputSchema,
})
    .strict();
export const NotificationSettingUpdateManyArgsSchema = z
    .object({
    data: z.union([
        NotificationSettingUpdateManyMutationInputSchema,
        NotificationSettingUncheckedUpdateManyInputSchema,
    ]),
    where: NotificationSettingWhereInputSchema.optional(),
})
    .strict();
export const NotificationSettingDeleteManyArgsSchema = z
    .object({
    where: NotificationSettingWhereInputSchema.optional(),
})
    .strict();
