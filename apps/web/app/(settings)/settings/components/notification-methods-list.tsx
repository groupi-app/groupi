'use client';

import { Button } from '@/components/ui/button';
import { useFieldArray, useFormContext } from 'react-hook-form';
import {
  NotificationMethodType,
  NotificationType,
  WebhookFormat,
} from '@prisma/client';
import { NotificationSettingsCard } from './notification-settings-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { useState } from 'react';

interface NotificationMethodsListProps {
  emails: string[];
  userID: string;
}

interface NewNotificationSetting {
  notificationType: NotificationType;
  enabled: boolean;
}

interface NewNotificationMethod {
  type: NotificationMethodType;
  value: string;
  name: string;
  enabled: boolean;
  notifications: NewNotificationSetting[];
  // Webhook-specific fields
  webhookFormat?: WebhookFormat;
  customTemplate?: string;
  webhookHeaders?: string;
}

export function NotificationMethodsList({
  emails: _emails, // eslint-disable-line @typescript-eslint/no-unused-vars -- Required by interface but not used
  userID,
}: NotificationMethodsListProps) {
  const { control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'notificationMethods',
  });
  const methods: NewNotificationMethod[] = watch('notificationMethods') || [];

  // Only allow one PUSH method
  const hasPush = methods.some(
    (m: NewNotificationMethod) => m.type === NotificationMethodType.PUSH
  );

  // Only allow one EMAIL method
  const hasEmail = methods.some(
    (m: NewNotificationMethod) => m.type === NotificationMethodType.EMAIL
  );

  // Reverse the fields so newest is at the top
  const reversedFields = [...fields].reverse();

  // Track the index of the last added method for autoExpand
  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);

  // Helper: get all notification types as array of { notificationType, enabled: true }
  const getDefaultNotifications = () =>
    Object.values(NotificationType).map(type => ({
      notificationType: type,
      enabled: true,
    }));

  // Helper to append and track the last added index
  const handleAppend = (method: NewNotificationMethod) => {
    append(method);
    setLastAddedIndex(fields.length); // The new method will be at the end
  };

  return (
    <div className='space-y-4 mb-20'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className='flex items-center gap-1'
            type='button'
            variant='outline'
          >
            <Icons.plus className='size-4' />
            <span>Add notification method</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          <DropdownMenuItem
            onSelect={() =>
              !hasEmail &&
              handleAppend({
                type: NotificationMethodType.EMAIL,
                value: '', // Will be resolved from user account
                name: '',
                enabled: true,
                notifications: getDefaultNotifications(),
              })
            }
            disabled={hasEmail}
          >
            Email {hasEmail && '(already added)'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              handleAppend({
                type: NotificationMethodType.WEBHOOK,
                value: '',
                name: '',
                enabled: true, // Start enabled since URL is required anyway
                notifications: getDefaultNotifications(),
                webhookFormat: WebhookFormat.GENERIC, // Default webhook format to satisfy validation
              })
            }
          >
            Webhook
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              !hasPush &&
              handleAppend({
                type: NotificationMethodType.PUSH,
                value: userID,
                name: '',
                enabled: true,
                notifications: getDefaultNotifications(),
              })
            }
            disabled={hasPush}
          >
            Push {hasPush && '(already added)'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {reversedFields.map((field, i) => {
        // Calculate the original index for remove and autoExpand
        const index = fields.length - 1 - i;
        // Only autoExpand if this is the last added index, then reset
        const shouldAutoExpand = lastAddedIndex === index;
        // Reset after rendering the auto-expanded card
        if (shouldAutoExpand && lastAddedIndex !== null)
          setTimeout(() => setLastAddedIndex(null), 0);
        return (
          <NotificationSettingsCard
            key={field.id}
            index={index}
            onRemove={() => remove(index)}
            autoExpand={shouldAutoExpand}
          />
        );
      })}
    </div>
  );
}
