import { v } from 'convex/values';

export const tokenOverridesValidator = v.object({
  brand: v.optional(
    v.object({
      primary: v.optional(v.string()),
      primaryHover: v.optional(v.string()),
      secondary: v.optional(v.string()),
      secondaryHover: v.optional(v.string()),
      accent: v.optional(v.string()),
      accentHover: v.optional(v.string()),
    })
  ),
  background: v.optional(
    v.object({
      page: v.optional(v.string()),
      surface: v.optional(v.string()),
      elevated: v.optional(v.string()),
      sunken: v.optional(v.string()),
    })
  ),
  text: v.optional(
    v.object({
      primary: v.optional(v.string()),
      secondary: v.optional(v.string()),
      heading: v.optional(v.string()),
      muted: v.optional(v.string()),
    })
  ),
  status: v.optional(
    v.object({
      success: v.optional(v.string()),
      warning: v.optional(v.string()),
      error: v.optional(v.string()),
      info: v.optional(v.string()),
    })
  ),
  shadow: v.optional(
    v.object({
      raised: v.optional(v.string()),
      floating: v.optional(v.string()),
    })
  ),
});
