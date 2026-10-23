import { test } from "node:test";
import assert from "node:assert/strict";
import { issueNumber, handoffFile } from "../scripts/branch.mjs";

// [브랜치, 이슈 번호]
const ISSUES = [
  ["feat/12-context-detail", 12],
  ["fix/7-null-check", 7],
  ["chore/300", 300],
  ["feat/context-detail", null],
  ["main", null],
  ["12-no-type", null],
  ["feat/12abc", null],
  ["", null],
];
for (const [branch, n] of ISSUES) {
  test(`issueNumber(${JSON.stringify(branch)}) = ${n}`, () => assert.equal(issueNumber(branch), n));
}

const FILES = [
  ["feat/12-context-detail", ".handoffs/feat-12-context-detail.md"],
  ["main", ".handoffs/main.md"],
  ["user/feat/x", ".handoffs/user-feat-x.md"],
  ["", ".handoffs/detached.md"],
  ["weird name:*", ".handoffs/weird_name__.md"],
];
for (const [branch, file] of FILES) {
  test(`handoffFile(${JSON.stringify(branch)}) = ${file}`, () => assert.equal(handoffFile(branch), file));
}
