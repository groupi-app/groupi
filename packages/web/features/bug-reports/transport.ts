import { parseBugReportResult, readBoundedText } from '@groupi/shared/utils';
import type { Infer } from 'convex/values';
import type {
  bugReportSubmission,
  bugReportResult,
} from '@groupi/shared/utils';
import { authClient } from '@/lib/auth-client';

async function post(
  path: string,
  payload: unknown
): Promise<Infer<typeof bugReportResult>> {
  const auth = await authClient.convex.token({
    fetchOptions: { throw: false },
  });
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth.data?.token
        ? { Authorization: `Bearer ${auth.data.token}` }
        : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(35000),
  });
  const value = parseBugReportResult(
    JSON.parse(await readBoundedText(response.body, 16384, 5000))
  );
  if (!value || (value.status === 'accepted' && !response.ok))
    throw new Error('Invalid receipt');
  return value;
}
export const bugReportTransport = {
  submit: (payload: Infer<typeof bugReportSubmission>) =>
    post('/api/bug-reports', payload),
  receipt: (submissionId: string) =>
    post('/api/bug-reports/receipt', { submissionId }),
  createId: () => crypto.randomUUID(),
};
