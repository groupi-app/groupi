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

export default crons;
