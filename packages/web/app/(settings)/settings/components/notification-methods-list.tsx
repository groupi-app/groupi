import { Button } from '@/components/ui/button';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { NotificationSettingsCard } from './notification-settings-card';
import {
  ConvexEnums,
  type NotificationMethodType,
  type NotificationType,
  type WebhookFormat,
} from '@/convex/types';

// Re-export const objects for runtime use
const NotificationMethodType = ConvexEnums.NotificationMethodType;
const NotificationType = ConvexEnums.NotificationType;
const WebhookFormat = ConvexEnums.WebhookFormat;
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  // Webhook-specific fields
  webhookFormat?: WebhookFormat;
  customTemplate?: string;
  webhookHeaders?: string;
}

export function NotificationMethodsList({
  emails,
}: NotificationMethodsListProps) {
  const router = useRouter();
  const { control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'notificationMethods',
  });
  const methods: NewNotificationMethod[] = watch('notificationMethods') || [];

  // Get existing email methods to determine what's already added
  const existingEmailMethods = methods.filter(
    (m: NewNotificationMethod) => m.type === NotificationMethodType.EMAIL
  );
  const usedEmails = new Set(existingEmailMethods.map(m => m.value));

  // Primary email is the first one in the emails array (user's account email)
  const primaryEmail = emails[0] || '';
  const additionalEmails = emails.slice(1);

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
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.mail className="mr-2 h-4 w-4" />
              Email
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {/* Primary Email */}
              <DropdownMenuItem
                onSelect={() =>
                  handleAppend({
                    type: NotificationMethodType.EMAIL,
                    value: primaryEmail,
                    name: 'Primary Email',
                    enabled: true,
                    notifications: getDefaultNotifications(),
                  })
                }
                disabled={usedEmails.has(primaryEmail)}
              >
                <Icons.mail className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Primary Email</span>
                  <span className="text-xs text-muted-foreground">{primaryEmail}</span>
                </div>
                {usedEmails.has(primaryEmail) && (
                  <span className="ml-auto text-xs text-muted-foreground">(added)</span>
                )}
              </DropdownMenuItem>

              {/* Additional Emails */}
              {additionalEmails.map((email, index) => (
                <DropdownMenuItem
                  key={email}
                  onSelect={() =>
                    handleAppend({
                      type: NotificationMethodType.EMAIL,
                      value: email,
                      name: `Email ${index + 2}`,
                      enabled: true,
                      notifications: getDefaultNotifications(),
                    })
                  }
                  disabled={usedEmails.has(email)}
                >
                  <Icons.mail className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Email {index + 2}</span>
                    <span className="text-xs text-muted-foreground">{email}</span>
                  </div>
                  {usedEmails.has(email) && (
                    <span className="ml-auto text-xs text-muted-foreground">(added)</span>
                  )}
                </DropdownMenuItem>
              ))}

              {/* Add New Email Option - navigates to account settings */}
              <DropdownMenuItem
                onSelect={() => router.push('/settings/account#emails')}
              >
                <Icons.plus className="mr-2 h-4 w-4" />
                Add new email
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

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
            <Icons.webhook className="mr-2 h-4 w-4" />
            Webhook
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
