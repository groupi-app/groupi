import { expect, it, vi } from 'vitest';
import {
  observeReplayTransport,
  waitForReplayDelivery,
} from '@/lib/bug-report-replay-delivery';
function replayEnvelope(
  id: string
): Parameters<ReturnType<typeof observeReplayTransport>['send']>[0] {
  return [
    { event_id: id, sent_at: '2026-10-30T00:00:00.000Z' },
    [
      [
        { type: 'replay_event' },
        {
          replay_id: id,
          urls: [],
          error_ids: [],
          trace_ids: [],
          segment_id: 0,
          replay_type: 'session',
        },
      ],
      [{ type: 'replay_recording', length: 19 }, '{"segment_id":0}\n[]'],
    ],
  ];
}

it('observes accepted matching replay envelopes without changing transport or unrelated traffic', async () => {
  const send = vi.fn(async () => ({ statusCode: 200 }));
  const flush = vi.fn(async () => true);
  const transport = observeReplayTransport({ send, flush });
  const observation = waitForReplayDelivery('a'.repeat(32));
  const envelope = replayEnvelope('a'.repeat(32));
  await transport.send(envelope);
  await expect(observation.promise).resolves.toBeUndefined();
  expect(send).toHaveBeenCalledWith(envelope);
  expect(flush).not.toHaveBeenCalled();
});
it('rejects failed and unconfirmed deliveries and cleans listeners after timeout or cancellation', async () => {
  vi.useFakeTimers();
  const transport = observeReplayTransport({
    send: async () => ({ statusCode: 429 }),
    flush: async () => true,
  });
  const observation = waitForReplayDelivery('a'.repeat(32));
  const failure = expect(observation.promise).rejects.toThrow('not accepted');
  await transport.send(replayEnvelope('a'.repeat(32)));
  await failure;
  const missing = waitForReplayDelivery('b'.repeat(32), 10);
  const timeout = expect(missing.promise).rejects.toThrow(
    'could not be confirmed'
  );
  await vi.advanceTimersByTimeAsync(10);
  await timeout;
  const cancelled = waitForReplayDelivery('c'.repeat(32));
  cancelled.dispose();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});
