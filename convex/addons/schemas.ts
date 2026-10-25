import { z } from '@hono/zod-openapi';
import { TemplateSchema, AddonDataSchema } from '../addonTemplates/definition';
export { AddonDataSchema };
export const AddonConfigSchema = z.union([
  z.object({ reminderOffset: z.string() }).strict(),
  z.object({ guildId: z.string(), guildName: z.string() }).strict(),
  z
    .object({
      items: z.array(
        z
          .object({ id: z.string(), name: z.string(), quantity: z.number() })
          .strict()
      ),
    })
    .strict(),
  z
    .object({
      questions: z.array(
        z
          .object({
            id: z.string(),
            label: z.string(),
            type: z.enum([
              'SHORT_ANSWER',
              'LONG_ANSWER',
              'MULTIPLE_CHOICE',
              'CHECKBOXES',
              'NUMBER',
              'DROPDOWN',
              'YES_NO',
            ]),
            required: z.boolean(),
            options: z.array(z.string()).optional(),
          })
          .strict()
      ),
    })
    .strict(),
  z
    .object({ templateId: z.string(), template: TemplateSchema.optional() })
    .strict(),
]);
