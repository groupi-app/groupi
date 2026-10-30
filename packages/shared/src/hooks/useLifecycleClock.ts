import { useEffect, useState } from 'react';

/** Local display clock; writes independently check transaction time.
 * Wake at an option/end boundary or the next minute (including local midnight).
 */
export function useLifecycleClock(
  boundary?: number | readonly (number | undefined)[]
) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const current = Date.now();
    const nextMinute = 60000 - (current % 60000);
    const candidates =
      typeof boundary === 'number' ? [boundary] : (boundary ?? []);
    const nextBoundary = Math.min(
      ...candidates.filter(
        (value): value is number => value !== undefined && value > current
      )
    );
    const untilBoundary = Number.isFinite(nextBoundary)
      ? nextBoundary - current
      : nextMinute;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(nextMinute, untilBoundary)
    );
    return () => clearTimeout(timer);
  }, [boundary, now]);
  return now;
}
