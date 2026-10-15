import { useEffect, useState } from 'react';

/** Local expiry presentation; authorization remains enforced by the backend. */
export function useAuthorizationClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);
  return now;
}
