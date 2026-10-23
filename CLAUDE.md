# CLAUDE.md — harness repository (developing the shared harness)

> This repository is **the harness itself, not a project**. It is a Claude Code plugin marketplace,
> and the `harness` plugin is installed into each project. Usage: `README.md`.

## Layout

| Path | What | Changing it affects |
|---|---|---|
| `.claude-plugin/marketplace.json` | Marketplace definition | Install address |
| `plugins/harness/.claude-plugin/plugin.json` | Plugin definition, **version** | User updates |
| `plugins/harness/hooks/hooks.json` | Hook registration | **Every installed project, immediately** |
| `plugins/harness/scripts/` | Hook scripts (protect-env, git-guard, format) | **Every installed project, immediately** |
| `plugins/harness/skills/` | Procedures (skills), `/harness:<name>` | **Every installed project, immediately** |

## Shared / project boundary (invariants of this repo)

- **The harness is safety only.** Hooks that prevent damage (secrets, irreversible git) and `/harness:commit`.
  Workflow conveniences go in a separate plugin, not here. Add a rule only after a real failure shows it is needed.
- **No stack-specific values in skills or scripts.** Commands come from the project's own CLAUDE.md;
  tools like formatters are used only if the project already has them installed.
- Hook messages must not reference project docs that may not exist (no `ARCHITECTURE.md`, `docs/...`).
- Hooks never block work when they fail — except the intentional blocks of protect-env and git-guard (exit 2).

## Language

- English `*.md` (and `SKILL.md`) is the source of truth that agents read. `*.kr.md` is the Korean translation for humans — **do not read it**.
- When you change `X.md` and `X.kr.md` exists, update `X.kr.md` in the same change. Keep headings 1:1.
- Agent-facing script messages (hook block messages) are in English. Human-facing output (README) is in Korean.

## Verification

```bash
claude plugin validate .                                   # marketplace + plugin manifests
claude --plugin-dir plugins/harness                        # run a session with the local plugin, no install
```

## Release

- To ship changes to skills or scripts, bump `version` in `plugin.json`.
  If the version stays the same, users are not updated.
- Commit messages: `feat(skills): ...`, `fix(hooks): ...`, `docs: ...`
