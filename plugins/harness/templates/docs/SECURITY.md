# Security

## Secrets
- Secrets live only in `.env*`. **Never commit them** (`.gitignore`).
- The agent never reads, writes or prints `.env*`. A hook enforces this (invariant I-1).
- List the required keys in `.env.example` **without values**. The agent may read and edit that file.
- Code **parses and validates env once at startup**, then uses only the validated config object (invariant I-5).

## Actions that need human confirmation
- Deploys, data deletion or migration, sending data to external services, permission or auth changes.

## Dependencies
- When you add a dependency, record why in `design-docs/`. Avoid unmaintained packages.

## Reported vulnerabilities
<!-- TODO -->
