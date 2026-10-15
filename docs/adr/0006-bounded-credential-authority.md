# Keep bounded credential authority explicit and transactional

Bounded named keys and delegated tokens use app-owned principals, grants and
hash-only credentials. They are a distinct mode from legacy collection API keys;
missing grant state never confers legacy account access. User selectors preserve
selected Events versus an explicit all-current-and-future option. Independent
integrations require selected Events and current Organizer sponsorship, and are
first-class discussion authors without person records or human membership.

Every bounded operation reads current credential, grant, account, app eligibility
where applicable, and Event authority inside its authoritative transaction.
Transport preflight cannot replace this check. Existing domain operations retain
ownership of business policy and side effects under ADR-0003. A nested Convex
mutation is a subtransaction of that authoritative mutation.

Actions, parent resources and related-field projections are explicit. Write
responses contain identifiers only, so mutation permission cannot implicitly
read authors, replies or files. Revocation takes effect at committed transaction
order, without a cache/grace period. Completed writes and already acquired file
URLs are not undone. Lifecycle audit is owner-visible metadata retained for90days
with scheduled bounded cleanup. User-account recovery does not blanket-revoke
independent integration identities; current sponsor authority still applies.

Migration is additive: existing human authors and legacy keys remain valid. New
actor ID variants must be understood by native and platform presentation before
shipping. See [bounded authorization](../bounded-authorization.md) for the public
contract, implemented action matrix and explicit unsupported capabilities.
