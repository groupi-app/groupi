import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);

/**
 * Theme-related API schemas
 */

// Token override color schema (all fields optional strings)
const OptionalColorSchema = z.string().optional().openapi({
  example: '#8b5cf6',
  description: 'CSS color value',
});

// Token overrides schema
export const TokenOverridesSchema = z
  .object({
    brand: z
      .object({
        primary: OptionalColorSchema,
        primaryHover: OptionalColorSchema,
        secondary: OptionalColorSchema,
        secondaryHover: OptionalColorSchema,
        accent: OptionalColorSchema,
        accentHover: OptionalColorSchema,
      })
      .optional(),
    background: z
      .object({
        page: OptionalColorSchema,
        surface: OptionalColorSchema,
        elevated: OptionalColorSchema,
        sunken: OptionalColorSchema,
      })
      .optional(),
    text: z
      .object({
        primary: OptionalColorSchema,
        secondary: OptionalColorSchema,
        heading: OptionalColorSchema,
        muted: OptionalColorSchema,
      })
      .optional(),
    status: z
      .object({
        success: OptionalColorSchema,
        warning: OptionalColorSchema,
        error: OptionalColorSchema,
        info: OptionalColorSchema,
      })
      .optional(),
    shadow: z
      .object({
        raised: OptionalColorSchema,
        floating: OptionalColorSchema,
      })
      .optional(),
  })
  .openapi('TokenOverrides');

// Theme mode
export const ThemeModeSchema = z.enum(['light', 'dark']).openapi({
  example: 'light',
  description: 'Theme color mode',
});

// Custom theme schema
export const CustomThemeSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    baseThemeId: z.string(),
    mode: ThemeModeSchema,
    tokenOverrides: TokenOverridesSchema,
    createdAt: z.number().int().positive(),
    updatedAt: z.number().int().positive(),
  })
  .openapi('CustomTheme');

// Create custom theme request
export const CreateCustomThemeRequestSchema = z
  .object({
    name: z.string().min(1).max(100).openapi({
      example: 'My Custom Theme',
      description: 'Theme name',
    }),
    description: z.string().max(500).optional().openapi({
      example: 'A dark theme with purple accents',
      description: 'Theme description',
    }),
    baseThemeId: z.string().openapi({
      example: 'groupi-light',
      description: 'Base theme to extend',
    }),
    mode: ThemeModeSchema,
    tokenOverrides: TokenOverridesSchema.optional().openapi({
      description: 'Color token overrides',
    }),
  })
  .openapi('CreateCustomThemeRequest');

// Update custom theme request
export const UpdateCustomThemeRequestSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    baseThemeId: z.string().optional(),
    mode: ThemeModeSchema.optional(),
    tokenOverrides: TokenOverridesSchema.optional(),
  })
  .openapi('UpdateCustomThemeRequest');

// Theme ID path parameter
export const ThemeIdParamSchema = z.object({
  themeId: z.string().openapi({
    example: 'k170xyz...',
    description: 'Custom theme ID',
  }),
});

// Theme preferences schema
export const ThemePreferencesSchema = z
  .object({
    selectedThemeType: z.enum(['base', 'custom']),
    selectedThemeId: z.string(),
    selectedCustomThemeId: z.string().nullable(),
    useSystemPreference: z.boolean(),
    systemLightThemeId: z.string(),
    systemDarkThemeId: z.string(),
  })
  .openapi('ThemePreferences');

// Set theme preference request
export const SetThemePreferenceRequestSchema = z
  .object({
    selectedThemeType: z.enum(['base', 'custom']).openapi({
      description: 'Whether using a base theme or custom theme',
    }),
    selectedThemeId: z.string().openapi({
      example: 'groupi-light',
      description: 'Selected base theme ID',
    }),
    selectedCustomThemeId: z.string().optional().nullable().openapi({
      description: 'Selected custom theme ID (when type is custom)',
    }),
    useSystemPreference: z.boolean().openapi({
      description: 'Whether to follow system light/dark preference',
    }),
    systemLightThemeId: z.string().openapi({
      example: 'groupi-light',
      description: 'Theme to use for system light mode',
    }),
    systemDarkThemeId: z.string().openapi({
      example: 'groupi-dark',
      description: 'Theme to use for system dark mode',
    }),
  })
  .openapi('SetThemePreferenceRequest');

// Response schemas
export const CustomThemeListResponseSchema = z
  .array(CustomThemeSchema)
  .openapi('CustomThemeListResponse');

export const CustomThemeResponseSchema = CustomThemeSchema;

export const ThemePreferencesResponseSchema =
  ThemePreferencesSchema.nullable().openapi('ThemePreferencesResponse');
