/**
 * Templates - Page-level layouts
 * Layout components that define page structure without specific content.
 * Examples: event layout, dashboard layout, settings layout
 *
 * Note: AsyncPageTemplate was removed - for client-only apps with Convex,
 * each component handles its own loading state via useQuery returning undefined.
 */

export * from './list-page-template';
export * from './detail-page-template';
export * from './form-page-template';
export * from './settings-page-template';
export * from './error-page-template';
