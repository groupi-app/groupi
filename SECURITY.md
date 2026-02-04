# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

**Please DO NOT create a public GitHub issue for security vulnerabilities.**

### How to Report

1. Use GitHub's private vulnerability reporting feature at the Security tab
2. Or email security concerns to the maintainers directly
3. Include a detailed description of the vulnerability
4. Provide steps to reproduce if possible

### What to Expect

- Acknowledgment within 48 hours
- Regular updates on our progress
- Credit in security advisories (unless you prefer anonymity)
- Notification when the issue is resolved

### Scope

This policy applies to:

- The Groupi web application (`packages/web`)
- The Groupi mobile application (`packages/mobile`)
- The Groupi Convex backend (`convex/`)
- The shared package (`packages/shared`)

### Out of Scope

- Third-party services (Convex Cloud, Vercel, etc.)
- Social engineering attacks
- Denial of service attacks
- Issues in dependencies (please report to upstream maintainers)

## Security Best Practices for Contributors

- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Run `pnpm check` before submitting PRs
- Review the `.env.example` file for required variables
