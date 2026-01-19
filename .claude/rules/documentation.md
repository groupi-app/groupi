# Documentation Style Guide

This style guide ensures consistency across all Groupi documentation.

## File Naming

- Use `kebab-case.md` for all documentation files (lowercase with hyphens)
- Be descriptive but concise
- Examples: `architecture.md`, `auth-architecture.md`, `state-management.md`

## Document Structure

Every documentation file should follow this structure:

```markdown
# Document Title

Brief description of what this document covers (1-2 sentences).

## Table of Contents

- [Section One](#section-one)
- [Section Two](#section-two)
- [Section Three](#section-three)

## Section One

Content...

## Section Two

Content...
```

### Required Elements

1. **Title** (`#`): Single H1 heading at the top
2. **Description**: Brief overview immediately after title
3. **Table of Contents**: Required for documents with 3+ main sections
4. **Main Content**: Organized with H2 (`##`) sections

## Header Hierarchy

- `#` - Document title only (one per document)
- `##` - Main sections
- `###` - Subsections
- `####` - Sub-subsections (use sparingly)

## Code Blocks

- Always specify the language for syntax highlighting
- Use descriptive comments in code examples
- Keep examples focused and minimal

```typescript
// Good: Specify language and add helpful comments
function example() {
  return 'hello';
}
```

## Formatting Guidelines

### Lists

- Use `-` for unordered lists
- Use `1.` for ordered/sequential lists
- Indent nested items with 2 spaces

### Tables

Use tables for structured data comparison:

| Column A | Column B | Column C |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |

### Emphasis

- Use `**bold**` for important terms on first use
- Use `*italic*` for emphasis
- Use `` `code` `` for file names, function names, and technical terms

### Links

- Use descriptive link text: `[Architecture Guide](./architecture.md)`
- Avoid generic text like "click here" or "this link"

## Content Guidelines

### Be Concise

- Lead with the most important information
- Use bullet points for lists of items
- Break long paragraphs into shorter ones

### Be Consistent

- Use the same terminology throughout
- Follow established patterns in the codebase
- Reference other docs instead of duplicating content

### Code Examples

- Show practical, real-world usage
- Include both correct and incorrect patterns when helpful
- Keep examples self-contained when possible

## Quick Reference Section

For longer documents, include a "Quick Reference" section at the end with:
- Common commands
- Key patterns
- Important links

## File Organization

### `/docs/` Directory

Human-readable documentation for developers:
- `architecture.md` - System architecture overview
- `auth-architecture.md` - Authentication system details
- `state-management.md` - State management patterns
- `database-schema.md` - Database schema reference
- `testing.md` - Testing guide and patterns

### `/.claude/rules/` Directory

AI agent instructions (more directive, rule-focused):
- `architecture.md` - Architecture rules for code generation
- `testing.md` - Testing rules and patterns
- `documentation.md` - This style guide
