import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Convex cron expressions use UTC. The off-peak minute avoids the busiest
// top-of-hour scheduling window.
crons.cron(
  'prune push notification history',
  '23 3 * * *',
  internal.pushNotifications.retention.startRetentionCleanup,
  {}
);

crons.interval(
  'prune authorization audit',
  { hours: 1 },
  internal.authorization.mutations.pruneAudit,
  {}
);

crons.interval(
  'prune expired delegated artifacts',
  { minutes: 5 },
  internal.delegatedApps.storage.pruneExpired,
  {}
);

crons.interval(
  'reconcile managed Discord access',
  { minutes: 1 },
  internal.groupDiscord.reconcile.dispatch,
  {}
);

export default crons;
