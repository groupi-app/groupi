'use client';

import { InviteDetails } from './components/invite-details';
import { InviteDetailsSkeleton } from '@/components/skeletons/invite-details-skeleton';
import { useEffect, useState } from 'react';

type Props = {
  params: Promise<{ inviteId: string }>;
};

export default function InvitePage({ params }: Props) {
  const [inviteId, setInviteId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setInviteId(p.inviteId));
  }, [params]);

  if (!inviteId) {
    return <InviteDetailsSkeleton />;
  }

  return <InviteDetails inviteId={inviteId} />;
}