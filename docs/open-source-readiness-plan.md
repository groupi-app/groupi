# Open Source Readiness Plan

A comprehensive plan to prepare Groupi for open-source release and enable new developers to be productive.

## Current Assessment

| Category        | Score      | Status                                  |
| --------------- | ---------- | --------------------------------------- |
| Security        | 20/100     | CRITICAL - Exposed secrets found        |
| Documentation   | 65/100     | Good technical docs, missing governance |
| CI/CD           | 85/100     | Excellent testing and automation        |
| Code Quality    | 80/100     | Strong linting, testing, formatting     |
| Governance      | 10/100     | Missing all governance files            |
| Community Ready | 20/100     | No templates or contribution guides     |
| **Overall**     | **45/100** | Needs significant work                  |

---

## Phase 1: Security Emergency (Week 1)

### 1.1 Rotate All Exposed Secrets

**Priority: CRITICAL**

The `.env.local` file was found committed to the repository with real credentials:

| Service       | Credential            | Action Required                        |
| ------------- | --------------------- | -------------------------------------- |
| Better Auth   | `BETTER_AUTH_SECRET`  | Regenerate secret                      |
| Discord OAuth | Client ID & Secret    | Regenerate in Discord Developer Portal |
| Google OAuth  | Client ID & Secret    | Regenerate in Google Cloud Console     |
| Google API    | `GOOGLE_API_KEY`      | Rotate key                             |
| Pusher        | App Secret            | Regenerate in Pusher dashboard         |
| Resend        | API Key               | Regenerate in Resend dashboard         |
| Convex        | Deployment identifier | Consider new deployment                |

**Steps:**

1. Rotate all credentials in their respective dashboards immediately
2. Update production environment variables
3. Update local `.env.local` files (do not commit)

### 1.2 Clean Git History

**Options:**

**Option A: Start Fresh Repository (Recommended)**

- Create new repository without history
- Copy current code state
- Preserves clean public history

**Option B: Rewrite History**

```bash
# Use BFG Repo-Cleaner
bfg --delete-files .env.local
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### 1.3 Enable GitHub Security Features

- [ ] Enable **Secret Scanning** in repository settings
- [ ] Enable **Dependabot Security Alerts**
- [ ] Enable **Code Scanning** with CodeQL
- [ ] Enable **Push Protection** to prevent future secret commits

### 1.4 Create SECURITY.md

**File:** `SECURITY.md`

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

**DO NOT** create a public GitHub issue for security vulnerabilities.

### How to Report

1. Email security concerns to: [security@groupi.app] (or your preferred contact)
2. Include a detailed description of the vulnerability
3. Provide steps to reproduce if possible
4. Allow up to 48 hours for initial response

### What to Expect

- Acknowledgment within 48 hours
- Regular updates on our progress
- Credit in security advisories (unless you prefer anonymity)
- Notification when the issue is resolved

### Scope

This policy applies to:

- The Groupi web application
- The Groupi mobile application
- The Groupi Convex backend
- Official npm packages under @groupi/\*

### Out of Scope

- Third-party services (Convex, Vercel, etc.)
- Social engineering attacks
- Denial of service attacks
```

---

## Phase 2: Legal & Governance (Week 2)

### 2.1 Add LICENSE File

**Recommended: MIT License**

**File:** `LICENSE`

```
MIT License

Copyright (c) 2024 [Your Name/Organization]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 2.2 Create CODE_OF_CONDUCT.md

**File:** `CODE_OF_CONDUCT.md`

Use the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) - the industry standard.

Key sections:

- Our Pledge
- Our Standards
- Enforcement Responsibilities
- Scope
- Enforcement
- Enforcement Guidelines
- Attribution

### 2.3 Create CONTRIBUTING.md

**File:** `CONTRIBUTING.md`

````markdown
# Contributing to Groupi

Thank you for your interest in contributing to Groupi! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- Convex CLI
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/groupi.git
   cd groupi
   ```
````

3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```
5. Set up Convex:
   ```bash
   npx convex dev
   ```
6. Start development:
   ```bash
   pnpm dev
   ```

## Making Changes

### Branch Naming

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Code Style

We use automated tools to maintain code quality:

```bash
pnpm check      # Run all checks (lint, type-check, format)
pnpm lint:fix   # Auto-fix linting issues
pnpm format     # Format code
```

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Scopes:** `web`, `mobile`, `shared`, `convex`, `deps`

**Examples:**

- `feat(web): add dark mode toggle`
- `fix(convex): correct event query pagination`
- `docs: update contributing guide`

Use `pnpm commit` for an interactive commit helper.

## Pull Request Process

1. Create a changeset for your changes:
   ```bash
   pnpm changeset
   ```
2. Ensure all checks pass:
   ```bash
   pnpm check
   pnpm test:run
   ```
3. Push your branch and create a PR
4. Fill out the PR template completely
5. Wait for review from maintainers

### PR Requirements

- [ ] All CI checks pass
- [ ] Changeset added (if applicable)
- [ ] Tests added/updated
- [ ] Documentation updated (if applicable)

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml) when creating issues.

Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml).

Include:

- Problem you're trying to solve
- Proposed solution
- Alternatives considered

## Questions?

- Check existing [Discussions](https://github.com/YOUR_ORG/groupi/discussions)
- Open a new discussion for general questions
- Join our community chat [link if applicable]

Thank you for contributing!

```

### 2.4 Create CODEOWNERS

**File:** `.github/CODEOWNERS`

```

# Default owners for everything

- @your-github-username

# Package-specific owners

/packages/web/ @your-github-username
/packages/mobile/ @your-github-username
/packages/shared/ @your-github-username
/convex/ @your-github-username

# Documentation

/docs/ @your-github-username
\*.md @your-github-username

# CI/CD

/.github/ @your-github-username

````

---

## Phase 3: GitHub Templates (Week 2-3)

### 3.1 Issue Templates

**Directory:** `.github/ISSUE_TEMPLATE/`

#### Bug Report Template

**File:** `.github/ISSUE_TEMPLATE/bug_report.yml`

```yaml
name: Bug Report
description: Report a bug or unexpected behavior
title: "[Bug]: "
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report a bug!
        Please fill out the sections below to help us understand and fix the issue.

  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: A clear and concise description of what the bug is.
      placeholder: Describe the bug...
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. Scroll down to '...'
        4. See error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What you expected to happen
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happened
    validations:
      required: true

  - type: dropdown
    id: platform
    attributes:
      label: Platform
      description: Where did you encounter this bug?
      options:
        - Web (Desktop)
        - Web (Mobile)
        - iOS App
        - Android App
    validations:
      required: true

  - type: input
    id: browser
    attributes:
      label: Browser/Device
      description: Browser version or device model
      placeholder: "Chrome 120, iPhone 15, etc."

  - type: textarea
    id: logs
    attributes:
      label: Relevant Logs
      description: Any console errors or logs
      render: shell

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots
      description: If applicable, add screenshots to help explain your problem

  - type: checkboxes
    id: terms
    attributes:
      label: Checklist
      options:
        - label: I have searched existing issues to ensure this is not a duplicate
          required: true
        - label: I have read the [Contributing Guide](../CONTRIBUTING.md)
          required: true
````

#### Feature Request Template

**File:** `.github/ISSUE_TEMPLATE/feature_request.yml`

```yaml
name: Feature Request
description: Suggest a new feature or enhancement
title: '[Feature]: '
labels: ['enhancement', 'triage']
body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a new feature!
        Please provide as much detail as possible.

  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: What problem does this feature solve?
      placeholder: I'm always frustrated when...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: Describe the solution you'd like
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: Describe any alternative solutions or features you've considered

  - type: dropdown
    id: platform
    attributes:
      label: Platform
      description: Which platform(s) would this feature apply to?
      multiple: true
      options:
        - Web
        - iOS
        - Android
        - All Platforms
    validations:
      required: true

  - type: textarea
    id: context
    attributes:
      label: Additional Context
      description: Add any other context, mockups, or screenshots

  - type: checkboxes
    id: contribution
    attributes:
      label: Contribution
      options:
        - label: I would be willing to help implement this feature
```

#### Issue Config

**File:** `.github/ISSUE_TEMPLATE/config.yml`

```yaml
blank_issues_enabled: false
contact_links:
  - name: Questions & Discussions
    url: https://github.com/YOUR_ORG/groupi/discussions
    about: Ask questions and discuss ideas here
  - name: Security Issues
    url: https://github.com/YOUR_ORG/groupi/security/advisories/new
    about: Report security vulnerabilities privately
```

### 3.2 Pull Request Template

**File:** `.github/PULL_REQUEST_TEMPLATE.md`

```markdown
## Description

<!-- Describe your changes in detail -->

## Related Issue

<!-- Link to the issue this PR addresses -->

Fixes #

## Type of Change

<!-- Mark the appropriate option -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] CI/CD changes

## Checklist

<!-- Mark completed items with [x] -->

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have added a changeset (`pnpm changeset`)

## Screenshots (if applicable)

<!-- Add screenshots to help reviewers understand visual changes -->

## Testing Instructions

<!-- How can reviewers test your changes? -->

1.
2.
3.

## Additional Notes

<!-- Any other information reviewers should know -->
```

---

## Phase 4: Automation & Tooling (Week 3)

### 4.1 Add Dependabot Configuration

**File:** `.github/dependabot.yml`

```yaml
version: 2
updates:
  # Root and all packages (pnpm monorepo)
  - package-ecosystem: 'npm'
    directories:
      - '/'
      - '/packages/*'
      - '/convex'
    schedule:
      interval: 'weekly'
      day: 'monday'
    commit-message:
      prefix: 'chore(deps)'
    labels:
      - 'dependencies'
    groups:
      # Group minor and patch updates together
      minor-and-patch:
        update-types:
          - 'minor'
          - 'patch'
      # Keep major updates separate for review
    open-pull-requests-limit: 10

  # GitHub Actions
  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'weekly'
    commit-message:
      prefix: 'ci'
    labels:
      - 'ci'
      - 'dependencies'
```

### 4.2 Add Stale Issue Bot

**File:** `.github/workflows/stale.yml`

```yaml
name: Close Stale Issues

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight
  workflow_dispatch:

permissions:
  issues: write
  pull-requests: write

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v9
        with:
          stale-issue-message: |
            This issue has been automatically marked as stale because it has not had recent activity.
            It will be closed in 14 days if no further activity occurs.
            If this issue is still relevant, please comment to keep it open.
          stale-pr-message: |
            This PR has been automatically marked as stale because it has not had recent activity.
            It will be closed in 14 days if no further activity occurs.
          close-issue-message: |
            This issue was closed because it has been stale for 14 days with no activity.
            Feel free to reopen if this is still relevant.
          days-before-stale: 60
          days-before-close: 14
          stale-issue-label: 'stale'
          stale-pr-label: 'stale'
          exempt-issue-labels: 'pinned,security,help wanted,good first issue'
          exempt-pr-labels: 'pinned,security'
```

### 4.3 Add Label Sync

**File:** `.github/labels.yml`

```yaml
# Bug-related
- name: bug
  color: d73a4a
  description: Something isn't working
- name: security
  color: ee0701
  description: Security vulnerability

# Feature-related
- name: enhancement
  color: a2eeef
  description: New feature or request
- name: documentation
  color: 0075ca
  description: Improvements or additions to documentation

# Status
- name: triage
  color: ededed
  description: Needs triage
- name: confirmed
  color: 0e8a16
  description: Issue confirmed
- name: wontfix
  color: ffffff
  description: This will not be worked on
- name: duplicate
  color: cfd3d7
  description: This issue or pull request already exists
- name: stale
  color: fef2c0
  description: No recent activity

# Priority
- name: 'priority: critical'
  color: b60205
  description: Critical priority
- name: 'priority: high'
  color: d93f0b
  description: High priority
- name: 'priority: medium'
  color: fbca04
  description: Medium priority
- name: 'priority: low'
  color: 0e8a16
  description: Low priority

# Contribution
- name: 'good first issue'
  color: 7057ff
  description: Good for newcomers
- name: 'help wanted'
  color: 008672
  description: Extra attention is needed

# Platform
- name: 'platform: web'
  color: 1d76db
  description: Web application
- name: 'platform: mobile'
  color: 5319e7
  description: Mobile application
- name: 'platform: backend'
  color: e99695
  description: Convex backend

# CI/Dependencies
- name: dependencies
  color: 0366d6
  description: Pull requests that update a dependency
- name: ci
  color: 006b75
  description: CI/CD related
```

**File:** `.github/workflows/labels.yml`

```yaml
name: Sync Labels

on:
  push:
    branches: [main]
    paths:
      - '.github/labels.yml'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: EndBug/label-sync@v2
        with:
          config-file: .github/labels.yml
          delete-other-labels: false
```

---

## Phase 5: Documentation Polish (Week 3-4)

### 5.1 Update README.md

Add these sections to the existing README:

```markdown
## Badges

<!-- Add at the top -->

[![CI](https://github.com/YOUR_ORG/groupi/workflows/Test/badge.svg)](https://github.com/YOUR_ORG/groupi/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Security

For security issues, please see our [Security Policy](SECURITY.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```

### 5.2 Fix Outdated Documentation

**Files to Update:**

1. **`packages/web/README.md`**
   - Remove references to Prisma, tRPC, Pusher (old stack)
   - Update to reflect current Next.js 16 + Convex architecture

2. **`convex/README.md`**
   - Expand beyond template documentation
   - Add Groupi-specific backend architecture

3. **`CHANGELOG.md`**
   - Expand with actual release history
   - Document major milestones

### 5.3 Add Getting Started Guide

**File:** `docs/getting-started.md`

Comprehensive guide for new contributors covering:

- Local development setup
- Understanding the architecture
- Common development tasks
- Troubleshooting

---

## Phase 6: Repository Settings (Week 4)

### 6.1 Branch Protection Rules

Configure for `main` branch:

- [x] Require pull request reviews before merging (1 reviewer)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
  - Required checks: `test`, `lint`, `type-check`
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

### 6.2 Repository Settings

- [ ] Enable **Discussions** for community Q&A
- [ ] Set **Topics**: `event-planning`, `react`, `nextjs`, `convex`, `react-native`, `typescript`
- [ ] Add **Website** link
- [ ] Configure **Social Preview** image
- [ ] Enable **Sponsorship** (optional)

### 6.3 Security Settings

- [ ] Enable **Private vulnerability reporting**
- [ ] Enable **Dependabot alerts**
- [ ] Enable **Dependabot security updates**
- [ ] Enable **Secret scanning**
- [ ] Enable **Push protection**

---

## Phase 7: Community Building (Week 4+)

### 7.1 Create Good First Issues

Label 5-10 issues with `good first issue`:

- Documentation improvements
- Simple bug fixes
- Minor UI enhancements
- Test coverage improvements

### 7.2 Discussion Categories

Set up GitHub Discussions:

- **Announcements** - Project updates
- **General** - Community chat
- **Ideas** - Feature brainstorming
- **Q&A** - Help and support
- **Show and Tell** - Community projects

### 7.3 Create MAINTAINERS.md

**File:** `MAINTAINERS.md`

```markdown
# Maintainers

This document lists the maintainers of the Groupi project.

## Core Maintainers

| Name        | GitHub         | Focus Area   |
| ----------- | -------------- | ------------ |
| [Your Name] | @your-username | Project Lead |

## How to Become a Maintainer

We welcome new maintainers! To be considered:

1. Make consistent, quality contributions
2. Help review pull requests
3. Assist in issue triage
4. Participate in community discussions

Contact existing maintainers to express interest.

## Maintainer Responsibilities

- Review and merge pull requests
- Triage issues
- Release new versions
- Uphold the Code of Conduct
- Guide the project direction
```

---

## Implementation Checklist

### Week 1: Security Emergency

- [ ] Rotate all exposed credentials
- [ ] Clean git history or create fresh repo
- [ ] Create `SECURITY.md`
- [ ] Enable GitHub security features

### Week 2: Legal & Governance

- [ ] Add `LICENSE` (MIT recommended)
- [ ] Create `CODE_OF_CONDUCT.md`
- [ ] Create `CONTRIBUTING.md`
- [ ] Create `.github/CODEOWNERS`

### Week 3: Templates & Automation

- [ ] Create `.github/ISSUE_TEMPLATE/bug_report.yml`
- [ ] Create `.github/ISSUE_TEMPLATE/feature_request.yml`
- [ ] Create `.github/ISSUE_TEMPLATE/config.yml`
- [ ] Create `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] Create `.github/dependabot.yml`
- [ ] Create `.github/workflows/stale.yml`
- [ ] Create `.github/labels.yml`

### Week 4: Polish & Launch

- [ ] Update `README.md` with badges and links
- [ ] Fix `packages/web/README.md`
- [ ] Fix `convex/README.md`
- [ ] Create `docs/getting-started.md`
- [ ] Configure branch protection
- [ ] Enable GitHub Discussions
- [ ] Add repository topics
- [ ] Create good first issues
- [ ] Create `MAINTAINERS.md`

### Post-Launch

- [ ] Announce on social media
- [ ] Submit to relevant directories
- [ ] Monitor and respond to initial issues
- [ ] Onboard first contributors

---

## Resources

- [Open Source Guides](https://opensource.guide/starting-a-project/)
- [GitHub Docs - Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)
- [Contributor Covenant](https://www.contributor-covenant.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
