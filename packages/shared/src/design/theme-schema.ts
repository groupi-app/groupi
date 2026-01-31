/**
 * Theme Schema Definition
 *
 * Defines which tokens are user-editable in the theme editor.
 * Organized into approachable categories for non-technical users.
 *
 * Total: ~20 editable tokens covering 90%+ of customization needs
 */

import type { EditableTokenCategoryDef } from './themes/types';

// ==========================================================================
// EDITABLE TOKEN CATEGORIES
// ==========================================================================

/**
 * Brand colors - Main identity colors
 * The most impactful tokens for changing app personality
 */
export const brandCategory: EditableTokenCategoryDef = {
  key: 'brand',
  label: 'Brand',
  friendlyName: 'Main Colors',
  description: 'Your primary identity colors that define the app personality',
  tokens: [
    {
      key: 'primary',
      label: 'Primary',
      description: 'Main brand color used for buttons, links, and highlights',
      cssVar: '--brand-primary',
    },
    {
      key: 'secondary',
      label: 'Secondary',
      description: 'Supporting color for secondary actions and accents',
      cssVar: '--brand-secondary',
    },
    {
      key: 'accent',
      label: 'Accent',
      description: 'Eye-catching color for special elements and highlights',
      cssVar: '--brand-accent',
    },
  ],
};

/**
 * Background colors - Surface and container colors
 */
export const backgroundCategory: EditableTokenCategoryDef = {
  key: 'background',
  label: 'Background',
  friendlyName: 'Backgrounds',
  description: 'Colors for page backgrounds, cards, and containers',
  tokens: [
    {
      key: 'page',
      label: 'Page',
      description: 'Main page background color',
      cssVar: '--bg-page',
    },
    {
      key: 'surface',
      label: 'Surface',
      description: 'Card and container background color',
      cssVar: '--bg-surface',
    },
    {
      key: 'elevated',
      label: 'Elevated',
      description: 'Raised elements like modals and popovers',
      cssVar: '--bg-elevated',
    },
    {
      key: 'sunken',
      label: 'Sunken',
      description: 'Recessed areas and input backgrounds',
      cssVar: '--bg-sunken',
    },
  ],
};

/**
 * Text colors - Typography colors
 */
export const textCategory: EditableTokenCategoryDef = {
  key: 'text',
  label: 'Text',
  friendlyName: 'Text Colors',
  description: 'Colors for headings, body text, and captions',
  tokens: [
    {
      key: 'primary',
      label: 'Primary',
      description: 'Main body text color',
      cssVar: '--text-primary',
    },
    {
      key: 'secondary',
      label: 'Secondary',
      description: 'Supporting text and descriptions',
      cssVar: '--text-secondary',
    },
    {
      key: 'heading',
      label: 'Heading',
      description: 'Titles and headlines',
      cssVar: '--text-heading',
    },
    {
      key: 'muted',
      label: 'Muted',
      description: 'De-emphasized text and placeholders',
      cssVar: '--text-muted',
    },
  ],
};

/**
 * Status colors - Feedback and state colors
 */
export const statusCategory: EditableTokenCategoryDef = {
  key: 'status',
  label: 'Status',
  friendlyName: 'Status Colors',
  description: 'Colors for success, warning, error, and info states',
  tokens: [
    {
      key: 'success',
      label: 'Success',
      description: 'Positive feedback and confirmations',
      cssVar: '--bg-success',
    },
    {
      key: 'warning',
      label: 'Warning',
      description: 'Caution messages and alerts',
      cssVar: '--bg-warning',
    },
    {
      key: 'error',
      label: 'Error',
      description: 'Error messages and destructive actions',
      cssVar: '--bg-error',
    },
    {
      key: 'info',
      label: 'Info',
      description: 'Informational messages and tips',
      cssVar: '--bg-info',
    },
  ],
};

/**
 * Fun colors - Celebration and gamification colors (Duolingo-inspired)
 */
export const funCategory: EditableTokenCategoryDef = {
  key: 'fun',
  label: 'Fun',
  friendlyName: 'Fun Colors',
  description: 'Celebration and achievement colors for special moments',
  tokens: [
    {
      key: 'celebration',
      label: 'Celebration',
      description: 'Special achievements and milestones',
      cssVar: '--fun-celebration',
    },
    {
      key: 'party',
      label: 'Party',
      description: 'Fun moments and party vibes',
      cssVar: '--fun-party',
    },
    {
      key: 'streak',
      label: 'Streak',
      description: 'Streaks and consistency rewards',
      cssVar: '--fun-streak',
    },
  ],
};

/**
 * Shadow colors - Elevation and depth
 */
export const shadowCategory: EditableTokenCategoryDef = {
  key: 'shadow',
  label: 'Shadow',
  friendlyName: 'Shadows',
  description: 'Shadow styles for depth and elevation',
  tokens: [
    {
      key: 'raised',
      label: 'Raised',
      description: 'Subtle shadow for cards and buttons',
      cssVar: '--shadow-raised',
    },
    {
      key: 'floating',
      label: 'Floating',
      description: 'Medium shadow for dropdowns and popovers',
      cssVar: '--shadow-floating',
    },
  ],
};

// ==========================================================================
// CATEGORY REGISTRY
// ==========================================================================

/**
 * All editable token categories in display order
 */
export const editableTokenCategories: EditableTokenCategoryDef[] = [
  brandCategory,
  backgroundCategory,
  textCategory,
  statusCategory,
  funCategory,
  shadowCategory,
];

/**
 * Quick customize tokens - the 4-5 most impactful tokens
 * Shown by default in the theme editor before expanding
 */
export const quickCustomizeTokens = [
  {
    categoryKey: 'brand',
    tokenKey: 'primary',
    label: 'Primary Color',
    description: 'Main brand color',
    cssVar: '--brand-primary',
  },
  {
    categoryKey: 'brand',
    tokenKey: 'secondary',
    label: 'Secondary Color',
    description: 'Supporting brand color',
    cssVar: '--brand-secondary',
  },
  {
    categoryKey: 'brand',
    tokenKey: 'accent',
    label: 'Accent Color',
    description: 'Highlight and accent color',
    cssVar: '--brand-accent',
  },
  {
    categoryKey: 'background',
    tokenKey: 'page',
    label: 'Background',
    description: 'Page background color',
    cssVar: '--bg-page',
  },
] as const;

/**
 * Get category by key
 */
export function getCategory(key: string): EditableTokenCategoryDef | undefined {
  return editableTokenCategories.find(cat => cat.key === key);
}

/**
 * Get token definition by category and key
 */
export function getTokenDef(
  categoryKey: string,
  tokenKey: string
):
  | {
      category: EditableTokenCategoryDef;
      token: (typeof brandCategory.tokens)[0];
    }
  | undefined {
  const category = getCategory(categoryKey);
  if (!category) return undefined;

  const token = category.tokens.find(t => t.key === tokenKey);
  if (!token) return undefined;

  return { category, token };
}

/**
 * Total count of editable tokens
 */
export const editableTokenCount = editableTokenCategories.reduce(
  (sum, cat) => sum + cat.tokens.length,
  0
);
