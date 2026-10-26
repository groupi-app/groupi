'use client';

import {
  EventPlanningFeatures,
  EventContentFeatures,
} from '@/features/addons/runtime';
import { EventHeader } from './components/event-header';
import { MemberList } from './components/member-list';
import { PostFeed } from './components/post-feed';
import { ContentNavigation } from '@/features/content';
import { NewPostButton } from '@/components/new-post-button';
import { useEventData } from './context';
import { EventPageSkeleton } from '@/components/skeletons';
import { DetailPageTemplate } from '@/components/templates/detail-page-template';

export default function EventPage() {
  const { headerData, membersData, postFeedData, isLoading } = useEventData();

  // The parent owns resolved not-found/nonmember redirection.
  if (headerData === null || postFeedData === null) return null;

  if (
    isLoading ||
    headerData === undefined ||
    membersData === undefined ||
    postFeedData === undefined
  ) {
    return <EventPageSkeleton />;
  }
  const permissions = headerData.permissions;
  const userRole = headerData.userMembership?.role;

  return (
    <DetailPageTemplate
      header={<EventHeader data={headerData} />}
      floatingAction={
        <NewPostButton permissions={permissions} userRole={userRole} />
      }
    >
      <EventPlanningFeatures data={headerData} />
      {membersData && (
        <MemberList data={membersData} permissions={permissions} />
      )}
      <ContentNavigation
        context='event'
        basePath={`/event/${headerData.event._id}`}
      />
      <EventContentFeatures data={headerData} />
      <section id='posts' aria-label='Posts'>
        <PostFeed data={postFeedData} />
      </section>
    </DetailPageTemplate>
  );
}
