import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.NullTypes.DbNull;
  if (v === 'JsonNull') return Prisma.NullTypes.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','imageKey','createdAt','updatedAt','username','displayUsername','role','pronouns','bio']);

export const PersonScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt']);

export const SessionScalarFieldEnumSchema = z.enum(['id','expiresAt','token','createdAt','updatedAt','ipAddress','userAgent','userId']);

export const AccountScalarFieldEnumSchema = z.enum(['id','accountId','providerId','userId','accessToken','refreshToken','idToken','accessTokenExpiresAt','refreshTokenExpiresAt','scope','password','createdAt','updatedAt']);

export const VerificationScalarFieldEnumSchema = z.enum(['id','identifier','value','expiresAt','createdAt','updatedAt']);

export const PersonSettingsScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','personId']);

export const EventScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','title','description','location','chosenDateTime']);

export const MembershipScalarFieldEnumSchema = z.enum(['id','personId','eventId','role','rsvpStatus']);

export const PotentialDateTimeScalarFieldEnumSchema = z.enum(['id','eventId','dateTime']);

export const AvailabilityScalarFieldEnumSchema = z.enum(['membershipId','potentialDateTimeId','status']);

export const PostScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','editedAt','authorId','eventId','title','content']);

export const ReplyScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','authorId','postId','text']);

export const InviteScalarFieldEnumSchema = z.enum(['id','eventId','createdById','createdAt','expiresAt','usesRemaining','maxUses','name']);

export const NotificationScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','personId','authorId','type','eventId','postId','read','datetime','rsvp']);

export const NotificationMethodScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','settingsId','type','enabled','name','value','webhookHeaders','customTemplate','webhookFormat']);

export const NotificationSettingScalarFieldEnumSchema = z.enum(['id','notificationType','methodId','enabled']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const StatusSchema = z.enum(['YES','MAYBE','NO','PENDING']);

export type StatusType = `${z.infer<typeof StatusSchema>}`

export const RoleSchema = z.enum(['ORGANIZER','MODERATOR','ATTENDEE']);

export type RoleType = `${z.infer<typeof RoleSchema>}`

export const NotificationTypeSchema = z.enum(['EVENT_EDITED','NEW_POST','NEW_REPLY','DATE_CHOSEN','DATE_CHANGED','DATE_RESET','USER_JOINED','USER_LEFT','USER_PROMOTED','USER_DEMOTED','USER_RSVP']);

export type NotificationTypeType = `${z.infer<typeof NotificationTypeSchema>}`

export const NotificationMethodTypeSchema = z.enum(['EMAIL','PUSH','WEBHOOK']);

export type NotificationMethodTypeType = `${z.infer<typeof NotificationMethodTypeSchema>}`

export const WebhookFormatSchema = z.enum(['DISCORD','SLACK','TEAMS','GENERIC','CUSTOM']);

export type WebhookFormatType = `${z.infer<typeof WebhookFormatSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  imageKey: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  username: z.string().nullable(),
  displayUsername: z.string().nullable(),
  role: z.string(),
  pronouns: z.string().nullable(),
  bio: z.string().nullable(),
})

export type User = z.infer<typeof UserSchema>

// USER OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const UserOptionalDefaultsSchema = UserSchema.merge(z.object({
  id: z.string().optional(),
  emailVerified: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  role: z.string().optional(),
}))

export type UserOptionalDefaults = z.infer<typeof UserOptionalDefaultsSchema>

/////////////////////////////////////////
// PERSON SCHEMA
/////////////////////////////////////////

export const PersonSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Person = z.infer<typeof PersonSchema>

// PERSON OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PersonOptionalDefaultsSchema = PersonSchema.merge(z.object({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type PersonOptionalDefaults = z.infer<typeof PersonOptionalDefaultsSchema>

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.string(),
})

export type Session = z.infer<typeof SessionSchema>

// SESSION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const SessionOptionalDefaultsSchema = SessionSchema.merge(z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type SessionOptionalDefaults = z.infer<typeof SessionOptionalDefaultsSchema>

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  idToken: z.string().nullable(),
  accessTokenExpiresAt: z.coerce.date().nullable(),
  refreshTokenExpiresAt: z.coerce.date().nullable(),
  scope: z.string().nullable(),
  password: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Account = z.infer<typeof AccountSchema>

// ACCOUNT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AccountOptionalDefaultsSchema = AccountSchema.merge(z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type AccountOptionalDefaults = z.infer<typeof AccountOptionalDefaultsSchema>

/////////////////////////////////////////
// VERIFICATION SCHEMA
/////////////////////////////////////////

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Verification = z.infer<typeof VerificationSchema>

// VERIFICATION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const VerificationOptionalDefaultsSchema = VerificationSchema.merge(z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type VerificationOptionalDefaults = z.infer<typeof VerificationOptionalDefaultsSchema>

/////////////////////////////////////////
// PERSON SETTINGS SCHEMA
/////////////////////////////////////////

export const PersonSettingsSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  personId: z.string(),
})

export type PersonSettings = z.infer<typeof PersonSettingsSchema>

// PERSON SETTINGS OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PersonSettingsOptionalDefaultsSchema = PersonSettingsSchema.merge(z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type PersonSettingsOptionalDefaults = z.infer<typeof PersonSettingsOptionalDefaultsSchema>

/////////////////////////////////////////
// EVENT SCHEMA
/////////////////////////////////////////

export const EventSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  chosenDateTime: z.coerce.date().nullable(),
})

export type Event = z.infer<typeof EventSchema>

// EVENT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const EventOptionalDefaultsSchema = EventSchema.merge(z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
}))

export type EventOptionalDefaults = z.infer<typeof EventOptionalDefaultsSchema>

/////////////////////////////////////////
// MEMBERSHIP SCHEMA
/////////////////////////////////////////

export const MembershipSchema = z.object({
  role: RoleSchema,
  rsvpStatus: StatusSchema,
  id: z.string(),
  personId: z.string(),
  eventId: z.string(),
})

export type Membership = z.infer<typeof MembershipSchema>

// MEMBERSHIP OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const MembershipOptionalDefaultsSchema = MembershipSchema.merge(z.object({
  role: RoleSchema.optional(),
  rsvpStatus: StatusSchema.optional(),
  id: z.string().optional(),
}))

export type MembershipOptionalDefaults = z.infer<typeof MembershipOptionalDefaultsSchema>

/////////////////////////////////////////
// POTENTIAL DATE TIME SCHEMA
/////////////////////////////////////////

export const PotentialDateTimeSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  dateTime: z.coerce.date(),
})

export type PotentialDateTime = z.infer<typeof PotentialDateTimeSchema>

// POTENTIAL DATE TIME OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PotentialDateTimeOptionalDefaultsSchema = PotentialDateTimeSchema.merge(z.object({
  id: z.string().optional(),
  dateTime: z.coerce.date().optional(),
}))

export type PotentialDateTimeOptionalDefaults = z.infer<typeof PotentialDateTimeOptionalDefaultsSchema>

/////////////////////////////////////////
// AVAILABILITY SCHEMA
/////////////////////////////////////////

export const AvailabilitySchema = z.object({
  status: StatusSchema,
  membershipId: z.string(),
  potentialDateTimeId: z.string(),
})

export type Availability = z.infer<typeof AvailabilitySchema>

// AVAILABILITY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AvailabilityOptionalDefaultsSchema = AvailabilitySchema.merge(z.object({
}))

export type AvailabilityOptionalDefaults = z.infer<typeof AvailabilityOptionalDefaultsSchema>

/////////////////////////////////////////
// POST SCHEMA
/////////////////////////////////////////

export const PostSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  editedAt: z.coerce.date(),
  authorId: z.string(),
  eventId: z.string(),
  title: z.string(),
  content: z.string(),
})

export type Post = z.infer<typeof PostSchema>

// POST OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PostOptionalDefaultsSchema = PostSchema.merge(z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
}))

export type PostOptionalDefaults = z.infer<typeof PostOptionalDefaultsSchema>

/////////////////////////////////////////
// REPLY SCHEMA
/////////////////////////////////////////

export const ReplySchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  authorId: z.string(),
  postId: z.string(),
  text: z.string(),
})

export type Reply = z.infer<typeof ReplySchema>

// REPLY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ReplyOptionalDefaultsSchema = ReplySchema.merge(z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ReplyOptionalDefaults = z.infer<typeof ReplyOptionalDefaultsSchema>

/////////////////////////////////////////
// INVITE SCHEMA
/////////////////////////////////////////

export const InviteSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  createdById: z.string(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  usesRemaining: z.number().int().nullable(),
  maxUses: z.number().int().nullable(),
  name: z.string().nullable(),
})

export type Invite = z.infer<typeof InviteSchema>

// INVITE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const InviteOptionalDefaultsSchema = InviteSchema.merge(z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
}))

export type InviteOptionalDefaults = z.infer<typeof InviteOptionalDefaultsSchema>

/////////////////////////////////////////
// NOTIFICATION SCHEMA
/////////////////////////////////////////

export const NotificationSchema = z.object({
  type: NotificationTypeSchema,
  rsvp: StatusSchema.nullable(),
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  personId: z.string(),
  authorId: z.string().nullable(),
  eventId: z.string().nullable(),
  postId: z.string().nullable(),
  read: z.boolean(),
  datetime: z.coerce.date().nullable(),
})

export type Notification = z.infer<typeof NotificationSchema>

// NOTIFICATION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const NotificationOptionalDefaultsSchema = NotificationSchema.merge(z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  read: z.boolean().optional(),
}))

export type NotificationOptionalDefaults = z.infer<typeof NotificationOptionalDefaultsSchema>

/////////////////////////////////////////
// NOTIFICATION METHOD SCHEMA
/////////////////////////////////////////

export const NotificationMethodSchema = z.object({
  type: NotificationMethodTypeSchema,
  webhookFormat: WebhookFormatSchema.nullable(),
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  settingsId: z.string(),
  enabled: z.boolean(),
  name: z.string().nullable(),
  value: z.string(),
  webhookHeaders: JsonValueSchema.nullable(),
  customTemplate: z.string().nullable(),
})

export type NotificationMethod = z.infer<typeof NotificationMethodSchema>

// NOTIFICATION METHOD OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const NotificationMethodOptionalDefaultsSchema = NotificationMethodSchema.merge(z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  enabled: z.boolean().optional(),
}))

export type NotificationMethodOptionalDefaults = z.infer<typeof NotificationMethodOptionalDefaultsSchema>

/////////////////////////////////////////
// NOTIFICATION SETTING SCHEMA
/////////////////////////////////////////

export const NotificationSettingSchema = z.object({
  notificationType: NotificationTypeSchema,
  id: z.string(),
  methodId: z.string(),
  enabled: z.boolean(),
})

export type NotificationSetting = z.infer<typeof NotificationSettingSchema>

// NOTIFICATION SETTING OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const NotificationSettingOptionalDefaultsSchema = NotificationSettingSchema.merge(z.object({
  id: z.string().optional(),
  enabled: z.boolean().optional(),
}))

export type NotificationSettingOptionalDefaults = z.infer<typeof NotificationSettingOptionalDefaultsSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  sessions: z.union([z.boolean(),z.lazy(() => SessionFindManyArgsSchema)]).optional(),
  accounts: z.union([z.boolean(),z.lazy(() => AccountFindManyArgsSchema)]).optional(),
  person: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  sessions: z.boolean().optional(),
  accounts: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  email: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  image: z.boolean().optional(),
  imageKey: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  username: z.boolean().optional(),
  displayUsername: z.boolean().optional(),
  role: z.boolean().optional(),
  pronouns: z.boolean().optional(),
  bio: z.boolean().optional(),
  sessions: z.union([z.boolean(),z.lazy(() => SessionFindManyArgsSchema)]).optional(),
  accounts: z.union([z.boolean(),z.lazy(() => AccountFindManyArgsSchema)]).optional(),
  person: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// PERSON
//------------------------------------------------------

export const PersonIncludeSchema: z.ZodType<Prisma.PersonInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  memberships: z.union([z.boolean(),z.lazy(() => MembershipFindManyArgsSchema)]).optional(),
  posts: z.union([z.boolean(),z.lazy(() => PostFindManyArgsSchema)]).optional(),
  replies: z.union([z.boolean(),z.lazy(() => ReplyFindManyArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  authoredNotifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  settings: z.union([z.boolean(),z.lazy(() => PersonSettingsArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PersonCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const PersonArgsSchema: z.ZodType<Prisma.PersonDefaultArgs> = z.object({
  select: z.lazy(() => PersonSelectSchema).optional(),
  include: z.lazy(() => PersonIncludeSchema).optional(),
}).strict();

export const PersonCountOutputTypeArgsSchema: z.ZodType<Prisma.PersonCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => PersonCountOutputTypeSelectSchema).nullish(),
}).strict();

export const PersonCountOutputTypeSelectSchema: z.ZodType<Prisma.PersonCountOutputTypeSelect> = z.object({
  memberships: z.boolean().optional(),
  posts: z.boolean().optional(),
  replies: z.boolean().optional(),
  notifications: z.boolean().optional(),
  authoredNotifications: z.boolean().optional(),
}).strict();

export const PersonSelectSchema: z.ZodType<Prisma.PersonSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  memberships: z.union([z.boolean(),z.lazy(() => MembershipFindManyArgsSchema)]).optional(),
  posts: z.union([z.boolean(),z.lazy(() => PostFindManyArgsSchema)]).optional(),
  replies: z.union([z.boolean(),z.lazy(() => ReplyFindManyArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  authoredNotifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  settings: z.union([z.boolean(),z.lazy(() => PersonSettingsArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PersonCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SESSION
//------------------------------------------------------

export const SessionIncludeSchema: z.ZodType<Prisma.SessionInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const SessionArgsSchema: z.ZodType<Prisma.SessionDefaultArgs> = z.object({
  select: z.lazy(() => SessionSelectSchema).optional(),
  include: z.lazy(() => SessionIncludeSchema).optional(),
}).strict();

export const SessionSelectSchema: z.ZodType<Prisma.SessionSelect> = z.object({
  id: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  token: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  ipAddress: z.boolean().optional(),
  userAgent: z.boolean().optional(),
  userId: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// ACCOUNT
//------------------------------------------------------

export const AccountIncludeSchema: z.ZodType<Prisma.AccountInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const AccountArgsSchema: z.ZodType<Prisma.AccountDefaultArgs> = z.object({
  select: z.lazy(() => AccountSelectSchema).optional(),
  include: z.lazy(() => AccountIncludeSchema).optional(),
}).strict();

export const AccountSelectSchema: z.ZodType<Prisma.AccountSelect> = z.object({
  id: z.boolean().optional(),
  accountId: z.boolean().optional(),
  providerId: z.boolean().optional(),
  userId: z.boolean().optional(),
  accessToken: z.boolean().optional(),
  refreshToken: z.boolean().optional(),
  idToken: z.boolean().optional(),
  accessTokenExpiresAt: z.boolean().optional(),
  refreshTokenExpiresAt: z.boolean().optional(),
  scope: z.boolean().optional(),
  password: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// VERIFICATION
//------------------------------------------------------

export const VerificationSelectSchema: z.ZodType<Prisma.VerificationSelect> = z.object({
  id: z.boolean().optional(),
  identifier: z.boolean().optional(),
  value: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// PERSON SETTINGS
//------------------------------------------------------

export const PersonSettingsIncludeSchema: z.ZodType<Prisma.PersonSettingsInclude> = z.object({
  person: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  notificationMethods: z.union([z.boolean(),z.lazy(() => NotificationMethodFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PersonSettingsCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const PersonSettingsArgsSchema: z.ZodType<Prisma.PersonSettingsDefaultArgs> = z.object({
  select: z.lazy(() => PersonSettingsSelectSchema).optional(),
  include: z.lazy(() => PersonSettingsIncludeSchema).optional(),
}).strict();

export const PersonSettingsCountOutputTypeArgsSchema: z.ZodType<Prisma.PersonSettingsCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => PersonSettingsCountOutputTypeSelectSchema).nullish(),
}).strict();

export const PersonSettingsCountOutputTypeSelectSchema: z.ZodType<Prisma.PersonSettingsCountOutputTypeSelect> = z.object({
  notificationMethods: z.boolean().optional(),
}).strict();

export const PersonSettingsSelectSchema: z.ZodType<Prisma.PersonSettingsSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  personId: z.boolean().optional(),
  person: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  notificationMethods: z.union([z.boolean(),z.lazy(() => NotificationMethodFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PersonSettingsCountOutputTypeArgsSchema)]).optional(),
}).strict()

// EVENT
//------------------------------------------------------

export const EventIncludeSchema: z.ZodType<Prisma.EventInclude> = z.object({
  invites: z.union([z.boolean(),z.lazy(() => InviteFindManyArgsSchema)]).optional(),
  potentialDateTimes: z.union([z.boolean(),z.lazy(() => PotentialDateTimeFindManyArgsSchema)]).optional(),
  posts: z.union([z.boolean(),z.lazy(() => PostFindManyArgsSchema)]).optional(),
  memberships: z.union([z.boolean(),z.lazy(() => MembershipFindManyArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => EventCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const EventArgsSchema: z.ZodType<Prisma.EventDefaultArgs> = z.object({
  select: z.lazy(() => EventSelectSchema).optional(),
  include: z.lazy(() => EventIncludeSchema).optional(),
}).strict();

export const EventCountOutputTypeArgsSchema: z.ZodType<Prisma.EventCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => EventCountOutputTypeSelectSchema).nullish(),
}).strict();

export const EventCountOutputTypeSelectSchema: z.ZodType<Prisma.EventCountOutputTypeSelect> = z.object({
  invites: z.boolean().optional(),
  potentialDateTimes: z.boolean().optional(),
  posts: z.boolean().optional(),
  memberships: z.boolean().optional(),
  notifications: z.boolean().optional(),
}).strict();

export const EventSelectSchema: z.ZodType<Prisma.EventSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  title: z.boolean().optional(),
  description: z.boolean().optional(),
  location: z.boolean().optional(),
  chosenDateTime: z.boolean().optional(),
  invites: z.union([z.boolean(),z.lazy(() => InviteFindManyArgsSchema)]).optional(),
  potentialDateTimes: z.union([z.boolean(),z.lazy(() => PotentialDateTimeFindManyArgsSchema)]).optional(),
  posts: z.union([z.boolean(),z.lazy(() => PostFindManyArgsSchema)]).optional(),
  memberships: z.union([z.boolean(),z.lazy(() => MembershipFindManyArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => EventCountOutputTypeArgsSchema)]).optional(),
}).strict()

// MEMBERSHIP
//------------------------------------------------------

export const MembershipIncludeSchema: z.ZodType<Prisma.MembershipInclude> = z.object({
  person: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  availabilities: z.union([z.boolean(),z.lazy(() => AvailabilityFindManyArgsSchema)]).optional(),
  invites: z.union([z.boolean(),z.lazy(() => InviteFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => MembershipCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const MembershipArgsSchema: z.ZodType<Prisma.MembershipDefaultArgs> = z.object({
  select: z.lazy(() => MembershipSelectSchema).optional(),
  include: z.lazy(() => MembershipIncludeSchema).optional(),
}).strict();

export const MembershipCountOutputTypeArgsSchema: z.ZodType<Prisma.MembershipCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => MembershipCountOutputTypeSelectSchema).nullish(),
}).strict();

export const MembershipCountOutputTypeSelectSchema: z.ZodType<Prisma.MembershipCountOutputTypeSelect> = z.object({
  availabilities: z.boolean().optional(),
  invites: z.boolean().optional(),
}).strict();

export const MembershipSelectSchema: z.ZodType<Prisma.MembershipSelect> = z.object({
  id: z.boolean().optional(),
  personId: z.boolean().optional(),
  eventId: z.boolean().optional(),
  role: z.boolean().optional(),
  rsvpStatus: z.boolean().optional(),
  person: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  availabilities: z.union([z.boolean(),z.lazy(() => AvailabilityFindManyArgsSchema)]).optional(),
  invites: z.union([z.boolean(),z.lazy(() => InviteFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => MembershipCountOutputTypeArgsSchema)]).optional(),
}).strict()

// POTENTIAL DATE TIME
//------------------------------------------------------

export const PotentialDateTimeIncludeSchema: z.ZodType<Prisma.PotentialDateTimeInclude> = z.object({
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  availabilities: z.union([z.boolean(),z.lazy(() => AvailabilityFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PotentialDateTimeCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const PotentialDateTimeArgsSchema: z.ZodType<Prisma.PotentialDateTimeDefaultArgs> = z.object({
  select: z.lazy(() => PotentialDateTimeSelectSchema).optional(),
  include: z.lazy(() => PotentialDateTimeIncludeSchema).optional(),
}).strict();

export const PotentialDateTimeCountOutputTypeArgsSchema: z.ZodType<Prisma.PotentialDateTimeCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => PotentialDateTimeCountOutputTypeSelectSchema).nullish(),
}).strict();

export const PotentialDateTimeCountOutputTypeSelectSchema: z.ZodType<Prisma.PotentialDateTimeCountOutputTypeSelect> = z.object({
  availabilities: z.boolean().optional(),
}).strict();

export const PotentialDateTimeSelectSchema: z.ZodType<Prisma.PotentialDateTimeSelect> = z.object({
  id: z.boolean().optional(),
  eventId: z.boolean().optional(),
  dateTime: z.boolean().optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  availabilities: z.union([z.boolean(),z.lazy(() => AvailabilityFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PotentialDateTimeCountOutputTypeArgsSchema)]).optional(),
}).strict()

// AVAILABILITY
//------------------------------------------------------

export const AvailabilityIncludeSchema: z.ZodType<Prisma.AvailabilityInclude> = z.object({
  membership: z.union([z.boolean(),z.lazy(() => MembershipArgsSchema)]).optional(),
  potentialDateTime: z.union([z.boolean(),z.lazy(() => PotentialDateTimeArgsSchema)]).optional(),
}).strict();

export const AvailabilityArgsSchema: z.ZodType<Prisma.AvailabilityDefaultArgs> = z.object({
  select: z.lazy(() => AvailabilitySelectSchema).optional(),
  include: z.lazy(() => AvailabilityIncludeSchema).optional(),
}).strict();

export const AvailabilitySelectSchema: z.ZodType<Prisma.AvailabilitySelect> = z.object({
  membershipId: z.boolean().optional(),
  potentialDateTimeId: z.boolean().optional(),
  status: z.boolean().optional(),
  membership: z.union([z.boolean(),z.lazy(() => MembershipArgsSchema)]).optional(),
  potentialDateTime: z.union([z.boolean(),z.lazy(() => PotentialDateTimeArgsSchema)]).optional(),
}).strict()

// POST
//------------------------------------------------------

export const PostIncludeSchema: z.ZodType<Prisma.PostInclude> = z.object({
  author: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  replies: z.union([z.boolean(),z.lazy(() => ReplyFindManyArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PostCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const PostArgsSchema: z.ZodType<Prisma.PostDefaultArgs> = z.object({
  select: z.lazy(() => PostSelectSchema).optional(),
  include: z.lazy(() => PostIncludeSchema).optional(),
}).strict();

export const PostCountOutputTypeArgsSchema: z.ZodType<Prisma.PostCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => PostCountOutputTypeSelectSchema).nullish(),
}).strict();

export const PostCountOutputTypeSelectSchema: z.ZodType<Prisma.PostCountOutputTypeSelect> = z.object({
  replies: z.boolean().optional(),
  notifications: z.boolean().optional(),
}).strict();

export const PostSelectSchema: z.ZodType<Prisma.PostSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  editedAt: z.boolean().optional(),
  authorId: z.boolean().optional(),
  eventId: z.boolean().optional(),
  title: z.boolean().optional(),
  content: z.boolean().optional(),
  author: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  replies: z.union([z.boolean(),z.lazy(() => ReplyFindManyArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PostCountOutputTypeArgsSchema)]).optional(),
}).strict()

// REPLY
//------------------------------------------------------

export const ReplyIncludeSchema: z.ZodType<Prisma.ReplyInclude> = z.object({
  author: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  post: z.union([z.boolean(),z.lazy(() => PostArgsSchema)]).optional(),
}).strict();

export const ReplyArgsSchema: z.ZodType<Prisma.ReplyDefaultArgs> = z.object({
  select: z.lazy(() => ReplySelectSchema).optional(),
  include: z.lazy(() => ReplyIncludeSchema).optional(),
}).strict();

export const ReplySelectSchema: z.ZodType<Prisma.ReplySelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  authorId: z.boolean().optional(),
  postId: z.boolean().optional(),
  text: z.boolean().optional(),
  author: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  post: z.union([z.boolean(),z.lazy(() => PostArgsSchema)]).optional(),
}).strict()

// INVITE
//------------------------------------------------------

export const InviteIncludeSchema: z.ZodType<Prisma.InviteInclude> = z.object({
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  createdBy: z.union([z.boolean(),z.lazy(() => MembershipArgsSchema)]).optional(),
}).strict();

export const InviteArgsSchema: z.ZodType<Prisma.InviteDefaultArgs> = z.object({
  select: z.lazy(() => InviteSelectSchema).optional(),
  include: z.lazy(() => InviteIncludeSchema).optional(),
}).strict();

export const InviteSelectSchema: z.ZodType<Prisma.InviteSelect> = z.object({
  id: z.boolean().optional(),
  eventId: z.boolean().optional(),
  createdById: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  usesRemaining: z.boolean().optional(),
  maxUses: z.boolean().optional(),
  name: z.boolean().optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  createdBy: z.union([z.boolean(),z.lazy(() => MembershipArgsSchema)]).optional(),
}).strict()

// NOTIFICATION
//------------------------------------------------------

export const NotificationIncludeSchema: z.ZodType<Prisma.NotificationInclude> = z.object({
  person: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  author: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  post: z.union([z.boolean(),z.lazy(() => PostArgsSchema)]).optional(),
}).strict();

export const NotificationArgsSchema: z.ZodType<Prisma.NotificationDefaultArgs> = z.object({
  select: z.lazy(() => NotificationSelectSchema).optional(),
  include: z.lazy(() => NotificationIncludeSchema).optional(),
}).strict();

export const NotificationSelectSchema: z.ZodType<Prisma.NotificationSelect> = z.object({
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
  person: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  author: z.union([z.boolean(),z.lazy(() => PersonArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  post: z.union([z.boolean(),z.lazy(() => PostArgsSchema)]).optional(),
}).strict()

// NOTIFICATION METHOD
//------------------------------------------------------

export const NotificationMethodIncludeSchema: z.ZodType<Prisma.NotificationMethodInclude> = z.object({
  settings: z.union([z.boolean(),z.lazy(() => PersonSettingsArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationSettingFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => NotificationMethodCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const NotificationMethodArgsSchema: z.ZodType<Prisma.NotificationMethodDefaultArgs> = z.object({
  select: z.lazy(() => NotificationMethodSelectSchema).optional(),
  include: z.lazy(() => NotificationMethodIncludeSchema).optional(),
}).strict();

export const NotificationMethodCountOutputTypeArgsSchema: z.ZodType<Prisma.NotificationMethodCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => NotificationMethodCountOutputTypeSelectSchema).nullish(),
}).strict();

export const NotificationMethodCountOutputTypeSelectSchema: z.ZodType<Prisma.NotificationMethodCountOutputTypeSelect> = z.object({
  notifications: z.boolean().optional(),
}).strict();

export const NotificationMethodSelectSchema: z.ZodType<Prisma.NotificationMethodSelect> = z.object({
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
  settings: z.union([z.boolean(),z.lazy(() => PersonSettingsArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationSettingFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => NotificationMethodCountOutputTypeArgsSchema)]).optional(),
}).strict()

// NOTIFICATION SETTING
//------------------------------------------------------

export const NotificationSettingIncludeSchema: z.ZodType<Prisma.NotificationSettingInclude> = z.object({
  notificationMethod: z.union([z.boolean(),z.lazy(() => NotificationMethodArgsSchema)]).optional(),
}).strict();

export const NotificationSettingArgsSchema: z.ZodType<Prisma.NotificationSettingDefaultArgs> = z.object({
  select: z.lazy(() => NotificationSettingSelectSchema).optional(),
  include: z.lazy(() => NotificationSettingIncludeSchema).optional(),
}).strict();

export const NotificationSettingSelectSchema: z.ZodType<Prisma.NotificationSettingSelect> = z.object({
  id: z.boolean().optional(),
  notificationType: z.boolean().optional(),
  methodId: z.boolean().optional(),
  enabled: z.boolean().optional(),
  notificationMethod: z.union([z.boolean(),z.lazy(() => NotificationMethodArgsSchema)]).optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  emailVerified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  image: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  imageKey: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  displayUsername: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  pronouns: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  bio: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  sessions: z.lazy(() => SessionListRelationFilterSchema).optional(),
  accounts: z.lazy(() => AccountListRelationFilterSchema).optional(),
  person: z.union([ z.lazy(() => PersonNullableScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional().nullable(),
});

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  imageKey: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  displayUsername: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  pronouns: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  bio: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionOrderByRelationAggregateInputSchema).optional(),
  accounts: z.lazy(() => AccountOrderByRelationAggregateInputSchema).optional(),
  person: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
});

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    email: z.string(),
    username: z.string(),
  }),
  z.object({
    id: z.string(),
    email: z.string(),
  }),
  z.object({
    id: z.string(),
    username: z.string(),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    email: z.string(),
    username: z.string(),
  }),
  z.object({
    email: z.string(),
  }),
  z.object({
    username: z.string(),
  }),
])
.and(z.strictObject({
  id: z.string().optional(),
  email: z.string().optional(),
  username: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  emailVerified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  image: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  imageKey: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  displayUsername: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  pronouns: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  bio: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  sessions: z.lazy(() => SessionListRelationFilterSchema).optional(),
  accounts: z.lazy(() => AccountListRelationFilterSchema).optional(),
  person: z.union([ z.lazy(() => PersonNullableScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional().nullable(),
}));

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  imageKey: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  displayUsername: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  pronouns: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  bio: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional(),
});

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  emailVerified: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  image: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  imageKey: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  displayUsername: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  pronouns: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  bio: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const PersonWhereInputSchema: z.ZodType<Prisma.PersonWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PersonWhereInputSchema), z.lazy(() => PersonWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PersonWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PersonWhereInputSchema), z.lazy(() => PersonWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  memberships: z.lazy(() => MembershipListRelationFilterSchema).optional(),
  posts: z.lazy(() => PostListRelationFilterSchema).optional(),
  replies: z.lazy(() => ReplyListRelationFilterSchema).optional(),
  notifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
  settings: z.union([ z.lazy(() => PersonSettingsNullableScalarRelationFilterSchema), z.lazy(() => PersonSettingsWhereInputSchema) ]).optional().nullable(),
});

export const PersonOrderByWithRelationInputSchema: z.ZodType<Prisma.PersonOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  memberships: z.lazy(() => MembershipOrderByRelationAggregateInputSchema).optional(),
  posts: z.lazy(() => PostOrderByRelationAggregateInputSchema).optional(),
  replies: z.lazy(() => ReplyOrderByRelationAggregateInputSchema).optional(),
  notifications: z.lazy(() => NotificationOrderByRelationAggregateInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationOrderByRelationAggregateInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsOrderByWithRelationInputSchema).optional(),
});

export const PersonWhereUniqueInputSchema: z.ZodType<Prisma.PersonWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => PersonWhereInputSchema), z.lazy(() => PersonWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PersonWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PersonWhereInputSchema), z.lazy(() => PersonWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  memberships: z.lazy(() => MembershipListRelationFilterSchema).optional(),
  posts: z.lazy(() => PostListRelationFilterSchema).optional(),
  replies: z.lazy(() => ReplyListRelationFilterSchema).optional(),
  notifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
  settings: z.union([ z.lazy(() => PersonSettingsNullableScalarRelationFilterSchema), z.lazy(() => PersonSettingsWhereInputSchema) ]).optional().nullable(),
}));

export const PersonOrderByWithAggregationInputSchema: z.ZodType<Prisma.PersonOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PersonCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PersonMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PersonMinOrderByAggregateInputSchema).optional(),
});

export const PersonScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PersonScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PersonScalarWhereWithAggregatesInputSchema), z.lazy(() => PersonScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PersonScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PersonScalarWhereWithAggregatesInputSchema), z.lazy(() => PersonScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const SessionWhereInputSchema: z.ZodType<Prisma.SessionWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  token: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const SessionOrderByWithRelationInputSchema: z.ZodType<Prisma.SessionOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userAgent: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const SessionWhereUniqueInputSchema: z.ZodType<Prisma.SessionWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    token: z.string(),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    token: z.string(),
  }),
])
.and(z.strictObject({
  id: z.string().optional(),
  token: z.string().optional(),
  AND: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const SessionOrderByWithAggregationInputSchema: z.ZodType<Prisma.SessionOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userAgent: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => SessionCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SessionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SessionMinOrderByAggregateInputSchema).optional(),
});

export const SessionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SessionScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SessionScalarWhereWithAggregatesInputSchema), z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionScalarWhereWithAggregatesInputSchema), z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  token: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
});

export const AccountWhereInputSchema: z.ZodType<Prisma.AccountWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accountId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const AccountOrderByWithRelationInputSchema: z.ZodType<Prisma.AccountOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  idToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  scope: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const AccountWhereUniqueInputSchema: z.ZodType<Prisma.AccountWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    providerId_accountId: z.lazy(() => AccountProviderIdAccountIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    providerId_accountId: z.lazy(() => AccountProviderIdAccountIdCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.string().optional(),
  providerId_accountId: z.lazy(() => AccountProviderIdAccountIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  accountId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const AccountOrderByWithAggregationInputSchema: z.ZodType<Prisma.AccountOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  idToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  scope: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AccountCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AccountMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AccountMinOrderByAggregateInputSchema).optional(),
});

export const AccountScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AccountScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AccountScalarWhereWithAggregatesInputSchema), z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountScalarWhereWithAggregatesInputSchema), z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  accountId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const VerificationWhereInputSchema: z.ZodType<Prisma.VerificationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VerificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  identifier: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const VerificationOrderByWithRelationInputSchema: z.ZodType<Prisma.VerificationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const VerificationWhereUniqueInputSchema: z.ZodType<Prisma.VerificationWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    identifier_value: z.lazy(() => VerificationIdentifierValueCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    identifier_value: z.lazy(() => VerificationIdentifierValueCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.string().optional(),
  identifier_value: z.lazy(() => VerificationIdentifierValueCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VerificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  identifier: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const VerificationOrderByWithAggregationInputSchema: z.ZodType<Prisma.VerificationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => VerificationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => VerificationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => VerificationMinOrderByAggregateInputSchema).optional(),
});

export const VerificationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.VerificationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema), z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema), z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  identifier: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const PersonSettingsWhereInputSchema: z.ZodType<Prisma.PersonSettingsWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PersonSettingsWhereInputSchema), z.lazy(() => PersonSettingsWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PersonSettingsWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PersonSettingsWhereInputSchema), z.lazy(() => PersonSettingsWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  personId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  person: z.union([ z.lazy(() => PersonScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional(),
  notificationMethods: z.lazy(() => NotificationMethodListRelationFilterSchema).optional(),
});

export const PersonSettingsOrderByWithRelationInputSchema: z.ZodType<Prisma.PersonSettingsOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
  person: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
  notificationMethods: z.lazy(() => NotificationMethodOrderByRelationAggregateInputSchema).optional(),
});

export const PersonSettingsWhereUniqueInputSchema: z.ZodType<Prisma.PersonSettingsWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    personId: z.string(),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    personId: z.string(),
  }),
])
.and(z.strictObject({
  id: z.string().optional(),
  personId: z.string().optional(),
  AND: z.union([ z.lazy(() => PersonSettingsWhereInputSchema), z.lazy(() => PersonSettingsWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PersonSettingsWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PersonSettingsWhereInputSchema), z.lazy(() => PersonSettingsWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  person: z.union([ z.lazy(() => PersonScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional(),
  notificationMethods: z.lazy(() => NotificationMethodListRelationFilterSchema).optional(),
}));

export const PersonSettingsOrderByWithAggregationInputSchema: z.ZodType<Prisma.PersonSettingsOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PersonSettingsCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PersonSettingsMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PersonSettingsMinOrderByAggregateInputSchema).optional(),
});

export const PersonSettingsScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PersonSettingsScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PersonSettingsScalarWhereWithAggregatesInputSchema), z.lazy(() => PersonSettingsScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PersonSettingsScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PersonSettingsScalarWhereWithAggregatesInputSchema), z.lazy(() => PersonSettingsScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  personId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
});

export const EventWhereInputSchema: z.ZodType<Prisma.EventWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  location: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  chosenDateTime: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  invites: z.lazy(() => InviteListRelationFilterSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeListRelationFilterSchema).optional(),
  posts: z.lazy(() => PostListRelationFilterSchema).optional(),
  memberships: z.lazy(() => MembershipListRelationFilterSchema).optional(),
  notifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
});

export const EventOrderByWithRelationInputSchema: z.ZodType<Prisma.EventOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  location: z.lazy(() => SortOrderSchema).optional(),
  chosenDateTime: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  invites: z.lazy(() => InviteOrderByRelationAggregateInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeOrderByRelationAggregateInputSchema).optional(),
  posts: z.lazy(() => PostOrderByRelationAggregateInputSchema).optional(),
  memberships: z.lazy(() => MembershipOrderByRelationAggregateInputSchema).optional(),
  notifications: z.lazy(() => NotificationOrderByRelationAggregateInputSchema).optional(),
});

export const EventWhereUniqueInputSchema: z.ZodType<Prisma.EventWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  location: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  chosenDateTime: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  invites: z.lazy(() => InviteListRelationFilterSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeListRelationFilterSchema).optional(),
  posts: z.lazy(() => PostListRelationFilterSchema).optional(),
  memberships: z.lazy(() => MembershipListRelationFilterSchema).optional(),
  notifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
}));

export const EventOrderByWithAggregationInputSchema: z.ZodType<Prisma.EventOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  location: z.lazy(() => SortOrderSchema).optional(),
  chosenDateTime: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => EventCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => EventMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => EventMinOrderByAggregateInputSchema).optional(),
});

export const EventScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.EventScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EventScalarWhereWithAggregatesInputSchema), z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventScalarWhereWithAggregatesInputSchema), z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  title: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  location: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  chosenDateTime: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const MembershipWhereInputSchema: z.ZodType<Prisma.MembershipWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => MembershipWhereInputSchema), z.lazy(() => MembershipWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => MembershipWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MembershipWhereInputSchema), z.lazy(() => MembershipWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  personId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => EnumStatusFilterSchema), z.lazy(() => StatusSchema) ]).optional(),
  person: z.union([ z.lazy(() => PersonScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityListRelationFilterSchema).optional(),
  invites: z.lazy(() => InviteListRelationFilterSchema).optional(),
});

export const MembershipOrderByWithRelationInputSchema: z.ZodType<Prisma.MembershipOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
  person: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  availabilities: z.lazy(() => AvailabilityOrderByRelationAggregateInputSchema).optional(),
  invites: z.lazy(() => InviteOrderByRelationAggregateInputSchema).optional(),
});

export const MembershipWhereUniqueInputSchema: z.ZodType<Prisma.MembershipWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => MembershipWhereInputSchema), z.lazy(() => MembershipWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => MembershipWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MembershipWhereInputSchema), z.lazy(() => MembershipWhereInputSchema).array() ]).optional(),
  personId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => EnumStatusFilterSchema), z.lazy(() => StatusSchema) ]).optional(),
  person: z.union([ z.lazy(() => PersonScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityListRelationFilterSchema).optional(),
  invites: z.lazy(() => InviteListRelationFilterSchema).optional(),
}));

export const MembershipOrderByWithAggregationInputSchema: z.ZodType<Prisma.MembershipOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => MembershipCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => MembershipMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => MembershipMinOrderByAggregateInputSchema).optional(),
});

export const MembershipScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.MembershipScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => MembershipScalarWhereWithAggregatesInputSchema), z.lazy(() => MembershipScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => MembershipScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MembershipScalarWhereWithAggregatesInputSchema), z.lazy(() => MembershipScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  personId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleWithAggregatesFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => EnumStatusWithAggregatesFilterSchema), z.lazy(() => StatusSchema) ]).optional(),
});

export const PotentialDateTimeWhereInputSchema: z.ZodType<Prisma.PotentialDateTimeWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PotentialDateTimeWhereInputSchema), z.lazy(() => PotentialDateTimeWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PotentialDateTimeWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PotentialDateTimeWhereInputSchema), z.lazy(() => PotentialDateTimeWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  dateTime: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityListRelationFilterSchema).optional(),
});

export const PotentialDateTimeOrderByWithRelationInputSchema: z.ZodType<Prisma.PotentialDateTimeOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  dateTime: z.lazy(() => SortOrderSchema).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  availabilities: z.lazy(() => AvailabilityOrderByRelationAggregateInputSchema).optional(),
});

export const PotentialDateTimeWhereUniqueInputSchema: z.ZodType<Prisma.PotentialDateTimeWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => PotentialDateTimeWhereInputSchema), z.lazy(() => PotentialDateTimeWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PotentialDateTimeWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PotentialDateTimeWhereInputSchema), z.lazy(() => PotentialDateTimeWhereInputSchema).array() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  dateTime: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityListRelationFilterSchema).optional(),
}));

export const PotentialDateTimeOrderByWithAggregationInputSchema: z.ZodType<Prisma.PotentialDateTimeOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  dateTime: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PotentialDateTimeCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PotentialDateTimeMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PotentialDateTimeMinOrderByAggregateInputSchema).optional(),
});

export const PotentialDateTimeScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PotentialDateTimeScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PotentialDateTimeScalarWhereWithAggregatesInputSchema), z.lazy(() => PotentialDateTimeScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PotentialDateTimeScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PotentialDateTimeScalarWhereWithAggregatesInputSchema), z.lazy(() => PotentialDateTimeScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  dateTime: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const AvailabilityWhereInputSchema: z.ZodType<Prisma.AvailabilityWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AvailabilityWhereInputSchema), z.lazy(() => AvailabilityWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AvailabilityWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AvailabilityWhereInputSchema), z.lazy(() => AvailabilityWhereInputSchema).array() ]).optional(),
  membershipId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  potentialDateTimeId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumStatusFilterSchema), z.lazy(() => StatusSchema) ]).optional(),
  membership: z.union([ z.lazy(() => MembershipScalarRelationFilterSchema), z.lazy(() => MembershipWhereInputSchema) ]).optional(),
  potentialDateTime: z.union([ z.lazy(() => PotentialDateTimeScalarRelationFilterSchema), z.lazy(() => PotentialDateTimeWhereInputSchema) ]).optional(),
});

export const AvailabilityOrderByWithRelationInputSchema: z.ZodType<Prisma.AvailabilityOrderByWithRelationInput> = z.strictObject({
  membershipId: z.lazy(() => SortOrderSchema).optional(),
  potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  membership: z.lazy(() => MembershipOrderByWithRelationInputSchema).optional(),
  potentialDateTime: z.lazy(() => PotentialDateTimeOrderByWithRelationInputSchema).optional(),
});

export const AvailabilityWhereUniqueInputSchema: z.ZodType<Prisma.AvailabilityWhereUniqueInput> = z.object({
  id: z.lazy(() => AvailabilityIdCompoundUniqueInputSchema),
})
.and(z.strictObject({
  id: z.lazy(() => AvailabilityIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => AvailabilityWhereInputSchema), z.lazy(() => AvailabilityWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AvailabilityWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AvailabilityWhereInputSchema), z.lazy(() => AvailabilityWhereInputSchema).array() ]).optional(),
  membershipId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  potentialDateTimeId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumStatusFilterSchema), z.lazy(() => StatusSchema) ]).optional(),
  membership: z.union([ z.lazy(() => MembershipScalarRelationFilterSchema), z.lazy(() => MembershipWhereInputSchema) ]).optional(),
  potentialDateTime: z.union([ z.lazy(() => PotentialDateTimeScalarRelationFilterSchema), z.lazy(() => PotentialDateTimeWhereInputSchema) ]).optional(),
}));

export const AvailabilityOrderByWithAggregationInputSchema: z.ZodType<Prisma.AvailabilityOrderByWithAggregationInput> = z.strictObject({
  membershipId: z.lazy(() => SortOrderSchema).optional(),
  potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AvailabilityCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AvailabilityMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AvailabilityMinOrderByAggregateInputSchema).optional(),
});

export const AvailabilityScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AvailabilityScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AvailabilityScalarWhereWithAggregatesInputSchema), z.lazy(() => AvailabilityScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AvailabilityScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AvailabilityScalarWhereWithAggregatesInputSchema), z.lazy(() => AvailabilityScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  membershipId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  potentialDateTimeId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumStatusWithAggregatesFilterSchema), z.lazy(() => StatusSchema) ]).optional(),
});

export const PostWhereInputSchema: z.ZodType<Prisma.PostWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PostWhereInputSchema), z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostWhereInputSchema), z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  editedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  authorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  author: z.union([ z.lazy(() => PersonScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  replies: z.lazy(() => ReplyListRelationFilterSchema).optional(),
  notifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
});

export const PostOrderByWithRelationInputSchema: z.ZodType<Prisma.PostOrderByWithRelationInput> = z.strictObject({
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
  replies: z.lazy(() => ReplyOrderByRelationAggregateInputSchema).optional(),
  notifications: z.lazy(() => NotificationOrderByRelationAggregateInputSchema).optional(),
});

export const PostWhereUniqueInputSchema: z.ZodType<Prisma.PostWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => PostWhereInputSchema), z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostWhereInputSchema), z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  editedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  authorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  author: z.union([ z.lazy(() => PersonScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  replies: z.lazy(() => ReplyListRelationFilterSchema).optional(),
  notifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
}));

export const PostOrderByWithAggregationInputSchema: z.ZodType<Prisma.PostOrderByWithAggregationInput> = z.strictObject({
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
});

export const PostScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PostScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PostScalarWhereWithAggregatesInputSchema), z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostScalarWhereWithAggregatesInputSchema), z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  editedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  authorId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
});

export const ReplyWhereInputSchema: z.ZodType<Prisma.ReplyWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReplyWhereInputSchema), z.lazy(() => ReplyWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReplyWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReplyWhereInputSchema), z.lazy(() => ReplyWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  authorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  postId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  text: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  author: z.union([ z.lazy(() => PersonScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional(),
  post: z.union([ z.lazy(() => PostScalarRelationFilterSchema), z.lazy(() => PostWhereInputSchema) ]).optional(),
});

export const ReplyOrderByWithRelationInputSchema: z.ZodType<Prisma.ReplyOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  authorId: z.lazy(() => SortOrderSchema).optional(),
  postId: z.lazy(() => SortOrderSchema).optional(),
  text: z.lazy(() => SortOrderSchema).optional(),
  author: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
  post: z.lazy(() => PostOrderByWithRelationInputSchema).optional(),
});

export const ReplyWhereUniqueInputSchema: z.ZodType<Prisma.ReplyWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => ReplyWhereInputSchema), z.lazy(() => ReplyWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReplyWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReplyWhereInputSchema), z.lazy(() => ReplyWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  authorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  postId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  text: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  author: z.union([ z.lazy(() => PersonScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional(),
  post: z.union([ z.lazy(() => PostScalarRelationFilterSchema), z.lazy(() => PostWhereInputSchema) ]).optional(),
}));

export const ReplyOrderByWithAggregationInputSchema: z.ZodType<Prisma.ReplyOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  authorId: z.lazy(() => SortOrderSchema).optional(),
  postId: z.lazy(() => SortOrderSchema).optional(),
  text: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ReplyCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ReplyMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ReplyMinOrderByAggregateInputSchema).optional(),
});

export const ReplyScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ReplyScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReplyScalarWhereWithAggregatesInputSchema), z.lazy(() => ReplyScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReplyScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReplyScalarWhereWithAggregatesInputSchema), z.lazy(() => ReplyScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  authorId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  postId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  text: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
});

export const InviteWhereInputSchema: z.ZodType<Prisma.InviteWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => InviteWhereInputSchema), z.lazy(() => InviteWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => InviteWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => InviteWhereInputSchema), z.lazy(() => InviteWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdById: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  usesRemaining: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  maxUses: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  createdBy: z.union([ z.lazy(() => MembershipScalarRelationFilterSchema), z.lazy(() => MembershipWhereInputSchema) ]).optional(),
});

export const InviteOrderByWithRelationInputSchema: z.ZodType<Prisma.InviteOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  createdById: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  usesRemaining: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  maxUses: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  createdBy: z.lazy(() => MembershipOrderByWithRelationInputSchema).optional(),
});

export const InviteWhereUniqueInputSchema: z.ZodType<Prisma.InviteWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => InviteWhereInputSchema), z.lazy(() => InviteWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => InviteWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => InviteWhereInputSchema), z.lazy(() => InviteWhereInputSchema).array() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdById: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  usesRemaining: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  maxUses: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  createdBy: z.union([ z.lazy(() => MembershipScalarRelationFilterSchema), z.lazy(() => MembershipWhereInputSchema) ]).optional(),
}));

export const InviteOrderByWithAggregationInputSchema: z.ZodType<Prisma.InviteOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  createdById: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  usesRemaining: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  maxUses: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => InviteCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => InviteAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => InviteMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => InviteMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => InviteSumOrderByAggregateInputSchema).optional(),
});

export const InviteScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.InviteScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => InviteScalarWhereWithAggregatesInputSchema), z.lazy(() => InviteScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => InviteScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => InviteScalarWhereWithAggregatesInputSchema), z.lazy(() => InviteScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdById: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  usesRemaining: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  maxUses: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  name: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const NotificationWhereInputSchema: z.ZodType<Prisma.NotificationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationWhereInputSchema), z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationWhereInputSchema), z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  personId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  authorId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => EnumNotificationTypeFilterSchema), z.lazy(() => NotificationTypeSchema) ]).optional(),
  eventId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  postId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  read: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  datetime: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => EnumStatusNullableFilterSchema), z.lazy(() => StatusSchema) ]).optional().nullable(),
  person: z.union([ z.lazy(() => PersonScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional(),
  author: z.union([ z.lazy(() => PersonNullableScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventNullableScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional().nullable(),
  post: z.union([ z.lazy(() => PostNullableScalarRelationFilterSchema), z.lazy(() => PostWhereInputSchema) ]).optional().nullable(),
});

export const NotificationOrderByWithRelationInputSchema: z.ZodType<Prisma.NotificationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
  authorId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  postId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  read: z.lazy(() => SortOrderSchema).optional(),
  datetime: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  rsvp: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  person: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
  author: z.lazy(() => PersonOrderByWithRelationInputSchema).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  post: z.lazy(() => PostOrderByWithRelationInputSchema).optional(),
});

export const NotificationWhereUniqueInputSchema: z.ZodType<Prisma.NotificationWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => NotificationWhereInputSchema), z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationWhereInputSchema), z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  personId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  authorId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => EnumNotificationTypeFilterSchema), z.lazy(() => NotificationTypeSchema) ]).optional(),
  eventId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  postId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  read: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  datetime: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => EnumStatusNullableFilterSchema), z.lazy(() => StatusSchema) ]).optional().nullable(),
  person: z.union([ z.lazy(() => PersonScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional(),
  author: z.union([ z.lazy(() => PersonNullableScalarRelationFilterSchema), z.lazy(() => PersonWhereInputSchema) ]).optional().nullable(),
  event: z.union([ z.lazy(() => EventNullableScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional().nullable(),
  post: z.union([ z.lazy(() => PostNullableScalarRelationFilterSchema), z.lazy(() => PostWhereInputSchema) ]).optional().nullable(),
}));

export const NotificationOrderByWithAggregationInputSchema: z.ZodType<Prisma.NotificationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
  authorId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  postId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  read: z.lazy(() => SortOrderSchema).optional(),
  datetime: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  rsvp: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => NotificationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => NotificationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => NotificationMinOrderByAggregateInputSchema).optional(),
});

export const NotificationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.NotificationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema), z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema), z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  personId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  authorId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => EnumNotificationTypeWithAggregatesFilterSchema), z.lazy(() => NotificationTypeSchema) ]).optional(),
  eventId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  postId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  read: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  datetime: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => EnumStatusNullableWithAggregatesFilterSchema), z.lazy(() => StatusSchema) ]).optional().nullable(),
});

export const NotificationMethodWhereInputSchema: z.ZodType<Prisma.NotificationMethodWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationMethodWhereInputSchema), z.lazy(() => NotificationMethodWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationMethodWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationMethodWhereInputSchema), z.lazy(() => NotificationMethodWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  settingsId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumNotificationMethodTypeFilterSchema), z.lazy(() => NotificationMethodTypeSchema) ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  webhookHeaders: z.lazy(() => JsonNullableFilterSchema).optional(),
  customTemplate: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => EnumWebhookFormatNullableFilterSchema), z.lazy(() => WebhookFormatSchema) ]).optional().nullable(),
  settings: z.union([ z.lazy(() => PersonSettingsScalarRelationFilterSchema), z.lazy(() => PersonSettingsWhereInputSchema) ]).optional(),
  notifications: z.lazy(() => NotificationSettingListRelationFilterSchema).optional(),
});

export const NotificationMethodOrderByWithRelationInputSchema: z.ZodType<Prisma.NotificationMethodOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  settingsId: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  webhookHeaders: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  customTemplate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  webhookFormat: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  settings: z.lazy(() => PersonSettingsOrderByWithRelationInputSchema).optional(),
  notifications: z.lazy(() => NotificationSettingOrderByRelationAggregateInputSchema).optional(),
});

export const NotificationMethodWhereUniqueInputSchema: z.ZodType<Prisma.NotificationMethodWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => NotificationMethodWhereInputSchema), z.lazy(() => NotificationMethodWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationMethodWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationMethodWhereInputSchema), z.lazy(() => NotificationMethodWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  settingsId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumNotificationMethodTypeFilterSchema), z.lazy(() => NotificationMethodTypeSchema) ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  webhookHeaders: z.lazy(() => JsonNullableFilterSchema).optional(),
  customTemplate: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => EnumWebhookFormatNullableFilterSchema), z.lazy(() => WebhookFormatSchema) ]).optional().nullable(),
  settings: z.union([ z.lazy(() => PersonSettingsScalarRelationFilterSchema), z.lazy(() => PersonSettingsWhereInputSchema) ]).optional(),
  notifications: z.lazy(() => NotificationSettingListRelationFilterSchema).optional(),
}));

export const NotificationMethodOrderByWithAggregationInputSchema: z.ZodType<Prisma.NotificationMethodOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  settingsId: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  webhookHeaders: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  customTemplate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  webhookFormat: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => NotificationMethodCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => NotificationMethodMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => NotificationMethodMinOrderByAggregateInputSchema).optional(),
});

export const NotificationMethodScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.NotificationMethodScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationMethodScalarWhereWithAggregatesInputSchema), z.lazy(() => NotificationMethodScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationMethodScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationMethodScalarWhereWithAggregatesInputSchema), z.lazy(() => NotificationMethodScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  settingsId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumNotificationMethodTypeWithAggregatesFilterSchema), z.lazy(() => NotificationMethodTypeSchema) ]).optional(),
  enabled: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  value: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  webhookHeaders: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  customTemplate: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => EnumWebhookFormatNullableWithAggregatesFilterSchema), z.lazy(() => WebhookFormatSchema) ]).optional().nullable(),
});

export const NotificationSettingWhereInputSchema: z.ZodType<Prisma.NotificationSettingWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationSettingWhereInputSchema), z.lazy(() => NotificationSettingWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationSettingWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationSettingWhereInputSchema), z.lazy(() => NotificationSettingWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  notificationType: z.union([ z.lazy(() => EnumNotificationTypeFilterSchema), z.lazy(() => NotificationTypeSchema) ]).optional(),
  methodId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  notificationMethod: z.union([ z.lazy(() => NotificationMethodScalarRelationFilterSchema), z.lazy(() => NotificationMethodWhereInputSchema) ]).optional(),
});

export const NotificationSettingOrderByWithRelationInputSchema: z.ZodType<Prisma.NotificationSettingOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  notificationType: z.lazy(() => SortOrderSchema).optional(),
  methodId: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  notificationMethod: z.lazy(() => NotificationMethodOrderByWithRelationInputSchema).optional(),
});

export const NotificationSettingWhereUniqueInputSchema: z.ZodType<Prisma.NotificationSettingWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    notificationType_methodId: z.lazy(() => NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    notificationType_methodId: z.lazy(() => NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.string().optional(),
  notificationType_methodId: z.lazy(() => NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => NotificationSettingWhereInputSchema), z.lazy(() => NotificationSettingWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationSettingWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationSettingWhereInputSchema), z.lazy(() => NotificationSettingWhereInputSchema).array() ]).optional(),
  notificationType: z.union([ z.lazy(() => EnumNotificationTypeFilterSchema), z.lazy(() => NotificationTypeSchema) ]).optional(),
  methodId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  notificationMethod: z.union([ z.lazy(() => NotificationMethodScalarRelationFilterSchema), z.lazy(() => NotificationMethodWhereInputSchema) ]).optional(),
}));

export const NotificationSettingOrderByWithAggregationInputSchema: z.ZodType<Prisma.NotificationSettingOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  notificationType: z.lazy(() => SortOrderSchema).optional(),
  methodId: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => NotificationSettingCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => NotificationSettingMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => NotificationSettingMinOrderByAggregateInputSchema).optional(),
});

export const NotificationSettingScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.NotificationSettingScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationSettingScalarWhereWithAggregatesInputSchema), z.lazy(() => NotificationSettingScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationSettingScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationSettingScalarWhereWithAggregatesInputSchema), z.lazy(() => NotificationSettingScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  notificationType: z.union([ z.lazy(() => EnumNotificationTypeWithAggregatesFilterSchema), z.lazy(() => NotificationTypeSchema) ]).optional(),
  methodId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
});

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.strictObject({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string().optional().nullable(),
  displayUsername: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  person: z.lazy(() => PersonCreateNestedOneWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string().optional().nullable(),
  displayUsername: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  person: z.lazy(() => PersonUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
});

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageKey: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  displayUsername: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pronouns: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bio: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  person: z.lazy(() => PersonUpdateOneWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageKey: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  displayUsername: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pronouns: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bio: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  person: z.lazy(() => PersonUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
});

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string().optional().nullable(),
  displayUsername: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
});

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageKey: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  displayUsername: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pronouns: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bio: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageKey: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  displayUsername: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pronouns: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bio: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PersonCreateInputSchema: z.ZodType<Prisma.PersonCreateInput> = z.strictObject({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPersonInputSchema),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonUncheckedCreateInputSchema: z.ZodType<Prisma.PersonUncheckedCreateInput> = z.strictObject({
  id: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonUpdateInputSchema: z.ZodType<Prisma.PersonUpdateInput> = z.strictObject({
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutPersonNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const PersonUncheckedUpdateInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const PersonCreateManyInputSchema: z.ZodType<Prisma.PersonCreateManyInput> = z.strictObject({
  id: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const PersonUpdateManyMutationInputSchema: z.ZodType<Prisma.PersonUpdateManyMutationInput> = z.strictObject({
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PersonUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SessionCreateInputSchema: z.ZodType<Prisma.SessionCreateInput> = z.strictObject({
  id: z.string().optional(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutSessionsInputSchema),
});

export const SessionUncheckedCreateInputSchema: z.ZodType<Prisma.SessionUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  userId: z.string(),
});

export const SessionUpdateInputSchema: z.ZodType<Prisma.SessionUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSessionsNestedInputSchema).optional(),
});

export const SessionUncheckedUpdateInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SessionCreateManyInputSchema: z.ZodType<Prisma.SessionCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  userId: z.string(),
});

export const SessionUpdateManyMutationInputSchema: z.ZodType<Prisma.SessionUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountCreateInputSchema: z.ZodType<Prisma.AccountCreateInput> = z.strictObject({
  id: z.string().optional(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutAccountsInputSchema),
});

export const AccountUncheckedCreateInputSchema: z.ZodType<Prisma.AccountUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AccountUpdateInputSchema: z.ZodType<Prisma.AccountUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutAccountsNestedInputSchema).optional(),
});

export const AccountUncheckedUpdateInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountCreateManyInputSchema: z.ZodType<Prisma.AccountCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AccountUpdateManyMutationInputSchema: z.ZodType<Prisma.AccountUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const VerificationCreateInputSchema: z.ZodType<Prisma.VerificationCreateInput> = z.strictObject({
  id: z.string().optional(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const VerificationUncheckedCreateInputSchema: z.ZodType<Prisma.VerificationUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const VerificationUpdateInputSchema: z.ZodType<Prisma.VerificationUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const VerificationUncheckedUpdateInputSchema: z.ZodType<Prisma.VerificationUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const VerificationCreateManyInputSchema: z.ZodType<Prisma.VerificationCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const VerificationUpdateManyMutationInputSchema: z.ZodType<Prisma.VerificationUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const VerificationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.VerificationUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PersonSettingsCreateInputSchema: z.ZodType<Prisma.PersonSettingsCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  person: z.lazy(() => PersonCreateNestedOneWithoutSettingsInputSchema),
  notificationMethods: z.lazy(() => NotificationMethodCreateNestedManyWithoutSettingsInputSchema).optional(),
});

export const PersonSettingsUncheckedCreateInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
  notificationMethods: z.lazy(() => NotificationMethodUncheckedCreateNestedManyWithoutSettingsInputSchema).optional(),
});

export const PersonSettingsUpdateInputSchema: z.ZodType<Prisma.PersonSettingsUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  person: z.lazy(() => PersonUpdateOneRequiredWithoutSettingsNestedInputSchema).optional(),
  notificationMethods: z.lazy(() => NotificationMethodUpdateManyWithoutSettingsNestedInputSchema).optional(),
});

export const PersonSettingsUncheckedUpdateInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  notificationMethods: z.lazy(() => NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInputSchema).optional(),
});

export const PersonSettingsCreateManyInputSchema: z.ZodType<Prisma.PersonSettingsCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
});

export const PersonSettingsUpdateManyMutationInputSchema: z.ZodType<Prisma.PersonSettingsUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PersonSettingsUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EventCreateInputSchema: z.ZodType<Prisma.EventCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  invites: z.lazy(() => InviteCreateNestedManyWithoutEventInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeCreateNestedManyWithoutEventInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutEventInputSchema).optional(),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutEventInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateInputSchema: z.ZodType<Prisma.EventUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  invites: z.lazy(() => InviteUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUpdateInputSchema: z.ZodType<Prisma.EventUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invites: z.lazy(() => InviteUpdateManyWithoutEventNestedInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUpdateManyWithoutEventNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutEventNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutEventNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateInputSchema: z.ZodType<Prisma.EventUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invites: z.lazy(() => InviteUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventCreateManyInputSchema: z.ZodType<Prisma.EventCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
});

export const EventUpdateManyMutationInputSchema: z.ZodType<Prisma.EventUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const EventUncheckedUpdateManyInputSchema: z.ZodType<Prisma.EventUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const MembershipCreateInputSchema: z.ZodType<Prisma.MembershipCreateInput> = z.strictObject({
  id: z.string().optional(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
  person: z.lazy(() => PersonCreateNestedOneWithoutMembershipsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutMembershipsInputSchema),
  availabilities: z.lazy(() => AvailabilityCreateNestedManyWithoutMembershipInputSchema).optional(),
  invites: z.lazy(() => InviteCreateNestedManyWithoutCreatedByInputSchema).optional(),
});

export const MembershipUncheckedCreateInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  personId: z.string(),
  eventId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema).optional(),
  invites: z.lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema).optional(),
});

export const MembershipUpdateInputSchema: z.ZodType<Prisma.MembershipUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  person: z.lazy(() => PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutMembershipsNestedInputSchema).optional(),
  availabilities: z.lazy(() => AvailabilityUpdateManyWithoutMembershipNestedInputSchema).optional(),
  invites: z.lazy(() => InviteUpdateManyWithoutCreatedByNestedInputSchema).optional(),
});

export const MembershipUncheckedUpdateInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema).optional(),
  invites: z.lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema).optional(),
});

export const MembershipCreateManyInputSchema: z.ZodType<Prisma.MembershipCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  personId: z.string(),
  eventId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
});

export const MembershipUpdateManyMutationInputSchema: z.ZodType<Prisma.MembershipUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const MembershipUncheckedUpdateManyInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PotentialDateTimeCreateInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateInput> = z.strictObject({
  id: z.string().optional(),
  dateTime: z.coerce.date().optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutPotentialDateTimesInputSchema),
  availabilities: z.lazy(() => AvailabilityCreateNestedManyWithoutPotentialDateTimeInputSchema).optional(),
});

export const PotentialDateTimeUncheckedCreateInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  eventId: z.string(),
  dateTime: z.coerce.date().optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInputSchema).optional(),
});

export const PotentialDateTimeUpdateInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  dateTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutPotentialDateTimesNestedInputSchema).optional(),
  availabilities: z.lazy(() => AvailabilityUpdateManyWithoutPotentialDateTimeNestedInputSchema).optional(),
});

export const PotentialDateTimeUncheckedUpdateInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  dateTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInputSchema).optional(),
});

export const PotentialDateTimeCreateManyInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  eventId: z.string(),
  dateTime: z.coerce.date().optional(),
});

export const PotentialDateTimeUpdateManyMutationInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  dateTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PotentialDateTimeUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  dateTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AvailabilityCreateInputSchema: z.ZodType<Prisma.AvailabilityCreateInput> = z.strictObject({
  status: z.lazy(() => StatusSchema),
  membership: z.lazy(() => MembershipCreateNestedOneWithoutAvailabilitiesInputSchema),
  potentialDateTime: z.lazy(() => PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInputSchema),
});

export const AvailabilityUncheckedCreateInputSchema: z.ZodType<Prisma.AvailabilityUncheckedCreateInput> = z.strictObject({
  membershipId: z.string(),
  potentialDateTimeId: z.string(),
  status: z.lazy(() => StatusSchema),
});

export const AvailabilityUpdateInputSchema: z.ZodType<Prisma.AvailabilityUpdateInput> = z.strictObject({
  status: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  membership: z.lazy(() => MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema).optional(),
  potentialDateTime: z.lazy(() => PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema).optional(),
});

export const AvailabilityUncheckedUpdateInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateInput> = z.strictObject({
  membershipId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  potentialDateTimeId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AvailabilityCreateManyInputSchema: z.ZodType<Prisma.AvailabilityCreateManyInput> = z.strictObject({
  membershipId: z.string(),
  potentialDateTimeId: z.string(),
  status: z.lazy(() => StatusSchema),
});

export const AvailabilityUpdateManyMutationInputSchema: z.ZodType<Prisma.AvailabilityUpdateManyMutationInput> = z.strictObject({
  status: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AvailabilityUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateManyInput> = z.strictObject({
  membershipId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  potentialDateTimeId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PostCreateInputSchema: z.ZodType<Prisma.PostCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  title: z.string(),
  content: z.string(),
  author: z.lazy(() => PersonCreateNestedOneWithoutPostsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutPostsInputSchema),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutPostInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPostInputSchema).optional(),
});

export const PostUncheckedCreateInputSchema: z.ZodType<Prisma.PostUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  authorId: z.string(),
  eventId: z.string(),
  title: z.string(),
  content: z.string(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
});

export const PostUpdateInputSchema: z.ZodType<Prisma.PostUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  author: z.lazy(() => PersonUpdateOneRequiredWithoutPostsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutPostsNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutPostNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPostNestedInputSchema).optional(),
});

export const PostUncheckedUpdateInputSchema: z.ZodType<Prisma.PostUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
});

export const PostCreateManyInputSchema: z.ZodType<Prisma.PostCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  authorId: z.string(),
  eventId: z.string(),
  title: z.string(),
  content: z.string(),
});

export const PostUpdateManyMutationInputSchema: z.ZodType<Prisma.PostUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PostUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReplyCreateInputSchema: z.ZodType<Prisma.ReplyCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  text: z.string(),
  author: z.lazy(() => PersonCreateNestedOneWithoutRepliesInputSchema),
  post: z.lazy(() => PostCreateNestedOneWithoutRepliesInputSchema),
});

export const ReplyUncheckedCreateInputSchema: z.ZodType<Prisma.ReplyUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  authorId: z.string(),
  postId: z.string(),
  text: z.string(),
});

export const ReplyUpdateInputSchema: z.ZodType<Prisma.ReplyUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  text: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  author: z.lazy(() => PersonUpdateOneRequiredWithoutRepliesNestedInputSchema).optional(),
  post: z.lazy(() => PostUpdateOneRequiredWithoutRepliesNestedInputSchema).optional(),
});

export const ReplyUncheckedUpdateInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  text: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReplyCreateManyInputSchema: z.ZodType<Prisma.ReplyCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  authorId: z.string(),
  postId: z.string(),
  text: z.string(),
});

export const ReplyUpdateManyMutationInputSchema: z.ZodType<Prisma.ReplyUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  text: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReplyUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  text: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const InviteCreateInputSchema: z.ZodType<Prisma.InviteCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usesRemaining: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  name: z.string().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutInvitesInputSchema),
  createdBy: z.lazy(() => MembershipCreateNestedOneWithoutInvitesInputSchema),
});

export const InviteUncheckedCreateInputSchema: z.ZodType<Prisma.InviteUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  eventId: z.string(),
  createdById: z.string(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usesRemaining: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  name: z.string().optional().nullable(),
});

export const InviteUpdateInputSchema: z.ZodType<Prisma.InviteUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usesRemaining: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxUses: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutInvitesNestedInputSchema).optional(),
  createdBy: z.lazy(() => MembershipUpdateOneRequiredWithoutInvitesNestedInputSchema).optional(),
});

export const InviteUncheckedUpdateInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdById: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usesRemaining: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxUses: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const InviteCreateManyInputSchema: z.ZodType<Prisma.InviteCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  eventId: z.string(),
  createdById: z.string(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usesRemaining: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  name: z.string().optional().nullable(),
});

export const InviteUpdateManyMutationInputSchema: z.ZodType<Prisma.InviteUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usesRemaining: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxUses: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const InviteUncheckedUpdateManyInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdById: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usesRemaining: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxUses: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationCreateInputSchema: z.ZodType<Prisma.NotificationCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => NotificationTypeSchema),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
  person: z.lazy(() => PersonCreateNestedOneWithoutNotificationsInputSchema),
  author: z.lazy(() => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema).optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema).optional(),
  post: z.lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema).optional(),
});

export const NotificationUncheckedCreateInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
  authorId: z.string().optional().nullable(),
  type: z.lazy(() => NotificationTypeSchema),
  eventId: z.string().optional().nullable(),
  postId: z.string().optional().nullable(),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
});

export const NotificationUpdateInputSchema: z.ZodType<Prisma.NotificationUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  person: z.lazy(() => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema).optional(),
  author: z.lazy(() => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema).optional(),
  post: z.lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema).optional(),
});

export const NotificationUncheckedUpdateInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationCreateManyInputSchema: z.ZodType<Prisma.NotificationCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
  authorId: z.string().optional().nullable(),
  type: z.lazy(() => NotificationTypeSchema),
  eventId: z.string().optional().nullable(),
  postId: z.string().optional().nullable(),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
});

export const NotificationUpdateManyMutationInputSchema: z.ZodType<Prisma.NotificationUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationMethodCreateInputSchema: z.ZodType<Prisma.NotificationMethodCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => NotificationMethodTypeSchema),
  enabled: z.boolean().optional(),
  name: z.string().optional().nullable(),
  value: z.string(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.string().optional().nullable(),
  webhookFormat: z.lazy(() => WebhookFormatSchema).optional().nullable(),
  settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutNotificationMethodsInputSchema),
  notifications: z.lazy(() => NotificationSettingCreateNestedManyWithoutNotificationMethodInputSchema).optional(),
});

export const NotificationMethodUncheckedCreateInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  settingsId: z.string(),
  type: z.lazy(() => NotificationMethodTypeSchema),
  enabled: z.boolean().optional(),
  name: z.string().optional().nullable(),
  value: z.string(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.string().optional().nullable(),
  webhookFormat: z.lazy(() => WebhookFormatSchema).optional().nullable(),
  notifications: z.lazy(() => NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInputSchema).optional(),
});

export const NotificationMethodUpdateInputSchema: z.ZodType<Prisma.NotificationMethodUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  settings: z.lazy(() => PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationSettingUpdateManyWithoutNotificationMethodNestedInputSchema).optional(),
});

export const NotificationMethodUncheckedUpdateInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  settingsId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  notifications: z.lazy(() => NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInputSchema).optional(),
});

export const NotificationMethodCreateManyInputSchema: z.ZodType<Prisma.NotificationMethodCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  settingsId: z.string(),
  type: z.lazy(() => NotificationMethodTypeSchema),
  enabled: z.boolean().optional(),
  name: z.string().optional().nullable(),
  value: z.string(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.string().optional().nullable(),
  webhookFormat: z.lazy(() => WebhookFormatSchema).optional().nullable(),
});

export const NotificationMethodUpdateManyMutationInputSchema: z.ZodType<Prisma.NotificationMethodUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationMethodUncheckedUpdateManyInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  settingsId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationSettingCreateInputSchema: z.ZodType<Prisma.NotificationSettingCreateInput> = z.strictObject({
  id: z.string().optional(),
  notificationType: z.lazy(() => NotificationTypeSchema),
  enabled: z.boolean().optional(),
  notificationMethod: z.lazy(() => NotificationMethodCreateNestedOneWithoutNotificationsInputSchema),
});

export const NotificationSettingUncheckedCreateInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedCreateInput> = z.strictObject({
  id: z.string().optional(),
  notificationType: z.lazy(() => NotificationTypeSchema),
  methodId: z.string(),
  enabled: z.boolean().optional(),
});

export const NotificationSettingUpdateInputSchema: z.ZodType<Prisma.NotificationSettingUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  notificationType: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  notificationMethod: z.lazy(() => NotificationMethodUpdateOneRequiredWithoutNotificationsNestedInputSchema).optional(),
});

export const NotificationSettingUncheckedUpdateInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  notificationType: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  methodId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationSettingCreateManyInputSchema: z.ZodType<Prisma.NotificationSettingCreateManyInput> = z.strictObject({
  id: z.string().optional(),
  notificationType: z.lazy(() => NotificationTypeSchema),
  methodId: z.string(),
  enabled: z.boolean().optional(),
});

export const NotificationSettingUpdateManyMutationInputSchema: z.ZodType<Prisma.NotificationSettingUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  notificationType: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationSettingUncheckedUpdateManyInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  notificationType: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  methodId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const SessionListRelationFilterSchema: z.ZodType<Prisma.SessionListRelationFilter> = z.strictObject({
  every: z.lazy(() => SessionWhereInputSchema).optional(),
  some: z.lazy(() => SessionWhereInputSchema).optional(),
  none: z.lazy(() => SessionWhereInputSchema).optional(),
});

export const AccountListRelationFilterSchema: z.ZodType<Prisma.AccountListRelationFilter> = z.strictObject({
  every: z.lazy(() => AccountWhereInputSchema).optional(),
  some: z.lazy(() => AccountWhereInputSchema).optional(),
  none: z.lazy(() => AccountWhereInputSchema).optional(),
});

export const PersonNullableScalarRelationFilterSchema: z.ZodType<Prisma.PersonNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => PersonWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => PersonWhereInputSchema).optional().nullable(),
});

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const SessionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SessionOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const AccountOrderByRelationAggregateInputSchema: z.ZodType<Prisma.AccountOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  imageKey: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  displayUsername: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  pronouns: z.lazy(() => SortOrderSchema).optional(),
  bio: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  imageKey: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  displayUsername: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  pronouns: z.lazy(() => SortOrderSchema).optional(),
  bio: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  imageKey: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  displayUsername: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  pronouns: z.lazy(() => SortOrderSchema).optional(),
  bio: z.lazy(() => SortOrderSchema).optional(),
});

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => UserWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWhereInputSchema).optional(),
});

export const MembershipListRelationFilterSchema: z.ZodType<Prisma.MembershipListRelationFilter> = z.strictObject({
  every: z.lazy(() => MembershipWhereInputSchema).optional(),
  some: z.lazy(() => MembershipWhereInputSchema).optional(),
  none: z.lazy(() => MembershipWhereInputSchema).optional(),
});

export const PostListRelationFilterSchema: z.ZodType<Prisma.PostListRelationFilter> = z.strictObject({
  every: z.lazy(() => PostWhereInputSchema).optional(),
  some: z.lazy(() => PostWhereInputSchema).optional(),
  none: z.lazy(() => PostWhereInputSchema).optional(),
});

export const ReplyListRelationFilterSchema: z.ZodType<Prisma.ReplyListRelationFilter> = z.strictObject({
  every: z.lazy(() => ReplyWhereInputSchema).optional(),
  some: z.lazy(() => ReplyWhereInputSchema).optional(),
  none: z.lazy(() => ReplyWhereInputSchema).optional(),
});

export const NotificationListRelationFilterSchema: z.ZodType<Prisma.NotificationListRelationFilter> = z.strictObject({
  every: z.lazy(() => NotificationWhereInputSchema).optional(),
  some: z.lazy(() => NotificationWhereInputSchema).optional(),
  none: z.lazy(() => NotificationWhereInputSchema).optional(),
});

export const PersonSettingsNullableScalarRelationFilterSchema: z.ZodType<Prisma.PersonSettingsNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => PersonSettingsWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => PersonSettingsWhereInputSchema).optional().nullable(),
});

export const MembershipOrderByRelationAggregateInputSchema: z.ZodType<Prisma.MembershipOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const PostOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PostOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const ReplyOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ReplyOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const NotificationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.NotificationOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const PersonCountOrderByAggregateInputSchema: z.ZodType<Prisma.PersonCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PersonMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PersonMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PersonMinOrderByAggregateInputSchema: z.ZodType<Prisma.PersonMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SessionCountOrderByAggregateInputSchema: z.ZodType<Prisma.SessionCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  userAgent: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const SessionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SessionMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  userAgent: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const SessionMinOrderByAggregateInputSchema: z.ZodType<Prisma.SessionMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  userAgent: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const AccountProviderIdAccountIdCompoundUniqueInputSchema: z.ZodType<Prisma.AccountProviderIdAccountIdCompoundUniqueInput> = z.strictObject({
  providerId: z.string(),
  accountId: z.string(),
});

export const AccountCountOrderByAggregateInputSchema: z.ZodType<Prisma.AccountCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  idToken: z.lazy(() => SortOrderSchema).optional(),
  accessTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  scope: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AccountMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AccountMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  idToken: z.lazy(() => SortOrderSchema).optional(),
  accessTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  scope: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AccountMinOrderByAggregateInputSchema: z.ZodType<Prisma.AccountMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  idToken: z.lazy(() => SortOrderSchema).optional(),
  accessTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  scope: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const VerificationIdentifierValueCompoundUniqueInputSchema: z.ZodType<Prisma.VerificationIdentifierValueCompoundUniqueInput> = z.strictObject({
  identifier: z.string(),
  value: z.string(),
});

export const VerificationCountOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const VerificationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const VerificationMinOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PersonScalarRelationFilterSchema: z.ZodType<Prisma.PersonScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => PersonWhereInputSchema).optional(),
  isNot: z.lazy(() => PersonWhereInputSchema).optional(),
});

export const NotificationMethodListRelationFilterSchema: z.ZodType<Prisma.NotificationMethodListRelationFilter> = z.strictObject({
  every: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
  some: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
  none: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
});

export const NotificationMethodOrderByRelationAggregateInputSchema: z.ZodType<Prisma.NotificationMethodOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const PersonSettingsCountOrderByAggregateInputSchema: z.ZodType<Prisma.PersonSettingsCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
});

export const PersonSettingsMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PersonSettingsMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
});

export const PersonSettingsMinOrderByAggregateInputSchema: z.ZodType<Prisma.PersonSettingsMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
});

export const InviteListRelationFilterSchema: z.ZodType<Prisma.InviteListRelationFilter> = z.strictObject({
  every: z.lazy(() => InviteWhereInputSchema).optional(),
  some: z.lazy(() => InviteWhereInputSchema).optional(),
  none: z.lazy(() => InviteWhereInputSchema).optional(),
});

export const PotentialDateTimeListRelationFilterSchema: z.ZodType<Prisma.PotentialDateTimeListRelationFilter> = z.strictObject({
  every: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
  some: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
  none: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
});

export const InviteOrderByRelationAggregateInputSchema: z.ZodType<Prisma.InviteOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const PotentialDateTimeOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PotentialDateTimeOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const EventCountOrderByAggregateInputSchema: z.ZodType<Prisma.EventCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  location: z.lazy(() => SortOrderSchema).optional(),
  chosenDateTime: z.lazy(() => SortOrderSchema).optional(),
});

export const EventMaxOrderByAggregateInputSchema: z.ZodType<Prisma.EventMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  location: z.lazy(() => SortOrderSchema).optional(),
  chosenDateTime: z.lazy(() => SortOrderSchema).optional(),
});

export const EventMinOrderByAggregateInputSchema: z.ZodType<Prisma.EventMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  location: z.lazy(() => SortOrderSchema).optional(),
  chosenDateTime: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumRoleFilterSchema: z.ZodType<Prisma.EnumRoleFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleFilterSchema) ]).optional(),
});

export const EnumStatusFilterSchema: z.ZodType<Prisma.EnumStatusFilter> = z.strictObject({
  equals: z.lazy(() => StatusSchema).optional(),
  in: z.lazy(() => StatusSchema).array().optional(),
  notIn: z.lazy(() => StatusSchema).array().optional(),
  not: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NestedEnumStatusFilterSchema) ]).optional(),
});

export const EventScalarRelationFilterSchema: z.ZodType<Prisma.EventScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => EventWhereInputSchema).optional(),
  isNot: z.lazy(() => EventWhereInputSchema).optional(),
});

export const AvailabilityListRelationFilterSchema: z.ZodType<Prisma.AvailabilityListRelationFilter> = z.strictObject({
  every: z.lazy(() => AvailabilityWhereInputSchema).optional(),
  some: z.lazy(() => AvailabilityWhereInputSchema).optional(),
  none: z.lazy(() => AvailabilityWhereInputSchema).optional(),
});

export const AvailabilityOrderByRelationAggregateInputSchema: z.ZodType<Prisma.AvailabilityOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const MembershipCountOrderByAggregateInputSchema: z.ZodType<Prisma.MembershipCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
});

export const MembershipMaxOrderByAggregateInputSchema: z.ZodType<Prisma.MembershipMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
});

export const MembershipMinOrderByAggregateInputSchema: z.ZodType<Prisma.MembershipMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  personId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  rsvpStatus: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.EnumRoleWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
});

export const EnumStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => StatusSchema).optional(),
  in: z.lazy(() => StatusSchema).array().optional(),
  notIn: z.lazy(() => StatusSchema).array().optional(),
  not: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NestedEnumStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumStatusFilterSchema).optional(),
});

export const PotentialDateTimeCountOrderByAggregateInputSchema: z.ZodType<Prisma.PotentialDateTimeCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  dateTime: z.lazy(() => SortOrderSchema).optional(),
});

export const PotentialDateTimeMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PotentialDateTimeMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  dateTime: z.lazy(() => SortOrderSchema).optional(),
});

export const PotentialDateTimeMinOrderByAggregateInputSchema: z.ZodType<Prisma.PotentialDateTimeMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  dateTime: z.lazy(() => SortOrderSchema).optional(),
});

export const MembershipScalarRelationFilterSchema: z.ZodType<Prisma.MembershipScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => MembershipWhereInputSchema).optional(),
  isNot: z.lazy(() => MembershipWhereInputSchema).optional(),
});

export const PotentialDateTimeScalarRelationFilterSchema: z.ZodType<Prisma.PotentialDateTimeScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
  isNot: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
});

export const AvailabilityIdCompoundUniqueInputSchema: z.ZodType<Prisma.AvailabilityIdCompoundUniqueInput> = z.strictObject({
  membershipId: z.string(),
  potentialDateTimeId: z.string(),
});

export const AvailabilityCountOrderByAggregateInputSchema: z.ZodType<Prisma.AvailabilityCountOrderByAggregateInput> = z.strictObject({
  membershipId: z.lazy(() => SortOrderSchema).optional(),
  potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
});

export const AvailabilityMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AvailabilityMaxOrderByAggregateInput> = z.strictObject({
  membershipId: z.lazy(() => SortOrderSchema).optional(),
  potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
});

export const AvailabilityMinOrderByAggregateInputSchema: z.ZodType<Prisma.AvailabilityMinOrderByAggregateInput> = z.strictObject({
  membershipId: z.lazy(() => SortOrderSchema).optional(),
  potentialDateTimeId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
});

export const PostCountOrderByAggregateInputSchema: z.ZodType<Prisma.PostCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  editedAt: z.lazy(() => SortOrderSchema).optional(),
  authorId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
});

export const PostMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PostMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  editedAt: z.lazy(() => SortOrderSchema).optional(),
  authorId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
});

export const PostMinOrderByAggregateInputSchema: z.ZodType<Prisma.PostMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  editedAt: z.lazy(() => SortOrderSchema).optional(),
  authorId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
});

export const PostScalarRelationFilterSchema: z.ZodType<Prisma.PostScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => PostWhereInputSchema).optional(),
  isNot: z.lazy(() => PostWhereInputSchema).optional(),
});

export const ReplyCountOrderByAggregateInputSchema: z.ZodType<Prisma.ReplyCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  authorId: z.lazy(() => SortOrderSchema).optional(),
  postId: z.lazy(() => SortOrderSchema).optional(),
  text: z.lazy(() => SortOrderSchema).optional(),
});

export const ReplyMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ReplyMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  authorId: z.lazy(() => SortOrderSchema).optional(),
  postId: z.lazy(() => SortOrderSchema).optional(),
  text: z.lazy(() => SortOrderSchema).optional(),
});

export const ReplyMinOrderByAggregateInputSchema: z.ZodType<Prisma.ReplyMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  authorId: z.lazy(() => SortOrderSchema).optional(),
  postId: z.lazy(() => SortOrderSchema).optional(),
  text: z.lazy(() => SortOrderSchema).optional(),
});

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const InviteCountOrderByAggregateInputSchema: z.ZodType<Prisma.InviteCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  createdById: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  usesRemaining: z.lazy(() => SortOrderSchema).optional(),
  maxUses: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
});

export const InviteAvgOrderByAggregateInputSchema: z.ZodType<Prisma.InviteAvgOrderByAggregateInput> = z.strictObject({
  usesRemaining: z.lazy(() => SortOrderSchema).optional(),
  maxUses: z.lazy(() => SortOrderSchema).optional(),
});

export const InviteMaxOrderByAggregateInputSchema: z.ZodType<Prisma.InviteMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  createdById: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  usesRemaining: z.lazy(() => SortOrderSchema).optional(),
  maxUses: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
});

export const InviteMinOrderByAggregateInputSchema: z.ZodType<Prisma.InviteMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  createdById: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  usesRemaining: z.lazy(() => SortOrderSchema).optional(),
  maxUses: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
});

export const InviteSumOrderByAggregateInputSchema: z.ZodType<Prisma.InviteSumOrderByAggregateInput> = z.strictObject({
  usesRemaining: z.lazy(() => SortOrderSchema).optional(),
  maxUses: z.lazy(() => SortOrderSchema).optional(),
});

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const EnumNotificationTypeFilterSchema: z.ZodType<Prisma.EnumNotificationTypeFilter> = z.strictObject({
  equals: z.lazy(() => NotificationTypeSchema).optional(),
  in: z.lazy(() => NotificationTypeSchema).array().optional(),
  notIn: z.lazy(() => NotificationTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => NestedEnumNotificationTypeFilterSchema) ]).optional(),
});

export const EnumStatusNullableFilterSchema: z.ZodType<Prisma.EnumStatusNullableFilter> = z.strictObject({
  equals: z.lazy(() => StatusSchema).optional().nullable(),
  in: z.lazy(() => StatusSchema).array().optional().nullable(),
  notIn: z.lazy(() => StatusSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NestedEnumStatusNullableFilterSchema) ]).optional().nullable(),
});

export const EventNullableScalarRelationFilterSchema: z.ZodType<Prisma.EventNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => EventWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => EventWhereInputSchema).optional().nullable(),
});

export const PostNullableScalarRelationFilterSchema: z.ZodType<Prisma.PostNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => PostWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => PostWhereInputSchema).optional().nullable(),
});

export const NotificationCountOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationCountOrderByAggregateInput> = z.strictObject({
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
});

export const NotificationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMaxOrderByAggregateInput> = z.strictObject({
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
});

export const NotificationMinOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMinOrderByAggregateInput> = z.strictObject({
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
});

export const EnumNotificationTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumNotificationTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => NotificationTypeSchema).optional(),
  in: z.lazy(() => NotificationTypeSchema).array().optional(),
  notIn: z.lazy(() => NotificationTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => NestedEnumNotificationTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumNotificationTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumNotificationTypeFilterSchema).optional(),
});

export const EnumStatusNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumStatusNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => StatusSchema).optional().nullable(),
  in: z.lazy(() => StatusSchema).array().optional().nullable(),
  notIn: z.lazy(() => StatusSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NestedEnumStatusNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumStatusNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumStatusNullableFilterSchema).optional(),
});

export const EnumNotificationMethodTypeFilterSchema: z.ZodType<Prisma.EnumNotificationMethodTypeFilter> = z.strictObject({
  equals: z.lazy(() => NotificationMethodTypeSchema).optional(),
  in: z.lazy(() => NotificationMethodTypeSchema).array().optional(),
  notIn: z.lazy(() => NotificationMethodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => NestedEnumNotificationMethodTypeFilterSchema) ]).optional(),
});

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const EnumWebhookFormatNullableFilterSchema: z.ZodType<Prisma.EnumWebhookFormatNullableFilter> = z.strictObject({
  equals: z.lazy(() => WebhookFormatSchema).optional().nullable(),
  in: z.lazy(() => WebhookFormatSchema).array().optional().nullable(),
  notIn: z.lazy(() => WebhookFormatSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NestedEnumWebhookFormatNullableFilterSchema) ]).optional().nullable(),
});

export const PersonSettingsScalarRelationFilterSchema: z.ZodType<Prisma.PersonSettingsScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
  isNot: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
});

export const NotificationSettingListRelationFilterSchema: z.ZodType<Prisma.NotificationSettingListRelationFilter> = z.strictObject({
  every: z.lazy(() => NotificationSettingWhereInputSchema).optional(),
  some: z.lazy(() => NotificationSettingWhereInputSchema).optional(),
  none: z.lazy(() => NotificationSettingWhereInputSchema).optional(),
});

export const NotificationSettingOrderByRelationAggregateInputSchema: z.ZodType<Prisma.NotificationSettingOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const NotificationMethodCountOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMethodCountOrderByAggregateInput> = z.strictObject({
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
});

export const NotificationMethodMaxOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMethodMaxOrderByAggregateInput> = z.strictObject({
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
});

export const NotificationMethodMinOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMethodMinOrderByAggregateInput> = z.strictObject({
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
});

export const EnumNotificationMethodTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumNotificationMethodTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => NotificationMethodTypeSchema).optional(),
  in: z.lazy(() => NotificationMethodTypeSchema).array().optional(),
  notIn: z.lazy(() => NotificationMethodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => NestedEnumNotificationMethodTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumNotificationMethodTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumNotificationMethodTypeFilterSchema).optional(),
});

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
});

export const EnumWebhookFormatNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumWebhookFormatNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => WebhookFormatSchema).optional().nullable(),
  in: z.lazy(() => WebhookFormatSchema).array().optional().nullable(),
  notIn: z.lazy(() => WebhookFormatSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NestedEnumWebhookFormatNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumWebhookFormatNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumWebhookFormatNullableFilterSchema).optional(),
});

export const NotificationMethodScalarRelationFilterSchema: z.ZodType<Prisma.NotificationMethodScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
  isNot: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
});

export const NotificationSettingNotificationTypeMethodIdCompoundUniqueInputSchema: z.ZodType<Prisma.NotificationSettingNotificationTypeMethodIdCompoundUniqueInput> = z.strictObject({
  notificationType: z.lazy(() => NotificationTypeSchema),
  methodId: z.string(),
});

export const NotificationSettingCountOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationSettingCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  notificationType: z.lazy(() => SortOrderSchema).optional(),
  methodId: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
});

export const NotificationSettingMaxOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationSettingMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  notificationType: z.lazy(() => SortOrderSchema).optional(),
  methodId: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
});

export const NotificationSettingMinOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationSettingMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  notificationType: z.lazy(() => SortOrderSchema).optional(),
  methodId: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
});

export const SessionCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
});

export const AccountCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
});

export const PersonCreateNestedOneWithoutUserInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutUserInputSchema), z.lazy(() => PersonUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutUserInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
});

export const SessionUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
});

export const AccountUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
});

export const PersonUncheckedCreateNestedOneWithoutUserInputSchema: z.ZodType<Prisma.PersonUncheckedCreateNestedOneWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutUserInputSchema), z.lazy(() => PersonUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutUserInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
});

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
});

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
});

export const SessionUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SessionUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
});

export const AccountUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.AccountUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
});

export const PersonUpdateOneWithoutUserNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutUserInputSchema), z.lazy(() => PersonUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutUserInputSchema).optional(),
  upsert: z.lazy(() => PersonUpsertWithoutUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => PersonWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => PersonWhereInputSchema) ]).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonUpdateToOneWithWhereWithoutUserInputSchema), z.lazy(() => PersonUpdateWithoutUserInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutUserInputSchema) ]).optional(),
});

export const SessionUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
});

export const AccountUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
});

export const PersonUncheckedUpdateOneWithoutUserNestedInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateOneWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutUserInputSchema), z.lazy(() => PersonUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutUserInputSchema).optional(),
  upsert: z.lazy(() => PersonUpsertWithoutUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => PersonWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => PersonWhereInputSchema) ]).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonUpdateToOneWithWhereWithoutUserInputSchema), z.lazy(() => PersonUpdateWithoutUserInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutUserInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutPersonInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutPersonInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutPersonInputSchema), z.lazy(() => UserUncheckedCreateWithoutPersonInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutPersonInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const MembershipCreateNestedManyWithoutPersonInputSchema: z.ZodType<Prisma.MembershipCreateNestedManyWithoutPersonInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutPersonInputSchema), z.lazy(() => MembershipCreateWithoutPersonInputSchema).array(), z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema), z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MembershipCreateManyPersonInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
});

export const PostCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.PostCreateNestedManyWithoutAuthorInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutAuthorInputSchema), z.lazy(() => PostCreateWithoutAuthorInputSchema).array(), z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyAuthorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
});

export const ReplyCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyCreateNestedManyWithoutAuthorInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReplyCreateWithoutAuthorInputSchema), z.lazy(() => ReplyCreateWithoutAuthorInputSchema).array(), z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReplyCreateManyAuthorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationCreateNestedManyWithoutPersonInputSchema: z.ZodType<Prisma.NotificationCreateNestedManyWithoutPersonInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutPersonInputSchema), z.lazy(() => NotificationCreateWithoutPersonInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyPersonInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationCreateNestedManyWithoutAuthorInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutAuthorInputSchema), z.lazy(() => NotificationCreateWithoutAuthorInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyAuthorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const PersonSettingsCreateNestedOneWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsCreateNestedOneWithoutPersonInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema), z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonSettingsCreateOrConnectWithoutPersonInputSchema).optional(),
  connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
});

export const MembershipUncheckedCreateNestedManyWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateNestedManyWithoutPersonInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutPersonInputSchema), z.lazy(() => MembershipCreateWithoutPersonInputSchema).array(), z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema), z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MembershipCreateManyPersonInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
});

export const PostUncheckedCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedCreateNestedManyWithoutAuthorInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutAuthorInputSchema), z.lazy(() => PostCreateWithoutAuthorInputSchema).array(), z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyAuthorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
});

export const ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUncheckedCreateNestedManyWithoutAuthorInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReplyCreateWithoutAuthorInputSchema), z.lazy(() => ReplyCreateWithoutAuthorInputSchema).array(), z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReplyCreateManyAuthorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationUncheckedCreateNestedManyWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateNestedManyWithoutPersonInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutPersonInputSchema), z.lazy(() => NotificationCreateWithoutPersonInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyPersonInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateNestedManyWithoutAuthorInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutAuthorInputSchema), z.lazy(() => NotificationCreateWithoutAuthorInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyAuthorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedCreateNestedOneWithoutPersonInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema), z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonSettingsCreateOrConnectWithoutPersonInputSchema).optional(),
  connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
});

export const UserUpdateOneRequiredWithoutPersonNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutPersonNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutPersonInputSchema), z.lazy(() => UserUncheckedCreateWithoutPersonInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutPersonInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutPersonInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutPersonInputSchema), z.lazy(() => UserUpdateWithoutPersonInputSchema), z.lazy(() => UserUncheckedUpdateWithoutPersonInputSchema) ]).optional(),
});

export const MembershipUpdateManyWithoutPersonNestedInputSchema: z.ZodType<Prisma.MembershipUpdateManyWithoutPersonNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutPersonInputSchema), z.lazy(() => MembershipCreateWithoutPersonInputSchema).array(), z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema), z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => MembershipUpsertWithWhereUniqueWithoutPersonInputSchema), z.lazy(() => MembershipUpsertWithWhereUniqueWithoutPersonInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MembershipCreateManyPersonInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => MembershipUpdateWithWhereUniqueWithoutPersonInputSchema), z.lazy(() => MembershipUpdateWithWhereUniqueWithoutPersonInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => MembershipUpdateManyWithWhereWithoutPersonInputSchema), z.lazy(() => MembershipUpdateManyWithWhereWithoutPersonInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => MembershipScalarWhereInputSchema), z.lazy(() => MembershipScalarWhereInputSchema).array() ]).optional(),
});

export const PostUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.PostUpdateManyWithoutAuthorNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutAuthorInputSchema), z.lazy(() => PostCreateWithoutAuthorInputSchema).array(), z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyAuthorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema), z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PostScalarWhereInputSchema), z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
});

export const ReplyUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.ReplyUpdateManyWithoutAuthorNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReplyCreateWithoutAuthorInputSchema), z.lazy(() => ReplyCreateWithoutAuthorInputSchema).array(), z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReplyCreateManyAuthorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReplyUpdateManyWithWhereWithoutAuthorInputSchema), z.lazy(() => ReplyUpdateManyWithWhereWithoutAuthorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReplyScalarWhereInputSchema), z.lazy(() => ReplyScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUpdateManyWithoutPersonNestedInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithoutPersonNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutPersonInputSchema), z.lazy(() => NotificationCreateWithoutPersonInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyPersonInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutPersonInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutPersonInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithoutAuthorNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutAuthorInputSchema), z.lazy(() => NotificationCreateWithoutAuthorInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyAuthorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutAuthorInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutAuthorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const PersonSettingsUpdateOneWithoutPersonNestedInputSchema: z.ZodType<Prisma.PersonSettingsUpdateOneWithoutPersonNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema), z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonSettingsCreateOrConnectWithoutPersonInputSchema).optional(),
  upsert: z.lazy(() => PersonSettingsUpsertWithoutPersonInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => PersonSettingsWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => PersonSettingsWhereInputSchema) ]).optional(),
  connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonSettingsUpdateToOneWithWhereWithoutPersonInputSchema), z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema), z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema) ]).optional(),
});

export const MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateManyWithoutPersonNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutPersonInputSchema), z.lazy(() => MembershipCreateWithoutPersonInputSchema).array(), z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema), z.lazy(() => MembershipCreateOrConnectWithoutPersonInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => MembershipUpsertWithWhereUniqueWithoutPersonInputSchema), z.lazy(() => MembershipUpsertWithWhereUniqueWithoutPersonInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MembershipCreateManyPersonInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => MembershipUpdateWithWhereUniqueWithoutPersonInputSchema), z.lazy(() => MembershipUpdateWithWhereUniqueWithoutPersonInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => MembershipUpdateManyWithWhereWithoutPersonInputSchema), z.lazy(() => MembershipUpdateManyWithWhereWithoutPersonInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => MembershipScalarWhereInputSchema), z.lazy(() => MembershipScalarWhereInputSchema).array() ]).optional(),
});

export const PostUncheckedUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutAuthorNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutAuthorInputSchema), z.lazy(() => PostCreateWithoutAuthorInputSchema).array(), z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyAuthorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema), z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PostScalarWhereInputSchema), z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
});

export const ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateManyWithoutAuthorNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReplyCreateWithoutAuthorInputSchema), z.lazy(() => ReplyCreateWithoutAuthorInputSchema).array(), z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => ReplyCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReplyCreateManyAuthorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReplyUpdateManyWithWhereWithoutAuthorInputSchema), z.lazy(() => ReplyUpdateManyWithWhereWithoutAuthorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReplyScalarWhereInputSchema), z.lazy(() => ReplyScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutPersonNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutPersonInputSchema), z.lazy(() => NotificationCreateWithoutPersonInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutPersonInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPersonInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyPersonInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPersonInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutPersonInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutPersonInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutAuthorNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutAuthorInputSchema), z.lazy(() => NotificationCreateWithoutAuthorInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutAuthorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyAuthorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutAuthorInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutAuthorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedUpdateOneWithoutPersonNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema), z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonSettingsCreateOrConnectWithoutPersonInputSchema).optional(),
  upsert: z.lazy(() => PersonSettingsUpsertWithoutPersonInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => PersonSettingsWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => PersonSettingsWhereInputSchema) ]).optional(),
  connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonSettingsUpdateToOneWithWhereWithoutPersonInputSchema), z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema), z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSessionsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSessionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const UserUpdateOneRequiredWithoutSessionsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSessionsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutSessionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutSessionsInputSchema), z.lazy(() => UserUpdateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutAccountsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutAccountsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional().nullable(),
});

export const UserUpdateOneRequiredWithoutAccountsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutAccountsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutAccountsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutAccountsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutAccountsInputSchema), z.lazy(() => UserUpdateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema) ]).optional(),
});

export const PersonCreateNestedOneWithoutSettingsInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutSettingsInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutSettingsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutSettingsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutSettingsInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
});

export const NotificationMethodCreateNestedManyWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodCreateNestedManyWithoutSettingsInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema).array(), z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema), z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationMethodCreateManySettingsInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationMethodWhereUniqueInputSchema), z.lazy(() => NotificationMethodWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationMethodUncheckedCreateNestedManyWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedCreateNestedManyWithoutSettingsInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema).array(), z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema), z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationMethodCreateManySettingsInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationMethodWhereUniqueInputSchema), z.lazy(() => NotificationMethodWhereUniqueInputSchema).array() ]).optional(),
});

export const PersonUpdateOneRequiredWithoutSettingsNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneRequiredWithoutSettingsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutSettingsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutSettingsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutSettingsInputSchema).optional(),
  upsert: z.lazy(() => PersonUpsertWithoutSettingsInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonUpdateToOneWithWhereWithoutSettingsInputSchema), z.lazy(() => PersonUpdateWithoutSettingsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutSettingsInputSchema) ]).optional(),
});

export const NotificationMethodUpdateManyWithoutSettingsNestedInputSchema: z.ZodType<Prisma.NotificationMethodUpdateManyWithoutSettingsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema).array(), z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema), z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationMethodCreateManySettingsInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationMethodWhereUniqueInputSchema), z.lazy(() => NotificationMethodWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationMethodWhereUniqueInputSchema), z.lazy(() => NotificationMethodWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationMethodWhereUniqueInputSchema), z.lazy(() => NotificationMethodWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationMethodWhereUniqueInputSchema), z.lazy(() => NotificationMethodWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationMethodScalarWhereInputSchema), z.lazy(() => NotificationMethodScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema).array(), z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema), z.lazy(() => NotificationMethodCreateOrConnectWithoutSettingsInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationMethodCreateManySettingsInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationMethodWhereUniqueInputSchema), z.lazy(() => NotificationMethodWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationMethodWhereUniqueInputSchema), z.lazy(() => NotificationMethodWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationMethodWhereUniqueInputSchema), z.lazy(() => NotificationMethodWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationMethodWhereUniqueInputSchema), z.lazy(() => NotificationMethodWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationMethodScalarWhereInputSchema), z.lazy(() => NotificationMethodScalarWhereInputSchema).array() ]).optional(),
});

export const InviteCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.InviteCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => InviteCreateWithoutEventInputSchema), z.lazy(() => InviteCreateWithoutEventInputSchema).array(), z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema), z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema), z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InviteCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
});

export const PotentialDateTimeCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema).array(), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema), z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PotentialDateTimeCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PotentialDateTimeWhereUniqueInputSchema), z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array() ]).optional(),
});

export const PostCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.PostCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutEventInputSchema), z.lazy(() => PostCreateWithoutEventInputSchema).array(), z.lazy(() => PostUncheckedCreateWithoutEventInputSchema), z.lazy(() => PostUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutEventInputSchema), z.lazy(() => PostCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
});

export const MembershipCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.MembershipCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutEventInputSchema), z.lazy(() => MembershipCreateWithoutEventInputSchema).array(), z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema), z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MembershipCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.NotificationCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutEventInputSchema), z.lazy(() => NotificationCreateWithoutEventInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const InviteUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.InviteUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => InviteCreateWithoutEventInputSchema), z.lazy(() => InviteCreateWithoutEventInputSchema).array(), z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema), z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema), z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InviteCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
});

export const PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema).array(), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema), z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PotentialDateTimeCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PotentialDateTimeWhereUniqueInputSchema), z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array() ]).optional(),
});

export const PostUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.PostUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutEventInputSchema), z.lazy(() => PostCreateWithoutEventInputSchema).array(), z.lazy(() => PostUncheckedCreateWithoutEventInputSchema), z.lazy(() => PostUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutEventInputSchema), z.lazy(() => PostCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
});

export const MembershipUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutEventInputSchema), z.lazy(() => MembershipCreateWithoutEventInputSchema).array(), z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema), z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MembershipCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutEventInputSchema), z.lazy(() => NotificationCreateWithoutEventInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const InviteUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.InviteUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => InviteCreateWithoutEventInputSchema), z.lazy(() => InviteCreateWithoutEventInputSchema).array(), z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema), z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema), z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => InviteUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => InviteUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InviteCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => InviteUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => InviteUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => InviteUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => InviteUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => InviteScalarWhereInputSchema), z.lazy(() => InviteScalarWhereInputSchema).array() ]).optional(),
});

export const PotentialDateTimeUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema).array(), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema), z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PotentialDateTimeCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PotentialDateTimeWhereUniqueInputSchema), z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PotentialDateTimeWhereUniqueInputSchema), z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PotentialDateTimeWhereUniqueInputSchema), z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PotentialDateTimeWhereUniqueInputSchema), z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PotentialDateTimeScalarWhereInputSchema), z.lazy(() => PotentialDateTimeScalarWhereInputSchema).array() ]).optional(),
});

export const PostUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.PostUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutEventInputSchema), z.lazy(() => PostCreateWithoutEventInputSchema).array(), z.lazy(() => PostUncheckedCreateWithoutEventInputSchema), z.lazy(() => PostUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutEventInputSchema), z.lazy(() => PostCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PostUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => PostUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PostUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => PostUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PostUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => PostUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PostScalarWhereInputSchema), z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
});

export const MembershipUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.MembershipUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutEventInputSchema), z.lazy(() => MembershipCreateWithoutEventInputSchema).array(), z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema), z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => MembershipUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => MembershipUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MembershipCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => MembershipUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => MembershipUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => MembershipUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => MembershipUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => MembershipScalarWhereInputSchema), z.lazy(() => MembershipScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutEventInputSchema), z.lazy(() => NotificationCreateWithoutEventInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const InviteUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => InviteCreateWithoutEventInputSchema), z.lazy(() => InviteCreateWithoutEventInputSchema).array(), z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema), z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema), z.lazy(() => InviteCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => InviteUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => InviteUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InviteCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => InviteUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => InviteUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => InviteUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => InviteUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => InviteScalarWhereInputSchema), z.lazy(() => InviteScalarWhereInputSchema).array() ]).optional(),
});

export const PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema).array(), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema), z.lazy(() => PotentialDateTimeCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PotentialDateTimeCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PotentialDateTimeWhereUniqueInputSchema), z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PotentialDateTimeWhereUniqueInputSchema), z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PotentialDateTimeWhereUniqueInputSchema), z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PotentialDateTimeWhereUniqueInputSchema), z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PotentialDateTimeScalarWhereInputSchema), z.lazy(() => PotentialDateTimeScalarWhereInputSchema).array() ]).optional(),
});

export const PostUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutEventInputSchema), z.lazy(() => PostCreateWithoutEventInputSchema).array(), z.lazy(() => PostUncheckedCreateWithoutEventInputSchema), z.lazy(() => PostUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutEventInputSchema), z.lazy(() => PostCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PostUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => PostUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema), z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PostUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => PostUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PostUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => PostUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PostScalarWhereInputSchema), z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
});

export const MembershipUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutEventInputSchema), z.lazy(() => MembershipCreateWithoutEventInputSchema).array(), z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema), z.lazy(() => MembershipCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => MembershipUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => MembershipUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MembershipCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => MembershipWhereUniqueInputSchema), z.lazy(() => MembershipWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => MembershipUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => MembershipUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => MembershipUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => MembershipUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => MembershipScalarWhereInputSchema), z.lazy(() => MembershipScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutEventInputSchema), z.lazy(() => NotificationCreateWithoutEventInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const PersonCreateNestedOneWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutMembershipsInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutMembershipsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutMembershipsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutMembershipsInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
});

export const EventCreateNestedOneWithoutMembershipsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutMembershipsInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutMembershipsInputSchema), z.lazy(() => EventUncheckedCreateWithoutMembershipsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutMembershipsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const AvailabilityCreateNestedManyWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityCreateNestedManyWithoutMembershipInput> = z.strictObject({
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema), z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema).array(), z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema), z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AvailabilityCreateManyMembershipInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
});

export const InviteCreateNestedManyWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteCreateNestedManyWithoutCreatedByInput> = z.strictObject({
  create: z.union([ z.lazy(() => InviteCreateWithoutCreatedByInputSchema), z.lazy(() => InviteCreateWithoutCreatedByInputSchema).array(), z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema), z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema), z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InviteCreateManyCreatedByInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
});

export const AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUncheckedCreateNestedManyWithoutMembershipInput> = z.strictObject({
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema), z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema).array(), z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema), z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AvailabilityCreateManyMembershipInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
});

export const InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUncheckedCreateNestedManyWithoutCreatedByInput> = z.strictObject({
  create: z.union([ z.lazy(() => InviteCreateWithoutCreatedByInputSchema), z.lazy(() => InviteCreateWithoutCreatedByInputSchema).array(), z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema), z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema), z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InviteCreateManyCreatedByInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumRoleFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumRoleFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => RoleSchema).optional(),
});

export const EnumStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => StatusSchema).optional(),
});

export const PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneRequiredWithoutMembershipsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutMembershipsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutMembershipsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutMembershipsInputSchema).optional(),
  upsert: z.lazy(() => PersonUpsertWithoutMembershipsInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonUpdateToOneWithWhereWithoutMembershipsInputSchema), z.lazy(() => PersonUpdateWithoutMembershipsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutMembershipsInputSchema) ]).optional(),
});

export const EventUpdateOneRequiredWithoutMembershipsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutMembershipsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutMembershipsInputSchema), z.lazy(() => EventUncheckedCreateWithoutMembershipsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutMembershipsInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutMembershipsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutMembershipsInputSchema), z.lazy(() => EventUpdateWithoutMembershipsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutMembershipsInputSchema) ]).optional(),
});

export const AvailabilityUpdateManyWithoutMembershipNestedInputSchema: z.ZodType<Prisma.AvailabilityUpdateManyWithoutMembershipNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema), z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema).array(), z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema), z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema), z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AvailabilityCreateManyMembershipInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema), z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema), z.lazy(() => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AvailabilityScalarWhereInputSchema), z.lazy(() => AvailabilityScalarWhereInputSchema).array() ]).optional(),
});

export const InviteUpdateManyWithoutCreatedByNestedInputSchema: z.ZodType<Prisma.InviteUpdateManyWithoutCreatedByNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => InviteCreateWithoutCreatedByInputSchema), z.lazy(() => InviteCreateWithoutCreatedByInputSchema).array(), z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema), z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema), z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema), z.lazy(() => InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InviteCreateManyCreatedByInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema), z.lazy(() => InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => InviteUpdateManyWithWhereWithoutCreatedByInputSchema), z.lazy(() => InviteUpdateManyWithWhereWithoutCreatedByInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => InviteScalarWhereInputSchema), z.lazy(() => InviteScalarWhereInputSchema).array() ]).optional(),
});

export const AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateManyWithoutMembershipNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema), z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema).array(), z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema), z.lazy(() => AvailabilityCreateOrConnectWithoutMembershipInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema), z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AvailabilityCreateManyMembershipInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema), z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema), z.lazy(() => AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AvailabilityScalarWhereInputSchema), z.lazy(() => AvailabilityScalarWhereInputSchema).array() ]).optional(),
});

export const InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateManyWithoutCreatedByNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => InviteCreateWithoutCreatedByInputSchema), z.lazy(() => InviteCreateWithoutCreatedByInputSchema).array(), z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema), z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema), z.lazy(() => InviteCreateOrConnectWithoutCreatedByInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema), z.lazy(() => InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InviteCreateManyCreatedByInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => InviteWhereUniqueInputSchema), z.lazy(() => InviteWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema), z.lazy(() => InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => InviteUpdateManyWithWhereWithoutCreatedByInputSchema), z.lazy(() => InviteUpdateManyWithWhereWithoutCreatedByInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => InviteScalarWhereInputSchema), z.lazy(() => InviteScalarWhereInputSchema).array() ]).optional(),
});

export const EventCreateNestedOneWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutPotentialDateTimesInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema), z.lazy(() => EventUncheckedCreateWithoutPotentialDateTimesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutPotentialDateTimesInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const AvailabilityCreateNestedManyWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityCreateNestedManyWithoutPotentialDateTimeInput> = z.strictObject({
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema).array(), z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
});

export const AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInput> = z.strictObject({
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema).array(), z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
});

export const EventUpdateOneRequiredWithoutPotentialDateTimesNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutPotentialDateTimesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema), z.lazy(() => EventUncheckedCreateWithoutPotentialDateTimesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutPotentialDateTimesInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutPotentialDateTimesInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutPotentialDateTimesInputSchema), z.lazy(() => EventUpdateWithoutPotentialDateTimesInputSchema), z.lazy(() => EventUncheckedUpdateWithoutPotentialDateTimesInputSchema) ]).optional(),
});

export const AvailabilityUpdateManyWithoutPotentialDateTimeNestedInputSchema: z.ZodType<Prisma.AvailabilityUpdateManyWithoutPotentialDateTimeNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema).array(), z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AvailabilityScalarWhereInputSchema), z.lazy(() => AvailabilityScalarWhereInputSchema).array() ]).optional(),
});

export const AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema).array(), z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AvailabilityWhereUniqueInputSchema), z.lazy(() => AvailabilityWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AvailabilityScalarWhereInputSchema), z.lazy(() => AvailabilityScalarWhereInputSchema).array() ]).optional(),
});

export const MembershipCreateNestedOneWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipCreateNestedOneWithoutAvailabilitiesInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => MembershipCreateOrConnectWithoutAvailabilitiesInputSchema).optional(),
  connect: z.lazy(() => MembershipWhereUniqueInputSchema).optional(),
});

export const PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInput> = z.strictObject({
  create: z.union([ z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInputSchema).optional(),
  connect: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).optional(),
});

export const MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema: z.ZodType<Prisma.MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => MembershipCreateOrConnectWithoutAvailabilitiesInputSchema).optional(),
  upsert: z.lazy(() => MembershipUpsertWithoutAvailabilitiesInputSchema).optional(),
  connect: z.lazy(() => MembershipWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => MembershipUpdateToOneWithWhereWithoutAvailabilitiesInputSchema), z.lazy(() => MembershipUpdateWithoutAvailabilitiesInputSchema), z.lazy(() => MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema) ]).optional(),
});

export const PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInputSchema).optional(),
  upsert: z.lazy(() => PotentialDateTimeUpsertWithoutAvailabilitiesInputSchema).optional(),
  connect: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PotentialDateTimeUpdateToOneWithWhereWithoutAvailabilitiesInputSchema), z.lazy(() => PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema), z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema) ]).optional(),
});

export const PersonCreateNestedOneWithoutPostsInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutPostsInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutPostsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutPostsInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
});

export const EventCreateNestedOneWithoutPostsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutPostsInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutPostsInputSchema), z.lazy(() => EventUncheckedCreateWithoutPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutPostsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const ReplyCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.ReplyCreateNestedManyWithoutPostInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReplyCreateWithoutPostInputSchema), z.lazy(() => ReplyCreateWithoutPostInputSchema).array(), z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema), z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReplyCreateManyPostInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.NotificationCreateNestedManyWithoutPostInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutPostInputSchema), z.lazy(() => NotificationCreateWithoutPostInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyPostInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const ReplyUncheckedCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.ReplyUncheckedCreateNestedManyWithoutPostInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReplyCreateWithoutPostInputSchema), z.lazy(() => ReplyCreateWithoutPostInputSchema).array(), z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema), z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReplyCreateManyPostInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationUncheckedCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateNestedManyWithoutPostInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutPostInputSchema), z.lazy(() => NotificationCreateWithoutPostInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyPostInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const PersonUpdateOneRequiredWithoutPostsNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneRequiredWithoutPostsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutPostsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutPostsInputSchema).optional(),
  upsert: z.lazy(() => PersonUpsertWithoutPostsInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonUpdateToOneWithWhereWithoutPostsInputSchema), z.lazy(() => PersonUpdateWithoutPostsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutPostsInputSchema) ]).optional(),
});

export const EventUpdateOneRequiredWithoutPostsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutPostsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutPostsInputSchema), z.lazy(() => EventUncheckedCreateWithoutPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutPostsInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutPostsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutPostsInputSchema), z.lazy(() => EventUpdateWithoutPostsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutPostsInputSchema) ]).optional(),
});

export const ReplyUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.ReplyUpdateManyWithoutPostNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReplyCreateWithoutPostInputSchema), z.lazy(() => ReplyCreateWithoutPostInputSchema).array(), z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema), z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReplyUpsertWithWhereUniqueWithoutPostInputSchema), z.lazy(() => ReplyUpsertWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReplyCreateManyPostInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReplyUpdateWithWhereUniqueWithoutPostInputSchema), z.lazy(() => ReplyUpdateWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReplyUpdateManyWithWhereWithoutPostInputSchema), z.lazy(() => ReplyUpdateManyWithWhereWithoutPostInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReplyScalarWhereInputSchema), z.lazy(() => ReplyScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithoutPostNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutPostInputSchema), z.lazy(() => NotificationCreateWithoutPostInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPostInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyPostInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPostInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutPostInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutPostInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const ReplyUncheckedUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateManyWithoutPostNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReplyCreateWithoutPostInputSchema), z.lazy(() => ReplyCreateWithoutPostInputSchema).array(), z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema), z.lazy(() => ReplyCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReplyUpsertWithWhereUniqueWithoutPostInputSchema), z.lazy(() => ReplyUpsertWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReplyCreateManyPostInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReplyWhereUniqueInputSchema), z.lazy(() => ReplyWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReplyUpdateWithWhereUniqueWithoutPostInputSchema), z.lazy(() => ReplyUpdateWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReplyUpdateManyWithWhereWithoutPostInputSchema), z.lazy(() => ReplyUpdateManyWithWhereWithoutPostInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReplyScalarWhereInputSchema), z.lazy(() => ReplyScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUncheckedUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutPostNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutPostInputSchema), z.lazy(() => NotificationCreateWithoutPostInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPostInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyPostInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPostInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutPostInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutPostInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const PersonCreateNestedOneWithoutRepliesInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutRepliesInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutRepliesInputSchema), z.lazy(() => PersonUncheckedCreateWithoutRepliesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutRepliesInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
});

export const PostCreateNestedOneWithoutRepliesInputSchema: z.ZodType<Prisma.PostCreateNestedOneWithoutRepliesInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutRepliesInputSchema), z.lazy(() => PostUncheckedCreateWithoutRepliesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PostCreateOrConnectWithoutRepliesInputSchema).optional(),
  connect: z.lazy(() => PostWhereUniqueInputSchema).optional(),
});

export const PersonUpdateOneRequiredWithoutRepliesNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneRequiredWithoutRepliesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutRepliesInputSchema), z.lazy(() => PersonUncheckedCreateWithoutRepliesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutRepliesInputSchema).optional(),
  upsert: z.lazy(() => PersonUpsertWithoutRepliesInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonUpdateToOneWithWhereWithoutRepliesInputSchema), z.lazy(() => PersonUpdateWithoutRepliesInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutRepliesInputSchema) ]).optional(),
});

export const PostUpdateOneRequiredWithoutRepliesNestedInputSchema: z.ZodType<Prisma.PostUpdateOneRequiredWithoutRepliesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutRepliesInputSchema), z.lazy(() => PostUncheckedCreateWithoutRepliesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PostCreateOrConnectWithoutRepliesInputSchema).optional(),
  upsert: z.lazy(() => PostUpsertWithoutRepliesInputSchema).optional(),
  connect: z.lazy(() => PostWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PostUpdateToOneWithWhereWithoutRepliesInputSchema), z.lazy(() => PostUpdateWithoutRepliesInputSchema), z.lazy(() => PostUncheckedUpdateWithoutRepliesInputSchema) ]).optional(),
});

export const EventCreateNestedOneWithoutInvitesInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutInvitesInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutInvitesInputSchema), z.lazy(() => EventUncheckedCreateWithoutInvitesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutInvitesInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const MembershipCreateNestedOneWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipCreateNestedOneWithoutInvitesInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutInvitesInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutInvitesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => MembershipCreateOrConnectWithoutInvitesInputSchema).optional(),
  connect: z.lazy(() => MembershipWhereUniqueInputSchema).optional(),
});

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const EventUpdateOneRequiredWithoutInvitesNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutInvitesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutInvitesInputSchema), z.lazy(() => EventUncheckedCreateWithoutInvitesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutInvitesInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutInvitesInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutInvitesInputSchema), z.lazy(() => EventUpdateWithoutInvitesInputSchema), z.lazy(() => EventUncheckedUpdateWithoutInvitesInputSchema) ]).optional(),
});

export const MembershipUpdateOneRequiredWithoutInvitesNestedInputSchema: z.ZodType<Prisma.MembershipUpdateOneRequiredWithoutInvitesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => MembershipCreateWithoutInvitesInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutInvitesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => MembershipCreateOrConnectWithoutInvitesInputSchema).optional(),
  upsert: z.lazy(() => MembershipUpsertWithoutInvitesInputSchema).optional(),
  connect: z.lazy(() => MembershipWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => MembershipUpdateToOneWithWhereWithoutInvitesInputSchema), z.lazy(() => MembershipUpdateWithoutInvitesInputSchema), z.lazy(() => MembershipUncheckedUpdateWithoutInvitesInputSchema) ]).optional(),
});

export const PersonCreateNestedOneWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutNotificationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutNotificationsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutNotificationsInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
});

export const PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonCreateNestedOneWithoutAuthoredNotificationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutAuthoredNotificationsInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
});

export const EventCreateNestedOneWithoutNotificationsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutNotificationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutNotificationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutNotificationsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const PostCreateNestedOneWithoutNotificationsInputSchema: z.ZodType<Prisma.PostCreateNestedOneWithoutNotificationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutNotificationsInputSchema), z.lazy(() => PostUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PostCreateOrConnectWithoutNotificationsInputSchema).optional(),
  connect: z.lazy(() => PostWhereUniqueInputSchema).optional(),
});

export const EnumNotificationTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumNotificationTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => NotificationTypeSchema).optional(),
});

export const NullableEnumStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => StatusSchema).optional().nullable(),
});

export const PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneRequiredWithoutNotificationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutNotificationsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutNotificationsInputSchema).optional(),
  upsert: z.lazy(() => PersonUpsertWithoutNotificationsInputSchema).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonUpdateToOneWithWhereWithoutNotificationsInputSchema), z.lazy(() => PersonUpdateWithoutNotificationsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutNotificationsInputSchema) ]).optional(),
});

export const PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema: z.ZodType<Prisma.PersonUpdateOneWithoutAuthoredNotificationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonCreateOrConnectWithoutAuthoredNotificationsInputSchema).optional(),
  upsert: z.lazy(() => PersonUpsertWithoutAuthoredNotificationsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => PersonWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => PersonWhereInputSchema) ]).optional(),
  connect: z.lazy(() => PersonWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonUpdateToOneWithWhereWithoutAuthoredNotificationsInputSchema), z.lazy(() => PersonUpdateWithoutAuthoredNotificationsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema) ]).optional(),
});

export const EventUpdateOneWithoutNotificationsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneWithoutNotificationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutNotificationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutNotificationsInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutNotificationsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => EventWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => EventWhereInputSchema) ]).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutNotificationsInputSchema), z.lazy(() => EventUpdateWithoutNotificationsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutNotificationsInputSchema) ]).optional(),
});

export const PostUpdateOneWithoutNotificationsNestedInputSchema: z.ZodType<Prisma.PostUpdateOneWithoutNotificationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PostCreateWithoutNotificationsInputSchema), z.lazy(() => PostUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PostCreateOrConnectWithoutNotificationsInputSchema).optional(),
  upsert: z.lazy(() => PostUpsertWithoutNotificationsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => PostWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => PostWhereInputSchema) ]).optional(),
  connect: z.lazy(() => PostWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PostUpdateToOneWithWhereWithoutNotificationsInputSchema), z.lazy(() => PostUpdateWithoutNotificationsInputSchema), z.lazy(() => PostUncheckedUpdateWithoutNotificationsInputSchema) ]).optional(),
});

export const PersonSettingsCreateNestedOneWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsCreateNestedOneWithoutNotificationMethodsInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonSettingsCreateWithoutNotificationMethodsInputSchema), z.lazy(() => PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonSettingsCreateOrConnectWithoutNotificationMethodsInputSchema).optional(),
  connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
});

export const NotificationSettingCreateNestedManyWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingCreateNestedManyWithoutNotificationMethodInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema).array(), z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationSettingWhereUniqueInputSchema), z.lazy(() => NotificationSettingWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema).array(), z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationSettingWhereUniqueInputSchema), z.lazy(() => NotificationSettingWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumNotificationMethodTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumNotificationMethodTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => NotificationMethodTypeSchema).optional(),
});

export const NullableEnumWebhookFormatFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumWebhookFormatFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => WebhookFormatSchema).optional().nullable(),
});

export const PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInputSchema: z.ZodType<Prisma.PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PersonSettingsCreateWithoutNotificationMethodsInputSchema), z.lazy(() => PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PersonSettingsCreateOrConnectWithoutNotificationMethodsInputSchema).optional(),
  upsert: z.lazy(() => PersonSettingsUpsertWithoutNotificationMethodsInputSchema).optional(),
  connect: z.lazy(() => PersonSettingsWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PersonSettingsUpdateToOneWithWhereWithoutNotificationMethodsInputSchema), z.lazy(() => PersonSettingsUpdateWithoutNotificationMethodsInputSchema), z.lazy(() => PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema) ]).optional(),
});

export const NotificationSettingUpdateManyWithoutNotificationMethodNestedInputSchema: z.ZodType<Prisma.NotificationSettingUpdateManyWithoutNotificationMethodNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema).array(), z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationSettingWhereUniqueInputSchema), z.lazy(() => NotificationSettingWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationSettingWhereUniqueInputSchema), z.lazy(() => NotificationSettingWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationSettingWhereUniqueInputSchema), z.lazy(() => NotificationSettingWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationSettingWhereUniqueInputSchema), z.lazy(() => NotificationSettingWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationSettingScalarWhereInputSchema), z.lazy(() => NotificationSettingScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema).array(), z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationSettingWhereUniqueInputSchema), z.lazy(() => NotificationSettingWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationSettingWhereUniqueInputSchema), z.lazy(() => NotificationSettingWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationSettingWhereUniqueInputSchema), z.lazy(() => NotificationSettingWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationSettingWhereUniqueInputSchema), z.lazy(() => NotificationSettingWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationSettingScalarWhereInputSchema), z.lazy(() => NotificationSettingScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationMethodCreateNestedOneWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodCreateNestedOneWithoutNotificationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema), z.lazy(() => NotificationMethodUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => NotificationMethodCreateOrConnectWithoutNotificationsInputSchema).optional(),
  connect: z.lazy(() => NotificationMethodWhereUniqueInputSchema).optional(),
});

export const NotificationMethodUpdateOneRequiredWithoutNotificationsNestedInputSchema: z.ZodType<Prisma.NotificationMethodUpdateOneRequiredWithoutNotificationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema), z.lazy(() => NotificationMethodUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => NotificationMethodCreateOrConnectWithoutNotificationsInputSchema).optional(),
  upsert: z.lazy(() => NotificationMethodUpsertWithoutNotificationsInputSchema).optional(),
  connect: z.lazy(() => NotificationMethodWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => NotificationMethodUpdateToOneWithWhereWithoutNotificationsInputSchema), z.lazy(() => NotificationMethodUpdateWithoutNotificationsInputSchema), z.lazy(() => NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema) ]).optional(),
});

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const NestedEnumRoleFilterSchema: z.ZodType<Prisma.NestedEnumRoleFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleFilterSchema) ]).optional(),
});

export const NestedEnumStatusFilterSchema: z.ZodType<Prisma.NestedEnumStatusFilter> = z.strictObject({
  equals: z.lazy(() => StatusSchema).optional(),
  in: z.lazy(() => StatusSchema).array().optional(),
  notIn: z.lazy(() => StatusSchema).array().optional(),
  not: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NestedEnumStatusFilterSchema) ]).optional(),
});

export const NestedEnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumRoleWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
});

export const NestedEnumStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => StatusSchema).optional(),
  in: z.lazy(() => StatusSchema).array().optional(),
  notIn: z.lazy(() => StatusSchema).array().optional(),
  not: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NestedEnumStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumStatusFilterSchema).optional(),
});

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumNotificationTypeFilterSchema: z.ZodType<Prisma.NestedEnumNotificationTypeFilter> = z.strictObject({
  equals: z.lazy(() => NotificationTypeSchema).optional(),
  in: z.lazy(() => NotificationTypeSchema).array().optional(),
  notIn: z.lazy(() => NotificationTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => NestedEnumNotificationTypeFilterSchema) ]).optional(),
});

export const NestedEnumStatusNullableFilterSchema: z.ZodType<Prisma.NestedEnumStatusNullableFilter> = z.strictObject({
  equals: z.lazy(() => StatusSchema).optional().nullable(),
  in: z.lazy(() => StatusSchema).array().optional().nullable(),
  notIn: z.lazy(() => StatusSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NestedEnumStatusNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumNotificationTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumNotificationTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => NotificationTypeSchema).optional(),
  in: z.lazy(() => NotificationTypeSchema).array().optional(),
  notIn: z.lazy(() => NotificationTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => NestedEnumNotificationTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumNotificationTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumNotificationTypeFilterSchema).optional(),
});

export const NestedEnumStatusNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumStatusNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => StatusSchema).optional().nullable(),
  in: z.lazy(() => StatusSchema).array().optional().nullable(),
  notIn: z.lazy(() => StatusSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NestedEnumStatusNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumStatusNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumStatusNullableFilterSchema).optional(),
});

export const NestedEnumNotificationMethodTypeFilterSchema: z.ZodType<Prisma.NestedEnumNotificationMethodTypeFilter> = z.strictObject({
  equals: z.lazy(() => NotificationMethodTypeSchema).optional(),
  in: z.lazy(() => NotificationMethodTypeSchema).array().optional(),
  notIn: z.lazy(() => NotificationMethodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => NestedEnumNotificationMethodTypeFilterSchema) ]).optional(),
});

export const NestedEnumWebhookFormatNullableFilterSchema: z.ZodType<Prisma.NestedEnumWebhookFormatNullableFilter> = z.strictObject({
  equals: z.lazy(() => WebhookFormatSchema).optional().nullable(),
  in: z.lazy(() => WebhookFormatSchema).array().optional().nullable(),
  notIn: z.lazy(() => WebhookFormatSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NestedEnumWebhookFormatNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumNotificationMethodTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumNotificationMethodTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => NotificationMethodTypeSchema).optional(),
  in: z.lazy(() => NotificationMethodTypeSchema).array().optional(),
  notIn: z.lazy(() => NotificationMethodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => NestedEnumNotificationMethodTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumNotificationMethodTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumNotificationMethodTypeFilterSchema).optional(),
});

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const NestedEnumWebhookFormatNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumWebhookFormatNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => WebhookFormatSchema).optional().nullable(),
  in: z.lazy(() => WebhookFormatSchema).array().optional().nullable(),
  notIn: z.lazy(() => WebhookFormatSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NestedEnumWebhookFormatNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumWebhookFormatNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumWebhookFormatNullableFilterSchema).optional(),
});

export const SessionCreateWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateWithoutUserInput> = z.strictObject({
  id: z.string().optional(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const SessionUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.string().optional(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const SessionCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema) ]),
});

export const SessionCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.SessionCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => SessionCreateManyUserInputSchema), z.lazy(() => SessionCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const AccountCreateWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateWithoutUserInput> = z.strictObject({
  id: z.string().optional(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AccountUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.string().optional(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AccountCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema) ]),
});

export const AccountCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.AccountCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => AccountCreateManyUserInputSchema), z.lazy(() => AccountCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PersonCreateWithoutUserInputSchema: z.ZodType<Prisma.PersonCreateWithoutUserInput> = z.strictObject({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutUserInput> = z.strictObject({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => PersonWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PersonCreateWithoutUserInputSchema), z.lazy(() => PersonUncheckedCreateWithoutUserInputSchema) ]),
});

export const SessionUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SessionUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SessionUpdateWithoutUserInputSchema), z.lazy(() => SessionUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema) ]),
});

export const SessionUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SessionUpdateWithoutUserInputSchema), z.lazy(() => SessionUncheckedUpdateWithoutUserInputSchema) ]),
});

export const SessionUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SessionUpdateManyMutationInputSchema), z.lazy(() => SessionUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const SessionScalarWhereInputSchema: z.ZodType<Prisma.SessionScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  token: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
});

export const AccountUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.AccountUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => AccountUpdateWithoutUserInputSchema), z.lazy(() => AccountUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema) ]),
});

export const AccountUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AccountUpdateWithoutUserInputSchema), z.lazy(() => AccountUncheckedUpdateWithoutUserInputSchema) ]),
});

export const AccountUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountScalarWhereInputSchema),
  data: z.union([ z.lazy(() => AccountUpdateManyMutationInputSchema), z.lazy(() => AccountUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const AccountScalarWhereInputSchema: z.ZodType<Prisma.AccountScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accountId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const PersonUpsertWithoutUserInputSchema: z.ZodType<Prisma.PersonUpsertWithoutUserInput> = z.strictObject({
  update: z.union([ z.lazy(() => PersonUpdateWithoutUserInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => PersonCreateWithoutUserInputSchema), z.lazy(() => PersonUncheckedCreateWithoutUserInputSchema) ]),
  where: z.lazy(() => PersonWhereInputSchema).optional(),
});

export const PersonUpdateToOneWithWhereWithoutUserInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => PersonWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PersonUpdateWithoutUserInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutUserInputSchema) ]),
});

export const PersonUpdateWithoutUserInputSchema: z.ZodType<Prisma.PersonUpdateWithoutUserInput> = z.strictObject({
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const PersonUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutUserInput> = z.strictObject({
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const UserCreateWithoutPersonInputSchema: z.ZodType<Prisma.UserCreateWithoutPersonInput> = z.strictObject({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string().optional().nullable(),
  displayUsername: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutPersonInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutPersonInput> = z.strictObject({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string().optional().nullable(),
  displayUsername: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutPersonInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutPersonInputSchema), z.lazy(() => UserUncheckedCreateWithoutPersonInputSchema) ]),
});

export const MembershipCreateWithoutPersonInputSchema: z.ZodType<Prisma.MembershipCreateWithoutPersonInput> = z.strictObject({
  id: z.string().optional(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutMembershipsInputSchema),
  availabilities: z.lazy(() => AvailabilityCreateNestedManyWithoutMembershipInputSchema).optional(),
  invites: z.lazy(() => InviteCreateNestedManyWithoutCreatedByInputSchema).optional(),
});

export const MembershipUncheckedCreateWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateWithoutPersonInput> = z.strictObject({
  id: z.string().optional(),
  eventId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema).optional(),
  invites: z.lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema).optional(),
});

export const MembershipCreateOrConnectWithoutPersonInputSchema: z.ZodType<Prisma.MembershipCreateOrConnectWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => MembershipWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => MembershipCreateWithoutPersonInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema) ]),
});

export const MembershipCreateManyPersonInputEnvelopeSchema: z.ZodType<Prisma.MembershipCreateManyPersonInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => MembershipCreateManyPersonInputSchema), z.lazy(() => MembershipCreateManyPersonInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PostCreateWithoutAuthorInputSchema: z.ZodType<Prisma.PostCreateWithoutAuthorInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  title: z.string(),
  content: z.string(),
  event: z.lazy(() => EventCreateNestedOneWithoutPostsInputSchema),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutPostInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPostInputSchema).optional(),
});

export const PostUncheckedCreateWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutAuthorInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  eventId: z.string(),
  title: z.string(),
  content: z.string(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
});

export const PostCreateOrConnectWithoutAuthorInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PostCreateWithoutAuthorInputSchema), z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema) ]),
});

export const PostCreateManyAuthorInputEnvelopeSchema: z.ZodType<Prisma.PostCreateManyAuthorInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => PostCreateManyAuthorInputSchema), z.lazy(() => PostCreateManyAuthorInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const ReplyCreateWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyCreateWithoutAuthorInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  text: z.string(),
  post: z.lazy(() => PostCreateNestedOneWithoutRepliesInputSchema),
});

export const ReplyUncheckedCreateWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUncheckedCreateWithoutAuthorInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  postId: z.string(),
  text: z.string(),
});

export const ReplyCreateOrConnectWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyCreateOrConnectWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => ReplyWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReplyCreateWithoutAuthorInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema) ]),
});

export const ReplyCreateManyAuthorInputEnvelopeSchema: z.ZodType<Prisma.ReplyCreateManyAuthorInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ReplyCreateManyAuthorInputSchema), z.lazy(() => ReplyCreateManyAuthorInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const NotificationCreateWithoutPersonInputSchema: z.ZodType<Prisma.NotificationCreateWithoutPersonInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => NotificationTypeSchema),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
  author: z.lazy(() => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema).optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema).optional(),
  post: z.lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema).optional(),
});

export const NotificationUncheckedCreateWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateWithoutPersonInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  authorId: z.string().optional().nullable(),
  type: z.lazy(() => NotificationTypeSchema),
  eventId: z.string().optional().nullable(),
  postId: z.string().optional().nullable(),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
});

export const NotificationCreateOrConnectWithoutPersonInputSchema: z.ZodType<Prisma.NotificationCreateOrConnectWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => NotificationCreateWithoutPersonInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema) ]),
});

export const NotificationCreateManyPersonInputEnvelopeSchema: z.ZodType<Prisma.NotificationCreateManyPersonInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => NotificationCreateManyPersonInputSchema), z.lazy(() => NotificationCreateManyPersonInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const NotificationCreateWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationCreateWithoutAuthorInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => NotificationTypeSchema),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
  person: z.lazy(() => PersonCreateNestedOneWithoutNotificationsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema).optional(),
  post: z.lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema).optional(),
});

export const NotificationUncheckedCreateWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateWithoutAuthorInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
  type: z.lazy(() => NotificationTypeSchema),
  eventId: z.string().optional().nullable(),
  postId: z.string().optional().nullable(),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
});

export const NotificationCreateOrConnectWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationCreateOrConnectWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => NotificationCreateWithoutAuthorInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema) ]),
});

export const NotificationCreateManyAuthorInputEnvelopeSchema: z.ZodType<Prisma.NotificationCreateManyAuthorInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => NotificationCreateManyAuthorInputSchema), z.lazy(() => NotificationCreateManyAuthorInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PersonSettingsCreateWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsCreateWithoutPersonInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  notificationMethods: z.lazy(() => NotificationMethodCreateNestedManyWithoutSettingsInputSchema).optional(),
});

export const PersonSettingsUncheckedCreateWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedCreateWithoutPersonInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  notificationMethods: z.lazy(() => NotificationMethodUncheckedCreateNestedManyWithoutSettingsInputSchema).optional(),
});

export const PersonSettingsCreateOrConnectWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsCreateOrConnectWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => PersonSettingsWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema), z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema) ]),
});

export const UserUpsertWithoutPersonInputSchema: z.ZodType<Prisma.UserUpsertWithoutPersonInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutPersonInputSchema), z.lazy(() => UserUncheckedUpdateWithoutPersonInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutPersonInputSchema), z.lazy(() => UserUncheckedCreateWithoutPersonInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutPersonInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutPersonInputSchema), z.lazy(() => UserUncheckedUpdateWithoutPersonInputSchema) ]),
});

export const UserUpdateWithoutPersonInputSchema: z.ZodType<Prisma.UserUpdateWithoutPersonInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageKey: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  displayUsername: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pronouns: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bio: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutPersonInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutPersonInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageKey: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  displayUsername: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pronouns: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bio: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const MembershipUpsertWithWhereUniqueWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUpsertWithWhereUniqueWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => MembershipWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => MembershipUpdateWithoutPersonInputSchema), z.lazy(() => MembershipUncheckedUpdateWithoutPersonInputSchema) ]),
  create: z.union([ z.lazy(() => MembershipCreateWithoutPersonInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutPersonInputSchema) ]),
});

export const MembershipUpdateWithWhereUniqueWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUpdateWithWhereUniqueWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => MembershipWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => MembershipUpdateWithoutPersonInputSchema), z.lazy(() => MembershipUncheckedUpdateWithoutPersonInputSchema) ]),
});

export const MembershipUpdateManyWithWhereWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUpdateManyWithWhereWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => MembershipScalarWhereInputSchema),
  data: z.union([ z.lazy(() => MembershipUpdateManyMutationInputSchema), z.lazy(() => MembershipUncheckedUpdateManyWithoutPersonInputSchema) ]),
});

export const MembershipScalarWhereInputSchema: z.ZodType<Prisma.MembershipScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => MembershipScalarWhereInputSchema), z.lazy(() => MembershipScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => MembershipScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MembershipScalarWhereInputSchema), z.lazy(() => MembershipScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  personId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => EnumStatusFilterSchema), z.lazy(() => StatusSchema) ]).optional(),
});

export const PostUpsertWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpsertWithWhereUniqueWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PostUpdateWithoutAuthorInputSchema), z.lazy(() => PostUncheckedUpdateWithoutAuthorInputSchema) ]),
  create: z.union([ z.lazy(() => PostCreateWithoutAuthorInputSchema), z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema) ]),
});

export const PostUpdateWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpdateWithWhereUniqueWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PostUpdateWithoutAuthorInputSchema), z.lazy(() => PostUncheckedUpdateWithoutAuthorInputSchema) ]),
});

export const PostUpdateManyWithWhereWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpdateManyWithWhereWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => PostScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PostUpdateManyMutationInputSchema), z.lazy(() => PostUncheckedUpdateManyWithoutAuthorInputSchema) ]),
});

export const PostScalarWhereInputSchema: z.ZodType<Prisma.PostScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PostScalarWhereInputSchema), z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostScalarWhereInputSchema), z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  editedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  authorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
});

export const ReplyUpsertWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUpsertWithWhereUniqueWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => ReplyWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ReplyUpdateWithoutAuthorInputSchema), z.lazy(() => ReplyUncheckedUpdateWithoutAuthorInputSchema) ]),
  create: z.union([ z.lazy(() => ReplyCreateWithoutAuthorInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutAuthorInputSchema) ]),
});

export const ReplyUpdateWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUpdateWithWhereUniqueWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => ReplyWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ReplyUpdateWithoutAuthorInputSchema), z.lazy(() => ReplyUncheckedUpdateWithoutAuthorInputSchema) ]),
});

export const ReplyUpdateManyWithWhereWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUpdateManyWithWhereWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => ReplyScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ReplyUpdateManyMutationInputSchema), z.lazy(() => ReplyUncheckedUpdateManyWithoutAuthorInputSchema) ]),
});

export const ReplyScalarWhereInputSchema: z.ZodType<Prisma.ReplyScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReplyScalarWhereInputSchema), z.lazy(() => ReplyScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReplyScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReplyScalarWhereInputSchema), z.lazy(() => ReplyScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  authorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  postId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  text: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
});

export const NotificationUpsertWithWhereUniqueWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUpsertWithWhereUniqueWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => NotificationUpdateWithoutPersonInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutPersonInputSchema) ]),
  create: z.union([ z.lazy(() => NotificationCreateWithoutPersonInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPersonInputSchema) ]),
});

export const NotificationUpdateWithWhereUniqueWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUpdateWithWhereUniqueWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateWithoutPersonInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutPersonInputSchema) ]),
});

export const NotificationUpdateManyWithWhereWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithWhereWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => NotificationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateManyMutationInputSchema), z.lazy(() => NotificationUncheckedUpdateManyWithoutPersonInputSchema) ]),
});

export const NotificationScalarWhereInputSchema: z.ZodType<Prisma.NotificationScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  personId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  authorId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  type: z.union([ z.lazy(() => EnumNotificationTypeFilterSchema), z.lazy(() => NotificationTypeSchema) ]).optional(),
  eventId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  postId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  read: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  datetime: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => EnumStatusNullableFilterSchema), z.lazy(() => StatusSchema) ]).optional().nullable(),
});

export const NotificationUpsertWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUpsertWithWhereUniqueWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => NotificationUpdateWithoutAuthorInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutAuthorInputSchema) ]),
  create: z.union([ z.lazy(() => NotificationCreateWithoutAuthorInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutAuthorInputSchema) ]),
});

export const NotificationUpdateWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUpdateWithWhereUniqueWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateWithoutAuthorInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutAuthorInputSchema) ]),
});

export const NotificationUpdateManyWithWhereWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithWhereWithoutAuthorInput> = z.strictObject({
  where: z.lazy(() => NotificationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateManyMutationInputSchema), z.lazy(() => NotificationUncheckedUpdateManyWithoutAuthorInputSchema) ]),
});

export const PersonSettingsUpsertWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUpsertWithoutPersonInput> = z.strictObject({
  update: z.union([ z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema), z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema) ]),
  create: z.union([ z.lazy(() => PersonSettingsCreateWithoutPersonInputSchema), z.lazy(() => PersonSettingsUncheckedCreateWithoutPersonInputSchema) ]),
  where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
});

export const PersonSettingsUpdateToOneWithWhereWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUpdateToOneWithWhereWithoutPersonInput> = z.strictObject({
  where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PersonSettingsUpdateWithoutPersonInputSchema), z.lazy(() => PersonSettingsUncheckedUpdateWithoutPersonInputSchema) ]),
});

export const PersonSettingsUpdateWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUpdateWithoutPersonInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  notificationMethods: z.lazy(() => NotificationMethodUpdateManyWithoutSettingsNestedInputSchema).optional(),
});

export const PersonSettingsUncheckedUpdateWithoutPersonInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedUpdateWithoutPersonInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  notificationMethods: z.lazy(() => NotificationMethodUncheckedUpdateManyWithoutSettingsNestedInputSchema).optional(),
});

export const UserCreateWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateWithoutSessionsInput> = z.strictObject({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string().optional().nullable(),
  displayUsername: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  person: z.lazy(() => PersonCreateNestedOneWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSessionsInput> = z.strictObject({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string().optional().nullable(),
  displayUsername: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  person: z.lazy(() => PersonUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSessionsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]),
});

export const UserUpsertWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpsertWithoutSessionsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSessionsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema) ]),
});

export const UserUpdateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpdateWithoutSessionsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageKey: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  displayUsername: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pronouns: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bio: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  person: z.lazy(() => PersonUpdateOneWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSessionsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageKey: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  displayUsername: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pronouns: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bio: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  person: z.lazy(() => PersonUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
});

export const UserCreateWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateWithoutAccountsInput> = z.strictObject({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string().optional().nullable(),
  displayUsername: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  person: z.lazy(() => PersonCreateNestedOneWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutAccountsInput> = z.strictObject({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string().optional().nullable(),
  displayUsername: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  person: z.lazy(() => PersonUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutAccountsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]),
});

export const UserUpsertWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpsertWithoutAccountsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutAccountsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema) ]),
});

export const UserUpdateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpdateWithoutAccountsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageKey: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  displayUsername: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pronouns: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bio: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  person: z.lazy(() => PersonUpdateOneWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutAccountsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageKey: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  displayUsername: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  pronouns: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bio: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  person: z.lazy(() => PersonUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
});

export const PersonCreateWithoutSettingsInputSchema: z.ZodType<Prisma.PersonCreateWithoutSettingsInput> = z.strictObject({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPersonInputSchema),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema).optional(),
});

export const PersonUncheckedCreateWithoutSettingsInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutSettingsInput> = z.strictObject({
  id: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
});

export const PersonCreateOrConnectWithoutSettingsInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutSettingsInput> = z.strictObject({
  where: z.lazy(() => PersonWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PersonCreateWithoutSettingsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutSettingsInputSchema) ]),
});

export const NotificationMethodCreateWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodCreateWithoutSettingsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => NotificationMethodTypeSchema),
  enabled: z.boolean().optional(),
  name: z.string().optional().nullable(),
  value: z.string(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.string().optional().nullable(),
  webhookFormat: z.lazy(() => WebhookFormatSchema).optional().nullable(),
  notifications: z.lazy(() => NotificationSettingCreateNestedManyWithoutNotificationMethodInputSchema).optional(),
});

export const NotificationMethodUncheckedCreateWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedCreateWithoutSettingsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => NotificationMethodTypeSchema),
  enabled: z.boolean().optional(),
  name: z.string().optional().nullable(),
  value: z.string(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.string().optional().nullable(),
  webhookFormat: z.lazy(() => WebhookFormatSchema).optional().nullable(),
  notifications: z.lazy(() => NotificationSettingUncheckedCreateNestedManyWithoutNotificationMethodInputSchema).optional(),
});

export const NotificationMethodCreateOrConnectWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodCreateOrConnectWithoutSettingsInput> = z.strictObject({
  where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema) ]),
});

export const NotificationMethodCreateManySettingsInputEnvelopeSchema: z.ZodType<Prisma.NotificationMethodCreateManySettingsInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => NotificationMethodCreateManySettingsInputSchema), z.lazy(() => NotificationMethodCreateManySettingsInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PersonUpsertWithoutSettingsInputSchema: z.ZodType<Prisma.PersonUpsertWithoutSettingsInput> = z.strictObject({
  update: z.union([ z.lazy(() => PersonUpdateWithoutSettingsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutSettingsInputSchema) ]),
  create: z.union([ z.lazy(() => PersonCreateWithoutSettingsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutSettingsInputSchema) ]),
  where: z.lazy(() => PersonWhereInputSchema).optional(),
});

export const PersonUpdateToOneWithWhereWithoutSettingsInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutSettingsInput> = z.strictObject({
  where: z.lazy(() => PersonWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PersonUpdateWithoutSettingsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutSettingsInputSchema) ]),
});

export const PersonUpdateWithoutSettingsInputSchema: z.ZodType<Prisma.PersonUpdateWithoutSettingsInput> = z.strictObject({
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutPersonNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema).optional(),
});

export const PersonUncheckedUpdateWithoutSettingsInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutSettingsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
});

export const NotificationMethodUpsertWithWhereUniqueWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUpsertWithWhereUniqueWithoutSettingsInput> = z.strictObject({
  where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => NotificationMethodUpdateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUncheckedUpdateWithoutSettingsInputSchema) ]),
  create: z.union([ z.lazy(() => NotificationMethodCreateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUncheckedCreateWithoutSettingsInputSchema) ]),
});

export const NotificationMethodUpdateWithWhereUniqueWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUpdateWithWhereUniqueWithoutSettingsInput> = z.strictObject({
  where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => NotificationMethodUpdateWithoutSettingsInputSchema), z.lazy(() => NotificationMethodUncheckedUpdateWithoutSettingsInputSchema) ]),
});

export const NotificationMethodUpdateManyWithWhereWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUpdateManyWithWhereWithoutSettingsInput> = z.strictObject({
  where: z.lazy(() => NotificationMethodScalarWhereInputSchema),
  data: z.union([ z.lazy(() => NotificationMethodUpdateManyMutationInputSchema), z.lazy(() => NotificationMethodUncheckedUpdateManyWithoutSettingsInputSchema) ]),
});

export const NotificationMethodScalarWhereInputSchema: z.ZodType<Prisma.NotificationMethodScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationMethodScalarWhereInputSchema), z.lazy(() => NotificationMethodScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationMethodScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationMethodScalarWhereInputSchema), z.lazy(() => NotificationMethodScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  settingsId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumNotificationMethodTypeFilterSchema), z.lazy(() => NotificationMethodTypeSchema) ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  webhookHeaders: z.lazy(() => JsonNullableFilterSchema).optional(),
  customTemplate: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => EnumWebhookFormatNullableFilterSchema), z.lazy(() => WebhookFormatSchema) ]).optional().nullable(),
});

export const InviteCreateWithoutEventInputSchema: z.ZodType<Prisma.InviteCreateWithoutEventInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usesRemaining: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  name: z.string().optional().nullable(),
  createdBy: z.lazy(() => MembershipCreateNestedOneWithoutInvitesInputSchema),
});

export const InviteUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.InviteUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.string().optional(),
  createdById: z.string(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usesRemaining: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  name: z.string().optional().nullable(),
});

export const InviteCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.InviteCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => InviteWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => InviteCreateWithoutEventInputSchema), z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema) ]),
});

export const InviteCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.InviteCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => InviteCreateManyEventInputSchema), z.lazy(() => InviteCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PotentialDateTimeCreateWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateWithoutEventInput> = z.strictObject({
  id: z.string().optional(),
  dateTime: z.coerce.date().optional(),
  availabilities: z.lazy(() => AvailabilityCreateNestedManyWithoutPotentialDateTimeInputSchema).optional(),
});

export const PotentialDateTimeUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.string().optional(),
  dateTime: z.coerce.date().optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedCreateNestedManyWithoutPotentialDateTimeInputSchema).optional(),
});

export const PotentialDateTimeCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema) ]),
});

export const PotentialDateTimeCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.PotentialDateTimeCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => PotentialDateTimeCreateManyEventInputSchema), z.lazy(() => PotentialDateTimeCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PostCreateWithoutEventInputSchema: z.ZodType<Prisma.PostCreateWithoutEventInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  title: z.string(),
  content: z.string(),
  author: z.lazy(() => PersonCreateNestedOneWithoutPostsInputSchema),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutPostInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPostInputSchema).optional(),
});

export const PostUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  authorId: z.string(),
  title: z.string(),
  content: z.string(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
});

export const PostCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PostCreateWithoutEventInputSchema), z.lazy(() => PostUncheckedCreateWithoutEventInputSchema) ]),
});

export const PostCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.PostCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => PostCreateManyEventInputSchema), z.lazy(() => PostCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const MembershipCreateWithoutEventInputSchema: z.ZodType<Prisma.MembershipCreateWithoutEventInput> = z.strictObject({
  id: z.string().optional(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
  person: z.lazy(() => PersonCreateNestedOneWithoutMembershipsInputSchema),
  availabilities: z.lazy(() => AvailabilityCreateNestedManyWithoutMembershipInputSchema).optional(),
  invites: z.lazy(() => InviteCreateNestedManyWithoutCreatedByInputSchema).optional(),
});

export const MembershipUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.string().optional(),
  personId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema).optional(),
  invites: z.lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema).optional(),
});

export const MembershipCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.MembershipCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => MembershipWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => MembershipCreateWithoutEventInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema) ]),
});

export const MembershipCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.MembershipCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => MembershipCreateManyEventInputSchema), z.lazy(() => MembershipCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const NotificationCreateWithoutEventInputSchema: z.ZodType<Prisma.NotificationCreateWithoutEventInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => NotificationTypeSchema),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
  person: z.lazy(() => PersonCreateNestedOneWithoutNotificationsInputSchema),
  author: z.lazy(() => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema).optional(),
  post: z.lazy(() => PostCreateNestedOneWithoutNotificationsInputSchema).optional(),
});

export const NotificationUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
  authorId: z.string().optional().nullable(),
  type: z.lazy(() => NotificationTypeSchema),
  postId: z.string().optional().nullable(),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
});

export const NotificationCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.NotificationCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => NotificationCreateWithoutEventInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema) ]),
});

export const NotificationCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.NotificationCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => NotificationCreateManyEventInputSchema), z.lazy(() => NotificationCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const InviteUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.InviteUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => InviteWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => InviteUpdateWithoutEventInputSchema), z.lazy(() => InviteUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => InviteCreateWithoutEventInputSchema), z.lazy(() => InviteUncheckedCreateWithoutEventInputSchema) ]),
});

export const InviteUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.InviteUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => InviteWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => InviteUpdateWithoutEventInputSchema), z.lazy(() => InviteUncheckedUpdateWithoutEventInputSchema) ]),
});

export const InviteUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.InviteUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => InviteScalarWhereInputSchema),
  data: z.union([ z.lazy(() => InviteUpdateManyMutationInputSchema), z.lazy(() => InviteUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const InviteScalarWhereInputSchema: z.ZodType<Prisma.InviteScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => InviteScalarWhereInputSchema), z.lazy(() => InviteScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => InviteScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => InviteScalarWhereInputSchema), z.lazy(() => InviteScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdById: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  usesRemaining: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  maxUses: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
});

export const PotentialDateTimeUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PotentialDateTimeUpdateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => PotentialDateTimeCreateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutEventInputSchema) ]),
});

export const PotentialDateTimeUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PotentialDateTimeUpdateWithoutEventInputSchema), z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutEventInputSchema) ]),
});

export const PotentialDateTimeUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => PotentialDateTimeScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PotentialDateTimeUpdateManyMutationInputSchema), z.lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const PotentialDateTimeScalarWhereInputSchema: z.ZodType<Prisma.PotentialDateTimeScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PotentialDateTimeScalarWhereInputSchema), z.lazy(() => PotentialDateTimeScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PotentialDateTimeScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PotentialDateTimeScalarWhereInputSchema), z.lazy(() => PotentialDateTimeScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  dateTime: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const PostUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.PostUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PostUpdateWithoutEventInputSchema), z.lazy(() => PostUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => PostCreateWithoutEventInputSchema), z.lazy(() => PostUncheckedCreateWithoutEventInputSchema) ]),
});

export const PostUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.PostUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PostUpdateWithoutEventInputSchema), z.lazy(() => PostUncheckedUpdateWithoutEventInputSchema) ]),
});

export const PostUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.PostUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => PostScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PostUpdateManyMutationInputSchema), z.lazy(() => PostUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const MembershipUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.MembershipUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => MembershipWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => MembershipUpdateWithoutEventInputSchema), z.lazy(() => MembershipUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => MembershipCreateWithoutEventInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutEventInputSchema) ]),
});

export const MembershipUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.MembershipUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => MembershipWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => MembershipUpdateWithoutEventInputSchema), z.lazy(() => MembershipUncheckedUpdateWithoutEventInputSchema) ]),
});

export const MembershipUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.MembershipUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => MembershipScalarWhereInputSchema),
  data: z.union([ z.lazy(() => MembershipUpdateManyMutationInputSchema), z.lazy(() => MembershipUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const NotificationUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.NotificationUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => NotificationUpdateWithoutEventInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => NotificationCreateWithoutEventInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutEventInputSchema) ]),
});

export const NotificationUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.NotificationUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateWithoutEventInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutEventInputSchema) ]),
});

export const NotificationUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => NotificationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateManyMutationInputSchema), z.lazy(() => NotificationUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const PersonCreateWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonCreateWithoutMembershipsInput> = z.strictObject({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPersonInputSchema),
  posts: z.lazy(() => PostCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonUncheckedCreateWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutMembershipsInput> = z.strictObject({
  id: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonCreateOrConnectWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutMembershipsInput> = z.strictObject({
  where: z.lazy(() => PersonWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PersonCreateWithoutMembershipsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutMembershipsInputSchema) ]),
});

export const EventCreateWithoutMembershipsInputSchema: z.ZodType<Prisma.EventCreateWithoutMembershipsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  invites: z.lazy(() => InviteCreateNestedManyWithoutEventInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeCreateNestedManyWithoutEventInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutEventInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutMembershipsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutMembershipsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  invites: z.lazy(() => InviteUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutMembershipsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutMembershipsInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutMembershipsInputSchema), z.lazy(() => EventUncheckedCreateWithoutMembershipsInputSchema) ]),
});

export const AvailabilityCreateWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityCreateWithoutMembershipInput> = z.strictObject({
  status: z.lazy(() => StatusSchema),
  potentialDateTime: z.lazy(() => PotentialDateTimeCreateNestedOneWithoutAvailabilitiesInputSchema),
});

export const AvailabilityUncheckedCreateWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUncheckedCreateWithoutMembershipInput> = z.strictObject({
  potentialDateTimeId: z.string(),
  status: z.lazy(() => StatusSchema),
});

export const AvailabilityCreateOrConnectWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityCreateOrConnectWithoutMembershipInput> = z.strictObject({
  where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema) ]),
});

export const AvailabilityCreateManyMembershipInputEnvelopeSchema: z.ZodType<Prisma.AvailabilityCreateManyMembershipInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => AvailabilityCreateManyMembershipInputSchema), z.lazy(() => AvailabilityCreateManyMembershipInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const InviteCreateWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteCreateWithoutCreatedByInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usesRemaining: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  name: z.string().optional().nullable(),
  event: z.lazy(() => EventCreateNestedOneWithoutInvitesInputSchema),
});

export const InviteUncheckedCreateWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUncheckedCreateWithoutCreatedByInput> = z.strictObject({
  id: z.string().optional(),
  eventId: z.string(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usesRemaining: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  name: z.string().optional().nullable(),
});

export const InviteCreateOrConnectWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteCreateOrConnectWithoutCreatedByInput> = z.strictObject({
  where: z.lazy(() => InviteWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => InviteCreateWithoutCreatedByInputSchema), z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema) ]),
});

export const InviteCreateManyCreatedByInputEnvelopeSchema: z.ZodType<Prisma.InviteCreateManyCreatedByInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => InviteCreateManyCreatedByInputSchema), z.lazy(() => InviteCreateManyCreatedByInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PersonUpsertWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonUpsertWithoutMembershipsInput> = z.strictObject({
  update: z.union([ z.lazy(() => PersonUpdateWithoutMembershipsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutMembershipsInputSchema) ]),
  create: z.union([ z.lazy(() => PersonCreateWithoutMembershipsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutMembershipsInputSchema) ]),
  where: z.lazy(() => PersonWhereInputSchema).optional(),
});

export const PersonUpdateToOneWithWhereWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutMembershipsInput> = z.strictObject({
  where: z.lazy(() => PersonWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PersonUpdateWithoutMembershipsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutMembershipsInputSchema) ]),
});

export const PersonUpdateWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonUpdateWithoutMembershipsInput> = z.strictObject({
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const PersonUncheckedUpdateWithoutMembershipsInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutMembershipsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const EventUpsertWithoutMembershipsInputSchema: z.ZodType<Prisma.EventUpsertWithoutMembershipsInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutMembershipsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutMembershipsInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutMembershipsInputSchema), z.lazy(() => EventUncheckedCreateWithoutMembershipsInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutMembershipsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutMembershipsInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutMembershipsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutMembershipsInputSchema) ]),
});

export const EventUpdateWithoutMembershipsInputSchema: z.ZodType<Prisma.EventUpdateWithoutMembershipsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invites: z.lazy(() => InviteUpdateManyWithoutEventNestedInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUpdateManyWithoutEventNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutEventNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutMembershipsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutMembershipsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invites: z.lazy(() => InviteUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const AvailabilityUpsertWithWhereUniqueWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUpsertWithWhereUniqueWithoutMembershipInput> = z.strictObject({
  where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => AvailabilityUpdateWithoutMembershipInputSchema), z.lazy(() => AvailabilityUncheckedUpdateWithoutMembershipInputSchema) ]),
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutMembershipInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutMembershipInputSchema) ]),
});

export const AvailabilityUpdateWithWhereUniqueWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUpdateWithWhereUniqueWithoutMembershipInput> = z.strictObject({
  where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AvailabilityUpdateWithoutMembershipInputSchema), z.lazy(() => AvailabilityUncheckedUpdateWithoutMembershipInputSchema) ]),
});

export const AvailabilityUpdateManyWithWhereWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUpdateManyWithWhereWithoutMembershipInput> = z.strictObject({
  where: z.lazy(() => AvailabilityScalarWhereInputSchema),
  data: z.union([ z.lazy(() => AvailabilityUpdateManyMutationInputSchema), z.lazy(() => AvailabilityUncheckedUpdateManyWithoutMembershipInputSchema) ]),
});

export const AvailabilityScalarWhereInputSchema: z.ZodType<Prisma.AvailabilityScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AvailabilityScalarWhereInputSchema), z.lazy(() => AvailabilityScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AvailabilityScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AvailabilityScalarWhereInputSchema), z.lazy(() => AvailabilityScalarWhereInputSchema).array() ]).optional(),
  membershipId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  potentialDateTimeId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumStatusFilterSchema), z.lazy(() => StatusSchema) ]).optional(),
});

export const InviteUpsertWithWhereUniqueWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUpsertWithWhereUniqueWithoutCreatedByInput> = z.strictObject({
  where: z.lazy(() => InviteWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => InviteUpdateWithoutCreatedByInputSchema), z.lazy(() => InviteUncheckedUpdateWithoutCreatedByInputSchema) ]),
  create: z.union([ z.lazy(() => InviteCreateWithoutCreatedByInputSchema), z.lazy(() => InviteUncheckedCreateWithoutCreatedByInputSchema) ]),
});

export const InviteUpdateWithWhereUniqueWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUpdateWithWhereUniqueWithoutCreatedByInput> = z.strictObject({
  where: z.lazy(() => InviteWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => InviteUpdateWithoutCreatedByInputSchema), z.lazy(() => InviteUncheckedUpdateWithoutCreatedByInputSchema) ]),
});

export const InviteUpdateManyWithWhereWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUpdateManyWithWhereWithoutCreatedByInput> = z.strictObject({
  where: z.lazy(() => InviteScalarWhereInputSchema),
  data: z.union([ z.lazy(() => InviteUpdateManyMutationInputSchema), z.lazy(() => InviteUncheckedUpdateManyWithoutCreatedByInputSchema) ]),
});

export const EventCreateWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventCreateWithoutPotentialDateTimesInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  invites: z.lazy(() => InviteCreateNestedManyWithoutEventInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutEventInputSchema).optional(),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutEventInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutPotentialDateTimesInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  invites: z.lazy(() => InviteUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutPotentialDateTimesInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema), z.lazy(() => EventUncheckedCreateWithoutPotentialDateTimesInputSchema) ]),
});

export const AvailabilityCreateWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityCreateWithoutPotentialDateTimeInput> = z.strictObject({
  status: z.lazy(() => StatusSchema),
  membership: z.lazy(() => MembershipCreateNestedOneWithoutAvailabilitiesInputSchema),
});

export const AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUncheckedCreateWithoutPotentialDateTimeInput> = z.strictObject({
  membershipId: z.string(),
  status: z.lazy(() => StatusSchema),
});

export const AvailabilityCreateOrConnectWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityCreateOrConnectWithoutPotentialDateTimeInput> = z.strictObject({
  where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema) ]),
});

export const AvailabilityCreateManyPotentialDateTimeInputEnvelopeSchema: z.ZodType<Prisma.AvailabilityCreateManyPotentialDateTimeInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => AvailabilityCreateManyPotentialDateTimeInputSchema), z.lazy(() => AvailabilityCreateManyPotentialDateTimeInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const EventUpsertWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventUpsertWithoutPotentialDateTimesInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutPotentialDateTimesInputSchema), z.lazy(() => EventUncheckedUpdateWithoutPotentialDateTimesInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutPotentialDateTimesInputSchema), z.lazy(() => EventUncheckedCreateWithoutPotentialDateTimesInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutPotentialDateTimesInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutPotentialDateTimesInputSchema), z.lazy(() => EventUncheckedUpdateWithoutPotentialDateTimesInputSchema) ]),
});

export const EventUpdateWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventUpdateWithoutPotentialDateTimesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invites: z.lazy(() => InviteUpdateManyWithoutEventNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutEventNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutEventNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutPotentialDateTimesInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutPotentialDateTimesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invites: z.lazy(() => InviteUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUpsertWithWhereUniqueWithoutPotentialDateTimeInput> = z.strictObject({
  where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => AvailabilityUpdateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUncheckedUpdateWithoutPotentialDateTimeInputSchema) ]),
  create: z.union([ z.lazy(() => AvailabilityCreateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUncheckedCreateWithoutPotentialDateTimeInputSchema) ]),
});

export const AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUpdateWithWhereUniqueWithoutPotentialDateTimeInput> = z.strictObject({
  where: z.lazy(() => AvailabilityWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AvailabilityUpdateWithoutPotentialDateTimeInputSchema), z.lazy(() => AvailabilityUncheckedUpdateWithoutPotentialDateTimeInputSchema) ]),
});

export const AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUpdateManyWithWhereWithoutPotentialDateTimeInput> = z.strictObject({
  where: z.lazy(() => AvailabilityScalarWhereInputSchema),
  data: z.union([ z.lazy(() => AvailabilityUpdateManyMutationInputSchema), z.lazy(() => AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeInputSchema) ]),
});

export const MembershipCreateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipCreateWithoutAvailabilitiesInput> = z.strictObject({
  id: z.string().optional(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
  person: z.lazy(() => PersonCreateNestedOneWithoutMembershipsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutMembershipsInputSchema),
  invites: z.lazy(() => InviteCreateNestedManyWithoutCreatedByInputSchema).optional(),
});

export const MembershipUncheckedCreateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateWithoutAvailabilitiesInput> = z.strictObject({
  id: z.string().optional(),
  personId: z.string(),
  eventId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
  invites: z.lazy(() => InviteUncheckedCreateNestedManyWithoutCreatedByInputSchema).optional(),
});

export const MembershipCreateOrConnectWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipCreateOrConnectWithoutAvailabilitiesInput> = z.strictObject({
  where: z.lazy(() => MembershipWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema) ]),
});

export const PotentialDateTimeCreateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateWithoutAvailabilitiesInput> = z.strictObject({
  id: z.string().optional(),
  dateTime: z.coerce.date().optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutPotentialDateTimesInputSchema),
});

export const PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInput> = z.strictObject({
  id: z.string().optional(),
  eventId: z.string(),
  dateTime: z.coerce.date().optional(),
});

export const PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateOrConnectWithoutAvailabilitiesInput> = z.strictObject({
  where: z.lazy(() => PotentialDateTimeWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema) ]),
});

export const MembershipUpsertWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipUpsertWithoutAvailabilitiesInput> = z.strictObject({
  update: z.union([ z.lazy(() => MembershipUpdateWithoutAvailabilitiesInputSchema), z.lazy(() => MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema) ]),
  create: z.union([ z.lazy(() => MembershipCreateWithoutAvailabilitiesInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutAvailabilitiesInputSchema) ]),
  where: z.lazy(() => MembershipWhereInputSchema).optional(),
});

export const MembershipUpdateToOneWithWhereWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipUpdateToOneWithWhereWithoutAvailabilitiesInput> = z.strictObject({
  where: z.lazy(() => MembershipWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => MembershipUpdateWithoutAvailabilitiesInputSchema), z.lazy(() => MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema) ]),
});

export const MembershipUpdateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipUpdateWithoutAvailabilitiesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  person: z.lazy(() => PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutMembershipsNestedInputSchema).optional(),
  invites: z.lazy(() => InviteUpdateManyWithoutCreatedByNestedInputSchema).optional(),
});

export const MembershipUncheckedUpdateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateWithoutAvailabilitiesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  invites: z.lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema).optional(),
});

export const PotentialDateTimeUpsertWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeUpsertWithoutAvailabilitiesInput> = z.strictObject({
  update: z.union([ z.lazy(() => PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema), z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema) ]),
  create: z.union([ z.lazy(() => PotentialDateTimeCreateWithoutAvailabilitiesInputSchema), z.lazy(() => PotentialDateTimeUncheckedCreateWithoutAvailabilitiesInputSchema) ]),
  where: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
});

export const PotentialDateTimeUpdateToOneWithWhereWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateToOneWithWhereWithoutAvailabilitiesInput> = z.strictObject({
  where: z.lazy(() => PotentialDateTimeWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema), z.lazy(() => PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema) ]),
});

export const PotentialDateTimeUpdateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateWithoutAvailabilitiesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  dateTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutPotentialDateTimesNestedInputSchema).optional(),
});

export const PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateWithoutAvailabilitiesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  dateTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PersonCreateWithoutPostsInputSchema: z.ZodType<Prisma.PersonCreateWithoutPostsInput> = z.strictObject({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPersonInputSchema),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema).optional(),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonUncheckedCreateWithoutPostsInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutPostsInput> = z.strictObject({
  id: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonCreateOrConnectWithoutPostsInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutPostsInput> = z.strictObject({
  where: z.lazy(() => PersonWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PersonCreateWithoutPostsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutPostsInputSchema) ]),
});

export const EventCreateWithoutPostsInputSchema: z.ZodType<Prisma.EventCreateWithoutPostsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  invites: z.lazy(() => InviteCreateNestedManyWithoutEventInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeCreateNestedManyWithoutEventInputSchema).optional(),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutEventInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutPostsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutPostsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  invites: z.lazy(() => InviteUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutPostsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutPostsInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutPostsInputSchema), z.lazy(() => EventUncheckedCreateWithoutPostsInputSchema) ]),
});

export const ReplyCreateWithoutPostInputSchema: z.ZodType<Prisma.ReplyCreateWithoutPostInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  text: z.string(),
  author: z.lazy(() => PersonCreateNestedOneWithoutRepliesInputSchema),
});

export const ReplyUncheckedCreateWithoutPostInputSchema: z.ZodType<Prisma.ReplyUncheckedCreateWithoutPostInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  authorId: z.string(),
  text: z.string(),
});

export const ReplyCreateOrConnectWithoutPostInputSchema: z.ZodType<Prisma.ReplyCreateOrConnectWithoutPostInput> = z.strictObject({
  where: z.lazy(() => ReplyWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReplyCreateWithoutPostInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema) ]),
});

export const ReplyCreateManyPostInputEnvelopeSchema: z.ZodType<Prisma.ReplyCreateManyPostInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ReplyCreateManyPostInputSchema), z.lazy(() => ReplyCreateManyPostInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const NotificationCreateWithoutPostInputSchema: z.ZodType<Prisma.NotificationCreateWithoutPostInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => NotificationTypeSchema),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
  person: z.lazy(() => PersonCreateNestedOneWithoutNotificationsInputSchema),
  author: z.lazy(() => PersonCreateNestedOneWithoutAuthoredNotificationsInputSchema).optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutNotificationsInputSchema).optional(),
});

export const NotificationUncheckedCreateWithoutPostInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateWithoutPostInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
  authorId: z.string().optional().nullable(),
  type: z.lazy(() => NotificationTypeSchema),
  eventId: z.string().optional().nullable(),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
});

export const NotificationCreateOrConnectWithoutPostInputSchema: z.ZodType<Prisma.NotificationCreateOrConnectWithoutPostInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => NotificationCreateWithoutPostInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema) ]),
});

export const NotificationCreateManyPostInputEnvelopeSchema: z.ZodType<Prisma.NotificationCreateManyPostInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => NotificationCreateManyPostInputSchema), z.lazy(() => NotificationCreateManyPostInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PersonUpsertWithoutPostsInputSchema: z.ZodType<Prisma.PersonUpsertWithoutPostsInput> = z.strictObject({
  update: z.union([ z.lazy(() => PersonUpdateWithoutPostsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutPostsInputSchema) ]),
  create: z.union([ z.lazy(() => PersonCreateWithoutPostsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutPostsInputSchema) ]),
  where: z.lazy(() => PersonWhereInputSchema).optional(),
});

export const PersonUpdateToOneWithWhereWithoutPostsInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutPostsInput> = z.strictObject({
  where: z.lazy(() => PersonWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PersonUpdateWithoutPostsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutPostsInputSchema) ]),
});

export const PersonUpdateWithoutPostsInputSchema: z.ZodType<Prisma.PersonUpdateWithoutPostsInput> = z.strictObject({
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutPersonNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const PersonUncheckedUpdateWithoutPostsInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutPostsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const EventUpsertWithoutPostsInputSchema: z.ZodType<Prisma.EventUpsertWithoutPostsInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutPostsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutPostsInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutPostsInputSchema), z.lazy(() => EventUncheckedCreateWithoutPostsInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutPostsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutPostsInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutPostsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutPostsInputSchema) ]),
});

export const EventUpdateWithoutPostsInputSchema: z.ZodType<Prisma.EventUpdateWithoutPostsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invites: z.lazy(() => InviteUpdateManyWithoutEventNestedInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUpdateManyWithoutEventNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutEventNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutPostsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutPostsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invites: z.lazy(() => InviteUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const ReplyUpsertWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.ReplyUpsertWithWhereUniqueWithoutPostInput> = z.strictObject({
  where: z.lazy(() => ReplyWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ReplyUpdateWithoutPostInputSchema), z.lazy(() => ReplyUncheckedUpdateWithoutPostInputSchema) ]),
  create: z.union([ z.lazy(() => ReplyCreateWithoutPostInputSchema), z.lazy(() => ReplyUncheckedCreateWithoutPostInputSchema) ]),
});

export const ReplyUpdateWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.ReplyUpdateWithWhereUniqueWithoutPostInput> = z.strictObject({
  where: z.lazy(() => ReplyWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ReplyUpdateWithoutPostInputSchema), z.lazy(() => ReplyUncheckedUpdateWithoutPostInputSchema) ]),
});

export const ReplyUpdateManyWithWhereWithoutPostInputSchema: z.ZodType<Prisma.ReplyUpdateManyWithWhereWithoutPostInput> = z.strictObject({
  where: z.lazy(() => ReplyScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ReplyUpdateManyMutationInputSchema), z.lazy(() => ReplyUncheckedUpdateManyWithoutPostInputSchema) ]),
});

export const NotificationUpsertWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.NotificationUpsertWithWhereUniqueWithoutPostInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => NotificationUpdateWithoutPostInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutPostInputSchema) ]),
  create: z.union([ z.lazy(() => NotificationCreateWithoutPostInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutPostInputSchema) ]),
});

export const NotificationUpdateWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.NotificationUpdateWithWhereUniqueWithoutPostInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateWithoutPostInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutPostInputSchema) ]),
});

export const NotificationUpdateManyWithWhereWithoutPostInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithWhereWithoutPostInput> = z.strictObject({
  where: z.lazy(() => NotificationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateManyMutationInputSchema), z.lazy(() => NotificationUncheckedUpdateManyWithoutPostInputSchema) ]),
});

export const PersonCreateWithoutRepliesInputSchema: z.ZodType<Prisma.PersonCreateWithoutRepliesInput> = z.strictObject({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPersonInputSchema),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonUncheckedCreateWithoutRepliesInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutRepliesInput> = z.strictObject({
  id: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonCreateOrConnectWithoutRepliesInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutRepliesInput> = z.strictObject({
  where: z.lazy(() => PersonWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PersonCreateWithoutRepliesInputSchema), z.lazy(() => PersonUncheckedCreateWithoutRepliesInputSchema) ]),
});

export const PostCreateWithoutRepliesInputSchema: z.ZodType<Prisma.PostCreateWithoutRepliesInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  title: z.string(),
  content: z.string(),
  author: z.lazy(() => PersonCreateNestedOneWithoutPostsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutPostsInputSchema),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPostInputSchema).optional(),
});

export const PostUncheckedCreateWithoutRepliesInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutRepliesInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  authorId: z.string(),
  eventId: z.string(),
  title: z.string(),
  content: z.string(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
});

export const PostCreateOrConnectWithoutRepliesInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutRepliesInput> = z.strictObject({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PostCreateWithoutRepliesInputSchema), z.lazy(() => PostUncheckedCreateWithoutRepliesInputSchema) ]),
});

export const PersonUpsertWithoutRepliesInputSchema: z.ZodType<Prisma.PersonUpsertWithoutRepliesInput> = z.strictObject({
  update: z.union([ z.lazy(() => PersonUpdateWithoutRepliesInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutRepliesInputSchema) ]),
  create: z.union([ z.lazy(() => PersonCreateWithoutRepliesInputSchema), z.lazy(() => PersonUncheckedCreateWithoutRepliesInputSchema) ]),
  where: z.lazy(() => PersonWhereInputSchema).optional(),
});

export const PersonUpdateToOneWithWhereWithoutRepliesInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutRepliesInput> = z.strictObject({
  where: z.lazy(() => PersonWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PersonUpdateWithoutRepliesInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutRepliesInputSchema) ]),
});

export const PersonUpdateWithoutRepliesInputSchema: z.ZodType<Prisma.PersonUpdateWithoutRepliesInput> = z.strictObject({
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutPersonNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const PersonUncheckedUpdateWithoutRepliesInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutRepliesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const PostUpsertWithoutRepliesInputSchema: z.ZodType<Prisma.PostUpsertWithoutRepliesInput> = z.strictObject({
  update: z.union([ z.lazy(() => PostUpdateWithoutRepliesInputSchema), z.lazy(() => PostUncheckedUpdateWithoutRepliesInputSchema) ]),
  create: z.union([ z.lazy(() => PostCreateWithoutRepliesInputSchema), z.lazy(() => PostUncheckedCreateWithoutRepliesInputSchema) ]),
  where: z.lazy(() => PostWhereInputSchema).optional(),
});

export const PostUpdateToOneWithWhereWithoutRepliesInputSchema: z.ZodType<Prisma.PostUpdateToOneWithWhereWithoutRepliesInput> = z.strictObject({
  where: z.lazy(() => PostWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PostUpdateWithoutRepliesInputSchema), z.lazy(() => PostUncheckedUpdateWithoutRepliesInputSchema) ]),
});

export const PostUpdateWithoutRepliesInputSchema: z.ZodType<Prisma.PostUpdateWithoutRepliesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  author: z.lazy(() => PersonUpdateOneRequiredWithoutPostsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutPostsNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPostNestedInputSchema).optional(),
});

export const PostUncheckedUpdateWithoutRepliesInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutRepliesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
});

export const EventCreateWithoutInvitesInputSchema: z.ZodType<Prisma.EventCreateWithoutInvitesInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeCreateNestedManyWithoutEventInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutEventInputSchema).optional(),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutEventInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutInvitesInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutInvitesInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutInvitesInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutInvitesInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutInvitesInputSchema), z.lazy(() => EventUncheckedCreateWithoutInvitesInputSchema) ]),
});

export const MembershipCreateWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipCreateWithoutInvitesInput> = z.strictObject({
  id: z.string().optional(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
  person: z.lazy(() => PersonCreateNestedOneWithoutMembershipsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutMembershipsInputSchema),
  availabilities: z.lazy(() => AvailabilityCreateNestedManyWithoutMembershipInputSchema).optional(),
});

export const MembershipUncheckedCreateWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipUncheckedCreateWithoutInvitesInput> = z.strictObject({
  id: z.string().optional(),
  personId: z.string(),
  eventId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedCreateNestedManyWithoutMembershipInputSchema).optional(),
});

export const MembershipCreateOrConnectWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipCreateOrConnectWithoutInvitesInput> = z.strictObject({
  where: z.lazy(() => MembershipWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => MembershipCreateWithoutInvitesInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutInvitesInputSchema) ]),
});

export const EventUpsertWithoutInvitesInputSchema: z.ZodType<Prisma.EventUpsertWithoutInvitesInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutInvitesInputSchema), z.lazy(() => EventUncheckedUpdateWithoutInvitesInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutInvitesInputSchema), z.lazy(() => EventUncheckedCreateWithoutInvitesInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutInvitesInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutInvitesInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutInvitesInputSchema), z.lazy(() => EventUncheckedUpdateWithoutInvitesInputSchema) ]),
});

export const EventUpdateWithoutInvitesInputSchema: z.ZodType<Prisma.EventUpdateWithoutInvitesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUpdateManyWithoutEventNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutEventNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutEventNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutInvitesInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutInvitesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const MembershipUpsertWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipUpsertWithoutInvitesInput> = z.strictObject({
  update: z.union([ z.lazy(() => MembershipUpdateWithoutInvitesInputSchema), z.lazy(() => MembershipUncheckedUpdateWithoutInvitesInputSchema) ]),
  create: z.union([ z.lazy(() => MembershipCreateWithoutInvitesInputSchema), z.lazy(() => MembershipUncheckedCreateWithoutInvitesInputSchema) ]),
  where: z.lazy(() => MembershipWhereInputSchema).optional(),
});

export const MembershipUpdateToOneWithWhereWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipUpdateToOneWithWhereWithoutInvitesInput> = z.strictObject({
  where: z.lazy(() => MembershipWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => MembershipUpdateWithoutInvitesInputSchema), z.lazy(() => MembershipUncheckedUpdateWithoutInvitesInputSchema) ]),
});

export const MembershipUpdateWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipUpdateWithoutInvitesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  person: z.lazy(() => PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutMembershipsNestedInputSchema).optional(),
  availabilities: z.lazy(() => AvailabilityUpdateManyWithoutMembershipNestedInputSchema).optional(),
});

export const MembershipUncheckedUpdateWithoutInvitesInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateWithoutInvitesInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema).optional(),
});

export const PersonCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonCreateWithoutNotificationsInput> = z.strictObject({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPersonInputSchema),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonUncheckedCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutNotificationsInput> = z.strictObject({
  id: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonCreateOrConnectWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => PersonWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PersonCreateWithoutNotificationsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutNotificationsInputSchema) ]),
});

export const PersonCreateWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonCreateWithoutAuthoredNotificationsInput> = z.strictObject({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPersonInputSchema),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutPersonInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonUncheckedCreateWithoutAuthoredNotificationsInput> = z.strictObject({
  id: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutAuthorInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutPersonInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedCreateNestedOneWithoutPersonInputSchema).optional(),
});

export const PersonCreateOrConnectWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonCreateOrConnectWithoutAuthoredNotificationsInput> = z.strictObject({
  where: z.lazy(() => PersonWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema) ]),
});

export const EventCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.EventCreateWithoutNotificationsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  invites: z.lazy(() => InviteCreateNestedManyWithoutEventInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeCreateNestedManyWithoutEventInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutEventInputSchema).optional(),
  memberships: z.lazy(() => MembershipCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutNotificationsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  chosenDateTime: z.coerce.date().optional().nullable(),
  invites: z.lazy(() => InviteUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  memberships: z.lazy(() => MembershipUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutNotificationsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutNotificationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutNotificationsInputSchema) ]),
});

export const PostCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.PostCreateWithoutNotificationsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  title: z.string(),
  content: z.string(),
  author: z.lazy(() => PersonCreateNestedOneWithoutPostsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutPostsInputSchema),
  replies: z.lazy(() => ReplyCreateNestedManyWithoutPostInputSchema).optional(),
});

export const PostUncheckedCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutNotificationsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  authorId: z.string(),
  eventId: z.string(),
  title: z.string(),
  content: z.string(),
  replies: z.lazy(() => ReplyUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
});

export const PostCreateOrConnectWithoutNotificationsInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PostCreateWithoutNotificationsInputSchema), z.lazy(() => PostUncheckedCreateWithoutNotificationsInputSchema) ]),
});

export const PersonUpsertWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonUpsertWithoutNotificationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => PersonUpdateWithoutNotificationsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutNotificationsInputSchema) ]),
  create: z.union([ z.lazy(() => PersonCreateWithoutNotificationsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutNotificationsInputSchema) ]),
  where: z.lazy(() => PersonWhereInputSchema).optional(),
});

export const PersonUpdateToOneWithWhereWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => PersonWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PersonUpdateWithoutNotificationsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutNotificationsInputSchema) ]),
});

export const PersonUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonUpdateWithoutNotificationsInput> = z.strictObject({
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutPersonNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const PersonUncheckedUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  authoredNotifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const PersonUpsertWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonUpsertWithoutAuthoredNotificationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => PersonUpdateWithoutAuthoredNotificationsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema) ]),
  create: z.union([ z.lazy(() => PersonCreateWithoutAuthoredNotificationsInputSchema), z.lazy(() => PersonUncheckedCreateWithoutAuthoredNotificationsInputSchema) ]),
  where: z.lazy(() => PersonWhereInputSchema).optional(),
});

export const PersonUpdateToOneWithWhereWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonUpdateToOneWithWhereWithoutAuthoredNotificationsInput> = z.strictObject({
  where: z.lazy(() => PersonWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PersonUpdateWithoutAuthoredNotificationsInputSchema), z.lazy(() => PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema) ]),
});

export const PersonUpdateWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonUpdateWithoutAuthoredNotificationsInput> = z.strictObject({
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutPersonNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPersonNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const PersonUncheckedUpdateWithoutAuthoredNotificationsInputSchema: z.ZodType<Prisma.PersonUncheckedUpdateWithoutAuthoredNotificationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutAuthorNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPersonNestedInputSchema).optional(),
  settings: z.lazy(() => PersonSettingsUncheckedUpdateOneWithoutPersonNestedInputSchema).optional(),
});

export const EventUpsertWithoutNotificationsInputSchema: z.ZodType<Prisma.EventUpsertWithoutNotificationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutNotificationsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutNotificationsInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutNotificationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutNotificationsInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutNotificationsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutNotificationsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutNotificationsInputSchema) ]),
});

export const EventUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.EventUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invites: z.lazy(() => InviteUpdateManyWithoutEventNestedInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUpdateManyWithoutEventNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutEventNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  location: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  chosenDateTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invites: z.lazy(() => InviteUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  potentialDateTimes: z.lazy(() => PotentialDateTimeUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  memberships: z.lazy(() => MembershipUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const PostUpsertWithoutNotificationsInputSchema: z.ZodType<Prisma.PostUpsertWithoutNotificationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => PostUpdateWithoutNotificationsInputSchema), z.lazy(() => PostUncheckedUpdateWithoutNotificationsInputSchema) ]),
  create: z.union([ z.lazy(() => PostCreateWithoutNotificationsInputSchema), z.lazy(() => PostUncheckedCreateWithoutNotificationsInputSchema) ]),
  where: z.lazy(() => PostWhereInputSchema).optional(),
});

export const PostUpdateToOneWithWhereWithoutNotificationsInputSchema: z.ZodType<Prisma.PostUpdateToOneWithWhereWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => PostWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PostUpdateWithoutNotificationsInputSchema), z.lazy(() => PostUncheckedUpdateWithoutNotificationsInputSchema) ]),
});

export const PostUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.PostUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  author: z.lazy(() => PersonUpdateOneRequiredWithoutPostsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutPostsNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutPostNestedInputSchema).optional(),
});

export const PostUncheckedUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
});

export const PersonSettingsCreateWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsCreateWithoutNotificationMethodsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  person: z.lazy(() => PersonCreateNestedOneWithoutSettingsInputSchema),
});

export const PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedCreateWithoutNotificationMethodsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
});

export const PersonSettingsCreateOrConnectWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsCreateOrConnectWithoutNotificationMethodsInput> = z.strictObject({
  where: z.lazy(() => PersonSettingsWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PersonSettingsCreateWithoutNotificationMethodsInputSchema), z.lazy(() => PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema) ]),
});

export const NotificationSettingCreateWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingCreateWithoutNotificationMethodInput> = z.strictObject({
  id: z.string().optional(),
  notificationType: z.lazy(() => NotificationTypeSchema),
  enabled: z.boolean().optional(),
});

export const NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedCreateWithoutNotificationMethodInput> = z.strictObject({
  id: z.string().optional(),
  notificationType: z.lazy(() => NotificationTypeSchema),
  enabled: z.boolean().optional(),
});

export const NotificationSettingCreateOrConnectWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingCreateOrConnectWithoutNotificationMethodInput> = z.strictObject({
  where: z.lazy(() => NotificationSettingWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema) ]),
});

export const NotificationSettingCreateManyNotificationMethodInputEnvelopeSchema: z.ZodType<Prisma.NotificationSettingCreateManyNotificationMethodInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => NotificationSettingCreateManyNotificationMethodInputSchema), z.lazy(() => NotificationSettingCreateManyNotificationMethodInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PersonSettingsUpsertWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsUpsertWithoutNotificationMethodsInput> = z.strictObject({
  update: z.union([ z.lazy(() => PersonSettingsUpdateWithoutNotificationMethodsInputSchema), z.lazy(() => PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema) ]),
  create: z.union([ z.lazy(() => PersonSettingsCreateWithoutNotificationMethodsInputSchema), z.lazy(() => PersonSettingsUncheckedCreateWithoutNotificationMethodsInputSchema) ]),
  where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
});

export const PersonSettingsUpdateToOneWithWhereWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsUpdateToOneWithWhereWithoutNotificationMethodsInput> = z.strictObject({
  where: z.lazy(() => PersonSettingsWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PersonSettingsUpdateWithoutNotificationMethodsInputSchema), z.lazy(() => PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema) ]),
});

export const PersonSettingsUpdateWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsUpdateWithoutNotificationMethodsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  person: z.lazy(() => PersonUpdateOneRequiredWithoutSettingsNestedInputSchema).optional(),
});

export const PersonSettingsUncheckedUpdateWithoutNotificationMethodsInputSchema: z.ZodType<Prisma.PersonSettingsUncheckedUpdateWithoutNotificationMethodsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUpsertWithWhereUniqueWithoutNotificationMethodInput> = z.strictObject({
  where: z.lazy(() => NotificationSettingWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => NotificationSettingUpdateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUncheckedUpdateWithoutNotificationMethodInputSchema) ]),
  create: z.union([ z.lazy(() => NotificationSettingCreateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUncheckedCreateWithoutNotificationMethodInputSchema) ]),
});

export const NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUpdateWithWhereUniqueWithoutNotificationMethodInput> = z.strictObject({
  where: z.lazy(() => NotificationSettingWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => NotificationSettingUpdateWithoutNotificationMethodInputSchema), z.lazy(() => NotificationSettingUncheckedUpdateWithoutNotificationMethodInputSchema) ]),
});

export const NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUpdateManyWithWhereWithoutNotificationMethodInput> = z.strictObject({
  where: z.lazy(() => NotificationSettingScalarWhereInputSchema),
  data: z.union([ z.lazy(() => NotificationSettingUpdateManyMutationInputSchema), z.lazy(() => NotificationSettingUncheckedUpdateManyWithoutNotificationMethodInputSchema) ]),
});

export const NotificationSettingScalarWhereInputSchema: z.ZodType<Prisma.NotificationSettingScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationSettingScalarWhereInputSchema), z.lazy(() => NotificationSettingScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationSettingScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationSettingScalarWhereInputSchema), z.lazy(() => NotificationSettingScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  notificationType: z.union([ z.lazy(() => EnumNotificationTypeFilterSchema), z.lazy(() => NotificationTypeSchema) ]).optional(),
  methodId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
});

export const NotificationMethodCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodCreateWithoutNotificationsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => NotificationMethodTypeSchema),
  enabled: z.boolean().optional(),
  name: z.string().optional().nullable(),
  value: z.string(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.string().optional().nullable(),
  webhookFormat: z.lazy(() => WebhookFormatSchema).optional().nullable(),
  settings: z.lazy(() => PersonSettingsCreateNestedOneWithoutNotificationMethodsInputSchema),
});

export const NotificationMethodUncheckedCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedCreateWithoutNotificationsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  settingsId: z.string(),
  type: z.lazy(() => NotificationMethodTypeSchema),
  enabled: z.boolean().optional(),
  name: z.string().optional().nullable(),
  value: z.string(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.string().optional().nullable(),
  webhookFormat: z.lazy(() => WebhookFormatSchema).optional().nullable(),
});

export const NotificationMethodCreateOrConnectWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodCreateOrConnectWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => NotificationMethodWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema), z.lazy(() => NotificationMethodUncheckedCreateWithoutNotificationsInputSchema) ]),
});

export const NotificationMethodUpsertWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodUpsertWithoutNotificationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => NotificationMethodUpdateWithoutNotificationsInputSchema), z.lazy(() => NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema) ]),
  create: z.union([ z.lazy(() => NotificationMethodCreateWithoutNotificationsInputSchema), z.lazy(() => NotificationMethodUncheckedCreateWithoutNotificationsInputSchema) ]),
  where: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
});

export const NotificationMethodUpdateToOneWithWhereWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodUpdateToOneWithWhereWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => NotificationMethodWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => NotificationMethodUpdateWithoutNotificationsInputSchema), z.lazy(() => NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema) ]),
});

export const NotificationMethodUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  settings: z.lazy(() => PersonSettingsUpdateOneRequiredWithoutNotificationMethodsNestedInputSchema).optional(),
});

export const NotificationMethodUncheckedUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  settingsId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionCreateManyUserInputSchema: z.ZodType<Prisma.SessionCreateManyUserInput> = z.strictObject({
  id: z.string().optional(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const AccountCreateManyUserInputSchema: z.ZodType<Prisma.AccountCreateManyUserInput> = z.strictObject({
  id: z.string().optional(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SessionUpdateWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const AccountUpdateWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const MembershipCreateManyPersonInputSchema: z.ZodType<Prisma.MembershipCreateManyPersonInput> = z.strictObject({
  id: z.string().optional(),
  eventId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
});

export const PostCreateManyAuthorInputSchema: z.ZodType<Prisma.PostCreateManyAuthorInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  eventId: z.string(),
  title: z.string(),
  content: z.string(),
});

export const ReplyCreateManyAuthorInputSchema: z.ZodType<Prisma.ReplyCreateManyAuthorInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  postId: z.string(),
  text: z.string(),
});

export const NotificationCreateManyPersonInputSchema: z.ZodType<Prisma.NotificationCreateManyPersonInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  authorId: z.string().optional().nullable(),
  type: z.lazy(() => NotificationTypeSchema),
  eventId: z.string().optional().nullable(),
  postId: z.string().optional().nullable(),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
});

export const NotificationCreateManyAuthorInputSchema: z.ZodType<Prisma.NotificationCreateManyAuthorInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
  type: z.lazy(() => NotificationTypeSchema),
  eventId: z.string().optional().nullable(),
  postId: z.string().optional().nullable(),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
});

export const MembershipUpdateWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUpdateWithoutPersonInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutMembershipsNestedInputSchema).optional(),
  availabilities: z.lazy(() => AvailabilityUpdateManyWithoutMembershipNestedInputSchema).optional(),
  invites: z.lazy(() => InviteUpdateManyWithoutCreatedByNestedInputSchema).optional(),
});

export const MembershipUncheckedUpdateWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateWithoutPersonInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema).optional(),
  invites: z.lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema).optional(),
});

export const MembershipUncheckedUpdateManyWithoutPersonInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateManyWithoutPersonInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PostUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpdateWithoutAuthorInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutPostsNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutPostNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPostNestedInputSchema).optional(),
});

export const PostUncheckedUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutAuthorInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
});

export const PostUncheckedUpdateManyWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutAuthorInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReplyUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUpdateWithoutAuthorInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  text: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  post: z.lazy(() => PostUpdateOneRequiredWithoutRepliesNestedInputSchema).optional(),
});

export const ReplyUncheckedUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateWithoutAuthorInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  text: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReplyUncheckedUpdateManyWithoutAuthorInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateManyWithoutAuthorInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  text: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationUpdateWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUpdateWithoutPersonInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  author: z.lazy(() => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema).optional(),
  post: z.lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema).optional(),
});

export const NotificationUncheckedUpdateWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateWithoutPersonInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationUncheckedUpdateManyWithoutPersonInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutPersonInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUpdateWithoutAuthorInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  person: z.lazy(() => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema).optional(),
  post: z.lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema).optional(),
});

export const NotificationUncheckedUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateWithoutAuthorInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationUncheckedUpdateManyWithoutAuthorInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutAuthorInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationMethodCreateManySettingsInputSchema: z.ZodType<Prisma.NotificationMethodCreateManySettingsInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => NotificationMethodTypeSchema),
  enabled: z.boolean().optional(),
  name: z.string().optional().nullable(),
  value: z.string(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.string().optional().nullable(),
  webhookFormat: z.lazy(() => WebhookFormatSchema).optional().nullable(),
});

export const NotificationMethodUpdateWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUpdateWithoutSettingsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  notifications: z.lazy(() => NotificationSettingUpdateManyWithoutNotificationMethodNestedInputSchema).optional(),
});

export const NotificationMethodUncheckedUpdateWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateWithoutSettingsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  notifications: z.lazy(() => NotificationSettingUncheckedUpdateManyWithoutNotificationMethodNestedInputSchema).optional(),
});

export const NotificationMethodUncheckedUpdateManyWithoutSettingsInputSchema: z.ZodType<Prisma.NotificationMethodUncheckedUpdateManyWithoutSettingsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationMethodTypeSchema), z.lazy(() => EnumNotificationMethodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webhookHeaders: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  customTemplate: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  webhookFormat: z.union([ z.lazy(() => WebhookFormatSchema), z.lazy(() => NullableEnumWebhookFormatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const InviteCreateManyEventInputSchema: z.ZodType<Prisma.InviteCreateManyEventInput> = z.strictObject({
  id: z.string().optional(),
  createdById: z.string(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usesRemaining: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  name: z.string().optional().nullable(),
});

export const PotentialDateTimeCreateManyEventInputSchema: z.ZodType<Prisma.PotentialDateTimeCreateManyEventInput> = z.strictObject({
  id: z.string().optional(),
  dateTime: z.coerce.date().optional(),
});

export const PostCreateManyEventInputSchema: z.ZodType<Prisma.PostCreateManyEventInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  editedAt: z.coerce.date().optional(),
  authorId: z.string(),
  title: z.string(),
  content: z.string(),
});

export const MembershipCreateManyEventInputSchema: z.ZodType<Prisma.MembershipCreateManyEventInput> = z.strictObject({
  id: z.string().optional(),
  personId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  rsvpStatus: z.lazy(() => StatusSchema).optional(),
});

export const NotificationCreateManyEventInputSchema: z.ZodType<Prisma.NotificationCreateManyEventInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
  authorId: z.string().optional().nullable(),
  type: z.lazy(() => NotificationTypeSchema),
  postId: z.string().optional().nullable(),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
});

export const InviteUpdateWithoutEventInputSchema: z.ZodType<Prisma.InviteUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usesRemaining: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxUses: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdBy: z.lazy(() => MembershipUpdateOneRequiredWithoutInvitesNestedInputSchema).optional(),
});

export const InviteUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdById: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usesRemaining: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxUses: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const InviteUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdById: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usesRemaining: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxUses: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PotentialDateTimeUpdateWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  dateTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityUpdateManyWithoutPotentialDateTimeNestedInputSchema).optional(),
});

export const PotentialDateTimeUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  dateTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeNestedInputSchema).optional(),
});

export const PotentialDateTimeUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.PotentialDateTimeUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  dateTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PostUpdateWithoutEventInputSchema: z.ZodType<Prisma.PostUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  author: z.lazy(() => PersonUpdateOneRequiredWithoutPostsNestedInputSchema).optional(),
  replies: z.lazy(() => ReplyUpdateManyWithoutPostNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutPostNestedInputSchema).optional(),
});

export const PostUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  replies: z.lazy(() => ReplyUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
});

export const PostUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  editedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const MembershipUpdateWithoutEventInputSchema: z.ZodType<Prisma.MembershipUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  person: z.lazy(() => PersonUpdateOneRequiredWithoutMembershipsNestedInputSchema).optional(),
  availabilities: z.lazy(() => AvailabilityUpdateManyWithoutMembershipNestedInputSchema).optional(),
  invites: z.lazy(() => InviteUpdateManyWithoutCreatedByNestedInputSchema).optional(),
});

export const MembershipUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  availabilities: z.lazy(() => AvailabilityUncheckedUpdateManyWithoutMembershipNestedInputSchema).optional(),
  invites: z.lazy(() => InviteUncheckedUpdateManyWithoutCreatedByNestedInputSchema).optional(),
});

export const MembershipUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.MembershipUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  rsvpStatus: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationUpdateWithoutEventInputSchema: z.ZodType<Prisma.NotificationUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  person: z.lazy(() => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema).optional(),
  author: z.lazy(() => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema).optional(),
  post: z.lazy(() => PostUpdateOneWithoutNotificationsNestedInputSchema).optional(),
});

export const NotificationUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  postId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  postId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const AvailabilityCreateManyMembershipInputSchema: z.ZodType<Prisma.AvailabilityCreateManyMembershipInput> = z.strictObject({
  potentialDateTimeId: z.string(),
  status: z.lazy(() => StatusSchema),
});

export const InviteCreateManyCreatedByInputSchema: z.ZodType<Prisma.InviteCreateManyCreatedByInput> = z.strictObject({
  id: z.string().optional(),
  eventId: z.string(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usesRemaining: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  name: z.string().optional().nullable(),
});

export const AvailabilityUpdateWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUpdateWithoutMembershipInput> = z.strictObject({
  status: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  potentialDateTime: z.lazy(() => PotentialDateTimeUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema).optional(),
});

export const AvailabilityUncheckedUpdateWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateWithoutMembershipInput> = z.strictObject({
  potentialDateTimeId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AvailabilityUncheckedUpdateManyWithoutMembershipInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateManyWithoutMembershipInput> = z.strictObject({
  potentialDateTimeId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const InviteUpdateWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUpdateWithoutCreatedByInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usesRemaining: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxUses: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutInvitesNestedInputSchema).optional(),
});

export const InviteUncheckedUpdateWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateWithoutCreatedByInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usesRemaining: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxUses: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const InviteUncheckedUpdateManyWithoutCreatedByInputSchema: z.ZodType<Prisma.InviteUncheckedUpdateManyWithoutCreatedByInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usesRemaining: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxUses: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const AvailabilityCreateManyPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityCreateManyPotentialDateTimeInput> = z.strictObject({
  membershipId: z.string(),
  status: z.lazy(() => StatusSchema),
});

export const AvailabilityUpdateWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUpdateWithoutPotentialDateTimeInput> = z.strictObject({
  status: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
  membership: z.lazy(() => MembershipUpdateOneRequiredWithoutAvailabilitiesNestedInputSchema).optional(),
});

export const AvailabilityUncheckedUpdateWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateWithoutPotentialDateTimeInput> = z.strictObject({
  membershipId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeInputSchema: z.ZodType<Prisma.AvailabilityUncheckedUpdateManyWithoutPotentialDateTimeInput> = z.strictObject({
  membershipId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => StatusSchema), z.lazy(() => EnumStatusFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReplyCreateManyPostInputSchema: z.ZodType<Prisma.ReplyCreateManyPostInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  authorId: z.string(),
  text: z.string(),
});

export const NotificationCreateManyPostInputSchema: z.ZodType<Prisma.NotificationCreateManyPostInput> = z.strictObject({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  personId: z.string(),
  authorId: z.string().optional().nullable(),
  type: z.lazy(() => NotificationTypeSchema),
  eventId: z.string().optional().nullable(),
  read: z.boolean().optional(),
  datetime: z.coerce.date().optional().nullable(),
  rsvp: z.lazy(() => StatusSchema).optional().nullable(),
});

export const ReplyUpdateWithoutPostInputSchema: z.ZodType<Prisma.ReplyUpdateWithoutPostInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  text: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  author: z.lazy(() => PersonUpdateOneRequiredWithoutRepliesNestedInputSchema).optional(),
});

export const ReplyUncheckedUpdateWithoutPostInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateWithoutPostInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  text: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReplyUncheckedUpdateManyWithoutPostInputSchema: z.ZodType<Prisma.ReplyUncheckedUpdateManyWithoutPostInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  text: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationUpdateWithoutPostInputSchema: z.ZodType<Prisma.NotificationUpdateWithoutPostInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  person: z.lazy(() => PersonUpdateOneRequiredWithoutNotificationsNestedInputSchema).optional(),
  author: z.lazy(() => PersonUpdateOneWithoutAuthoredNotificationsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneWithoutNotificationsNestedInputSchema).optional(),
});

export const NotificationUncheckedUpdateWithoutPostInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateWithoutPostInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationUncheckedUpdateManyWithoutPostInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutPostInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  personId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authorId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  read: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  datetime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rsvp: z.union([ z.lazy(() => StatusSchema), z.lazy(() => NullableEnumStatusFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const NotificationSettingCreateManyNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingCreateManyNotificationMethodInput> = z.strictObject({
  id: z.string().optional(),
  notificationType: z.lazy(() => NotificationTypeSchema),
  enabled: z.boolean().optional(),
});

export const NotificationSettingUpdateWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUpdateWithoutNotificationMethodInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  notificationType: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationSettingUncheckedUpdateWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedUpdateWithoutNotificationMethodInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  notificationType: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationSettingUncheckedUpdateManyWithoutNotificationMethodInputSchema: z.ZodType<Prisma.NotificationSettingUncheckedUpdateManyWithoutNotificationMethodInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  notificationType: z.union([ z.lazy(() => NotificationTypeSchema), z.lazy(() => EnumNotificationTypeFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
});

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(), UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(), 
  having: UserScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const PersonFindFirstArgsSchema: z.ZodType<Prisma.PersonFindFirstArgs> = z.object({
  select: PersonSelectSchema.optional(),
  include: PersonIncludeSchema.optional(),
  where: PersonWhereInputSchema.optional(), 
  orderBy: z.union([ PersonOrderByWithRelationInputSchema.array(), PersonOrderByWithRelationInputSchema ]).optional(),
  cursor: PersonWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PersonScalarFieldEnumSchema, PersonScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PersonFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PersonFindFirstOrThrowArgs> = z.object({
  select: PersonSelectSchema.optional(),
  include: PersonIncludeSchema.optional(),
  where: PersonWhereInputSchema.optional(), 
  orderBy: z.union([ PersonOrderByWithRelationInputSchema.array(), PersonOrderByWithRelationInputSchema ]).optional(),
  cursor: PersonWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PersonScalarFieldEnumSchema, PersonScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PersonFindManyArgsSchema: z.ZodType<Prisma.PersonFindManyArgs> = z.object({
  select: PersonSelectSchema.optional(),
  include: PersonIncludeSchema.optional(),
  where: PersonWhereInputSchema.optional(), 
  orderBy: z.union([ PersonOrderByWithRelationInputSchema.array(), PersonOrderByWithRelationInputSchema ]).optional(),
  cursor: PersonWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PersonScalarFieldEnumSchema, PersonScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PersonAggregateArgsSchema: z.ZodType<Prisma.PersonAggregateArgs> = z.object({
  where: PersonWhereInputSchema.optional(), 
  orderBy: z.union([ PersonOrderByWithRelationInputSchema.array(), PersonOrderByWithRelationInputSchema ]).optional(),
  cursor: PersonWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PersonGroupByArgsSchema: z.ZodType<Prisma.PersonGroupByArgs> = z.object({
  where: PersonWhereInputSchema.optional(), 
  orderBy: z.union([ PersonOrderByWithAggregationInputSchema.array(), PersonOrderByWithAggregationInputSchema ]).optional(),
  by: PersonScalarFieldEnumSchema.array(), 
  having: PersonScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PersonFindUniqueArgsSchema: z.ZodType<Prisma.PersonFindUniqueArgs> = z.object({
  select: PersonSelectSchema.optional(),
  include: PersonIncludeSchema.optional(),
  where: PersonWhereUniqueInputSchema, 
}).strict();

export const PersonFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PersonFindUniqueOrThrowArgs> = z.object({
  select: PersonSelectSchema.optional(),
  include: PersonIncludeSchema.optional(),
  where: PersonWhereUniqueInputSchema, 
}).strict();

export const SessionFindFirstArgsSchema: z.ZodType<Prisma.SessionFindFirstArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SessionScalarFieldEnumSchema, SessionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SessionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SessionFindFirstOrThrowArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SessionScalarFieldEnumSchema, SessionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SessionFindManyArgsSchema: z.ZodType<Prisma.SessionFindManyArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SessionScalarFieldEnumSchema, SessionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SessionAggregateArgsSchema: z.ZodType<Prisma.SessionAggregateArgs> = z.object({
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SessionGroupByArgsSchema: z.ZodType<Prisma.SessionGroupByArgs> = z.object({
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithAggregationInputSchema.array(), SessionOrderByWithAggregationInputSchema ]).optional(),
  by: SessionScalarFieldEnumSchema.array(), 
  having: SessionScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SessionFindUniqueArgsSchema: z.ZodType<Prisma.SessionFindUniqueArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const SessionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SessionFindUniqueOrThrowArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const AccountFindFirstArgsSchema: z.ZodType<Prisma.AccountFindFirstArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AccountScalarFieldEnumSchema, AccountScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AccountFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AccountFindFirstOrThrowArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AccountScalarFieldEnumSchema, AccountScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AccountFindManyArgsSchema: z.ZodType<Prisma.AccountFindManyArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AccountScalarFieldEnumSchema, AccountScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AccountAggregateArgsSchema: z.ZodType<Prisma.AccountAggregateArgs> = z.object({
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AccountGroupByArgsSchema: z.ZodType<Prisma.AccountGroupByArgs> = z.object({
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithAggregationInputSchema.array(), AccountOrderByWithAggregationInputSchema ]).optional(),
  by: AccountScalarFieldEnumSchema.array(), 
  having: AccountScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AccountFindUniqueArgsSchema: z.ZodType<Prisma.AccountFindUniqueArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const AccountFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AccountFindUniqueOrThrowArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const VerificationFindFirstArgsSchema: z.ZodType<Prisma.VerificationFindFirstArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ VerificationScalarFieldEnumSchema, VerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const VerificationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.VerificationFindFirstOrThrowArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ VerificationScalarFieldEnumSchema, VerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const VerificationFindManyArgsSchema: z.ZodType<Prisma.VerificationFindManyArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ VerificationScalarFieldEnumSchema, VerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const VerificationAggregateArgsSchema: z.ZodType<Prisma.VerificationAggregateArgs> = z.object({
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const VerificationGroupByArgsSchema: z.ZodType<Prisma.VerificationGroupByArgs> = z.object({
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithAggregationInputSchema.array(), VerificationOrderByWithAggregationInputSchema ]).optional(),
  by: VerificationScalarFieldEnumSchema.array(), 
  having: VerificationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const VerificationFindUniqueArgsSchema: z.ZodType<Prisma.VerificationFindUniqueArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const VerificationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.VerificationFindUniqueOrThrowArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const PersonSettingsFindFirstArgsSchema: z.ZodType<Prisma.PersonSettingsFindFirstArgs> = z.object({
  select: PersonSettingsSelectSchema.optional(),
  include: PersonSettingsIncludeSchema.optional(),
  where: PersonSettingsWhereInputSchema.optional(), 
  orderBy: z.union([ PersonSettingsOrderByWithRelationInputSchema.array(), PersonSettingsOrderByWithRelationInputSchema ]).optional(),
  cursor: PersonSettingsWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PersonSettingsScalarFieldEnumSchema, PersonSettingsScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PersonSettingsFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PersonSettingsFindFirstOrThrowArgs> = z.object({
  select: PersonSettingsSelectSchema.optional(),
  include: PersonSettingsIncludeSchema.optional(),
  where: PersonSettingsWhereInputSchema.optional(), 
  orderBy: z.union([ PersonSettingsOrderByWithRelationInputSchema.array(), PersonSettingsOrderByWithRelationInputSchema ]).optional(),
  cursor: PersonSettingsWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PersonSettingsScalarFieldEnumSchema, PersonSettingsScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PersonSettingsFindManyArgsSchema: z.ZodType<Prisma.PersonSettingsFindManyArgs> = z.object({
  select: PersonSettingsSelectSchema.optional(),
  include: PersonSettingsIncludeSchema.optional(),
  where: PersonSettingsWhereInputSchema.optional(), 
  orderBy: z.union([ PersonSettingsOrderByWithRelationInputSchema.array(), PersonSettingsOrderByWithRelationInputSchema ]).optional(),
  cursor: PersonSettingsWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PersonSettingsScalarFieldEnumSchema, PersonSettingsScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PersonSettingsAggregateArgsSchema: z.ZodType<Prisma.PersonSettingsAggregateArgs> = z.object({
  where: PersonSettingsWhereInputSchema.optional(), 
  orderBy: z.union([ PersonSettingsOrderByWithRelationInputSchema.array(), PersonSettingsOrderByWithRelationInputSchema ]).optional(),
  cursor: PersonSettingsWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PersonSettingsGroupByArgsSchema: z.ZodType<Prisma.PersonSettingsGroupByArgs> = z.object({
  where: PersonSettingsWhereInputSchema.optional(), 
  orderBy: z.union([ PersonSettingsOrderByWithAggregationInputSchema.array(), PersonSettingsOrderByWithAggregationInputSchema ]).optional(),
  by: PersonSettingsScalarFieldEnumSchema.array(), 
  having: PersonSettingsScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PersonSettingsFindUniqueArgsSchema: z.ZodType<Prisma.PersonSettingsFindUniqueArgs> = z.object({
  select: PersonSettingsSelectSchema.optional(),
  include: PersonSettingsIncludeSchema.optional(),
  where: PersonSettingsWhereUniqueInputSchema, 
}).strict();

export const PersonSettingsFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PersonSettingsFindUniqueOrThrowArgs> = z.object({
  select: PersonSettingsSelectSchema.optional(),
  include: PersonSettingsIncludeSchema.optional(),
  where: PersonSettingsWhereUniqueInputSchema, 
}).strict();

export const EventFindFirstArgsSchema: z.ZodType<Prisma.EventFindFirstArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventFindFirstOrThrowArgsSchema: z.ZodType<Prisma.EventFindFirstOrThrowArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventFindManyArgsSchema: z.ZodType<Prisma.EventFindManyArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventAggregateArgsSchema: z.ZodType<Prisma.EventAggregateArgs> = z.object({
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EventGroupByArgsSchema: z.ZodType<Prisma.EventGroupByArgs> = z.object({
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithAggregationInputSchema.array(), EventOrderByWithAggregationInputSchema ]).optional(),
  by: EventScalarFieldEnumSchema.array(), 
  having: EventScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EventFindUniqueArgsSchema: z.ZodType<Prisma.EventFindUniqueArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const EventFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.EventFindUniqueOrThrowArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const MembershipFindFirstArgsSchema: z.ZodType<Prisma.MembershipFindFirstArgs> = z.object({
  select: MembershipSelectSchema.optional(),
  include: MembershipIncludeSchema.optional(),
  where: MembershipWhereInputSchema.optional(), 
  orderBy: z.union([ MembershipOrderByWithRelationInputSchema.array(), MembershipOrderByWithRelationInputSchema ]).optional(),
  cursor: MembershipWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ MembershipScalarFieldEnumSchema, MembershipScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const MembershipFindFirstOrThrowArgsSchema: z.ZodType<Prisma.MembershipFindFirstOrThrowArgs> = z.object({
  select: MembershipSelectSchema.optional(),
  include: MembershipIncludeSchema.optional(),
  where: MembershipWhereInputSchema.optional(), 
  orderBy: z.union([ MembershipOrderByWithRelationInputSchema.array(), MembershipOrderByWithRelationInputSchema ]).optional(),
  cursor: MembershipWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ MembershipScalarFieldEnumSchema, MembershipScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const MembershipFindManyArgsSchema: z.ZodType<Prisma.MembershipFindManyArgs> = z.object({
  select: MembershipSelectSchema.optional(),
  include: MembershipIncludeSchema.optional(),
  where: MembershipWhereInputSchema.optional(), 
  orderBy: z.union([ MembershipOrderByWithRelationInputSchema.array(), MembershipOrderByWithRelationInputSchema ]).optional(),
  cursor: MembershipWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ MembershipScalarFieldEnumSchema, MembershipScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const MembershipAggregateArgsSchema: z.ZodType<Prisma.MembershipAggregateArgs> = z.object({
  where: MembershipWhereInputSchema.optional(), 
  orderBy: z.union([ MembershipOrderByWithRelationInputSchema.array(), MembershipOrderByWithRelationInputSchema ]).optional(),
  cursor: MembershipWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const MembershipGroupByArgsSchema: z.ZodType<Prisma.MembershipGroupByArgs> = z.object({
  where: MembershipWhereInputSchema.optional(), 
  orderBy: z.union([ MembershipOrderByWithAggregationInputSchema.array(), MembershipOrderByWithAggregationInputSchema ]).optional(),
  by: MembershipScalarFieldEnumSchema.array(), 
  having: MembershipScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const MembershipFindUniqueArgsSchema: z.ZodType<Prisma.MembershipFindUniqueArgs> = z.object({
  select: MembershipSelectSchema.optional(),
  include: MembershipIncludeSchema.optional(),
  where: MembershipWhereUniqueInputSchema, 
}).strict();

export const MembershipFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.MembershipFindUniqueOrThrowArgs> = z.object({
  select: MembershipSelectSchema.optional(),
  include: MembershipIncludeSchema.optional(),
  where: MembershipWhereUniqueInputSchema, 
}).strict();

export const PotentialDateTimeFindFirstArgsSchema: z.ZodType<Prisma.PotentialDateTimeFindFirstArgs> = z.object({
  select: PotentialDateTimeSelectSchema.optional(),
  include: PotentialDateTimeIncludeSchema.optional(),
  where: PotentialDateTimeWhereInputSchema.optional(), 
  orderBy: z.union([ PotentialDateTimeOrderByWithRelationInputSchema.array(), PotentialDateTimeOrderByWithRelationInputSchema ]).optional(),
  cursor: PotentialDateTimeWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PotentialDateTimeScalarFieldEnumSchema, PotentialDateTimeScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PotentialDateTimeFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PotentialDateTimeFindFirstOrThrowArgs> = z.object({
  select: PotentialDateTimeSelectSchema.optional(),
  include: PotentialDateTimeIncludeSchema.optional(),
  where: PotentialDateTimeWhereInputSchema.optional(), 
  orderBy: z.union([ PotentialDateTimeOrderByWithRelationInputSchema.array(), PotentialDateTimeOrderByWithRelationInputSchema ]).optional(),
  cursor: PotentialDateTimeWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PotentialDateTimeScalarFieldEnumSchema, PotentialDateTimeScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PotentialDateTimeFindManyArgsSchema: z.ZodType<Prisma.PotentialDateTimeFindManyArgs> = z.object({
  select: PotentialDateTimeSelectSchema.optional(),
  include: PotentialDateTimeIncludeSchema.optional(),
  where: PotentialDateTimeWhereInputSchema.optional(), 
  orderBy: z.union([ PotentialDateTimeOrderByWithRelationInputSchema.array(), PotentialDateTimeOrderByWithRelationInputSchema ]).optional(),
  cursor: PotentialDateTimeWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PotentialDateTimeScalarFieldEnumSchema, PotentialDateTimeScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PotentialDateTimeAggregateArgsSchema: z.ZodType<Prisma.PotentialDateTimeAggregateArgs> = z.object({
  where: PotentialDateTimeWhereInputSchema.optional(), 
  orderBy: z.union([ PotentialDateTimeOrderByWithRelationInputSchema.array(), PotentialDateTimeOrderByWithRelationInputSchema ]).optional(),
  cursor: PotentialDateTimeWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PotentialDateTimeGroupByArgsSchema: z.ZodType<Prisma.PotentialDateTimeGroupByArgs> = z.object({
  where: PotentialDateTimeWhereInputSchema.optional(), 
  orderBy: z.union([ PotentialDateTimeOrderByWithAggregationInputSchema.array(), PotentialDateTimeOrderByWithAggregationInputSchema ]).optional(),
  by: PotentialDateTimeScalarFieldEnumSchema.array(), 
  having: PotentialDateTimeScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PotentialDateTimeFindUniqueArgsSchema: z.ZodType<Prisma.PotentialDateTimeFindUniqueArgs> = z.object({
  select: PotentialDateTimeSelectSchema.optional(),
  include: PotentialDateTimeIncludeSchema.optional(),
  where: PotentialDateTimeWhereUniqueInputSchema, 
}).strict();

export const PotentialDateTimeFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PotentialDateTimeFindUniqueOrThrowArgs> = z.object({
  select: PotentialDateTimeSelectSchema.optional(),
  include: PotentialDateTimeIncludeSchema.optional(),
  where: PotentialDateTimeWhereUniqueInputSchema, 
}).strict();

export const AvailabilityFindFirstArgsSchema: z.ZodType<Prisma.AvailabilityFindFirstArgs> = z.object({
  select: AvailabilitySelectSchema.optional(),
  include: AvailabilityIncludeSchema.optional(),
  where: AvailabilityWhereInputSchema.optional(), 
  orderBy: z.union([ AvailabilityOrderByWithRelationInputSchema.array(), AvailabilityOrderByWithRelationInputSchema ]).optional(),
  cursor: AvailabilityWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AvailabilityScalarFieldEnumSchema, AvailabilityScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AvailabilityFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AvailabilityFindFirstOrThrowArgs> = z.object({
  select: AvailabilitySelectSchema.optional(),
  include: AvailabilityIncludeSchema.optional(),
  where: AvailabilityWhereInputSchema.optional(), 
  orderBy: z.union([ AvailabilityOrderByWithRelationInputSchema.array(), AvailabilityOrderByWithRelationInputSchema ]).optional(),
  cursor: AvailabilityWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AvailabilityScalarFieldEnumSchema, AvailabilityScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AvailabilityFindManyArgsSchema: z.ZodType<Prisma.AvailabilityFindManyArgs> = z.object({
  select: AvailabilitySelectSchema.optional(),
  include: AvailabilityIncludeSchema.optional(),
  where: AvailabilityWhereInputSchema.optional(), 
  orderBy: z.union([ AvailabilityOrderByWithRelationInputSchema.array(), AvailabilityOrderByWithRelationInputSchema ]).optional(),
  cursor: AvailabilityWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AvailabilityScalarFieldEnumSchema, AvailabilityScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AvailabilityAggregateArgsSchema: z.ZodType<Prisma.AvailabilityAggregateArgs> = z.object({
  where: AvailabilityWhereInputSchema.optional(), 
  orderBy: z.union([ AvailabilityOrderByWithRelationInputSchema.array(), AvailabilityOrderByWithRelationInputSchema ]).optional(),
  cursor: AvailabilityWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AvailabilityGroupByArgsSchema: z.ZodType<Prisma.AvailabilityGroupByArgs> = z.object({
  where: AvailabilityWhereInputSchema.optional(), 
  orderBy: z.union([ AvailabilityOrderByWithAggregationInputSchema.array(), AvailabilityOrderByWithAggregationInputSchema ]).optional(),
  by: AvailabilityScalarFieldEnumSchema.array(), 
  having: AvailabilityScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AvailabilityFindUniqueArgsSchema: z.ZodType<Prisma.AvailabilityFindUniqueArgs> = z.object({
  select: AvailabilitySelectSchema.optional(),
  include: AvailabilityIncludeSchema.optional(),
  where: AvailabilityWhereUniqueInputSchema, 
}).strict();

export const AvailabilityFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AvailabilityFindUniqueOrThrowArgs> = z.object({
  select: AvailabilitySelectSchema.optional(),
  include: AvailabilityIncludeSchema.optional(),
  where: AvailabilityWhereUniqueInputSchema, 
}).strict();

export const PostFindFirstArgsSchema: z.ZodType<Prisma.PostFindFirstArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereInputSchema.optional(), 
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(), PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PostScalarFieldEnumSchema, PostScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PostFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PostFindFirstOrThrowArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereInputSchema.optional(), 
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(), PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PostScalarFieldEnumSchema, PostScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PostFindManyArgsSchema: z.ZodType<Prisma.PostFindManyArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereInputSchema.optional(), 
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(), PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PostScalarFieldEnumSchema, PostScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PostAggregateArgsSchema: z.ZodType<Prisma.PostAggregateArgs> = z.object({
  where: PostWhereInputSchema.optional(), 
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(), PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PostGroupByArgsSchema: z.ZodType<Prisma.PostGroupByArgs> = z.object({
  where: PostWhereInputSchema.optional(), 
  orderBy: z.union([ PostOrderByWithAggregationInputSchema.array(), PostOrderByWithAggregationInputSchema ]).optional(),
  by: PostScalarFieldEnumSchema.array(), 
  having: PostScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PostFindUniqueArgsSchema: z.ZodType<Prisma.PostFindUniqueArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereUniqueInputSchema, 
}).strict();

export const PostFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PostFindUniqueOrThrowArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereUniqueInputSchema, 
}).strict();

export const ReplyFindFirstArgsSchema: z.ZodType<Prisma.ReplyFindFirstArgs> = z.object({
  select: ReplySelectSchema.optional(),
  include: ReplyIncludeSchema.optional(),
  where: ReplyWhereInputSchema.optional(), 
  orderBy: z.union([ ReplyOrderByWithRelationInputSchema.array(), ReplyOrderByWithRelationInputSchema ]).optional(),
  cursor: ReplyWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReplyScalarFieldEnumSchema, ReplyScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReplyFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ReplyFindFirstOrThrowArgs> = z.object({
  select: ReplySelectSchema.optional(),
  include: ReplyIncludeSchema.optional(),
  where: ReplyWhereInputSchema.optional(), 
  orderBy: z.union([ ReplyOrderByWithRelationInputSchema.array(), ReplyOrderByWithRelationInputSchema ]).optional(),
  cursor: ReplyWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReplyScalarFieldEnumSchema, ReplyScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReplyFindManyArgsSchema: z.ZodType<Prisma.ReplyFindManyArgs> = z.object({
  select: ReplySelectSchema.optional(),
  include: ReplyIncludeSchema.optional(),
  where: ReplyWhereInputSchema.optional(), 
  orderBy: z.union([ ReplyOrderByWithRelationInputSchema.array(), ReplyOrderByWithRelationInputSchema ]).optional(),
  cursor: ReplyWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReplyScalarFieldEnumSchema, ReplyScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReplyAggregateArgsSchema: z.ZodType<Prisma.ReplyAggregateArgs> = z.object({
  where: ReplyWhereInputSchema.optional(), 
  orderBy: z.union([ ReplyOrderByWithRelationInputSchema.array(), ReplyOrderByWithRelationInputSchema ]).optional(),
  cursor: ReplyWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ReplyGroupByArgsSchema: z.ZodType<Prisma.ReplyGroupByArgs> = z.object({
  where: ReplyWhereInputSchema.optional(), 
  orderBy: z.union([ ReplyOrderByWithAggregationInputSchema.array(), ReplyOrderByWithAggregationInputSchema ]).optional(),
  by: ReplyScalarFieldEnumSchema.array(), 
  having: ReplyScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ReplyFindUniqueArgsSchema: z.ZodType<Prisma.ReplyFindUniqueArgs> = z.object({
  select: ReplySelectSchema.optional(),
  include: ReplyIncludeSchema.optional(),
  where: ReplyWhereUniqueInputSchema, 
}).strict();

export const ReplyFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ReplyFindUniqueOrThrowArgs> = z.object({
  select: ReplySelectSchema.optional(),
  include: ReplyIncludeSchema.optional(),
  where: ReplyWhereUniqueInputSchema, 
}).strict();

export const InviteFindFirstArgsSchema: z.ZodType<Prisma.InviteFindFirstArgs> = z.object({
  select: InviteSelectSchema.optional(),
  include: InviteIncludeSchema.optional(),
  where: InviteWhereInputSchema.optional(), 
  orderBy: z.union([ InviteOrderByWithRelationInputSchema.array(), InviteOrderByWithRelationInputSchema ]).optional(),
  cursor: InviteWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ InviteScalarFieldEnumSchema, InviteScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const InviteFindFirstOrThrowArgsSchema: z.ZodType<Prisma.InviteFindFirstOrThrowArgs> = z.object({
  select: InviteSelectSchema.optional(),
  include: InviteIncludeSchema.optional(),
  where: InviteWhereInputSchema.optional(), 
  orderBy: z.union([ InviteOrderByWithRelationInputSchema.array(), InviteOrderByWithRelationInputSchema ]).optional(),
  cursor: InviteWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ InviteScalarFieldEnumSchema, InviteScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const InviteFindManyArgsSchema: z.ZodType<Prisma.InviteFindManyArgs> = z.object({
  select: InviteSelectSchema.optional(),
  include: InviteIncludeSchema.optional(),
  where: InviteWhereInputSchema.optional(), 
  orderBy: z.union([ InviteOrderByWithRelationInputSchema.array(), InviteOrderByWithRelationInputSchema ]).optional(),
  cursor: InviteWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ InviteScalarFieldEnumSchema, InviteScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const InviteAggregateArgsSchema: z.ZodType<Prisma.InviteAggregateArgs> = z.object({
  where: InviteWhereInputSchema.optional(), 
  orderBy: z.union([ InviteOrderByWithRelationInputSchema.array(), InviteOrderByWithRelationInputSchema ]).optional(),
  cursor: InviteWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const InviteGroupByArgsSchema: z.ZodType<Prisma.InviteGroupByArgs> = z.object({
  where: InviteWhereInputSchema.optional(), 
  orderBy: z.union([ InviteOrderByWithAggregationInputSchema.array(), InviteOrderByWithAggregationInputSchema ]).optional(),
  by: InviteScalarFieldEnumSchema.array(), 
  having: InviteScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const InviteFindUniqueArgsSchema: z.ZodType<Prisma.InviteFindUniqueArgs> = z.object({
  select: InviteSelectSchema.optional(),
  include: InviteIncludeSchema.optional(),
  where: InviteWhereUniqueInputSchema, 
}).strict();

export const InviteFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.InviteFindUniqueOrThrowArgs> = z.object({
  select: InviteSelectSchema.optional(),
  include: InviteIncludeSchema.optional(),
  where: InviteWhereUniqueInputSchema, 
}).strict();

export const NotificationFindFirstArgsSchema: z.ZodType<Prisma.NotificationFindFirstArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(), NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationScalarFieldEnumSchema, NotificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.NotificationFindFirstOrThrowArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(), NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationScalarFieldEnumSchema, NotificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationFindManyArgsSchema: z.ZodType<Prisma.NotificationFindManyArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(), NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationScalarFieldEnumSchema, NotificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationAggregateArgsSchema: z.ZodType<Prisma.NotificationAggregateArgs> = z.object({
  where: NotificationWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(), NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const NotificationGroupByArgsSchema: z.ZodType<Prisma.NotificationGroupByArgs> = z.object({
  where: NotificationWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationOrderByWithAggregationInputSchema.array(), NotificationOrderByWithAggregationInputSchema ]).optional(),
  by: NotificationScalarFieldEnumSchema.array(), 
  having: NotificationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const NotificationFindUniqueArgsSchema: z.ZodType<Prisma.NotificationFindUniqueArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereUniqueInputSchema, 
}).strict();

export const NotificationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.NotificationFindUniqueOrThrowArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereUniqueInputSchema, 
}).strict();

export const NotificationMethodFindFirstArgsSchema: z.ZodType<Prisma.NotificationMethodFindFirstArgs> = z.object({
  select: NotificationMethodSelectSchema.optional(),
  include: NotificationMethodIncludeSchema.optional(),
  where: NotificationMethodWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationMethodOrderByWithRelationInputSchema.array(), NotificationMethodOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationMethodWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationMethodScalarFieldEnumSchema, NotificationMethodScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationMethodFindFirstOrThrowArgsSchema: z.ZodType<Prisma.NotificationMethodFindFirstOrThrowArgs> = z.object({
  select: NotificationMethodSelectSchema.optional(),
  include: NotificationMethodIncludeSchema.optional(),
  where: NotificationMethodWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationMethodOrderByWithRelationInputSchema.array(), NotificationMethodOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationMethodWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationMethodScalarFieldEnumSchema, NotificationMethodScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationMethodFindManyArgsSchema: z.ZodType<Prisma.NotificationMethodFindManyArgs> = z.object({
  select: NotificationMethodSelectSchema.optional(),
  include: NotificationMethodIncludeSchema.optional(),
  where: NotificationMethodWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationMethodOrderByWithRelationInputSchema.array(), NotificationMethodOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationMethodWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationMethodScalarFieldEnumSchema, NotificationMethodScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationMethodAggregateArgsSchema: z.ZodType<Prisma.NotificationMethodAggregateArgs> = z.object({
  where: NotificationMethodWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationMethodOrderByWithRelationInputSchema.array(), NotificationMethodOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationMethodWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const NotificationMethodGroupByArgsSchema: z.ZodType<Prisma.NotificationMethodGroupByArgs> = z.object({
  where: NotificationMethodWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationMethodOrderByWithAggregationInputSchema.array(), NotificationMethodOrderByWithAggregationInputSchema ]).optional(),
  by: NotificationMethodScalarFieldEnumSchema.array(), 
  having: NotificationMethodScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const NotificationMethodFindUniqueArgsSchema: z.ZodType<Prisma.NotificationMethodFindUniqueArgs> = z.object({
  select: NotificationMethodSelectSchema.optional(),
  include: NotificationMethodIncludeSchema.optional(),
  where: NotificationMethodWhereUniqueInputSchema, 
}).strict();

export const NotificationMethodFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.NotificationMethodFindUniqueOrThrowArgs> = z.object({
  select: NotificationMethodSelectSchema.optional(),
  include: NotificationMethodIncludeSchema.optional(),
  where: NotificationMethodWhereUniqueInputSchema, 
}).strict();

export const NotificationSettingFindFirstArgsSchema: z.ZodType<Prisma.NotificationSettingFindFirstArgs> = z.object({
  select: NotificationSettingSelectSchema.optional(),
  include: NotificationSettingIncludeSchema.optional(),
  where: NotificationSettingWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationSettingOrderByWithRelationInputSchema.array(), NotificationSettingOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationSettingWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationSettingScalarFieldEnumSchema, NotificationSettingScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationSettingFindFirstOrThrowArgsSchema: z.ZodType<Prisma.NotificationSettingFindFirstOrThrowArgs> = z.object({
  select: NotificationSettingSelectSchema.optional(),
  include: NotificationSettingIncludeSchema.optional(),
  where: NotificationSettingWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationSettingOrderByWithRelationInputSchema.array(), NotificationSettingOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationSettingWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationSettingScalarFieldEnumSchema, NotificationSettingScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationSettingFindManyArgsSchema: z.ZodType<Prisma.NotificationSettingFindManyArgs> = z.object({
  select: NotificationSettingSelectSchema.optional(),
  include: NotificationSettingIncludeSchema.optional(),
  where: NotificationSettingWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationSettingOrderByWithRelationInputSchema.array(), NotificationSettingOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationSettingWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationSettingScalarFieldEnumSchema, NotificationSettingScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationSettingAggregateArgsSchema: z.ZodType<Prisma.NotificationSettingAggregateArgs> = z.object({
  where: NotificationSettingWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationSettingOrderByWithRelationInputSchema.array(), NotificationSettingOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationSettingWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const NotificationSettingGroupByArgsSchema: z.ZodType<Prisma.NotificationSettingGroupByArgs> = z.object({
  where: NotificationSettingWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationSettingOrderByWithAggregationInputSchema.array(), NotificationSettingOrderByWithAggregationInputSchema ]).optional(),
  by: NotificationSettingScalarFieldEnumSchema.array(), 
  having: NotificationSettingScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const NotificationSettingFindUniqueArgsSchema: z.ZodType<Prisma.NotificationSettingFindUniqueArgs> = z.object({
  select: NotificationSettingSelectSchema.optional(),
  include: NotificationSettingIncludeSchema.optional(),
  where: NotificationSettingWhereUniqueInputSchema, 
}).strict();

export const NotificationSettingFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.NotificationSettingFindUniqueOrThrowArgs> = z.object({
  select: NotificationSettingSelectSchema.optional(),
  include: NotificationSettingIncludeSchema.optional(),
  where: NotificationSettingWhereUniqueInputSchema, 
}).strict();

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
}).strict();

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
  create: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
}).strict();

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PersonCreateArgsSchema: z.ZodType<Prisma.PersonCreateArgs> = z.object({
  select: PersonSelectSchema.optional(),
  include: PersonIncludeSchema.optional(),
  data: z.union([ PersonCreateInputSchema, PersonUncheckedCreateInputSchema ]),
}).strict();

export const PersonUpsertArgsSchema: z.ZodType<Prisma.PersonUpsertArgs> = z.object({
  select: PersonSelectSchema.optional(),
  include: PersonIncludeSchema.optional(),
  where: PersonWhereUniqueInputSchema, 
  create: z.union([ PersonCreateInputSchema, PersonUncheckedCreateInputSchema ]),
  update: z.union([ PersonUpdateInputSchema, PersonUncheckedUpdateInputSchema ]),
}).strict();

export const PersonCreateManyArgsSchema: z.ZodType<Prisma.PersonCreateManyArgs> = z.object({
  data: z.union([ PersonCreateManyInputSchema, PersonCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PersonCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PersonCreateManyAndReturnArgs> = z.object({
  data: z.union([ PersonCreateManyInputSchema, PersonCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PersonDeleteArgsSchema: z.ZodType<Prisma.PersonDeleteArgs> = z.object({
  select: PersonSelectSchema.optional(),
  include: PersonIncludeSchema.optional(),
  where: PersonWhereUniqueInputSchema, 
}).strict();

export const PersonUpdateArgsSchema: z.ZodType<Prisma.PersonUpdateArgs> = z.object({
  select: PersonSelectSchema.optional(),
  include: PersonIncludeSchema.optional(),
  data: z.union([ PersonUpdateInputSchema, PersonUncheckedUpdateInputSchema ]),
  where: PersonWhereUniqueInputSchema, 
}).strict();

export const PersonUpdateManyArgsSchema: z.ZodType<Prisma.PersonUpdateManyArgs> = z.object({
  data: z.union([ PersonUpdateManyMutationInputSchema, PersonUncheckedUpdateManyInputSchema ]),
  where: PersonWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PersonUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PersonUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PersonUpdateManyMutationInputSchema, PersonUncheckedUpdateManyInputSchema ]),
  where: PersonWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PersonDeleteManyArgsSchema: z.ZodType<Prisma.PersonDeleteManyArgs> = z.object({
  where: PersonWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SessionCreateArgsSchema: z.ZodType<Prisma.SessionCreateArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  data: z.union([ SessionCreateInputSchema, SessionUncheckedCreateInputSchema ]),
}).strict();

export const SessionUpsertArgsSchema: z.ZodType<Prisma.SessionUpsertArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
  create: z.union([ SessionCreateInputSchema, SessionUncheckedCreateInputSchema ]),
  update: z.union([ SessionUpdateInputSchema, SessionUncheckedUpdateInputSchema ]),
}).strict();

export const SessionCreateManyArgsSchema: z.ZodType<Prisma.SessionCreateManyArgs> = z.object({
  data: z.union([ SessionCreateManyInputSchema, SessionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SessionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SessionCreateManyAndReturnArgs> = z.object({
  data: z.union([ SessionCreateManyInputSchema, SessionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SessionDeleteArgsSchema: z.ZodType<Prisma.SessionDeleteArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const SessionUpdateArgsSchema: z.ZodType<Prisma.SessionUpdateArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  data: z.union([ SessionUpdateInputSchema, SessionUncheckedUpdateInputSchema ]),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const SessionUpdateManyArgsSchema: z.ZodType<Prisma.SessionUpdateManyArgs> = z.object({
  data: z.union([ SessionUpdateManyMutationInputSchema, SessionUncheckedUpdateManyInputSchema ]),
  where: SessionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SessionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SessionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SessionUpdateManyMutationInputSchema, SessionUncheckedUpdateManyInputSchema ]),
  where: SessionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SessionDeleteManyArgsSchema: z.ZodType<Prisma.SessionDeleteManyArgs> = z.object({
  where: SessionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AccountCreateArgsSchema: z.ZodType<Prisma.AccountCreateArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  data: z.union([ AccountCreateInputSchema, AccountUncheckedCreateInputSchema ]),
}).strict();

export const AccountUpsertArgsSchema: z.ZodType<Prisma.AccountUpsertArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
  create: z.union([ AccountCreateInputSchema, AccountUncheckedCreateInputSchema ]),
  update: z.union([ AccountUpdateInputSchema, AccountUncheckedUpdateInputSchema ]),
}).strict();

export const AccountCreateManyArgsSchema: z.ZodType<Prisma.AccountCreateManyArgs> = z.object({
  data: z.union([ AccountCreateManyInputSchema, AccountCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AccountCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AccountCreateManyAndReturnArgs> = z.object({
  data: z.union([ AccountCreateManyInputSchema, AccountCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AccountDeleteArgsSchema: z.ZodType<Prisma.AccountDeleteArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const AccountUpdateArgsSchema: z.ZodType<Prisma.AccountUpdateArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  data: z.union([ AccountUpdateInputSchema, AccountUncheckedUpdateInputSchema ]),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const AccountUpdateManyArgsSchema: z.ZodType<Prisma.AccountUpdateManyArgs> = z.object({
  data: z.union([ AccountUpdateManyMutationInputSchema, AccountUncheckedUpdateManyInputSchema ]),
  where: AccountWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AccountUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AccountUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AccountUpdateManyMutationInputSchema, AccountUncheckedUpdateManyInputSchema ]),
  where: AccountWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AccountDeleteManyArgsSchema: z.ZodType<Prisma.AccountDeleteManyArgs> = z.object({
  where: AccountWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const VerificationCreateArgsSchema: z.ZodType<Prisma.VerificationCreateArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  data: z.union([ VerificationCreateInputSchema, VerificationUncheckedCreateInputSchema ]),
}).strict();

export const VerificationUpsertArgsSchema: z.ZodType<Prisma.VerificationUpsertArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
  create: z.union([ VerificationCreateInputSchema, VerificationUncheckedCreateInputSchema ]),
  update: z.union([ VerificationUpdateInputSchema, VerificationUncheckedUpdateInputSchema ]),
}).strict();

export const VerificationCreateManyArgsSchema: z.ZodType<Prisma.VerificationCreateManyArgs> = z.object({
  data: z.union([ VerificationCreateManyInputSchema, VerificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const VerificationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.VerificationCreateManyAndReturnArgs> = z.object({
  data: z.union([ VerificationCreateManyInputSchema, VerificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const VerificationDeleteArgsSchema: z.ZodType<Prisma.VerificationDeleteArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const VerificationUpdateArgsSchema: z.ZodType<Prisma.VerificationUpdateArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  data: z.union([ VerificationUpdateInputSchema, VerificationUncheckedUpdateInputSchema ]),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const VerificationUpdateManyArgsSchema: z.ZodType<Prisma.VerificationUpdateManyArgs> = z.object({
  data: z.union([ VerificationUpdateManyMutationInputSchema, VerificationUncheckedUpdateManyInputSchema ]),
  where: VerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const VerificationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.VerificationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ VerificationUpdateManyMutationInputSchema, VerificationUncheckedUpdateManyInputSchema ]),
  where: VerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const VerificationDeleteManyArgsSchema: z.ZodType<Prisma.VerificationDeleteManyArgs> = z.object({
  where: VerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PersonSettingsCreateArgsSchema: z.ZodType<Prisma.PersonSettingsCreateArgs> = z.object({
  select: PersonSettingsSelectSchema.optional(),
  include: PersonSettingsIncludeSchema.optional(),
  data: z.union([ PersonSettingsCreateInputSchema, PersonSettingsUncheckedCreateInputSchema ]),
}).strict();

export const PersonSettingsUpsertArgsSchema: z.ZodType<Prisma.PersonSettingsUpsertArgs> = z.object({
  select: PersonSettingsSelectSchema.optional(),
  include: PersonSettingsIncludeSchema.optional(),
  where: PersonSettingsWhereUniqueInputSchema, 
  create: z.union([ PersonSettingsCreateInputSchema, PersonSettingsUncheckedCreateInputSchema ]),
  update: z.union([ PersonSettingsUpdateInputSchema, PersonSettingsUncheckedUpdateInputSchema ]),
}).strict();

export const PersonSettingsCreateManyArgsSchema: z.ZodType<Prisma.PersonSettingsCreateManyArgs> = z.object({
  data: z.union([ PersonSettingsCreateManyInputSchema, PersonSettingsCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PersonSettingsCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PersonSettingsCreateManyAndReturnArgs> = z.object({
  data: z.union([ PersonSettingsCreateManyInputSchema, PersonSettingsCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PersonSettingsDeleteArgsSchema: z.ZodType<Prisma.PersonSettingsDeleteArgs> = z.object({
  select: PersonSettingsSelectSchema.optional(),
  include: PersonSettingsIncludeSchema.optional(),
  where: PersonSettingsWhereUniqueInputSchema, 
}).strict();

export const PersonSettingsUpdateArgsSchema: z.ZodType<Prisma.PersonSettingsUpdateArgs> = z.object({
  select: PersonSettingsSelectSchema.optional(),
  include: PersonSettingsIncludeSchema.optional(),
  data: z.union([ PersonSettingsUpdateInputSchema, PersonSettingsUncheckedUpdateInputSchema ]),
  where: PersonSettingsWhereUniqueInputSchema, 
}).strict();

export const PersonSettingsUpdateManyArgsSchema: z.ZodType<Prisma.PersonSettingsUpdateManyArgs> = z.object({
  data: z.union([ PersonSettingsUpdateManyMutationInputSchema, PersonSettingsUncheckedUpdateManyInputSchema ]),
  where: PersonSettingsWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PersonSettingsUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PersonSettingsUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PersonSettingsUpdateManyMutationInputSchema, PersonSettingsUncheckedUpdateManyInputSchema ]),
  where: PersonSettingsWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PersonSettingsDeleteManyArgsSchema: z.ZodType<Prisma.PersonSettingsDeleteManyArgs> = z.object({
  where: PersonSettingsWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventCreateArgsSchema: z.ZodType<Prisma.EventCreateArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  data: z.union([ EventCreateInputSchema, EventUncheckedCreateInputSchema ]),
}).strict();

export const EventUpsertArgsSchema: z.ZodType<Prisma.EventUpsertArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
  create: z.union([ EventCreateInputSchema, EventUncheckedCreateInputSchema ]),
  update: z.union([ EventUpdateInputSchema, EventUncheckedUpdateInputSchema ]),
}).strict();

export const EventCreateManyArgsSchema: z.ZodType<Prisma.EventCreateManyArgs> = z.object({
  data: z.union([ EventCreateManyInputSchema, EventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EventCreateManyAndReturnArgsSchema: z.ZodType<Prisma.EventCreateManyAndReturnArgs> = z.object({
  data: z.union([ EventCreateManyInputSchema, EventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EventDeleteArgsSchema: z.ZodType<Prisma.EventDeleteArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const EventUpdateArgsSchema: z.ZodType<Prisma.EventUpdateArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  data: z.union([ EventUpdateInputSchema, EventUncheckedUpdateInputSchema ]),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const EventUpdateManyArgsSchema: z.ZodType<Prisma.EventUpdateManyArgs> = z.object({
  data: z.union([ EventUpdateManyMutationInputSchema, EventUncheckedUpdateManyInputSchema ]),
  where: EventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.EventUpdateManyAndReturnArgs> = z.object({
  data: z.union([ EventUpdateManyMutationInputSchema, EventUncheckedUpdateManyInputSchema ]),
  where: EventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventDeleteManyArgsSchema: z.ZodType<Prisma.EventDeleteManyArgs> = z.object({
  where: EventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const MembershipCreateArgsSchema: z.ZodType<Prisma.MembershipCreateArgs> = z.object({
  select: MembershipSelectSchema.optional(),
  include: MembershipIncludeSchema.optional(),
  data: z.union([ MembershipCreateInputSchema, MembershipUncheckedCreateInputSchema ]),
}).strict();

export const MembershipUpsertArgsSchema: z.ZodType<Prisma.MembershipUpsertArgs> = z.object({
  select: MembershipSelectSchema.optional(),
  include: MembershipIncludeSchema.optional(),
  where: MembershipWhereUniqueInputSchema, 
  create: z.union([ MembershipCreateInputSchema, MembershipUncheckedCreateInputSchema ]),
  update: z.union([ MembershipUpdateInputSchema, MembershipUncheckedUpdateInputSchema ]),
}).strict();

export const MembershipCreateManyArgsSchema: z.ZodType<Prisma.MembershipCreateManyArgs> = z.object({
  data: z.union([ MembershipCreateManyInputSchema, MembershipCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const MembershipCreateManyAndReturnArgsSchema: z.ZodType<Prisma.MembershipCreateManyAndReturnArgs> = z.object({
  data: z.union([ MembershipCreateManyInputSchema, MembershipCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const MembershipDeleteArgsSchema: z.ZodType<Prisma.MembershipDeleteArgs> = z.object({
  select: MembershipSelectSchema.optional(),
  include: MembershipIncludeSchema.optional(),
  where: MembershipWhereUniqueInputSchema, 
}).strict();

export const MembershipUpdateArgsSchema: z.ZodType<Prisma.MembershipUpdateArgs> = z.object({
  select: MembershipSelectSchema.optional(),
  include: MembershipIncludeSchema.optional(),
  data: z.union([ MembershipUpdateInputSchema, MembershipUncheckedUpdateInputSchema ]),
  where: MembershipWhereUniqueInputSchema, 
}).strict();

export const MembershipUpdateManyArgsSchema: z.ZodType<Prisma.MembershipUpdateManyArgs> = z.object({
  data: z.union([ MembershipUpdateManyMutationInputSchema, MembershipUncheckedUpdateManyInputSchema ]),
  where: MembershipWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const MembershipUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.MembershipUpdateManyAndReturnArgs> = z.object({
  data: z.union([ MembershipUpdateManyMutationInputSchema, MembershipUncheckedUpdateManyInputSchema ]),
  where: MembershipWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const MembershipDeleteManyArgsSchema: z.ZodType<Prisma.MembershipDeleteManyArgs> = z.object({
  where: MembershipWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PotentialDateTimeCreateArgsSchema: z.ZodType<Prisma.PotentialDateTimeCreateArgs> = z.object({
  select: PotentialDateTimeSelectSchema.optional(),
  include: PotentialDateTimeIncludeSchema.optional(),
  data: z.union([ PotentialDateTimeCreateInputSchema, PotentialDateTimeUncheckedCreateInputSchema ]),
}).strict();

export const PotentialDateTimeUpsertArgsSchema: z.ZodType<Prisma.PotentialDateTimeUpsertArgs> = z.object({
  select: PotentialDateTimeSelectSchema.optional(),
  include: PotentialDateTimeIncludeSchema.optional(),
  where: PotentialDateTimeWhereUniqueInputSchema, 
  create: z.union([ PotentialDateTimeCreateInputSchema, PotentialDateTimeUncheckedCreateInputSchema ]),
  update: z.union([ PotentialDateTimeUpdateInputSchema, PotentialDateTimeUncheckedUpdateInputSchema ]),
}).strict();

export const PotentialDateTimeCreateManyArgsSchema: z.ZodType<Prisma.PotentialDateTimeCreateManyArgs> = z.object({
  data: z.union([ PotentialDateTimeCreateManyInputSchema, PotentialDateTimeCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PotentialDateTimeCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PotentialDateTimeCreateManyAndReturnArgs> = z.object({
  data: z.union([ PotentialDateTimeCreateManyInputSchema, PotentialDateTimeCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PotentialDateTimeDeleteArgsSchema: z.ZodType<Prisma.PotentialDateTimeDeleteArgs> = z.object({
  select: PotentialDateTimeSelectSchema.optional(),
  include: PotentialDateTimeIncludeSchema.optional(),
  where: PotentialDateTimeWhereUniqueInputSchema, 
}).strict();

export const PotentialDateTimeUpdateArgsSchema: z.ZodType<Prisma.PotentialDateTimeUpdateArgs> = z.object({
  select: PotentialDateTimeSelectSchema.optional(),
  include: PotentialDateTimeIncludeSchema.optional(),
  data: z.union([ PotentialDateTimeUpdateInputSchema, PotentialDateTimeUncheckedUpdateInputSchema ]),
  where: PotentialDateTimeWhereUniqueInputSchema, 
}).strict();

export const PotentialDateTimeUpdateManyArgsSchema: z.ZodType<Prisma.PotentialDateTimeUpdateManyArgs> = z.object({
  data: z.union([ PotentialDateTimeUpdateManyMutationInputSchema, PotentialDateTimeUncheckedUpdateManyInputSchema ]),
  where: PotentialDateTimeWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PotentialDateTimeUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PotentialDateTimeUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PotentialDateTimeUpdateManyMutationInputSchema, PotentialDateTimeUncheckedUpdateManyInputSchema ]),
  where: PotentialDateTimeWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PotentialDateTimeDeleteManyArgsSchema: z.ZodType<Prisma.PotentialDateTimeDeleteManyArgs> = z.object({
  where: PotentialDateTimeWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AvailabilityCreateArgsSchema: z.ZodType<Prisma.AvailabilityCreateArgs> = z.object({
  select: AvailabilitySelectSchema.optional(),
  include: AvailabilityIncludeSchema.optional(),
  data: z.union([ AvailabilityCreateInputSchema, AvailabilityUncheckedCreateInputSchema ]),
}).strict();

export const AvailabilityUpsertArgsSchema: z.ZodType<Prisma.AvailabilityUpsertArgs> = z.object({
  select: AvailabilitySelectSchema.optional(),
  include: AvailabilityIncludeSchema.optional(),
  where: AvailabilityWhereUniqueInputSchema, 
  create: z.union([ AvailabilityCreateInputSchema, AvailabilityUncheckedCreateInputSchema ]),
  update: z.union([ AvailabilityUpdateInputSchema, AvailabilityUncheckedUpdateInputSchema ]),
}).strict();

export const AvailabilityCreateManyArgsSchema: z.ZodType<Prisma.AvailabilityCreateManyArgs> = z.object({
  data: z.union([ AvailabilityCreateManyInputSchema, AvailabilityCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AvailabilityCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AvailabilityCreateManyAndReturnArgs> = z.object({
  data: z.union([ AvailabilityCreateManyInputSchema, AvailabilityCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AvailabilityDeleteArgsSchema: z.ZodType<Prisma.AvailabilityDeleteArgs> = z.object({
  select: AvailabilitySelectSchema.optional(),
  include: AvailabilityIncludeSchema.optional(),
  where: AvailabilityWhereUniqueInputSchema, 
}).strict();

export const AvailabilityUpdateArgsSchema: z.ZodType<Prisma.AvailabilityUpdateArgs> = z.object({
  select: AvailabilitySelectSchema.optional(),
  include: AvailabilityIncludeSchema.optional(),
  data: z.union([ AvailabilityUpdateInputSchema, AvailabilityUncheckedUpdateInputSchema ]),
  where: AvailabilityWhereUniqueInputSchema, 
}).strict();

export const AvailabilityUpdateManyArgsSchema: z.ZodType<Prisma.AvailabilityUpdateManyArgs> = z.object({
  data: z.union([ AvailabilityUpdateManyMutationInputSchema, AvailabilityUncheckedUpdateManyInputSchema ]),
  where: AvailabilityWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AvailabilityUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AvailabilityUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AvailabilityUpdateManyMutationInputSchema, AvailabilityUncheckedUpdateManyInputSchema ]),
  where: AvailabilityWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AvailabilityDeleteManyArgsSchema: z.ZodType<Prisma.AvailabilityDeleteManyArgs> = z.object({
  where: AvailabilityWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PostCreateArgsSchema: z.ZodType<Prisma.PostCreateArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  data: z.union([ PostCreateInputSchema, PostUncheckedCreateInputSchema ]),
}).strict();

export const PostUpsertArgsSchema: z.ZodType<Prisma.PostUpsertArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereUniqueInputSchema, 
  create: z.union([ PostCreateInputSchema, PostUncheckedCreateInputSchema ]),
  update: z.union([ PostUpdateInputSchema, PostUncheckedUpdateInputSchema ]),
}).strict();

export const PostCreateManyArgsSchema: z.ZodType<Prisma.PostCreateManyArgs> = z.object({
  data: z.union([ PostCreateManyInputSchema, PostCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PostCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PostCreateManyAndReturnArgs> = z.object({
  data: z.union([ PostCreateManyInputSchema, PostCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PostDeleteArgsSchema: z.ZodType<Prisma.PostDeleteArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereUniqueInputSchema, 
}).strict();

export const PostUpdateArgsSchema: z.ZodType<Prisma.PostUpdateArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  data: z.union([ PostUpdateInputSchema, PostUncheckedUpdateInputSchema ]),
  where: PostWhereUniqueInputSchema, 
}).strict();

export const PostUpdateManyArgsSchema: z.ZodType<Prisma.PostUpdateManyArgs> = z.object({
  data: z.union([ PostUpdateManyMutationInputSchema, PostUncheckedUpdateManyInputSchema ]),
  where: PostWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PostUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PostUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PostUpdateManyMutationInputSchema, PostUncheckedUpdateManyInputSchema ]),
  where: PostWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PostDeleteManyArgsSchema: z.ZodType<Prisma.PostDeleteManyArgs> = z.object({
  where: PostWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReplyCreateArgsSchema: z.ZodType<Prisma.ReplyCreateArgs> = z.object({
  select: ReplySelectSchema.optional(),
  include: ReplyIncludeSchema.optional(),
  data: z.union([ ReplyCreateInputSchema, ReplyUncheckedCreateInputSchema ]),
}).strict();

export const ReplyUpsertArgsSchema: z.ZodType<Prisma.ReplyUpsertArgs> = z.object({
  select: ReplySelectSchema.optional(),
  include: ReplyIncludeSchema.optional(),
  where: ReplyWhereUniqueInputSchema, 
  create: z.union([ ReplyCreateInputSchema, ReplyUncheckedCreateInputSchema ]),
  update: z.union([ ReplyUpdateInputSchema, ReplyUncheckedUpdateInputSchema ]),
}).strict();

export const ReplyCreateManyArgsSchema: z.ZodType<Prisma.ReplyCreateManyArgs> = z.object({
  data: z.union([ ReplyCreateManyInputSchema, ReplyCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ReplyCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ReplyCreateManyAndReturnArgs> = z.object({
  data: z.union([ ReplyCreateManyInputSchema, ReplyCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ReplyDeleteArgsSchema: z.ZodType<Prisma.ReplyDeleteArgs> = z.object({
  select: ReplySelectSchema.optional(),
  include: ReplyIncludeSchema.optional(),
  where: ReplyWhereUniqueInputSchema, 
}).strict();

export const ReplyUpdateArgsSchema: z.ZodType<Prisma.ReplyUpdateArgs> = z.object({
  select: ReplySelectSchema.optional(),
  include: ReplyIncludeSchema.optional(),
  data: z.union([ ReplyUpdateInputSchema, ReplyUncheckedUpdateInputSchema ]),
  where: ReplyWhereUniqueInputSchema, 
}).strict();

export const ReplyUpdateManyArgsSchema: z.ZodType<Prisma.ReplyUpdateManyArgs> = z.object({
  data: z.union([ ReplyUpdateManyMutationInputSchema, ReplyUncheckedUpdateManyInputSchema ]),
  where: ReplyWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReplyUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ReplyUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ReplyUpdateManyMutationInputSchema, ReplyUncheckedUpdateManyInputSchema ]),
  where: ReplyWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReplyDeleteManyArgsSchema: z.ZodType<Prisma.ReplyDeleteManyArgs> = z.object({
  where: ReplyWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const InviteCreateArgsSchema: z.ZodType<Prisma.InviteCreateArgs> = z.object({
  select: InviteSelectSchema.optional(),
  include: InviteIncludeSchema.optional(),
  data: z.union([ InviteCreateInputSchema, InviteUncheckedCreateInputSchema ]),
}).strict();

export const InviteUpsertArgsSchema: z.ZodType<Prisma.InviteUpsertArgs> = z.object({
  select: InviteSelectSchema.optional(),
  include: InviteIncludeSchema.optional(),
  where: InviteWhereUniqueInputSchema, 
  create: z.union([ InviteCreateInputSchema, InviteUncheckedCreateInputSchema ]),
  update: z.union([ InviteUpdateInputSchema, InviteUncheckedUpdateInputSchema ]),
}).strict();

export const InviteCreateManyArgsSchema: z.ZodType<Prisma.InviteCreateManyArgs> = z.object({
  data: z.union([ InviteCreateManyInputSchema, InviteCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const InviteCreateManyAndReturnArgsSchema: z.ZodType<Prisma.InviteCreateManyAndReturnArgs> = z.object({
  data: z.union([ InviteCreateManyInputSchema, InviteCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const InviteDeleteArgsSchema: z.ZodType<Prisma.InviteDeleteArgs> = z.object({
  select: InviteSelectSchema.optional(),
  include: InviteIncludeSchema.optional(),
  where: InviteWhereUniqueInputSchema, 
}).strict();

export const InviteUpdateArgsSchema: z.ZodType<Prisma.InviteUpdateArgs> = z.object({
  select: InviteSelectSchema.optional(),
  include: InviteIncludeSchema.optional(),
  data: z.union([ InviteUpdateInputSchema, InviteUncheckedUpdateInputSchema ]),
  where: InviteWhereUniqueInputSchema, 
}).strict();

export const InviteUpdateManyArgsSchema: z.ZodType<Prisma.InviteUpdateManyArgs> = z.object({
  data: z.union([ InviteUpdateManyMutationInputSchema, InviteUncheckedUpdateManyInputSchema ]),
  where: InviteWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const InviteUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.InviteUpdateManyAndReturnArgs> = z.object({
  data: z.union([ InviteUpdateManyMutationInputSchema, InviteUncheckedUpdateManyInputSchema ]),
  where: InviteWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const InviteDeleteManyArgsSchema: z.ZodType<Prisma.InviteDeleteManyArgs> = z.object({
  where: InviteWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationCreateArgsSchema: z.ZodType<Prisma.NotificationCreateArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  data: z.union([ NotificationCreateInputSchema, NotificationUncheckedCreateInputSchema ]),
}).strict();

export const NotificationUpsertArgsSchema: z.ZodType<Prisma.NotificationUpsertArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereUniqueInputSchema, 
  create: z.union([ NotificationCreateInputSchema, NotificationUncheckedCreateInputSchema ]),
  update: z.union([ NotificationUpdateInputSchema, NotificationUncheckedUpdateInputSchema ]),
}).strict();

export const NotificationCreateManyArgsSchema: z.ZodType<Prisma.NotificationCreateManyArgs> = z.object({
  data: z.union([ NotificationCreateManyInputSchema, NotificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const NotificationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationCreateManyAndReturnArgs> = z.object({
  data: z.union([ NotificationCreateManyInputSchema, NotificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const NotificationDeleteArgsSchema: z.ZodType<Prisma.NotificationDeleteArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereUniqueInputSchema, 
}).strict();

export const NotificationUpdateArgsSchema: z.ZodType<Prisma.NotificationUpdateArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  data: z.union([ NotificationUpdateInputSchema, NotificationUncheckedUpdateInputSchema ]),
  where: NotificationWhereUniqueInputSchema, 
}).strict();

export const NotificationUpdateManyArgsSchema: z.ZodType<Prisma.NotificationUpdateManyArgs> = z.object({
  data: z.union([ NotificationUpdateManyMutationInputSchema, NotificationUncheckedUpdateManyInputSchema ]),
  where: NotificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ NotificationUpdateManyMutationInputSchema, NotificationUncheckedUpdateManyInputSchema ]),
  where: NotificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationDeleteManyArgsSchema: z.ZodType<Prisma.NotificationDeleteManyArgs> = z.object({
  where: NotificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationMethodCreateArgsSchema: z.ZodType<Prisma.NotificationMethodCreateArgs> = z.object({
  select: NotificationMethodSelectSchema.optional(),
  include: NotificationMethodIncludeSchema.optional(),
  data: z.union([ NotificationMethodCreateInputSchema, NotificationMethodUncheckedCreateInputSchema ]),
}).strict();

export const NotificationMethodUpsertArgsSchema: z.ZodType<Prisma.NotificationMethodUpsertArgs> = z.object({
  select: NotificationMethodSelectSchema.optional(),
  include: NotificationMethodIncludeSchema.optional(),
  where: NotificationMethodWhereUniqueInputSchema, 
  create: z.union([ NotificationMethodCreateInputSchema, NotificationMethodUncheckedCreateInputSchema ]),
  update: z.union([ NotificationMethodUpdateInputSchema, NotificationMethodUncheckedUpdateInputSchema ]),
}).strict();

export const NotificationMethodCreateManyArgsSchema: z.ZodType<Prisma.NotificationMethodCreateManyArgs> = z.object({
  data: z.union([ NotificationMethodCreateManyInputSchema, NotificationMethodCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const NotificationMethodCreateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationMethodCreateManyAndReturnArgs> = z.object({
  data: z.union([ NotificationMethodCreateManyInputSchema, NotificationMethodCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const NotificationMethodDeleteArgsSchema: z.ZodType<Prisma.NotificationMethodDeleteArgs> = z.object({
  select: NotificationMethodSelectSchema.optional(),
  include: NotificationMethodIncludeSchema.optional(),
  where: NotificationMethodWhereUniqueInputSchema, 
}).strict();

export const NotificationMethodUpdateArgsSchema: z.ZodType<Prisma.NotificationMethodUpdateArgs> = z.object({
  select: NotificationMethodSelectSchema.optional(),
  include: NotificationMethodIncludeSchema.optional(),
  data: z.union([ NotificationMethodUpdateInputSchema, NotificationMethodUncheckedUpdateInputSchema ]),
  where: NotificationMethodWhereUniqueInputSchema, 
}).strict();

export const NotificationMethodUpdateManyArgsSchema: z.ZodType<Prisma.NotificationMethodUpdateManyArgs> = z.object({
  data: z.union([ NotificationMethodUpdateManyMutationInputSchema, NotificationMethodUncheckedUpdateManyInputSchema ]),
  where: NotificationMethodWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationMethodUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationMethodUpdateManyAndReturnArgs> = z.object({
  data: z.union([ NotificationMethodUpdateManyMutationInputSchema, NotificationMethodUncheckedUpdateManyInputSchema ]),
  where: NotificationMethodWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationMethodDeleteManyArgsSchema: z.ZodType<Prisma.NotificationMethodDeleteManyArgs> = z.object({
  where: NotificationMethodWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationSettingCreateArgsSchema: z.ZodType<Prisma.NotificationSettingCreateArgs> = z.object({
  select: NotificationSettingSelectSchema.optional(),
  include: NotificationSettingIncludeSchema.optional(),
  data: z.union([ NotificationSettingCreateInputSchema, NotificationSettingUncheckedCreateInputSchema ]),
}).strict();

export const NotificationSettingUpsertArgsSchema: z.ZodType<Prisma.NotificationSettingUpsertArgs> = z.object({
  select: NotificationSettingSelectSchema.optional(),
  include: NotificationSettingIncludeSchema.optional(),
  where: NotificationSettingWhereUniqueInputSchema, 
  create: z.union([ NotificationSettingCreateInputSchema, NotificationSettingUncheckedCreateInputSchema ]),
  update: z.union([ NotificationSettingUpdateInputSchema, NotificationSettingUncheckedUpdateInputSchema ]),
}).strict();

export const NotificationSettingCreateManyArgsSchema: z.ZodType<Prisma.NotificationSettingCreateManyArgs> = z.object({
  data: z.union([ NotificationSettingCreateManyInputSchema, NotificationSettingCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const NotificationSettingCreateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationSettingCreateManyAndReturnArgs> = z.object({
  data: z.union([ NotificationSettingCreateManyInputSchema, NotificationSettingCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const NotificationSettingDeleteArgsSchema: z.ZodType<Prisma.NotificationSettingDeleteArgs> = z.object({
  select: NotificationSettingSelectSchema.optional(),
  include: NotificationSettingIncludeSchema.optional(),
  where: NotificationSettingWhereUniqueInputSchema, 
}).strict();

export const NotificationSettingUpdateArgsSchema: z.ZodType<Prisma.NotificationSettingUpdateArgs> = z.object({
  select: NotificationSettingSelectSchema.optional(),
  include: NotificationSettingIncludeSchema.optional(),
  data: z.union([ NotificationSettingUpdateInputSchema, NotificationSettingUncheckedUpdateInputSchema ]),
  where: NotificationSettingWhereUniqueInputSchema, 
}).strict();

export const NotificationSettingUpdateManyArgsSchema: z.ZodType<Prisma.NotificationSettingUpdateManyArgs> = z.object({
  data: z.union([ NotificationSettingUpdateManyMutationInputSchema, NotificationSettingUncheckedUpdateManyInputSchema ]),
  where: NotificationSettingWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationSettingUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationSettingUpdateManyAndReturnArgs> = z.object({
  data: z.union([ NotificationSettingUpdateManyMutationInputSchema, NotificationSettingUncheckedUpdateManyInputSchema ]),
  where: NotificationSettingWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationSettingDeleteManyArgsSchema: z.ZodType<Prisma.NotificationSettingDeleteManyArgs> = z.object({
  where: NotificationSettingWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();