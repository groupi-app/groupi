// ============================================================================
// NEW DOMAIN-ORGANIZED SERVICE STRUCTURE
// ============================================================================

// Infrastructure services
export * from './infrastructure';

// Shared utilities
export * from './shared/errors';
export * from './shared/effect-patterns';
export * from './shared/retry-patterns';
export * from './shared/safe-wrapper';
export * from './shared/operations';
export * from './shared/domain-errors';

// Re-export Effect for convenience
export { Effect } from 'effect';

// Domain-organized services
export * from './domains';

// ============================================================================
// LEGACY EXPORTS REMOVED - All services now organized in domains/
// ============================================================================
