# Sticker-book material review

October 24, 2026. This records the user's feedback on the actual Soft lift
gallery, before application-wide migration. It supplements #420; it does not
approve the gallery or authorize unrelated page restructuring.

## Design test

For each component, ask: **“How does this component design align with our design
language?”** A physical explanation must account for its silhouette, edge,
depth, or interaction. Calling an ordinary rectangle “paper” after the fact is
insufficient. Where the explanation remains weak, show alternatives together.

Groupi's page is an album ground. Featured identity and actions are cut-out
stickers. Reading and writing live on quieter paper surfaces. A few familiar
controls remain functional exceptions; they need not pretend to be paper.

- A sticker's cut edge stays genuinely white in light, dark, and custom themes.
  The earlier `bg-elevated` alias erased this distinction in dark mode.
- Themed fills, readable ink, and shallow backing remain separate from that edge.
  Buttons depress; passive content stays still. No random rotation of reading text.
- Perforations mark a meaningful boundary within an object, such as content and
  its action area. They do not surround writable fields or divide every row.
  They remain decorative and imply no tearing, dragging, or dismissal gesture.
- Existing Geologica titles and Inter utility text remain. Expressiveness comes
  from their hierarchy and the material composition, without a new font palette.

## Component decisions

“Retain” describes a defensible existing treatment. “Refine” identifies the
current gallery iteration. “Selected” records an explicit user visual decision.

| Component                          | Alignment and decision                                                                                                                                                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filled Button                      | **Refine:** die-cut action sticker, persistent white edge, colored backing. Preserve hover depression, smooth color transition and stable text polarity.                                                                                                   |
| Outline / ghost / link actions     | **Retain:** printed utility rather than another raised object. Distinct keyline, hover patch, underline and focus communicate their jobs. Cancel needs no sticker rim.                                                                                     |
| Icon actions / action menu trigger | **Retain:** printed tool mark with a reachable hit area and contextual name. Principal Add actions may be filled stickers; every ellipsis need not be.                                                                                                     |
| Badge / status                     | **Selected:** flat cut-out labels. Compact semantic fill, readable glyph/text and a crisp white cut edge; no action backing or lift.                                                                                                                       |
| Input                              | **Retain:** a writable blank, with a calm sunken fill, rounded frame and strong focus/error feedback. Perforation or a white action rim would obscure that job.                                                                                            |
| Textarea                           | **Retain:** the same writing family at a larger scale. Avoid decorative ruling behind user text or a separate notebook-field vocabulary.                                                                                                                   |
| Label / helper / error text        | **Retain:** printed prompts and corrections next to their controls. Consistent ink weight and an explicit error glyph matter more than ornament.                                                                                                           |
| Checkbox                           | **Retain:** an ink-marked checklist box. Check and Minus remain crisp, correctly announced and stable in size.                                                                                                                                             |
| Switch                             | **Retain as a pragmatic exception:** recognizable mechanical slider. Its end position and label explain the persistent setting; a fake paper toggle would add learning cost.                                                                               |
| Tabs                               | **Selected:** attached index tabs. The selected tab joins its paper content panel; inactive destinations remain distinct, with visible keyboard focus and responsive wrapping.                                                                             |
| Progress                           | **Retain:** a filled progress strip with honest value semantics. Stage divisions require actual stages; decorative perforated ticks would imply structure that does not exist.                                                                             |
| Skeleton                           | **Retain:** temporary content silhouettes, not finished stickers. Keep quiet geometry and remove pulse under reduced motion.                                                                                                                               |
| Avatar                             | **Refine:** a photo sticker is a strong identity metaphor. Show a white cut edge around both portrait and initials, including a compact stack in dark mode.                                                                                                |
| Presence / status indicator        | **Retain contracts:** an availability seal may overlay the portrait, but inline status also needs a readable label. Do not consolidate distinct away/idle/busy/dnd models as a styling change.                                                             |
| Heading                            | **Retain and judge in composition:** Geologica carries the printed editorial voice. Page, section and content emphasis should differ; document rank remains independent of visual size.                                                                    |
| StickerIcon / empty-state cue      | **Refine:** one subject-relevant illustration sticker, with a white cut edge and readable glyph. Decorative cues stay static and never acquire button behavior.                                                                                            |
| Quiet Card                         | **Retain selectively:** a stable paper grouping where a boundary improves reading. Unboxed content is also valid; a card around every paragraph is not the design language.                                                                                |
| Featured Card                      | **Refine:** a selected cut-out with persistent white edge and shallow backing. A compact attached category label and one meaningful footer seam can strengthen the material.                                                                               |
| Interactive Card                   | **Retain semantics, refine edge:** a destination sticker with an arrow visible at rest. Its primary action depresses; independent inner actions stay separate.                                                                                             |
| Dropdown menu                      | **Refine:** compact floating action slip, themed interior and white cut edge. Icons and genuine action groups supply hierarchy; do not perforate every item.                                                                                               |
| Dialog                             | **Refine:** foreground working sheet with a distinct cut edge and title. Existing overlay establishes modality; the sheet needs no button-like backing or motion.                                                                                          |
| Confirmation                       | **Refine:** decision sheet with one quiet seam between explanation and actions. Pending/error/retry context remains readable and stable; danger is not celebratory.                                                                                        |
| Alert                              | **Selected:** annotation strip. Quiet semantic fill and a narrow ink edge keep the notice close to its task without a raised card or attached sticker.                                                                                                     |
| Toast                              | **Refine:** a compact floating result label with a cut edge and semantic glyph. Preserve notification delivery, announcements, actions and dismissal; no perforation or confetti.                                                                          |
| EmptyState                         | **Refine:** meaningful illustration sticker, clear heading and one next action. The previous soft gray circle removed too much identity. It needs no enclosing card by default.                                                                            |
| LoadingState                       | **Retain as honest status:** a physical metaphor adds little. A compact readable label and real content silhouettes are enough; do not invent a detachable loading artifact.                                                                               |
| List template / section layout     | **Review in composition:** album ground with one clear featured object and quieter supporting content. Repeated equal-weight gallery sections are documentation, not a page-layout recommendation. Feature restructuring retains its separate review gate. |
| PaperDivider                       | **Refine:** reusable solid/perforated seam. Decorative by default; semantic orientation only when the separator carries information. No pointer capture or extra reading-order noise.                                                                      |

## Selected material directions

On October 24 the user selected all three directions from the actual-component
comparison:

1. **Status:** flat cut-out labels.
2. **Tabs:** attached index tabs.
3. **Alerts:** annotation strips.

Promote these into the existing canonical opt-in components, rather than keeping
selected styling in a gallery-only implementation. The review story identifies
these selections; rejected alternatives may remain inside an explicit comparison
disclosure. Keep the separate long-label stress example available.

This selects those three component treatments. It does not imply approval of the
entire gallery or start application-wide migration or Groups restructuring.

Validate the refinements in light/dark/custom themes, actual overlays, keyboard
focus, 320/390 px layouts, enlarged text and reduced motion. Recheck white edges
and the prior hover/text-color regressions explicitly before presenting the update.

## Icons carry meaning

The user also requested icons paired with buttons and labels whenever the content
has a clear, familiar pictogram. Treat these as semantic recognition cues, not
ornaments added to every string.

- Keep visible text. Use familiar pairs such as Create/Plus, Save/Save, Remove/Trash,
  Edit/Pencil, Location/MapPin, Events/Calendar, People/Users and Tools/Wrench.
- Distinguish intent: saving a draft and bookmarking an event should not share a
  misleading pictogram. Keep the same meaning/icon pairing across contexts.
- Set icons explicitly through existing Button props or Label/Tab composition.
  Never choose an icon by parsing translated or user-authored label strings.
- **No icons in headers/headings.** Keep page, section and content titles free of
  glyph ornaments; destination arrows belong beside an action or in its content
  area, not inside a heading. An action label is not permission to decorate every
  nearby text element.
- Use consistent Lucide sizing and stroke weight, inherit readable text color,
  and keep decorative glyphs hidden from assistive technology. Existing accessible
  names, pending feedback, focus and touch targets remain unchanged.
- Loading replaces an action icon with its progress cue. Quiet utility actions
  can have icons without acquiring raised sticker styling. Do not invent a weak
  symbol for an ambiguous label or remove its text at narrow widths.
- Generic labels such as “Event name,” “Details,” and preview/debug actions do not
  need invented symbols. Prefer a smaller number of strong pairings over blanket
  icon coverage. Labels such as Location and Save have familiar, useful cues.

The current gallery demonstrates this rule; broader caller adoption remains part
of the design-system usage migration after visual approval.
