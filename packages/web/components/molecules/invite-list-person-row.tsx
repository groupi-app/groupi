'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface InviteListPersonRowProps {
  person: {
    available: boolean;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  action?: React.ReactNode;
}

export function InviteListPersonRow({
  person,
  action,
}: InviteListPersonRowProps) {
  const name = person.available
    ? (person.name ?? person.username)
    : 'Unavailable person';
  return (
    <div className='flex items-center gap-3 rounded-card border border-border bg-card p-3'>
      <Avatar className='size-9 shrink-0'>
        <AvatarImage
          src={person.available ? (person.image ?? undefined) : undefined}
          alt=''
        />
        <AvatarFallback>
          {(name ?? 'U').slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <p className='break-words font-medium'>{name}</p>
        {person.available && person.username && (
          <p className='break-all text-sm text-muted-foreground'>
            @{person.username}
          </p>
        )}
        {!person.available && (
          <Badge variant='outline' className='mt-1'>
            Unavailable
          </Badge>
        )}
      </div>
      {action && <div className='shrink-0'>{action}</div>}
    </div>
  );
}
