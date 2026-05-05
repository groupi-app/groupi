'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EventEditRedirect(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/event/${eventId}/settings/details`);
  }, [eventId, router]);

  return null;
}
