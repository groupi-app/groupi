'use client';

import { X, Mail, Check, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface EmailInviteItemData {
  email: string;
  recipientName?: string;
  plusOnes: number;
  emailStatus: 'pending' | 'sent' | null;
}

interface EmailInviteItemProps {
  invite: EmailInviteItemData;
  onRemove?: () => void;
  isRemoving?: boolean;
}

export function EmailInviteItem({
  invite,
  onRemove,
  isRemoving,
}: EmailInviteItemProps) {
  const { email, recipientName, plusOnes, emailStatus } = invite;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 p-3 bg-bg-surface rounded-card border border-border',
        isRemoving && 'opacity-50'
      )}
    >
      <div className='flex items-center gap-3 min-w-0 flex-1'>
        {/* Email icon */}
        <div className='flex-shrink-0 size-9 rounded-full bg-muted flex items-center justify-center'>
          <Mail className='size-4 text-muted-foreground' />
        </div>

        {/* Content */}
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <span className='font-medium truncate'>
              {recipientName || email}
            </span>
            {plusOnes > 0 && (
              <Badge variant='secondary' className='flex-shrink-0 text-xs'>
                <Users className='size-3 mr-1' />+{plusOnes}
              </Badge>
            )}
          </div>
          {recipientName && (
            <p className='text-sm text-muted-foreground truncate'>{email}</p>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className='flex items-center gap-2 flex-shrink-0'>
        {emailStatus === 'sent' && (
          <Badge
            variant='outline'
            className='bg-bg-success-subtle text-success border-border-success'
          >
            <Check className='size-3 mr-1' />
            Sent
          </Badge>
        )}
        {emailStatus === 'pending' && (
          <Badge variant='outline' className='text-muted-foreground'>
            <Clock className='size-3 mr-1' />
            Pending
          </Badge>
        )}

        {/* Remove button */}
        {onRemove && (
          <Button
            variant='ghost'
            size='icon'
            className='size-8 text-muted-foreground hover:text-destructive'
            onClick={onRemove}
            disabled={isRemoving}
          >
            <X className='size-4' />
            <span className='sr-only'>Remove</span>
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Local invite item (not yet saved to server)
 */
interface LocalEmailInviteItemProps {
  invite: {
    email: string;
    recipientName?: string;
    plusOnes?: number;
  };
  onRemove: () => void;
}

export function LocalEmailInviteItem({
  invite,
  onRemove,
}: LocalEmailInviteItemProps) {
  const { email, recipientName, plusOnes = 0 } = invite;

  return (
    <div className='flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-card border border-dashed border-border'>
      <div className='flex items-center gap-3 min-w-0 flex-1'>
        {/* Email icon */}
        <div className='flex-shrink-0 size-9 rounded-full bg-muted flex items-center justify-center'>
          <Mail className='size-4 text-muted-foreground' />
        </div>

        {/* Content */}
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <span className='font-medium truncate'>
              {recipientName || email}
            </span>
            {plusOnes > 0 && (
              <Badge variant='secondary' className='flex-shrink-0 text-xs'>
                <Users className='size-3 mr-1' />+{plusOnes}
              </Badge>
            )}
          </div>
          {recipientName && (
            <p className='text-sm text-muted-foreground truncate'>{email}</p>
          )}
        </div>
      </div>

      {/* Remove button */}
      <Button
        variant='ghost'
        size='icon'
        className='size-8 text-muted-foreground hover:text-destructive flex-shrink-0'
        onClick={onRemove}
      >
        <X className='size-4' />
        <span className='sr-only'>Remove</span>
      </Button>
    </div>
  );
}
