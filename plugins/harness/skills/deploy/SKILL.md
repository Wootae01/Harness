---
name: deploy
description: Deploys in the order pre-checks → human confirmation → deploy → post-deploy verification. Because it is a hard-to-reverse external action, it runs only when the user invokes /harness:deploy directly. (KR: 배포)
argument-hint: "[environment: staging | production]"
disable-model-invocation: true
---

# /harness:deploy

> A deploy is a hard-to-reverse external action. Run it **only when every pre-check passes and a human confirms**.
> This skill defines only the **procedure**. Targets, commands, allowed branches and rollback come from the project's `docs/DEPLOY.md`.

## 0. Read the project config
- Read `docs/DEPLOY.md`. If it is missing or a required field is still `TODO`, **do not deploy** — report what is missing.
  Never invent commands.

## 1. Confirm the target
- Use the environment from the argument. If none, assume `staging`; `production` must always be stated explicitly.
- If the environment is not in the DEPLOY.md environments table, stop.

## 2. Pre-checks — stop if any one fails
| Check                 | How                                                                                            |
|-----------------------|------------------------------------------------------------------------------------------------|
| Working tree is clean | `git status --short` must be empty                                                             |
| Allowed branch        | `git branch --show-current` ↔ DEPLOY.md environments table                                     |
| In sync with remote   | `git fetch && git status -sb`                                                                  |
| Knowledge base        | `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-docs.mjs"`                                          |
| Lint / types / tests  | Project CLAUDE.md §5                                                                           |
| Build                 | DEPLOY.md § Build                                                                              |
| Required env keys     | Compare the key list in `.env.example` with DEPLOY.md's config location (never look at values) |
| Migrations            | If DB migrations are pending, get separate confirmation                                        |

## 3. Human confirmation
Show the following and move on **only after an explicit "go"**.
```
Target: <env>  Commit: <sha> <subject>
Changes since last deploy: <git log --oneline <last-tag>..HEAD>
Pre-checks: all ✓
Rollback: <DEPLOY.md § Rollback>
```

## 4. Deploy
- Run the command from DEPLOY.md § Deploy commands.
- Read the output to the end. If it fails, do not retry — summarize the log and report.
- On success, tag it: `git tag deploy/<env>/<YYYYMMDD-HHMM>` (push only after confirmation).

## 5. Post-deploy verification
- Run the health check and smoke test from DEPLOY.md § Verification.
- Check that the performance budgets in `docs/RELIABILITY.md` are not exceeded.
- If something is wrong → present the DEPLOY.md § Rollback command and ask the human. Never roll back automatically.

## 6. Record
- Report the result (env, sha, time, verification result) to the user.
- If anything in the procedure got stuck, propose fixing DEPLOY.md.
