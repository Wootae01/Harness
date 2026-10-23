---
name: cleanup
description: Garbage collection. Finds drift from the golden principles and makes small cleanup changes, fixes stale docs (doc-gardening), and updates quality grades and the tech-debt tracker. Use when the user runs /harness:cleanup or asks for periodic cleanup. (KR: 정리, 청소, 기술 부채, 드리프트)
argument-hint: "[scope: context/path | docs | all]"
---

# /harness:cleanup — pay down tech debt a little every day

Principle: never clean up in one big batch. Split it into many **small changes that can each be reviewed in under a minute**.

## 1. Read the criteria
- Golden principles (G-*) in `docs/design-docs/core-beliefs.md`
- Invariants in `ARCHITECTURE.md` §3
- Open items in `docs/exec-plans/tech-debt-tracker.md`

## 2. Find drift
In the scope (argument: context/path; default: the area with the most recent changes), look for:
| Look for | Basis |
|---|---|
| A hand-rolled helper duplicating an existing shared utility | G-1 |
| External data used without validation | G-2, I-5 |
| Reverse layer imports, external dependencies in Domain, direct imports between contexts | I-4 |
| Unstructured logs, files over the size limit | I-6, I-7 |
| Two or more different patterns doing the same thing | G-4 — unify into one |
| Dead code, unused exports and dependencies | |

## 3. Doc-gardening
- Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-docs.mjs"` and fix any failures.
- If a document **differs from what the code actually does**, align the document with the code. If the code is wrong, record it as debt.
- If an English doc changed, make sure its `.kr.md` translation says the same thing.
- Move plans that sit in `exec-plans/active/` but are actually finished to `completed/`.
- Re-check documents whose "Last reviewed" date in `design-docs/index.md` is old.

## 4. Fix or record
- **Small and safe** (no behavior change): fix it now. One intent = one commit (`/harness:commit-message`, type `refactor` or `docs`).
- **Large or behavior-changing**: do not fix it — add a row to `tech-debt-tracker.md`.
- **When you find the same drift a second time**: propose promoting it to a lint or structural test, and add a row to the invariant table in `ARCHITECTURE.md`.

## 5. Update grades
- Update the grade, gap and date for the affected context and layer in `docs/QUALITY_SCORE.md`.

## 6. Report
```
Cleanup: N commits / M debt items recorded / K promotion proposals
Grade changes: <context> B → A ...
Next cleanup candidates: ...
```
