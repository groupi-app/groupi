/**
 * Organisms - Complex UI sections
 * Complex components made up of molecules and atoms that form distinct UI sections.
 * Examples: post cards, event cards, member icons, notification items
 */

// Re-export existing complex components for gradual migration
// These will eventually be moved into this directory

// Feature components that are organisms:
// - post-card
// - event-card
// - member-icon
// - notification-slate
// - profile-slate

// For now, components remain in their original locations
// and can be imported directly. Once refactored to use molecules,
// they can be moved here.

export { GroupsPanel } from './groups-panel';
export { GroupDetail } from './group-detail';
export { GroupLanding } from './group-landing';
export { EventOwnershipTransfer } from './event-ownership-transfer';
export { EventLogisticsPreview } from './event-logistics-preview';
export { EventAdmissionSettings } from './event-admission-settings';
