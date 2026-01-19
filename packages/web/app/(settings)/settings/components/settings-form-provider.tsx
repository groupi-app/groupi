'use client';

import { ReactNode, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const notificationTypeSettingSchema = z.object({
  notificationType: z.enum(["EVENT_EDITED", "NEW_POST", "NEW_REPLY", "DATE_CHOSEN", "DATE_CHANGED", "DATE_RESET", "USER_JOINED", "USER_LEFT", "USER_PROMOTED", "USER_DEMOTED", "USER_RSVP", "USER_MENTIONED"]),
  enabled: z.boolean(),
});

export const notificationMethodFormSchema = z
  .object({
    id: z.string().optional(), // Convex Id for existing methods
    type: z.enum(["EMAIL", "PUSH", "WEBHOOK"]),
    value: z.string(),
    enabled: z.boolean(),
    name: z.string().optional(),
    notifications: z.array(notificationTypeSettingSchema),
    // Webhook-specific fields
    webhookFormat: z.enum(["DISCORD", "SLACK", "TEAMS", "GENERIC", "CUSTOM"]).optional(),
    customTemplate: z.string().optional(),
    webhookHeaders: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate value field based on type
    // EMAIL methods can have empty value (will be resolved from user account)
    // PUSH methods use userId as value (already set)
    if (data.type === "PUSH") {
      if (!data.value || data.value.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'Required',
        });
      }
    }

    if (data.type === "WEBHOOK") {
      // Webhook URL is always required
      if (!data.value || data.value.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'Webhook URL is required',
        });
      } else {
        // Validate as URL if value is provided
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

      // Webhook format is required for webhook notifications
      if (!data.webhookFormat) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['webhookFormat'],
          message: 'Webhook format is required',
        });
      }

      // Custom template is required when webhook format is CUSTOM
      if (data.webhookFormat === "CUSTOM") {
        if (!data.customTemplate || data.customTemplate.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['customTemplate'],
            message: 'Custom template is required when using custom format',
          });
        } else {
          // Validate custom template JSON if provided
          try {
            JSON.parse(data.customTemplate);
          } catch {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['customTemplate'],
              message: 'Must be valid JSON',
            });
          }
        }
      }

      // Validate webhook headers JSON if provided
      if (data.webhookHeaders && data.webhookHeaders.trim() !== '') {
        try {
          JSON.parse(data.webhookHeaders);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['webhookHeaders'],
            message: 'Must be valid JSON',
          });
        }
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
