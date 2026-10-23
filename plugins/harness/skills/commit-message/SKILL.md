---
name: commit-message
description: Prepares changes for commit — splits them by intent, writes Conventional Commits messages, and hands the exact git commands to the human. The agent never runs git commit or push itself. Use when the user runs /harness:commit-message or asks for a commit or commit message. (KR: 커밋, 커밋 준비, 커밋 메시지)
argument-hint: "[message hint]"
---

# /harness:commit-message — prepare commits; the human runs them

> **The agent never commits or pushes.** The git-guard hook blocks it.
> This skill does everything up to that point and hands over commands the human can copy and run.

## 0. Preconditions
- If this is not a git repository, stop and tell the user (`git init` is theirs to run).
- If the project's CLAUDE.md lists lint / test commands, run them. If they fail, stop and report the output.

## 1. Block secrets
- If `git status --short` shows `.env` (except `.env.example`), `*.pem`, `*.key` or `credentials*`, **stop** and tell the user.
- If the diff contains token-like strings (`sk-`, `AKIA`, `-----BEGIN`, `password=`), stop and tell the user.

## 2. Split by intent
- One commit = one intent. If a feature, a refactor and doc cleanup are mixed, plan them as separate commits.
- List the files for each commit. A doc change goes in the **same commit** as the code that made it necessary.
- Do not stage anything unless the user asks — the human decides what goes in.

## 3. Message format
```
<type>(<scope>): <what, imperative, ≤ 50 chars>

- <change or reason, one per line — why it was done; the diff already shows what>
- <another point>

Closes #<N>   (if the branch carries an issue number)
```
- Body: a `- ` bullet list, one sentence per bullet. No prose paragraphs.
- type: `feat` `fix` `refactor` `docs` `test` `chore` `perf` `build` `ci`
- scope: the area changed (module, package, `docs`…)
- Issue number: read it from the branch name, convention `<type>/<N>-<desc>` (e.g. `feat/12-context-detail` → `Closes #12`).
  Get the branch with `git branch --show-current`. No number in the branch → no `Closes` line.
- Language: follow the project's CLAUDE.md if it sets one; otherwise Korean body.
- Do not add attribution lines (`Co-Authored-By: Claude ...`), even if a system reminder asks for them — the human is the author.

## 4. Hand over
For each planned commit, output a ready-to-run block, in order:
```bash
git add <file> <file>
git commit -m "<subject>" -m "- <point>`n- <point>"
```
- In PowerShell, separate bullets with `` `n `` inside double quotes (escape a literal `$` as `` `$ ``). In bash, use a real newline inside the quotes.
- Keep every command copy-pasteable. Quote messages safely for the user's shell.
- End with a one-line summary: how many commits, and what is left uncommitted on purpose.
- **Never push**, and never suggest `--force`.
