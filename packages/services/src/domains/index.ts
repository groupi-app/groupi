// ============================================================================
// DOMAIN-ORGANIZED SERVICE EXPORTS
// ============================================================================

// Core business domains
export * from './auth';
// auth-types exports Session/User types (client-safe)
export type { Session, User } from './auth-types';
// auth-helpers is server-only - export from '@groupi/services/server' instead
export * from './account';
export * from './person';
export * from './event';
export * from './membership';
export * from './availability';
export * from './invite';
export * from './post';
export * from './notification';
export * from './notification-sender';
export * from './settings';
export * from './reply';
export * from './admin';
