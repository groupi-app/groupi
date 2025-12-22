-- Minimal seed matching Prisma schema for local development
-- Safe to re-run; uses ON CONFLICT to avoid duplicates

-- Users (must be created first - Person references User)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    INSERT INTO public."User" (id, name, email, "emailVerified", username, "displayUsername", image, "createdAt", "updatedAt")
    VALUES
      ('person_alice', 'Alice Anderson', 'alice@example.com', true, 'alice', 'alice', 'https://picsum.photos/seed/alice/200', now(), now()),
      ('person_bob',   'Bob Baker',      'bob@example.com',   true, 'bob',   'bob',   'https://picsum.photos/seed/bob/200',   now(), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Persons (references User - must be created after User)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Person') THEN
    INSERT INTO public."Person" (id, "createdAt", "updatedAt")
    VALUES
      ('person_alice', now(), now()),
      ('person_bob',   now(), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Events (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Event') THEN
    INSERT INTO public."Event" (id, "createdAt", "updatedAt", title, description, location, "chosenDateTime")
    VALUES
      ('event_demo', now(), now(), 'Groupi Demo Event', 'Local dev event', 'Online', NULL)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Memberships (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Membership') THEN
    INSERT INTO public."Membership" (id, "personId", "eventId", role, "rsvpStatus")
    VALUES
      ('m_alice_demo', 'person_alice', 'event_demo', 'ORGANIZER', 'PENDING'),
      ('m_bob_demo',   'person_bob',   'event_demo', 'ATTENDEE',  'PENDING')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- PotentialDateTime (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PotentialDateTime') THEN
    INSERT INTO public."PotentialDateTime" (id, "eventId", "dateTime")
    VALUES
      ('pdt_demo_1', 'event_demo', now() + interval '2 days'),
      ('pdt_demo_2', 'event_demo', now() + interval '3 days')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Availability (one each, only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Availability') THEN
    INSERT INTO public."Availability" ("membershipId", "potentialDateTimeId", status)
    VALUES
      ('m_alice_demo', 'pdt_demo_1', 'YES')
    ON CONFLICT ("membershipId", "potentialDateTimeId") DO NOTHING;
  END IF;
END $$;

-- PersonSettings (one per user, only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PersonSettings') THEN
    INSERT INTO public."PersonSettings" (id, "createdAt", "updatedAt", "personId")
    VALUES
      ('ps_alice', now(), now(), 'person_alice'),
      ('ps_bob',   now(), now(), 'person_bob')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- NotificationMethod (sample email for Alice)
-- Only insert if table exists (Prisma migrations may not have run yet)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'NotificationMethod') THEN
    INSERT INTO public."NotificationMethod" (id, "createdAt", "updatedAt", "settingsId", type, enabled, name, value, "webhookHeaders", "customTemplate", "webhookFormat")
    VALUES
      ('nm_alice_email', now(), now(), 'ps_alice', 'EMAIL', true, 'Work Email', 'alice@example.com', NULL, NULL, NULL)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- NotificationSetting (enable NEW_POST via email)
-- Only insert if table exists (Prisma migrations may not have run yet)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'NotificationSetting') THEN
    INSERT INTO public."NotificationSetting" (id, "notificationType", "methodId", enabled)
    VALUES
      ('ns_alice_email_new_post', 'NEW_POST', 'nm_alice_email', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Posts (empty by default)
-- Replies (empty by default)
-- Invites (empty by default)
-- Notifications (empty by default)
