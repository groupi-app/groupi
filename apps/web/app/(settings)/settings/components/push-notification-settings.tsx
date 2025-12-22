'use client';

import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { usePusherBeams } from '@/stores/pusher-beams-store';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function PushNotificationSettings() {
  const {
    isSupported,
    isRegistered,
    isSubscribed,
    isCheckingExisting,
    hasOtherUserSubscription,
    otherUserId,
    error,
    subscribe,
    unsubscribe,
  } = usePusherBeams();

  const [toggling, setToggling] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setToggling(true);
    try {
      if (enabled) {
        await subscribe();
        toast.success('Push notifications enabled successfully');
      } else {
        await unsubscribe();
        toast.success('Push notifications disabled successfully');
      }
    } catch (error) {
      // Handle specific authentication errors
      if (error instanceof Error) {
        if (
          error.message.includes('401') ||
          error.message.includes('Unauthorized')
        ) {
          toast.error('Please sign in to manage push notifications');
        } else if (error.message.includes('token')) {
          toast.error(
            'Authentication failed. Please try signing out and back in.'
          );
        } else {
          toast.error(`Failed to toggle push notifications: ${error.message}`);
        }
      } else {
        toast.error('Failed to toggle push notifications');
      }
    } finally {
      setToggling(false);
    }
  };

  // Show loading state during hydration or while checking existing subscription
  if (!isClient || isCheckingExisting) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between p-4 border rounded-lg'>
          <div className='flex items-center gap-3'>
            <Icons.bell className='h-5 w-5' />
            <div>
              <h3 className='font-medium'>Push Notifications</h3>
              <p className='text-sm text-muted-foreground'>
                {!isClient ? 'Loading...' : 'Checking existing subscription...'}
              </p>
            </div>
          </div>
          <Switch checked={false} />
        </div>
      </div>
    );
  }

  // Show unsupported state
  if (!isSupported) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between p-4 border rounded-lg opacity-50'>
          <div className='flex items-center gap-3'>
            <Icons.bell className='h-5 w-5 text-muted-foreground' />
            <div>
              <h3 className='font-medium text-muted-foreground'>
                Push Notifications
              </h3>
              <p className='text-sm text-muted-foreground'>
                Push notifications are not supported on this device/browser
              </p>
            </div>
          </div>
          <Switch checked={false} disabled={true} />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between p-4 border rounded-lg'>
        <div className='flex items-center gap-3'>
          <Icons.bell className='h-5 w-5' />
          <div>
            <h3 className='font-medium'>Push Notifications</h3>
            <p className='text-sm text-muted-foreground'>
              Receive push notifications on this device?
            </p>
            {error && (
              <p className='text-sm text-destructive mt-1'>Error: {error}</p>
            )}
          </div>
        </div>
        <Switch
          checked={isRegistered && isSubscribed}
          onCheckedChange={handleToggle}
          disabled={toggling}
        />
      </div>

      {/* Warning when another user has subscription on this device */}
      {hasOtherUserSubscription && !isSubscribed && (
        <div className='p-3 border bg-yellow-500/60 rounded-lg'>
          <div className='flex items-start gap-2'>
            <Icons.warning className='h-4 w-4 mt-0.5 flex-shrink-0' />
            <div className='text-sm'>
              <p className='font-semibold'>Other user subscription detected!</p>
              <p className=' mt-1'>
                {otherUserId ? `User "${otherUserId}"` : 'Another user'} has
                push notifications enabled on this device. Enabling
                notifications for your account will override their subscription.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className='text-xs text-muted-foreground pl-4'>
        Status:{' '}
        {error
          ? `Error: ${error}`
          : isRegistered && isSubscribed
            ? 'Active'
            : isRegistered
              ? 'Registered (not subscribed)'
              : hasOtherUserSubscription
                ? `Device registered to ${otherUserId || 'another user'}`
                : 'Not registered'}
      </div>
    </div>
  );
}
