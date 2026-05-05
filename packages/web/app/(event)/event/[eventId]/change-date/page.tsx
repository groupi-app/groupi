'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangeDateRedirect(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/event/${eventId}/settings/date`);
  }, [eventId, router]);

  return null;
}
