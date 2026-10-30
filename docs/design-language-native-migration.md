# Native design-language implementation (#428)

October 24, 2026. Native source adaptation follows the approved web material contracts. This is source/test evidence, not rendered iOS/Android acceptance. First batch `f467633f`; follow-up `44065049` is based on integrated web source `de67671b`.

## Coverage and disposition

The native migration inventory contains 140 component and 80 route TSX entries. All 220 were included in source/AST scans for primary-action bypasses, press scaling, heading/icon nesting, and derived-subtle fills with forced white children. Contextual source review covered the theme adapter, UI primitives, atoms, molecules, templates and representative Event, creation, Groups, invitation, discussion, settings, authentication and profile callers. This does not mean all 220 screens were visually reviewed.

- The adapter now consumes shared `resolveThemePresentation` and the shared white sticker-edge token. Custom theme tokens exposed to native consumers are resolved; existing persisted preference/override formats remain unchanged. Twelve bundled-theme mappings and custom pale fill/ink pairing are exercised.
- Filled Buttons retain white cut edges and a shallow resolver-colored backing. RN 0.83's installed `ViewStyle.boxShadow` type supports the implementation; Android's project explicitly enables the new architecture. Press compresses the backing and translates only when reduced motion is off. Quiet variants stay quiet. Caller style callbacks and functional children receive native pressed state. Initial unavailable backing variables fall back to valid transparent color.
- Loading always disables activation even with `disabled={false}`, exposes busy state, retains action identity and stops ActivityIndicator animation under reduced motion. Skeleton/typing/logo loops become static under reduced motion and cancel animations on cleanup.
- Native writable fields now provide focus/error borders and retain caller focus/blur callbacks and labels/hints. Input minimum height replaces fixed height. Textarea uses the writable surface/radius rather than shadowed generic framing.
- Cards are static quiet surfaces. Removing nested slot horizontal padding corrects double padding without changing page tasks. Badges/roles/status labels are flat; avatars and overlays retain white cut edges. Native tabs use attached index framing, with no moving highlight. Touch targets and wrapping are retained.
- Progress forwards the same bounded value and custom maximum to accessibility and visual indication; zero is truly zero. Primary progress color and immediate reduced-motion updates are retained.
- Native toasts have success/error/warning/info icons, neutral message text, complete polite announcements and preserved actions. The row is explicitly bounded to viewport minus 32px, capped at 512px, so a centered library wrapper cannot collapse its flex text. A 320px/200% font-scale regression keeps the full long message and width 288px.
- A decorative PaperDivider marks the canonical AlertDialog content/action seam only. OS `Alert` confirmations remain native OS UI. No indiscriminate dashed separators or page restructuring were added.
- Geologica loads from the existing local TTF through the already-installed expo-font package. Splash hiding waits for font success/error; setup cleanup is preserved. Heading variants/CardTitle use it. No Inter TTF exists locally, so body text intentionally keeps the platform font; no network download or dependency addition was made.
- AST scans found 15 primary-colored Pressable bypasses: 11 filled actions across 8 page/feature files now consume canonical Button; 3 radio choices and 1 tab choice remain quiet selected controls. All five active-scale overrides were removed. Selected permission/reminder/date controls, profile camera ink, organizer label/star, add-on completion labels and tab labels were paired with appropriate semantic foregrounds. Media-overlay whites remain on their intentional dark scrims.
- No icon nested directly in heading Text was found in the complete AST scan. No new heading icons were added. SectionHeader now uses a semantic heading variant.

## Verification

- First native batch: full `pnpm check`, token lint and 597 tests/80 files passed.
- Follow-up: 605 mobile tests/81 files passed. Includes theme mappings, progress custom-max/zero, busy/disabled truth, render-prop/caller-style forwarding, reduced-motion loading, toast announcements/actions and narrow long-message geometry. Existing invitation, ownership, Groups, Event and account suites remain green.
- `pnpm lint:tokens` passes with the established 30 warnings in three unrelated web files; no native token exemptions were introduced.
- Full integrated `pnpm check` passed on the final follow-up source after syncing `de67671b` (log `/tmp/native-parity-integrated-check.log`). No native build, install, simulator launch or server was performed.

## Concrete acceptance blockers

No unresolved source implementation blocker is known in this batch. Native runtime acceptance remains blocked by the absence of a verified running native app/device/simulator session; earlier read-only Apple tooling unexpectedly began setup and was canceled. Consequently actual iOS/Android box-shadow rendering, touch/scroll behavior, font scaling, keyboards, toast wrapping, dark/custom themes, OS reduced-motion changes, VoiceOver/TalkBack and focus return still require supported runtime verification. The unit geometry check validates inputs and text preservation; it does not substitute for device text layout.

Do not mark #428 complete or claim native visual acceptance. Page restructuring remains the later feature review, beginning with Groups.
