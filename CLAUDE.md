# CLAUDE.md — harness repository (developing the shared harness)

> This repository is **the harness itself, not a project**. It is a Claude Code plugin marketplace
> with two plugins that are installed into each project. Usage: `README.md`.

## Layout

| Path | What | Changing it affects |
|---|---|---|
| `.claude-plugin/marketplace.json` | Marketplace definition (lists both plugins) | Install address |
| `plugins/*/.claude-plugin/plugin.json` | Plugin definition, **version** | User updates |
| `plugins/harness/` | **Safety**: hooks protect-env, git-guard, format + `/harness:commit` | **Every installed project, immediately** |
| `plugins/workflow/` | **Convenience**: SessionStart branch context + `/workflow:handoff`, `/workflow:usage` | **Every installed project, immediately** |
| `plugins/*/tests/` | Regression tests (`node:test`) | — |

## Shared / project boundary (invariants of this repo)

- **harness is safety only.** Hooks that prevent damage (secrets, irreversible git) and `/harness:commit`.
  Workflow conveniences go in `workflow`, which may change often. Add a rule only after a real failure shows it is needed.
- **No stack-specific values in skills or scripts.** Commands come from the project's own CLAUDE.md;
  tools like formatters are used only if the project already has them installed.
- Hook messages must not reference project docs that may not exist (no `ARCHITECTURE.md`, `docs/...`).
- **Safety hooks fail closed.** If protect-env or git-guard cannot inspect a call (unreadable input, missing fields, an exception),
  they block it (exit 2) and say the hook may be broken. A hook that is not a safety check (format, workflow's session-context) never blocks.
- When you change a hook or find a command it misses, add the case to `plugins/<plugin>/tests/` first.
- Branch convention `<type>/<issue#>-<desc>` is read by `plugins/workflow/scripts/branch.mjs`; the handoff skill and `/harness:commit` follow the same rule.
- Borrowed code keeps its license: `plugins/workflow/LICENSE.mattpocock` covers the handoff skill.

## Language

- English `*.md` (and `SKILL.md`) is the source of truth that agents read. `*.kr.md` is the Korean translation for humans — **do not read it**.
- When you change `X.md` and `X.kr.md` exists, update `X.kr.md` in the same change. Keep headings 1:1.
- Agent-facing script messages (hook block messages, session context) are in English. Human-facing output (README, usage table) is in Korean.

## Verification

```bash
claude plugin validate .                                   # marketplace + plugin manifests
node --test "plugins/*/tests/*.test.mjs"                   # all regression tests (Node 22 needs the quoted glob)
node plugins/workflow/scripts/usage.mjs all 30d            # usage table on the real transcripts
claude --plugin-dir plugins/harness --plugin-dir plugins/workflow   # run a session with the local plugins, no install
```

## Release

- To ship changes to a plugin, bump `version` in **that plugin's** `plugin.json`.
  If the version stays the same, users are not updated.
- Commit messages: `feat(workflow): ...`, `fix(hooks): ...`, `docs: ...`
