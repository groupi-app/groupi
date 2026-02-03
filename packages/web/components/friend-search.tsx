'use client';

import { useState, useCallback, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { FriendListItem } from '@/components/friend-list-item';
import {
  useParallelUserSearch,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useMutualEventUsers,
  MutualEventUser,
  SearchUserResult,
} from '@/hooks/convex/use-friends';
import { Id } from '@/convex/_generated/dataModel';
import { Search, Users } from 'lucide-react';

interface FriendSearchProps {
  onRequestSent?: () => void;
}

/**
 * Skeleton for friend list items - matches the FriendListItem layout
 */
function FriendListItemSkeleton({
  showMutualEvents = false,
}: {
  showMutualEvents?: boolean;
}) {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-card bg-card'>
      {/* Avatar + User info row */}
      <div className='flex items-center gap-3 flex-1 min-w-0'>
        {/* Avatar skeleton */}
        <Skeleton className='size-10 sm:size-12 rounded-full shrink-0' />
        {/* User info skeleton */}
        <div className='flex-1 min-w-0 space-y-1.5'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-3 w-20' />
        </div>
      </div>
      {/* Mutual events button skeleton */}
      {showMutualEvents && <Skeleton className='h-8 w-32 rounded-button' />}
      {/* Action button skeleton */}
      <Skeleton className='h-8 w-16 rounded-button shrink-0' />
    </div>
  );
}

export function FriendSearch({ onRequestSent }: FriendSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actioningId, setActioningId] = useState<Id<'persons'> | null>(null);

  // Parallel search: exact match (fast) + fuzzy search (slower)
  // Only searches when searchTerm is set (on form submit)
  const {
    results: searchResults,
    hasResults,
    isLoading: isSearchLoading,
  } = useParallelUserSearch(searchTerm);
  const mutualEventUsers = useMutualEventUsers();
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();

  // User has submitted a search
  const hasSearched = searchTerm.length >= 3;
  const isLoading = hasSearched && isSearchLoading;
  const noResults =
    hasSearched && searchResults !== undefined && searchResults.length === 0;
  const hasMutualEventSuggestions =
    mutualEventUsers && mutualEventUsers.length > 0;
  const isMutualLoading = !hasSearched && mutualEventUsers === undefined;

  // Handle form submission
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed.length >= 3) {
        setSearchTerm(trimmed);
      }
    },
    [inputValue]
  );

  // Clear search results when input is cleared
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      // Clear search results if input is emptied
      if (value.trim().length < 3 && searchTerm) {
        setSearchTerm('');
      }
    },
    [searchTerm]
  );

  const handleSendRequest = useCallback(
    async (personId: Id<'persons'>) => {
      setActioningId(personId);
      const result = await sendRequest(personId);
      setActioningId(null);
      if (result.success) {
        onRequestSent?.();
      }
    },
    [sendRequest, onRequestSent]
  );

  const handleAcceptRequest = useCallback(
    async (friendshipId: Id<'friendships'>) => {
      await acceptRequest(friendshipId);
    },
    [acceptRequest]
  );

  return (
    <div className='space-y-4'>
      {/* Search form - only searches on submit */}
      <form onSubmit={handleSubmit} className='flex gap-2'>
        <div className='relative flex-1'>
          <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Search by username...'
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            className='pl-10'
          />
        </div>
        <Button
          type='submit'
          variant='default'
          disabled={inputValue.trim().length < 3}
          icon={<Search className='size-4' />}
        >
          Search
        </Button>
      </form>

      {/* Mutual event suggestions when not searching */}
      {!hasSearched && (
        <div className='space-y-4'>
          {isMutualLoading ? (
            <div className='space-y-2'>
              <h3 className='text-sm font-medium text-muted-foreground px-1 flex items-center gap-2'>
                <Users className='size-4' />
                People from your events
              </h3>
              {/* Skeleton loaders matching the card layout */}
              <FriendListItemSkeleton showMutualEvents />
              <FriendListItemSkeleton showMutualEvents />
              <FriendListItemSkeleton showMutualEvents />
            </div>
          ) : hasMutualEventSuggestions ? (
            <div className='space-y-2'>
              <h3 className='text-sm font-medium text-muted-foreground px-1 flex items-center gap-2'>
                <Users className='size-4' />
                People from your events
              </h3>
              {mutualEventUsers.map((user: MutualEventUser) => (
                <FriendListItem
                  key={user.personId}
                  variant='suggestion'
                  suggestion={user}
                  onSendRequest={() => handleSendRequest(user.personId)}
                  onAccept={
                    user.friendshipId
                      ? () => handleAcceptRequest(user.friendshipId!)
                      : undefined
                  }
                  isLoading={actioningId === user.personId}
                />
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-muted-foreground'>
              <Icons.search className='size-12 mx-auto mb-2 opacity-50' />
              <p>Search for users by username</p>
              <p className='text-sm'>Enter at least 3 characters to search</p>
            </div>
          )}
        </div>
      )}

      {/* Loading state - skeleton loaders when no results yet */}
      {isLoading && !hasResults && (
        <div className='space-y-2'>
          <FriendListItemSkeleton />
          <FriendListItemSkeleton />
          <FriendListItemSkeleton />
        </div>
      )}

      {/* No results */}
      {noResults && (
        <div className='text-center py-8 text-muted-foreground'>
          <Icons.people className='size-12 mx-auto mb-2 opacity-50' />
          <p>No users found</p>
          <p className='text-sm'>Try a different search term</p>
        </div>
      )}

      {/* Search results - show as they arrive */}
      {hasResults && searchResults && (
        <div className='space-y-2'>
          {searchResults.map((result: SearchUserResult) => (
            <FriendListItem
              key={result.personId}
              variant='search'
              searchResult={result}
              onSendRequest={() => handleSendRequest(result.personId)}
              onAccept={
                result.friendshipId
                  ? () => handleAcceptRequest(result.friendshipId!)
                  : undefined
              }
              isLoading={actioningId === result.personId}
            />
          ))}
          {/* Show skeleton when more results may be loading */}
          {isLoading && <FriendListItemSkeleton />}
        </div>
      )}
    </div>
  );
}
