---
status: accepted
---

# Use optional Convex modules for public SDK subscriptions

Public SDK live subscriptions will use Convex through optional SDK modules, while
the REST core remains dependency-free. Durable event delivery has a separate
contract because a refreshed resource view and a replayable history of changes
serve different integration needs. The maintainer confirmed this architectural
direction on 15 October 2026 during the API/SDK design interview.

This reuses Convex's dependency tracking and subscription transport while keeping
ordinary REST consumers independent of its client libraries. Groupi owns the
versioned public subscription interface, resource projections and authorization
policy. Subscription results must respect current grant and resource authority
under [ADR-0006](./0006-bounded-credential-authority.md).

The maintainer subsequently authorized recommended defaults for resource views,
runtimes, credential integration, reconnect behavior, validation and separately
gated durable delivery. These are outlined in the
[API/SDK evolution guide](../api-sdk-evolution-design.md), which also records
implementation and release-evidence requirements. Implementation and package
support are not yet claimed.
CLI/TUI transport continues to follow [ADR-0001](./0001-cli-rest-transport.md);
adopting subscriptions there requires a separate decision.
