/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts_mutations from "../accounts/mutations.js";
import type * as accounts_queries from "../accounts/queries.js";
import type * as addonTemplates_mutations from "../addonTemplates/mutations.js";
import type * as addonTemplates_queries from "../addonTemplates/queries.js";
import type * as addons_automations_conditions from "../addons/automations/conditions.js";
import type * as addons_automations_dispatch from "../addons/automations/dispatch.js";
import type * as addons_automations_engine from "../addons/automations/engine.js";
import type * as addons_automations_internalActions from "../addons/automations/internalActions.js";
import type * as addons_automations_internalMutations from "../addons/automations/internalMutations.js";
import type * as addons_automations_resolve from "../addons/automations/resolve.js";
import type * as addons_automations_types from "../addons/automations/types.js";
import type * as addons_context from "../addons/context.js";
import type * as addons_define from "../addons/define.js";
import type * as addons_handlers_bringList from "../addons/handlers/bringList.js";
import type * as addons_handlers_custom from "../addons/handlers/custom.js";
import type * as addons_handlers_discord from "../addons/handlers/discord.js";
import type * as addons_handlers_questionnaire from "../addons/handlers/questionnaire.js";
import type * as addons_handlers_reminders from "../addons/handlers/reminders.js";
import type * as addons_lifecycle from "../addons/lifecycle.js";
import type * as addons_mutations from "../addons/mutations.js";
import type * as addons_queries from "../addons/queries.js";
import type * as addons_registry from "../addons/registry.js";
import type * as addons_types from "../addons/types.js";
import type * as admin_explorerQueries from "../admin/explorerQueries.js";
import type * as admin_mutations from "../admin/mutations.js";
import type * as admin_queries from "../admin/queries.js";
import type * as admin_queryBuilder from "../admin/queryBuilder.js";
import type * as ai_actions from "../ai/actions.js";
import type * as api_v1_index from "../api/v1/index.js";
import type * as api_v1_internal_addons from "../api/v1/internal/addons.js";
import type * as api_v1_internal_admin from "../api/v1/internal/admin.js";
import type * as api_v1_internal_auth from "../api/v1/internal/auth.js";
import type * as api_v1_internal_availability from "../api/v1/internal/availability.js";
import type * as api_v1_internal_events from "../api/v1/internal/events.js";
import type * as api_v1_internal_friends from "../api/v1/internal/friends.js";
import type * as api_v1_internal_invites from "../api/v1/internal/invites.js";
import type * as api_v1_internal_members from "../api/v1/internal/members.js";
import type * as api_v1_internal_muting from "../api/v1/internal/muting.js";
import type * as api_v1_internal_notifications from "../api/v1/internal/notifications.js";
import type * as api_v1_internal_posts from "../api/v1/internal/posts.js";
import type * as api_v1_internal_profile from "../api/v1/internal/profile.js";
import type * as api_v1_internal_replies from "../api/v1/internal/replies.js";
import type * as api_v1_internal_reports from "../api/v1/internal/reports.js";
import type * as api_v1_internal_settings from "../api/v1/internal/settings.js";
import type * as api_v1_internal_themes from "../api/v1/internal/themes.js";
import type * as api_v1_middleware_auth from "../api/v1/middleware/auth.js";
import type * as api_v1_routes_addons from "../api/v1/routes/addons.js";
import type * as api_v1_routes_admin from "../api/v1/routes/admin.js";
import type * as api_v1_routes_availability from "../api/v1/routes/availability.js";
import type * as api_v1_routes_events from "../api/v1/routes/events.js";
import type * as api_v1_routes_friends from "../api/v1/routes/friends.js";
import type * as api_v1_routes_invites from "../api/v1/routes/invites.js";
import type * as api_v1_routes_members from "../api/v1/routes/members.js";
import type * as api_v1_routes_muting from "../api/v1/routes/muting.js";
import type * as api_v1_routes_notifications from "../api/v1/routes/notifications.js";
import type * as api_v1_routes_posts from "../api/v1/routes/posts.js";
import type * as api_v1_routes_profile from "../api/v1/routes/profile.js";
import type * as api_v1_routes_replies from "../api/v1/routes/replies.js";
import type * as api_v1_routes_reports from "../api/v1/routes/reports.js";
import type * as api_v1_routes_settings from "../api/v1/routes/settings.js";
import type * as api_v1_routes_themes from "../api/v1/routes/themes.js";
import type * as api_v1_schemas_addons from "../api/v1/schemas/addons.js";
import type * as api_v1_schemas_admin from "../api/v1/schemas/admin.js";
import type * as api_v1_schemas_availability from "../api/v1/schemas/availability.js";
import type * as api_v1_schemas_common from "../api/v1/schemas/common.js";
import type * as api_v1_schemas_events from "../api/v1/schemas/events.js";
import type * as api_v1_schemas_friends from "../api/v1/schemas/friends.js";
import type * as api_v1_schemas_invites from "../api/v1/schemas/invites.js";
import type * as api_v1_schemas_members from "../api/v1/schemas/members.js";
import type * as api_v1_schemas_muting from "../api/v1/schemas/muting.js";
import type * as api_v1_schemas_notifications from "../api/v1/schemas/notifications.js";
import type * as api_v1_schemas_posts from "../api/v1/schemas/posts.js";
import type * as api_v1_schemas_profile from "../api/v1/schemas/profile.js";
import type * as api_v1_schemas_replies from "../api/v1/schemas/replies.js";
import type * as api_v1_schemas_reports from "../api/v1/schemas/reports.js";
import type * as api_v1_schemas_settings from "../api/v1/schemas/settings.js";
import type * as api_v1_schemas_themes from "../api/v1/schemas/themes.js";
import type * as attachments_mutations from "../attachments/mutations.js";
import type * as attachments_queries from "../attachments/queries.js";
import type * as auth from "../auth.js";
import type * as auth_queries from "../auth/queries.js";
import type * as availability_mutations from "../availability/mutations.js";
import type * as availability_queries from "../availability/queries.js";
import type * as convex__generated_api from "../convex/_generated/api.js";
import type * as convex__generated_server from "../convex/_generated/server.js";
import type * as discord_actions from "../discord/actions.js";
import type * as discord_mutations from "../discord/mutations.js";
import type * as discord_queries from "../discord/queries.js";
import type * as e2e_mutations from "../e2e/mutations.js";
import type * as email from "../email.js";
import type * as emails_mutations from "../emails/mutations.js";
import type * as emails_queries from "../emails/queries.js";
import type * as eventInvites_mutations from "../eventInvites/mutations.js";
import type * as eventInvites_queries from "../eventInvites/queries.js";
import type * as events_mutations from "../events/mutations.js";
import type * as events_queries from "../events/queries.js";
import type * as files_mutations from "../files/mutations.js";
import type * as files_queries from "../files/queries.js";
import type * as friends_mutations from "../friends/mutations.js";
import type * as friends_queries from "../friends/queries.js";
import type * as http from "../http.js";
import type * as invites_actions from "../invites/actions.js";
import type * as invites_mutations from "../invites/mutations.js";
import type * as invites_queries from "../invites/queries.js";
import type * as lib_cascade from "../lib/cascade.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_memberCount from "../lib/memberCount.js";
import type * as lib_notifications from "../lib/notifications.js";
import type * as lib_privacy from "../lib/privacy.js";
import type * as migration_actions from "../migration/actions.js";
import type * as migration_backfillMemberCount from "../migration/backfillMemberCount.js";
import type * as migration_claim from "../migration/claim.js";
import type * as migration_index from "../migration/index.js";
import type * as migration_mutations from "../migration/mutations.js";
import type * as migration_uploadAndMigrate from "../migration/uploadAndMigrate.js";
import type * as muting_mutations from "../muting/mutations.js";
import type * as muting_queries from "../muting/queries.js";
import type * as notifications_actions from "../notifications/actions.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as posts_mutations from "../posts/mutations.js";
import type * as posts_queries from "../posts/queries.js";
import type * as presence from "../presence.js";
import type * as reminderOptOuts_mutations from "../reminderOptOuts/mutations.js";
import type * as reminderOptOuts_queries from "../reminderOptOuts/queries.js";
import type * as reminders_index from "../reminders/index.js";
import type * as reminders_mutations from "../reminders/mutations.js";
import type * as replies_mutations from "../replies/mutations.js";
import type * as replies_queries from "../replies/queries.js";
import type * as reports_adminMutations from "../reports/adminMutations.js";
import type * as reports_mutations from "../reports/mutations.js";
import type * as reports_queries from "../reports/queries.js";
import type * as settings_mutations from "../settings/mutations.js";
import type * as settings_queries from "../settings/queries.js";
import type * as tests_test_helpers from "../tests/test_helpers.js";
import type * as themes_mutations from "../themes/mutations.js";
import type * as themes_queries from "../themes/queries.js";
import type * as types from "../types.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "accounts/mutations": typeof accounts_mutations;
  "accounts/queries": typeof accounts_queries;
  "addonTemplates/mutations": typeof addonTemplates_mutations;
  "addonTemplates/queries": typeof addonTemplates_queries;
  "addons/automations/conditions": typeof addons_automations_conditions;
  "addons/automations/dispatch": typeof addons_automations_dispatch;
  "addons/automations/engine": typeof addons_automations_engine;
  "addons/automations/internalActions": typeof addons_automations_internalActions;
  "addons/automations/internalMutations": typeof addons_automations_internalMutations;
  "addons/automations/resolve": typeof addons_automations_resolve;
  "addons/automations/types": typeof addons_automations_types;
  "addons/context": typeof addons_context;
  "addons/define": typeof addons_define;
  "addons/handlers/bringList": typeof addons_handlers_bringList;
  "addons/handlers/custom": typeof addons_handlers_custom;
  "addons/handlers/discord": typeof addons_handlers_discord;
  "addons/handlers/questionnaire": typeof addons_handlers_questionnaire;
  "addons/handlers/reminders": typeof addons_handlers_reminders;
  "addons/lifecycle": typeof addons_lifecycle;
  "addons/mutations": typeof addons_mutations;
  "addons/queries": typeof addons_queries;
  "addons/registry": typeof addons_registry;
  "addons/types": typeof addons_types;
  "admin/explorerQueries": typeof admin_explorerQueries;
  "admin/mutations": typeof admin_mutations;
  "admin/queries": typeof admin_queries;
  "admin/queryBuilder": typeof admin_queryBuilder;
  "ai/actions": typeof ai_actions;
  "api/v1/index": typeof api_v1_index;
  "api/v1/internal/addons": typeof api_v1_internal_addons;
  "api/v1/internal/admin": typeof api_v1_internal_admin;
  "api/v1/internal/auth": typeof api_v1_internal_auth;
  "api/v1/internal/availability": typeof api_v1_internal_availability;
  "api/v1/internal/events": typeof api_v1_internal_events;
  "api/v1/internal/friends": typeof api_v1_internal_friends;
  "api/v1/internal/invites": typeof api_v1_internal_invites;
  "api/v1/internal/members": typeof api_v1_internal_members;
  "api/v1/internal/muting": typeof api_v1_internal_muting;
  "api/v1/internal/notifications": typeof api_v1_internal_notifications;
  "api/v1/internal/posts": typeof api_v1_internal_posts;
  "api/v1/internal/profile": typeof api_v1_internal_profile;
  "api/v1/internal/replies": typeof api_v1_internal_replies;
  "api/v1/internal/reports": typeof api_v1_internal_reports;
  "api/v1/internal/settings": typeof api_v1_internal_settings;
  "api/v1/internal/themes": typeof api_v1_internal_themes;
  "api/v1/middleware/auth": typeof api_v1_middleware_auth;
  "api/v1/routes/addons": typeof api_v1_routes_addons;
  "api/v1/routes/admin": typeof api_v1_routes_admin;
  "api/v1/routes/availability": typeof api_v1_routes_availability;
  "api/v1/routes/events": typeof api_v1_routes_events;
  "api/v1/routes/friends": typeof api_v1_routes_friends;
  "api/v1/routes/invites": typeof api_v1_routes_invites;
  "api/v1/routes/members": typeof api_v1_routes_members;
  "api/v1/routes/muting": typeof api_v1_routes_muting;
  "api/v1/routes/notifications": typeof api_v1_routes_notifications;
  "api/v1/routes/posts": typeof api_v1_routes_posts;
  "api/v1/routes/profile": typeof api_v1_routes_profile;
  "api/v1/routes/replies": typeof api_v1_routes_replies;
  "api/v1/routes/reports": typeof api_v1_routes_reports;
  "api/v1/routes/settings": typeof api_v1_routes_settings;
  "api/v1/routes/themes": typeof api_v1_routes_themes;
  "api/v1/schemas/addons": typeof api_v1_schemas_addons;
  "api/v1/schemas/admin": typeof api_v1_schemas_admin;
  "api/v1/schemas/availability": typeof api_v1_schemas_availability;
  "api/v1/schemas/common": typeof api_v1_schemas_common;
  "api/v1/schemas/events": typeof api_v1_schemas_events;
  "api/v1/schemas/friends": typeof api_v1_schemas_friends;
  "api/v1/schemas/invites": typeof api_v1_schemas_invites;
  "api/v1/schemas/members": typeof api_v1_schemas_members;
  "api/v1/schemas/muting": typeof api_v1_schemas_muting;
  "api/v1/schemas/notifications": typeof api_v1_schemas_notifications;
  "api/v1/schemas/posts": typeof api_v1_schemas_posts;
  "api/v1/schemas/profile": typeof api_v1_schemas_profile;
  "api/v1/schemas/replies": typeof api_v1_schemas_replies;
  "api/v1/schemas/reports": typeof api_v1_schemas_reports;
  "api/v1/schemas/settings": typeof api_v1_schemas_settings;
  "api/v1/schemas/themes": typeof api_v1_schemas_themes;
  "attachments/mutations": typeof attachments_mutations;
  "attachments/queries": typeof attachments_queries;
  auth: typeof auth;
  "auth/queries": typeof auth_queries;
  "availability/mutations": typeof availability_mutations;
  "availability/queries": typeof availability_queries;
  "convex/_generated/api": typeof convex__generated_api;
  "convex/_generated/server": typeof convex__generated_server;
  "discord/actions": typeof discord_actions;
  "discord/mutations": typeof discord_mutations;
  "discord/queries": typeof discord_queries;
  "e2e/mutations": typeof e2e_mutations;
  email: typeof email;
  "emails/mutations": typeof emails_mutations;
  "emails/queries": typeof emails_queries;
  "eventInvites/mutations": typeof eventInvites_mutations;
  "eventInvites/queries": typeof eventInvites_queries;
  "events/mutations": typeof events_mutations;
  "events/queries": typeof events_queries;
  "files/mutations": typeof files_mutations;
  "files/queries": typeof files_queries;
  "friends/mutations": typeof friends_mutations;
  "friends/queries": typeof friends_queries;
  http: typeof http;
  "invites/actions": typeof invites_actions;
  "invites/mutations": typeof invites_mutations;
  "invites/queries": typeof invites_queries;
  "lib/cascade": typeof lib_cascade;
  "lib/constants": typeof lib_constants;
  "lib/memberCount": typeof lib_memberCount;
  "lib/notifications": typeof lib_notifications;
  "lib/privacy": typeof lib_privacy;
  "migration/actions": typeof migration_actions;
  "migration/backfillMemberCount": typeof migration_backfillMemberCount;
  "migration/claim": typeof migration_claim;
  "migration/index": typeof migration_index;
  "migration/mutations": typeof migration_mutations;
  "migration/uploadAndMigrate": typeof migration_uploadAndMigrate;
  "muting/mutations": typeof muting_mutations;
  "muting/queries": typeof muting_queries;
  "notifications/actions": typeof notifications_actions;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "posts/mutations": typeof posts_mutations;
  "posts/queries": typeof posts_queries;
  presence: typeof presence;
  "reminderOptOuts/mutations": typeof reminderOptOuts_mutations;
  "reminderOptOuts/queries": typeof reminderOptOuts_queries;
  "reminders/index": typeof reminders_index;
  "reminders/mutations": typeof reminders_mutations;
  "replies/mutations": typeof replies_mutations;
  "replies/queries": typeof replies_queries;
  "reports/adminMutations": typeof reports_adminMutations;
  "reports/mutations": typeof reports_mutations;
  "reports/queries": typeof reports_queries;
  "settings/mutations": typeof settings_mutations;
  "settings/queries": typeof settings_queries;
  "tests/test_helpers": typeof tests_test_helpers;
  "themes/mutations": typeof themes_mutations;
  "themes/queries": typeof themes_queries;
  types: typeof types;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
