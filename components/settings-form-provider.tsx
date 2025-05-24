'use client';

import { ReactNode, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { NotificationMethodType, NotificationType } from '@prisma/client';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const notificationTypeSettingSchema = z.object({
  notificationType: z.nativeEnum(NotificationType),
  enabled: z.boolean(),
});

export const notificationMethodFormSchema = z
  .object({
    type: z.nativeEnum(NotificationMethodType),
    value: z.string().min(1, 'Required'),
    enabled: z.boolean(),
    name: z.string().optional(),
    notifications: z.array(notificationTypeSettingSchema),
  })
  .superRefine((data, ctx) => {
    if (data.type === NotificationMethodType.WEBHOOK) {
      // Validate as URL if type is WEBHOOK
      try {
        new URL(data.value);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'Must be a valid URL',
        });
      }
    }
  });

export const settingsFormSchema = z.object({
  notificationMethods: z.array(notificationMethodFormSchema),
});

export type SettingsForm = z.infer<typeof settingsFormSchema>;

export function SettingsFormProvider({
  children,
  defaultValues,
}: {
  children: ReactNode;
  defaultValues: SettingsForm;
}) {
  const methods = useForm<SettingsForm>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}
