'use client';

import { forwardRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromName } from '@/lib/utils';
import { SuggestionList, type SuggestionItemConfig } from './suggestion-list';
import type { PostDetailPageData } from '@groupi/schema/data';

type Member = PostDetailPageData['post']['event']['memberships'][0];

interface MentionListProps {
  items: Member[];
  command: (item: { id: string; label: string }) => void;
  isMobile?: boolean;
}

export const MentionList = forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, MentionListProps>(
  ({ items, command, isMobile = false }, ref) => {
    const config: SuggestionItemConfig<Member> = {
      getKey: (item) => item.personId,
      renderPrefix: (item) => {
        const user = item.person.user;
        const initials = getInitialsFromName(user?.name, user?.email);
        return (
          <Avatar className='h-6 w-6'>
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
          </Avatar>
        );
      },
      getPrimaryText: (item) => {
        const user = item.person.user;
        return user?.name || user?.email || '';
      },
      getSecondaryText: (item) => {
        const username = item.person.user?.username;
        return username ? `@${username}` : null;
      },
      layout: 'horizontal',
    };

    const handleCommand = (item: Member) => {
      const displayName = item.person.user?.name || item.person.user?.email || '';
      command({
        id: item.personId,
        label: displayName,
      });
    };

    return (
      <SuggestionList
        ref={ref}
        items={items}
        command={handleCommand}
        isMobile={isMobile}
        config={config}
      />
    );
  }
);

MentionList.displayName = 'MentionList';

