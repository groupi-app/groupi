'use client';

import { useState, useCallback, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { Search } from 'lucide-react';
import {
  useParallelEventInviteSearch,
  useSendEventInvite,
  useSentEventInvites,
  InviteSearchResult,
  SentEventInvite,
} from '@/hooks/convex/use-event-invites';
import { useFriends, Friend } from '@/hooks/convex/use-friends';
import { useEventMembers } from '@/hooks/convex/use-events';
import { Id } from '@/convex/_generated/dataModel';
import { cn, formatDate } from '@/lib/utils';

interface EventInviteSearchProps {
  eventId: Id<'events'>;
  onInviteSent?: () => void;
}

const MAX_MESSAGE_LENGTH = 280;

/**
 * EventInviteSearch - Search and invite users by username
 */
export function EventInviteSearch({
  eventId,
  onInviteSent,
}: EventInviteSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<InviteSearchResult | null>(
    null
  );
  const [role, setRole] = useState<'ATTENDEE' | 'MODERATOR'>('ATTENDEE');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Hooks - only search when submitted
  const {
    results: searchResults,
    exactMatch,
    isLoading: isSearchLoading,
    isExactLoading,
    isFuzzyLoading,
  } = useParallelEventInviteSearch(eventId, submittedSearch);
  const sendInvite = useSendEventInvite();
  const sentInvites = useSentEventInvites(eventId);
  const friends = useFriends();
  const eventMembers = useEventMembers(eventId);

  // Filter out users with pending invites from search results
  const filteredResults = useMemo(() => {
    if (!searchResults) return [];
    return searchResults.filter(
      (user: InviteSearchResult) => !user.hasPendingInvite
    );
  }, [searchResults]);

  // Get pending invite person IDs for filtering
  const pendingInvitePersonIds = useMemo(() => {
    if (!sentInvites) return new Set<string>();
    return new Set(
      sentInvites
        .filter((invite: SentEventInvite) => invite.status === 'PENDING')
        .map((invite: SentEventInvite) => invite.invitee.personId)
    );
  }, [sentInvites]);

  // Get existing member person IDs for filtering
  const memberPersonIds = useMemo(() => {
    if (!eventMembers?.event?.memberships) return new Set<string>();
    return new Set(
      eventMembers.event.memberships.map(
        (member: { personId: Id<'persons'> }) => member.personId
      )
    );
  }, [eventMembers]);

  // Friend with status type
  type FriendWithStatus = Friend & {
    isMember: boolean;
    hasPendingInvite: boolean;
  };

  // Get all friends with their status (inviteable, pending invite, or member)
  const friendsWithStatus = useMemo((): FriendWithStatus[] => {
    if (!friends) return [];
    return friends.map((friend: Friend) => ({
      ...friend,
      isMember: memberPersonIds.has(friend.personId),
      hasPendingInvite: pendingInvitePersonIds.has(friend.personId),
    }));
  }, [friends, pendingInvitePersonIds, memberPersonIds]);

  const handleSearch = useCallback(() => {
    if (searchTerm.trim().length >= 2) {
      setSubmittedSearch(searchTerm.trim());
    }
  }, [searchTerm]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleSelectUser = useCallback((user: InviteSearchResult) => {
    setSelectedUser(user);
    setSearchTerm('');
    setSubmittedSearch('');
  }, []);

  const handleSelectFriend = useCallback((friend: Friend) => {
    // Convert Friend to InviteSearchResult format
    setSelectedUser({
      personId: friend.personId,
      name: friend.name,
      username: friend.username,
      image: friend.image,
      isFriend: true,
      hasPendingInvite: false,
      pendingInviteId: null,
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedUser(null);
    setRole('ATTENDEE');
    setMessage('');
  }, []);

  const handleSendInvite = useCallback(async () => {
    if (!selectedUser) return;

    setIsSending(true);
    try {
      const result = await sendInvite(
        eventId,
        selectedUser.personId,
        role,
        message.trim() || undefined
      );

      if (result.success) {
        handleClearSelection();
        onInviteSent?.();
      }
    } finally {
      setIsSending(false);
    }
  }, [
    selectedUser,
    eventId,
    role,
    message,
    sendInvite,
    handleClearSelection,
    onInviteSent,
  ]);

  // Pending invites (sent but not responded)
  const pendingInvites = useMemo(() => {
    if (!sentInvites) return [];
    return sentInvites.filter(
      (invite: SentEventInvite) => invite.status === 'PENDING'
    );
  }, [sentInvites]);

  return (
    <div className='flex flex-col gap-4'>
      {/* Selected User Card */}
      {selectedUser ? (
        <div className='p-4 bg-muted/50 rounded-card border border-border'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <Avatar className='size-10'>
                <AvatarImage
                  src={selectedUser.image || undefined}
                  alt={selectedUser.name || selectedUser.username || 'User'}
                />
                <AvatarFallback>
                  {(selectedUser.name || selectedUser.username || 'U')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium'>
                  {selectedUser.name || selectedUser.username}
                </p>
                {selectedUser.username && selectedUser.name && (
                  <p className='text-sm text-muted-foreground'>
                    @{selectedUser.username}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleClearSelection}
              className='size-8'
            >
              <Icons.close className='size-4' />
            </Button>
          </div>

          {/* Role selector */}
          <div className='space-y-2 mb-4'>
            <Label>Invite as</Label>
            <Select
              value={role}
              onValueChange={v => setRole(v as 'ATTENDEE' | 'MODERATOR')}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ATTENDEE'>Attendee</SelectItem>
                <SelectItem value='MODERATOR'>Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Personal message */}
          <div className='space-y-2 mb-4'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='invite-message'>
                Personal message (optional)
              </Label>
              <span
                className={cn(
                  'text-xs',
                  message.length > MAX_MESSAGE_LENGTH
                    ? 'text-error'
                    : 'text-muted-foreground'
                )}
              >
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <Textarea
              id='invite-message'
              placeholder='Add a personal note to your invite...'
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH + 20}
              className='min-h-[80px] resize-none'
            />
          </div>

          {/* Send button */}
          <Button
            onClick={handleSendInvite}
            disabled={isSending || message.length > MAX_MESSAGE_LENGTH}
            className='w-full'
          >
            {isSending ? (
              <>
                <Icons.spinner className='size-4 mr-2 animate-spin' />
                Sending...
              </>
            ) : (
              <>
                <Icons.submit className='size-4 mr-2' />
                Send Invite
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className='space-y-2'>
            <Label htmlFor='user-search'>Search by username</Label>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                <Input
                  id='user-search'
                  placeholder='Enter username...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className='pl-10'
                />
              </div>
              <Button
                type='button'
                variant='default'
                onClick={handleSearch}
                disabled={searchTerm.trim().length < 2}
                icon={<Search className='size-4' />}
              >
                Search
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Press Enter or click Search to find users
            </p>
          </div>

          {/* Search Results */}
          {submittedSearch.length >= 2 && (
            <div className='space-y-2'>
              {/* Show exact match immediately if available */}
              {exactMatch && !exactMatch.hasPendingInvite && (
                <div className='space-y-1'>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Icons.check className='size-3' />
                    <span>Exact match</span>
                  </div>
                  <button
                    onClick={() => handleSelectUser(exactMatch)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-input',
                      'bg-bg-success-subtle hover:bg-success/20 transition-colors text-left border border-border-success'
                    )}
                  >
                    <Avatar className='size-9'>
                      <AvatarImage
                        src={exactMatch.image || undefined}
                        alt={exactMatch.name || exactMatch.username || 'User'}
                      />
                      <AvatarFallback className='text-sm'>
                        {(exactMatch.name || exactMatch.username || 'U')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate'>
                        {exactMatch.name || exactMatch.username}
                      </p>
                      {exactMatch.username && exactMatch.name && (
                        <p className='text-sm text-muted-foreground truncate'>
                          @{exactMatch.username}
                        </p>
                      )}
                    </div>
                    {exactMatch.isFriend && (
                      <Badge variant='secondary' className='text-xs'>
                        Friend
                      </Badge>
                    )}
                  </button>
                </div>
              )}

              {/* Loading state - show if still searching */}
              {isSearchLoading && (
                <div className='flex items-center gap-2 py-2 text-muted-foreground'>
                  <Icons.spinner className='size-4 animate-spin' />
                  <span className='text-sm'>
                    {isExactLoading && isFuzzyLoading
                      ? 'Searching...'
                      : isFuzzyLoading
                        ? 'Finding more matches...'
                        : 'Checking exact match...'}
                  </span>
                </div>
              )}

              {/* Fuzzy results (excluding exact match) */}
              {!isSearchLoading &&
              filteredResults.length === 0 &&
              !exactMatch ? (
                <div className='text-center py-4 text-muted-foreground'>
                  <p className='text-sm'>No users found</p>
                  <p className='text-xs'>Try a different username</p>
                </div>
              ) : (
                filteredResults.length > 0 && (
                  <div className='space-y-1'>
                    {/* Only show "Other matches" header if there's an exact match */}
                    {exactMatch && !exactMatch.hasPendingInvite && (
                      <div className='flex items-center gap-2 text-xs text-muted-foreground pt-2'>
                        <Icons.search className='size-3' />
                        <span>Other matches</span>
                      </div>
                    )}
                    <div className='space-y-1 max-h-[200px] overflow-y-auto'>
                      {filteredResults
                        .filter(user => user.personId !== exactMatch?.personId)
                        .map((user: InviteSearchResult) => (
                          <button
                            key={user.personId}
                            onClick={() => handleSelectUser(user)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-input',
                              'hover:bg-muted/50 transition-colors text-left'
                            )}
                          >
                            <Avatar className='size-9'>
                              <AvatarImage
                                src={user.image || undefined}
                                alt={user.name || user.username || 'User'}
                              />
                              <AvatarFallback className='text-sm'>
                                {(user.name || user.username || 'U')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1 min-w-0'>
                              <p className='font-medium truncate'>
                                {user.name || user.username}
                              </p>
                              {user.username && user.name && (
                                <p className='text-sm text-muted-foreground truncate'>
                                  @{user.username}
                                </p>
                              )}
                            </div>
                            {user.isFriend && (
                              <Badge variant='secondary' className='text-xs'>
                                Friend
                              </Badge>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Friends List - show when no submitted search */}
          {submittedSearch.length < 2 && friendsWithStatus.length > 0 && (
            <div className='space-y-2'>
              <div className='border-t border-border my-2' />
              <div className='flex items-center gap-2'>
                <Icons.people className='size-4 text-muted-foreground' />
                <Label className='text-muted-foreground'>Your Friends</Label>
              </div>
              <div className='space-y-1 max-h-[250px] overflow-y-auto'>
                {friendsWithStatus.map((friend: FriendWithStatus) => {
                  const isDisabled = friend.isMember || friend.hasPendingInvite;
                  return (
                    <div
                      key={friend.personId}
                      role={isDisabled ? undefined : 'button'}
                      tabIndex={isDisabled ? undefined : 0}
                      onClick={
                        isDisabled
                          ? undefined
                          : () => handleSelectFriend(friend)
                      }
                      onKeyDown={
                        isDisabled
                          ? undefined
                          : e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSelectFriend(friend);
                              }
                            }
                      }
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-input text-left',
                        isDisabled
                          ? 'opacity-60 cursor-default'
                          : 'hover:bg-muted/50 transition-colors cursor-pointer'
                      )}
                    >
                      <Avatar className='size-9'>
                        <AvatarImage
                          src={friend.image || undefined}
                          alt={friend.name || friend.username || 'Friend'}
                        />
                        <AvatarFallback className='text-sm'>
                          {(friend.name || friend.username || 'F')
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium truncate'>
                          {friend.name || friend.username}
                        </p>
                        {friend.username && friend.name && (
                          <p className='text-sm text-muted-foreground truncate'>
                            @{friend.username}
                          </p>
                        )}
                      </div>
                      {friend.isMember ? (
                        <span className='text-xs text-muted-foreground'>
                          In event
                        </span>
                      ) : friend.hasPendingInvite ? (
                        <span className='text-xs text-muted-foreground'>
                          Pending
                        </span>
                      ) : (
                        <Badge variant='secondary' className='text-xs'>
                          Friend
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <div className='border-t border-border pt-4'>
          <h4 className='text-sm font-medium mb-3 flex items-center gap-2'>
            <Icons.clock className='size-4 text-muted-foreground' />
            Pending Invites
            <Badge variant='secondary'>{pendingInvites.length}</Badge>
          </h4>
          <div className='space-y-2 max-h-[150px] overflow-y-auto'>
            {pendingInvites.map((invite: SentEventInvite) => (
              <div
                key={invite.inviteId}
                className='flex items-center gap-3 p-2 bg-muted/30 rounded-input'
              >
                <Avatar className='size-8'>
                  <AvatarImage
                    src={invite.invitee.image || undefined}
                    alt={
                      invite.invitee.name || invite.invitee.username || 'User'
                    }
                  />
                  <AvatarFallback className='text-xs'>
                    {(invite.invitee.name || invite.invitee.username || 'U')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate'>
                    {invite.invitee.name || invite.invitee.username}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    Invited {formatDate(invite.createdAt)}
                  </p>
                </div>
                <Badge
                  variant='outline'
                  className='text-xs bg-bg-warning-subtle text-warning border-border-warning'
                >
                  Pending
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
