'use client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

/** Integration attribution has no person profile, presence or member actions. */
export function IntegrationAuthor({
  name,
  showName = true,
}: {
  name: string;
  showName?: boolean;
}) {
  return (
    <div
      className='flex items-center gap-2'
      aria-label={`${name}, integration`}
    >
      <Avatar className='size-10'>
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      {showName ? <span className='text-sm font-medium'>{name}</span> : null}
      {showName ? <Badge variant='secondary'>Integration</Badge> : null}
    </div>
  );
}
