import type { Doc } from '../_generated/dataModel';
function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!
  );
}
/** Only operator-approved appearance and sender mailbox reach this boundary. */
export function decisionEmail(
  appearance: Doc<'delegatedApps'>['appearance'],
  status: string,
  url: string,
  from: string
) {
  const brand = appearance?.brandName ?? 'Groupi';
  const mailbox = from.match(/<([^<>]+)>$/)?.[1] ?? from;
  return {
    from: appearance ? `${appearance.senderName} <${mailbox}>` : from,
    subject: `Your ${brand} application: ${status.toLowerCase()}`,
    html: `<html><body><h1 style="color:${appearance?.accent ?? '#2563eb'}">${escape(brand)}</h1><p>Your application was ${escape(status.toLowerCase())}.</p><p>This decision is historical; current access may have changed.</p><p><a href="${escape(url)}">View current application status</a></p><p>Provided by Groupi. Sign in to your own account to continue.</p></body></html>`,
  };
}
