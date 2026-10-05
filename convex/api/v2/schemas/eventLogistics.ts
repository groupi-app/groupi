import { z } from '@hono/zod-openapi';
const visibility = z.enum(['PRIVATE', 'FRIENDS', 'PUBLIC']);
const admissionPolicy = z.enum(['INVITATION_ONLY', 'DIRECT', 'APPLY']);
export const SafeEventLogisticsSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  creatorId: z.string(),
  timezone: z.string(),
  visibility,
  admissionPolicy,
  chosenDateTime: z.number().nullable(),
  chosenEndDateTime: z.number().nullable(),
  imageUrl: z.string().nullable(),
  imageFocalPoint: z.object({ x: z.number(), y: z.number() }).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  potentialDateTimeOptions: z.array(
    z.object({
      id: z.string(),
      start: z.number(),
      end: z.number().nullable(),
      note: z.string().nullable(),
    })
  ),
});
