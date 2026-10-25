# Documentation style

Write concise repository documentation that helps readers understand behavior,
configure the project, or make a technical decision.

## Table of Contents

- [Content and accuracy](#content-and-accuracy)
- [Structure and formatting](#structure-and-formatting)
- [Validation](#validation)

## Content and accuracy

- Lead with the document's purpose. Use direct factual prose and concrete headings.
- Remove decorative emojis, promotional claims, generic filler, and repeated
  summaries. Keep useful functionality descriptions, prerequisites, limitations,
  warnings, security/privacy caveats, and architecture rationale.
- Preserve functional emoji examples and status meanings. Use words for prose
  status labels so the meaning remains clear without symbols.
- Check commands and runtime requirements against manifests, configuration, and
  current source. Link to a source inventory when copying a changing count or
  version would add maintenance without helping the reader.
- Distinguish current source, proposed work, published packages, and verified
  deployments. A passing unit test or merged PR does not prove deployed behavior.
- Preserve dated verification records and historical changelogs as history.
  Record newer evidence separately; keep unresolved gates visible.
- Keep each subject in its maintained source and link to it from entry points.
  Update generated documents through their generator rather than editing copies.

## Structure and formatting

- Retain the existing Markdown or MDX format and repository destination.
- Use descriptive `kebab-case.md` names for new guides.
- Use one H1, H2 for main sections, and H3/H4 only where the hierarchy helps.
- Include a brief description after the title and a table of contents for guides
  with three or more main sections. Keep headings and TOC anchors in sync.
- Use lists for parallel items or steps, tables for comparisons, and prose for
  explanations. Avoid duplicating the same information across these forms.
- Use `-` for unordered lists and numbered lists for sequences.
- Specify code fence languages. Keep examples focused, runnable where intended,
  and consistent with current types, permissions, and error behavior.
- Use inline code for commands, paths, functions, and variables. Use emphasis
  sparingly and descriptive link text, such as `[Architecture](../../docs/architecture.md)`.
- Avoid em dashes, canned contrasts, marketing superlatives, and enthusiasm that
  adds no information.

## Validation

Format changed files with `pnpm exec prettier --write <changed-files>`. Check
relative links and incoming anchors after heading changes. Run applicable
reference/content freshness checks and review the full diff for changed
technical meaning. Follow [script policy](scripts.md) for builds and runtimes;
record unavailable render or behavior checks as unverified.
