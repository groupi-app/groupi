---
'@groupi/convex': minor
---

Add REST API endpoints for addon management

New OpenAPI-documented endpoints under `/api/v1/events/{eventId}/addons` for managing addon configs and data programmatically. Endpoints include listing addons, enabling/disabling addons, updating config, and CRUD operations on addon data entries. All endpoints require API key authentication and enforce event membership and role-based access control.
