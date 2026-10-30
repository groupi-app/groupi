import { v } from 'convex/values';
import { bugReportSubmission, bugReportResult } from '@groupi/shared/utils';

// The lockfile intentionally has Convex 1.43 on the backend and 1.31 in the
// shared/web client. Object validators are invariant across those versions.
// Rebind structural nodes to this runtime, reusing the single shared field
// definitions rather than casting validators or upgrading client React contexts.
const fields = bugReportSubmission.fields;
export const submission = v.object({
  ...fields,
  images: v.optional(v.array(v.object(fields.images.element.fields))),
  context: v.optional(v.object(fields.context.fields)),
});
const [accepted, failed, unknown, pending, missing] = bugReportResult.members;
export const result = v.union(
  v.object(accepted.fields),
  v.object(failed.fields),
  v.object(unknown.fields),
  v.object(pending.fields),
  v.object(missing.fields)
);
