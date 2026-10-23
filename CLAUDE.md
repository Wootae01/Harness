# CLAUDE.md — harness repository (developing the shared harness)

> This repository is **the harness itself, not a project**. It is a Claude Code plugin marketplace,
> and the `harness` plugin is installed into each project. Usage: `README.md`.

## Layout

| Path | What | Changing it affects |
|---|---|---|
| `.claude-plugin/marketplace.json` | Marketplace definition | Install address |
| `plugins/harness/.claude-plugin/plugin.json` | Plugin definition, **version** | User updates |
| `plugins/harness/hooks/hooks.json` | Hook registration | **Every installed project, immediately** |
| `plugins/harness/scripts/` | Hook scripts, check-docs, init-project | **Every installed project, immediately** |
| `plugins/harness/skills/` | Procedures (skills), `/harness:<name>` | **Every installed project, immediately** |
| `plugins/harness/templates/` | Skeleton **copied once** into a project | Only projects initialized afterwards |

## Shared / project boundary (invariants of this repo)

- **No stack-specific values in skills or scripts.** Commands, paths and deploy targets are read from project docs
  (`CLAUDE.md` §5, `ARCHITECTURE.md` §2, `docs/DEPLOY.md`).
  `skills/` and `scripts/` must not contain `TODO(stack)` placeholders.
- **`TODO(stack)` lives only in `templates/`.** `/harness:init` fills it per project.
- Template dates are written as `{{DATE}}` (replaced at init).
- Every path a template references must exist in the project after init (check-docs verifies this).
- Hooks never block work when they fail — except protect-env's intentional block (exit 2).

## Language

- English `*.md` (and `SKILL.md`) is the source of truth that agents read. `*.kr.md` is the Korean translation for humans — **do not read it**.
- When you change `X.md` and `X.kr.md` exists, update `X.kr.md` in the same change. Headings must stay 1:1 (check-docs compares heading counts).
- Agent-facing script messages (hook block messages, check-docs errors) are in English. Human-facing output (session summary, README) is in Korean.

## Verification

```bash
claude plugin validate .                                   # marketplace + plugin manifests
grep -rn "TODO(stack)" plugins/harness/skills/*/SKILL.md plugins/harness/scripts   # only references, no placeholders
# init rehearsal: install into an empty temp folder and check that check-docs passes
node plugins/harness/scripts/init-project.mjs <tmp> && node plugins/harness/scripts/check-docs.mjs <tmp>
claude --plugin-dir plugins/harness                        # run a session with the local plugin, no install
```

## Release

- To ship changes to skills, scripts or templates, bump `version` in `plugin.json`.
  If the version stays the same, users are not updated.
- Commit messages: `feat(skills): ...`, `fix(hooks): ...`, `docs(templates): ...`
