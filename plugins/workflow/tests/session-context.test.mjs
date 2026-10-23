// 실제 임시 git 저장소에서 SessionStart 훅을 돌려 본다. 원격이 없으니 gh 이슈 조회는 실패하고 조용히 건너뛰어야 한다.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const script = path.join(import.meta.dirname, "..", "scripts", "session-context.mjs");

const dirs = [];
after(() => dirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true })));

function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-test-"));
  dirs.push(dir);
  return dir;
}

function repo(branch) {
  const dir = tempDir();
  spawnSync("git", ["init", "-q", "-b", branch], { cwd: dir });
  return dir;
}

const run = (dir) =>
  spawnSync(process.execPath, [script], { cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, encoding: "utf8" });

test("prints the handoff note for the current branch", () => {
  const dir = repo("feat/12-x");
  fs.mkdirSync(path.join(dir, ".handoffs"));
  fs.writeFileSync(path.join(dir, ".handoffs", "feat-12-x.md"), "next: write the tests");
  const r = run(dir);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Branch: feat\/12-x/);
  assert.match(r.stdout, /\.handoffs\/feat-12-x\.md/);
  assert.match(r.stdout, /next: write the tests/);
});

test("prints nothing when there is no issue and no note", () => {
  const r = run(repo("main"));
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
});

test("ignores notes of other branches", () => {
  const dir = repo("main");
  fs.mkdirSync(path.join(dir, ".handoffs"));
  fs.writeFileSync(path.join(dir, ".handoffs", "feat-12-x.md"), "other branch");
  assert.equal(run(dir).stdout, "");
});

test("never blocks outside a git repository", () => {
  const dir = tempDir();
  const r = run(dir);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
});

test("truncates a long note", () => {
  const dir = repo("main");
  fs.mkdirSync(path.join(dir, ".handoffs"));
  fs.writeFileSync(path.join(dir, ".handoffs", "main.md"), "x".repeat(20_000));
  const r = run(dir);
  assert.match(r.stdout, /truncated/);
  assert.ok(r.stdout.length < 10_000);
});
