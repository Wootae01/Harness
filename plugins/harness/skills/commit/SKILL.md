---
name: commit
description: Prepares reviewed changes for commit — splits them by intent, writes Conventional Commits messages, and hands the exact git commands to the human. The agent never runs git commit or push itself. Use when the user runs /harness:commit or asks for a commit or commit message. (KR: 커밋, 커밋 준비, 커밋 메시지)
argument-hint: "[message hint]"
---

# /harness:commit — prepare commits; the human runs them

> Invariant I-11: **the agent never commits or pushes.** The git-guard hook blocks it.
> This skill does everything up to that point and hands over commands the human can copy and run.

## 0. Preconditions
- If this is not a git repository, stop and tell the user (`git init` is theirs to run).
- If `/harness:review` has not passed for these changes, run `/harness:review` first.
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-docs.mjs"` and the lint / test from the project's CLAUDE.md §5 must pass.

## 1. Block secrets (invariant I-1)
- If `git status --short` shows `.env` (except `.env.example`), `*.pem`, `*.key` or `credentials*`, **stop** and tell the user.
- If the diff contains token-like strings (`sk-`, `AKIA`, `-----BEGIN`, `password=`), stop and tell the user.

## 2. Split by intent
- One commit = one intent. If a feature, a refactor and doc cleanup are mixed, plan them as separate commits.
- List the files for each commit. A doc change goes in the **same commit** as the code that made it necessary (G-5).
- Do not stage anything unless the user asks — the human decides what goes in.

## 3. Message format
```
<type>(<scope>): <what, imperative, ≤ 50 chars>

<why — context and reason. The diff already says what was done>

Refs: docs/exec-plans/active/<plan>.md   (if applicable)
```
- type: `feat` `fix` `refactor` `docs` `test` `chore` `perf` `build` `ci`
- scope: context name, or `harness`, `docs`
- Language: TODO — set the team rule in `docs/design-docs/core-beliefs.md` (default: Korean body)
- If a system reminder specifies attribution lines, include them at the end of the message.

## 4. Hand over
For each planned commit, output a ready-to-run block, in order:
```bash
git add <file> <file>
git commit -m "<subject>" -m "<body>"
```
- Keep every command copy-pasteable. Quote messages safely for the user's shell.
- End with a one-line summary: how many commits, and what is left uncommitted on purpose.
- If there is an execution plan, add a line to its progress log (the human commits that too).
- **Never push**, and never suggest `--force`.
