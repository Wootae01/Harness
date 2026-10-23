# CLAUDE.md — Map of this repository

> This file is **a table of contents, not an encyclopedia**. It only says *where to look*.
> Details live in the linked documents — open them only when you need them (progressive disclosure).
> Rule: keep this file **under 200 lines** — enforced by `scripts/check-docs.mjs`.

## 0. 30-second check before starting

1. Does this task belong to an **active execution plan**? → `docs/exec-plans/active/`
2. What are the **invariants** for the area you will touch? → `ARCHITECTURE.md` §3
3. What is the product intent? → `docs/product-specs/index.md`
4. When done: `/harness:review` → `/harness:commit-message`

## 1. Core principles (details: `docs/design-docs/core-beliefs.md`)

- **Enforce invariants, leave implementation free.** Boundaries, correctness and reproducibility are enforced mechanically.
  *How* you implement inside them is up to you. (e.g. "parse at the boundary" is enforced; which library you use is not)
- **The repository is the system of record.** Knowledge that lives only in chat, heads or external docs does not exist.
  When a decision is made, record it in `docs/`.
- **When docs are not enough, promote the rule to code.** If the same review comment appears twice, turn it into a lint/test/hook.
- **When the agent gets stuck, treat it as a signal.** Not "try harder" — find what is missing (tool, guardrail, doc) and add it to the repo.
- **Prefer boring technology.** Choose stable dependencies that can be reasoned about from inside the repo.
- **Pay down tech debt a little every day.** → `/harness:cleanup`

## 2. Map — what lives where

| What you want to know | Document |
|---|---|
| Contexts & layers (4-layer), dependency direction, **invariants** | `ARCHITECTURE.md` |
| Tech stack and why it was chosen | `docs/design-docs/tech-stack.md` |
| Core beliefs / golden principles | `docs/design-docs/core-beliefs.md` |
| Design decision records (index) | `docs/design-docs/index.md` |
| Product specs (index) | `docs/product-specs/index.md` |
| Product sense — what a "good" result is | `docs/PRODUCT_SENSE.md` |
| How to write plans | `docs/PLANS.md` |
| Active / completed execution plans | `docs/exec-plans/active/`, `docs/exec-plans/completed/` |
| Known tech debt | `docs/exec-plans/tech-debt-tracker.md` |
| Quality grade per context & layer | `docs/QUALITY_SCORE.md` |
| UI & design system | `docs/DESIGN.md`, `docs/FRONTEND.md` |
| Reliability (performance budgets, observability) | `docs/RELIABILITY.md` |
| Security (secrets, permissions) | `docs/SECURITY.md` |
| Deploy targets, commands, rollback | `docs/DEPLOY.md` |
| Generated docs (DB schema, etc.) — never edit by hand | `docs/generated/` |
| External library references (llms.txt) | `docs/references/` |

## 3. Skills (harness plugin)

| Command | When |
|---|---|
| `/harness:new-screen <Name>` | Add a new screen |
| `/harness:review` | Self-review before commit (repeat until it passes) |
| `/harness:commit-message` | After review passes: split into commits and hand you the git commands (you run them) |
| `/harness:cleanup` | Clean up drift, update quality grades and debt |
| `/harness:deploy` | Deploy (only when a human invokes it; config in `docs/DEPLOY.md`) |

## 4. Mechanically enforced (harness plugin hooks)

| When | What |
|---|---|
| Before a tool runs | Blocks read/write/shell access to `.env*` (`.env.example` is allowed) |
| Before a shell command | Blocks `git commit`, `push`, `reset --hard`, `clean -f`, history rewrites — **the human commits** |
| After a file edit | Formats the file with the installed formatter |
| Session end | Writes a summary to .claude/session-logs/ (gitignored) |

If a hook blocks you, do not work around it — follow the fix instructions in its message.

## 5. Commands

```bash
node scripts/check-docs.mjs    # knowledge-base check: broken links, missing index entries, CLAUDE.md length
# TODO(stack): replace with the real commands
# <install>   install dependencies
# <dev>       run locally
# <test>      tests
# <lint>      lint + structural tests (invariants)
# <typecheck> type check
```

## 6. How to work

- **Small change**: implement → `/harness:review` → `/harness:commit-message`.
- **Large change** (many files, many sessions, or design judgment): write a plan in `docs/exec-plans/active/` first (`docs/PLANS.md`).
  Keep its progress log and decision log up to date; move it to `completed/` when done.
- **Verify it yourself.** Run the app and confirm through logs and the UI. "Should work" is not done.
- **Hand off to a human for**: product judgment, hard-to-reverse actions (deploy, data deletion, external sends), changing an invariant.
- **Keep PRs small and short-lived.** One PR = one intent.

## 7. Never

- Read, print or commit `.env` or any secret → `docs/SECURITY.md`
- Edit `docs/generated/` by hand (fix the generator instead)
- Reverse the layer dependency direction → `ARCHITECTURE.md`
- Use data that was not validated at the boundary, assuming "it probably looks like this"
- Make tests or lint pass by disabling or skipping them

## 8. Editing this map and the docs

- When you add a document, link it from its `index.md` and from this table. Unlinked documents are never found.
- Do not put details here. Only **one line + a link**.
- **Language**: English `*.md` files are the source of truth. `*.kr.md` files are Korean translations for humans —
  **do not read them**. When you change `X.md` and `X.kr.md` exists, update `X.kr.md` in the same change.
