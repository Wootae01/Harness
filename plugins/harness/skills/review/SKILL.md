---
name: review
description: Pre-commit self-review. Reviews the current changes against invariants, golden principles and specs, and repeats fix → re-review until nothing is left. Use when the user runs /harness:review or before committing finished work. (KR: 리뷰, 검토, 커밋 전 점검)
argument-hint: "[file/path — omit for all changes]"
---

# /harness:review — self-review that repeats until it passes

Goal: raise the change to the point where **a human does not need to look at it**. Keep fixing and re-reviewing until the reviewer is satisfied.

## 1. Scope
- `git status --short`, `git diff` (+ `git diff --staged`). If an argument is given, look only at that path.
- If a related execution plan (`docs/exec-plans/active/`) or spec (`docs/product-specs/`) exists, read its done / acceptance criteria.

## 2. Mechanical checks — run first; if they fail, fix and run again
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/check-docs.mjs"
# + lint / typecheck / test from the project's CLAUDE.md §5 command table (if it is empty, say so in the report)
```
Never make a check pass by disabling or skipping it.

## 3. Judgment checks — what machines cannot catch yet
Compare the diff, one by one, against every invariant in `ARCHITECTURE.md` §3 whose status is **📄 docs only**. Also check:

| Angle | Question |
|---|---|
| Correctness | Does it actually meet the spec's acceptance criteria? Edge cases, empty values, error paths? |
| Boundary validation | Is external data used with a guessed shape? (G-2) |
| Layers | Do dependencies point toward Domain? Does Domain import any framework/DB/HTTP? Does Presentation use Infrastructure directly? |
| Reuse | Did it re-create a shared utility or component that already exists? (G-1) |
| Patterns | Did it copy a bad existing pattern? (G-4) |
| Docs | Are new decisions, new env keys and new dependencies reflected in the docs (and their `.kr.md` translations)? (G-5) |
| Verification | Was it actually run and checked? (not only tests — the app's behavior too) |

## 4. Repeat
- When you find a problem, **fix it and start again from step 2.** At most 3 rounds.
- If problems remaining after 3 rounds are judgment calls (product decisions, invariant changes), stop and ask the human.
- If the same finding keeps recurring → propose promoting it to a lint or test (add a row to the invariant table in `ARCHITECTURE.md`).

## 5. Report (short)
```
Review: ✅ passed / ⚠️ needs human judgment
- Mechanical checks: check-docs ✓, lint ✓, test ✓
- Fixed: ...
- Remaining / questions: ...
- Promotion proposals: ...
```
If it passes, point to `/harness:commit`.
