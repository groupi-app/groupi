import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput =
  | Prisma.JsonValue
  | null
  | 'JsonNull'
  | 'DbNull'
  | Prisma.NullTypes.DbNull
  | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform(v => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(
  () =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
      z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
      z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;

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
  .transform(value =>
    value === 'JsonNull'
      ? Prisma.JsonNull
      : value === 'DbNull'
        ? Prisma.DbNull
        : value
  );

export const QueryModeSchema = z.enum(['default', 'insensitive']);

export const NullsOrderSchema = z.enum(['first', 'last']);

export const JsonNullValueFilterSchema = z
  .enum(['DbNull', 'JsonNull', 'AnyNull'])
  .transform(value =>
    value === 'JsonNull'
      ? Prisma.JsonNull
      : value === 'DbNull'
        ? Prisma.JsonNull
        : value === 'AnyNull'
          ? Prisma.AnyNull
          : value
  );

export const StatusSchema = z.enum(['YES', 'MAYBE', 'NO', 'PENDING']);

export type StatusType = `${z.infer<typeof StatusSchema>}`;

export const RoleSchema = z.enum(['ORGANIZER', 'MODERATOR', 'ATTENDEE']);

export type RoleType = `${z.infer<typeof RoleSchema>}`;

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

export type NotificationTypeType = `${z.infer<typeof NotificationTypeSchema>}`;

export const NotificationMethodTypeSchema = z.enum([
  'EMAIL',
  'PUSH',
  'WEBHOOK',
]);

export type NotificationMethodTypeType =
  `${z.infer<typeof NotificationMethodTypeSchema>}`;

export const WebhookFormatSchema = z.enum([
  'DISCORD',
  'SLACK',
  'TEAMS',
  'GENERIC',
  'CUSTOM',
]);

export type WebhookFormatType = `${z.infer<typeof WebhookFormatSchema>}`;

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

export type Person = z.infer<typeof PersonSchema>;

// PERSON OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PersonOptionalDefaultsSchema = PersonSchema.merge(
  z.object({
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  })
);

export type PersonOptionalDefaults = z.infer<
  typeof PersonOptionalDefaultsSchema
>;

/////////////////////////////////////////
// PERSON SETTINGS SCHEMA
/////////////////////////////////////////

export const PersonSettingsSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  personId: z.string(),
});

export type PersonSettings = z.infer<typeof PersonSettingsSchema>;

// PERSON SETTINGS OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PersonSettingsOptionalDefaultsSchema = PersonSettingsSchema.merge(
  z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  })
);

export type PersonSettingsOptionalDefaults = z.infer<
  typeof PersonSettingsOptionalDefaultsSchema
>;

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

export type Event = z.infer<typeof EventSchema>;

// EVENT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const EventOptionalDefaultsSchema = EventSchema.merge(
  z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
  })
);

export type EventOptionalDefaults = z.infer<typeof EventOptionalDefaultsSchema>;

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

export type Membership = z.infer<typeof MembershipSchema>;

// MEMBERSHIP OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const MembershipOptionalDefaultsSchema = MembershipSchema.merge(
  z.object({
    role: RoleSchema.optional(),
    rsvpStatus: StatusSchema.optional(),
    id: z.string().cuid().optional(),
  })
);

export type MembershipOptionalDefaults = z.infer<
  typeof MembershipOptionalDefaultsSchema
>;

/////////////////////////////////////////
// POTENTIAL DATE TIME SCHEMA
/////////////////////////////////////////

export const PotentialDateTimeSchema = z.object({
  id: z.string().cuid(),
  eventId: z.string(),
  dateTime: z.coerce.date(),
});

export type PotentialDateTime = z.infer<typeof PotentialDateTimeSchema>;

// POTENTIAL DATE TIME OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PotentialDateTimeOptionalDefaultsSchema =
  PotentialDateTimeSchema.merge(
    z.object({
      id: z.string().cuid().optional(),
      dateTime: z.coerce.date().optional(),
    })
  );

export type PotentialDateTimeOptionalDefaults = z.infer<
  typeof PotentialDateTimeOptionalDefaultsSchema
>;

/////////////////////////////////////////
// AVAILABILITY SCHEMA
/////////////////////////////////////////

export const AvailabilitySchema = z.object({
  status: StatusSchema,
  membershipId: z.string(),
  potentialDateTimeId: z.string(),
});

export type Availability = z.infer<typeof AvailabilitySchema>;

// AVAILABILITY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AvailabilityOptionalDefaultsSchema = AvailabilitySchema.merge(
  z.object({})
);

export type AvailabilityOptionalDefaults = z.infer<
  typeof AvailabilityOptionalDefaultsSchema
>;

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

export type Post = z.infer<typeof PostSchema>;

// POST OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PostOptionalDefaultsSchema = PostSchema.merge(
  z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    editedAt: z.coerce.date().optional(),
  })
);

export type PostOptionalDefaults = z.infer<typeof PostOptionalDefaultsSchema>;

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

export type Reply = z.infer<typeof ReplySchema>;

// REPLY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ReplyOptionalDefaultsSchema = ReplySchema.merge(
  z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  })
);

export type ReplyOptionalDefaults = z.infer<typeof ReplyOptionalDefaultsSchema>;

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

export type Invite = z.infer<typeof InviteSchema>;

// INVITE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const InviteOptionalDefaultsSchema = InviteSchema.merge(
  z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
  })
);

export type InviteOptionalDefaults = z.infer<
  typeof InviteOptionalDefaultsSchema
>;

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

export type Notification = z.infer<typeof NotificationSchema>;

// NOTIFICATION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const NotificationOptionalDefaultsSchema = NotificationSchema.merge(
  z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    read: z.boolean().optional(),
  })
);

export type NotificationOptionalDefaults = z.infer<
  typeof NotificationOptionalDefaultsSchema
>;

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

export type NotificationMethod = z.infer<typeof NotificationMethodSchema>;

// NOTIFICATION METHOD OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const NotificationMethodOptionalDefaultsSchema =
  NotificationMethodSchema.merge(
    z.object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      enabled: z.boolean().optional(),
    })
  );

export type NotificationMethodOptionalDefaults = z.infer<
  typeof NotificationMethodOptionalDefaultsSchema
>;

/////////////////////////////////////////
// NOTIFICATION SETTING SCHEMA
/////////////////////////////////////////

export const NotificationSettingSchema = z.object({
  notificationType: NotificationTypeSchema,
  id: z.string().cuid(),
  methodId: z.string(),
  enabled: z.boolean(),
});

export type NotificationSetting = z.infer<typeof NotificationSettingSchema>;

// NOTIFICATION SETTING OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const NotificationSettingOptionalDefaultsSchema =
  NotificationSettingSchema.merge(
    z.object({
      id: z.string().cuid().optional(),
      enabled: z.boolean().optional(),
    })
  );

export type NotificationSettingOptionalDefaults = z.infer<
  typeof NotificationSettingOptionalDefaultsSchema
>;

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// PERSON
//------------------------------------------------------

export const PersonIncludeSchema: z.ZodType<Prisma.PersonInclude> = z
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

export const PersonArgsSchema: z.ZodType<Prisma.PersonDefaultArgs> = z
  .object({
    select: z.lazy(() => PersonSelectSchema).optional(),
    include: z.lazy(() => PersonIncludeSchema).optional(),
  })
  .strict();

export const PersonCountOutputTypeArgsSchema: z.ZodType<Prisma.PersonCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => PersonCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const PersonCountOutputTypeSelectSchema: z.ZodType<Prisma.PersonCountOutputTypeSelect> =
  z
    .object({
      memberships: z.boolean().optional(),
      posts: z.boolean().optional(),
      replies: z.boolean().optional(),
      notifications: z.boolean().optional(),
      authoredNotifications: z.boolean().optional(),
    })
    .strict();

export const PersonSelectSchema: z.ZodType<Prisma.PersonSelect> = z
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

export const PersonSettingsIncludeSchema: z.ZodType<Prisma.PersonSettingsInclude> =
  z
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

export const PersonSettingsArgsSchema: z.ZodType<Prisma.PersonSettingsDefaultArgs> =
  z
    .object({
      select: z.lazy(() => PersonSettingsSelectSchema).optional(),
      include: z.lazy(() => PersonSettingsIncludeSchema).optional(),
    })
    .strict();

export const PersonSettingsCountOutputTypeArgsSchema: z.ZodType<Prisma.PersonSettingsCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => PersonSettingsCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const PersonSettingsCountOutputTypeSelectSchema: z.ZodType<Prisma.PersonSettingsCountOutputTypeSelect> =
  z
    .object({
      notificationMethods: z.boolean().optional(),
    })
    .strict();

export const PersonSettingsSelectSchema: z.ZodType<Prisma.PersonSettingsSelect> =
  z
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

export const EventIncludeSchema: z.ZodType<Prisma.EventInclude> = z
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

export const EventArgsSchema: z.ZodType<Prisma.EventDefaultArgs> = z
  .object({
    select: z.lazy(() => EventSelectSchema).optional(),
    include: z.lazy(() => EventIncludeSchema).optional(),
  })
  .strict();

export const EventCountOutputTypeArgsSchema: z.ZodType<Prisma.EventCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => EventCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const EventCountOutputTypeSelectSchema: z.ZodType<Prisma.EventCountOutputTypeSelect> =
  z
    .object({
      invites: z.boolean().optional(),
      potentialDateTimes: z.boolean().optional(),
      posts: z.boolean().optional(),
      memberships: z.boolean().optional(),
      notifications: z.boolean().optional(),
    })
    .strict();

export const EventSelectSchema: z.ZodType<Prisma.EventSelect> = z
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

export const MembershipIncludeSchema: z.ZodType<Prisma.MembershipInclude> = z
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

export const MembershipArgsSchema: z.ZodType<Prisma.MembershipDefaultArgs> = z
  .object({
    select: z.lazy(() => MembershipSelectSchema).optional(),
    include: z.lazy(() => MembershipIncludeSchema).optional(),
  })
  .strict();

export const MembershipCountOutputTypeArgsSchema: z.ZodType<Prisma.MembershipCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => MembershipCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const MembershipCountOutputTypeSelectSchema: z.ZodType<Prisma.MembershipCountOutputTypeSelect> =
  z
    .object({
      availabilities: z.boolean().optional(),
      invites: z.boolean().optional(),
    })
    .strict();

export const MembershipSelectSchema: z.ZodType<Prisma.MembershipSelect> = z
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

export const PotentialDateTimeIncludeSchema: z.ZodType<Prisma.PotentialDateTimeInclude> =
  z
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

export const PotentialDateTimeArgsSchema: z.ZodType<Prisma.PotentialDateTimeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => PotentialDateTimeSelectSchema).optional(),
      include: z.lazy(() => PotentialDateTimeIncludeSchema).optional(),
    })
    .strict();

export const PotentialDateTimeCountOutputTypeArgsSchema: z.ZodType<Prisma.PotentialDateTimeCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z
        .lazy(() => PotentialDateTimeCountOutputTypeSelectSchema)
        .nullish(),
    })
    .strict();

export const PotentialDateTimeCountOutputTypeSelectSchema: z.ZodType<Prisma.PotentialDateTimeCountOutputTypeSelect> =
  z
    .object({
      availabilities: z.boolean().optional(),
    })
    .strict();

export const PotentialDateTimeSelectSchema: z.ZodType<Prisma.PotentialDateTimeSelect> =
  z
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

export const AvailabilityIncludeSchema: z.ZodType<Prisma.AvailabilityInclude> =
  z
    .object({
      membership: z
        .union([z.boolean(), z.lazy(() => MembershipArgsSchema)])
        .optional(),
      potentialDateTime: z
        .union([z.boolean(), z.lazy(() => PotentialDateTimeArgsSchema)])
        .optional(),
    })
    .strict();

export const AvailabilityArgsSchema: z.ZodType<Prisma.AvailabilityDefaultArgs> =
  z
    .object({
      select: z.lazy(() => AvailabilitySelectSchema).optional(),
      include: z.lazy(() => AvailabilityIncludeSchema).optional(),
    })
    .strict();

export const AvailabilitySelectSchema: z.ZodType<Prisma.AvailabilitySelect> = z
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

export const PostIncludeSchema: z.ZodType<Prisma.PostInclude> = z
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

export const PostArgsSchema: z.ZodType<Prisma.PostDefaultArgs> = z
  .object({
    select: z.lazy(() => PostSelectSchema).optional(),
    include: z.lazy(() => PostIncludeSchema).optional(),
  })
  .strict();

export const PostCountOutputTypeArgsSchema: z.ZodType<Prisma.PostCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => PostCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const PostCountOutputTypeSelectSchema: z.ZodType<Prisma.PostCountOutputTypeSelect> =
  z
    .object({
      replies: z.boolean().optional(),
      notifications: z.boolean().optional(),
    })
    .strict();

export const PostSelectSchema: z.ZodType<Prisma.PostSelect> = z
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

export const ReplyIncludeSchema: z.ZodType<Prisma.ReplyInclude> = z
  .object({
    author: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
    post: z.union([z.boolean(), z.lazy(() => PostArgsSchema)]).optional(),
  })
  .strict();

export const ReplyArgsSchema: z.ZodType<Prisma.ReplyDefaultArgs> = z
  .object({
    select: z.lazy(() => ReplySelectSchema).optional(),
    include: z.lazy(() => ReplyIncludeSchema).optional(),
  })
  .strict();

export const ReplySelectSchema: z.ZodType<Prisma.ReplySelect> = z
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

export const InviteIncludeSchema: z.ZodType<Prisma.InviteInclude> = z
  .object({
    event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
    createdBy: z
      .union([z.boolean(), z.lazy(() => MembershipArgsSchema)])
      .optional(),
  })
  .strict();

export const InviteArgsSchema: z.ZodType<Prisma.InviteDefaultArgs> = z
  .object({
    select: z.lazy(() => InviteSelectSchema).optional(),
    include: z.lazy(() => InviteIncludeSchema).optional(),
  })
  .strict();

export const InviteSelectSchema: z.ZodType<Prisma.InviteSelect> = z
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

export const NotificationIncludeSchema: z.ZodType<Prisma.NotificationInclude> =
  z
    .object({
      person: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
      author: z.union([z.boolean(), z.lazy(() => PersonArgsSchema)]).optional(),
      event: z.union([z.boolean(), z.lazy(() => EventArgsSchema)]).optional(),
      post: z.union([z.boolean(), z.lazy(() => PostArgsSchema)]).optional(),
    })
    .strict();

export const NotificationArgsSchema: z.ZodType<Prisma.NotificationDefaultArgs> =
  z
    .object({
      select: z.lazy(() => NotificationSelectSchema).optional(),
      include: z.lazy(() => NotificationIncludeSchema).optional(),
    })
    .strict();

export const NotificationSelectSchema: z.ZodType<Prisma.NotificationSelect> = z
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

export const NotificationMethodIncludeSchema: z.ZodType<Prisma.NotificationMethodInclude> =
  z
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

export const NotificationMethodArgsSchema: z.ZodType<Prisma.NotificationMethodDefaultArgs> =
  z
    .object({
      select: z.lazy(() => NotificationMethodSelectSchema).optional(),
      include: z.lazy(() => NotificationMethodIncludeSchema).optional(),
    })
    .strict();

export const NotificationMethodCountOutputTypeArgsSchema: z.ZodType<Prisma.NotificationMethodCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z
        .lazy(() => NotificationMethodCountOutputTypeSelectSchema)
        .nullish(),
    })
    .strict();

export const NotificationMethodCountOutputTypeSelectSchema: z.ZodType<Prisma.NotificationMethodCountOutputTypeSelect> =
  z
    .object({
      notifications: z.boolean().optional(),
    })
    .strict();

export const NotificationMethodSelectSchema: z.ZodType<Prisma.NotificationMethodSelect> =
  z
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

export const NotificationSettingIncludeSchema: z.ZodType<Prisma.NotificationSettingInclude> =
  z
    .object({
      notificationMethod: z
        .union([z.boolean(), z.lazy(() => NotificationMethodArgsSchema)])
        .optional(),
    })
    .strict();

export const NotificationSettingArgsSchema: z.ZodType<Prisma.NotificationSettingDefaultArgs> =
  z
    .object({
      select: z.lazy(() => NotificationSettingSelectSchema).optional(),
      include: z.lazy(() => NotificationSettingIncludeSchema).optional(),
    })
    .strict();

export const NotificationSettingSelectSchema: z.ZodType<Prisma.NotificationSettingSelect> =
  z
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

export const PersonWhereInputSchema: z.ZodType<Prisma.PersonWhereInput> = z
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

export const PersonOrderByWithRelationInputSchema: z.ZodType<Prisma.PersonOrderByWithRelationInput> =
  z
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

export const PersonWhereUniqueInputSchema: z.ZodType<Prisma.PersonWhereUniqueInput> =
  z
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
    .and(
      z
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
        .strict()
    );

export const PersonOrderByWithAggregationInputSchema: z.ZodType<Prisma.PersonOrderByWithAggregationInput> =
  z
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

export const PersonScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PersonScalarWhereWithAggregatesInput> =
  z
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

export const PersonSettingsWhereInputSchema: z.ZodType<Prisma.PersonSettingsWhereInput> =
  z
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

export const PersonSettingsOrderByWithRelationInputSchema: z.ZodType<Prisma.PersonSettingsOrderByWithRelationInput> =
  z
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

export const PersonSettingsWhereUniqueInputSchema: z.ZodType<Prisma.PersonSettingsWhereUniqueInput> =
  z
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
    .and(
      z
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
        .strict()
    );

export const PersonSettingsOrderByWithAggregationInputSchema: z.ZodType<Prisma.PersonSettingsOrderByWithAggregationInput> =
  z
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

export const PersonSettingsScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PersonSettingsScalarWhereWithAggregatesInput> =
  z
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

export const EventWhereInputSchema: z.ZodType<Prisma.EventWhereInput> = z
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

export const EventOrderByWithRelationInputSchema: z.ZodType<Prisma.EventOrderByWithRelationInput> =
  z
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

export const EventWhereUniqueInputSchema: z.ZodType<Prisma.EventWhereUniqueInput> =
  z
    .object({
      id: z.string().cuid(),
    })
    .and(
      z
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
        .strict()
    );

export const EventOrderByWithAggregationInputSchema: z.ZodType<Prisma.EventOrderByWithAggregationInput> =
  z
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

export const EventScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.EventScalarWhereWithAggregatesInput> =
  z
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

export const MembershipWhereInputSchema: z.ZodType<Prisma.MembershipWhereInput> =
  z
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

export const MembershipOrderByWithRelationInputSchema: z.ZodType<Prisma.MembershipOrderByWithRelationInput> =
  z
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

export const MembershipWhereUniqueInputSchema: z.ZodType<Prisma.MembershipWhereUniqueInput> =
  z
    .object({
      id: z.string().cuid(),
    })
    .and(
      z
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
        .strict()
    );

export const MembershipOrderByWithAggregationInputSchema: z.ZodType<Prisma.MembershipOrderByWithAggregationInput> =
  z
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

export const MembershipScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.MembershipScalarWhereWithAggregatesInput> =
  z
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

export const PotentialDateTimeWhereInputSchema: z.ZodType<Prisma.PotentialDateTimeWhereInput> =
  z
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

export const PotentialDateTimeOrderByWithRelationInputSchema: z.ZodType<Prisma.PotentialDateTimeOrderByWithRelationInput> =
  z
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

export const PotentialDateTimeWhereUniqueInputSchema: z.ZodType<Prisma.PotentialDateTimeWhereUniqueInput> =
  z
    .object({
      id: z.string().cuid(),
    })
    .and(
      z
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
        .strict()
    );

export const PotentialDateTimeOrderByWithAggregationInputSchema: z.ZodType<Prisma.PotentialDateTimeOrderByWithAggregationInput> =
  z
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

export const PotentialDateTimeScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PotentialDateTimeScalarWhereWithAggregatesInput> =
  z
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

export const AvailabilityWhereInputSchema: z.ZodType<Prisma.AvailabilityWhereInput> =
  z
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

export const AvailabilityOrderByWithRelationInputSchema: z.ZodType<Prisma.AvailabilityOrderByWithRelationInput> =
  z
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

export const AvailabilityWhereUniqueInputSchema: z.ZodType<Prisma.AvailabilityWhereUniqueInput> =
  z
    .object({
      id: z.lazy(() => AvailabilityIdCompoundUniqueInputSchema),
    })
    .and(
      z
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
        .strict()
    );

export const AvailabilityOrderByWithAggregationInputSchema: z.ZodType<Prisma.AvailabilityOrderByWithAggregationInput> =
  z
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

export const AvailabilityScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AvailabilityScalarWhereWithAggregatesInput> =
  z
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

export const PostWhereInputSchema: z.ZodType<Prisma.PostWhereInput> = z
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

export const PostOrderByWithRelationInputSchema: z.ZodType<Prisma.PostOrderByWithRelationInput> =
  z
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

export const PostWhereUniqueInputSchema: z.ZodType<Prisma.PostWhereUniqueInput> =
  z
    .object({
      id: z.string().cuid(),
    })
    .and(
      z
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
        .strict()
    );

export const PostOrderByWithAggregationInputSchema: z.ZodType<Prisma.PostOrderByWithAggregationInput> =
  z
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

export const PostScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PostScalarWhereWithAggregatesInput> =
  z
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

export const ReplyWhereInputSchema: z.ZodType<Prisma.ReplyWhereInput> = z
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

export const ReplyOrderByWithRelationInputSchema: z.ZodType<Prisma.ReplyOrderByWithRelationInput> =
  z
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

export const ReplyWhereUniqueInputSchema: z.ZodType<Prisma.ReplyWhereUniqueInput> =
  z
    .object({
      id: z.string().cuid(),
    })
    .and(
      z
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
        .strict()
    );

export const ReplyOrderByWithAggregationInputSchema: z.ZodType<Prisma.ReplyOrderByWithAggregationInput> =
  z
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

export const ReplyScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ReplyScalarWhereWithAggregatesInput> =
  z
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

export const InviteWhereInputSchema: z.ZodType<Prisma.InviteWhereInput> = z
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

export const InviteOrderByWithRelationInputSchema: z.ZodType<Prisma.InviteOrderByWithRelationInput> =
  z
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

export const InviteWhereUniqueInputSchema: z.ZodType<Prisma.InviteWhereUniqueInput> =
  z
    .object({
      id: z.string().cuid(),
    })
    .and(
      z
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
        .strict()
    );

export const InviteOrderByWithAggregationInputSchema: z.ZodType<Prisma.InviteOrderByWithAggregationInput> =
  z
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

export const InviteScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.InviteScalarWhereWithAggregatesInput> =
  z
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

export const NotificationWhereInputSchema: z.ZodType<Prisma.NotificationWhereInput> =
  z
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

export const NotificationOrderByWithRelationInputSchema: z.ZodType<Prisma.NotificationOrderByWithRelationInput> =
  z
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

export const NotificationWhereUniqueInputSchema: z.ZodType<Prisma.NotificationWhereUniqueInput> =
  z
    .object({
      id: z.string().cuid(),
    })
    .and(
      z
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
        .strict()
    );

export const NotificationOrderByWithAggregationInputSchema: z.ZodType<Prisma.NotificationOrderByWithAggregationInput> =
  z
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

export const NotificationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.NotificationScalarWhereWithAggregatesInput> =
  z
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

export const NotificationMethodWhereInputSchema: z.ZodType<Prisma.NotificationMethodWhereInput> =
  z
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

export const NotificationMethodOrderByWithRelationInputSchema: z.ZodType<Prisma.NotificationMethodOrderByWithRelationInput> =
  z
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

export const NotificationMethodWhereUniqueInputSchema: z.ZodType<Prisma.NotificationMethodWhereUniqueInput> =
  z
    .object({
      id: z.string().cuid(),
    })
    .and(
      z
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
        .strict()
    );

export const NotificationMethodOrderByWithAggregationInputSchema: z.ZodType<Prisma.NotificationMethodOrderByWithAggregationInput> =
  z
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

export const NotificationMethodScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.NotificationMethodScalarWhereWithAggregatesInput> =
  z
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

export const NotificationSettingWhereInputSchema: z.ZodType<Prisma.NotificationSettingWhereInput> =
  z
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

export const NotificationSettingOrderByWithRelationInputSchema: z.ZodType<Prisma.NotificationSettingOrderByWithRelationInput> =
  z
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

export const NotificationSettingWhereUniqueInputSchema: z.ZodType<Prisma.NotificationSettingWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string().cuid(),
        notificationType_methodId: z.lazy(
          () =>
            NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema
        ),
      }),
      z.object({
        id: z.string().cuid(),
      }),
      z.object({
        notificationType_methodId: z.lazy(
          () =>
            NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema
        ),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().cuid().optional(),
          notificationType_methodId: z
            .lazy(
              () =>
                NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema
            )
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
        .strict()
    );

export const NotificationSettingOrderByWithAggregationInputSchema: z.ZodType<Prisma.NotificationSettingOrderByWithAggregationInput> =
  z
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

export const NotificationSettingScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.NotificationSettingScalarWhereWithAggregatesInput> =
  z
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

export const PersonCreateInputSchema: z.ZodType<Prisma.PersonCreateInput> = z
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

export const PersonUncheckedCreateInputSchema: z.ZodType<Prisma.PersonUncheckedCreateInput> =
  z
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
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema
        )
        .optional(),
      authoredNotifications: z
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonUpdateInputSchema: z.ZodType<Prisma.PersonUpdateInput> = z
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

export const PersonUncheckedUpdateInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateInput> =
  z
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
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema
        )
        .optional(),
      authoredNotifications: z
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonCreateManyInputSchema: z.ZodType<Prisma.PersonCreateManyInput> =
  z
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

export const PersonUpdateManyMutationInputSchema: z.ZodType<Prisma.PersonUpdateManyMutationInput> =
  z
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

export const PersonUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateManyInput> =
  z
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

export const PersonSettingsCreateInputSchema: z.ZodType<Prisma.PersonSettingsCreateInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      person: z.lazy(() => PersonCreateNestedOneWithoutSettingsInputSchema),
      notificationMethods: z
        .lazy(
          () => NotificationMethodCreateNestedManyWithoutSettingsInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonSettingsUncheckedCreateInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedCreateInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      personId: z.string(),
      notificationMethods: z
        .lazy(
          () =>
            NotificationMethodUncheckedCreateNestedManyWithoutSettingsInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonSettingsUpdateInputSchema: z.ZodType<Prisma.PersonSettingsUpdateInput> =
  z
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
        .lazy(
          () => NotificationMethodUpdateManyWithoutSettingsNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonSettingsUncheckedUpdateInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedUpdateInput> =
  z
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
        .lazy(
          () =>
            NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonSettingsCreateManyInputSchema: z.ZodType<Prisma.PersonSettingsCreateManyInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      personId: z.string(),
    })
    .strict();

export const PersonSettingsUpdateManyMutationInputSchema: z.ZodType<Prisma.PersonSettingsUpdateManyMutationInput> =
  z
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

export const PersonSettingsUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedUpdateManyInput> =
  z
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

export const EventCreateInputSchema: z.ZodType<Prisma.EventCreateInput> = z
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

export const EventUncheckedCreateInputSchema: z.ZodType<Prisma.EventUncheckedCreateInput> =
  z
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
        .lazy(
          () =>
            PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema
        )
        .optional(),
      posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
      memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
      notifications: z
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutEventInputSchema
        )
        .optional(),
    })
    .strict();

export const EventUpdateInputSchema: z.ZodType<Prisma.EventUpdateInput> = z
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

export const EventUncheckedUpdateInputSchema: z.ZodType<Prisma.EventUncheckedUpdateInput> =
  z
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
        .lazy(
          () =>
            PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema
        )
        .optional(),
      posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
      memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
      notifications: z
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const EventCreateManyInputSchema: z.ZodType<Prisma.EventCreateManyInput> =
  z
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

export const EventUpdateManyMutationInputSchema: z.ZodType<Prisma.EventUpdateManyMutationInput> =
  z
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

export const EventUncheckedUpdateManyInputSchema: z.ZodType<Prisma.EventUncheckedUpdateManyInput> =
  z
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

export const MembershipCreateInputSchema: z.ZodType<Prisma.MembershipCreateInput> =
  z
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

export const MembershipUncheckedCreateInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      personId: z.string(),
      eventId: z.string(),
      role: z.lazy(() => RoleSchema).optional(),
      rsvpStatus: z.lazy(() => StatusSchema).optional(),
      availabilities: z
        .lazy(
          () =>
            AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema
        )
        .optional(),
      invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
    })
    .strict();

export const MembershipUpdateInputSchema: z.ZodType<Prisma.MembershipUpdateInput> =
  z
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

export const MembershipUncheckedUpdateInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateInput> =
  z
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
        .lazy(
          () =>
            AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema
        )
        .optional(),
      invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
    })
    .strict();

export const MembershipCreateManyInputSchema: z.ZodType<Prisma.MembershipCreateManyInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      personId: z.string(),
      eventId: z.string(),
      role: z.lazy(() => RoleSchema).optional(),
      rsvpStatus: z.lazy(() => StatusSchema).optional(),
    })
    .strict();

export const MembershipUpdateManyMutationInputSchema: z.ZodType<Prisma.MembershipUpdateManyMutationInput> =
  z
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

export const MembershipUncheckedUpdateManyInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateManyInput> =
  z
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

export const PotentialDateTimeCreateInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      dateTime: z.coerce.date().optional(),
      event: z.lazy(
        () => EventCreateNestedOneWithoutPotentialDateTimesInputSchema
      ),
      availabilities: z
        .lazy(
          () => AvailabilityCreateNestedManyWithoutPotentialDateTimeInputSchema
        )
        .optional(),
    })
    .strict();

export const PotentialDateTimeUncheckedCreateInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedCreateInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      eventId: z.string(),
      dateTime: z.coerce.date().optional(),
      availabilities: z
        .lazy(
          () =>
            AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInputSchema
        )
        .optional(),
    })
    .strict();

export const PotentialDateTimeUpdateInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateInput> =
  z
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
        .lazy(
          () => EventUpdateOneRequiredWithoutPotentialDateTimesNestedInputSchema
        )
        .optional(),
      availabilities: z
        .lazy(
          () => AvailabilityUpdateManyWithoutPotentialDateTimeNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PotentialDateTimeUncheckedUpdateInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateInput> =
  z
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
        .lazy(
          () =>
            AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PotentialDateTimeCreateManyInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateManyInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      eventId: z.string(),
      dateTime: z.coerce.date().optional(),
    })
    .strict();

export const PotentialDateTimeUpdateManyMutationInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateManyMutationInput> =
  z
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

export const PotentialDateTimeUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateManyInput> =
  z
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

export const AvailabilityCreateInputSchema: z.ZodType<Prisma.AvailabilityCreateInput> =
  z
    .object({
      status: z.lazy(() => StatusSchema),
      membership: z.lazy(
        () => MembershipCreateNestedOneWithoutAvailabilitiesInputSchema
      ),
      potentialDateTime: z.lazy(
        () => PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInputSchema
      ),
    })
    .strict();

export const AvailabilityUncheckedCreateInputSchema: z.ZodType<Prisma.AvailabilityUncheckedCreateInput> =
  z
    .object({
      membershipId: z.string(),
      potentialDateTimeId: z.string(),
      status: z.lazy(() => StatusSchema),
    })
    .strict();

export const AvailabilityUpdateInputSchema: z.ZodType<Prisma.AvailabilityUpdateInput> =
  z
    .object({
      status: z
        .union([
          z.lazy(() => StatusSchema),
          z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      membership: z
        .lazy(
          () =>
            MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema
        )
        .optional(),
      potentialDateTime: z
        .lazy(
          () =>
            PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const AvailabilityUncheckedUpdateInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateInput> =
  z
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

export const AvailabilityCreateManyInputSchema: z.ZodType<Prisma.AvailabilityCreateManyInput> =
  z
    .object({
      membershipId: z.string(),
      potentialDateTimeId: z.string(),
      status: z.lazy(() => StatusSchema),
    })
    .strict();

export const AvailabilityUpdateManyMutationInputSchema: z.ZodType<Prisma.AvailabilityUpdateManyMutationInput> =
  z
    .object({
      status: z
        .union([
          z.lazy(() => StatusSchema),
          z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const AvailabilityUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateManyInput> =
  z
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

export const PostCreateInputSchema: z.ZodType<Prisma.PostCreateInput> = z
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

export const PostUncheckedCreateInputSchema: z.ZodType<Prisma.PostUncheckedCreateInput> =
  z
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

export const PostUpdateInputSchema: z.ZodType<Prisma.PostUpdateInput> = z
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

export const PostUncheckedUpdateInputSchema: z.ZodType<Prisma.PostUncheckedUpdateInput> =
  z
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

export const PostCreateManyInputSchema: z.ZodType<Prisma.PostCreateManyInput> =
  z
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

export const PostUpdateManyMutationInputSchema: z.ZodType<Prisma.PostUpdateManyMutationInput> =
  z
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

export const PostUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyInput> =
  z
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

export const ReplyCreateInputSchema: z.ZodType<Prisma.ReplyCreateInput> = z
  .object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    text: z.string(),
    author: z.lazy(() => PersonCreateNestedOneWithoutRepliesInputSchema),
    post: z.lazy(() => PostCreateNestedOneWithoutRepliesInputSchema),
  })
  .strict();

export const ReplyUncheckedCreateInputSchema: z.ZodType<Prisma.ReplyUncheckedCreateInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      authorId: z.string(),
      postId: z.string(),
      text: z.string(),
    })
    .strict();

export const ReplyUpdateInputSchema: z.ZodType<Prisma.ReplyUpdateInput> = z
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

export const ReplyUncheckedUpdateInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateInput> =
  z
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

export const ReplyCreateManyInputSchema: z.ZodType<Prisma.ReplyCreateManyInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      authorId: z.string(),
      postId: z.string(),
      text: z.string(),
    })
    .strict();

export const ReplyUpdateManyMutationInputSchema: z.ZodType<Prisma.ReplyUpdateManyMutationInput> =
  z
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

export const ReplyUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateManyInput> =
  z
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

export const InviteCreateInputSchema: z.ZodType<Prisma.InviteCreateInput> = z
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

export const InviteUncheckedCreateInputSchema: z.ZodType<Prisma.InviteUncheckedCreateInput> =
  z
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

export const InviteUpdateInputSchema: z.ZodType<Prisma.InviteUpdateInput> = z
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

export const InviteUncheckedUpdateInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateInput> =
  z
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

export const InviteCreateManyInputSchema: z.ZodType<Prisma.InviteCreateManyInput> =
  z
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

export const InviteUpdateManyMutationInputSchema: z.ZodType<Prisma.InviteUpdateManyMutationInput> =
  z
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

export const InviteUncheckedUpdateManyInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateManyInput> =
  z
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

export const NotificationCreateInputSchema: z.ZodType<Prisma.NotificationCreateInput> =
  z
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
      person: z.lazy(
        () => PersonCreateNestedOneWithoutNotificationsInputSchema
      ),
      author: z
        .lazy(
          () => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema
        )
        .optional(),
      event: z
        .lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
      post: z
        .lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
    })
    .strict();

export const NotificationUncheckedCreateInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateInput> =
  z
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

export const NotificationUpdateInputSchema: z.ZodType<Prisma.NotificationUpdateInput> =
  z
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
        .lazy(
          () => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema
        )
        .optional(),
      author: z
        .lazy(
          () => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema
        )
        .optional(),
      event: z
        .lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
      post: z
        .lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
    })
    .strict();

export const NotificationUncheckedUpdateInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateInput> =
  z
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

export const NotificationCreateManyInputSchema: z.ZodType<Prisma.NotificationCreateManyInput> =
  z
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

export const NotificationUpdateManyMutationInputSchema: z.ZodType<Prisma.NotificationUpdateManyMutationInput> =
  z
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

export const NotificationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyInput> =
  z
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

export const NotificationMethodCreateInputSchema: z.ZodType<Prisma.NotificationMethodCreateInput> =
  z
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
      settings: z.lazy(
        () => PersonSettingsCreateNestedOneWithoutNotificationMethodsInputSchema
      ),
      notifications: z
        .lazy(
          () =>
            NotificationSettingCreateNestedManyWithoutNotificationMethodInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationMethodUncheckedCreateInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedCreateInput> =
  z
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
        .lazy(
          () =>
            NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationMethodUpdateInputSchema: z.ZodType<Prisma.NotificationMethodUpdateInput> =
  z
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
          z.lazy(
            () => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema
          ),
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
          z.lazy(
            () => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema
          ),
        ])
        .optional()
        .nullable(),
      settings: z
        .lazy(
          () =>
            PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInputSchema
        )
        .optional(),
      notifications: z
        .lazy(
          () =>
            NotificationSettingUpdateManyWithoutNotificationMethodNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationMethodUncheckedUpdateInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateInput> =
  z
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
          z.lazy(
            () => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema
          ),
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
          z.lazy(
            () => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema
          ),
        ])
        .optional()
        .nullable(),
      notifications: z
        .lazy(
          () =>
            NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationMethodCreateManyInputSchema: z.ZodType<Prisma.NotificationMethodCreateManyInput> =
  z
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

export const NotificationMethodUpdateManyMutationInputSchema: z.ZodType<Prisma.NotificationMethodUpdateManyMutationInput> =
  z
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
          z.lazy(
            () => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema
          ),
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
          z.lazy(
            () => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema
          ),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const NotificationMethodUncheckedUpdateManyInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateManyInput> =
  z
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
          z.lazy(
            () => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema
          ),
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
          z.lazy(
            () => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema
          ),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const NotificationSettingCreateInputSchema: z.ZodType<Prisma.NotificationSettingCreateInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      notificationType: z.lazy(() => NotificationTypeSchema),
      enabled: z.boolean().optional(),
      notificationMethod: z.lazy(
        () => NotificationMethodCreateNestedOneWithoutNotificationsInputSchema
      ),
    })
    .strict();

export const NotificationSettingUncheckedCreateInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedCreateInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      notificationType: z.lazy(() => NotificationTypeSchema),
      methodId: z.string(),
      enabled: z.boolean().optional(),
    })
    .strict();

export const NotificationSettingUpdateInputSchema: z.ZodType<Prisma.NotificationSettingUpdateInput> =
  z
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
        .lazy(
          () =>
            NotificationMethodUpdateOneRequiredWithoutNotificationsNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationSettingUncheckedUpdateInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedUpdateInput> =
  z
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

export const NotificationSettingCreateManyInputSchema: z.ZodType<Prisma.NotificationSettingCreateManyInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      notificationType: z.lazy(() => NotificationTypeSchema),
      methodId: z.string(),
      enabled: z.boolean().optional(),
    })
    .strict();

export const NotificationSettingUpdateManyMutationInputSchema: z.ZodType<Prisma.NotificationSettingUpdateManyMutationInput> =
  z
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

export const NotificationSettingUncheckedUpdateManyInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedUpdateManyInput> =
  z
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

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z
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

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z
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

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> =
  z
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

export const MembershipListRelationFilterSchema: z.ZodType<Prisma.MembershipListRelationFilter> =
  z
    .object({
      every: z.lazy(() => MembershipWhereInputSchema).optional(),
      some: z.lazy(() => MembershipWhereInputSchema).optional(),
      none: z.lazy(() => MembershipWhereInputSchema).optional(),
    })
    .strict();

export const PostListRelationFilterSchema: z.ZodType<Prisma.PostListRelationFilter> =
  z
    .object({
      every: z.lazy(() => PostWhereInputSchema).optional(),
      some: z.lazy(() => PostWhereInputSchema).optional(),
      none: z.lazy(() => PostWhereInputSchema).optional(),
    })
    .strict();

export const ReplyListRelationFilterSchema: z.ZodType<Prisma.ReplyListRelationFilter> =
  z
    .object({
      every: z.lazy(() => ReplyWhereInputSchema).optional(),
      some: z.lazy(() => ReplyWhereInputSchema).optional(),
      none: z.lazy(() => ReplyWhereInputSchema).optional(),
    })
    .strict();

export const NotificationListRelationFilterSchema: z.ZodType<Prisma.NotificationListRelationFilter> =
  z
    .object({
      every: z.lazy(() => NotificationWhereInputSchema).optional(),
      some: z.lazy(() => NotificationWhereInputSchema).optional(),
      none: z.lazy(() => NotificationWhereInputSchema).optional(),
    })
    .strict();

export const PersonSettingsNullableRelationFilterSchema: z.ZodType<Prisma.PersonSettingsNullableRelationFilter> =
  z
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

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z
  .object({
    sort: z.lazy(() => SortOrderSchema),
    nulls: z.lazy(() => NullsOrderSchema).optional(),
  })
  .strict();

export const MembershipOrderByRelationAggregateInputSchema: z.ZodType<Prisma.MembershipOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PostOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PostOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const ReplyOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ReplyOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const NotificationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.NotificationOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PersonCountOrderByAggregateInputSchema: z.ZodType<Prisma.PersonCountOrderByAggregateInput> =
  z
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

export const PersonMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PersonMaxOrderByAggregateInput> =
  z
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

export const PersonMinOrderByAggregateInputSchema: z.ZodType<Prisma.PersonMinOrderByAggregateInput> =
  z
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

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> =
  z
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

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> =
  z
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

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> =
  z
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

export const PersonRelationFilterSchema: z.ZodType<Prisma.PersonRelationFilter> =
  z
    .object({
      is: z.lazy(() => PersonWhereInputSchema).optional(),
      isNot: z.lazy(() => PersonWhereInputSchema).optional(),
    })
    .strict();

export const NotificationMethodListRelationFilterSchema: z.ZodType<Prisma.NotificationMethodListRelationFilter> =
  z
    .object({
      every: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
      some: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
      none: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
    })
    .strict();

export const NotificationMethodOrderByRelationAggregateInputSchema: z.ZodType<Prisma.NotificationMethodOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PersonSettingsCountOrderByAggregateInputSchema: z.ZodType<Prisma.PersonSettingsCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      personId: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PersonSettingsMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PersonSettingsMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      personId: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PersonSettingsMinOrderByAggregateInputSchema: z.ZodType<Prisma.PersonSettingsMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      personId: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> =
  z
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

export const InviteListRelationFilterSchema: z.ZodType<Prisma.InviteListRelationFilter> =
  z
    .object({
      every: z.lazy(() => InviteWhereInputSchema).optional(),
      some: z.lazy(() => InviteWhereInputSchema).optional(),
      none: z.lazy(() => InviteWhereInputSchema).optional(),
    })
    .strict();

export const PotentialDateTimeListRelationFilterSchema: z.ZodType<Prisma.PotentialDateTimeListRelationFilter> =
  z
    .object({
      every: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
      some: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
      none: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
    })
    .strict();

export const InviteOrderByRelationAggregateInputSchema: z.ZodType<Prisma.InviteOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PotentialDateTimeOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PotentialDateTimeOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const EventCountOrderByAggregateInputSchema: z.ZodType<Prisma.EventCountOrderByAggregateInput> =
  z
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

export const EventMaxOrderByAggregateInputSchema: z.ZodType<Prisma.EventMaxOrderByAggregateInput> =
  z
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

export const EventMinOrderByAggregateInputSchema: z.ZodType<Prisma.EventMinOrderByAggregateInput> =
  z
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

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> =
  z
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

export const EnumRoleFilterSchema: z.ZodType<Prisma.EnumRoleFilter> = z
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

export const EnumStatusFilterSchema: z.ZodType<Prisma.EnumStatusFilter> = z
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

export const EventRelationFilterSchema: z.ZodType<Prisma.EventRelationFilter> =
  z
    .object({
      is: z.lazy(() => EventWhereInputSchema).optional(),
      isNot: z.lazy(() => EventWhereInputSchema).optional(),
    })
    .strict();

export const AvailabilityListRelationFilterSchema: z.ZodType<Prisma.AvailabilityListRelationFilter> =
  z
    .object({
      every: z.lazy(() => AvailabilityWhereInputSchema).optional(),
      some: z.lazy(() => AvailabilityWhereInputSchema).optional(),
      none: z.lazy(() => AvailabilityWhereInputSchema).optional(),
    })
    .strict();

export const AvailabilityOrderByRelationAggregateInputSchema: z.ZodType<Prisma.AvailabilityOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const MembershipCountOrderByAggregateInputSchema: z.ZodType<Prisma.MembershipCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      personId: z.lazy(() => SortOrderSchema).optional(),
      eventId: z.lazy(() => SortOrderSchema).optional(),
      role: z.lazy(() => SortOrderSchema).optional(),
      rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const MembershipMaxOrderByAggregateInputSchema: z.ZodType<Prisma.MembershipMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      personId: z.lazy(() => SortOrderSchema).optional(),
      eventId: z.lazy(() => SortOrderSchema).optional(),
      role: z.lazy(() => SortOrderSchema).optional(),
      rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const MembershipMinOrderByAggregateInputSchema: z.ZodType<Prisma.MembershipMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      personId: z.lazy(() => SortOrderSchema).optional(),
      eventId: z.lazy(() => SortOrderSchema).optional(),
      role: z.lazy(() => SortOrderSchema).optional(),
      rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const EnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.EnumRoleWithAggregatesFilter> =
  z
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

export const EnumStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumStatusWithAggregatesFilter> =
  z
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

export const PotentialDateTimeCountOrderByAggregateInputSchema: z.ZodType<Prisma.PotentialDateTimeCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      eventId: z.lazy(() => SortOrderSchema).optional(),
      dateTime: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PotentialDateTimeMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PotentialDateTimeMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      eventId: z.lazy(() => SortOrderSchema).optional(),
      dateTime: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PotentialDateTimeMinOrderByAggregateInputSchema: z.ZodType<Prisma.PotentialDateTimeMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      eventId: z.lazy(() => SortOrderSchema).optional(),
      dateTime: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const MembershipRelationFilterSchema: z.ZodType<Prisma.MembershipRelationFilter> =
  z
    .object({
      is: z.lazy(() => MembershipWhereInputSchema).optional(),
      isNot: z.lazy(() => MembershipWhereInputSchema).optional(),
    })
    .strict();

export const PotentialDateTimeRelationFilterSchema: z.ZodType<Prisma.PotentialDateTimeRelationFilter> =
  z
    .object({
      is: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
      isNot: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
    })
    .strict();

export const AvailabilityIdCompoundUniqueInputSchema: z.ZodType<Prisma.AvailabilityIdCompoundUniqueInput> =
  z
    .object({
      membershipId: z.string(),
      potentialDateTimeId: z.string(),
    })
    .strict();

export const AvailabilityCountOrderByAggregateInputSchema: z.ZodType<Prisma.AvailabilityCountOrderByAggregateInput> =
  z
    .object({
      membershipId: z.lazy(() => SortOrderSchema).optional(),
      potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
      status: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const AvailabilityMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AvailabilityMaxOrderByAggregateInput> =
  z
    .object({
      membershipId: z.lazy(() => SortOrderSchema).optional(),
      potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
      status: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const AvailabilityMinOrderByAggregateInputSchema: z.ZodType<Prisma.AvailabilityMinOrderByAggregateInput> =
  z
    .object({
      membershipId: z.lazy(() => SortOrderSchema).optional(),
      potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
      status: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PostCountOrderByAggregateInputSchema: z.ZodType<Prisma.PostCountOrderByAggregateInput> =
  z
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

export const PostMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PostMaxOrderByAggregateInput> =
  z
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

export const PostMinOrderByAggregateInputSchema: z.ZodType<Prisma.PostMinOrderByAggregateInput> =
  z
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

export const PostRelationFilterSchema: z.ZodType<Prisma.PostRelationFilter> = z
  .object({
    is: z.lazy(() => PostWhereInputSchema).optional(),
    isNot: z.lazy(() => PostWhereInputSchema).optional(),
  })
  .strict();

export const ReplyCountOrderByAggregateInputSchema: z.ZodType<Prisma.ReplyCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      authorId: z.lazy(() => SortOrderSchema).optional(),
      postId: z.lazy(() => SortOrderSchema).optional(),
      text: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const ReplyMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ReplyMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      authorId: z.lazy(() => SortOrderSchema).optional(),
      postId: z.lazy(() => SortOrderSchema).optional(),
      text: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const ReplyMinOrderByAggregateInputSchema: z.ZodType<Prisma.ReplyMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      authorId: z.lazy(() => SortOrderSchema).optional(),
      postId: z.lazy(() => SortOrderSchema).optional(),
      text: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z
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

export const InviteCountOrderByAggregateInputSchema: z.ZodType<Prisma.InviteCountOrderByAggregateInput> =
  z
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

export const InviteAvgOrderByAggregateInputSchema: z.ZodType<Prisma.InviteAvgOrderByAggregateInput> =
  z
    .object({
      usesRemaining: z.lazy(() => SortOrderSchema).optional(),
      maxUses: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const InviteMaxOrderByAggregateInputSchema: z.ZodType<Prisma.InviteMaxOrderByAggregateInput> =
  z
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

export const InviteMinOrderByAggregateInputSchema: z.ZodType<Prisma.InviteMinOrderByAggregateInput> =
  z
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

export const InviteSumOrderByAggregateInputSchema: z.ZodType<Prisma.InviteSumOrderByAggregateInput> =
  z
    .object({
      usesRemaining: z.lazy(() => SortOrderSchema).optional(),
      maxUses: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> =
  z
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

export const EnumNotificationTypeFilterSchema: z.ZodType<Prisma.EnumNotificationTypeFilter> =
  z
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

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z
  .object({
    equals: z.boolean().optional(),
    not: z
      .union([z.boolean(), z.lazy(() => NestedBoolFilterSchema)])
      .optional(),
  })
  .strict();

export const EnumStatusNullableFilterSchema: z.ZodType<Prisma.EnumStatusNullableFilter> =
  z
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

export const PersonNullableRelationFilterSchema: z.ZodType<Prisma.PersonNullableRelationFilter> =
  z
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

export const EventNullableRelationFilterSchema: z.ZodType<Prisma.EventNullableRelationFilter> =
  z
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

export const PostNullableRelationFilterSchema: z.ZodType<Prisma.PostNullableRelationFilter> =
  z
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

export const NotificationCountOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationCountOrderByAggregateInput> =
  z
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

export const NotificationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMaxOrderByAggregateInput> =
  z
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

export const NotificationMinOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMinOrderByAggregateInput> =
  z
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

export const EnumNotificationTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumNotificationTypeWithAggregatesFilter> =
  z
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

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> =
  z
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

export const EnumStatusNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumStatusNullableWithAggregatesFilter> =
  z
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

export const EnumNotificationMethodTypeFilterSchema: z.ZodType<Prisma.EnumNotificationMethodTypeFilter> =
  z
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

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z
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

export const EnumWebhookFormatNullableFilterSchema: z.ZodType<Prisma.EnumWebhookFormatNullableFilter> =
  z
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

export const PersonSettingsRelationFilterSchema: z.ZodType<Prisma.PersonSettingsRelationFilter> =
  z
    .object({
      is: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
      isNot: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
    })
    .strict();

export const NotificationSettingListRelationFilterSchema: z.ZodType<Prisma.NotificationSettingListRelationFilter> =
  z
    .object({
      every: z.lazy(() => NotificationSettingWhereInputSchema).optional(),
      some: z.lazy(() => NotificationSettingWhereInputSchema).optional(),
      none: z.lazy(() => NotificationSettingWhereInputSchema).optional(),
    })
    .strict();

export const NotificationSettingOrderByRelationAggregateInputSchema: z.ZodType<Prisma.NotificationSettingOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const NotificationMethodCountOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMethodCountOrderByAggregateInput> =
  z
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

export const NotificationMethodMaxOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMethodMaxOrderByAggregateInput> =
  z
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

export const NotificationMethodMinOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMethodMinOrderByAggregateInput> =
  z
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

export const EnumNotificationMethodTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumNotificationMethodTypeWithAggregatesFilter> =
  z
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
          z.lazy(
            () => NestedEnumNotificationMethodTypeWithAggregatesFilterSchema
          ),
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

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> =
  z
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

export const EnumWebhookFormatNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumWebhookFormatNullableWithAggregatesFilter> =
  z
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
          z.lazy(
            () => NestedEnumWebhookFormatNullableWithAggregatesFilterSchema
          ),
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

export const NotificationMethodRelationFilterSchema: z.ZodType<Prisma.NotificationMethodRelationFilter> =
  z
    .object({
      is: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
      isNot: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
    })
    .strict();

export const NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema: z.ZodType<Prisma.NotificationSettingNotificationTypeMethodIdCompoundUniqueInput> =
  z
    .object({
      notificationType: z.lazy(() => NotificationTypeSchema),
      methodId: z.string(),
    })
    .strict();

export const NotificationSettingCountOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationSettingCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      notificationType: z.lazy(() => SortOrderSchema).optional(),
      methodId: z.lazy(() => SortOrderSchema).optional(),
      enabled: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const NotificationSettingMaxOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationSettingMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      notificationType: z.lazy(() => SortOrderSchema).optional(),
      methodId: z.lazy(() => SortOrderSchema).optional(),
      enabled: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const NotificationSettingMinOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationSettingMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      notificationType: z.lazy(() => SortOrderSchema).optional(),
      methodId: z.lazy(() => SortOrderSchema).optional(),
      enabled: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const MembershipCreateNestedManyWithoutPersonInputSchema: z.ZodType<Prisma.MembershipCreateNestedManyWithoutPersonInput> =
  z
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

export const PostCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.PostCreateNestedManyWithoutAuthorInput> =
  z
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

export const ReplyCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyCreateNestedManyWithoutAuthorInput> =
  z
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

export const NotificationCreateNestedManyWithoutPersonInputSchema: z.ZodType<Prisma.NotificationCreateNestedManyWithoutPersonInput> =
  z
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

export const NotificationCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationCreateNestedManyWithoutAuthorInput> =
  z
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

export const PersonSettingsCreateNestedOneWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsCreateNestedOneWithoutPersonInput> =
  z
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

export const MembershipUncheckedCreateNestedManyWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateNestedManyWithoutPersonInput> =
  z
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

export const PostUncheckedCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedCreateNestedManyWithoutAuthorInput> =
  z
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

export const ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUncheckedCreateNestedManyWithoutAuthorInput> =
  z
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

export const NotificationUncheckedCreateNestedManyWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateNestedManyWithoutPersonInput> =
  z
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

export const NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateNestedManyWithoutAuthorInput> =
  z
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

export const PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedCreateNestedOneWithoutPersonInput> =
  z
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

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> =
  z
    .object({
      set: z.string().optional(),
    })
    .strict();

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> =
  z
    .object({
      set: z.coerce.date().optional(),
    })
    .strict();

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> =
  z
    .object({
      set: z.string().optional().nullable(),
    })
    .strict();

export const MembershipUpdateManyWithoutPersonNestedInputSchema: z.ZodType<Prisma.MembershipUpdateManyWithoutPersonNestedInput> =
  z
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

export const PostUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.PostUpdateManyWithoutAuthorNestedInput> =
  z
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

export const ReplyUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.ReplyUpdateManyWithoutAuthorNestedInput> =
  z
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

export const NotificationUpdateManyWithoutPersonNestedInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithoutPersonNestedInput> =
  z
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
          z.lazy(
            () => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema
          ),
          z
            .lazy(
              () => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema
            )
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
          z.lazy(
            () => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema
          ),
          z
            .lazy(
              () => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema
            )
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

export const NotificationUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithoutAuthorNestedInput> =
  z
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
          z.lazy(
            () => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema
          ),
          z
            .lazy(
              () => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema
            )
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
          z.lazy(
            () => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema
          ),
          z
            .lazy(
              () => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema
            )
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

export const PersonSettingsUpdateOneWithoutPersonNestedInputSchema: z.ZodType<Prisma.PersonSettingsUpdateOneWithoutPersonNestedInput> =
  z
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
          z.lazy(
            () => PersonSettingsUpdateToOneWithWhereWithoutPersonInputSchema
          ),
          z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema),
          z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema),
        ])
        .optional(),
    })
    .strict();

export const MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateManyWithoutPersonNestedInput> =
  z
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

export const PostUncheckedUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutAuthorNestedInput> =
  z
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

export const ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateManyWithoutAuthorNestedInput> =
  z
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

export const NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutPersonNestedInput> =
  z
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
          z.lazy(
            () => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema
          ),
          z
            .lazy(
              () => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema
            )
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
          z.lazy(
            () => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema
          ),
          z
            .lazy(
              () => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema
            )
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

export const NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutAuthorNestedInput> =
  z
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
          z.lazy(
            () => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema
          ),
          z
            .lazy(
              () => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema
            )
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
          z.lazy(
            () => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema
          ),
          z
            .lazy(
              () => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema
            )
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

export const PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedUpdateOneWithoutPersonNestedInput> =
  z
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
          z.lazy(
            () => PersonSettingsUpdateToOneWithWhereWithoutPersonInputSchema
          ),
          z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema),
          z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PersonCreateNestedOneWithoutSettingsInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutSettingsInput> =
  z
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

export const NotificationMethodCreateNestedManyWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodCreateNestedManyWithoutSettingsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
          z
            .lazy(() => NotificationMethodCreateWithoutSettingsInputSchema)
            .array(),
          z.lazy(
            () => NotificationMethodUncheckedCreateWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () => NotificationMethodUncheckedCreateWithoutSettingsInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => NotificationMethodCreateOrConnectWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () => NotificationMethodCreateOrConnectWithoutSettingsInputSchema
            )
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

export const NotificationMethodUncheckedCreateNestedManyWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedCreateNestedManyWithoutSettingsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
          z
            .lazy(() => NotificationMethodCreateWithoutSettingsInputSchema)
            .array(),
          z.lazy(
            () => NotificationMethodUncheckedCreateWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () => NotificationMethodUncheckedCreateWithoutSettingsInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => NotificationMethodCreateOrConnectWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () => NotificationMethodCreateOrConnectWithoutSettingsInputSchema
            )
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

export const PersonUpdateOneRequiredWithoutSettingsNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneRequiredWithoutSettingsNestedInput> =
  z
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

export const NotificationMethodUpdateManyWithoutSettingsNestedInputSchema: z.ZodType<Prisma.NotificationMethodUpdateManyWithoutSettingsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
          z
            .lazy(() => NotificationMethodCreateWithoutSettingsInputSchema)
            .array(),
          z.lazy(
            () => NotificationMethodUncheckedCreateWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () => NotificationMethodUncheckedCreateWithoutSettingsInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => NotificationMethodCreateOrConnectWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () => NotificationMethodCreateOrConnectWithoutSettingsInputSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema
            )
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
          z.lazy(
            () =>
              NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema
            )
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

export const NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
          z
            .lazy(() => NotificationMethodCreateWithoutSettingsInputSchema)
            .array(),
          z.lazy(
            () => NotificationMethodUncheckedCreateWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () => NotificationMethodUncheckedCreateWithoutSettingsInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => NotificationMethodCreateOrConnectWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () => NotificationMethodCreateOrConnectWithoutSettingsInputSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema
            )
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
          z.lazy(
            () =>
              NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema
            )
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

export const InviteCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.InviteCreateNestedManyWithoutEventInput> =
  z
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

export const PotentialDateTimeCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateNestedManyWithoutEventInput> =
  z
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

export const PostCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.PostCreateNestedManyWithoutEventInput> =
  z
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

export const MembershipCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.MembershipCreateNestedManyWithoutEventInput> =
  z
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

export const NotificationCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.NotificationCreateNestedManyWithoutEventInput> =
  z
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

export const InviteUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.InviteUncheckedCreateNestedManyWithoutEventInput> =
  z
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

export const PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedCreateNestedManyWithoutEventInput> =
  z
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

export const PostUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.PostUncheckedCreateNestedManyWithoutEventInput> =
  z
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

export const MembershipUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateNestedManyWithoutEventInput> =
  z
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

export const NotificationUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateNestedManyWithoutEventInput> =
  z
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

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> =
  z
    .object({
      set: z.coerce.date().optional().nullable(),
    })
    .strict();

export const InviteUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.InviteUpdateManyWithoutEventNestedInput> =
  z
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

export const PotentialDateTimeUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateManyWithoutEventNestedInput> =
  z
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
          z.lazy(
            () => PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema
          ),
          z
            .lazy(
              () =>
                PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema
            )
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
          z.lazy(
            () => PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema
          ),
          z
            .lazy(
              () =>
                PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema
          ),
          z
            .lazy(
              () => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema
            )
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

export const PostUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.PostUpdateManyWithoutEventNestedInput> =
  z
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

export const MembershipUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.MembershipUpdateManyWithoutEventNestedInput> =
  z
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

export const NotificationUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithoutEventNestedInput> =
  z
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
          z.lazy(
            () => NotificationUpsertWithWhereUniqueWithoutEventInputSchema
          ),
          z
            .lazy(
              () => NotificationUpsertWithWhereUniqueWithoutEventInputSchema
            )
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
          z.lazy(
            () => NotificationUpdateWithWhereUniqueWithoutEventInputSchema
          ),
          z
            .lazy(
              () => NotificationUpdateWithWhereUniqueWithoutEventInputSchema
            )
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

export const InviteUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateManyWithoutEventNestedInput> =
  z
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

export const PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInput> =
  z
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
          z.lazy(
            () => PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema
          ),
          z
            .lazy(
              () =>
                PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema
            )
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
          z.lazy(
            () => PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema
          ),
          z
            .lazy(
              () =>
                PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema
          ),
          z
            .lazy(
              () => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema
            )
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

export const PostUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutEventNestedInput> =
  z
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

export const MembershipUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateManyWithoutEventNestedInput> =
  z
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

export const NotificationUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutEventNestedInput> =
  z
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
          z.lazy(
            () => NotificationUpsertWithWhereUniqueWithoutEventInputSchema
          ),
          z
            .lazy(
              () => NotificationUpsertWithWhereUniqueWithoutEventInputSchema
            )
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
          z.lazy(
            () => NotificationUpdateWithWhereUniqueWithoutEventInputSchema
          ),
          z
            .lazy(
              () => NotificationUpdateWithWhereUniqueWithoutEventInputSchema
            )
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

export const PersonCreateNestedOneWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutMembershipsInput> =
  z
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

export const EventCreateNestedOneWithoutMembershipsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutMembershipsInput> =
  z
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

export const AvailabilityCreateNestedManyWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityCreateNestedManyWithoutMembershipInput> =
  z
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

export const InviteCreateNestedManyWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteCreateNestedManyWithoutCreatedByInput> =
  z
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

export const AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUncheckedCreateNestedManyWithoutMembershipInput> =
  z
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

export const InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUncheckedCreateNestedManyWithoutCreatedByInput> =
  z
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

export const EnumRoleFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumRoleFieldUpdateOperationsInput> =
  z
    .object({
      set: z.lazy(() => RoleSchema).optional(),
    })
    .strict();

export const EnumStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumStatusFieldUpdateOperationsInput> =
  z
    .object({
      set: z.lazy(() => StatusSchema).optional(),
    })
    .strict();

export const PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneRequiredWithoutMembershipsNestedInput> =
  z
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

export const EventUpdateOneRequiredWithoutMembershipsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutMembershipsNestedInput> =
  z
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

export const AvailabilityUpdateManyWithoutMembershipNestedInputSchema: z.ZodType<Prisma.AvailabilityUpdateManyWithoutMembershipNestedInput> =
  z
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
          z.lazy(
            () => AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema
            )
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
          z.lazy(
            () => AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema
          ),
          z
            .lazy(
              () => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema
            )
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

export const InviteUpdateManyWithoutCreatedByNestedInputSchema: z.ZodType<Prisma.InviteUpdateManyWithoutCreatedByNestedInput> =
  z
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

export const AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateManyWithoutMembershipNestedInput> =
  z
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
          z.lazy(
            () => AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema
            )
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
          z.lazy(
            () => AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema
          ),
          z
            .lazy(
              () => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema
            )
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

export const InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateManyWithoutCreatedByNestedInput> =
  z
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

export const EventCreateNestedOneWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutPotentialDateTimesInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema),
          z.lazy(
            () => EventUncheckedCreateWithoutPotentialDateTimesInputSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => EventCreateOrConnectWithoutPotentialDateTimesInputSchema)
        .optional(),
      connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
    })
    .strict();

export const AvailabilityCreateNestedManyWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityCreateNestedManyWithoutPotentialDateTimeInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
          z
            .lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema)
            .array(),
          z.lazy(
            () => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema
            )
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

export const AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
          z
            .lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema)
            .array(),
          z.lazy(
            () => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema
            )
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

export const EventUpdateOneRequiredWithoutPotentialDateTimesNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutPotentialDateTimesNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema),
          z.lazy(
            () => EventUncheckedCreateWithoutPotentialDateTimesInputSchema
          ),
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
          z.lazy(
            () => EventUpdateToOneWithWhereWithoutPotentialDateTimesInputSchema
          ),
          z.lazy(() => EventUpdateWithoutPotentialDateTimesInputSchema),
          z.lazy(
            () => EventUncheckedUpdateWithoutPotentialDateTimesInputSchema
          ),
        ])
        .optional(),
    })
    .strict();

export const AvailabilityUpdateManyWithoutPotentialDateTimeNestedInputSchema: z.ZodType<Prisma.AvailabilityUpdateManyWithoutPotentialDateTimeNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
          z
            .lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema)
            .array(),
          z.lazy(
            () => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema
            )
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
          z.lazy(
            () =>
              AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema
            )
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

export const AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
          z
            .lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema)
            .array(),
          z.lazy(
            () => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema
            )
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
          z.lazy(
            () =>
              AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema
          ),
          z
            .lazy(
              () =>
                AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema
            )
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

export const MembershipCreateNestedOneWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipCreateNestedOneWithoutAvailabilitiesInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema),
          z.lazy(
            () => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => MembershipCreateOrConnectWithoutAvailabilitiesInputSchema)
        .optional(),
      connect: z.lazy(() => MembershipWhereUniqueInputSchema).optional(),
    })
    .strict();

export const PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema),
          z.lazy(
            () =>
              PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInputSchema
        )
        .optional(),
      connect: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).optional(),
    })
    .strict();

export const MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema: z.ZodType<Prisma.MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema),
          z.lazy(
            () => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema
          ),
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
          z.lazy(
            () => MembershipUpdateToOneWithWhereWithoutAvailabilitiesInputSchema
          ),
          z.lazy(() => MembershipUpdateWithoutAvailabilitiesInputSchema),
          z.lazy(
            () => MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema
          ),
        ])
        .optional(),
    })
    .strict();

export const PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema),
          z.lazy(
            () =>
              PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInputSchema
        )
        .optional(),
      upsert: z
        .lazy(() => PotentialDateTimeUpsertWithoutAvailabilitiesInputSchema)
        .optional(),
      connect: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(
            () =>
              PotentialDateTimeUpdateToOneWithWhereWithoutAvailabilitiesInputSchema
          ),
          z.lazy(() => PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema),
          z.lazy(
            () =>
              PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema
          ),
        ])
        .optional(),
    })
    .strict();

export const PersonCreateNestedOneWithoutPostsInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutPostsInput> =
  z
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

export const EventCreateNestedOneWithoutPostsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutPostsInput> =
  z
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

export const ReplyCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.ReplyCreateNestedManyWithoutPostInput> =
  z
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

export const NotificationCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.NotificationCreateNestedManyWithoutPostInput> =
  z
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

export const ReplyUncheckedCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.ReplyUncheckedCreateNestedManyWithoutPostInput> =
  z
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

export const NotificationUncheckedCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateNestedManyWithoutPostInput> =
  z
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

export const PersonUpdateOneRequiredWithoutPostsNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneRequiredWithoutPostsNestedInput> =
  z
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

export const EventUpdateOneRequiredWithoutPostsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutPostsNestedInput> =
  z
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

export const ReplyUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.ReplyUpdateManyWithoutPostNestedInput> =
  z
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

export const NotificationUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithoutPostNestedInput> =
  z
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

export const ReplyUncheckedUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateManyWithoutPostNestedInput> =
  z
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

export const NotificationUncheckedUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutPostNestedInput> =
  z
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

export const PersonCreateNestedOneWithoutRepliesInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutRepliesInput> =
  z
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

export const PostCreateNestedOneWithoutRepliesInputSchema: z.ZodType<Prisma.PostCreateNestedOneWithoutRepliesInput> =
  z
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

export const PersonUpdateOneRequiredWithoutRepliesNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneRequiredWithoutRepliesNestedInput> =
  z
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

export const PostUpdateOneRequiredWithoutRepliesNestedInputSchema: z.ZodType<Prisma.PostUpdateOneRequiredWithoutRepliesNestedInput> =
  z
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

export const EventCreateNestedOneWithoutInvitesInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutInvitesInput> =
  z
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

export const MembershipCreateNestedOneWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipCreateNestedOneWithoutInvitesInput> =
  z
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

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> =
  z
    .object({
      set: z.number().optional().nullable(),
      increment: z.number().optional(),
      decrement: z.number().optional(),
      multiply: z.number().optional(),
      divide: z.number().optional(),
    })
    .strict();

export const EventUpdateOneRequiredWithoutInvitesNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutInvitesNestedInput> =
  z
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

export const MembershipUpdateOneRequiredWithoutInvitesNestedInputSchema: z.ZodType<Prisma.MembershipUpdateOneRequiredWithoutInvitesNestedInput> =
  z
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

export const PersonCreateNestedOneWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutNotificationsInput> =
  z
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

export const PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutAuthoredNotificationsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema),
          z.lazy(
            () => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => PersonCreateOrConnectWithoutAuthoredNotificationsInputSchema
        )
        .optional(),
      connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
    })
    .strict();

export const EventCreateNestedOneWithoutNotificationsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutNotificationsInput> =
  z
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

export const PostCreateNestedOneWithoutNotificationsInputSchema: z.ZodType<Prisma.PostCreateNestedOneWithoutNotificationsInput> =
  z
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

export const EnumNotificationTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumNotificationTypeFieldUpdateOperationsInput> =
  z
    .object({
      set: z.lazy(() => NotificationTypeSchema).optional(),
    })
    .strict();

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> =
  z
    .object({
      set: z.boolean().optional(),
    })
    .strict();

export const NullableEnumStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumStatusFieldUpdateOperationsInput> =
  z
    .object({
      set: z
        .lazy(() => StatusSchema)
        .optional()
        .nullable(),
    })
    .strict();

export const PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneRequiredWithoutNotificationsNestedInput> =
  z
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
          z.lazy(
            () => PersonUpdateToOneWithWhereWithoutNotificationsInputSchema
          ),
          z.lazy(() => PersonUpdateWithoutNotificationsInputSchema),
          z.lazy(() => PersonUncheckedUpdateWithoutNotificationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneWithoutAuthoredNotificationsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema),
          z.lazy(
            () => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => PersonCreateOrConnectWithoutAuthoredNotificationsInputSchema
        )
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
          z.lazy(
            () =>
              PersonUpdateToOneWithWhereWithoutAuthoredNotificationsInputSchema
          ),
          z.lazy(() => PersonUpdateWithoutAuthoredNotificationsInputSchema),
          z.lazy(
            () => PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema
          ),
        ])
        .optional(),
    })
    .strict();

export const EventUpdateOneWithoutNotificationsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneWithoutNotificationsNestedInput> =
  z
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
          z.lazy(
            () => EventUpdateToOneWithWhereWithoutNotificationsInputSchema
          ),
          z.lazy(() => EventUpdateWithoutNotificationsInputSchema),
          z.lazy(() => EventUncheckedUpdateWithoutNotificationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PostUpdateOneWithoutNotificationsNestedInputSchema: z.ZodType<Prisma.PostUpdateOneWithoutNotificationsNestedInput> =
  z
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

export const PersonSettingsCreateNestedOneWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsCreateNestedOneWithoutNotificationMethodsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () => PersonSettingsCreateWithoutNotificationMethodsInputSchema
          ),
          z.lazy(
            () =>
              PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () =>
            PersonSettingsCreateOrConnectWithoutNotificationMethodsInputSchema
        )
        .optional(),
      connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
    })
    .strict();

export const NotificationSettingCreateNestedManyWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingCreateNestedManyWithoutNotificationMethodInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () => NotificationSettingCreateWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingCreateWithoutNotificationMethodInputSchema
            )
            .array(),
          z.lazy(
            () =>
              NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () =>
            NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema
        )
        .optional(),
      connect: z
        .union([
          z.lazy(() => NotificationSettingWhereUniqueInputSchema),
          z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () => NotificationSettingCreateWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingCreateWithoutNotificationMethodInputSchema
            )
            .array(),
          z.lazy(
            () =>
              NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () =>
            NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema
        )
        .optional(),
      connect: z
        .union([
          z.lazy(() => NotificationSettingWhereUniqueInputSchema),
          z.lazy(() => NotificationSettingWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const EnumNotificationMethodTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumNotificationMethodTypeFieldUpdateOperationsInput> =
  z
    .object({
      set: z.lazy(() => NotificationMethodTypeSchema).optional(),
    })
    .strict();

export const NullableEnumWebhookFormatFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumWebhookFormatFieldUpdateOperationsInput> =
  z
    .object({
      set: z
        .lazy(() => WebhookFormatSchema)
        .optional()
        .nullable(),
    })
    .strict();

export const PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInputSchema: z.ZodType<Prisma.PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () => PersonSettingsCreateWithoutNotificationMethodsInputSchema
          ),
          z.lazy(
            () =>
              PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () =>
            PersonSettingsCreateOrConnectWithoutNotificationMethodsInputSchema
        )
        .optional(),
      upsert: z
        .lazy(() => PersonSettingsUpsertWithoutNotificationMethodsInputSchema)
        .optional(),
      connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(
            () =>
              PersonSettingsUpdateToOneWithWhereWithoutNotificationMethodsInputSchema
          ),
          z.lazy(
            () => PersonSettingsUpdateWithoutNotificationMethodsInputSchema
          ),
          z.lazy(
            () =>
              PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema
          ),
        ])
        .optional(),
    })
    .strict();

export const NotificationSettingUpdateManyWithoutNotificationMethodNestedInputSchema: z.ZodType<Prisma.NotificationSettingUpdateManyWithoutNotificationMethodNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () => NotificationSettingCreateWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingCreateWithoutNotificationMethodInputSchema
            )
            .array(),
          z.lazy(
            () =>
              NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () =>
            NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema
        )
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
          z.lazy(
            () =>
              NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema
            )
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

export const NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () => NotificationSettingCreateWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingCreateWithoutNotificationMethodInputSchema
            )
            .array(),
          z.lazy(
            () =>
              NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () =>
            NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema
        )
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
          z.lazy(
            () =>
              NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema
          ),
          z
            .lazy(
              () =>
                NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema
            )
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

export const NotificationMethodCreateNestedOneWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodCreateNestedOneWithoutNotificationsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema),
          z.lazy(
            () =>
              NotificationMethodUncheckedCreateWithoutNotificationsInputSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => NotificationMethodCreateOrConnectWithoutNotificationsInputSchema
        )
        .optional(),
      connect: z
        .lazy(() => NotificationMethodWhereUniqueInputSchema)
        .optional(),
    })
    .strict();

export const NotificationMethodUpdateOneRequiredWithoutNotificationsNestedInputSchema: z.ZodType<Prisma.NotificationMethodUpdateOneRequiredWithoutNotificationsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema),
          z.lazy(
            () =>
              NotificationMethodUncheckedCreateWithoutNotificationsInputSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => NotificationMethodCreateOrConnectWithoutNotificationsInputSchema
        )
        .optional(),
      upsert: z
        .lazy(() => NotificationMethodUpsertWithoutNotificationsInputSchema)
        .optional(),
      connect: z
        .lazy(() => NotificationMethodWhereUniqueInputSchema)
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              NotificationMethodUpdateToOneWithWhereWithoutNotificationsInputSchema
          ),
          z.lazy(() => NotificationMethodUpdateWithoutNotificationsInputSchema),
          z.lazy(
            () =>
              NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema
          ),
        ])
        .optional(),
    })
    .strict();

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z
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

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> =
  z
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

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> =
  z
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

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> =
  z
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

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z
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

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> =
  z
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

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> =
  z
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

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> =
  z
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

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> =
  z
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

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> =
  z
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

export const NestedEnumRoleFilterSchema: z.ZodType<Prisma.NestedEnumRoleFilter> =
  z
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

export const NestedEnumStatusFilterSchema: z.ZodType<Prisma.NestedEnumStatusFilter> =
  z
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

export const NestedEnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumRoleWithAggregatesFilter> =
  z
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

export const NestedEnumStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumStatusWithAggregatesFilter> =
  z
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

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> =
  z
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

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> =
  z
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

export const NestedEnumNotificationTypeFilterSchema: z.ZodType<Prisma.NestedEnumNotificationTypeFilter> =
  z
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

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z
  .object({
    equals: z.boolean().optional(),
    not: z
      .union([z.boolean(), z.lazy(() => NestedBoolFilterSchema)])
      .optional(),
  })
  .strict();

export const NestedEnumStatusNullableFilterSchema: z.ZodType<Prisma.NestedEnumStatusNullableFilter> =
  z
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

export const NestedEnumNotificationTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumNotificationTypeWithAggregatesFilter> =
  z
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

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> =
  z
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

export const NestedEnumStatusNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumStatusNullableWithAggregatesFilter> =
  z
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

export const NestedEnumNotificationMethodTypeFilterSchema: z.ZodType<Prisma.NestedEnumNotificationMethodTypeFilter> =
  z
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

export const NestedEnumWebhookFormatNullableFilterSchema: z.ZodType<Prisma.NestedEnumWebhookFormatNullableFilter> =
  z
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

export const NestedEnumNotificationMethodTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumNotificationMethodTypeWithAggregatesFilter> =
  z
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
          z.lazy(
            () => NestedEnumNotificationMethodTypeWithAggregatesFilterSchema
          ),
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

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> =
  z
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

export const NestedEnumWebhookFormatNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumWebhookFormatNullableWithAggregatesFilter> =
  z
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
          z.lazy(
            () => NestedEnumWebhookFormatNullableWithAggregatesFilterSchema
          ),
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

export const MembershipCreateWithoutPersonInputSchema: z.ZodType<Prisma.MembershipCreateWithoutPersonInput> =
  z
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

export const MembershipUncheckedCreateWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateWithoutPersonInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      eventId: z.string(),
      role: z.lazy(() => RoleSchema).optional(),
      rsvpStatus: z.lazy(() => StatusSchema).optional(),
      availabilities: z
        .lazy(
          () =>
            AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema
        )
        .optional(),
      invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
    })
    .strict();

export const MembershipCreateOrConnectWithoutPersonInputSchema: z.ZodType<Prisma.MembershipCreateOrConnectWithoutPersonInput> =
  z
    .object({
      where: z.lazy(() => MembershipWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => MembershipCreateWithoutPersonInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema),
      ]),
    })
    .strict();

export const MembershipCreateManyPersonInputEnvelopeSchema: z.ZodType<Prisma.MembershipCreateManyPersonInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => MembershipCreateManyPersonInputSchema),
        z.lazy(() => MembershipCreateManyPersonInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PostCreateWithoutAuthorInputSchema: z.ZodType<Prisma.PostCreateWithoutAuthorInput> =
  z
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

export const PostUncheckedCreateWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutAuthorInput> =
  z
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

export const PostCreateOrConnectWithoutAuthorInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutAuthorInput> =
  z
    .object({
      where: z.lazy(() => PostWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
      ]),
    })
    .strict();

export const PostCreateManyAuthorInputEnvelopeSchema: z.ZodType<Prisma.PostCreateManyAuthorInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => PostCreateManyAuthorInputSchema),
        z.lazy(() => PostCreateManyAuthorInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const ReplyCreateWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyCreateWithoutAuthorInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      text: z.string(),
      post: z.lazy(() => PostCreateNestedOneWithoutRepliesInputSchema),
    })
    .strict();

export const ReplyUncheckedCreateWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUncheckedCreateWithoutAuthorInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      postId: z.string(),
      text: z.string(),
    })
    .strict();

export const ReplyCreateOrConnectWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyCreateOrConnectWithoutAuthorInput> =
  z
    .object({
      where: z.lazy(() => ReplyWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => ReplyCreateWithoutAuthorInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema),
      ]),
    })
    .strict();

export const ReplyCreateManyAuthorInputEnvelopeSchema: z.ZodType<Prisma.ReplyCreateManyAuthorInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => ReplyCreateManyAuthorInputSchema),
        z.lazy(() => ReplyCreateManyAuthorInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NotificationCreateWithoutPersonInputSchema: z.ZodType<Prisma.NotificationCreateWithoutPersonInput> =
  z
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
        .lazy(
          () => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema
        )
        .optional(),
      event: z
        .lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
      post: z
        .lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
    })
    .strict();

export const NotificationUncheckedCreateWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateWithoutPersonInput> =
  z
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

export const NotificationCreateOrConnectWithoutPersonInputSchema: z.ZodType<Prisma.NotificationCreateOrConnectWithoutPersonInput> =
  z
    .object({
      where: z.lazy(() => NotificationWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => NotificationCreateWithoutPersonInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema),
      ]),
    })
    .strict();

export const NotificationCreateManyPersonInputEnvelopeSchema: z.ZodType<Prisma.NotificationCreateManyPersonInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => NotificationCreateManyPersonInputSchema),
        z.lazy(() => NotificationCreateManyPersonInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NotificationCreateWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationCreateWithoutAuthorInput> =
  z
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
      person: z.lazy(
        () => PersonCreateNestedOneWithoutNotificationsInputSchema
      ),
      event: z
        .lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
      post: z
        .lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
    })
    .strict();

export const NotificationUncheckedCreateWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateWithoutAuthorInput> =
  z
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

export const NotificationCreateOrConnectWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationCreateOrConnectWithoutAuthorInput> =
  z
    .object({
      where: z.lazy(() => NotificationWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => NotificationCreateWithoutAuthorInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema),
      ]),
    })
    .strict();

export const NotificationCreateManyAuthorInputEnvelopeSchema: z.ZodType<Prisma.NotificationCreateManyAuthorInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => NotificationCreateManyAuthorInputSchema),
        z.lazy(() => NotificationCreateManyAuthorInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PersonSettingsCreateWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsCreateWithoutPersonInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      notificationMethods: z
        .lazy(
          () => NotificationMethodCreateNestedManyWithoutSettingsInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonSettingsUncheckedCreateWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedCreateWithoutPersonInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      notificationMethods: z
        .lazy(
          () =>
            NotificationMethodUncheckedCreateNestedManyWithoutSettingsInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonSettingsCreateOrConnectWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsCreateOrConnectWithoutPersonInput> =
  z
    .object({
      where: z.lazy(() => PersonSettingsWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema),
      ]),
    })
    .strict();

export const MembershipUpsertWithWhereUniqueWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUpsertWithWhereUniqueWithoutPersonInput> =
  z
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

export const MembershipUpdateWithWhereUniqueWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUpdateWithWhereUniqueWithoutPersonInput> =
  z
    .object({
      where: z.lazy(() => MembershipWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => MembershipUpdateWithoutPersonInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutPersonInputSchema),
      ]),
    })
    .strict();

export const MembershipUpdateManyWithWhereWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUpdateManyWithWhereWithoutPersonInput> =
  z
    .object({
      where: z.lazy(() => MembershipScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => MembershipUpdateManyMutationInputSchema),
        z.lazy(() => MembershipUncheckedUpdateManyWithoutPersonInputSchema),
      ]),
    })
    .strict();

export const MembershipScalarWhereInputSchema: z.ZodType<Prisma.MembershipScalarWhereInput> =
  z
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

export const PostUpsertWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpsertWithWhereUniqueWithoutAuthorInput> =
  z
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

export const PostUpdateWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpdateWithWhereUniqueWithoutAuthorInput> =
  z
    .object({
      where: z.lazy(() => PostWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => PostUpdateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutAuthorInputSchema),
      ]),
    })
    .strict();

export const PostUpdateManyWithWhereWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpdateManyWithWhereWithoutAuthorInput> =
  z
    .object({
      where: z.lazy(() => PostScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => PostUpdateManyMutationInputSchema),
        z.lazy(() => PostUncheckedUpdateManyWithoutAuthorInputSchema),
      ]),
    })
    .strict();

export const PostScalarWhereInputSchema: z.ZodType<Prisma.PostScalarWhereInput> =
  z
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

export const ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUpsertWithWhereUniqueWithoutAuthorInput> =
  z
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

export const ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUpdateWithWhereUniqueWithoutAuthorInput> =
  z
    .object({
      where: z.lazy(() => ReplyWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => ReplyUpdateWithoutAuthorInputSchema),
        z.lazy(() => ReplyUncheckedUpdateWithoutAuthorInputSchema),
      ]),
    })
    .strict();

export const ReplyUpdateManyWithWhereWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUpdateManyWithWhereWithoutAuthorInput> =
  z
    .object({
      where: z.lazy(() => ReplyScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => ReplyUpdateManyMutationInputSchema),
        z.lazy(() => ReplyUncheckedUpdateManyWithoutAuthorInputSchema),
      ]),
    })
    .strict();

export const ReplyScalarWhereInputSchema: z.ZodType<Prisma.ReplyScalarWhereInput> =
  z
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

export const NotificationUpsertWithWhereUniqueWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUpsertWithWhereUniqueWithoutPersonInput> =
  z
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

export const NotificationUpdateWithWhereUniqueWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUpdateWithWhereUniqueWithoutPersonInput> =
  z
    .object({
      where: z.lazy(() => NotificationWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => NotificationUpdateWithoutPersonInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutPersonInputSchema),
      ]),
    })
    .strict();

export const NotificationUpdateManyWithWhereWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithWhereWithoutPersonInput> =
  z
    .object({
      where: z.lazy(() => NotificationScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => NotificationUpdateManyMutationInputSchema),
        z.lazy(() => NotificationUncheckedUpdateManyWithoutPersonInputSchema),
      ]),
    })
    .strict();

export const NotificationScalarWhereInputSchema: z.ZodType<Prisma.NotificationScalarWhereInput> =
  z
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

export const NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUpsertWithWhereUniqueWithoutAuthorInput> =
  z
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

export const NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUpdateWithWhereUniqueWithoutAuthorInput> =
  z
    .object({
      where: z.lazy(() => NotificationWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => NotificationUpdateWithoutAuthorInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutAuthorInputSchema),
      ]),
    })
    .strict();

export const NotificationUpdateManyWithWhereWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithWhereWithoutAuthorInput> =
  z
    .object({
      where: z.lazy(() => NotificationScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => NotificationUpdateManyMutationInputSchema),
        z.lazy(() => NotificationUncheckedUpdateManyWithoutAuthorInputSchema),
      ]),
    })
    .strict();

export const PersonSettingsUpsertWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUpsertWithoutPersonInput> =
  z
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

export const PersonSettingsUpdateToOneWithWhereWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUpdateToOneWithWhereWithoutPersonInput> =
  z
    .object({
      where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema),
        z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema),
      ]),
    })
    .strict();

export const PersonSettingsUpdateWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUpdateWithoutPersonInput> =
  z
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
        .lazy(
          () => NotificationMethodUpdateManyWithoutSettingsNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonSettingsUncheckedUpdateWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedUpdateWithoutPersonInput> =
  z
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
        .lazy(
          () =>
            NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonCreateWithoutSettingsInputSchema: z.ZodType<Prisma.PersonCreateWithoutSettingsInput> =
  z
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

export const PersonUncheckedCreateWithoutSettingsInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutSettingsInput> =
  z
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
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema
        )
        .optional(),
      authoredNotifications: z
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonCreateOrConnectWithoutSettingsInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutSettingsInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PersonCreateWithoutSettingsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutSettingsInputSchema),
      ]),
    })
    .strict();

export const NotificationMethodCreateWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodCreateWithoutSettingsInput> =
  z
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
        .lazy(
          () =>
            NotificationSettingCreateNestedManyWithoutNotificationMethodInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationMethodUncheckedCreateWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedCreateWithoutSettingsInput> =
  z
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
        .lazy(
          () =>
            NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationMethodCreateOrConnectWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodCreateOrConnectWithoutSettingsInput> =
  z
    .object({
      where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
        z.lazy(
          () => NotificationMethodUncheckedCreateWithoutSettingsInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationMethodCreateManySettingsInputEnvelopeSchema: z.ZodType<Prisma.NotificationMethodCreateManySettingsInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => NotificationMethodCreateManySettingsInputSchema),
        z.lazy(() => NotificationMethodCreateManySettingsInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PersonUpsertWithoutSettingsInputSchema: z.ZodType<Prisma.PersonUpsertWithoutSettingsInput> =
  z
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

export const PersonUpdateToOneWithWhereWithoutSettingsInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutSettingsInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PersonUpdateWithoutSettingsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutSettingsInputSchema),
      ]),
    })
    .strict();

export const PersonUpdateWithoutSettingsInputSchema: z.ZodType<Prisma.PersonUpdateWithoutSettingsInput> =
  z
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

export const PersonUncheckedUpdateWithoutSettingsInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutSettingsInput> =
  z
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
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema
        )
        .optional(),
      authoredNotifications: z
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUpsertWithWhereUniqueWithoutSettingsInput> =
  z
    .object({
      where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => NotificationMethodUpdateWithoutSettingsInputSchema),
        z.lazy(
          () => NotificationMethodUncheckedUpdateWithoutSettingsInputSchema
        ),
      ]),
      create: z.union([
        z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema),
        z.lazy(
          () => NotificationMethodUncheckedCreateWithoutSettingsInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUpdateWithWhereUniqueWithoutSettingsInput> =
  z
    .object({
      where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => NotificationMethodUpdateWithoutSettingsInputSchema),
        z.lazy(
          () => NotificationMethodUncheckedUpdateWithoutSettingsInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUpdateManyWithWhereWithoutSettingsInput> =
  z
    .object({
      where: z.lazy(() => NotificationMethodScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => NotificationMethodUpdateManyMutationInputSchema),
        z.lazy(
          () => NotificationMethodUncheckedUpdateManyWithoutSettingsInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationMethodScalarWhereInputSchema: z.ZodType<Prisma.NotificationMethodScalarWhereInput> =
  z
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

export const InviteCreateWithoutEventInputSchema: z.ZodType<Prisma.InviteCreateWithoutEventInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      expiresAt: z.coerce.date().optional().nullable(),
      usesRemaining: z.number().int().optional().nullable(),
      maxUses: z.number().int().optional().nullable(),
      name: z.string().optional().nullable(),
      createdBy: z.lazy(
        () => MembershipCreateNestedOneWithoutInvitesInputSchema
      ),
    })
    .strict();

export const InviteUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.InviteUncheckedCreateWithoutEventInput> =
  z
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

export const InviteCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.InviteCreateOrConnectWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => InviteWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => InviteCreateWithoutEventInputSchema),
        z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema),
      ]),
    })
    .strict();

export const InviteCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.InviteCreateManyEventInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => InviteCreateManyEventInputSchema),
        z.lazy(() => InviteCreateManyEventInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PotentialDateTimeCreateWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateWithoutEventInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      dateTime: z.coerce.date().optional(),
      availabilities: z
        .lazy(
          () => AvailabilityCreateNestedManyWithoutPotentialDateTimeInputSchema
        )
        .optional(),
    })
    .strict();

export const PotentialDateTimeUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedCreateWithoutEventInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      dateTime: z.coerce.date().optional(),
      availabilities: z
        .lazy(
          () =>
            AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInputSchema
        )
        .optional(),
    })
    .strict();

export const PotentialDateTimeCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateOrConnectWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema),
      ]),
    })
    .strict();

export const PotentialDateTimeCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.PotentialDateTimeCreateManyEventInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => PotentialDateTimeCreateManyEventInputSchema),
        z.lazy(() => PotentialDateTimeCreateManyEventInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PostCreateWithoutEventInputSchema: z.ZodType<Prisma.PostCreateWithoutEventInput> =
  z
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

export const PostUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutEventInput> =
  z
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

export const PostCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => PostWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PostCreateWithoutEventInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutEventInputSchema),
      ]),
    })
    .strict();

export const PostCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.PostCreateManyEventInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => PostCreateManyEventInputSchema),
        z.lazy(() => PostCreateManyEventInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const MembershipCreateWithoutEventInputSchema: z.ZodType<Prisma.MembershipCreateWithoutEventInput> =
  z
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

export const MembershipUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateWithoutEventInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      personId: z.string(),
      role: z.lazy(() => RoleSchema).optional(),
      rsvpStatus: z.lazy(() => StatusSchema).optional(),
      availabilities: z
        .lazy(
          () =>
            AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema
        )
        .optional(),
      invites: z
        .lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema)
        .optional(),
    })
    .strict();

export const MembershipCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.MembershipCreateOrConnectWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => MembershipWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => MembershipCreateWithoutEventInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema),
      ]),
    })
    .strict();

export const MembershipCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.MembershipCreateManyEventInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => MembershipCreateManyEventInputSchema),
        z.lazy(() => MembershipCreateManyEventInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NotificationCreateWithoutEventInputSchema: z.ZodType<Prisma.NotificationCreateWithoutEventInput> =
  z
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
      person: z.lazy(
        () => PersonCreateNestedOneWithoutNotificationsInputSchema
      ),
      author: z
        .lazy(
          () => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema
        )
        .optional(),
      post: z
        .lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
    })
    .strict();

export const NotificationUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateWithoutEventInput> =
  z
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

export const NotificationCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.NotificationCreateOrConnectWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => NotificationWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => NotificationCreateWithoutEventInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema),
      ]),
    })
    .strict();

export const NotificationCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.NotificationCreateManyEventInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => NotificationCreateManyEventInputSchema),
        z.lazy(() => NotificationCreateManyEventInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const InviteUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.InviteUpsertWithWhereUniqueWithoutEventInput> =
  z
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

export const InviteUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.InviteUpdateWithWhereUniqueWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => InviteWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => InviteUpdateWithoutEventInputSchema),
        z.lazy(() => InviteUncheckedUpdateWithoutEventInputSchema),
      ]),
    })
    .strict();

export const InviteUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.InviteUpdateManyWithWhereWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => InviteScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => InviteUpdateManyMutationInputSchema),
        z.lazy(() => InviteUncheckedUpdateManyWithoutEventInputSchema),
      ]),
    })
    .strict();

export const InviteScalarWhereInputSchema: z.ZodType<Prisma.InviteScalarWhereInput> =
  z
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

export const PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUpsertWithWhereUniqueWithoutEventInput> =
  z
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

export const PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateWithWhereUniqueWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => PotentialDateTimeUpdateWithoutEventInputSchema),
        z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutEventInputSchema),
      ]),
    })
    .strict();

export const PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateManyWithWhereWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => PotentialDateTimeScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => PotentialDateTimeUpdateManyMutationInputSchema),
        z.lazy(
          () => PotentialDateTimeUncheckedUpdateManyWithoutEventInputSchema
        ),
      ]),
    })
    .strict();

export const PotentialDateTimeScalarWhereInputSchema: z.ZodType<Prisma.PotentialDateTimeScalarWhereInput> =
  z
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

export const PostUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.PostUpsertWithWhereUniqueWithoutEventInput> =
  z
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

export const PostUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.PostUpdateWithWhereUniqueWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => PostWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => PostUpdateWithoutEventInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutEventInputSchema),
      ]),
    })
    .strict();

export const PostUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.PostUpdateManyWithWhereWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => PostScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => PostUpdateManyMutationInputSchema),
        z.lazy(() => PostUncheckedUpdateManyWithoutEventInputSchema),
      ]),
    })
    .strict();

export const MembershipUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.MembershipUpsertWithWhereUniqueWithoutEventInput> =
  z
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

export const MembershipUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.MembershipUpdateWithWhereUniqueWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => MembershipWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => MembershipUpdateWithoutEventInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutEventInputSchema),
      ]),
    })
    .strict();

export const MembershipUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.MembershipUpdateManyWithWhereWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => MembershipScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => MembershipUpdateManyMutationInputSchema),
        z.lazy(() => MembershipUncheckedUpdateManyWithoutEventInputSchema),
      ]),
    })
    .strict();

export const NotificationUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.NotificationUpsertWithWhereUniqueWithoutEventInput> =
  z
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

export const NotificationUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.NotificationUpdateWithWhereUniqueWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => NotificationWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => NotificationUpdateWithoutEventInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutEventInputSchema),
      ]),
    })
    .strict();

export const NotificationUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithWhereWithoutEventInput> =
  z
    .object({
      where: z.lazy(() => NotificationScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => NotificationUpdateManyMutationInputSchema),
        z.lazy(() => NotificationUncheckedUpdateManyWithoutEventInputSchema),
      ]),
    })
    .strict();

export const PersonCreateWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonCreateWithoutMembershipsInput> =
  z
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

export const PersonUncheckedCreateWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutMembershipsInput> =
  z
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
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema
        )
        .optional(),
      authoredNotifications: z
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonCreateOrConnectWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutMembershipsInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PersonCreateWithoutMembershipsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutMembershipsInputSchema),
      ]),
    })
    .strict();

export const EventCreateWithoutMembershipsInputSchema: z.ZodType<Prisma.EventCreateWithoutMembershipsInput> =
  z
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

export const EventUncheckedCreateWithoutMembershipsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutMembershipsInput> =
  z
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
        .lazy(
          () =>
            PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema
        )
        .optional(),
      posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
      notifications: z
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutEventInputSchema
        )
        .optional(),
    })
    .strict();

export const EventCreateOrConnectWithoutMembershipsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutMembershipsInput> =
  z
    .object({
      where: z.lazy(() => EventWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => EventCreateWithoutMembershipsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutMembershipsInputSchema),
      ]),
    })
    .strict();

export const AvailabilityCreateWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityCreateWithoutMembershipInput> =
  z
    .object({
      status: z.lazy(() => StatusSchema),
      potentialDateTime: z.lazy(
        () => PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInputSchema
      ),
    })
    .strict();

export const AvailabilityUncheckedCreateWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUncheckedCreateWithoutMembershipInput> =
  z
    .object({
      potentialDateTimeId: z.string(),
      status: z.lazy(() => StatusSchema),
    })
    .strict();

export const AvailabilityCreateOrConnectWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityCreateOrConnectWithoutMembershipInput> =
  z
    .object({
      where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema),
        z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema),
      ]),
    })
    .strict();

export const AvailabilityCreateManyMembershipInputEnvelopeSchema: z.ZodType<Prisma.AvailabilityCreateManyMembershipInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => AvailabilityCreateManyMembershipInputSchema),
        z.lazy(() => AvailabilityCreateManyMembershipInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const InviteCreateWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteCreateWithoutCreatedByInput> =
  z
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

export const InviteUncheckedCreateWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUncheckedCreateWithoutCreatedByInput> =
  z
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

export const InviteCreateOrConnectWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteCreateOrConnectWithoutCreatedByInput> =
  z
    .object({
      where: z.lazy(() => InviteWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => InviteCreateWithoutCreatedByInputSchema),
        z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema),
      ]),
    })
    .strict();

export const InviteCreateManyCreatedByInputEnvelopeSchema: z.ZodType<Prisma.InviteCreateManyCreatedByInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => InviteCreateManyCreatedByInputSchema),
        z.lazy(() => InviteCreateManyCreatedByInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PersonUpsertWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonUpsertWithoutMembershipsInput> =
  z
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

export const PersonUpdateToOneWithWhereWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutMembershipsInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PersonUpdateWithoutMembershipsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutMembershipsInputSchema),
      ]),
    })
    .strict();

export const PersonUpdateWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonUpdateWithoutMembershipsInput> =
  z
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

export const PersonUncheckedUpdateWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutMembershipsInput> =
  z
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
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema
        )
        .optional(),
      authoredNotifications: z
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const EventUpsertWithoutMembershipsInputSchema: z.ZodType<Prisma.EventUpsertWithoutMembershipsInput> =
  z
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

export const EventUpdateToOneWithWhereWithoutMembershipsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutMembershipsInput> =
  z
    .object({
      where: z.lazy(() => EventWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => EventUpdateWithoutMembershipsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutMembershipsInputSchema),
      ]),
    })
    .strict();

export const EventUpdateWithoutMembershipsInputSchema: z.ZodType<Prisma.EventUpdateWithoutMembershipsInput> =
  z
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

export const EventUncheckedUpdateWithoutMembershipsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutMembershipsInput> =
  z
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
        .lazy(
          () =>
            PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema
        )
        .optional(),
      posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
      notifications: z
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUpsertWithWhereUniqueWithoutMembershipInput> =
  z
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

export const AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUpdateWithWhereUniqueWithoutMembershipInput> =
  z
    .object({
      where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => AvailabilityUpdateWithoutMembershipInputSchema),
        z.lazy(() => AvailabilityUncheckedUpdateWithoutMembershipInputSchema),
      ]),
    })
    .strict();

export const AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUpdateManyWithWhereWithoutMembershipInput> =
  z
    .object({
      where: z.lazy(() => AvailabilityScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => AvailabilityUpdateManyMutationInputSchema),
        z.lazy(
          () => AvailabilityUncheckedUpdateManyWithoutMembershipInputSchema
        ),
      ]),
    })
    .strict();

export const AvailabilityScalarWhereInputSchema: z.ZodType<Prisma.AvailabilityScalarWhereInput> =
  z
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

export const InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUpsertWithWhereUniqueWithoutCreatedByInput> =
  z
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

export const InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUpdateWithWhereUniqueWithoutCreatedByInput> =
  z
    .object({
      where: z.lazy(() => InviteWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => InviteUpdateWithoutCreatedByInputSchema),
        z.lazy(() => InviteUncheckedUpdateWithoutCreatedByInputSchema),
      ]),
    })
    .strict();

export const InviteUpdateManyWithWhereWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUpdateManyWithWhereWithoutCreatedByInput> =
  z
    .object({
      where: z.lazy(() => InviteScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => InviteUpdateManyMutationInputSchema),
        z.lazy(() => InviteUncheckedUpdateManyWithoutCreatedByInputSchema),
      ]),
    })
    .strict();

export const EventCreateWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventCreateWithoutPotentialDateTimesInput> =
  z
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

export const EventUncheckedCreateWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutPotentialDateTimesInput> =
  z
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
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutEventInputSchema
        )
        .optional(),
    })
    .strict();

export const EventCreateOrConnectWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutPotentialDateTimesInput> =
  z
    .object({
      where: z.lazy(() => EventWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutPotentialDateTimesInputSchema),
      ]),
    })
    .strict();

export const AvailabilityCreateWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityCreateWithoutPotentialDateTimeInput> =
  z
    .object({
      status: z.lazy(() => StatusSchema),
      membership: z.lazy(
        () => MembershipCreateNestedOneWithoutAvailabilitiesInputSchema
      ),
    })
    .strict();

export const AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUncheckedCreateWithoutPotentialDateTimeInput> =
  z
    .object({
      membershipId: z.string(),
      status: z.lazy(() => StatusSchema),
    })
    .strict();

export const AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityCreateOrConnectWithoutPotentialDateTimeInput> =
  z
    .object({
      where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
        z.lazy(
          () => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema
        ),
      ]),
    })
    .strict();

export const AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema: z.ZodType<Prisma.AvailabilityCreateManyPotentialDateTimeInputEnvelope> =
  z
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

export const EventUpsertWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventUpsertWithoutPotentialDateTimesInput> =
  z
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

export const EventUpdateToOneWithWhereWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutPotentialDateTimesInput> =
  z
    .object({
      where: z.lazy(() => EventWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => EventUpdateWithoutPotentialDateTimesInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutPotentialDateTimesInputSchema),
      ]),
    })
    .strict();

export const EventUpdateWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventUpdateWithoutPotentialDateTimesInput> =
  z
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

export const EventUncheckedUpdateWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutPotentialDateTimesInput> =
  z
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
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInput> =
  z
    .object({
      where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => AvailabilityUpdateWithoutPotentialDateTimeInputSchema),
        z.lazy(
          () => AvailabilityUncheckedUpdateWithoutPotentialDateTimeInputSchema
        ),
      ]),
      create: z.union([
        z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema),
        z.lazy(
          () => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema
        ),
      ]),
    })
    .strict();

export const AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInput> =
  z
    .object({
      where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => AvailabilityUpdateWithoutPotentialDateTimeInputSchema),
        z.lazy(
          () => AvailabilityUncheckedUpdateWithoutPotentialDateTimeInputSchema
        ),
      ]),
    })
    .strict();

export const AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInput> =
  z
    .object({
      where: z.lazy(() => AvailabilityScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => AvailabilityUpdateManyMutationInputSchema),
        z.lazy(
          () =>
            AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeInputSchema
        ),
      ]),
    })
    .strict();

export const MembershipCreateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipCreateWithoutAvailabilitiesInput> =
  z
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

export const MembershipUncheckedCreateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateWithoutAvailabilitiesInput> =
  z
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

export const MembershipCreateOrConnectWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipCreateOrConnectWithoutAvailabilitiesInput> =
  z
    .object({
      where: z.lazy(() => MembershipWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema),
      ]),
    })
    .strict();

export const PotentialDateTimeCreateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateWithoutAvailabilitiesInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      dateTime: z.coerce.date().optional(),
      event: z.lazy(
        () => EventCreateNestedOneWithoutPotentialDateTimesInputSchema
      ),
    })
    .strict();

export const PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      eventId: z.string(),
      dateTime: z.coerce.date().optional(),
    })
    .strict();

export const PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInput> =
  z
    .object({
      where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema),
        z.lazy(
          () => PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema
        ),
      ]),
    })
    .strict();

export const MembershipUpsertWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipUpsertWithoutAvailabilitiesInput> =
  z
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

export const MembershipUpdateToOneWithWhereWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipUpdateToOneWithWhereWithoutAvailabilitiesInput> =
  z
    .object({
      where: z.lazy(() => MembershipWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => MembershipUpdateWithoutAvailabilitiesInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema),
      ]),
    })
    .strict();

export const MembershipUpdateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipUpdateWithoutAvailabilitiesInput> =
  z
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

export const MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateWithoutAvailabilitiesInput> =
  z
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

export const PotentialDateTimeUpsertWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeUpsertWithoutAvailabilitiesInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema),
        z.lazy(
          () => PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema
        ),
      ]),
      create: z.union([
        z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema),
        z.lazy(
          () => PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema
        ),
      ]),
      where: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
    })
    .strict();

export const PotentialDateTimeUpdateToOneWithWhereWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateToOneWithWhereWithoutAvailabilitiesInput> =
  z
    .object({
      where: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema),
        z.lazy(
          () => PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema
        ),
      ]),
    })
    .strict();

export const PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateWithoutAvailabilitiesInput> =
  z
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
        .lazy(
          () => EventUpdateOneRequiredWithoutPotentialDateTimesNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInput> =
  z
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

export const PersonCreateWithoutPostsInputSchema: z.ZodType<Prisma.PersonCreateWithoutPostsInput> =
  z
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

export const PersonUncheckedCreateWithoutPostsInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutPostsInput> =
  z
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
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema
        )
        .optional(),
      authoredNotifications: z
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonCreateOrConnectWithoutPostsInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutPostsInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PersonCreateWithoutPostsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutPostsInputSchema),
      ]),
    })
    .strict();

export const EventCreateWithoutPostsInputSchema: z.ZodType<Prisma.EventCreateWithoutPostsInput> =
  z
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

export const EventUncheckedCreateWithoutPostsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutPostsInput> =
  z
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
        .lazy(
          () =>
            PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema
        )
        .optional(),
      memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
      notifications: z
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutEventInputSchema
        )
        .optional(),
    })
    .strict();

export const EventCreateOrConnectWithoutPostsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutPostsInput> =
  z
    .object({
      where: z.lazy(() => EventWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => EventCreateWithoutPostsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutPostsInputSchema),
      ]),
    })
    .strict();

export const ReplyCreateWithoutPostInputSchema: z.ZodType<Prisma.ReplyCreateWithoutPostInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      text: z.string(),
      author: z.lazy(() => PersonCreateNestedOneWithoutRepliesInputSchema),
    })
    .strict();

export const ReplyUncheckedCreateWithoutPostInputSchema: z.ZodType<Prisma.ReplyUncheckedCreateWithoutPostInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      authorId: z.string(),
      text: z.string(),
    })
    .strict();

export const ReplyCreateOrConnectWithoutPostInputSchema: z.ZodType<Prisma.ReplyCreateOrConnectWithoutPostInput> =
  z
    .object({
      where: z.lazy(() => ReplyWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => ReplyCreateWithoutPostInputSchema),
        z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema),
      ]),
    })
    .strict();

export const ReplyCreateManyPostInputEnvelopeSchema: z.ZodType<Prisma.ReplyCreateManyPostInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => ReplyCreateManyPostInputSchema),
        z.lazy(() => ReplyCreateManyPostInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NotificationCreateWithoutPostInputSchema: z.ZodType<Prisma.NotificationCreateWithoutPostInput> =
  z
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
      person: z.lazy(
        () => PersonCreateNestedOneWithoutNotificationsInputSchema
      ),
      author: z
        .lazy(
          () => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema
        )
        .optional(),
      event: z
        .lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema)
        .optional(),
    })
    .strict();

export const NotificationUncheckedCreateWithoutPostInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateWithoutPostInput> =
  z
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

export const NotificationCreateOrConnectWithoutPostInputSchema: z.ZodType<Prisma.NotificationCreateOrConnectWithoutPostInput> =
  z
    .object({
      where: z.lazy(() => NotificationWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => NotificationCreateWithoutPostInputSchema),
        z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema),
      ]),
    })
    .strict();

export const NotificationCreateManyPostInputEnvelopeSchema: z.ZodType<Prisma.NotificationCreateManyPostInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => NotificationCreateManyPostInputSchema),
        z.lazy(() => NotificationCreateManyPostInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PersonUpsertWithoutPostsInputSchema: z.ZodType<Prisma.PersonUpsertWithoutPostsInput> =
  z
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

export const PersonUpdateToOneWithWhereWithoutPostsInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutPostsInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PersonUpdateWithoutPostsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutPostsInputSchema),
      ]),
    })
    .strict();

export const PersonUpdateWithoutPostsInputSchema: z.ZodType<Prisma.PersonUpdateWithoutPostsInput> =
  z
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

export const PersonUncheckedUpdateWithoutPostsInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutPostsInput> =
  z
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
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema
        )
        .optional(),
      authoredNotifications: z
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const EventUpsertWithoutPostsInputSchema: z.ZodType<Prisma.EventUpsertWithoutPostsInput> =
  z
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

export const EventUpdateToOneWithWhereWithoutPostsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutPostsInput> =
  z
    .object({
      where: z.lazy(() => EventWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => EventUpdateWithoutPostsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutPostsInputSchema),
      ]),
    })
    .strict();

export const EventUpdateWithoutPostsInputSchema: z.ZodType<Prisma.EventUpdateWithoutPostsInput> =
  z
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

export const EventUncheckedUpdateWithoutPostsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutPostsInput> =
  z
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
        .lazy(
          () =>
            PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema
        )
        .optional(),
      memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
      notifications: z
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const ReplyUpsertWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.ReplyUpsertWithWhereUniqueWithoutPostInput> =
  z
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

export const ReplyUpdateWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.ReplyUpdateWithWhereUniqueWithoutPostInput> =
  z
    .object({
      where: z.lazy(() => ReplyWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => ReplyUpdateWithoutPostInputSchema),
        z.lazy(() => ReplyUncheckedUpdateWithoutPostInputSchema),
      ]),
    })
    .strict();

export const ReplyUpdateManyWithWhereWithoutPostInputSchema: z.ZodType<Prisma.ReplyUpdateManyWithWhereWithoutPostInput> =
  z
    .object({
      where: z.lazy(() => ReplyScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => ReplyUpdateManyMutationInputSchema),
        z.lazy(() => ReplyUncheckedUpdateManyWithoutPostInputSchema),
      ]),
    })
    .strict();

export const NotificationUpsertWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.NotificationUpsertWithWhereUniqueWithoutPostInput> =
  z
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

export const NotificationUpdateWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.NotificationUpdateWithWhereUniqueWithoutPostInput> =
  z
    .object({
      where: z.lazy(() => NotificationWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => NotificationUpdateWithoutPostInputSchema),
        z.lazy(() => NotificationUncheckedUpdateWithoutPostInputSchema),
      ]),
    })
    .strict();

export const NotificationUpdateManyWithWhereWithoutPostInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithWhereWithoutPostInput> =
  z
    .object({
      where: z.lazy(() => NotificationScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => NotificationUpdateManyMutationInputSchema),
        z.lazy(() => NotificationUncheckedUpdateManyWithoutPostInputSchema),
      ]),
    })
    .strict();

export const PersonCreateWithoutRepliesInputSchema: z.ZodType<Prisma.PersonCreateWithoutRepliesInput> =
  z
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

export const PersonUncheckedCreateWithoutRepliesInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutRepliesInput> =
  z
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
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema
        )
        .optional(),
      authoredNotifications: z
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonCreateOrConnectWithoutRepliesInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutRepliesInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PersonCreateWithoutRepliesInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutRepliesInputSchema),
      ]),
    })
    .strict();

export const PostCreateWithoutRepliesInputSchema: z.ZodType<Prisma.PostCreateWithoutRepliesInput> =
  z
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

export const PostUncheckedCreateWithoutRepliesInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutRepliesInput> =
  z
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

export const PostCreateOrConnectWithoutRepliesInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutRepliesInput> =
  z
    .object({
      where: z.lazy(() => PostWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PostCreateWithoutRepliesInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutRepliesInputSchema),
      ]),
    })
    .strict();

export const PersonUpsertWithoutRepliesInputSchema: z.ZodType<Prisma.PersonUpsertWithoutRepliesInput> =
  z
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

export const PersonUpdateToOneWithWhereWithoutRepliesInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutRepliesInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PersonUpdateWithoutRepliesInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutRepliesInputSchema),
      ]),
    })
    .strict();

export const PersonUpdateWithoutRepliesInputSchema: z.ZodType<Prisma.PersonUpdateWithoutRepliesInput> =
  z
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

export const PersonUncheckedUpdateWithoutRepliesInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutRepliesInput> =
  z
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
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema
        )
        .optional(),
      authoredNotifications: z
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PostUpsertWithoutRepliesInputSchema: z.ZodType<Prisma.PostUpsertWithoutRepliesInput> =
  z
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

export const PostUpdateToOneWithWhereWithoutRepliesInputSchema: z.ZodType<Prisma.PostUpdateToOneWithWhereWithoutRepliesInput> =
  z
    .object({
      where: z.lazy(() => PostWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PostUpdateWithoutRepliesInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutRepliesInputSchema),
      ]),
    })
    .strict();

export const PostUpdateWithoutRepliesInputSchema: z.ZodType<Prisma.PostUpdateWithoutRepliesInput> =
  z
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

export const PostUncheckedUpdateWithoutRepliesInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutRepliesInput> =
  z
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

export const EventCreateWithoutInvitesInputSchema: z.ZodType<Prisma.EventCreateWithoutInvitesInput> =
  z
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

export const EventUncheckedCreateWithoutInvitesInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutInvitesInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      title: z.string(),
      description: z.string().optional(),
      location: z.string().optional(),
      chosenDateTime: z.coerce.date().optional().nullable(),
      potentialDateTimes: z
        .lazy(
          () =>
            PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema
        )
        .optional(),
      posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
      memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
      notifications: z
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutEventInputSchema
        )
        .optional(),
    })
    .strict();

export const EventCreateOrConnectWithoutInvitesInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutInvitesInput> =
  z
    .object({
      where: z.lazy(() => EventWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => EventCreateWithoutInvitesInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutInvitesInputSchema),
      ]),
    })
    .strict();

export const MembershipCreateWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipCreateWithoutInvitesInput> =
  z
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

export const MembershipUncheckedCreateWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateWithoutInvitesInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      personId: z.string(),
      eventId: z.string(),
      role: z.lazy(() => RoleSchema).optional(),
      rsvpStatus: z.lazy(() => StatusSchema).optional(),
      availabilities: z
        .lazy(
          () =>
            AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema
        )
        .optional(),
    })
    .strict();

export const MembershipCreateOrConnectWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipCreateOrConnectWithoutInvitesInput> =
  z
    .object({
      where: z.lazy(() => MembershipWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => MembershipCreateWithoutInvitesInputSchema),
        z.lazy(() => MembershipUncheckedCreateWithoutInvitesInputSchema),
      ]),
    })
    .strict();

export const EventUpsertWithoutInvitesInputSchema: z.ZodType<Prisma.EventUpsertWithoutInvitesInput> =
  z
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

export const EventUpdateToOneWithWhereWithoutInvitesInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutInvitesInput> =
  z
    .object({
      where: z.lazy(() => EventWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => EventUpdateWithoutInvitesInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutInvitesInputSchema),
      ]),
    })
    .strict();

export const EventUpdateWithoutInvitesInputSchema: z.ZodType<Prisma.EventUpdateWithoutInvitesInput> =
  z
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

export const EventUncheckedUpdateWithoutInvitesInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutInvitesInput> =
  z
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
        .lazy(
          () =>
            PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema
        )
        .optional(),
      posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
      memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
      notifications: z
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const MembershipUpsertWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipUpsertWithoutInvitesInput> =
  z
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

export const MembershipUpdateToOneWithWhereWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipUpdateToOneWithWhereWithoutInvitesInput> =
  z
    .object({
      where: z.lazy(() => MembershipWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => MembershipUpdateWithoutInvitesInputSchema),
        z.lazy(() => MembershipUncheckedUpdateWithoutInvitesInputSchema),
      ]),
    })
    .strict();

export const MembershipUpdateWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipUpdateWithoutInvitesInput> =
  z
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

export const MembershipUncheckedUpdateWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateWithoutInvitesInput> =
  z
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
        .lazy(
          () =>
            AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonCreateWithoutNotificationsInput> =
  z
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

export const PersonUncheckedCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutNotificationsInput> =
  z
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
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonCreateOrConnectWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutNotificationsInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PersonCreateWithoutNotificationsInputSchema),
        z.lazy(() => PersonUncheckedCreateWithoutNotificationsInputSchema),
      ]),
    })
    .strict();

export const PersonCreateWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonCreateWithoutAuthoredNotificationsInput> =
  z
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

export const PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutAuthoredNotificationsInput> =
  z
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
        .lazy(
          () => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonCreateOrConnectWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutAuthoredNotificationsInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema),
        z.lazy(
          () => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema
        ),
      ]),
    })
    .strict();

export const EventCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.EventCreateWithoutNotificationsInput> =
  z
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

export const EventUncheckedCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutNotificationsInput> =
  z
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
        .lazy(
          () =>
            PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema
        )
        .optional(),
      posts: z
        .lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
      memberships: z
        .lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema)
        .optional(),
    })
    .strict();

export const EventCreateOrConnectWithoutNotificationsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutNotificationsInput> =
  z
    .object({
      where: z.lazy(() => EventWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => EventCreateWithoutNotificationsInputSchema),
        z.lazy(() => EventUncheckedCreateWithoutNotificationsInputSchema),
      ]),
    })
    .strict();

export const PostCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.PostCreateWithoutNotificationsInput> =
  z
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

export const PostUncheckedCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutNotificationsInput> =
  z
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

export const PostCreateOrConnectWithoutNotificationsInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutNotificationsInput> =
  z
    .object({
      where: z.lazy(() => PostWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PostCreateWithoutNotificationsInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutNotificationsInputSchema),
      ]),
    })
    .strict();

export const PersonUpsertWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonUpsertWithoutNotificationsInput> =
  z
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

export const PersonUpdateToOneWithWhereWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutNotificationsInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PersonUpdateWithoutNotificationsInputSchema),
        z.lazy(() => PersonUncheckedUpdateWithoutNotificationsInputSchema),
      ]),
    })
    .strict();

export const PersonUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonUpdateWithoutNotificationsInput> =
  z
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

export const PersonUncheckedUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutNotificationsInput> =
  z
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
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PersonUpsertWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonUpsertWithoutAuthoredNotificationsInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => PersonUpdateWithoutAuthoredNotificationsInputSchema),
        z.lazy(
          () => PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema
        ),
      ]),
      create: z.union([
        z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema),
        z.lazy(
          () => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema
        ),
      ]),
      where: z.lazy(() => PersonWhereInputSchema).optional(),
    })
    .strict();

export const PersonUpdateToOneWithWhereWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutAuthoredNotificationsInput> =
  z
    .object({
      where: z.lazy(() => PersonWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PersonUpdateWithoutAuthoredNotificationsInputSchema),
        z.lazy(
          () => PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema
        ),
      ]),
    })
    .strict();

export const PersonUpdateWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonUpdateWithoutAuthoredNotificationsInput> =
  z
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

export const PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutAuthoredNotificationsInput> =
  z
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
        .lazy(
          () => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema
        )
        .optional(),
      settings: z
        .lazy(
          () => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const EventUpsertWithoutNotificationsInputSchema: z.ZodType<Prisma.EventUpsertWithoutNotificationsInput> =
  z
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

export const EventUpdateToOneWithWhereWithoutNotificationsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutNotificationsInput> =
  z
    .object({
      where: z.lazy(() => EventWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => EventUpdateWithoutNotificationsInputSchema),
        z.lazy(() => EventUncheckedUpdateWithoutNotificationsInputSchema),
      ]),
    })
    .strict();

export const EventUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.EventUpdateWithoutNotificationsInput> =
  z
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

export const EventUncheckedUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutNotificationsInput> =
  z
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
        .lazy(
          () =>
            PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema
        )
        .optional(),
      posts: z
        .lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
      memberships: z
        .lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema)
        .optional(),
    })
    .strict();

export const PostUpsertWithoutNotificationsInputSchema: z.ZodType<Prisma.PostUpsertWithoutNotificationsInput> =
  z
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

export const PostUpdateToOneWithWhereWithoutNotificationsInputSchema: z.ZodType<Prisma.PostUpdateToOneWithWhereWithoutNotificationsInput> =
  z
    .object({
      where: z.lazy(() => PostWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PostUpdateWithoutNotificationsInputSchema),
        z.lazy(() => PostUncheckedUpdateWithoutNotificationsInputSchema),
      ]),
    })
    .strict();

export const PostUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.PostUpdateWithoutNotificationsInput> =
  z
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

export const PostUncheckedUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutNotificationsInput> =
  z
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

export const PersonSettingsCreateWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsCreateWithoutNotificationMethodsInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      person: z.lazy(() => PersonCreateNestedOneWithoutSettingsInputSchema),
    })
    .strict();

export const PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedCreateWithoutNotificationMethodsInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      personId: z.string(),
    })
    .strict();

export const PersonSettingsCreateOrConnectWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsCreateOrConnectWithoutNotificationMethodsInput> =
  z
    .object({
      where: z.lazy(() => PersonSettingsWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PersonSettingsCreateWithoutNotificationMethodsInputSchema),
        z.lazy(
          () =>
            PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationSettingCreateWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingCreateWithoutNotificationMethodInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      notificationType: z.lazy(() => NotificationTypeSchema),
      enabled: z.boolean().optional(),
    })
    .strict();

export const NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedCreateWithoutNotificationMethodInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      notificationType: z.lazy(() => NotificationTypeSchema),
      enabled: z.boolean().optional(),
    })
    .strict();

export const NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingCreateOrConnectWithoutNotificationMethodInput> =
  z
    .object({
      where: z.lazy(() => NotificationSettingWhereUniqueInputSchema),
      create: z.union([
        z.lazy(
          () => NotificationSettingCreateWithoutNotificationMethodInputSchema
        ),
        z.lazy(
          () =>
            NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema: z.ZodType<Prisma.NotificationSettingCreateManyNotificationMethodInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(
          () => NotificationSettingCreateManyNotificationMethodInputSchema
        ),
        z
          .lazy(
            () => NotificationSettingCreateManyNotificationMethodInputSchema
          )
          .array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PersonSettingsUpsertWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsUpsertWithoutNotificationMethodsInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => PersonSettingsUpdateWithoutNotificationMethodsInputSchema),
        z.lazy(
          () =>
            PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema
        ),
      ]),
      create: z.union([
        z.lazy(() => PersonSettingsCreateWithoutNotificationMethodsInputSchema),
        z.lazy(
          () =>
            PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema
        ),
      ]),
      where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
    })
    .strict();

export const PersonSettingsUpdateToOneWithWhereWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsUpdateToOneWithWhereWithoutNotificationMethodsInput> =
  z
    .object({
      where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PersonSettingsUpdateWithoutNotificationMethodsInputSchema),
        z.lazy(
          () =>
            PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema
        ),
      ]),
    })
    .strict();

export const PersonSettingsUpdateWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsUpdateWithoutNotificationMethodsInput> =
  z
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

export const PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedUpdateWithoutNotificationMethodsInput> =
  z
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

export const NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInput> =
  z
    .object({
      where: z.lazy(() => NotificationSettingWhereUniqueInputSchema),
      update: z.union([
        z.lazy(
          () => NotificationSettingUpdateWithoutNotificationMethodInputSchema
        ),
        z.lazy(
          () =>
            NotificationSettingUncheckedUpdateWithoutNotificationMethodInputSchema
        ),
      ]),
      create: z.union([
        z.lazy(
          () => NotificationSettingCreateWithoutNotificationMethodInputSchema
        ),
        z.lazy(
          () =>
            NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInput> =
  z
    .object({
      where: z.lazy(() => NotificationSettingWhereUniqueInputSchema),
      data: z.union([
        z.lazy(
          () => NotificationSettingUpdateWithoutNotificationMethodInputSchema
        ),
        z.lazy(
          () =>
            NotificationSettingUncheckedUpdateWithoutNotificationMethodInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInput> =
  z
    .object({
      where: z.lazy(() => NotificationSettingScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => NotificationSettingUpdateManyMutationInputSchema),
        z.lazy(
          () =>
            NotificationSettingUncheckedUpdateManyWithoutNotificationMethodInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationSettingScalarWhereInputSchema: z.ZodType<Prisma.NotificationSettingScalarWhereInput> =
  z
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

export const NotificationMethodCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodCreateWithoutNotificationsInput> =
  z
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
      settings: z.lazy(
        () => PersonSettingsCreateNestedOneWithoutNotificationMethodsInputSchema
      ),
    })
    .strict();

export const NotificationMethodUncheckedCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedCreateWithoutNotificationsInput> =
  z
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

export const NotificationMethodCreateOrConnectWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodCreateOrConnectWithoutNotificationsInput> =
  z
    .object({
      where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema),
        z.lazy(
          () => NotificationMethodUncheckedCreateWithoutNotificationsInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationMethodUpsertWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodUpsertWithoutNotificationsInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => NotificationMethodUpdateWithoutNotificationsInputSchema),
        z.lazy(
          () => NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema
        ),
      ]),
      create: z.union([
        z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema),
        z.lazy(
          () => NotificationMethodUncheckedCreateWithoutNotificationsInputSchema
        ),
      ]),
      where: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
    })
    .strict();

export const NotificationMethodUpdateToOneWithWhereWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodUpdateToOneWithWhereWithoutNotificationsInput> =
  z
    .object({
      where: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => NotificationMethodUpdateWithoutNotificationsInputSchema),
        z.lazy(
          () => NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema
        ),
      ]),
    })
    .strict();

export const NotificationMethodUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodUpdateWithoutNotificationsInput> =
  z
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
          z.lazy(
            () => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema
          ),
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
          z.lazy(
            () => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema
          ),
        ])
        .optional()
        .nullable(),
      settings: z
        .lazy(
          () =>
            PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateWithoutNotificationsInput> =
  z
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
          z.lazy(
            () => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema
          ),
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
          z.lazy(
            () => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema
          ),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const MembershipCreateManyPersonInputSchema: z.ZodType<Prisma.MembershipCreateManyPersonInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      eventId: z.string(),
      role: z.lazy(() => RoleSchema).optional(),
      rsvpStatus: z.lazy(() => StatusSchema).optional(),
    })
    .strict();

export const PostCreateManyAuthorInputSchema: z.ZodType<Prisma.PostCreateManyAuthorInput> =
  z
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

export const ReplyCreateManyAuthorInputSchema: z.ZodType<Prisma.ReplyCreateManyAuthorInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      postId: z.string(),
      text: z.string(),
    })
    .strict();

export const NotificationCreateManyPersonInputSchema: z.ZodType<Prisma.NotificationCreateManyPersonInput> =
  z
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

export const NotificationCreateManyAuthorInputSchema: z.ZodType<Prisma.NotificationCreateManyAuthorInput> =
  z
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

export const MembershipUpdateWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUpdateWithoutPersonInput> =
  z
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

export const MembershipUncheckedUpdateWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateWithoutPersonInput> =
  z
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
        .lazy(
          () =>
            AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema
        )
        .optional(),
      invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
    })
    .strict();

export const MembershipUncheckedUpdateManyWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateManyWithoutPersonInput> =
  z
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

export const PostUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpdateWithoutAuthorInput> =
  z
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

export const PostUncheckedUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutAuthorInput> =
  z
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

export const PostUncheckedUpdateManyWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutAuthorInput> =
  z
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

export const ReplyUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUpdateWithoutAuthorInput> =
  z
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

export const ReplyUncheckedUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateWithoutAuthorInput> =
  z
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

export const ReplyUncheckedUpdateManyWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateManyWithoutAuthorInput> =
  z
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

export const NotificationUpdateWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUpdateWithoutPersonInput> =
  z
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
        .lazy(
          () => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema
        )
        .optional(),
      event: z
        .lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
      post: z
        .lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
    })
    .strict();

export const NotificationUncheckedUpdateWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateWithoutPersonInput> =
  z
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

export const NotificationUncheckedUpdateManyWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutPersonInput> =
  z
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

export const NotificationUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUpdateWithoutAuthorInput> =
  z
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
        .lazy(
          () => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema
        )
        .optional(),
      event: z
        .lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
      post: z
        .lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
    })
    .strict();

export const NotificationUncheckedUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateWithoutAuthorInput> =
  z
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

export const NotificationUncheckedUpdateManyWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutAuthorInput> =
  z
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

export const NotificationMethodCreateManySettingsInputSchema: z.ZodType<Prisma.NotificationMethodCreateManySettingsInput> =
  z
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

export const NotificationMethodUpdateWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUpdateWithoutSettingsInput> =
  z
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
          z.lazy(
            () => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema
          ),
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
          z.lazy(
            () => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema
          ),
        ])
        .optional()
        .nullable(),
      notifications: z
        .lazy(
          () =>
            NotificationSettingUpdateManyWithoutNotificationMethodNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationMethodUncheckedUpdateWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateWithoutSettingsInput> =
  z
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
          z.lazy(
            () => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema
          ),
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
          z.lazy(
            () => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema
          ),
        ])
        .optional()
        .nullable(),
      notifications: z
        .lazy(
          () =>
            NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const NotificationMethodUncheckedUpdateManyWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateManyWithoutSettingsInput> =
  z
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
          z.lazy(
            () => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema
          ),
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
          z.lazy(
            () => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema
          ),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const InviteCreateManyEventInputSchema: z.ZodType<Prisma.InviteCreateManyEventInput> =
  z
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

export const PotentialDateTimeCreateManyEventInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateManyEventInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      dateTime: z.coerce.date().optional(),
    })
    .strict();

export const PostCreateManyEventInputSchema: z.ZodType<Prisma.PostCreateManyEventInput> =
  z
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

export const MembershipCreateManyEventInputSchema: z.ZodType<Prisma.MembershipCreateManyEventInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      personId: z.string(),
      role: z.lazy(() => RoleSchema).optional(),
      rsvpStatus: z.lazy(() => StatusSchema).optional(),
    })
    .strict();

export const NotificationCreateManyEventInputSchema: z.ZodType<Prisma.NotificationCreateManyEventInput> =
  z
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

export const InviteUpdateWithoutEventInputSchema: z.ZodType<Prisma.InviteUpdateWithoutEventInput> =
  z
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

export const InviteUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateWithoutEventInput> =
  z
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

export const InviteUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateManyWithoutEventInput> =
  z
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

export const PotentialDateTimeUpdateWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateWithoutEventInput> =
  z
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
        .lazy(
          () => AvailabilityUpdateManyWithoutPotentialDateTimeNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PotentialDateTimeUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateWithoutEventInput> =
  z
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
        .lazy(
          () =>
            AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const PotentialDateTimeUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateManyWithoutEventInput> =
  z
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

export const PostUpdateWithoutEventInputSchema: z.ZodType<Prisma.PostUpdateWithoutEventInput> =
  z
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

export const PostUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutEventInput> =
  z
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

export const PostUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutEventInput> =
  z
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

export const MembershipUpdateWithoutEventInputSchema: z.ZodType<Prisma.MembershipUpdateWithoutEventInput> =
  z
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

export const MembershipUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateWithoutEventInput> =
  z
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
        .lazy(
          () =>
            AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema
        )
        .optional(),
      invites: z
        .lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema)
        .optional(),
    })
    .strict();

export const MembershipUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateManyWithoutEventInput> =
  z
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

export const NotificationUpdateWithoutEventInputSchema: z.ZodType<Prisma.NotificationUpdateWithoutEventInput> =
  z
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
        .lazy(
          () => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema
        )
        .optional(),
      author: z
        .lazy(
          () => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema
        )
        .optional(),
      post: z
        .lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
    })
    .strict();

export const NotificationUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateWithoutEventInput> =
  z
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

export const NotificationUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutEventInput> =
  z
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

export const AvailabilityCreateManyMembershipInputSchema: z.ZodType<Prisma.AvailabilityCreateManyMembershipInput> =
  z
    .object({
      potentialDateTimeId: z.string(),
      status: z.lazy(() => StatusSchema),
    })
    .strict();

export const InviteCreateManyCreatedByInputSchema: z.ZodType<Prisma.InviteCreateManyCreatedByInput> =
  z
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

export const AvailabilityUpdateWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUpdateWithoutMembershipInput> =
  z
    .object({
      status: z
        .union([
          z.lazy(() => StatusSchema),
          z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      potentialDateTime: z
        .lazy(
          () =>
            PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const AvailabilityUncheckedUpdateWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateWithoutMembershipInput> =
  z
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

export const AvailabilityUncheckedUpdateManyWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateManyWithoutMembershipInput> =
  z
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

export const InviteUpdateWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUpdateWithoutCreatedByInput> =
  z
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

export const InviteUncheckedUpdateWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateWithoutCreatedByInput> =
  z
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

export const InviteUncheckedUpdateManyWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateManyWithoutCreatedByInput> =
  z
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

export const AvailabilityCreateManyPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityCreateManyPotentialDateTimeInput> =
  z
    .object({
      membershipId: z.string(),
      status: z.lazy(() => StatusSchema),
    })
    .strict();

export const AvailabilityUpdateWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUpdateWithoutPotentialDateTimeInput> =
  z
    .object({
      status: z
        .union([
          z.lazy(() => StatusSchema),
          z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      membership: z
        .lazy(
          () =>
            MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema
        )
        .optional(),
    })
    .strict();

export const AvailabilityUncheckedUpdateWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateWithoutPotentialDateTimeInput> =
  z
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

export const AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeInput> =
  z
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

export const ReplyCreateManyPostInputSchema: z.ZodType<Prisma.ReplyCreateManyPostInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      authorId: z.string(),
      text: z.string(),
    })
    .strict();

export const NotificationCreateManyPostInputSchema: z.ZodType<Prisma.NotificationCreateManyPostInput> =
  z
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

export const ReplyUpdateWithoutPostInputSchema: z.ZodType<Prisma.ReplyUpdateWithoutPostInput> =
  z
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

export const ReplyUncheckedUpdateWithoutPostInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateWithoutPostInput> =
  z
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

export const ReplyUncheckedUpdateManyWithoutPostInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateManyWithoutPostInput> =
  z
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

export const NotificationUpdateWithoutPostInputSchema: z.ZodType<Prisma.NotificationUpdateWithoutPostInput> =
  z
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
        .lazy(
          () => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema
        )
        .optional(),
      author: z
        .lazy(
          () => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema
        )
        .optional(),
      event: z
        .lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema)
        .optional(),
    })
    .strict();

export const NotificationUncheckedUpdateWithoutPostInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateWithoutPostInput> =
  z
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

export const NotificationUncheckedUpdateManyWithoutPostInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutPostInput> =
  z
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

export const NotificationSettingCreateManyNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingCreateManyNotificationMethodInput> =
  z
    .object({
      id: z.string().cuid().optional(),
      notificationType: z.lazy(() => NotificationTypeSchema),
      enabled: z.boolean().optional(),
    })
    .strict();

export const NotificationSettingUpdateWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUpdateWithoutNotificationMethodInput> =
  z
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

export const NotificationSettingUncheckedUpdateWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedUpdateWithoutNotificationMethodInput> =
  z
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

export const NotificationSettingUncheckedUpdateManyWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedUpdateManyWithoutNotificationMethodInput> =
  z
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

export const PersonFindFirstArgsSchema: z.ZodType<Prisma.PersonFindFirstArgs> =
  z
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

export const PersonFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PersonFindFirstOrThrowArgs> =
  z
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

export const PersonFindManyArgsSchema: z.ZodType<Prisma.PersonFindManyArgs> = z
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

export const PersonAggregateArgsSchema: z.ZodType<Prisma.PersonAggregateArgs> =
  z
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

export const PersonGroupByArgsSchema: z.ZodType<Prisma.PersonGroupByArgs> = z
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

export const PersonFindUniqueArgsSchema: z.ZodType<Prisma.PersonFindUniqueArgs> =
  z
    .object({
      select: PersonSelectSchema.optional(),
      include: PersonIncludeSchema.optional(),
      where: PersonWhereUniqueInputSchema,
    })
    .strict();

export const PersonFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PersonFindUniqueOrThrowArgs> =
  z
    .object({
      select: PersonSelectSchema.optional(),
      include: PersonIncludeSchema.optional(),
      where: PersonWhereUniqueInputSchema,
    })
    .strict();

export const PersonSettingsFindFirstArgsSchema: z.ZodType<Prisma.PersonSettingsFindFirstArgs> =
  z
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

export const PersonSettingsFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PersonSettingsFindFirstOrThrowArgs> =
  z
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

export const PersonSettingsFindManyArgsSchema: z.ZodType<Prisma.PersonSettingsFindManyArgs> =
  z
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

export const PersonSettingsAggregateArgsSchema: z.ZodType<Prisma.PersonSettingsAggregateArgs> =
  z
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

export const PersonSettingsGroupByArgsSchema: z.ZodType<Prisma.PersonSettingsGroupByArgs> =
  z
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

export const PersonSettingsFindUniqueArgsSchema: z.ZodType<Prisma.PersonSettingsFindUniqueArgs> =
  z
    .object({
      select: PersonSettingsSelectSchema.optional(),
      include: PersonSettingsIncludeSchema.optional(),
      where: PersonSettingsWhereUniqueInputSchema,
    })
    .strict();

export const PersonSettingsFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PersonSettingsFindUniqueOrThrowArgs> =
  z
    .object({
      select: PersonSettingsSelectSchema.optional(),
      include: PersonSettingsIncludeSchema.optional(),
      where: PersonSettingsWhereUniqueInputSchema,
    })
    .strict();

export const EventFindFirstArgsSchema: z.ZodType<Prisma.EventFindFirstArgs> = z
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

export const EventFindFirstOrThrowArgsSchema: z.ZodType<Prisma.EventFindFirstOrThrowArgs> =
  z
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

export const EventFindManyArgsSchema: z.ZodType<Prisma.EventFindManyArgs> = z
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

export const EventAggregateArgsSchema: z.ZodType<Prisma.EventAggregateArgs> = z
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

export const EventGroupByArgsSchema: z.ZodType<Prisma.EventGroupByArgs> = z
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

export const EventFindUniqueArgsSchema: z.ZodType<Prisma.EventFindUniqueArgs> =
  z
    .object({
      select: EventSelectSchema.optional(),
      include: EventIncludeSchema.optional(),
      where: EventWhereUniqueInputSchema,
    })
    .strict();

export const EventFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.EventFindUniqueOrThrowArgs> =
  z
    .object({
      select: EventSelectSchema.optional(),
      include: EventIncludeSchema.optional(),
      where: EventWhereUniqueInputSchema,
    })
    .strict();

export const MembershipFindFirstArgsSchema: z.ZodType<Prisma.MembershipFindFirstArgs> =
  z
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

export const MembershipFindFirstOrThrowArgsSchema: z.ZodType<Prisma.MembershipFindFirstOrThrowArgs> =
  z
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

export const MembershipFindManyArgsSchema: z.ZodType<Prisma.MembershipFindManyArgs> =
  z
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

export const MembershipAggregateArgsSchema: z.ZodType<Prisma.MembershipAggregateArgs> =
  z
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

export const MembershipGroupByArgsSchema: z.ZodType<Prisma.MembershipGroupByArgs> =
  z
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

export const MembershipFindUniqueArgsSchema: z.ZodType<Prisma.MembershipFindUniqueArgs> =
  z
    .object({
      select: MembershipSelectSchema.optional(),
      include: MembershipIncludeSchema.optional(),
      where: MembershipWhereUniqueInputSchema,
    })
    .strict();

export const MembershipFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.MembershipFindUniqueOrThrowArgs> =
  z
    .object({
      select: MembershipSelectSchema.optional(),
      include: MembershipIncludeSchema.optional(),
      where: MembershipWhereUniqueInputSchema,
    })
    .strict();

export const PotentialDateTimeFindFirstArgsSchema: z.ZodType<Prisma.PotentialDateTimeFindFirstArgs> =
  z
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

export const PotentialDateTimeFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PotentialDateTimeFindFirstOrThrowArgs> =
  z
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

export const PotentialDateTimeFindManyArgsSchema: z.ZodType<Prisma.PotentialDateTimeFindManyArgs> =
  z
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

export const PotentialDateTimeAggregateArgsSchema: z.ZodType<Prisma.PotentialDateTimeAggregateArgs> =
  z
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

export const PotentialDateTimeGroupByArgsSchema: z.ZodType<Prisma.PotentialDateTimeGroupByArgs> =
  z
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

export const PotentialDateTimeFindUniqueArgsSchema: z.ZodType<Prisma.PotentialDateTimeFindUniqueArgs> =
  z
    .object({
      select: PotentialDateTimeSelectSchema.optional(),
      include: PotentialDateTimeIncludeSchema.optional(),
      where: PotentialDateTimeWhereUniqueInputSchema,
    })
    .strict();

export const PotentialDateTimeFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PotentialDateTimeFindUniqueOrThrowArgs> =
  z
    .object({
      select: PotentialDateTimeSelectSchema.optional(),
      include: PotentialDateTimeIncludeSchema.optional(),
      where: PotentialDateTimeWhereUniqueInputSchema,
    })
    .strict();

export const AvailabilityFindFirstArgsSchema: z.ZodType<Prisma.AvailabilityFindFirstArgs> =
  z
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

export const AvailabilityFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AvailabilityFindFirstOrThrowArgs> =
  z
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

export const AvailabilityFindManyArgsSchema: z.ZodType<Prisma.AvailabilityFindManyArgs> =
  z
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

export const AvailabilityAggregateArgsSchema: z.ZodType<Prisma.AvailabilityAggregateArgs> =
  z
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

export const AvailabilityGroupByArgsSchema: z.ZodType<Prisma.AvailabilityGroupByArgs> =
  z
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

export const AvailabilityFindUniqueArgsSchema: z.ZodType<Prisma.AvailabilityFindUniqueArgs> =
  z
    .object({
      select: AvailabilitySelectSchema.optional(),
      include: AvailabilityIncludeSchema.optional(),
      where: AvailabilityWhereUniqueInputSchema,
    })
    .strict();

export const AvailabilityFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AvailabilityFindUniqueOrThrowArgs> =
  z
    .object({
      select: AvailabilitySelectSchema.optional(),
      include: AvailabilityIncludeSchema.optional(),
      where: AvailabilityWhereUniqueInputSchema,
    })
    .strict();

export const PostFindFirstArgsSchema: z.ZodType<Prisma.PostFindFirstArgs> = z
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

export const PostFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PostFindFirstOrThrowArgs> =
  z
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

export const PostFindManyArgsSchema: z.ZodType<Prisma.PostFindManyArgs> = z
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

export const PostAggregateArgsSchema: z.ZodType<Prisma.PostAggregateArgs> = z
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

export const PostGroupByArgsSchema: z.ZodType<Prisma.PostGroupByArgs> = z
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

export const PostFindUniqueArgsSchema: z.ZodType<Prisma.PostFindUniqueArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereUniqueInputSchema,
  })
  .strict();

export const PostFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PostFindUniqueOrThrowArgs> =
  z
    .object({
      select: PostSelectSchema.optional(),
      include: PostIncludeSchema.optional(),
      where: PostWhereUniqueInputSchema,
    })
    .strict();

export const ReplyFindFirstArgsSchema: z.ZodType<Prisma.ReplyFindFirstArgs> = z
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

export const ReplyFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ReplyFindFirstOrThrowArgs> =
  z
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

export const ReplyFindManyArgsSchema: z.ZodType<Prisma.ReplyFindManyArgs> = z
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

export const ReplyAggregateArgsSchema: z.ZodType<Prisma.ReplyAggregateArgs> = z
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

export const ReplyGroupByArgsSchema: z.ZodType<Prisma.ReplyGroupByArgs> = z
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

export const ReplyFindUniqueArgsSchema: z.ZodType<Prisma.ReplyFindUniqueArgs> =
  z
    .object({
      select: ReplySelectSchema.optional(),
      include: ReplyIncludeSchema.optional(),
      where: ReplyWhereUniqueInputSchema,
    })
    .strict();

export const ReplyFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ReplyFindUniqueOrThrowArgs> =
  z
    .object({
      select: ReplySelectSchema.optional(),
      include: ReplyIncludeSchema.optional(),
      where: ReplyWhereUniqueInputSchema,
    })
    .strict();

export const InviteFindFirstArgsSchema: z.ZodType<Prisma.InviteFindFirstArgs> =
  z
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

export const InviteFindFirstOrThrowArgsSchema: z.ZodType<Prisma.InviteFindFirstOrThrowArgs> =
  z
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

export const InviteFindManyArgsSchema: z.ZodType<Prisma.InviteFindManyArgs> = z
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

export const InviteAggregateArgsSchema: z.ZodType<Prisma.InviteAggregateArgs> =
  z
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

export const InviteGroupByArgsSchema: z.ZodType<Prisma.InviteGroupByArgs> = z
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

export const InviteFindUniqueArgsSchema: z.ZodType<Prisma.InviteFindUniqueArgs> =
  z
    .object({
      select: InviteSelectSchema.optional(),
      include: InviteIncludeSchema.optional(),
      where: InviteWhereUniqueInputSchema,
    })
    .strict();

export const InviteFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.InviteFindUniqueOrThrowArgs> =
  z
    .object({
      select: InviteSelectSchema.optional(),
      include: InviteIncludeSchema.optional(),
      where: InviteWhereUniqueInputSchema,
    })
    .strict();

export const NotificationFindFirstArgsSchema: z.ZodType<Prisma.NotificationFindFirstArgs> =
  z
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

export const NotificationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.NotificationFindFirstOrThrowArgs> =
  z
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

export const NotificationFindManyArgsSchema: z.ZodType<Prisma.NotificationFindManyArgs> =
  z
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

export const NotificationAggregateArgsSchema: z.ZodType<Prisma.NotificationAggregateArgs> =
  z
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

export const NotificationGroupByArgsSchema: z.ZodType<Prisma.NotificationGroupByArgs> =
  z
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

export const NotificationFindUniqueArgsSchema: z.ZodType<Prisma.NotificationFindUniqueArgs> =
  z
    .object({
      select: NotificationSelectSchema.optional(),
      include: NotificationIncludeSchema.optional(),
      where: NotificationWhereUniqueInputSchema,
    })
    .strict();

export const NotificationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.NotificationFindUniqueOrThrowArgs> =
  z
    .object({
      select: NotificationSelectSchema.optional(),
      include: NotificationIncludeSchema.optional(),
      where: NotificationWhereUniqueInputSchema,
    })
    .strict();

export const NotificationMethodFindFirstArgsSchema: z.ZodType<Prisma.NotificationMethodFindFirstArgs> =
  z
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

export const NotificationMethodFindFirstOrThrowArgsSchema: z.ZodType<Prisma.NotificationMethodFindFirstOrThrowArgs> =
  z
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

export const NotificationMethodFindManyArgsSchema: z.ZodType<Prisma.NotificationMethodFindManyArgs> =
  z
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

export const NotificationMethodAggregateArgsSchema: z.ZodType<Prisma.NotificationMethodAggregateArgs> =
  z
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

export const NotificationMethodGroupByArgsSchema: z.ZodType<Prisma.NotificationMethodGroupByArgs> =
  z
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

export const NotificationMethodFindUniqueArgsSchema: z.ZodType<Prisma.NotificationMethodFindUniqueArgs> =
  z
    .object({
      select: NotificationMethodSelectSchema.optional(),
      include: NotificationMethodIncludeSchema.optional(),
      where: NotificationMethodWhereUniqueInputSchema,
    })
    .strict();

export const NotificationMethodFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.NotificationMethodFindUniqueOrThrowArgs> =
  z
    .object({
      select: NotificationMethodSelectSchema.optional(),
      include: NotificationMethodIncludeSchema.optional(),
      where: NotificationMethodWhereUniqueInputSchema,
    })
    .strict();

export const NotificationSettingFindFirstArgsSchema: z.ZodType<Prisma.NotificationSettingFindFirstArgs> =
  z
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

export const NotificationSettingFindFirstOrThrowArgsSchema: z.ZodType<Prisma.NotificationSettingFindFirstOrThrowArgs> =
  z
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

export const NotificationSettingFindManyArgsSchema: z.ZodType<Prisma.NotificationSettingFindManyArgs> =
  z
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

export const NotificationSettingAggregateArgsSchema: z.ZodType<Prisma.NotificationSettingAggregateArgs> =
  z
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

export const NotificationSettingGroupByArgsSchema: z.ZodType<Prisma.NotificationSettingGroupByArgs> =
  z
    .object({
      where: NotificationSettingWhereInputSchema.optional(),
      orderBy: z
        .union([
          NotificationSettingOrderByWithAggregationInputSchema.array(),
          NotificationSettingOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: NotificationSettingScalarFieldEnumSchema.array(),
      having:
        NotificationSettingScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const NotificationSettingFindUniqueArgsSchema: z.ZodType<Prisma.NotificationSettingFindUniqueArgs> =
  z
    .object({
      select: NotificationSettingSelectSchema.optional(),
      include: NotificationSettingIncludeSchema.optional(),
      where: NotificationSettingWhereUniqueInputSchema,
    })
    .strict();

export const NotificationSettingFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.NotificationSettingFindUniqueOrThrowArgs> =
  z
    .object({
      select: NotificationSettingSelectSchema.optional(),
      include: NotificationSettingIncludeSchema.optional(),
      where: NotificationSettingWhereUniqueInputSchema,
    })
    .strict();

export const PersonCreateArgsSchema: z.ZodType<Prisma.PersonCreateArgs> = z
  .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    data: z.union([PersonCreateInputSchema, PersonUncheckedCreateInputSchema]),
  })
  .strict();

export const PersonUpsertArgsSchema: z.ZodType<Prisma.PersonUpsertArgs> = z
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

export const PersonCreateManyArgsSchema: z.ZodType<Prisma.PersonCreateManyArgs> =
  z
    .object({
      data: z.union([
        PersonCreateManyInputSchema,
        PersonCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PersonCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PersonCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PersonCreateManyInputSchema,
        PersonCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PersonDeleteArgsSchema: z.ZodType<Prisma.PersonDeleteArgs> = z
  .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    where: PersonWhereUniqueInputSchema,
  })
  .strict();

export const PersonUpdateArgsSchema: z.ZodType<Prisma.PersonUpdateArgs> = z
  .object({
    select: PersonSelectSchema.optional(),
    include: PersonIncludeSchema.optional(),
    data: z.union([PersonUpdateInputSchema, PersonUncheckedUpdateInputSchema]),
    where: PersonWhereUniqueInputSchema,
  })
  .strict();

export const PersonUpdateManyArgsSchema: z.ZodType<Prisma.PersonUpdateManyArgs> =
  z
    .object({
      data: z.union([
        PersonUpdateManyMutationInputSchema,
        PersonUncheckedUpdateManyInputSchema,
      ]),
      where: PersonWhereInputSchema.optional(),
    })
    .strict();

export const PersonDeleteManyArgsSchema: z.ZodType<Prisma.PersonDeleteManyArgs> =
  z
    .object({
      where: PersonWhereInputSchema.optional(),
    })
    .strict();

export const PersonSettingsCreateArgsSchema: z.ZodType<Prisma.PersonSettingsCreateArgs> =
  z
    .object({
      select: PersonSettingsSelectSchema.optional(),
      include: PersonSettingsIncludeSchema.optional(),
      data: z.union([
        PersonSettingsCreateInputSchema,
        PersonSettingsUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const PersonSettingsUpsertArgsSchema: z.ZodType<Prisma.PersonSettingsUpsertArgs> =
  z
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

export const PersonSettingsCreateManyArgsSchema: z.ZodType<Prisma.PersonSettingsCreateManyArgs> =
  z
    .object({
      data: z.union([
        PersonSettingsCreateManyInputSchema,
        PersonSettingsCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PersonSettingsCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PersonSettingsCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PersonSettingsCreateManyInputSchema,
        PersonSettingsCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PersonSettingsDeleteArgsSchema: z.ZodType<Prisma.PersonSettingsDeleteArgs> =
  z
    .object({
      select: PersonSettingsSelectSchema.optional(),
      include: PersonSettingsIncludeSchema.optional(),
      where: PersonSettingsWhereUniqueInputSchema,
    })
    .strict();

export const PersonSettingsUpdateArgsSchema: z.ZodType<Prisma.PersonSettingsUpdateArgs> =
  z
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

export const PersonSettingsUpdateManyArgsSchema: z.ZodType<Prisma.PersonSettingsUpdateManyArgs> =
  z
    .object({
      data: z.union([
        PersonSettingsUpdateManyMutationInputSchema,
        PersonSettingsUncheckedUpdateManyInputSchema,
      ]),
      where: PersonSettingsWhereInputSchema.optional(),
    })
    .strict();

export const PersonSettingsDeleteManyArgsSchema: z.ZodType<Prisma.PersonSettingsDeleteManyArgs> =
  z
    .object({
      where: PersonSettingsWhereInputSchema.optional(),
    })
    .strict();

export const EventCreateArgsSchema: z.ZodType<Prisma.EventCreateArgs> = z
  .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    data: z.union([EventCreateInputSchema, EventUncheckedCreateInputSchema]),
  })
  .strict();

export const EventUpsertArgsSchema: z.ZodType<Prisma.EventUpsertArgs> = z
  .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    where: EventWhereUniqueInputSchema,
    create: z.union([EventCreateInputSchema, EventUncheckedCreateInputSchema]),
    update: z.union([EventUpdateInputSchema, EventUncheckedUpdateInputSchema]),
  })
  .strict();

export const EventCreateManyArgsSchema: z.ZodType<Prisma.EventCreateManyArgs> =
  z
    .object({
      data: z.union([
        EventCreateManyInputSchema,
        EventCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const EventCreateManyAndReturnArgsSchema: z.ZodType<Prisma.EventCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        EventCreateManyInputSchema,
        EventCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const EventDeleteArgsSchema: z.ZodType<Prisma.EventDeleteArgs> = z
  .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    where: EventWhereUniqueInputSchema,
  })
  .strict();

export const EventUpdateArgsSchema: z.ZodType<Prisma.EventUpdateArgs> = z
  .object({
    select: EventSelectSchema.optional(),
    include: EventIncludeSchema.optional(),
    data: z.union([EventUpdateInputSchema, EventUncheckedUpdateInputSchema]),
    where: EventWhereUniqueInputSchema,
  })
  .strict();

export const EventUpdateManyArgsSchema: z.ZodType<Prisma.EventUpdateManyArgs> =
  z
    .object({
      data: z.union([
        EventUpdateManyMutationInputSchema,
        EventUncheckedUpdateManyInputSchema,
      ]),
      where: EventWhereInputSchema.optional(),
    })
    .strict();

export const EventDeleteManyArgsSchema: z.ZodType<Prisma.EventDeleteManyArgs> =
  z
    .object({
      where: EventWhereInputSchema.optional(),
    })
    .strict();

export const MembershipCreateArgsSchema: z.ZodType<Prisma.MembershipCreateArgs> =
  z
    .object({
      select: MembershipSelectSchema.optional(),
      include: MembershipIncludeSchema.optional(),
      data: z.union([
        MembershipCreateInputSchema,
        MembershipUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const MembershipUpsertArgsSchema: z.ZodType<Prisma.MembershipUpsertArgs> =
  z
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

export const MembershipCreateManyArgsSchema: z.ZodType<Prisma.MembershipCreateManyArgs> =
  z
    .object({
      data: z.union([
        MembershipCreateManyInputSchema,
        MembershipCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const MembershipCreateManyAndReturnArgsSchema: z.ZodType<Prisma.MembershipCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        MembershipCreateManyInputSchema,
        MembershipCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const MembershipDeleteArgsSchema: z.ZodType<Prisma.MembershipDeleteArgs> =
  z
    .object({
      select: MembershipSelectSchema.optional(),
      include: MembershipIncludeSchema.optional(),
      where: MembershipWhereUniqueInputSchema,
    })
    .strict();

export const MembershipUpdateArgsSchema: z.ZodType<Prisma.MembershipUpdateArgs> =
  z
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

export const MembershipUpdateManyArgsSchema: z.ZodType<Prisma.MembershipUpdateManyArgs> =
  z
    .object({
      data: z.union([
        MembershipUpdateManyMutationInputSchema,
        MembershipUncheckedUpdateManyInputSchema,
      ]),
      where: MembershipWhereInputSchema.optional(),
    })
    .strict();

export const MembershipDeleteManyArgsSchema: z.ZodType<Prisma.MembershipDeleteManyArgs> =
  z
    .object({
      where: MembershipWhereInputSchema.optional(),
    })
    .strict();

export const PotentialDateTimeCreateArgsSchema: z.ZodType<Prisma.PotentialDateTimeCreateArgs> =
  z
    .object({
      select: PotentialDateTimeSelectSchema.optional(),
      include: PotentialDateTimeIncludeSchema.optional(),
      data: z.union([
        PotentialDateTimeCreateInputSchema,
        PotentialDateTimeUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const PotentialDateTimeUpsertArgsSchema: z.ZodType<Prisma.PotentialDateTimeUpsertArgs> =
  z
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

export const PotentialDateTimeCreateManyArgsSchema: z.ZodType<Prisma.PotentialDateTimeCreateManyArgs> =
  z
    .object({
      data: z.union([
        PotentialDateTimeCreateManyInputSchema,
        PotentialDateTimeCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PotentialDateTimeCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PotentialDateTimeCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PotentialDateTimeCreateManyInputSchema,
        PotentialDateTimeCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PotentialDateTimeDeleteArgsSchema: z.ZodType<Prisma.PotentialDateTimeDeleteArgs> =
  z
    .object({
      select: PotentialDateTimeSelectSchema.optional(),
      include: PotentialDateTimeIncludeSchema.optional(),
      where: PotentialDateTimeWhereUniqueInputSchema,
    })
    .strict();

export const PotentialDateTimeUpdateArgsSchema: z.ZodType<Prisma.PotentialDateTimeUpdateArgs> =
  z
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

export const PotentialDateTimeUpdateManyArgsSchema: z.ZodType<Prisma.PotentialDateTimeUpdateManyArgs> =
  z
    .object({
      data: z.union([
        PotentialDateTimeUpdateManyMutationInputSchema,
        PotentialDateTimeUncheckedUpdateManyInputSchema,
      ]),
      where: PotentialDateTimeWhereInputSchema.optional(),
    })
    .strict();

export const PotentialDateTimeDeleteManyArgsSchema: z.ZodType<Prisma.PotentialDateTimeDeleteManyArgs> =
  z
    .object({
      where: PotentialDateTimeWhereInputSchema.optional(),
    })
    .strict();

export const AvailabilityCreateArgsSchema: z.ZodType<Prisma.AvailabilityCreateArgs> =
  z
    .object({
      select: AvailabilitySelectSchema.optional(),
      include: AvailabilityIncludeSchema.optional(),
      data: z.union([
        AvailabilityCreateInputSchema,
        AvailabilityUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const AvailabilityUpsertArgsSchema: z.ZodType<Prisma.AvailabilityUpsertArgs> =
  z
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

export const AvailabilityCreateManyArgsSchema: z.ZodType<Prisma.AvailabilityCreateManyArgs> =
  z
    .object({
      data: z.union([
        AvailabilityCreateManyInputSchema,
        AvailabilityCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const AvailabilityCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AvailabilityCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        AvailabilityCreateManyInputSchema,
        AvailabilityCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const AvailabilityDeleteArgsSchema: z.ZodType<Prisma.AvailabilityDeleteArgs> =
  z
    .object({
      select: AvailabilitySelectSchema.optional(),
      include: AvailabilityIncludeSchema.optional(),
      where: AvailabilityWhereUniqueInputSchema,
    })
    .strict();

export const AvailabilityUpdateArgsSchema: z.ZodType<Prisma.AvailabilityUpdateArgs> =
  z
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

export const AvailabilityUpdateManyArgsSchema: z.ZodType<Prisma.AvailabilityUpdateManyArgs> =
  z
    .object({
      data: z.union([
        AvailabilityUpdateManyMutationInputSchema,
        AvailabilityUncheckedUpdateManyInputSchema,
      ]),
      where: AvailabilityWhereInputSchema.optional(),
    })
    .strict();

export const AvailabilityDeleteManyArgsSchema: z.ZodType<Prisma.AvailabilityDeleteManyArgs> =
  z
    .object({
      where: AvailabilityWhereInputSchema.optional(),
    })
    .strict();

export const PostCreateArgsSchema: z.ZodType<Prisma.PostCreateArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    data: z.union([PostCreateInputSchema, PostUncheckedCreateInputSchema]),
  })
  .strict();

export const PostUpsertArgsSchema: z.ZodType<Prisma.PostUpsertArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereUniqueInputSchema,
    create: z.union([PostCreateInputSchema, PostUncheckedCreateInputSchema]),
    update: z.union([PostUpdateInputSchema, PostUncheckedUpdateInputSchema]),
  })
  .strict();

export const PostCreateManyArgsSchema: z.ZodType<Prisma.PostCreateManyArgs> = z
  .object({
    data: z.union([
      PostCreateManyInputSchema,
      PostCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  })
  .strict();

export const PostCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PostCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PostCreateManyInputSchema,
        PostCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PostDeleteArgsSchema: z.ZodType<Prisma.PostDeleteArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereUniqueInputSchema,
  })
  .strict();

export const PostUpdateArgsSchema: z.ZodType<Prisma.PostUpdateArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    data: z.union([PostUpdateInputSchema, PostUncheckedUpdateInputSchema]),
    where: PostWhereUniqueInputSchema,
  })
  .strict();

export const PostUpdateManyArgsSchema: z.ZodType<Prisma.PostUpdateManyArgs> = z
  .object({
    data: z.union([
      PostUpdateManyMutationInputSchema,
      PostUncheckedUpdateManyInputSchema,
    ]),
    where: PostWhereInputSchema.optional(),
  })
  .strict();

export const PostDeleteManyArgsSchema: z.ZodType<Prisma.PostDeleteManyArgs> = z
  .object({
    where: PostWhereInputSchema.optional(),
  })
  .strict();

export const ReplyCreateArgsSchema: z.ZodType<Prisma.ReplyCreateArgs> = z
  .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    data: z.union([ReplyCreateInputSchema, ReplyUncheckedCreateInputSchema]),
  })
  .strict();

export const ReplyUpsertArgsSchema: z.ZodType<Prisma.ReplyUpsertArgs> = z
  .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    where: ReplyWhereUniqueInputSchema,
    create: z.union([ReplyCreateInputSchema, ReplyUncheckedCreateInputSchema]),
    update: z.union([ReplyUpdateInputSchema, ReplyUncheckedUpdateInputSchema]),
  })
  .strict();

export const ReplyCreateManyArgsSchema: z.ZodType<Prisma.ReplyCreateManyArgs> =
  z
    .object({
      data: z.union([
        ReplyCreateManyInputSchema,
        ReplyCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const ReplyCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ReplyCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        ReplyCreateManyInputSchema,
        ReplyCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const ReplyDeleteArgsSchema: z.ZodType<Prisma.ReplyDeleteArgs> = z
  .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    where: ReplyWhereUniqueInputSchema,
  })
  .strict();

export const ReplyUpdateArgsSchema: z.ZodType<Prisma.ReplyUpdateArgs> = z
  .object({
    select: ReplySelectSchema.optional(),
    include: ReplyIncludeSchema.optional(),
    data: z.union([ReplyUpdateInputSchema, ReplyUncheckedUpdateInputSchema]),
    where: ReplyWhereUniqueInputSchema,
  })
  .strict();

export const ReplyUpdateManyArgsSchema: z.ZodType<Prisma.ReplyUpdateManyArgs> =
  z
    .object({
      data: z.union([
        ReplyUpdateManyMutationInputSchema,
        ReplyUncheckedUpdateManyInputSchema,
      ]),
      where: ReplyWhereInputSchema.optional(),
    })
    .strict();

export const ReplyDeleteManyArgsSchema: z.ZodType<Prisma.ReplyDeleteManyArgs> =
  z
    .object({
      where: ReplyWhereInputSchema.optional(),
    })
    .strict();

export const InviteCreateArgsSchema: z.ZodType<Prisma.InviteCreateArgs> = z
  .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    data: z.union([InviteCreateInputSchema, InviteUncheckedCreateInputSchema]),
  })
  .strict();

export const InviteUpsertArgsSchema: z.ZodType<Prisma.InviteUpsertArgs> = z
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

export const InviteCreateManyArgsSchema: z.ZodType<Prisma.InviteCreateManyArgs> =
  z
    .object({
      data: z.union([
        InviteCreateManyInputSchema,
        InviteCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const InviteCreateManyAndReturnArgsSchema: z.ZodType<Prisma.InviteCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        InviteCreateManyInputSchema,
        InviteCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const InviteDeleteArgsSchema: z.ZodType<Prisma.InviteDeleteArgs> = z
  .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    where: InviteWhereUniqueInputSchema,
  })
  .strict();

export const InviteUpdateArgsSchema: z.ZodType<Prisma.InviteUpdateArgs> = z
  .object({
    select: InviteSelectSchema.optional(),
    include: InviteIncludeSchema.optional(),
    data: z.union([InviteUpdateInputSchema, InviteUncheckedUpdateInputSchema]),
    where: InviteWhereUniqueInputSchema,
  })
  .strict();

export const InviteUpdateManyArgsSchema: z.ZodType<Prisma.InviteUpdateManyArgs> =
  z
    .object({
      data: z.union([
        InviteUpdateManyMutationInputSchema,
        InviteUncheckedUpdateManyInputSchema,
      ]),
      where: InviteWhereInputSchema.optional(),
    })
    .strict();

export const InviteDeleteManyArgsSchema: z.ZodType<Prisma.InviteDeleteManyArgs> =
  z
    .object({
      where: InviteWhereInputSchema.optional(),
    })
    .strict();

export const NotificationCreateArgsSchema: z.ZodType<Prisma.NotificationCreateArgs> =
  z
    .object({
      select: NotificationSelectSchema.optional(),
      include: NotificationIncludeSchema.optional(),
      data: z.union([
        NotificationCreateInputSchema,
        NotificationUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const NotificationUpsertArgsSchema: z.ZodType<Prisma.NotificationUpsertArgs> =
  z
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

export const NotificationCreateManyArgsSchema: z.ZodType<Prisma.NotificationCreateManyArgs> =
  z
    .object({
      data: z.union([
        NotificationCreateManyInputSchema,
        NotificationCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NotificationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        NotificationCreateManyInputSchema,
        NotificationCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NotificationDeleteArgsSchema: z.ZodType<Prisma.NotificationDeleteArgs> =
  z
    .object({
      select: NotificationSelectSchema.optional(),
      include: NotificationIncludeSchema.optional(),
      where: NotificationWhereUniqueInputSchema,
    })
    .strict();

export const NotificationUpdateArgsSchema: z.ZodType<Prisma.NotificationUpdateArgs> =
  z
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

export const NotificationUpdateManyArgsSchema: z.ZodType<Prisma.NotificationUpdateManyArgs> =
  z
    .object({
      data: z.union([
        NotificationUpdateManyMutationInputSchema,
        NotificationUncheckedUpdateManyInputSchema,
      ]),
      where: NotificationWhereInputSchema.optional(),
    })
    .strict();

export const NotificationDeleteManyArgsSchema: z.ZodType<Prisma.NotificationDeleteManyArgs> =
  z
    .object({
      where: NotificationWhereInputSchema.optional(),
    })
    .strict();

export const NotificationMethodCreateArgsSchema: z.ZodType<Prisma.NotificationMethodCreateArgs> =
  z
    .object({
      select: NotificationMethodSelectSchema.optional(),
      include: NotificationMethodIncludeSchema.optional(),
      data: z.union([
        NotificationMethodCreateInputSchema,
        NotificationMethodUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const NotificationMethodUpsertArgsSchema: z.ZodType<Prisma.NotificationMethodUpsertArgs> =
  z
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

export const NotificationMethodCreateManyArgsSchema: z.ZodType<Prisma.NotificationMethodCreateManyArgs> =
  z
    .object({
      data: z.union([
        NotificationMethodCreateManyInputSchema,
        NotificationMethodCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NotificationMethodCreateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationMethodCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        NotificationMethodCreateManyInputSchema,
        NotificationMethodCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NotificationMethodDeleteArgsSchema: z.ZodType<Prisma.NotificationMethodDeleteArgs> =
  z
    .object({
      select: NotificationMethodSelectSchema.optional(),
      include: NotificationMethodIncludeSchema.optional(),
      where: NotificationMethodWhereUniqueInputSchema,
    })
    .strict();

export const NotificationMethodUpdateArgsSchema: z.ZodType<Prisma.NotificationMethodUpdateArgs> =
  z
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

export const NotificationMethodUpdateManyArgsSchema: z.ZodType<Prisma.NotificationMethodUpdateManyArgs> =
  z
    .object({
      data: z.union([
        NotificationMethodUpdateManyMutationInputSchema,
        NotificationMethodUncheckedUpdateManyInputSchema,
      ]),
      where: NotificationMethodWhereInputSchema.optional(),
    })
    .strict();

export const NotificationMethodDeleteManyArgsSchema: z.ZodType<Prisma.NotificationMethodDeleteManyArgs> =
  z
    .object({
      where: NotificationMethodWhereInputSchema.optional(),
    })
    .strict();

export const NotificationSettingCreateArgsSchema: z.ZodType<Prisma.NotificationSettingCreateArgs> =
  z
    .object({
      select: NotificationSettingSelectSchema.optional(),
      include: NotificationSettingIncludeSchema.optional(),
      data: z.union([
        NotificationSettingCreateInputSchema,
        NotificationSettingUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const NotificationSettingUpsertArgsSchema: z.ZodType<Prisma.NotificationSettingUpsertArgs> =
  z
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

export const NotificationSettingCreateManyArgsSchema: z.ZodType<Prisma.NotificationSettingCreateManyArgs> =
  z
    .object({
      data: z.union([
        NotificationSettingCreateManyInputSchema,
        NotificationSettingCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NotificationSettingCreateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationSettingCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        NotificationSettingCreateManyInputSchema,
        NotificationSettingCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NotificationSettingDeleteArgsSchema: z.ZodType<Prisma.NotificationSettingDeleteArgs> =
  z
    .object({
      select: NotificationSettingSelectSchema.optional(),
      include: NotificationSettingIncludeSchema.optional(),
      where: NotificationSettingWhereUniqueInputSchema,
    })
    .strict();

export const NotificationSettingUpdateArgsSchema: z.ZodType<Prisma.NotificationSettingUpdateArgs> =
  z
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

export const NotificationSettingUpdateManyArgsSchema: z.ZodType<Prisma.NotificationSettingUpdateManyArgs> =
  z
    .object({
      data: z.union([
        NotificationSettingUpdateManyMutationInputSchema,
        NotificationSettingUncheckedUpdateManyInputSchema,
      ]),
      where: NotificationSettingWhereInputSchema.optional(),
    })
    .strict();

export const NotificationSettingDeleteManyArgsSchema: z.ZodType<Prisma.NotificationSettingDeleteManyArgs> =
  z
    .object({
      where: NotificationSettingWhereInputSchema.optional(),
    })
    .strict();
