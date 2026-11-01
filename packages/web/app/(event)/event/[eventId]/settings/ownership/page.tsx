'use client';

import { SettingsPageTemplate } from '@/components/templates';
import { EventOwnershipTransfer } from '@/components/organisms/event-ownership-transfer';
import { NewEventFormSkeleton } from '@/components/skeletons';
import { useEventData } from '../../context';

export default function EventOwnershipSettingsPage() {
  const { headerData, membersData } = useEventData();
  return (
    <SettingsPageTemplate
      title='Ownership'
      description='Manage event ownership and respond to transfer offers.'
      backHref={headerData ? `/event/${headerData.event._id}` : '/events'}
      backLabel='Event'
      maxWidth='md'
    >
      {!headerData || membersData === undefined ? (
        <NewEventFormSkeleton />
      ) : (
        <EventOwnershipTransfer
          eventId={headerData.event._id}
          personId={headerData.userMembership.person._id}
          members={membersData?.event.memberships ?? []}
        />
      )}
    </SettingsPageTemplate>
  );
}
