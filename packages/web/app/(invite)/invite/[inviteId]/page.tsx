import { Suspense } from 'react';
import { InviteDetails } from './components/invite-details';
import { InviteDetailsSkeleton } from '@/components/skeletons/invite-details-skeleton';

export const experimental_ppr = true;

type Props = {
  params: Promise<{ inviteId: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { inviteId } = await params;

  return (
    <Suspense fallback={<InviteDetailsSkeleton />}>
      <InviteDetails inviteId={inviteId} />
    </Suspense>
  );
}
