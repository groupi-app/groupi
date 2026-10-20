# Roll out strict backend contracts

The new storage validators narrow previously unrestricted fields. Do not publish
`convex/schema.ts` onto an unaudited database. No live audit, normalization or
deployment has been performed by this implementation.

## Variants that need inspection

- `addonTemplates.template`: scalar/array values, missing envelope metadata,
  missing section/field properties, unknown properties, unknown field/action/
  trigger/condition enum values. Structured incomplete drafts remain supported;
  publication still checks completeness. Known legacy `supportsOptOut` and
  `optOutLabel` settings and webhook action metadata remain supported in storage.
- `eventAddonConfigs.config`: only reminders, Discord, bring-list, questionnaire,
  and custom-template configurations are recognized. Questionnaire questions
  require `id`, `label`, a supported type and `required`; custom configurations
  require `templateId`. Unknown properties or arbitrary plugin configurations
  block the strict schema.
- `addonData.data`: supported values are an interpolated automation string or a
  record whose values are string, number, boolean, null or string array. Native
  and REST participant writes require the record form and still enforce the
  configured fields/options/quantities and caller-owned reserved keys. Nested
  arbitrary objects/arrays and non-string arrays need an explicit product decision.
- `notificationMethods.webhookHeaders`: storage requires a string-to-string map.
  Valid legacy JSON-encoded maps can be normalized. Malformed JSON, arrays or
  non-string header values are unresolved; do not silently discard them.

## Two-stage rollout

1. Prepare a migration-only release using the **currently deployed schema**, plus
   `convex/migration/strictContracts.ts`, its imported contracts and header parser.
   Keep the existing application writers during this stage. The strict schema
   must not be included yet. This separation is required because Convex validates
   existing documents before accepting a narrowed schema.
2. On that release, call the internal read-only `migration/strictContracts:audit`
   for each of `addonTemplates`, `eventAddonConfigs`, `addonData`, and
   `notificationMethods`, with `{table, cursor: null, limit: 100}`. Follow each
   returned `nextCursor` until null. Results contain IDs and reason codes, never
   stored content or webhook secrets. Save the unresolved IDs for operator review.
3. Call internal `migration/strictContracts:normalize` in pages for
   `notificationMethods` and `addonTemplates`. It only parses valid JSON header
   maps and fills missing template `name`, `description`, and `iconName` from the
   owning template document. It never rewrites section content, invented answers,
   ownership, version, publication state, or timestamps. Both repairs are
   idempotent. A candidate must satisfy the exact new structural validator before
   it is written; unresolved records are returned unchanged by ID.
4. Resolve every remaining finding through an owner-reviewed repair or an explicit
   retention/export decision. There is deliberately no automatic deletion,
   coercion of arbitrary values, inferred missing labels/roles, or fallback config.
5. Re-audit all four tables immediately before cutover, while writes are paused or
   after the strict application writers have replaced all legacy writers. Every
   page must report zero findings. Then release the strict schema and writers
   together, regenerate Convex bindings, and run the backend contract checker and
   backend tests. If writes continue during the audit, repeat it; a prior clean
   pass cannot guarantee later legacy writes are compatible.

The audit and normalizer are internal functions for an operator-controlled
migration. Do not expose them as public application APIs. Inspect each page result;
a successful invocation does not imply all pages or all tables were processed.

## Ongoing boundary check

`scripts/check-convex-contracts.mjs` uses TypeScript's checker on the generated
`api` and `internal` exports. It recursively checks query/mutation arguments and
returns for `any` and `unknown`, including nested indexed values, arrays and unions.
It has no exception list. Run it after code generation; generated component
implementation internals are outside the application API boundary.
