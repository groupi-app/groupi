import type { makeFetchTransport } from '@sentry/nextjs';

type ReplayTransport = ReturnType<typeof makeFetchTransport>;

const listeners = new Set<(id: string, accepted: boolean) => void>();
/** Observe only delivery metadata; never retain envelopes, recordings or report text. */
export function observeReplayTransport(
  transport: ReplayTransport
): ReplayTransport {
  return {
    flush: timeout => transport.flush(timeout),
    send(envelope) {
      const replay = envelope[1].find(item => item[0].type === 'replay_event');
      const id =
        replay && typeof envelope[0].event_id === 'string'
          ? envelope[0].event_id
          : undefined;
      return transport.send(envelope).then(
        response => {
          if (id)
            for (const listener of listeners)
              listener(
                id,
                typeof response.statusCode === 'number' &&
                  response.statusCode >= 200 &&
                  response.statusCode < 300
              );
          return response;
        },
        error => {
          if (id) for (const listener of listeners) listener(id, false);
          throw error;
        }
      );
    },
  };
}
export function waitForReplayDelivery(id: string, timeoutMs = 15000) {
  let dispose = () => {};
  const promise = new Promise<void>((resolve, reject) => {
    const listener = (receivedId: string, accepted: boolean) => {
      if (receivedId !== id) return;
      dispose();
      if (accepted) resolve();
      else
        reject(
          new Error(
            'Replay upload was not accepted. Retry or send without replay.'
          )
        );
    };
    const timer = setTimeout(() => {
      dispose();
      reject(
        new Error(
          'Replay delivery could not be confirmed. Retry or send without replay.'
        )
      );
    }, timeoutMs);
    dispose = () => {
      clearTimeout(timer);
      listeners.delete(listener);
    };
    listeners.add(listener);
  });
  return { promise, dispose };
}
