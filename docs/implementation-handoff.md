# Implementation Handoff - tRPC + Safe-Wrapper Architecture

## Project Overview

**Workspace**: `/Users/tsurette/repos/personal/groupi`  
**Goal**: Implement tRPC + safe-wrapper architecture for cross-platform compatibility (web + React Native)

## Architecture Summary

- **Services**: Effect-based functions with safe-wrapper tuple pattern `[error, result]`
- **tRPC Layer**: Type-safe procedures that return tuples directly (no exception throwing)
- **Client**: Auto-generated React Query hooks with tuple handling
- **Pattern**: Consistent error handling from service to UI components

## Current State

- ✅ **Documentation**: Complete architecture documented in `docs/service-architecture.md`
- ✅ **Effect Services**: Mostly modernized but need cleanup/audit
- ✅ **Safe-Wrapper**: Partially implemented across services
- ❌ **tRPC Layer**: Not implemented yet
- ❌ **Client Setup**: Not implemented yet
- ❌ **Component Migration**: Not implemented yet

## Next Steps (Phase 1)

1. **Audit Services** - Check for legacy functions, misformatted Effect patterns
2. **Clean Services** - Remove legacy code, standardize exports (remove "safe" prefix)
3. **Setup tRPC Package** - Create `@groupi/api` with router structure
4. **Implement tRPC Procedures** - For each service, create procedures that return tuples
5. **Setup Web Client** - Configure tRPC client with providers
6. **Create Custom Hooks** - Wrapper hooks for better ergonomics
7. **Migrate Components** - Update to handle `[error, result]` tuples
8. **Remove Server Actions** - Clean up old patterns

## Key Files to Examine

- `packages/services/src/` - All service files need audit/cleanup
- `packages/hooks/src/` - Custom hooks to be updated
- `apps/web/lib/actions/` - Server actions to be replaced
- `apps/web/app/` - Components using server actions

## Success Criteria

- All services export clean functions (no "safe" prefix)
- tRPC procedures return `[error, result]` tuples
- Components handle tuples with proper type safety
- Cross-platform ready architecture

## Architecture Benefits

- End-to-end type safety
- Consistent error handling
- Built-in discriminated unions via safe-wrapper
- Cross-platform compatibility (web + React Native)
- Zero configuration complexity
