

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";








ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."NotificationMethodType" AS ENUM (
    'EMAIL',
    'PUSH',
    'WEBHOOK'
);


ALTER TYPE "public"."NotificationMethodType" OWNER TO "postgres";


CREATE TYPE "public"."NotificationType" AS ENUM (
    'NEW_POST',
    'NEW_REPLY',
    'DATE_CHOSEN',
    'DATE_CHANGED',
    'DATE_RESET',
    'USER_JOINED',
    'USER_LEFT',
    'USER_PROMOTED',
    'USER_DEMOTED',
    'EVENT_EDITED',
    'USER_RSVP'
);


ALTER TYPE "public"."NotificationType" OWNER TO "postgres";


CREATE TYPE "public"."Role" AS ENUM (
    'ORGANIZER',
    'MODERATOR',
    'ATTENDEE'
);


ALTER TYPE "public"."Role" OWNER TO "postgres";


CREATE TYPE "public"."Status" AS ENUM (
    'YES',
    'MAYBE',
    'NO',
    'PENDING'
);


ALTER TYPE "public"."Status" OWNER TO "postgres";


CREATE TYPE "public"."WebhookFormat" AS ENUM (
    'DISCORD',
    'SLACK',
    'TEAMS',
    'GENERIC',
    'CUSTOM'
);


ALTER TYPE "public"."WebhookFormat" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Availability" (
    "membershipId" "text" NOT NULL,
    "potentialDateTimeId" "text" NOT NULL,
    "status" "public"."Status" NOT NULL
);


ALTER TABLE "public"."Availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Event" (
    "id" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "location" "text" DEFAULT ''::"text" NOT NULL,
    "chosenDateTime" timestamp(3) without time zone
);


ALTER TABLE "public"."Event" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Invite" (
    "id" "text" NOT NULL,
    "eventId" "text" NOT NULL,
    "createdById" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "usesRemaining" integer,
    "maxUses" integer,
    "name" "text"
);


ALTER TABLE "public"."Invite" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Membership" (
    "id" "text" NOT NULL,
    "personId" "text" NOT NULL,
    "eventId" "text" NOT NULL,
    "role" "public"."Role" DEFAULT 'ATTENDEE'::"public"."Role" NOT NULL,
    "rsvpStatus" "public"."Status" DEFAULT 'PENDING'::"public"."Status" NOT NULL
);


ALTER TABLE "public"."Membership" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Notification" (
    "id" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "personId" "text" NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "eventId" "text",
    "postId" "text",
    "read" boolean DEFAULT false NOT NULL,
    "datetime" timestamp(3) without time zone,
    "authorId" "text",
    "rsvp" "public"."Status"
);


ALTER TABLE "public"."Notification" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."NotificationMethod" (
    "id" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "settingsId" "text" NOT NULL,
    "type" "public"."NotificationMethodType" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "name" "text",
    "value" "text" NOT NULL,
    "customTemplate" "text",
    "webhookFormat" "public"."WebhookFormat",
    "webhookHeaders" "jsonb"
);


ALTER TABLE "public"."NotificationMethod" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."NotificationSetting" (
    "id" "text" NOT NULL,
    "notificationType" "public"."NotificationType" NOT NULL,
    "methodId" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."NotificationSetting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Person" (
    "id" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "firstName" "text",
    "lastName" "text",
    "username" "text" NOT NULL,
    "imageUrl" "text" NOT NULL
);


ALTER TABLE "public"."Person" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PersonSettings" (
    "id" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "personId" "text" NOT NULL
);


ALTER TABLE "public"."PersonSettings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Post" (
    "id" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "editedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "authorId" "text" NOT NULL,
    "eventId" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL
);


ALTER TABLE "public"."Post" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PotentialDateTime" (
    "id" "text" NOT NULL,
    "eventId" "text" NOT NULL,
    "dateTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."PotentialDateTime" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Reply" (
    "id" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "authorId" "text" NOT NULL,
    "postId" "text" NOT NULL,
    "text" "text" NOT NULL
);


ALTER TABLE "public"."Reply" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Availability"
    ADD CONSTRAINT "Availability_pkey" PRIMARY KEY ("membershipId", "potentialDateTimeId");



ALTER TABLE ONLY "public"."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Invite"
    ADD CONSTRAINT "Invite_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Membership"
    ADD CONSTRAINT "Membership_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."NotificationMethod"
    ADD CONSTRAINT "NotificationMethod_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."NotificationSetting"
    ADD CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PersonSettings"
    ADD CONSTRAINT "PersonSettings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Person"
    ADD CONSTRAINT "Person_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PotentialDateTime"
    ADD CONSTRAINT "PotentialDateTime_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Reply"
    ADD CONSTRAINT "Reply_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "NotificationSetting_notificationType_methodId_key" ON "public"."NotificationSetting" USING "btree" ("notificationType", "methodId");



CREATE UNIQUE INDEX "PersonSettings_personId_key" ON "public"."PersonSettings" USING "btree" ("personId");



CREATE UNIQUE INDEX "Person_username_key" ON "public"."Person" USING "btree" ("username");



ALTER TABLE ONLY "public"."Availability"
    ADD CONSTRAINT "Availability_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."Membership"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Availability"
    ADD CONSTRAINT "Availability_potentialDateTimeId_fkey" FOREIGN KEY ("potentialDateTimeId") REFERENCES "public"."PotentialDateTime"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Invite"
    ADD CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Membership"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Invite"
    ADD CONSTRAINT "Invite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Membership"
    ADD CONSTRAINT "Membership_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Membership"
    ADD CONSTRAINT "Membership_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."Person"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."NotificationMethod"
    ADD CONSTRAINT "NotificationMethod_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "public"."PersonSettings"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."NotificationSetting"
    ADD CONSTRAINT "NotificationSetting_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "public"."NotificationMethod"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Notification"
    ADD CONSTRAINT "Notification_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."Person"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Notification"
    ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Notification"
    ADD CONSTRAINT "Notification_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."Person"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Notification"
    ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PersonSettings"
    ADD CONSTRAINT "PersonSettings_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."Person"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."Person"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PotentialDateTime"
    ADD CONSTRAINT "PotentialDateTime_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Reply"
    ADD CONSTRAINT "Reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."Person"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Reply"
    ADD CONSTRAINT "Reply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON UPDATE CASCADE ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;










































































































































































































































