---
name: init
description: Installs the harness into the current project — copies CLAUDE.md, ARCHITECTURE.md, the docs/ skeleton and a CI copy of check-docs, then fills them in for the project's stack. Runs only when the user invokes /harness:init directly. (KR: 하네스 설치, 초기 세팅)
argument-hint: "[stack description — omit to infer from project files or ask]"
disable-model-invocation: true
---

# /harness:init — install the harness into a project

> The shared part (this plugin) is **procedure and enforcement**; what gets copied into the project is **knowledge the project owns**.
> After copying, the project's files are the source of truth. Template changes in the plugin do not update existing projects.

## 1. Check the current state
- Determine the project root (git root, otherwise the current directory).
- If `.claude/harness.json` already exists → the harness is already installed. Show its version and ask whether to "fill in only the missing files".
- If a `CLAUDE.md` already exists → the copy step will skip it. Propose a merge in step 4.

## 2. Copy the skeleton (deterministic — use the script)
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/init-project.mjs" "<project root>"
```
- Existing files are never overwritten. Show the user the "skipped" list from the output.

## 3. Determine the stack
- If a description was given as an argument, use it.
- Otherwise infer from manifests: `package.json`, `pnpm-lock.yaml`, `build.gradle(.kts)`, `pom.xml`, `pubspec.yaml`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `*.csproj`.
- If still unknown, ask: platform (web / mobile / server), language & framework, backend, deploy target. **Never fill in guesses.**

## 4. Fill in the project docs
Find the `TODO(stack)` markers (`grep -rn "TODO(stack)"`) and fill in only what you know.
Fill **both** the English `X.md` (source of truth) and its Korean `X.kr.md` translation.

| File | What to fill |
|---|---|
| `CLAUDE.md` §5 | Real install / dev / test / lint / typecheck commands |
| `docs/design-docs/tech-stack.md` | Chosen stack, versions, reasons, rejected alternatives |
| `ARCHITECTURE.md` §2 | Actual directory layout. Candidate tools to enforce I-4 (e.g. dependency-cruiser, eslint-plugin-boundaries, ArchUnit, import-linter) |
| `docs/FRONTEND.md` | Framework, routing, how the agent verifies |
| `docs/DEPLOY.md` | Only if known. Otherwise leave the TODOs (`/harness:deploy` refuses to deploy while TODOs remain) |
| `.gitignore` | The stack's build output folders |

- If a CLAUDE.md already existed: **propose** a merge — content that fits the map becomes one line + a link; detailed content moves into the right document under `docs/` (apply only after the user confirms).
- `docs/PRODUCT_SENSE.md` and the team taste in `core-beliefs.md` are for humans to fill. Leave them empty and just point them out.

## 5. (Optional) Prompt teammates automatically
To have teammates prompted to install the harness when they open this project, confirm with the user, then merge this into the project's `.claude/settings.json`:
```json
{
  "extraKnownMarketplaces": {
    "wootae-harness": { "source": { "source": "github", "repo": "Wootae01/Harness" } }
  },
  "enabledPlugins": { "harness@wootae-harness": true }
}
```

## 6. Verify and report
```bash
node scripts/check-docs.mjs
grep -rn "TODO(stack)" CLAUDE.md ARCHITECTURE.md docs/ || true
```
```
Harness v<version> installed
- Created N / skipped M
- Filled in: ...
- Remaining TODO(stack): <file:line list>
- For humans to fill: PRODUCT_SENSE.md, team taste in core-beliefs.md
- Next: review the changes, then /harness:commit
```
