# Quality score

> Tracks grades and gaps per context × architecture layer. Updated by `/harness:cleanup`.

## Grading

| Grade | Meaning |
|---|---|
| A | All invariants enforced, tests cover the core journeys, docs are current |
| B | Small gaps, tracked as debt |
| C | Meaningful gaps in tests or docs |
| D | Severe drift. Cleanup comes before new features |

## Current state

| Context | Domain | Application | Infrastructure | Presentation | Docs | Last graded |
|---|---|---|---|---|---|---|
| _(add contexts as they appear)_ | | | | | | |

## The harness itself

| Item | Grade | Gap |
|---|---|---|
| Invariant enforcement | C | Only 5 of the 11 invariants in ARCHITECTURE.md are enforced (I-4–I-9 get promoted once the stack is decided) |
| Knowledge base | B | Skeleton only |
