'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Type cast needed for notification data transformation between Convex query result and NotificationSlate props

import { useCallback, useMemo, useState } from 'react';
import { NotificationSlate } from './notification-slate';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
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
import {
  useNotificationManagement,
} from '@/hooks/convex/use-notifications';
import { NotificationListSkeleton } from '@/components/skeletons';

interface NotificationWidgetProps {
  maxHeight?: string;
}

/**
 * NotificationWidget component
 * Displays list of notifications with mark all as read functionality
 * Uses Convex for real-time updates
 */
export function NotificationWidget({
  maxHeight = '400px',
}: NotificationWidgetProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    sheetOpen,
    setSheetOpen,
    handleContextMenu,
    handleMoreClick,
    isMobile,
  } = useActionMenu();

  // Use Convex hooks for notification management
  const {
    notifications,
    isLoading,
    markAllAsRead,
    deleteAllNotifications,
  } = useNotificationManagement();

  // Delete all notifications using the Convex mutation
  const handleDeleteAll = useCallback(async () => {
    try {
      await deleteAllNotifications();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  }, [deleteAllNotifications]);

  // Filter notifications based on selected tab
  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  // Check if there are unread notifications
  const hasUnreadNotifications = useMemo(() => {
    return notifications.some(n => !n.read);
  }, [notifications]);

  if (!userId) {
    return (
      <div className='p-4 text-sm text-muted-foreground'>
        Please sign in to view notifications
      </div>
    );
  }

  if (isLoading) {
    return <NotificationListSkeleton />;
  }

  if (notifications.length === 0) {
    return (
      <div className='p-4 text-sm text-muted-foreground'>
        No notifications yet
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      {notifications.length > 0 && (
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
                      onClick={markAllAsRead}
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
                          markAllAsRead();
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
                key={notification._id}
                 
                notification={{
                  ...notification,
                  id: notification._id,
                } as any}
              />
            ))
          )}
        </div>
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
