-- Minimal seed matching Prisma schema for local development
-- Safe to re-run; uses ON CONFLICT to avoid duplicates

-- Persons
INSERT INTO public."Person" (id, "createdAt", "updatedAt", "firstName", "lastName", username, "imageUrl")
VALUES
  ('person_alice', now(), now(), 'Alice', 'Anderson', 'alice', 'https://picsum.photos/seed/alice/200'),
  ('person_bob',   now(), now(), 'Bob',   'Baker',    'bob',   'https://picsum.photos/seed/bob/200')
ON CONFLICT (id) DO NOTHING;

-- Events
INSERT INTO public."Event" (id, "createdAt", "updatedAt", title, description, location, "chosenDateTime")
VALUES
  ('event_demo', now(), now(), 'Groupi Demo Event', 'Local dev event', 'Online', NULL)
ON CONFLICT (id) DO NOTHING;

-- Memberships
INSERT INTO public."Membership" (id, "personId", "eventId", role, "rsvpStatus")
VALUES
  ('m_alice_demo', 'person_alice', 'event_demo', 'ORGANIZER', 'PENDING'),
  ('m_bob_demo',   'person_bob',   'event_demo', 'ATTENDEE',  'PENDING')
ON CONFLICT (id) DO NOTHING;

-- PotentialDateTime
INSERT INTO public."PotentialDateTime" (id, "eventId", "dateTime")
VALUES
  ('pdt_demo_1', 'event_demo', now() + interval '2 days'),
  ('pdt_demo_2', 'event_demo', now() + interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- Availability (one each)
INSERT INTO public."Availability" ("membershipId", "potentialDateTimeId", status)
VALUES
  ('m_alice_demo', 'pdt_demo_1', 'YES')
ON CONFLICT ("membershipId", "potentialDateTimeId") DO NOTHING;

-- PersonSettings (one per user)
INSERT INTO public."PersonSettings" (id, "createdAt", "updatedAt", "personId")
VALUES
  ('ps_alice', now(), now(), 'person_alice'),
  ('ps_bob',   now(), now(), 'person_bob')
ON CONFLICT (id) DO NOTHING;

-- NotificationMethod (sample email for Alice)
INSERT INTO public."NotificationMethod" (id, "createdAt", "updatedAt", "settingsId", type, enabled, name, value, "webhookHeaders", "customTemplate", "webhookFormat")
VALUES
  ('nm_alice_email', now(), now(), 'ps_alice', 'EMAIL', true, 'Work Email', 'alice@example.com', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- NotificationSetting (enable NEW_POST via email)
INSERT INTO public."NotificationSetting" (id, "notificationType", "methodId", enabled)
VALUES
  ('ns_alice_email_new_post', 'NEW_POST', 'nm_alice_email', true)
ON CONFLICT (id) DO NOTHING;

-- Posts (empty by default)
-- Replies (empty by default)
-- Invites (empty by default)
-- Notifications (empty by default)
