'use client';

import { Button } from './ui/button';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { NotificationMethodType, NotificationType } from '@prisma/client';
import { NotificationSettingsCard } from './notification-settings-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Icons } from './icons';
import { useState } from 'react';

interface NotificationMethodsListProps {
  emails: string[];
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
}

export function NotificationMethodsList({
  emails,
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
          {/* Email category with sub-items for each email */}
          <div className='px-2 py-1 text-xs text-muted-foreground font-semibold'>
            Email
          </div>
          {emails.map(email => {
            const alreadyAdded = methods.some(
              (m: NewNotificationMethod) =>
                m.type === NotificationMethodType.EMAIL && m.value === email
            );
            return (
              <DropdownMenuItem
                key={email}
                onSelect={() =>
                  !alreadyAdded &&
                  handleAppend({
                    type: NotificationMethodType.EMAIL,
                    value: email,
                    name: '',
                    enabled: true,
                    notifications: getDefaultNotifications(),
                  })
                }
                disabled={alreadyAdded}
              >
                {email} {alreadyAdded && '(already added)'}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuItem
            onSelect={() =>
              handleAppend({
                type: NotificationMethodType.WEBHOOK,
                value: '',
                name: '',
                enabled: true,
                notifications: getDefaultNotifications(),
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
                value: 'PUSH',
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
