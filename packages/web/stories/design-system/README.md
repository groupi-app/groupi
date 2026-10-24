# Soft lift component review

This is the actual canonical component gallery. Presentation is opt-in until the
human review gate; existing application defaults are preserved.

Start at `/?path=/story/design-system-soft-lift--overview` in the running Storybook.
The **Theme** toolbar uses the production ThemeProvider and custom-theme serializer
at the document root, including portaled dialogs and menus. It includes every
bundled theme and three sparse custom examples: pale, translucent and near-dark
fills. Inter and Geologica are loaded through the same Next font mechanisms as
the application. Storybook backgrounds are disabled to avoid a competing theme.

## Review stories

| Story ID                                        | Review focus                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `design-system-soft-lift--overview`             | Whole system from actions through feedback                                            |
| `design-system-soft-lift--actions-and-surfaces` | Physical actions, passive and interactive surfaces                                    |
| `design-system-soft-lift--fields-and-feedback`  | Writable/invalid/disabled fields, mixed controls, tabs, menus, confirmation and toast |
| `design-system-soft-lift--layout-and-states`    | Responsive template hierarchy, empty and loading states                               |
| `design-system-soft-lift--long-content`         | Narrow viewport and enlarged text reflow                                              |

Filled actions have a 3 px sticker edge with a 4 px backing. Hover depresses
1 px; activation depresses 3 px. They do not grow. In reduced motion, the position
stays still while background and backing depth change immediately. Ordinary and
featured passive cards stay still in every interaction state.

## Semantic composition

Use `presentation='soft'` on staged controls and molecules. `Tabs` propagates it
to its list and triggers. `ConfirmationDialog` propagates it to its actions and
portal content. Heading `level` controls the document rank independently of its
visual `roleSize` (`page`, `section` or `content`).

Use `Card treatment='quiet'` for ordinary information, `featured` for static
emphasis, and `interactive` **only when a single CardAction is present**. Put the
primary CardAction in a CardTitle. It renders a native button by default; use
`asChild` for a real anchor/Next Link. Put independent controls in CardActions,
which keeps them above the stretched primary hit target. Never wrap a card
containing secondary controls inside a link or button.

## Interaction checks

- Tab to filled actions, hold pointer/Space, and inspect their distinct focus and
  pressed states. Loading/disabled actions must not activate.
- Open Sunday board games from its title or card body. Save event must toggle
  independently and must not open the card. Confirm primary and secondary actions
  work independently from the keyboard.
- Toggle the controlled mixed checkbox. Inspect the separate defaultChecked and
  disabled examples. Names, accessible state and visible glyphs must agree.
- Switch tabs using arrow keys and Tab. Focus and selection remain distinct.
- Open Event actions and activate an item. Escape dismisses and returns focus.
- Review confirmation: the first attempt takes 700 ms and fails; the second
  succeeds. Pending blocks duplicate activation and dismissal; failure remains
  readable and retryable. Show success feedback reaches the actual Sonner renderer.
- Inspect at 390 px and 320 px, with long content and 200% enlarged text. Turn on
  reduced motion and confirm loading text remains readable without spinner/pulse,
  tab springs or overlay/menu entrance motion. Switch/progress position still
  communicates the current state immediately.

Run the dedicated Storybook type check with
`pnpm --filter @groupi/web exec tsc --noEmit -p .storybook/tsconfig.json`.
The normal web tsconfig intentionally excludes stories and preview configuration.

## Material iteration

The white cut edge is a component token sourced from the existing white primitive;
it stays white in dark and custom themes. It belongs to actions, explicit featured
surfaces, photo stickers, flat cut-out labels and foreground slips/sheets. Quiet
fields and ordinary information surfaces do not acquire this edge.

The featured card and soft confirmation each show one decorative perforated
content/action seam. This is a dashed rule, with no implied tearing interaction.

MaterialStudies contains unselected alternatives, scoped to story CSS and actual
canonical Badge, Tabs and Alert components. None chooses a production default.
The Overview cut-out badges are one candidate, not final approval of status style.
Avatar samples include the existing external portrait fixture, a working initials
fallback, an overlapping stack and unchanged PresenceIndicator status vocabulary.
