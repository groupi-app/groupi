/**
 * Migration entry point - exports all migration functions.
 */

// Export mutations (internal, called by the action)
export * from './mutations';

// Export action (main entry point)
export { runMigration } from './actions';

// Export claim functions (for users to claim legacy accounts)
export {
  checkLegacyAccount,
  claimLegacyAccount,
  findLegacyAccountByEmail,
} from './claim';
