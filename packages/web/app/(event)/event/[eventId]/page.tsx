'use client';

import { EventOwnershipTransfer } from '@/components/organisms/event-ownership-transfer';
import { EventAddons } from '@/features/addons/runtime';
import { EventHeader } from './components/event-header';
import { MemberList } from './components/member-list';
import { PostFeed } from './components/post-feed';
import { ContentNavigation } from '@/features/content';
import { NewPostButton } from '@/components/new-post-button';
import { useEventData } from './context';
import { EventPageSkeleton } from '@/components/skeletons';

export default function EventPage() {
  const { headerData, membersData, postFeedData, isLoading } = useEventData();

  if (isLoading || !headerData || membersData === undefined || !postFeedData) {
    return <EventPageSkeleton />;
  }

  const permissions = headerData.permissions;
  const userRole = headerData.userMembership?.role;

  return (
    <>
      <div className='container pt-6 pb-24 space-y-5'>
        <EventHeader data={headerData} />
        <div className='max-w-4xl mx-auto flex flex-col gap-4'>
          {membersData && (
            <>
              <MemberList data={membersData} permissions={permissions} />
              <EventOwnershipTransfer
                eventId={headerData.event._id}
                personId={headerData.userMembership.person._id}
                members={membersData.event.memberships}
              />
            </>
          )}
          <ContentNavigation
            context='event'
            basePath={`/event/${headerData.event._id}`}
          />
          <EventAddons data={headerData} />
          <section id='posts' aria-label='Posts'>
            <PostFeed data={postFeedData} />
          </section>
        </div>
      </div>
      <NewPostButton permissions={permissions} userRole={userRole} />
    </>
  );
}
