'use client';
import {
  NotificationMethodType,
  NotificationType,
  WebhookFormat,
} from '@prisma/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// Temporary: inline available webhook formats to remove dependency
const getAvailableWebhookFormats = () => [
  { value: 'JSON', label: 'JSON', description: 'Generic JSON' },
  { value: 'DISCORD', label: 'Discord', description: 'Discord webhook' },
  { value: 'SLACK', label: 'Slack', description: 'Slack webhook' },
  { value: 'CUSTOM', label: 'Custom', description: 'Custom template' },
];

const notificationTypeLabels: Record<
  NotificationType,
  { label: string; description: string }
> = {
  NEW_POST: {
    label: 'New Post',
    description: "someone posts in an event I'm in.",
  },
  NEW_REPLY: {
    label: 'New Reply',
    description: "someone replies to my post.",
  },
  DATE_CHOSEN: {
    label: 'Date Chosen',
    description: "a date is chosen for an event I'm in.",
  },
  DATE_CHANGED: {
    label: 'Date Changed',
    description: "the date of an event I'm in is changed.",
  },
  DATE_RESET: {
    label: 'Date Reset',
    description: "a new poll starts for the date of an event I'm in.",
  },
  USER_JOINED: {
    label: 'User Joined',
    description: 'a user joins one of my events.',
  },
  USER_LEFT: {
    label: 'User Left',
    description: 'a user leaves one of my events.',
  },
  USER_PROMOTED: {
    label: 'User Promoted',
    description: 'I am promoted to Moderator of an event.',
  },
  EVENT_EDITED: {
    label: 'Event Edited',
    description: "an event I'm in is edited.",
  },
  USER_DEMOTED: {
    label: 'User Demoted',
    description: 'I am demoted from Moderator of an event.',
  },
  USER_RSVP: {
    label: 'User RSVP',
    description: 'a user RSVPs to one of my events.',
  },
  USER_MENTIONED: {
    label: 'Mentioned',
    description: "someone mentions me in a post or reply.",
  },
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
  // methodValue is watched but not used directly - form handles it
  watch(`notificationMethods.${index}.value`);
  const enabled: boolean = watch(`notificationMethods.${index}.enabled`);
  const name: string = watch(`notificationMethods.${index}.name`);
  const webhookFormat: WebhookFormat = watch(
    `notificationMethods.${index}.webhookFormat`
  );
  const [expanded, setExpanded] = useState(autoExpand ?? false);

  // Card title is now the name, fallback to previous logic if empty
  const cardTitle =
    name && name.trim() !== ''
      ? name
      : methodType === 'EMAIL'
        ? 'Email'
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
                namePlaceholder = 'e.g. Discord Webhook, Slack Webhook';
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
          {/* Webhook Format Select for WEBHOOK */}
          {methodType === 'WEBHOOK' && (
            <FormField
              name={`notificationMethods.${index}.webhookFormat`}
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Webhook Format
                    <span className='text-destructive align-text-top font-black'>
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select format' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailableWebhookFormats().map(format => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.description} - {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Choose a preset format for the webhook payload (required)
                  </FormDescription>
                </FormItem>
              )}
            />
          )}

          {/* Custom Template Textarea for WEBHOOK when format is CUSTOM */}
          {methodType === 'WEBHOOK' && webhookFormat === 'CUSTOM' && (
            <FormField
              name={`notificationMethods.${index}.customTemplate`}
              control={control}
              render={({ field }) => (
                <FormItem>
                  <div className='flex items-center gap-2'>
                    <FormLabel>
                      Custom Template
                      <span className='text-destructive align-text-top font-black'>
                        *
                      </span>
                    </FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Icons.info className='h-4 w-4 text-muted-foreground hover:text-foreground cursor-help' />
                        </TooltipTrigger>
                        <TooltipContent side='right' className='max-w-sm'>
                          <div className='space-y-2'>
                            <p className='font-medium'>Available Variables:</p>
                            <div className='text-xs space-y-1'>
                              <div>
                                <code>{`{{message}}`}</code> - The notification
                                message
                              </div>
                              <div>
                                <code>{`{{heading}}`}</code> - The notification
                                heading
                              </div>
                              <div>
                                <code>{`{{eventTitle}}`}</code> - Event title
                                (if applicable)
                              </div>
                              <div>
                                <code>{`{{postTitle}}`}</code> - Post title (if
                                applicable)
                              </div>
                              <div>
                                <code>{`{{authorName}}`}</code> - Author name
                              </div>
                              <div>
                                <code>{`{{notificationType}}`}</code> - Type of
                                notification
                              </div>
                              <div>
                                <code>{`{{timestamp}}`}</code> - ISO timestamp
                              </div>
                              <div>
                                <code>{`{{eventUrl}}`}</code> - Event URL (if
                                applicable)
                              </div>
                              <div>
                                <code>{`{{postUrl}}`}</code> - Post URL (if
                                applicable)
                              </div>
                              <div>
                                <code>{`{{appName}}`}</code> -
                                &ldquo;Groupi&rdquo;
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Textarea
                      className={cn(
                        !enabled && 'bg-muted text-muted-foreground'
                      )}
                      {...field}
                      value={field.value || ''}
                      placeholder='{"message": "{{message}}", "timestamp": "{{timestamp}}"}'
                      rows={8}
                    />
                  </FormControl>
                  <FormDescription>
                    JSON template with variables (required for custom format).
                    Available: {`{{message}}`}, {`{{eventTitle}}`},{' '}
                    {`{{authorName}}`}, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Webhook Headers Configuration for WEBHOOK */}
          {methodType === 'WEBHOOK' && (
            <FormField
              name={`notificationMethods.${index}.webhookHeaders`}
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Headers</FormLabel>
                  <FormControl>
                    <Textarea
                      className={cn(
                        !enabled && 'bg-muted text-muted-foreground'
                      )}
                      {...field}
                      value={field.value || ''}
                      placeholder='{"Authorization": "Bearer your-token", "X-Custom-Header": "value"}'
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Custom headers as JSON (e.g., for authentication tokens)
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

              // Group notification types by category
              const eventUpdates: NotificationType[] = [
                NotificationType.EVENT_EDITED,
                NotificationType.DATE_CHOSEN,
                NotificationType.DATE_CHANGED,
                NotificationType.DATE_RESET,
              ];
              const postsAndReplies: NotificationType[] = [
                NotificationType.NEW_POST,
                NotificationType.NEW_REPLY,
                NotificationType.USER_MENTIONED,
              ];
              const membership: NotificationType[] = [
                NotificationType.USER_JOINED,
                NotificationType.USER_LEFT,
                NotificationType.USER_PROMOTED,
                NotificationType.USER_DEMOTED,
                NotificationType.USER_RSVP,
              ];

              // Helper to find notification by type
              const findNotification = (type: NotificationType) => {
                return field.value.findIndex(
                  (n: { notificationType: string }) => n.notificationType === type
                );
              };

              // Helper to render checkbox for a notification type
              const renderCheckbox = (type: NotificationType) => {
                const notifIdx = findNotification(type);
                if (notifIdx === -1) return null;
                const notif = field.value[notifIdx];
                return (
                  <FormItem
                    key={type}
                    className='flex flex-row items-center space-x-3 space-y-0'
                  >
                    <FormControl>
                      <Checkbox
                        id={`notification-${index}-${type}`}
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
                      htmlFor={`notification-${index}-${type}`}
                    >
                      {notificationTypeLabels[type] ? (
                        <>
                          <span>
                            {notificationTypeLabels[type].description}
                          </span>{' '}
                          <span className='text-muted-foreground'>
                            ({notificationTypeLabels[type].label})
                          </span>
                        </>
                      ) : (
                        type
                      )}
                    </FormLabel>
                  </FormItem>
                );
              };

              return (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                    Notify this method when...
                  </FormLabel>
                  <div className='flex flex-col gap-4'>
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
                            const updated = field.value.map(
                              (notif: {
                                notificationType: NotificationType;
                                enabled: boolean;
                              }) => ({
                                ...notif,
                                enabled: checked === true,
                              })
                            );
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

                    {/* Event Updates Category */}
                    <div className='flex flex-col gap-2'>
                      <div className='px-2 py-1 text-xs text-muted-foreground font-semibold'>
                        Event Updates
                      </div>
                      {eventUpdates.map(type => renderCheckbox(type))}
                    </div>

                    {/* Posts & Replies Category */}
                    <div className='flex flex-col gap-2'>
                      <div className='px-2 py-1 text-xs text-muted-foreground font-semibold'>
                        Posts & Replies
                      </div>
                      {postsAndReplies.map(type => renderCheckbox(type))}
                    </div>

                    {/* Membership Category */}
                    <div className='flex flex-col gap-2'>
                      <div className='px-2 py-1 text-xs text-muted-foreground font-semibold'>
                        Membership
                      </div>
                      {membership.map(type => renderCheckbox(type))}
                    </div>
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
