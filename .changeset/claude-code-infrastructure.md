---
'@groupi/web': minor
---

Add Claude Code infrastructure: hooks, custom skills, sub-agents, and agent team support

**Hooks** (`.claude/settings.json`):

- Auto-format edited files with prettier
- Block prohibited commands (dev servers, builds, npm/yarn)
- Lint design tokens after TSX edits
- Changeset reminder on session stop
- Enable experimental agent teams

**Custom Skills** (7 new in `.claude/skills/`):

- `convex-feature` — end-to-end backend feature development workflow
- `web-component` — atomic component architecture with design tokens
- `addon-dev` — add-on framework development process
- `cross-platform-hook` — shared hook factory pattern
- `test-convex` — Convex backend testing with test helpers
- `security-review` — security checklist for auth, authz, and data isolation
- `schema-migration` — safe schema evolution and migration patterns

**Custom Sub-agents** (6 new in `.claude/agents/`):

- `convex-expert` — backend development with Convex MCP tools
- `ui-expert` — frontend/UI with Playwright browser tools
- `test-expert` — testing across all packages
- `reviewer` — read-only code review
- `security-expert` — security analysis
- `cicd-expert` — CI/CD, GitHub Actions, deployments
