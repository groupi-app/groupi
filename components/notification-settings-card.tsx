'use client';
import { NotificationMethodType, NotificationType } from '@prisma/client';
import { Card, CardContent, CardHeader } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from './ui/form';
import { Button } from './ui/button';
import { useState } from 'react';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Icons } from './icons';
import { cn } from '@/lib/utils';

const notificationTypeLabels: Record<NotificationType, string> = {
  NEW_POST: 'New Post',
  NEW_REPLY: 'New Reply',
  DATE_CHOSEN: 'Date Chosen',
  DATE_CHANGED: 'Date Changed',
  DATE_RESET: 'Date Reset',
  USER_JOINED: 'User Joined',
  USER_LEFT: 'User Left',
  USER_PROMOTED: 'User Promoted',
  EVENT_EDITED: 'Event Edited',
  USER_DEMOTED: 'User Demoted',
  USER_RSVP: 'User RSVP',
};

interface NotificationSettingsCardProps {
  index: number;
  onRemove: () => void;
  autoExpand?: boolean;
}

export function NotificationSettingsCard({
  index,
  onRemove,
  autoExpand,
}: NotificationSettingsCardProps) {
  const { control, watch } = useFormContext();
  const methodType: NotificationMethodType = watch(
    `notificationMethods.${index}.type`
  );
  const methodValue = watch(`notificationMethods.${index}.value`);
  const enabled: boolean = watch(`notificationMethods.${index}.enabled`);
  const name: string = watch(`notificationMethods.${index}.name`);
  const [expanded, setExpanded] = useState(autoExpand ?? false);

  // Card title is now the name, fallback to previous logic if empty
  const cardTitle =
    name && name.trim() !== ''
      ? name
      : methodType === 'EMAIL'
        ? methodValue
        : methodType === 'WEBHOOK'
          ? 'Webhook'
          : methodType === 'PUSH'
            ? 'Push'
            : `Notification Method #${index + 1}`;

  return (
    <Card className={cn(!enabled && 'bg-muted text-muted-foreground')}>
      <CardHeader
        className='flex gap-2 flex-row items-center justify-between cursor-pointer transition-colors hover:bg-accent'
        onClick={() => setExpanded(v => !v)}
      >
        <div className='flex flex-col w-full overflow-hidden'>
          <div className='flex items-center gap-2'>
            {methodType === 'EMAIL' ? (
              <Icons.mail />
            ) : methodType === 'WEBHOOK' ? (
              <Icons.webhook />
            ) : methodType === 'PUSH' ? (
              <Icons.megaphone />
            ) : (
              <Icons.bell />
            )}
            <h3 className='text-lg font-semibold w-full truncate'>
              {cardTitle}
            </h3>
          </div>
          {!enabled && (
            <span className='italic text-muted-foreground'>Disabled</span>
          )}
        </div>
        <div className='flex items-center gap-4'>
          <div
            className='flex items-center gap-2'
            onClick={e => e.stopPropagation()}
          >
            {/* Enabled Switch in Header */}
            <FormField
              name={`notificationMethods.${index}.enabled`}
              control={control}
              render={({ field }) => (
                <FormItem className='flex flex-row items-center gap-1 m-0 p-0'>
                  <FormControl>
                    <Switch
                      {...field}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label='Enabled'
                      className='mb-0'
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type='button'
              variant='ghost'
              className='hover:bg-destructive hover:text-destructive-foreground'
              size='icon'
              onClick={onRemove}
              aria-label='Remove method'
            >
              <Icons.delete className='w-4 h-4' />
            </Button>
          </div>
          {expanded ? <Icons.down /> : <Icons.forward />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className='py-4 flex flex-col gap-6'>
          {/* Name Field */}
          <FormField
            name={`notificationMethods.${index}.name`}
            control={control}
            render={({ field }) => {
              let namePlaceholder = 'e.g. Notification Method';
              if (methodType === 'EMAIL') {
                namePlaceholder = 'e.g. Work Email, Personal Email';
              } else if (methodType === 'WEBHOOK') {
                namePlaceholder = 'e.g. Zapier Webhook, Discord Webhook';
              } else if (methodType === 'PUSH') {
                namePlaceholder = 'e.g. iPhone, Mobile Push';
              }
              return (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      className={cn(
                        !enabled && 'bg-muted text-muted-foreground'
                      )}
                      {...field}
                      placeholder={namePlaceholder}
                    />
                  </FormControl>
                  <FormDescription>
                    A name for this notification method
                  </FormDescription>
                </FormItem>
              );
            }}
          />
          {/* Value Field for WEBHOOK */}
          {methodType === 'WEBHOOK' && (
            <FormField
              name={`notificationMethods.${index}.value`}
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Webhook URL
                    <span className='text-destructive align-text-top font-black'>
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={cn(
                        !enabled && 'bg-muted text-muted-foreground'
                      )}
                      {...field}
                      placeholder={
                        methodType === 'WEBHOOK'
                          ? 'Enter webhook URL'
                          : 'Enter value'
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    The URL that will receive the webhook payload (required)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {/* Notification Types Checkboxes */}
          <FormField
            name={`notificationMethods.${index}.notifications`}
            control={control}
            shouldUnregister={false}
            render={({ field }) => {
              const allChecked = field.value.every(
                (n: { enabled: boolean }) => n.enabled
              );
              const someChecked = field.value.some(
                (n: { enabled: boolean }) => n.enabled
              );
              return (
                <FormItem>
                  <div className='flex flex-col gap-2'>
                    {/* Select All Checkbox */}
                    <FormItem className='flex flex-row items-center space-x-3 space-y-0 mb-2'>
                      <FormControl>
                        <Checkbox
                          id={`notification-${index}-select-all`}
                          checked={
                            allChecked
                              ? true
                              : someChecked
                                ? 'indeterminate'
                                : false
                          }
                          onCheckedChange={checked => {
                            const updated = field.value.map((notif: any) => ({
                              ...notif,
                              enabled: checked === true,
                            }));
                            field.onChange(updated);
                          }}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor={`notification-${index}-select-all`}
                        className='font-semibold'
                      >
                        Select all
                      </FormLabel>
                    </FormItem>
                    {/* Individual Notification Type Checkboxes */}
                    {field.value.map(
                      (
                        notif: { notificationType: string; enabled: boolean },
                        notifIdx: number
                      ) => (
                        <FormItem
                          key={notif.notificationType}
                          className='flex flex-row items-center space-x-3 space-y-0'
                        >
                          <FormControl>
                            <Checkbox
                              id={`notification-${index}-${notif.notificationType}`}
                              checked={notif.enabled}
                              onCheckedChange={checked => {
                                const updated = [...field.value];
                                updated[notifIdx] = {
                                  ...updated[notifIdx],
                                  enabled: checked === true,
                                };
                                field.onChange(updated);
                              }}
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor={`notification-${index}-${notif.notificationType}`}
                          >
                            {notificationTypeLabels[
                              notif.notificationType as NotificationType
                            ] || notif.notificationType}
                          </FormLabel>
                        </FormItem>
                      )
                    )}
                  </div>
                </FormItem>
              );
            }}
          />
        </CardContent>
      )}
    </Card>
  );
}
