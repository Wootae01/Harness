---
name: handoff
description: Compacts the current conversation into a handoff note saved as .handoffs/<branch>.md, so the next session on this branch picks it up automatically. Use when the user runs /workflow:handoff or asks to hand off, wrap up, or save context for the next session. (KR: 핸드오프, 인수인계, 다음 세션)
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

# /workflow:handoff — leave a note for the next session

> Based on `handoff` from mattpocock/skills (MIT, © 2026 Matt Pocock — see `LICENSE.mattpocock` in this plugin).
> Changed: the note is saved in the project per branch, and the workflow SessionStart hook loads it.

## 1. Where to save
- Get the branch: `git branch --show-current`.
- File: `.handoffs/<branch>.md` with every `/` in the branch replaced by `-`
  (e.g. `feat/12-context-detail` → `.handoffs/feat-12-context-detail.md`). No branch (detached HEAD) → `.handoffs/detached.md`.
- **Overwrite** the file if it exists — it is the latest state, not a log.
- If `.gitignore` has no `.handoffs/` line, append one (create `.gitignore` if missing), and tell the user you did.

## 2. What to write
A fresh agent must be able to continue the work from this note alone.
- **Goal**: what this branch is for, and the issue number if the branch has one.
- **Done**: what was finished and verified (with how it was verified).
- **In progress / next**: the very next step first, then the rest in order.
- **Decisions**: choices made and why, so the next session does not re-argue them.
- **Open questions / blockers**: what is waiting on the user or something else.
- **Suggested skills**: which skills the next agent should call with the Skill tool.

Rules:
- Do not duplicate what other artifacts already hold (issues, specs, plans, ADRs, commits, diffs). Reference them by path, URL or issue number.
- Redact secrets and personal data (API keys, passwords, tokens, emails).
- If the user passed arguments, treat them as what the next session will focus on and tailor the note to that.
- Write the note in the user's language.

## 3. Finish
Tell the user the file path, and that the next session on this branch loads it automatically.
