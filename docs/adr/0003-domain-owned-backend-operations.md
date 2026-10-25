# Give reusable backend operations domain ownership

Reusable backend operations belong to their domain modules, with native Convex
and versioned REST entry points acting as transport adapters. This allows a REST
version to evolve or retire without owning behavior still needed by other
clients; shared REST authentication therefore also lives outside version folders.
Public Convex paths and versioned REST contracts remain stable while their
implementations move, retaining intentional transport differences and the CLI's
REST v2 transport from [ADR-0001](./0001-cli-rest-transport.md).

Corrected domain permissions and side effects apply to equivalent operations in
REST v1, REST v2, and native Convex. Version compatibility preserves intentional
transport contracts; it does not freeze confirmed permission or side-effect
defects in a legacy implementation.
