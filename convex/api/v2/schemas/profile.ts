import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);

/**
 * Profile-related API schemas
 */

// Profile schema (person + user data combined)
export const ProfileSchema = z
  .object({
    personId: z.string(),
    userId: z.string(),
    name: z.string().nullable(),
    email: z.string().email().nullable(),
    image: z.string().url().nullable(),
    username: z.string().nullable(),
    bio: z.string().nullable(),
    pronouns: z.string().nullable(),
  })
  .openapi('Profile');

// Update profile request
export const UpdateProfileRequestSchema = z
  .object({
    name: z.string().min(1).max(200).optional().openapi({
      example: 'Jane Doe',
      description: 'Display name',
    }),
    username: z.string().min(3).max(50).optional().openapi({
      example: 'janedoe',
      description:
        'Username (3-50 chars, letters, numbers, underscores, dashes)',
    }),
    bio: z.string().max(500).optional().openapi({
      example: 'Event planning enthusiast',
      description: 'User bio',
    }),
    pronouns: z.string().max(50).optional().openapi({
      example: 'she/her',
      description: 'Preferred pronouns',
    }),
  })
  .openapi('UpdateProfileRequest');

// Username path parameter
export const UsernameParamSchema = z.object({
  username: z.string().openapi({
    example: 'janedoe',
    description: 'Username to look up',
  }),
});
