# Web design-language migration coverage

The user approved the actual gallery on October 24, 2026 and requested documentation first, then all components from simplest to most complex, including page-specific UI. The canonical [design contracts](ui-design-system.md#material-and-interaction-contracts) govern the migration. Web implementation is integrated at `48a6b6ac`; the following ledgers record source review and dispositions, not visual acceptance of every authenticated page.

## Foundations

The UI/atom inventory includes 47 primitive implementations and 12 atom files (including barrels). Existing canonical components now default to Soft lift. Fields, actions, statuses, feedback, cards, people, overlays and menus use the selected treatment. Calendar cells, tables, scroll utilities and collapsibles remain quiet according to their role. Public presentation props remain compatible; legacy hover growth is removed.

Semantic success/warning/info and quiet destructive Button variants, menu destructive intent, and AlertDialogAction variants replace caller color overrides. Shared-theme derivation preserves readable stable ink. Actual default-component browser checks cover all 12 bundled and three custom palettes, 320/390px layouts, enlarged text, Select/Calendar/Sheet, keyboard tabs and reduced motion. Whole application-page runtime acceptance remains open because the local launch was rejected by the script guard and the hosted preview contains older source with no signed-in session.

Final web suite: 1,296 tests in 110 files. Shared suite: 464 tests in 16 files. Required `pnpm check` passes. Detailed state/behavior evidence and native acceptance limits are in the [execution record](design-language-execution.md).

## Higher components and page-specific UI

Scope: molecules, organisms, templates, feature-owned add-ons and all route-specific components. Shared/root components are separately owned. No routes, permissions, query/mutation behavior, or page ordering changed.

### Review method

Reviewed the migration map and all source paths for canonical primitive adoption, custom material and hover overrides, heading typography/ornaments, custom cards/status labels, action/menu semantics, and surface density. Unchanged components either already compose canonical primitives (and inherit the new defaults) or only provide layout/data/state wiring without a separate material treatment. This is source review, not a claim every authenticated route has been visually exercised.

### Concrete changes

- Default EmptyState, LoadingState, ConfirmationDialog and ListPageTemplate to the approved treatment; canonical flat RoleBadge, quiet explanatory cards, attached EventTabFilter.
- Apply Geologica to existing native heading ranks and remove heading ornaments; verification outcome glyph retained beside its title. Preserve layout and content order.
- Remove caller-level growth/lift, forced button shadows and destructive color flips. Adopt canonical semantic and destructive-ghost Button and destructive menu variants.
- Explicit static Save/Create/Delete/Remove/Edit/Copy actions receive familiar icons with visible text; generic labels and headers stay icon-free. No runtime inference from label strings.
- Event list destination cards use CardAction with always-visible independent CardActions; Groups list destinations, add-on template pickers/library, date-selection and theme picker cards use canonical action states. Passive discovery/invitation cards use quiet Card.
- Nested menu layouts use 12px icon-to-text spacing. Pending RSVP label is a flat canonical Badge; RSVP controls use canonical semantic Buttons.

### File ledger

#### packages/web/components/molecules: 23 reviewed, 13 changed, 10 inherited/no visual override

| Path                                                              | Result                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| `packages/web/components/molecules/account-switcher.tsx`          | Updated material/typography/action composition                      |
| `packages/web/components/molecules/confirmation-dialog.tsx`       | Updated material/typography/action composition                      |
| `packages/web/components/molecules/datetime-card.tsx`             | Updated material/typography/action composition                      |
| `packages/web/components/molecules/editable-date-time-item.tsx`   | Updated material/typography/action composition                      |
| `packages/web/components/molecules/empty-state.tsx`               | Updated material/typography/action composition                      |
| `packages/web/components/molecules/event-filters.tsx`             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/molecules/event-stats.tsx`               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/molecules/event-tab-filter.tsx`          | Updated material/typography/action composition                      |
| `packages/web/components/molecules/info-dialog.tsx`               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/molecules/invite-list-person-row.tsx`    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/molecules/loading-state.tsx`             | Updated material/typography/action composition                      |
| `packages/web/components/molecules/menu-item-content.tsx`         | Updated material/typography/action composition                      |
| `packages/web/components/molecules/mobile-status-picker.tsx`      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/molecules/multi-date-time-selector.tsx`  | Updated material/typography/action composition                      |
| `packages/web/components/molecules/query-section.tsx`             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/molecules/role-badge.tsx`                | Updated material/typography/action composition                      |
| `packages/web/components/molecules/rsvp-status.tsx`               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/molecules/single-date-time-selector.tsx` | Updated material/typography/action composition                      |
| `packages/web/components/molecules/status-picker.tsx`             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/molecules/step-item.tsx`                 | Updated material/typography/action composition                      |
| `packages/web/components/molecules/sticker-card.tsx`              | Updated material/typography/action composition                      |
| `packages/web/components/molecules/timestamp-badge.tsx`           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/molecules/user-info-card.tsx`            | Canonical primitives/layout or state only; inherited/no source edit |

#### packages/web/components/organisms: 39 reviewed, 32 changed, 7 inherited/no visual override

| Path                                                                       | Result                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `packages/web/components/organisms/application-question-fields.tsx`        | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/organisms/audience-boundary.tsx`                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/organisms/event-admission-settings.tsx`           | Updated material/typography/action composition                      |
| `packages/web/components/organisms/event-application-settings.tsx`         | Updated material/typography/action composition                      |
| `packages/web/components/organisms/event-applications.tsx`                 | Updated material/typography/action composition                      |
| `packages/web/components/organisms/event-audience-settings.tsx`            | Updated material/typography/action composition                      |
| `packages/web/components/organisms/event-logistics-preview.tsx`            | Updated material/typography/action composition                      |
| `packages/web/components/organisms/event-ownership-transfer.tsx`           | Updated material/typography/action composition                      |
| `packages/web/components/organisms/event-people-invite.tsx`                | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-announcement-composer.tsx`        | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-application-settings.tsx`         | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-applications.tsx`                 | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-ban-management.tsx`               | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-confirmed-action.tsx`             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/organisms/group-detail.tsx`                       | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-event-sharing-policy.tsx`         | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-forms.tsx`                        | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-identity-form.tsx`                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/organisms/group-invitation-card.tsx`              | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-invitation-inbox.tsx`             | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-invitation-management.tsx`        | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-joining-questionnaire.tsx`        | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-landing-invitation.tsx`           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/organisms/group-landing.tsx`                      | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-lists.tsx`                        | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-member-roster.tsx`                | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-ownership-transfer.tsx`           | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-pagination.tsx`                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/organisms/group-polls.tsx`                        | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-questionnaire-answer-summary.tsx` | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-questionnaire-history.tsx`        | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/components/organisms/group-questionnaire-records.tsx`        | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-questionnaire-review.tsx`         | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-questionnaire-settings.tsx`       | Updated material/typography/action composition                      |
| `packages/web/components/organisms/group-shared-events.tsx`                | Updated material/typography/action composition                      |
| `packages/web/components/organisms/groups-panel.tsx`                       | Updated material/typography/action composition                      |
| `packages/web/components/organisms/inline-invite-list-editor.tsx`          | Updated material/typography/action composition                      |
| `packages/web/components/organisms/invite-list-people.tsx`                 | Updated material/typography/action composition                      |
| `packages/web/components/organisms/invite-lists-settings.tsx`              | Updated material/typography/action composition                      |

#### packages/web/components/templates: 6 reviewed, 3 changed, 3 inherited/no visual override

| Path                                                           | Result                                                                           |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `packages/web/components/templates/detail-page-template.tsx`   | Canonical primitives/layout or state only; inherited/no source edit              |
| `packages/web/components/templates/error-page-template.tsx`    | Canonical primitives/layout or state only; inherited/no source edit              |
| `packages/web/components/templates/form-page-template.tsx`     | Canonical primitives/layout or state only; inherited/no source edit              |
| `packages/web/components/templates/legal-page.tsx`             | Updated material/typography/action composition                                   |
| `packages/web/components/templates/list-page-template.tsx`     | Updated material/typography/action composition                                   |
| `packages/web/components/templates/settings-page-template.tsx` | Title badge sits alongside heading to keep optional glyphs outside its semantics |

#### packages/web/features: 47 reviewed, 22 changed, 25 inherited/no visual override

| Path                                                                                | Result                                                              |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `packages/web/features/addons/authoring/action-configurator.tsx`                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/action-row.tsx`                             | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/automation-card.tsx`                        | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/automation-list.tsx`                        | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/builder-context.tsx`                        | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/builder-page.tsx`                           | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/builder-workspace.tsx`                      | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/condition-row.tsx`                          | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/custom-addons-settings.tsx`                 | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/edit-template.tsx`                          | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/editor-panel.tsx`                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/field-card.tsx`                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/field-type-picker.tsx`                      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/icon-picker.tsx`                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/on-submit-action-list.tsx`                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/preview/preview-attendee-page.tsx`          | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/preview/preview-event-card.tsx`             | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/preview/preview-field.tsx`                  | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/preview/preview-manage-card.tsx`            | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/preview/preview-organizer-page.tsx`         | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/preview/preview-utils.tsx`                  | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/preview-panel.tsx`                          | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/section-list.tsx`                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/template-library.tsx`                       | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/template-metadata-form.tsx`                 | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/template-preview.tsx`                       | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/toolbox-panel.tsx`                          | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/variable-input.tsx`                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/variable-picker.tsx`                        | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/authoring/visual-editor.tsx`                          | Updated material/typography/action composition                      |
| `packages/web/features/addons/authoring/yaml-editor.tsx`                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/creation/organisms/addon-toggle-card.tsx`             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/creation/organisms/create-wizard-template-picker.tsx` | Updated material/typography/action composition                      |
| `packages/web/features/addons/model/field-editors.tsx`                              | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/runtime/addon-page.tsx`                               | Updated material/typography/action composition                      |
| `packages/web/features/addons/runtime/custom-definition.tsx`                        | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/runtime/event-addon-gate.tsx`                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/runtime/organisms/bring-list-addon.tsx`               | Updated material/typography/action composition                      |
| `packages/web/features/addons/runtime/organisms/custom-addon-config-editor.tsx`     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/runtime/organisms/custom-addon-renderer.tsx`          | Updated material/typography/action composition                      |
| `packages/web/features/addons/runtime/organisms/discord-addon.tsx`                  | Updated material/typography/action composition                      |
| `packages/web/features/addons/runtime/organisms/event-addons.tsx`                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/runtime/organisms/event-settings-addons.tsx`          | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/runtime/organisms/manage-addons-content.tsx`          | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/features/addons/runtime/organisms/questionnaire-addon.tsx`            | Updated material/typography/action composition                      |
| `packages/web/features/addons/runtime/organisms/reminder-addon.tsx`                 | Updated material/typography/action composition                      |
| `packages/web/features/addons/runtime/organisms/template-picker.tsx`                | Updated material/typography/action composition                      |

#### packages/web/app: 214 reviewed, 57 changed, 157 inherited/no visual override

| Path                                                                                                    | Result                                                              |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `packages/web/app/(addonBuilder)/addon-builder/[templateId]/page.tsx`                                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(addonBuilder)/addon-builder/new/page.tsx`                                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(addonBuilder)/addon-builder/page.tsx`                                                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(addonBuilder)/layout.tsx`                                                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/explorer/components/breadcrumb-trail.tsx`                               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/explorer/components/data-explorer.tsx`                                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/explorer/components/entity-detail-panel.tsx`                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/explorer/components/entity-table.tsx`                                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/explorer/components/entity-tabs.tsx`                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/explorer/components/relation-link.tsx`                                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/explorer/page.tsx`                                                      | Updated material/typography/action composition                      |
| `packages/web/app/(admin)/admin/layout.tsx`                                                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/page.tsx`                                                               | Updated material/typography/action composition                      |
| `packages/web/app/(admin)/admin/query-builder/components/entity-picker.tsx`                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/query-builder/components/filter-group.tsx`                              | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/query-builder/components/preset-manager.tsx`                            | Updated material/typography/action composition                      |
| `packages/web/app/(admin)/admin/query-builder/components/query-builder.tsx`                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/query-builder/components/query-preview.tsx`                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/query-builder/components/results-panel.tsx`                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/query-builder/components/sort-config.tsx`                               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(admin)/admin/query-builder/page.tsx`                                                 | Updated material/typography/action composition                      |
| `packages/web/app/(admin)/admin/reports/page.tsx`                                                       | Updated material/typography/action composition                      |
| `packages/web/app/(admin)/admin/users/page.tsx`                                                         | Updated material/typography/action composition                      |
| `packages/web/app/(auth)/cli-auth/page.tsx`                                                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(auth)/onboarding/components/onboarding-guard.tsx`                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(auth)/onboarding/onboarding-content.tsx`                                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(auth)/onboarding/page.tsx`                                                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`                                               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(changelog)/changelog/changelog-content.tsx`                                          | Updated material/typography/action composition                      |
| `packages/web/app/(changelog)/changelog/page.tsx`                                                       | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/addon/[addonId]/page.tsx`                                     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/attendees/components/attendees-content.tsx`                   | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/attendees/components/attendees.tsx`                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/attendees/page.tsx`                                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/availability/components/availability-content.tsx`             | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/availability/components/availability.tsx`                     | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/availability/page.tsx`                                        | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/change-date/components/change-date-content.tsx`               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/change-date/multi/components/change-date-multi-content.tsx`   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/change-date/multi/page.tsx`                                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/change-date/page.tsx`                                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/change-date/single/components/change-date-single-content.tsx` | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/change-date/single/page.tsx`                                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/components/add-invite.tsx`                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/components/attendee-slate.tsx`                                | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/components/availability-card.tsx`                             | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/components/availability-form.tsx`                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/components/date-card-list.tsx`                                | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/components/date-card.tsx`                                     | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/components/delete-invites.tsx`                                | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/components/deleteEventDialog.tsx`                             | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/components/event-header.tsx`                                  | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/components/event-rsvp.tsx`                                    | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/components/invite-card-list.tsx`                              | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/components/invite-link-card.tsx`                              | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/components/leaveEventDialog.tsx`                              | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/components/member-list.tsx`                                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/components/member-slate.tsx`                                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/components/post-feed-skeleton.tsx`                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/components/post-feed.tsx`                                     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/context/event-data-context.tsx`                               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/date-select/components/date-select-content.tsx`               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/date-select/page.tsx`                                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/edit/components/edit-event-content.tsx`                       | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/edit/components/edit-event-info.tsx`                          | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/edit/components/edit-event-multi-date.tsx`                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/edit/components/edit-event-single-date.tsx`                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/edit/components/edit-event-wrapper.tsx`                       | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/edit/page.tsx`                                                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/error.tsx`                                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/invite/page.tsx`                                              | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/layout.tsx`                                                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/manage-addons/page.tsx`                                       | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/new-post/components/new-post-content.tsx`                     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/new-post/components/new-post-wrapper.tsx`                     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/new-post/loading.tsx`                                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/new-post/page.tsx`                                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/page.tsx`                                                     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/blocknote-editor.tsx`                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/blocknote-inline.tsx`                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/deleteReplyDialog.tsx`               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/editor.tsx`                          | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/full-post.tsx`                       | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/mention-handler.tsx`                 | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/post-detail-page.tsx`                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/post-edit-wrapper.tsx`               | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/post-sticky-header.tsx`              | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/replies-section.tsx`                 | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/replies.tsx`                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/reply-feed.tsx`                      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/reply-form.tsx`                      | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/reply-list.tsx`                      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/reply.tsx`                           | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/components/toolbar-skeleton.tsx`                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/context/post-data-context.tsx`                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/edit/loading.tsx`                               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/edit/page.tsx`                                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/error.tsx`                                      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/[postId]/page.tsx`                                       | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/post/layout.tsx`                                              | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/settings/addons/page.tsx`                                     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/settings/applications/page.tsx`                               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/settings/components/event-settings-nav.tsx`                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/settings/date/multi/page.tsx`                                 | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/settings/date/page.tsx`                                       | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/settings/date/single/page.tsx`                                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/settings/details/page.tsx`                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/settings/layout.tsx`                                          | Updated material/typography/action composition                      |
| `packages/web/app/(event)/event/[eventId]/settings/page.tsx`                                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/event/[eventId]/settings/permissions/page.tsx`                                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(event)/layout.tsx`                                                                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(eventPreview)/event/[eventId]/apply/page.tsx`                                        | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(eventPreview)/event/[eventId]/preview/page.tsx`                                      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/forms/[toolId]/history/page.tsx`                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/forms/[toolId]/page.tsx`                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/forms/[toolId]/settings/page.tsx`                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/forms/error.tsx`                                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/forms/layout.tsx`                                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/forms/new/page.tsx`                                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/forms/page.tsx`                                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/lists/[toolId]/own/page.tsx`                                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/lists/[toolId]/page.tsx`                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/lists/[toolId]/settings/page.tsx`                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/lists/error.tsx`                                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/lists/layout.tsx`                                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/lists/new/page.tsx`                                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/lists/page.tsx`                                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/page.tsx`                                                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/polls/[toolId]/history/page.tsx`                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/polls/[toolId]/page.tsx`                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/polls/[toolId]/results/page.tsx`                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/polls/[toolId]/settings/page.tsx`                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/polls/error.tsx`                                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/polls/layout.tsx`                                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/polls/new/page.tsx`                                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/polls/page.tsx`                                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/questionnaire/error.tsx`                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(groups)/groups/[groupId]/questionnaire/page.tsx`                                     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(home)/components/home-content.tsx`                                                   | Updated material/typography/action composition                      |
| `packages/web/app/(home)/components/home-header.tsx`                                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(home)/components/home-redirect.tsx`                                                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(home)/components/typewriter.tsx`                                                     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(home)/page.tsx`                                                                      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(invite)/invite/[inviteId]/components/invite-accept.tsx`                              | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(invite)/invite/[inviteId]/components/invite-details.tsx`                             | Updated material/typography/action composition                      |
| `packages/web/app/(invite)/invite/[inviteId]/page.tsx`                                                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(myEvents)/events/components/create-event-card.tsx`                                   | Updated material/typography/action composition                      |
| `packages/web/app/(myEvents)/events/components/discover-tab.tsx`                                        | Updated material/typography/action composition                      |
| `packages/web/app/(myEvents)/events/components/event-card.tsx`                                          | Updated material/typography/action composition                      |
| `packages/web/app/(myEvents)/events/components/event-grid.tsx`                                          | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(myEvents)/events/components/event-invite-item.tsx`                                   | Updated material/typography/action composition                      |
| `packages/web/app/(myEvents)/events/components/event-invites-tab.tsx`                                   | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(myEvents)/events/components/event-list-wrapper.tsx`                                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(myEvents)/events/components/event-list.tsx`                                          | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(myEvents)/events/components/events-welcome-header.tsx`                               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(myEvents)/events/components/filter-sort-controls.tsx`                                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(myEvents)/events/components/visual-event-card.tsx`                                   | Updated material/typography/action composition                      |
| `packages/web/app/(myEvents)/events/page.tsx`                                                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(myEvents)/layout.tsx`                                                                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/components/create-wizard.tsx`                                       | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/components/date-type-selection.tsx`                                 | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/components/form-context.tsx`                                        | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/components/location-input.tsx`                                      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/components/new-event-addons.tsx`                                    | Updated material/typography/action composition                      |
| `packages/web/app/(newEvent)/create/components/new-event-form-blank.tsx`                                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/components/new-event-info.tsx`                                      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/components/new-event-multi-date.tsx`                                | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/components/new-event-permissions.tsx`                               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/components/new-event-review.tsx`                                    | Updated material/typography/action composition                      |
| `packages/web/app/(newEvent)/create/components/new-event-single-date.tsx`                               | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/layout.tsx`                                                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(newEvent)/create/page.tsx`                                                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/account/page.tsx`                                                 | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/appearance/components/color-picker.tsx`                           | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/appearance/components/theme-card.tsx`                             | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/appearance/components/theme-editor-dialog.tsx`                    | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/appearance/components/theme-preview.tsx`                          | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/appearance/page.tsx`                                              | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/components/account-form-provider.tsx`                             | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/account-form-with-guard.tsx`                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/account-form.tsx`                                      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/account-settings-content.tsx`                          | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/components/api-keys-settings.tsx`                                 | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/components/confirm-account-settings.tsx`                          | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/components/confirm-settings.tsx`                                  | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/components/delete-account-modal.tsx`                              | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/components/email-field.tsx`                                       | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/email-management.tsx`                                  | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/components/linked-accounts-list.tsx`                              | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/navigation-guard-context.tsx`                          | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/notification-methods-list.tsx`                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/notification-settings-card.tsx`                        | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/components/passkey-settings.tsx`                                  | Updated material/typography/action composition                      |
| `packages/web/app/(settings)/settings/components/settings-content.tsx`                                  | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/settings-form-provider.tsx`                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/settings-form-with-guard.tsx`                          | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/settings-form.tsx`                                     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/settings-nav.tsx`                                      | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/components/username-field.tsx`                                    | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/custom-addons/page.tsx`                                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/invite-lists/page.tsx`                                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/layout.tsx`                                                       | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/notifications/page.tsx`                                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/page.tsx`                                                         | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/(settings)/settings/privacy/page.tsx`                                                 | Updated material/typography/action composition                      |
| `packages/web/app/docs/api/page.tsx`                                                                    | Updated material/typography/action composition                      |
| `packages/web/app/error.tsx`                                                                            | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/g/[groupId]/page.tsx`                                                                 | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/gdl/page.tsx`                                                                         | Updated material/typography/action composition                      |
| `packages/web/app/global-error.tsx`                                                                     | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/layout.tsx`                                                                           | Canonical primitives/layout or state only; inherited/no source edit |
| `packages/web/app/privacy/page.tsx`                                                                     | Updated material/typography/action composition                      |
| `packages/web/app/support/page.tsx`                                                                     | Updated material/typography/action composition                      |
| `packages/web/app/verify-email/page.tsx`                                                                | Updated material/typography/action composition                      |

### Validation and limits

- `pnpm lint:tokens`: pass with existing baseline30 warnings in3 files.
- Seven focused suites /36 tests pass: canonical card and button behavior, EmptyState, LoadingState, asynchronous ConfirmationDialog, appearance confirmation and EventTabFilter keyboard arrows.
- TDD evidence for EventTabFilter: original custom button implementation fails ArrowRight focus/selection; canonical Tabs passes. Logs `/tmp/groupi-420-work/composition-tab-{red,green}.log`.
- `pnpm check` after primitive synchronization passed. Final source check log `/tmp/groupi-420-work/composition-4413de17-check.log`.
- No app server was started. Browser review belongs on the integrated running app; no authenticated page-specific viewport states were verified in this isolated worktree. Storybook canonical contracts are separately browser checked by coordinator.
- All owned source paths scan clean for hover growth/lift/shadow overrides, destructive foreground changes on hover, and direct heading glyph ornaments.
- Base integration synchronized through primitive defaults + gallery semantic action variants. No changeset created; no push.

Final higher source commits: `d4c1e17f`, `02b4fcb1`, `83288e07`, `cf31f7a7`, `4413de17`. Final synchronization report will name the merged tip.

### Final synchronized handoff

- Branch `codex/design-language-compositions`, tip `eeda94bf5514720c1f31fa937bc1b1694a6683ec`, clean. Includes integration shared-composition merge `388558f5`.
- Final `pnpm check` PASS, log `/tmp/groupi-420-work/composition-synchronized-check.log`.
- Final seven focused suites /36 tests PASS, log `/tmp/groupi-420-work/composition-synchronized-tests.log`.
- Final token lint PASS with unchanged30 warnings/3 files, log `/tmp/groupi-420-work/composition-synchronized-tokens.log`.
- 329 owned non-test TSX files inventoried:127 source edits and202 inherited/layout/state no-op paths; one new keyboard regression.
- Browser viewport acceptance remains coordinator-owned after integration; this worker has not claimed authenticated app visual verification.

## Legacy shared compositions

Scope: top-level web components plus attachments/auth/settings/skeletons. All production files below were source reviewed. This is component/material migration; routes, ownership, membership, mutation behavior, and page structure are preserved.

### Changes and rationale

- Canonical interactive cards for posts and mutual events; primary destinations, member controls and menus remain independent. The post title now has a shrinkable width rather than width plus left offset.
- Quiet friend/profile supporting rows and matching passive skeletons no longer imply whole-row actions or floating hover surfaces.
- Flat cut-out numeric/status labels inherit Badge; filled/quiet destructive actions use canonical intent APIs instead of conflicting hover colors.
- Heading icons removed, Geologica heading roles applied. Save/Delete retain obvious cues with visible text; navigation Create uses canonical Button.
- Invite authoring/summary has one meaningful perforated seam. Media thumbnails stay quiet tools; image hover growth removed and keyboard outlines restored.
- Error recovery and New Post destinations expose single anchors instead of nested button/link controls. Profile notification expansion respects reduced motion.

### Coverage inventory

| Source                                                             | Disposition         | Rationale                                                                                                                                                       |
| ------------------------------------------------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/web/components/notification-count.tsx`                   | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/image-focal-point-picker.tsx`             | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/footer-copyright.tsx`                     | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/delete-post-dialog.tsx`                   | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/email-invite-item.tsx`                    | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/site-footer.tsx`                          | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/typing-indicator.tsx`                     | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/onboarding-redirect.tsx`                  | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/combined-badge-count.tsx`                 | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/notifications-desktop.tsx`                | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/profile-slate.tsx`                        | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/friend-list-item.tsx`                     | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/friend-search.tsx`                        | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/number-badge.tsx`                         | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/google-one-tap.tsx`                       | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/friend-request-count.tsx`                 | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/onboarding-nav.tsx`                       | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/notification-widget.tsx`                  | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/global-presence-tracker.tsx`              | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/theme-sync.tsx`                           | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/unified-invite-dialog.tsx`                | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/authenticated-only.tsx`                   | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/analytics.tsx`                            | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/navigation-wrapper.tsx`                   | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/onboarding-redirect-wrapper.tsx`          | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/member-action-dialog.tsx`                 | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/global-navigation-guard.tsx`              | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/member-icon.tsx`                          | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/main-nav-static.tsx`                      | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/replies-icons.tsx`                        | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/friends-dialog.tsx`                       | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/profile-view-dialog.tsx`                  | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/event-image-upload.tsx`                   | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/smart-date-input.tsx`                     | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/email-invites-dialog.tsx`                 | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/event-invite-search.tsx`                  | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/mutual-events-dialog.tsx`                 | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/logo-loader.tsx`                          | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/mode-toggle.tsx`                          | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/pwa-registration.tsx`                     | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/error-display.tsx`                        | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/tailwind-indicator.tsx`                   | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/report-dialog.tsx`                        | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/invite-to-event-popover.tsx`              | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/profile-edit-dialog.tsx`                  | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/app-providers.tsx`                        | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/error.tsx`                                | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/profile-dropdown.tsx`                     | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/icons.tsx`                                | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/mobile-nav.tsx`                           | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/image-crop-modal.tsx`                     | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/post-card.tsx`                            | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/notification-slate.tsx`                   | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/navigation.tsx`                           | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/main-nav.tsx`                             | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/new-post-button.tsx`                      | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/post-card-content.tsx`                    | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/gdl-highlighted-input.tsx`                | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/friend-request-button.tsx`                | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/error-boundary.tsx`                       | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/auth/AuthenticatedLayout.tsx`             | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/auth/auth-wrappers.tsx`                   | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/auth/AuthGuard.tsx`                       | Reviewed; unchanged | Provider/guard/lifecycle composition; existing real-time, authorization, and navigation contracts preserved. Any loading controls inherit canonical primitives. |
| `packages/web/components/settings/account-responsibilities.tsx`    | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/attachments/index.ts`                     | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/attachments/attachment-button.tsx`        | Reviewed; inherited | Existing composition already delegates its material and controls to canonical primitives/atomic components; semantics and local geometry retained.              |
| `packages/web/components/attachments/types.ts`                     | Reviewed; unchanged | Quiet utility, branding, content, or count adapter; retained purpose-specific presentation without adding decorative card framing.                              |
| `packages/web/components/attachments/attachment-edit-dialog.tsx`   | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/attachments/attachment-preview.tsx`       | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/attachments/attachment-gallery.tsx`       | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/skeletons/change-date-skeleton.tsx`       | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/event-header-skeleton.tsx`      | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/skeletons/calendar-skeleton.tsx`          | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/event-page-skeleton.tsx`        | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/event-list-skeleton.tsx`        | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/skeletons/account-settings-skeleton.tsx`  | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/reply-skeleton.tsx`             | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/attendee-list-skeleton.tsx`     | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/new-event-form-skeleton.tsx`    | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/post-card-skeleton.tsx`         | Updated             | Migrated caller overrides/material/heading or interaction compatibility to the approved system; see source diff.                                                |
| `packages/web/components/skeletons/user-profile-skeleton.tsx`      | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/admin-dashboard-skeleton.tsx`   | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/settings-form-skeleton.tsx`     | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/post-detail-skeleton.tsx`       | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/availability-form-skeleton.tsx` | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/invite-details-skeleton.tsx`    | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/notification-skeleton.tsx`      | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/member-list-skeleton.tsx`       | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |
| `packages/web/components/skeletons/index.tsx`                      | Reviewed; inherited | Passive loading geometry retained; Skeleton and any Card/Badge/Button descendants inherit canonical defaults. No new decoration or implied action.              |

### Verification

- Rendered public UI regressions: New Post old nested-button case reproduced red, then green after canonical asChild composition; attendee permission denial remains green. Error recovery My Events old nested-button case reproduced red, then green.
- Focused run: 79 tests in 11 files pass (navigation, New Post, error recovery, numeric badges, notification slates, Friends modal, profile view, skeletons, event-image upload, Card actions, account responsibilities).
- Targeted ESLint passes. Token lint passes with existing warn-only baseline; smart date warning frame migrated from disabled palette class to semantic warning token.
- Full pnpm check passes (lint, types, formatting), after canonical destructive-ghost and AlertDialogAction variant APIs were integrated. Synced final integration995237e6 (only reviewed defaults story/CSS changed); focused 79 regressions pass again. Token lint: baseline 30 warnings in 3 unrelated files; no introduced violations.
- Final branch tip: 44547e949fb97001c3038439dd092b320dd1f678. Feature commits25ddb539 and64f4ff53; clean working tree.

### Visual acceptance and runtime limits

- No new server or build started. This worker did not claim browser review against an unmerged source. Coordinator should visually review integrated source at 320/390 and desktop widths, enlarged text, reduced motion, light/dark/custom themes.
- In live authenticated app, review post hit target vs member/menu actions, mutual-event destinations, Friends and invites, notification menu keyboard focus, profile/error recovery, and dense attachment overlays.
- Media overlay black/white contrast surfaces remain purpose-specific over user images. Their dense edit/remove controls need real media and touch viewport acceptance; no broad overlay restructuring was performed.
- Post HTML content behavior is preserved. Existing rich HTML links inside preview content are a separate structural interaction concern; review content/link behavior in the post journey rather than silently rewriting stored rich text.
- Existing auth guards, data providers, presence subscriptions, routes and permissions were not changed.
