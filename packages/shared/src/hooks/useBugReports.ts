import { useRef, useState } from 'react';
import type { Infer } from 'convex/values';
import type {
  bugReportSubmission,
  bugReportResult,
} from '../utils/bug-report-contracts';

/** In-memory attempt state; platform transport is injected, never stored on disk. */
export function createBugReportHooks(transport: {
  submit: (
    payload: Infer<typeof bugReportSubmission>
  ) => Promise<Infer<typeof bugReportResult>>;
  receipt: (submissionId: string) => Promise<Infer<typeof bugReportResult>>;
  createId: () => string;
}) {
  function useBugReport() {
    const [result, setResult] = useState<Infer<typeof bugReportResult>>();
    const [pending, setPending] = useState(false);
    const [receiptChecked, setReceiptChecked] = useState(false);
    const busy = useRef(false);
    const latest = useRef<Infer<typeof bugReportResult> | undefined>(undefined);
    const attempt = useRef<
      { key: string; payload: Infer<typeof bugReportSubmission> } | undefined
    >(undefined);
    function record(value: Infer<typeof bugReportResult>) {
      latest.current = value;
      setResult(value);
    }
    async function submit(
      payload: Omit<Infer<typeof bugReportSubmission>, 'submissionId'>,
      deliberateNewAttempt = false
    ) {
      if (
        busy.current ||
        latest.current?.status === 'accepted' ||
        latest.current?.status === 'in-progress'
      )
        return;
      if (
        latest.current?.status === 'outcome-unknown' &&
        !(deliberateNewAttempt && receiptChecked)
      )
        return;
      busy.current = true;
      setPending(true);
      setReceiptChecked(false);
      try {
        const key = JSON.stringify(payload);
        const current =
          !deliberateNewAttempt && attempt.current?.key === key
            ? attempt.current
            : {
                key,
                payload: { ...payload, submissionId: transport.createId() },
              };
        attempt.current = current;
        record(await transport.submit(current.payload));
      } catch {
        record({ status: 'outcome-unknown', code: 'connection-lost' });
      } finally {
        busy.current = false;
        setPending(false);
      }
    }
    async function checkReceipt() {
      if (busy.current || !attempt.current) return;
      busy.current = true;
      setPending(true);
      try {
        record(await transport.receipt(attempt.current.payload.submissionId));
        setReceiptChecked(true);
      } catch {
        record({ status: 'outcome-unknown', code: 'connection-lost' });
      } finally {
        busy.current = false;
        setPending(false);
      }
    }
    return { submit, checkReceipt, result, pending, receiptChecked };
  }
  return { useBugReport };
}
