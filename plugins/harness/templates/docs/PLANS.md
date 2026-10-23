# How to write plans

> Plans are first-class artifacts. They are stored in the repo, versioned, and picked up by the agent in the next session.

## When to write an execution plan

| Situation | Plan |
|---|---|
| 1–3 files, finished within one session | A short plan in your head / in the conversation is enough |
| Many sessions, many contexts, design judgment, migrations | **Write an execution plan** in `docs/exec-plans/active/` |

## Execution plan template

```markdown
# <Goal in one line>
Status: 🟨 in progress | Started: YYYY-MM-DD | Related spec: product-specs/...

## Goal and done criteria
- [ ] Verifiable done criterion 1
## Out of scope
## Steps
- [ ] 1. ...
- [ ] 2. ...
## Progress log  (append at the bottom every session)
- YYYY-MM-DD: what was done / what blocked / what is next
## Decision log
- YYYY-MM-DD: <decision> — reason: ... / rejected alternatives: ...
## Debt found  (→ move to tech-debt-tracker.md)
```

## Rules
- Update the **progress log** before the session ends. The next agent continues from that log alone.
- When the plan is finished, move it to `completed/` and set its status to ✅.
- If an architectural decision comes up during a plan, promote it to `design-docs/` and only link it from the plan.
