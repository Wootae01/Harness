---
name: usage
description: Shows Claude Code token usage split by work phase (explore, implement, verify, chat, subagents) from the local transcripts, plus cost totals from ccusage. Use when the user runs /workflow:usage or asks how many tokens or how much cost their sessions used. (KR: 토큰 사용량, 사용량, 비용)
argument-hint: "[all] [<N>d]"
disable-model-invocation: true
---

# /workflow:usage — where the tokens went

## 1. Per-phase table
Run, passing the user's arguments through unchanged:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/usage.mjs" $ARGUMENTS
```
- No arguments: current project, last 7 days. `all`: every project. `30d`: last 30 days. They combine (`all 30d`).
- Show the output **as is** (it is already a table). Do not recompute or reformat it.

## 2. Cost totals (optional)
The table has tokens, not money. For cost, run ccusage for the same number of days:
```bash
npx -y ccusage@latest daily --since <YYYYMMDD>
```
- `<YYYYMMDD>` = today minus the days used above.
- ccusage counts **all projects**; say so if the table was for one project.
- If `npx` is missing or the command fails, skip this part and say why in one line.

## 3. Read it for the user
In two or three sentences in the user's language: which phase used the most, and one concrete observation
(e.g. most tokens are cache reads from long sessions, so starting fresh sessions or `/compact` earlier would help).
The phase split is an estimate from which tools each reply called — say that if the user leans on exact numbers.
