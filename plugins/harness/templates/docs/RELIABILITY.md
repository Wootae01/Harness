# Reliability

## Performance budgets
> Write them **as numbers** so the agent can verify them.

| Item | Budget | How to measure |
|---|---|---|
| App startup | TODO (e.g. < 800ms) | TODO |
| Each step of a core user journey | TODO (e.g. < 2s) | TODO |

## Observability
<!-- TODO: where and how to query logs / metrics / traces. The agent must be able to query them locally. -->
- Structured logging only (invariant I-6).

## Error handling
- Catch failures at the boundary and turn them into typed errors. Never swallow them silently.

## Flaky tests
- Do not let them block merges indefinitely. Record them in `tech-debt-tracker.md` and fix them in follow-up work.
