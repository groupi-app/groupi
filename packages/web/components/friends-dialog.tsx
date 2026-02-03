'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { FriendListItem } from '@/components/friend-list-item';
import { FriendSearch } from '@/components/friend-search';
import { ProfileViewDialog } from '@/components/profile-view-dialog';
import {
  useFriendManagement,
  Friend,
  FriendRequest,
} from '@/hooks/convex/use-friends';
import { Id } from '@/convex/_generated/dataModel';
import { useFriendsDialogStore } from '@/stores/friends-dialog-store';
import { Skeleton } from '@/components/ui/skeleton';

type TabValue = 'friends' | 'requests' | 'add';

export function FriendsDialog() {
  const { open, defaultTab, setOpen } = useFriendsDialogStore();
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);

  // Sync activeTab when dialog opens with a specific tab
  useEffect(() => {
    if (open) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setActiveTab(defaultTab);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [open, defaultTab]);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<Id<'friendships'> | null>(
    null
  );

  const {
    friends,
    pendingRequests,
    sentRequests,
    pendingCount,
    sentCount,
    isLoading,
    isPendingLoading,
    isSentLoading,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  } = useFriendManagement();

  const handleViewProfile = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setProfileDialogOpen(true);
  }, []);

  const handleAcceptRequest = useCallback(
    async (friendshipId: Id<'friendships'>) => {
      setActioningId(friendshipId);
      await acceptRequest(friendshipId);
      setActioningId(null);
    },
    [acceptRequest]
  );

  const handleDeclineRequest = useCallback(
    async (friendshipId: Id<'friendships'>) => {
      setActioningId(friendshipId);
      await declineRequest(friendshipId);
      setActioningId(null);
    },
    [declineRequest]
  );

  const handleCancelRequest = useCallback(
    async (friendshipId: Id<'friendships'>) => {
      setActioningId(friendshipId);
      await cancelRequest(friendshipId);
      setActioningId(null);
    },
    [cancelRequest]
  );

  const handleRemoveFriend = useCallback(
    async (friendshipId: Id<'friendships'>) => {
      setActioningId(friendshipId);
      await removeFriend(friendshipId);
      setActioningId(null);
    },
    [removeFriend]
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Icons.people className='size-5' />
              Friends
            </DialogTitle>
            <DialogDescription className='sr-only'>
              Manage your friends, view incoming and outgoing requests, and find
              new friends
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={v => setActiveTab(v as TabValue)}
            className='flex-1 flex flex-col min-h-0'
          >
            <TabsList className='w-full'>
              <TabsTrigger value='friends' className='flex-1'>
                Friends
              </TabsTrigger>
              <TabsTrigger value='requests' className='flex-1 gap-1'>
                <span>Requests</span>
                {(pendingCount > 0 || sentCount > 0) && (
                  <Badge
                    variant={pendingCount > 0 ? 'destructive' : 'secondary'}
                    className='size-4 p-0 flex items-center justify-center text-[10px]'
                  >
                    {pendingCount + sentCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value='add' className='flex-1 gap-1'>
                <Icons.invite className='size-4' />
                Add
              </TabsTrigger>
            </TabsList>

            {/* Friends Tab */}
            <TabsContent
              value='friends'
              className='flex-1 overflow-y-auto mt-4'
            >
              {isLoading ? (
                <div className='space-y-2'>
                  <FriendListItemSkeleton />
                  <FriendListItemSkeleton />
                  <FriendListItemSkeleton />
                </div>
              ) : friends.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Icons.people className='size-12 mx-auto mb-2 opacity-50' />
                  <p>No friends yet</p>
                  <p className='text-sm'>
                    Search for users in the Add tab to send friend requests
                  </p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {friends.map((friend: Friend) => (
                    <FriendListItem
                      key={friend.personId}
                      variant='friend'
                      friend={friend}
                      onViewProfile={() => handleViewProfile(friend.userId)}
                      onRemove={() => handleRemoveFriend(friend.friendshipId)}
                      isLoading={actioningId === friend.friendshipId}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Requests Tab (combined incoming and outgoing) */}
            <TabsContent
              value='requests'
              className='flex-1 overflow-y-auto mt-4'
            >
              {isPendingLoading || isSentLoading ? (
                <div className='space-y-4'>
                  {/* Sent section skeleton */}
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-16 px-1' />
                    <FriendListItemSkeleton />
                  </div>
                  {/* Received section skeleton */}
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-24 px-1' />
                    <FriendListItemSkeleton />
                    <FriendListItemSkeleton />
                  </div>
                </div>
              ) : sentRequests.length === 0 && pendingRequests.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Icons.bell className='size-12 mx-auto mb-2 opacity-50' />
                  <p>No pending requests</p>
                  <p className='text-sm'>
                    Friend requests you send or receive will appear here
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {/* Outgoing requests (shown first) */}
                  {sentRequests.length > 0 && (
                    <div className='space-y-2'>
                      <h3 className='text-sm font-medium text-muted-foreground px-1'>
                        Sent ({sentRequests.length})
                      </h3>
                      {sentRequests.map((request: FriendRequest) => (
                        <FriendListItem
                          key={request.friendshipId}
                          variant='outgoing'
                          request={request}
                          onCancel={() =>
                            handleCancelRequest(request.friendshipId)
                          }
                          isLoading={actioningId === request.friendshipId}
                        />
                      ))}
                    </div>
                  )}

                  {/* Incoming requests */}
                  {pendingRequests.length > 0 && (
                    <div className='space-y-2'>
                      <h3 className='text-sm font-medium text-muted-foreground px-1'>
                        Received ({pendingRequests.length})
                      </h3>
                      {pendingRequests.map((request: FriendRequest) => (
                        <FriendListItem
                          key={request.friendshipId}
                          variant='incoming'
                          request={request}
                          onAccept={() =>
                            handleAcceptRequest(request.friendshipId)
                          }
                          onDecline={() =>
                            handleDeclineRequest(request.friendshipId)
                          }
                          isLoading={actioningId === request.friendshipId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Add Friend Tab */}
            <TabsContent value='add' className='flex-1 overflow-y-auto mt-4'>
              <FriendSearch />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Profile View Dialog */}
      {selectedUserId && (
        <ProfileViewDialog
          userId={selectedUserId}
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      )}
    </>
  );
}

/**
 * FriendListItemSkeleton - Skeleton for a single friend list item
 * Matches FriendListItem: avatar, name, username, action buttons
 */
function FriendListItemSkeleton() {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-card bg-card'>
      {/* Avatar + User info */}
      <div className='flex items-center gap-3 flex-1 min-w-0'>
        {/* Avatar */}
        <Skeleton className='size-10 sm:size-12 rounded-full shrink-0' />

        {/* User info */}
        <div className='flex-1 min-w-0 space-y-1'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-4 w-24' />
        </div>
      </div>

      {/* Action buttons */}
      <div className='flex items-center gap-2 ml-auto'>
        <Skeleton className='size-8 rounded-button' />
        <Skeleton className='size-8 rounded-button' />
      </div>
    </div>
  );
}
