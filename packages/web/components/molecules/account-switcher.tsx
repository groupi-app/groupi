'use client';

import { cn, getInitialsFromName } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useMultiSession,
  type DeviceSession,
} from '@/hooks/convex/use-multi-session';

export interface AccountSwitcherProps {
  /** Callback when an account is switched or added (for closing menus) */
  onClose?: () => void;
  /** Whether to show the remove button for non-active sessions */
  showRemove?: boolean;
  /** Additional class names */
  className?: string;
}

interface AccountItemProps {
  session: DeviceSession;
  onSwitch: () => void;
  onRemove?: () => void;
  isSwitching: boolean;
  showRemove: boolean;
}

function AccountItem({
  session,
  onSwitch,
  onRemove,
  isSwitching,
  showRemove,
}: AccountItemProps) {
  const initials = getInitialsFromName(session.userName, session.userEmail);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-card transition-colors',
        session.isActive
          ? 'bg-bg-success-subtle'
          : 'hover:bg-accent/80 cursor-pointer'
      )}
      onClick={!session.isActive ? onSwitch : undefined}
      role={!session.isActive ? 'button' : undefined}
      tabIndex={!session.isActive ? 0 : undefined}
      onKeyDown={
        !session.isActive
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSwitch();
              }
            }
          : undefined
      }
    >
      <Avatar className='size-8'>
        <AvatarImage src={session.userImage || undefined} />
        <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
      </Avatar>

      <div className='flex flex-col min-w-0 flex-1'>
        <span className='text-sm font-medium truncate'>
          {session.userName || session.userEmail}
        </span>
        {session.userName && (
          <span className='text-xs text-muted-foreground truncate'>
            {session.userEmail}
          </span>
        )}
      </div>

      {session.isActive && (
        <Check className='size-4 text-success flex-shrink-0' />
      )}

      {!session.isActive && isSwitching && (
        <Loader2 className='size-4 animate-spin text-muted-foreground flex-shrink-0' />
      )}

      {!session.isActive && showRemove && onRemove && !isSwitching && (
        <Button
          variant='ghost'
          size='icon'
          className='size-6 p-0 hover:bg-destructive/10 hover:text-destructive'
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className='size-3' />
          <span className='sr-only'>Remove account</span>
        </Button>
      )}
    </div>
  );
}

/**
 * AccountSwitcher - Displays logged-in sessions and allows switching
 *
 * A molecule for multi-account management:
 * - Lists all logged-in sessions with avatars
 * - Shows checkmark on active session
 * - Allows switching by clicking a session
 * - Has "Add another account" button
 * - Optional remove button for non-active sessions
 *
 * Used in: profile dropdown, mobile nav
 */
export function AccountSwitcher({
  onClose,
  showRemove = false,
  className,
}: AccountSwitcherProps) {
  const router = useRouter();
  const { sessions, isLoading, isSwitching, switchSession, revokeSession } =
    useMultiSession();

  const handleSwitch = async (sessionToken: string) => {
    const result = await switchSession(sessionToken);
    if (result.success) {
      onClose?.();
    }
  };

  const handleRemove = async (sessionToken: string) => {
    await revokeSession(sessionToken);
  };

  const handleAddAccount = () => {
    onClose?.();
    router.push('/sign-in?mode=add-account');
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <Loader2 className='size-5 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {sessions.map((session, index) => (
        <AccountItem
          key={`${session.userId}-${session.token || index}`}
          session={session}
          onSwitch={() => handleSwitch(session.token)}
          onRemove={showRemove ? () => handleRemove(session.token) : undefined}
          isSwitching={isSwitching}
          showRemove={showRemove}
        />
      ))}

      <Button
        variant='ghost'
        size='sm'
        className='justify-start gap-2 mt-1'
        onClick={handleAddAccount}
        disabled={isSwitching}
      >
        <Plus className='size-4' />
        <span>Add another account</span>
      </Button>
    </div>
  );
}
