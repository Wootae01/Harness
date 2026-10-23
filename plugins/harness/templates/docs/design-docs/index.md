# Design docs index

> Every document in this folder must be listed here (enforced by `scripts/check-docs.mjs`).
> Status: 📝 draft | 🔍 in review | ✅ verified | 🗄️ retired (do not delete retired docs — just change their status)

| Document | Summary | Status | Last reviewed |
|---|---|---|---|
| [core-beliefs.md](core-beliefs.md) | Agent-first operating principles, golden principles (harness default — review per project) | 📝 | {{DATE}} |
| [tech-stack.md](tech-stack.md) | Tech stack and why it was chosen | 📝 | {{DATE}} |

## Template for a new design doc

```markdown
# <Title>
Status: 📝 | Written: YYYY-MM-DD | Related plan: exec-plans/...

## Context — why a decision is needed
## Decision
## Alternatives considered and why they were rejected
## Consequences — which invariants are added or changed (→ update ARCHITECTURE.md)
```
