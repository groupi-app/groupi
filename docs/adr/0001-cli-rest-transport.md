# Use REST v2 for the CLI and TUI

The CLI and TUI will use Groupi's versioned REST v2 API rather than connect
directly through a separate Convex client authentication path. REST already
provides API-key authentication and OpenAPI contracts and gives both interfaces
one transport across hosted, self-hosted, and development deployments.

This reuses an existing integration boundary but requires correcting differences
between REST operations and web/mobile behavior. Permission checks, validation,
and side effects must be equivalent; route availability alone does not establish
feature parity. The initial TUI uses periodic REST refresh with stale/disconnected
indicators; push-based subscriptions are deferred.
