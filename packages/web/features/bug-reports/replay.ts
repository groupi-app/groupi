import { waitForReplayDelivery } from '@/lib/bug-report-replay-delivery';
import { getReplay } from '@sentry/nextjs';

type Recording = Pick<
  NonNullable<ReturnType<typeof getReplay>>,
  'getReplayId' | 'getRecordingMode' | 'flush'
>;
/** Only existing session recordings are shareable; buffered error diagnostics stay untouched. */
export function createBugReportReplay(
  getRecording: () => Recording | undefined = getReplay,
  observe = waitForReplayDelivery
) {
  let confirmedId: string | undefined;
  return {
    available() {
      const recording = getRecording();
      return Boolean(
        recording?.getReplayId() && recording.getRecordingMode() === 'session'
      );
    },
    async attach() {
      const recording = getRecording();
      const id = recording?.getReplayId();
      if (!recording || !id || recording.getRecordingMode() !== 'session') {
        throw new Error(
          'The recording is no longer available. Retry or send without replay.'
        );
      }
      if (confirmedId === id) return id;
      const delivery = observe(id);
      try {
        await Promise.all([
          recording.flush({ continueRecording: true }),
          delivery.promise,
        ]);
      } catch {
        throw new Error(
          'Replay upload could not be confirmed. Retry or send without replay.'
        );
      } finally {
        delivery.dispose();
      }
      if (recording.getReplayId() !== id) {
        throw new Error(
          'The recording is no longer available. Retry or send without replay.'
        );
      }
      confirmedId = id;
      return id;
    },
  };
}
