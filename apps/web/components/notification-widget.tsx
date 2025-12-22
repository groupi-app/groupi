'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { fetchNotifications } from '@/lib/queries/notification-queries';
import { qk } from '@/lib/query-keys';
import { NotificationSlate } from './notification-slate';
import { Button } from '@/components/ui/button';
import {
  markAllNotificationsAsReadAction,
  deleteAllNotificationsAction,
} from '@/actions/notification-actions';
import { toast } from 'sonner';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useSession } from '@/lib/auth-client';
import type { NotificationFeedData } from '@groupi/schema/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useActionMenu } from '@/hooks/use-action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import { Icons } from '@/components/icons';

interface NotificationWidgetProps {
  maxHeight?: string;
}

/**
 * NotificationWidget component
 * Displays list of notifications with mark all as read functionality
 * Supports pagination and real-time updates via Pusher
 */
export function NotificationWidget({
  maxHeight = '400px',
}: NotificationWidgetProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allNotifications, setAllNotifications] = useState<
    NotificationFeedData[]
  >([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    sheetOpen,
    setSheetOpen,
    handleContextMenu,
    handleMoreClick,
    isMobile,
  } = useActionMenu();

  // Reset cursor when userId changes (useLayoutEffect for synchronous reset)
  useLayoutEffect(() => {
    if (userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronous reset needed when userId changes
      setCursor(undefined);
      setAllNotifications([]);
    }
  }, [userId]);

  // Fetch notifications
  const {
    data: notifications,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: qk.notifications.list(userId || 'anonymous', cursor),
    queryFn: async () => {
      try {
        const result = await fetchNotifications(cursor);
        return result;
      } catch (err) {
        console.error(
          '[NotificationWidget] Error fetching notifications:',
          err
        );
        throw err;
      }
    },
    staleTime: 30 * 1000, // Consider fresh for 30s
    enabled: !!userId,
    retry: 1, // Only retry once on failure
  });

  // Accumulate notifications for pagination (useLayoutEffect for synchronous state sync)
  useLayoutEffect(() => {
    if (notifications !== undefined && !isLoading) {
      if (cursor) {
        // Append new notifications when loading more
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronous state sync needed for query results
        setAllNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNotifications = notifications.filter(
            n => !existingIds.has(n.id)
          );
          return [...prev, ...newNotifications];
        });
      } else {
        // Replace all notifications on initial load
        setAllNotifications(notifications);
      }
    }
  }, [notifications, cursor, isLoading]);

  // Real-time updates via Pusher
  usePusherRealtime({
    channel: userId ? `user-${userId}-notifications` : 'dummy',
    event: 'notification-changed',
    tags: userId ? [`user-${userId}-notifications`] : [],
    queryKey: qk.notifications.list(userId || 'anonymous'),
    onInsert: data => {
      const newNotification = data as NotificationFeedData;
      // Add to beginning of list
      setAllNotifications(prev => {
        const exists = prev.some(n => n.id === newNotification.id);
        if (exists) return prev;
        return [newNotification, ...prev];
      });
      // Note: Count is handled optimistically by NotificationCount component
      // No need to invalidate here to avoid race conditions
    },
    onUpdate: () => {
      // Refetch notifications and count when updated
      queryClient.invalidateQueries({
        queryKey: qk.notifications.list(userId || 'anonymous'),
      });
      queryClient.invalidateQueries({
        queryKey: qk.notifications.count(userId || 'anonymous'),
      });
    },
    onDelete: data => {
      const deletedData = data as { id?: string; allDeleted?: boolean };
      if (deletedData.allDeleted) {
        // Clear all notifications
        setAllNotifications([]);
        setCursor(undefined);
      } else if (deletedData.id) {
        // Remove single notification from list
        setAllNotifications(prev => prev.filter(n => n.id !== deletedData.id));
      }
      // Invalidate count
      queryClient.invalidateQueries({
        queryKey: qk.notifications.count(userId || 'anonymous'),
      });
    },
  });

  const handleMarkAllAsRead = useCallback(async () => {
    const [error] = await markAllNotificationsAsReadAction();
    if (error) {
      toast.error('An error occurred', {
        description: 'There was a problem marking all notifications as read.',
      });
    } else {
      toast.success('All notifications marked as read');
      // Update local state optimistically
      setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: qk.notifications.list(userId || 'anonymous'),
      });
      queryClient.invalidateQueries({
        queryKey: qk.notifications.count(userId || 'anonymous'),
      });
    }
  }, [queryClient, userId]);

  const handleLoadMore = useCallback(() => {
    if (notifications && notifications.length > 0) {
      const lastNotification = notifications[notifications.length - 1];
      setCursor(lastNotification.id);
    }
  }, [notifications]);

  const handleDeleteAll = useCallback(async () => {
    const [error] = await deleteAllNotificationsAction();
    if (error) {
      toast.error('An error occurred', {
        description: 'There was a problem deleting all notifications.',
      });
    } else {
      toast.success('All notifications deleted');
      // Clear local state
      setAllNotifications([]);
      setCursor(undefined);
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: qk.notifications.list(userId || 'anonymous'),
      });
      queryClient.invalidateQueries({
        queryKey: qk.notifications.count(userId || 'anonymous'),
      });
    }
    setDeleteDialogOpen(false);
  }, [queryClient, userId]);

  // Filter notifications based on selected tab
  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return allNotifications.filter(n => !n.read);
    }
    return allNotifications;
  }, [allNotifications, filter]);

  // Check if there are unread notifications
  const hasUnreadNotifications = useMemo(() => {
    return allNotifications.some(n => !n.read);
  }, [allNotifications]);

  if (!userId) {
    return (
      <div className='p-4 text-sm text-muted-foreground'>
        Please sign in to view notifications
      </div>
    );
  }

  if (isError) {
    return (
      <div className='p-4 text-sm text-muted-foreground'>
        Error loading notifications:{' '}
        {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (
    isLoading &&
    notifications === undefined &&
    allNotifications.length === 0
  ) {
    return (
      <div className='p-4 text-sm text-muted-foreground'>
        Loading notifications...
      </div>
    );
  }

  if (
    !isLoading &&
    notifications !== undefined &&
    allNotifications.length === 0
  ) {
    return (
      <div className='p-4 text-sm text-muted-foreground'>
        No notifications yet
      </div>
    );
  }

  const hasMore = notifications && notifications.length === 20; // Assuming page size is 20

  return (
    <div className='flex flex-col'>
      {allNotifications.length > 0 && (
        <div className='border-b p-2'>
          <div className='flex items-center gap-2'>
            <Tabs
              value={filter}
              onValueChange={value => setFilter(value as 'all' | 'unread')}
              className='flex-1'
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='all'>All</TabsTrigger>
                <TabsTrigger value='unread'>Unread</TabsTrigger>
              </TabsList>
            </Tabs>
            <ActionMenuButton
              onClick={handleMoreClick}
              onContextMenu={handleContextMenu}
              className='size-8'
              dropdownContent={
                <>
                  {hasUnreadNotifications && (
                    <DropdownMenuItem
                      onClick={handleMarkAllAsRead}
                      className='cursor-pointer'
                    >
                      <div className='flex items-center gap-2'>
                        <Icons.read className='size-4' />
                        <span>Mark all as read</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className='cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10'
                  >
                    <div className='flex items-center gap-2'>
                      <Icons.delete className='size-4' />
                      <span>Delete all</span>
                    </div>
                  </DropdownMenuItem>
                </>
              }
            >
              <Icons.more className='size-4' />
            </ActionMenuButton>
            {isMobile && (
              <Drawer
                open={sheetOpen}
                onOpenChange={open => {
                  // Prevent opening via onOpenChange - only allow via click/contextmenu handler
                  if (isMobile && open && !sheetOpen) {
                    return;
                  }
                  // Allow closing
                  if (!open) {
                    setSheetOpen(false);
                  }
                }}
                modal={true}
              >
                <DrawerContent>
                  <VisuallyHidden>
                    <DrawerTitle>Notification Options</DrawerTitle>
                  </VisuallyHidden>
                  <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
                    {hasUnreadNotifications && (
                      <Button
                        variant='ghost'
                        className='w-full justify-start'
                        onClick={() => {
                          setSheetOpen(false);
                          handleMarkAllAsRead();
                        }}
                      >
                        <Icons.read className='size-4 mr-2' />
                        Mark all as read
                      </Button>
                    )}
                    <Button
                      variant='ghost'
                      className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
                      onClick={() => {
                        setSheetOpen(false);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Icons.delete className='size-4 mr-2' />
                      Delete all
                    </Button>
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
        </div>
      )}
      <ScrollArea style={{ height: maxHeight }} className='min-h-0'>
        <div className='flex flex-col'>
          {filteredNotifications.length === 0 ? (
            <div className='p-4 text-sm text-muted-foreground text-center'>
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications'}
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <NotificationSlate
                key={notification.id}
                notification={notification}
              />
            ))
          )}
        </div>
        {hasMore && filteredNotifications.length > 0 && (
          <div className='p-2 border-t'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleLoadMore}
              className='w-full text-xs'
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your notifications. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
