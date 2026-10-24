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
current gallery iteration. “Compare” remains an explicit user decision.

| Component                          | Alignment and decision                                                                                                                                                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filled Button                      | **Refine:** die-cut action sticker, persistent white edge, colored backing. Preserve hover depression, smooth color transition and stable text polarity.                                                                                                   |
| Outline / ghost / link actions     | **Retain:** printed utility rather than another raised object. Distinct keyline, hover patch, underline and focus communicate their jobs. Cancel needs no sticker rim.                                                                                     |
| Icon actions / action menu trigger | **Retain:** printed tool mark with a reachable hit area and contextual name. Principal Add actions may be filled stickers; every ellipsis need not be.                                                                                                     |
| Badge / status                     | **Compare:** a status ink stamp and a flat cut-out label are both plausible. Current pastel pills were generic; do not assume all status and category labels have the same material role. Show identical states in both treatments.                        |
| Input                              | **Retain:** a writable blank, with a calm sunken fill, rounded frame and strong focus/error feedback. Perforation or a white action rim would obscure that job.                                                                                            |
| Textarea                           | **Retain:** the same writing family at a larger scale. Avoid decorative ruling behind user text or a separate notebook-field vocabulary.                                                                                                                   |
| Label / helper / error text        | **Retain:** printed prompts and corrections next to their controls. Consistent ink weight and an explicit error glyph matter more than ornament.                                                                                                           |
| Checkbox                           | **Retain:** an ink-marked checklist box. Check and Minus remain crisp, correctly announced and stable in size.                                                                                                                                             |
| Switch                             | **Retain as a pragmatic exception:** recognizable mechanical slider. Its end position and label explain the persistent setting; a fake paper toggle would add learning cost.                                                                               |
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
| Alert                              | **Compare:** quiet annotation strip versus an attached note with a status marker. The current raised panel is generic and too bulky. Show the same corrective message in both.                                                                             |
| Toast                              | **Refine:** a compact floating result label with a cut edge and semantic glyph. Preserve notification delivery, announcements, actions and dismissal; no perforation or confetti.                                                                          |
| EmptyState                         | **Refine:** meaningful illustration sticker, clear heading and one next action. The previous soft gray circle removed too much identity. It needs no enclosing card by default.                                                                            |
| LoadingState                       | **Retain as honest status:** a physical metaphor adds little. A compact readable label and real content silhouettes are enough; do not invent a detachable loading artifact.                                                                               |
| List template / section layout     | **Review in composition:** album ground with one clear featured object and quieter supporting content. Repeated equal-weight gallery sections are documentation, not a page-layout recommendation. Feature restructuring retains its separate review gate. |
| PaperDivider                       | **Refine:** reusable solid/perforated seam. Decorative by default; semantic orientation only when the separator carries information. No pointer capture or extra reading-order noise.                                                                      |

## Alternatives to review together

The actual-component Material Studies story should compare three decisions:

1. **Status:** compact ink stamp versus flat die-cut label, using the same states.
2. **Tabs:** attached index tabs versus quiet ink-underline navigation, using the
   same destinations and a long label at narrow widths.
3. **Alerts:** annotation strip versus attached note, using the same error and
   correction text.

These are proposals, not additional application defaults. Keep the choice set
small; do not ask for a separate visual vote on every label and primitive.

Validate the refinements in light/dark/custom themes, actual overlays, keyboard
focus, 320/390 px layouts, enlarged text and reduced motion. Recheck white edges
and the prior hover/text-color regressions explicitly before presenting the update.
