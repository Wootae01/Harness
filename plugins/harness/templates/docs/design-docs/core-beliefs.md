# Core beliefs & golden principles

> Agent-first operating principles. Come back here when a judgment call is unclear.
> Status: 📝 draft (harness default — edit anything you disagree with, then promote to ✅) | Last reviewed: {{DATE}}

## Core beliefs

1. **Humans steer, agents execute.** Human time and attention are the scarcest resource.
   Humans state intent, design the environment and verify outcomes.
2. **What the agent cannot see does not exist.** Decisions, agreements and taste are kept as versioned text inside the repo.
3. **Give a map, not a manual.** The entry point (CLAUDE.md) stays short; depth is reached through links.
4. **Enforce invariants, leave implementation free.** Boundaries are set centrally; autonomy is allowed inside them.
5. **Rules get promoted from docs to code.** A rule that docs alone cannot keep becomes a lint, test or hook.
6. **Getting stuck is a signal.** When the agent fails, find the missing tool, guardrail or doc and add it to the repo.
7. **Fixing is cheap, waiting is expensive.** Keep PRs small and short-lived. Track and fix flaky tests instead of letting them block.
   (This holds when agent throughput exceeds human review capacity. With low throughput, keep merge gates stricter.)

## Golden principles (keeping the code consistent)

> `/harness:cleanup` looks for drift against this list. When you add a principle, add a way to enforce it whenever possible.

| # | Principle | Why |
|---|---|---|
| G-1 | Prefer **shared utilities** over hand-rolled helpers | Keeps invariants in one place |
| G-2 | **Never guess** the shape of data. Validate at the boundary or use a typed SDK | Code built on a guessed shape breaks silently |
| G-3 | Prefer dependencies the agent can reason about inside the repo. If one is opaque, consider re-implementing the small subset you need | The agent must be able to inspect and fix it |
| G-4 | If an existing pattern is bad, do not copy it — record it as debt | Agents replicate whatever patterns already exist |
| G-5 | Record a new decision in the docs in the same PR | Prevents drift between docs and code |

<!-- TODO: add team taste here (commit message language, emoji use, review tone, ...) -->
